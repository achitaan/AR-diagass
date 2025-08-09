"""
Chat API Endpoint with Server-Sent Events

This module provides the chat endpoint that processes user messages
and streams assistant responses using server-sent events for real-time interaction.
Includes comprehensive injury assessment capabilities.
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
from app.prompts import assessment_manager, injury_assessment

# Create router for chat endpoints
router = APIRouter(prefix="/chat", tags=["chat"])


class PainArea(BaseModel):
    """Model for pain area data."""
    body_part: str
    pain_level: int  # 0-10 scale
    x: float
    y: float


class DrawingData(BaseModel):
    """Model for drawing path data."""
    path_points: list[dict]  # List of x,y coordinates
    pain_level: int
    body_parts_affected: list[str]


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    thread_id: Optional[UUID] = None
    message: str
    svg_path: Optional[str] = None
    pain_areas: Optional[list[PainArea]] = None
    drawing_data: Optional[list[DrawingData]] = None


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
            
            # Create a comprehensive medical AI system prompt with structured assessment
            from langchain.schema import SystemMessage, HumanMessage
            
            # Get the comprehensive system prompt from our assessment system
            assessment_system_prompt = injury_assessment.system_prompt
            
            # Check if this is a new conversation that should start an assessment
            session_id = str(thread_uuid)
            is_new_assessment = session_id not in assessment_manager.active_assessments
            
            if is_new_assessment:
                # Start a new assessment
                assessment_manager.start_assessment(
                    user_id="current_user",  # In a real app, get from authentication
                    session_id=session_id,
                    initial_complaint=chat_request.message
                )
                
                # Get the first assessment question
                next_question = assessment_manager.get_next_question(session_id)
                if next_question:
                    assessment_system_prompt += f"\n\nFIRST ASSESSMENT QUESTION TO ASK: {next_question}"
            else:
                # Continue existing assessment
                # Try to identify which question was just answered
                current_assessment = assessment_manager.active_assessments.get(session_id)
                if current_assessment and current_assessment.responses:
                    # Process the latest response (this is a simplified approach)
                    # In a real implementation, you'd track which question was asked
                    last_question_id = "general_response"  # Placeholder
                    result = assessment_manager.process_response(
                        session_id, last_question_id, chat_request.message
                    )
                    
                    if result.get("follow_up"):
                        assessment_system_prompt += f"\n\nFOLLOW-UP QUESTION: {result['follow_up']}"
                    elif result.get("next_question"):
                        assessment_system_prompt += f"\n\nNEXT ASSESSMENT QUESTION: {result['next_question']}"
                    
                    # Add assessment progress
                    completion = result.get("completion_percentage", 0)
                    assessment_system_prompt += f"\n\nASSESSMENT PROGRESS: {completion:.1f}% complete"
            
            messages = [SystemMessage(content=assessment_system_prompt)]
            messages.append(HumanMessage(content=chat_request.message))
            
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


@router.post("/json")
async def chat_with_json_response(
    chat_request: ChatRequest,
    session: AsyncSession = Depends(get_session)
) -> SimpleChatResponse:
    """
    Chat endpoint that accepts full ChatRequest (with pain data) but returns JSON instead of streaming.
    
    This is perfect for mobile apps that need to send pain area data but want a simple JSON response.
    
    Args:
        chat_request: Full chat request with message, pain areas, and drawing data
        session: Database session dependency
        
    Returns:
        JSON response with the LLM's answer
    """
    try:
        # Generate thread_id if not provided
        thread_uuid = chat_request.thread_id or uuid4()
        
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
        
        # Get LLM response with pain data context
        try:
            # Fallback to direct OpenAI call with pain context
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                model_name=settings.model_name,
                openai_api_key=settings.openai_api_key,
                temperature=0.7,
                max_tokens=512
            )
            
            # Create a comprehensive medical AI system prompt
            from langchain.schema import SystemMessage, HumanMessage
            
            # Get the comprehensive system prompt from our assessment system
            assessment_system_prompt = injury_assessment.system_prompt
            
            # Check if this is a new conversation that should start an assessment
            session_id = str(thread_uuid)
            is_new_assessment = session_id not in assessment_manager.active_assessments
            
            if is_new_assessment:
                # Start a new assessment
                assessment_manager.start_assessment(
                    user_id="current_user",  # In a real app, get from authentication
                    session_id=session_id,
                    initial_complaint=chat_request.message
                )
                
                # Get the first assessment question
                next_question = assessment_manager.get_next_question(session_id)
                if next_question:
                    assessment_system_prompt += f"\n\nFIRST ASSESSMENT QUESTION TO ASK: {next_question}"
            else:
                # Continue existing assessment
                current_assessment = assessment_manager.active_assessments.get(session_id)
                if current_assessment and current_assessment.responses:
                    last_question_id = "general_response"  # Placeholder
                    result = assessment_manager.process_response(
                        session_id, last_question_id, chat_request.message
                    )
                    
                    if result.get("follow_up"):
                        assessment_system_prompt += f"\n\nFOLLOW-UP QUESTION: {result['follow_up']}"
                    elif result.get("next_question"):
                        assessment_system_prompt += f"\n\nNEXT ASSESSMENT QUESTION: {result['next_question']}"
                    
                    # Add assessment progress
                    completion = result.get("completion_percentage", 0)
                    assessment_system_prompt += f"\n\nASSESSMENT PROGRESS: {completion:.1f}% complete"
            
            messages = [SystemMessage(content=assessment_system_prompt)]
            
            # Add pain area context if available
            pain_context = ""
            if chat_request.pain_areas and len(chat_request.pain_areas) > 0:
                pain_context += "\n\nCurrent Pain Assessment Data:\n"
                for pain_area in chat_request.pain_areas:
                    pain_context += f"- {pain_area.body_part}: Pain level {pain_area.pain_level}/10\n"
                pain_context += "\nPlease reference these specific areas in your response and ask relevant follow-up questions about these marked regions."
            
            if chat_request.drawing_data and len(chat_request.drawing_data) > 0:
                pain_context += "\n\nUser has drawn pain areas on the body diagram with the following information:\n"
                for drawing in chat_request.drawing_data:
                    affected_parts = ", ".join(drawing.body_parts_affected)
                    pain_context += f"- Drawn area affecting: {affected_parts} (Pain level: {drawing.pain_level}/10)\n"
                pain_context += "\nUse this visual pain mapping to ask more targeted questions about the specific anatomical regions marked."
            
            # Create the human message with context
            human_message_content = chat_request.message
            if pain_context:
                human_message_content = f"{chat_request.message}\n{pain_context}"
            
            messages.append(HumanMessage(content=human_message_content))
            
            response = await llm.ainvoke(messages)
            llm_response = response.content
            
        except Exception as e:
            print(f"⚠️ LLM call failed: {e}")
            llm_response = "I'm sorry, I'm having trouble processing your request right now. Please try again."
        
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


@router.get("/assessment/{session_id}")
async def get_assessment_summary(
    session_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get comprehensive assessment summary for a session.
    
    Args:
        session_id: Assessment session identifier
        session: Database session dependency
        
    Returns:
        Comprehensive assessment summary with key findings and recommendations
    """
    try:
        summary = assessment_manager.get_assessment_summary(session_id)
        
        if not summary:
            raise HTTPException(
                status_code=404, 
                detail="Assessment session not found"
            )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve assessment summary: {str(e)}"
        )


