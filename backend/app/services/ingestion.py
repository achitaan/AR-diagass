"""
Data ingestion service for PainAR medical knowledge base.
Processes various document formats into vector embeddings.
"""

import asyncio
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

import aiofiles
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    CSVLoader,
    JSONLoader
)
from langchain_openai import OpenAIEmbeddings
from sqlmodel import select

from app.db.core import AsyncSessionLocal
from app.db.models import Message, Embedding, Thread
from app.settings import settings


class DocumentIngestionService:
    """Service for ingesting medical documents into the RAG knowledge base."""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.openai_api_key
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    async def ingest_document(
        self, 
        file_path: Path, 
        source_type: str = "knowledge_base",
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Ingest a single document into the knowledge base.
        
        Args:
            file_path: Path to the document file
            source_type: Type of source (knowledge_base, clinical_guideline, etc.)
            metadata: Additional metadata for the document
            
        Returns:
            List of message IDs that were created
        """
        # Load document based on file type
        loader = self._get_loader(file_path)
        documents = loader.load()
        
        # Split into chunks
        chunks = self.text_splitter.split_documents(documents)
        
        # Create a thread for this document
        thread_id = str(uuid.uuid4())
        thread_title = f"{source_type}: {file_path.stem}"
        
        async with AsyncSessionLocal() as session:
            # Create thread
            thread = Thread(
                id=thread_id,
                title=thread_title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(thread)
            
            message_ids = []
            
            # Process each chunk
            for i, chunk in enumerate(chunks):
                # Create message for the chunk
                message_id = str(uuid.uuid4())
                message = Message(
                    id=message_id,
                    thread_id=thread_id,
                    role="system",  # Knowledge base content is system role
                    content=chunk.page_content,
                    created_at=datetime.utcnow()
                )
                session.add(message)
                message_ids.append(message_id)
                
                # Generate embedding
                embedding_vector = await self._generate_embedding(chunk.page_content)
                
                # Store embedding
                embedding_id = str(uuid.uuid4())
                embedding = Embedding(
                    id=embedding_id,
                    message_id=message_id,
                    vector=embedding_vector,
                    created_at=datetime.utcnow()
                )
                session.add(embedding)
            
            await session.commit()
            return message_ids
    
    async def ingest_directory(
        self, 
        directory_path: Path,
        source_type: str = "knowledge_base"
    ) -> Dict[str, List[str]]:
        """
        Ingest all supported documents in a directory.
        
        Args:
            directory_path: Path to directory containing documents
            source_type: Type of source for all documents
            
        Returns:
            Dictionary mapping file names to message IDs
        """
        results = {}
        supported_extensions = {'.pdf', '.txt', '.csv', '.json', '.md'}
        
        for file_path in directory_path.rglob('*'):
            if file_path.suffix.lower() in supported_extensions:
                try:
                    message_ids = await self.ingest_document(file_path, source_type)
                    results[file_path.name] = message_ids
                    print(f"✅ Ingested: {file_path.name} ({len(message_ids)} chunks)")
                except Exception as e:
                    print(f"❌ Failed to ingest {file_path.name}: {e}")
                    
        return results
    
    async def ingest_medical_guidelines(self, guidelines_data: List[Dict]) -> List[str]:
        """
        Ingest structured medical guidelines data.
        
        Args:
            guidelines_data: List of guideline dictionaries with title, content, category
            
        Returns:
            List of message IDs created
        """
        thread_id = str(uuid.uuid4())
        
        async with AsyncSessionLocal() as session:
            # Create thread for guidelines
            thread = Thread(
                id=thread_id,
                title="Medical Guidelines Knowledge Base",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(thread)
            
            message_ids = []
            
            for guideline in guidelines_data:
                # Create structured content
                content = f"""
Title: {guideline.get('title', 'Unknown')}
Category: {guideline.get('category', 'General')}
Content: {guideline.get('content', '')}
Last Updated: {guideline.get('last_updated', 'Unknown')}
"""
                
                # Split into chunks if content is large
                chunks = self.text_splitter.split_text(content)
                
                for chunk in chunks:
                    message_id = str(uuid.uuid4())
                    message = Message(
                        id=message_id,
                        thread_id=thread_id,
                        role="system",
                        content=chunk,
                        created_at=datetime.utcnow()
                    )
                    session.add(message)
                    message_ids.append(message_id)
                    
                    # Generate and store embedding
                    embedding_vector = await self._generate_embedding(chunk)
                    embedding_id = str(uuid.uuid4())
                    embedding = Embedding(
                        id=embedding_id,
                        message_id=message_id,
                        vector=embedding_vector,
                        created_at=datetime.utcnow()
                    )
                    session.add(embedding)
            
            await session.commit()
            return message_ids
    
    def _get_loader(self, file_path: Path):
        """Get appropriate document loader based on file extension."""
        extension = file_path.suffix.lower()
        
        if extension == '.pdf':
            return PyPDFLoader(str(file_path))
        elif extension in ['.txt', '.md']:
            return TextLoader(str(file_path), encoding='utf-8')
        elif extension == '.csv':
            return CSVLoader(str(file_path))
        elif extension == '.json':
            return JSONLoader(str(file_path))
        else:
            raise ValueError(f"Unsupported file type: {extension}")
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI embeddings."""
        # Run embedding generation in executor to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            lambda: self.embeddings.embed_query(text)
        )
    
    async def get_knowledge_stats(self) -> Dict[str, int]:
        """Get statistics about the ingested knowledge base."""
        async with AsyncSessionLocal() as session:
            # Count system messages (knowledge base entries)
            system_messages_result = await session.exec(
                select(Message).where(Message.role == "system")
            )
            system_messages = system_messages_result.all()
            
            # Count embeddings
            embeddings_result = await session.exec(select(Embedding))
            embeddings = embeddings_result.all()
            
            # Count knowledge threads
            threads_result = await session.exec(
                select(Thread).where(
                    Thread.title.contains("knowledge_base") | 
                    Thread.title.contains("Medical Guidelines")
                )
            )
            threads = threads_result.all()
            
            return {
                "knowledge_chunks": len(system_messages),
                "embeddings": len(embeddings),
                "knowledge_threads": len(threads),
                "ready_for_rag": len(embeddings) > 0
            }
