"""
Mobile Sync API Endpoint

This module provides the sync endpoint that accepts Realm database deltas
from mobile clients and synchronizes threads, messages, and embeddings.
"""

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.core import get_session
from app.db.models import Embedding, Message, MessageRole, Thread
from app.db.vector import PGVectorRetriever

# Create router for sync endpoints
router = APIRouter(prefix="/sync", tags=["sync"])


class ThreadDelta(BaseModel):
    """Delta model for thread synchronization."""
    id: UUID
    title: str
    operation: str  # 'insert', 'update', 'delete'


class MessageDelta(BaseModel):
    """Delta model for message synchronization."""
    id: UUID
    thread_id: UUID
    role: str
    content: str
    operation: str  # 'insert', 'update', 'delete'


class SyncRequest(BaseModel):
    """Request model for mobile sync endpoint."""
    threads: List[ThreadDelta] = []
    messages: List[MessageDelta] = []
    client_id: str
    sync_timestamp: int


class SyncResponse(BaseModel):
    """Response model for sync endpoint."""
    success: bool
    synced_threads: int
    synced_messages: int
    errors: List[str] = []


def verify_auth_token(request: Request) -> bool:
    """
    Verify the bearer token in the request headers.
    
    Args:
        request: FastAPI request object
        
    Returns:
        True if authentication is valid
        
    Raises:
        HTTPException: If authentication fails
    """
    from app.settings import settings
    
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    
    token = auth_header.replace("Bearer ", "")
    
    # In debug mode, accept the dev token
    if settings.debug and token == settings.dev_token:
        return True
    
    # TODO: Implement proper token validation
    raise HTTPException(status_code=401, detail="Invalid authentication token")


async def sync_threads(
    session: AsyncSession, 
    thread_deltas: List[ThreadDelta]
) -> tuple[int, List[str]]:
    """
    Synchronize thread deltas with the database.
    
    Args:
        session: Database session
        thread_deltas: List of thread delta operations
        
    Returns:
        Tuple of (synced_count, errors)
    """
    synced_count = 0
    errors = []
    
    for delta in thread_deltas:
        try:
            if delta.operation == "insert" or delta.operation == "update":
                # Check if thread exists
                query = select(Thread).where(Thread.id == delta.id)
                result = await session.execute(query)
                existing_thread = result.scalar_one_or_none()
                
                if existing_thread:
                    # Update existing thread
                    existing_thread.title = delta.title
                else:
                    # Insert new thread
                    new_thread = Thread(
                        id=delta.id,
                        title=delta.title
                    )
                    session.add(new_thread)
                
                synced_count += 1
                
            elif delta.operation == "delete":
                # Delete thread and related messages
                query = select(Thread).where(Thread.id == delta.id)
                result = await session.execute(query)
                thread_to_delete = result.scalar_one_or_none()
                
                if thread_to_delete:
                    await session.delete(thread_to_delete)
                    synced_count += 1
                    
        except Exception as e:
            errors.append(f"Thread {delta.id}: {str(e)}")
    
    await session.commit()
    return synced_count, errors


async def sync_messages(
    session: AsyncSession, 
    message_deltas: List[MessageDelta]
) -> tuple[int, List[str]]:
    """
    Synchronize message deltas with the database and generate embeddings.
    
    Args:
        session: Database session
        message_deltas: List of message delta operations
        
    Returns:
        Tuple of (synced_count, errors)
    """
    synced_count = 0
    errors = []
    vector_retriever = PGVectorRetriever(session)
    
    for delta in message_deltas:
        try:
            if delta.operation == "insert" or delta.operation == "update":
                # Validate role
                try:
                    role = MessageRole(delta.role)
                except ValueError:
                    errors.append(f"Message {delta.id}: Invalid role '{delta.role}'")
                    continue
                
                # Check if message exists
                query = select(Message).where(Message.id == delta.id)
                result = await session.execute(query)
                existing_message = result.scalar_one_or_none()
                
                if existing_message:
                    # Update existing message
                    existing_message.role = role
                    existing_message.content = delta.content
                    message = existing_message
                else:
                    # Insert new message
                    message = Message(
                        id=delta.id,
                        thread_id=delta.thread_id,
                        role=role,
                        content=delta.content
                    )
                    session.add(message)
                
                await session.commit()
                await session.refresh(message)
                
                # Generate and store embedding
                embedding_vector = await vector_retriever.embeddings.aembed_query(
                    delta.content
                )
                
                # Check if embedding exists
                embedding_query = select(Embedding).where(
                    Embedding.message_id == message.id
                )
                embedding_result = await session.execute(embedding_query)
                existing_embedding = embedding_result.scalar_one_or_none()
                
                if existing_embedding:
                    existing_embedding.vector = embedding_vector
                else:
                    embedding = Embedding(
                        message_id=message.id,
                        vector=embedding_vector
                    )
                    session.add(embedding)
                
                synced_count += 1
                
            elif delta.operation == "delete":
                # Delete message and its embedding
                query = select(Message).where(Message.id == delta.id)
                result = await session.execute(query)
                message_to_delete = result.scalar_one_or_none()
                
                if message_to_delete:
                    await session.delete(message_to_delete)
                    synced_count += 1
                    
        except Exception as e:
            errors.append(f"Message {delta.id}: {str(e)}")
    
    await session.commit()
    return synced_count, errors


@router.post("/")
async def sync_endpoint(
    sync_request: SyncRequest,
    request: Request,
    session: AsyncSession = Depends(get_session)
) -> SyncResponse:
    """
    Mobile sync endpoint that accepts Realm deltas and upserts data.
    
    This endpoint processes delta operations from mobile Realm databases
    and synchronizes threads, messages, and embeddings with the backend.
    
    Args:
        sync_request: Sync request containing deltas for threads and messages
        request: FastAPI request for authentication
        session: Database session dependency
        
    Returns:
        SyncResponse with success status and operation counts
    """
    # Verify authentication
    verify_auth_token(request)
    
    try:
        all_errors = []
        
        # Sync threads first (messages depend on threads)
        synced_threads, thread_errors = await sync_threads(
            session, sync_request.threads
        )
        all_errors.extend(thread_errors)
        
        # Sync messages and generate embeddings
        synced_messages, message_errors = await sync_messages(
            session, sync_request.messages
        )
        all_errors.extend(message_errors)
        
        success = len(all_errors) == 0
        
        return SyncResponse(
            success=success,
            synced_threads=synced_threads,
            synced_messages=synced_messages,
            errors=all_errors
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Sync operation failed: {str(e)}"
        )