@router.post("/assessment/{session_id}/export")
async def export_assessment(
    session_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Export assessment data in a format suitable for medical review.
    
    Args:
        session_id: Assessment session identifier
        session: Database session dependency
        
    Returns:
        Formatted assessment report for healthcare providers
    """
    try:
        summary = assessment_manager.get_assessment_summary(session_id)
        
        if not summary:
            raise HTTPException(
                status_code=404, 
                detail="Assessment session not found"
            )
        
        # Format for medical review
        medical_report = {
            "patient_id": "REDACTED",  # Would be filled with actual patient ID
            "assessment_date": summary["session_info"]["start_time"],
            "assessment_duration": f"{summary['session_info']['duration_minutes']:.1f} minutes",
            "completion_status": f"{summary['session_info']['completion_percentage']:.1f}% complete",
            "priority_level": "High" if summary["session_info"]["priority_score"] > 15 else "Medium" if summary["session_info"]["priority_score"] > 5 else "Low",
            "chief_complaint": summary["clinical_data"]["pain_assessment"],
            "red_flags": summary["red_flags"],
            "key_findings": summary["key_findings"],
            "recommendations": summary["recommendations"],
            "structured_data": summary["clinical_data"],
            "assessment_tool": "PainAR v1.0",
            "disclaimer": "This assessment was conducted using an AI-assisted tool and does not replace professional medical evaluation."
        }
        
        return medical_report
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to export assessment: {str(e)}"
        )
