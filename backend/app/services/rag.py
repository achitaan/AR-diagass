"""
Retrieval Augmented Generation Service

This module provides the ConversationalRetrievalChain factory for building
LangChain chains that combine conversation memory with vector-based retrieval.
"""

from typing import Any
from uuid import UUID

from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import PostgresChatMessageHistory
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.vector import PGVectorRetriever
from app.settings import settings


def build_chain(thread_id: UUID, session: AsyncSession) -> ConversationalRetrievalChain:
    """
    Factory function to build a ConversationalRetrievalChain for a specific thread.
    
    This chain combines:
    - OpenAI embeddings with text-embedding-three-small model
    - PGVector retriever with cosine distance returning eight nearest chunks (if available)
    - Conversation buffer memory backed by Postgres chat history
    - ChatOpenAI LLM with GPT four-oh mini and streaming enabled
    
    Args:
        thread_id: Unique identifier for the conversation thread
        session: Database session for retrieval operations
        
    Returns:
        Configured ConversationalRetrievalChain ready for use
    """
    
    # Try to initialize the vector retriever for semantic search
    try:
        vector_retriever = PGVectorRetriever(session)
        retriever = vector_retriever.as_retriever(k=8)
    except Exception as e:
        # Fallback: Create a simple retriever that returns empty results
        print(f"⚠️ Vector retriever unavailable (pgvector not installed): {e}")
        print("🔄 Using fallback mode - LLM will work without document retrieval")
        
        from langchain.schema import BaseRetriever, Document
        
        class FallbackRetriever(BaseRetriever):
            def _get_relevant_documents(self, query: str) -> list[Document]:
                return []
            
            async def _aget_relevant_documents(self, query: str) -> list[Document]:
                return []
        
        retriever = FallbackRetriever()
    
    # Configure conversation memory with Postgres chat history
    # Convert connection string to the format expected by PostgresChatMessageHistory
    connection_string = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    connection_string = connection_string.replace("postgresql+psycopg://", "postgresql://")
    
    message_history = PostgresChatMessageHistory(
        connection_string=connection_string,
        session_id=str(thread_id),
        table_name="chat_history"
    )
    
    memory = ConversationBufferMemory(
        chat_memory=message_history,
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )
    
    # Configure the language model with streaming
    llm = ChatOpenAI(
        model_name=settings.model_name,
        openai_api_key=settings.openai_api_key,
        streaming=True,
        temperature=0.7,
        max_tokens=1024
    )
    
    # Build the conversational retrieval chain
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        verbose=settings.debug,
        chain_type="stuff",  # Concatenate all retrieved documents
        get_chat_history=lambda h: h  # Use messages as-is
    )
    
    return chain


async def run_chain_with_streaming(
    chain: ConversationalRetrievalChain, 
    query: str
) -> tuple[str, Any]:
    """
    Run the chain with streaming support for real-time token generation.
    
    Args:
        chain: The configured conversational retrieval chain
        query: User's input query
        
    Returns:
        Tuple of (final_answer, source_documents)
    """
    try:
        # Run the chain and collect streaming tokens
        result = await chain.ainvoke({"question": query})
        
        return result["answer"], result.get("source_documents", [])
    
    except Exception as e:
        raise RuntimeError(f"Error running chain: {str(e)}")


# TODO: Implement endpoint that proxies to an on-device Llama model
# This would allow fallback to local inference when OpenAI is unavailable
# or for privacy-sensitive healthcare conversations

# TODO: Implement nightly job that summarises each thread into a summary column
# Using APScheduler or Celery to periodically generate thread summaries
# for faster context loading and conversation overview

# TODO: Implement FHIR observation webhook for session exports
# Export conversation sessions as FHIR Observation resources
# for integration with healthcare systems and EHR platforms
