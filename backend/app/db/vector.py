"""
Vector Database Integration

This module provides LangChain integration with PGVector for semantic search
and retrieval operations using PostgreSQL with pgvector extension.
"""

from typing import Any, Dict, List
from uuid import UUID

from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.core import engine
from app.settings import settings


class PGVectorRetriever:
    """
    Wrapper class for PGVector integration with LangChain.
    
    Provides semantic search capabilities over stored message embeddings
    using cosine similarity and hierarchical navigable small world indexing.
    """
    
    def __init__(self, session: AsyncSession) -> None:
        """
        Initialize the PGVector retriever.
        
        Args:
            session: Database session for vector operations
        """
        self.session = session
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.openai_api_key
        )
        
        # Configure PGVector with cosine distance
        self.vector_store = PGVector(
            embeddings=self.embeddings,
            collection_name="message_embeddings",
            connection=engine,
            distance_strategy="cosine",
            pre_delete_collection=False,
        )
    
    async def add_text(
        self, 
        text: str, 
        metadata: Dict[str, Any],
        message_id: UUID
    ) -> None:
        """
        Add a text document with its embedding to the vector store.
        
        Args:
            text: The text content to embed and store
            metadata: Additional metadata to associate with the document
            message_id: Unique identifier for the message
        """
        # Add message_id to metadata for tracking
        metadata["message_id"] = str(message_id)
        
        await self.vector_store.aadd_texts(
            texts=[text],
            metadatas=[metadata],
            ids=[str(message_id)]
        )
    
    async def similarity_search(
        self, 
        query: str, 
        k: int = 8,
        thread_id: UUID = None
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search to find the most relevant documents.
        
        Args:
            query: The search query text
            k: Number of nearest neighbors to return (default eight)
            thread_id: Optional thread ID to filter results
            
        Returns:
            List of documents with similarity scores and metadata
        """
        # Build filter for thread-specific search if provided
        filter_dict = {}
        if thread_id:
            filter_dict["thread_id"] = str(thread_id)
        
        results = await self.vector_store.asimilarity_search_with_score(
            query=query,
            k=k,
            filter=filter_dict if filter_dict else None
        )
        
        # Format results for consumption
        formatted_results = []
        for doc, score in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "similarity_score": score
            })
        
        return formatted_results
    
    def as_retriever(self, **kwargs: Any) -> Any:
        """
        Return the vector store as a LangChain retriever.
        
        Args:
            **kwargs: Additional arguments for retriever configuration
            
        Returns:
            LangChain retriever instance for use in chains
        """
        return self.vector_store.as_retriever(
            search_kwargs={"k": kwargs.get("k", 8)},
            **kwargs
        )


async def create_vector_index() -> None:
    """
    Create the hierarchical navigable small world index on the vector column.
    
    This function creates an HNSW index optimized for cosine similarity search
    on the embeddings table vector column for improved query performance.
    """
    from app.db.core import get_asyncpg_connection
    
    try:
        async for connection in get_asyncpg_connection():
            try:
                # Create HNSW index for cosine similarity on embeddings vector column
                await connection.execute("""
                    CREATE INDEX IF NOT EXISTS embeddings_vector_cosine_idx 
                    ON embeddings 
                    USING hnsw (vector vector_cosine_ops)
                    WITH (m = 16, ef_construction = 64);
                """)
                print("Successfully created vector index")
            except Exception as e:
                if "extension \"vector\" is not available" in str(e) or "does not exist" in str(e):
                    print("⚠️ Skipping vector index creation - pgvector not available")
                    return
                else:
                    raise
    except Exception as e:
        print(f"⚠️ Vector index creation skipped: {e}")
        # Don't fail startup if vector index can't be created
