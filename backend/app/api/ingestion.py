"""
API endpoints for data ingestion into the RAG knowledge base.
"""

import uuid
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel

from app.services.ingestion import DocumentIngestionService
from app.api.auth import verify_token


router = APIRouter(prefix="/ingestion", tags=["Data Ingestion"])


class IngestionResponse(BaseModel):
    """Response model for ingestion operations."""
    success: bool
    message: str
    message_ids: List[str]
    chunks_created: int


class GuidelineData(BaseModel):
    """Model for medical guideline data."""
    title: str
    content: str
    category: str
    last_updated: Optional[str] = None


class BulkGuidelinesRequest(BaseModel):
    """Request model for bulk guideline ingestion."""
    guidelines: List[GuidelineData]


@router.post("/upload-document", response_model=IngestionResponse)
async def upload_document(
    file: UploadFile = File(...),
    source_type: str = "knowledge_base",
    _: str = Depends(verify_token)
) -> IngestionResponse:
    """
    Upload and ingest a single document file.
    
    Supports PDF, TXT, CSV, JSON, and Markdown files.
    """
    # Validate file type
    allowed_extensions = {'.pdf', '.txt', '.csv', '.json', '.md'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        temp_path = Path(temp_file.name)
        
        try:
            # Write uploaded file to temp location
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            # Ingest the document
            ingestion_service = DocumentIngestionService()
            message_ids = await ingestion_service.ingest_document(
                temp_path, 
                source_type
            )
            
            return IngestionResponse(
                success=True,
                message=f"Successfully ingested {file.filename}",
                message_ids=message_ids,
                chunks_created=len(message_ids)
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to ingest document: {str(e)}"
            )
        finally:
            # Clean up temp file
            if temp_path.exists():
                temp_path.unlink()


@router.post("/bulk-guidelines", response_model=IngestionResponse)
async def ingest_bulk_guidelines(
    request: BulkGuidelinesRequest,
    _: str = Depends(verify_token)
) -> IngestionResponse:
    """
    Ingest multiple medical guidelines from structured data.
    """
    try:
        ingestion_service = DocumentIngestionService()
        message_ids = await ingestion_service.ingest_medical_guidelines(
            [guideline.dict() for guideline in request.guidelines]
        )
        
        return IngestionResponse(
            success=True,
            message=f"Successfully ingested {len(request.guidelines)} guidelines",
            message_ids=message_ids,
            chunks_created=len(message_ids)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest guidelines: {str(e)}"
        )


@router.get("/status")
async def get_ingestion_status(_: str = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get status of the knowledge base ingestion.
    """
    try:
        ingestion_service = DocumentIngestionService()
        stats = await ingestion_service.get_knowledge_stats()
        
        return {
            "status": "ready" if stats["ready_for_rag"] else "empty",
            "knowledge_chunks": stats["knowledge_chunks"],
            "embeddings": stats["embeddings"],
            "knowledge_threads": stats["knowledge_threads"],
            "ready_for_rag": stats["ready_for_rag"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get ingestion status: {str(e)}"
        )


@router.delete("/clear-knowledge")
async def clear_knowledge_base(_: str = Depends(verify_token)) -> Dict[str, str]:
    """
    Clear all knowledge base data (system messages and embeddings).
    Use with caution - this will remove all ingested data.
    """
    try:
        from app.db.core import AsyncSessionLocal
        from app.db.models import Message, Embedding, Thread
        from sqlmodel import select
        
        async with AsyncSessionLocal() as session:
            # Delete all system messages (knowledge base)
            system_messages_result = await session.exec(
                select(Message).where(Message.role == "system")
            )
            system_messages = system_messages_result.all()
            
            for message in system_messages:
                await session.delete(message)
            
            # Delete orphaned embeddings
            embeddings_result = await session.exec(select(Embedding))
            embeddings = embeddings_result.all()
            
            for embedding in embeddings:
                await session.delete(embedding)
            
            # Delete knowledge base threads
            threads_result = await session.exec(
                select(Thread).where(
                    Thread.title.contains("knowledge_base") | 
                    Thread.title.contains("Medical Guidelines")
                )
            )
            threads = threads_result.all()
            
            for thread in threads:
                await session.delete(thread)
            
            await session.commit()
            
            return {
                "message": f"Cleared {len(system_messages)} knowledge chunks, {len(embeddings)} embeddings, and {len(threads)} threads"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear knowledge base: {str(e)}"
        )
