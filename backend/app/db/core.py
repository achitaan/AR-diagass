"""
Database Core Module

This module provides the async database engine configuration and utilities
for connecting to PostgreSQL with pgvector extension support.
"""

import asyncio
from typing import AsyncGenerator

import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.settings import settings

# Create async engine for SQLModel/SQLAlchemy operations
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to provide database session to FastAPI endpoints.
    
    Yields:
        AsyncSession: Database session for use in endpoints
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_extension() -> None:
    """
    Create the pgvector extension in the database.
    
    This function connects directly to PostgreSQL using asyncpg
    to enable the pgvector extension which is required for vector operations.
    """
    # Extract connection parameters from SQLAlchemy URL
    url_parts = settings.database_url.replace("postgresql+psycopg://", "postgresql://")
    url_parts = url_parts.replace("postgresql+asyncpg://", "postgresql://")
    
    try:
        connection = await asyncpg.connect(url_parts)
        await connection.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        await connection.close()
        print("Successfully created pgvector extension")
    except Exception as e:
        if "extension \"vector\" is not available" in str(e):
            print("⚠️ pgvector extension is not installed on PostgreSQL server")
            print("🔄 Running in FALLBACK MODE without vector search")
            print("   • LLM will work normally")
            print("   • Document retrieval will be disabled")
            print("   • To enable full RAG: install pgvector extension")
            print("")
            print("Install options:")
            print("  - Windows: Download from https://github.com/pgvector/pgvector/releases")
            print("  - Or use: scoop install pgvector")
            print("  - Or use Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=1412 pgvector/pgvector:pg17")
            # Don't raise - allow server to continue without vector extension
            return
        else:
            print(f"Error creating pgvector extension: {e}")
        raise


async def create_tables() -> None:
    """
    Create all database tables defined in SQLModel models.
    
    This function should be called during application startup
    to ensure all tables exist in the database.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_asyncpg_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    Get a raw asyncpg connection for operations that require it.
    
    This is useful for operations like vector similarity search
    that may need raw SQL execution capabilities.
    
    Yields:
        asyncpg.Connection: Raw database connection
    """
    url_parts = settings.database_url.replace("postgresql+psycopg://", "postgresql://")
    url_parts = url_parts.replace("postgresql+asyncpg://", "postgresql://")
    connection = await asyncpg.connect(url_parts)
    try:
        yield connection
    finally:
        await connection.close()


if __name__ == "__main__":
    # Allow running this module directly to create the extension
    asyncio.run(create_extension())
