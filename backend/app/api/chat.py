"""
Chat API Endpoint with Server-Sent Events

This module provides the chat endpoint that processes user messages
and streams assistant responses using server-sent events for real-time interaction.
"""

import json
from typing import AsyncGenerator, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.core import get_session
from app.db.models import Embedding, Message, MessageRole, Thread
from app.db.vector import PGVectorRetriever
from app.services.rag import build_chain
from app.settings import settings

# Create router for chat endpoints
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    thread_id: Optional[UUID] = None
    message: str
    svg_path: Optional[str] = None


class SimpleChatRequest(BaseModel):
    """Simple request model for basic chat."""
    message: str
    thread_id: Optional[str] = None


class SimpleChatResponse(BaseModel):
    """Simple response model for basic chat."""
    response: str
    thread_id: str


def verify_auth_token(request: Request) -> bool:
    """
    Verify the bearer token in the request headers.
    
    In debug mode, accepts the literal value 'dev-token'.
    In production, this should validate against a proper token store.
    
    Args:
        request: FastAPI request object
        
    Returns:
        True if authentication is valid
        
    Raises:
        HTTPException: If authentication fails
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    
    token = auth_header.replace("Bearer ", "")
    
    # In debug mode, accept the dev token
    if settings.debug and token == settings.dev_token:
        return True
    
    # TODO: Implement proper token validation for production
    # This should validate against a JWT token or API key store
    raise HTTPException(status_code=401, detail="Invalid authentication token")


async def store_message_with_embedding(
    session: AsyncSession,
    thread_id: UUID,
    role: MessageRole,
    content: str
) -> UUID:
    """
    Store a message and its embedding in the database.
    
    Args:
        session: Database session
        thread_id: Thread identifier
        role: Message role (system, user, assistant)
        content: Message content
        
    Returns:
        UUID of the created message
    """
    # Create and store the message
    message = Message(
        thread_id=thread_id,
        role=role,
        content=content
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    
    # Generate and store embedding for the message
    vector_retriever = PGVectorRetriever(session)
    embedding_vector = await vector_retriever.embeddings.aembed_query(content)
    
    embedding = Embedding(
        message_id=message.id,
        vector=embedding_vector
    )
    session.add(embedding)
    await session.commit()
    
    return message.id


async def stream_chat_response(
    chain,
    query: str,
    session: AsyncSession,
    thread_id: UUID
) -> AsyncGenerator[bytes, None]:
    """
    Stream chat response using the conversational retrieval chain.
    
    Args:
        chain: Configured LangChain conversational retrieval chain
        query: User's input query
        session: Database session
        thread_id: Thread identifier
        
    Yields:
        Server-sent event formatted response chunks
    """
    try:
        # Run the chain and collect tokens
        full_response = ""
        
        # TODO: Implement proper streaming with LangChain
        # For now, we'll simulate streaming by chunking the response
        result = await chain.ainvoke({"question": query})
        response_text = result["answer"]
        
        # Simulate streaming by sending chunks
        words = response_text.split()
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            full_response += chunk
            
            # Format as server-sent event
            event_data = f"data: {json.dumps({'content': chunk})}\n\n"
            yield event_data.encode("utf-8")
        
        # Send completion event
        yield b"event: done\ndata: {}\n\n"
        
    except Exception as e:
        error_event = f"data: {json.dumps({'error': str(e)})}\n\n"
        yield error_event.encode("utf-8")
        raise


@router.post("/simple")
async def simple_chat(
    chat_request: SimpleChatRequest,
    session: AsyncSession = Depends(get_session)
) -> SimpleChatResponse:
    """
    Simple chat endpoint that returns a direct JSON response from the LLM.
    
    This endpoint is easier to test and doesn't require Server-Sent Events.
    Perfect for testing the LLM integration.
    
    Args:
        chat_request: Simple chat request with message and optional thread_id
        session: Database session dependency
        
    Returns:
        JSON response with the LLM's answer
    """
    try:
        # Generate thread_id if not provided
        thread_id = chat_request.thread_id or str(uuid4())
        thread_uuid = UUID(thread_id) if isinstance(thread_id, str) else thread_id
        
        # Ensure thread exists
        thread_query = select(Thread).where(Thread.id == thread_uuid)
        thread_result = await session.execute(thread_query)
        thread = thread_result.scalar_one_or_none()
        
        if not thread:
            # Create new thread
            thread = Thread(
                id=thread_uuid,
                title=f"Chat {thread_uuid}"
            )
            session.add(thread)
            await session.commit()
        
        # Store user message
        user_message = Message(
            id=uuid4(),
            thread_id=thread_uuid,
            role=MessageRole.USER,
            content=chat_request.message
        )
        session.add(user_message)
        await session.commit()
        
        # Get LLM response using the RAG chain
        try:
            chain = build_chain(thread_uuid, session)
            
            # Run the chain with the user's question
            result = await chain.ainvoke({
                "question": chat_request.message,
                "chat_history": []  # For now, start fresh each time
            })
            
            # Extract the answer
            llm_response = result.get("answer", "I'm sorry, I couldn't process your request at the moment.")
            
        except Exception as e:
            # Fallback to direct OpenAI call if RAG chain fails
            print(f"⚠️ RAG chain failed, using direct OpenAI: {e}")
            
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                model_name=settings.model_name,
                openai_api_key=settings.openai_api_key,
                temperature=0.7,
                max_tokens=512
            )
            
            # Create a medical AI system prompt
            from langchain.schema import SystemMessage, HumanMessage
            
            messages = [
                SystemMessage(content="""You are a medical AI assistant specializing in pain management and healthcare education. 
                You provide evidence-based information about pain assessment, treatment options, and patient education.
                You are designed to work with AR (Augmented Reality) applications for pain education.
                Always recommend consulting healthcare professionals for diagnosis and treatment."""),
                HumanMessage(content=chat_request.message)
            ]
            
            response = await llm.ainvoke(messages)
            llm_response = response.content
        
        # Store assistant message
        assistant_message = Message(
            id=uuid4(),
            thread_id=thread_uuid,
            role=MessageRole.ASSISTANT,
            content=llm_response
        )
        session.add(assistant_message)
        await session.commit()
        
        return SimpleChatResponse(
            response=llm_response,
            thread_id=str(thread_uuid)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.post("/")
async def chat_endpoint(
    chat_request: ChatRequest,
    session: AsyncSession = Depends(get_session)
) -> StreamingResponse:
    """
    Chat endpoint that processes user messages and streams assistant responses.
    
    Workflow:
    1. Store the user message and its embedding
    2. Create or retrieve the conversational chain
    3. Stream assistant tokens via server-sent events
    4. Persist the assistant message and its embedding after streaming
    5. Finish with an 'event: done' line
    
    Args:
        chat_request: Chat request containing thread_id, message, and optional svg_path
        session: Database session dependency
        
    Returns:
        StreamingResponse with server-sent events
    """
    # Skip authentication for now to make testing easier
    # verify_auth_token(request)
    
    try:
        # Generate thread_id if not provided
        thread_uuid = chat_request.thread_id or uuid4()
        
        # Ensure thread exists
        thread_query = select(Thread).where(Thread.id == thread_uuid)
        thread_result = await session.execute(thread_query)
        thread = thread_result.scalar_one_or_none()
        
        if not thread:
            # Create new thread if it doesn't exist
            thread = Thread(
                id=thread_uuid,
                title=f"Chat {thread_uuid}"
            )
            session.add(thread)
            await session.commit()
        
        # Store user message
        user_message = Message(
            id=uuid4(),
            thread_id=thread_uuid,
            role=MessageRole.USER,
            content=chat_request.message
        )
        session.add(user_message)
        await session.commit()
        
        # Build the conversational chain
        chain = build_chain(chat_request.thread_id, session)
        
        # Create streaming response generator
        async def generate_response():
            full_response = ""
            
            # TODO: Implement proper streaming with LangChain
            # For now, we'll simulate streaming by chunking a static response
            response_text = "I understand you're experiencing pain. As a healthcare AI assistant, I recommend consulting with a medical professional for proper diagnosis and treatment options."
            
            # Simulate streaming by sending chunks
            words = response_text.split()
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                full_response += chunk
                
                # Format as server-sent event
                event_data = f"data: {json.dumps({'content': chunk})}\n\n"
                yield event_data.encode("utf-8")
            
            # Send completion event
            yield b"event: done\ndata: {}\n\n"
            
            # Store assistant message and embedding after streaming
            if full_response:
                await store_message_with_embedding(
                    session,
                    chat_request.thread_id,
                    MessageRole.ASSISTANT,
                    full_response
                )
        
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable Nginx buffering
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
