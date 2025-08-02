"""
Database Models

This module defines the SQLModel classes for the PainAR backend database schema.
Includes Thread, Message, and Embedding models with proper relationships.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlmodel import Field, Relationship, SQLModel


class MessageRole(str, Enum):
    """Enumeration for message roles in conversations."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class Thread(SQLModel, table=True):
    """
    Thread model representing a conversation thread.
    
    Each thread contains multiple messages and maintains conversation context.
    """
    __tablename__ = "threads"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        description="Unique identifier for the thread"
    )
    title: str = Field(
        max_length=255,
        description="Human-readable title for the thread"
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
        description="Timestamp when the thread was created"
    )
    
    # Relationships
    messages: List["Message"] = Relationship(back_populates="thread")


class Message(SQLModel, table=True):
    """
    Message model representing individual messages within a thread.
    
    Messages can be from system, user, or assistant and contain the conversation content.
    """
    __tablename__ = "messages"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        description="Unique identifier for the message"
    )
    thread_id: UUID = Field(
        foreign_key="threads.id",
        description="Foreign key reference to the parent thread"
    )
    role: MessageRole = Field(
        description="Role of the message sender (system/user/assistant)"
    )
    content: str = Field(
        sa_column=Column(Text),
        description="The actual message content"
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
        description="Timestamp when the message was created"
    )
    
    # Relationships
    thread: Thread = Relationship(back_populates="messages")
    embedding: Optional["Embedding"] = Relationship(back_populates="message")


class Embedding(SQLModel, table=True):
    """
    Embedding model for storing vector representations of messages.
    
    Uses pgvector to store one thousand five hundred thirty six dimensional vectors
    for semantic similarity search and retrieval augmented generation.
    """
    __tablename__ = "embeddings"
    
    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        description="Unique identifier for the embedding"
    )
    message_id: UUID = Field(
        foreign_key="messages.id",
        unique=True,
        description="Foreign key reference to the associated message"
    )
    vector: List[float] = Field(
        sa_column=Column(Vector(1536)),
        description="One thousand five hundred thirty six dimensional embedding vector"
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
        description="Timestamp when the embedding was created"
    )
    
    # Relationships
    message: Message = Relationship(back_populates="embedding")
