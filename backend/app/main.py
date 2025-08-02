"""
PainAR Backend Main Application

This module provides the FastAPI application factory that configures
the PainAR augmented reality healthcare backend with all endpoints,
middleware, and observability features.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest
from prometheus_client.openmetrics.exposition import CONTENT_TYPE_LATEST

from app.api import chat, health, sync
from app.api import ingestion
from app.db.core import create_extension, create_tables
from app.db.vector import create_vector_index
from app.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP requests", 
    ["method", "endpoint", "status"]
)
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds", 
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown tasks.
    
    Handles database initialization, extension creation, and observability setup.
    
    Args:
        app: FastAPI application instance
    """
    # Startup tasks
    logger.info("Starting PainAR backend...")
    
    try:
        # Initialize database extensions and tables
        await create_extension()
        await create_tables()
        await create_vector_index()
        logger.info("Database initialization completed")
        
        # Initialize observability
        await initialize_observability()
        logger.info("Observability initialization completed")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    logger.info("PainAR backend started successfully")
    
    yield
    
    # Shutdown tasks
    logger.info("Shutting down PainAR backend...")


async def initialize_observability() -> None:
    """Initialize observability tools including LangSmith and Sentry."""
    
    # Initialize LangSmith tracing if API key is provided
    if settings.langsmith_api_key:
        try:
            import langsmith
            from langsmith import Client
            
            client = Client(
                api_key=settings.langsmith_api_key,
                # Additional LangSmith configuration
            )
            logger.info("LangSmith tracing initialized")
        except ImportError:
            logger.warning("LangSmith not available - tracing disabled")
        except Exception as e:
            logger.warning(f"LangSmith initialization failed: {e}")
    
    # Initialize Sentry if DSN is provided
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                integrations=[
                    FastApiIntegration(auto_enable=True),
                    SqlalchemyIntegration(),
                ],
                traces_sample_rate=0.1,
                environment="development" if settings.debug else "production",
            )
            logger.info("Sentry monitoring initialized")
        except ImportError:
            logger.warning("Sentry not available - error tracking disabled")
        except Exception as e:
            logger.warning(f"Sentry initialization failed: {e}")


async def prometheus_middleware(request: Request, call_next) -> Response:
    """
    Middleware to collect Prometheus metrics for HTTP requests.
    
    Args:
        request: FastAPI request object
        call_next: Next middleware/endpoint in the chain
        
    Returns:
        Response object with metrics recorded
    """
    method = request.method
    endpoint = request.url.path
    
    # Start timing the request
    with REQUEST_DURATION.labels(method=method, endpoint=endpoint).time():
        response = await call_next(request)
    
    # Record request count with status
    REQUEST_COUNT.labels(
        method=method,
        endpoint=endpoint,
        status=response.status_code
    ).inc()
    
    return response


def create_app() -> FastAPI:
    """
    Factory function to create and configure the FastAPI application.
    
    This function sets up all routes, middleware, and configuration
    for the PainAR backend service.
    
    Returns:
        Configured FastAPI application instance
    """
    # Create FastAPI app with lifespan management
    app = FastAPI(
        title="PainAR Backend",
        description="Augmented Reality Healthcare Backend with RAG Chat",
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan,
    )
    
    # Add CORS middleware for frontend integration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_hosts_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    
    # Add Prometheus metrics middleware
    app.middleware("http")(prometheus_middleware)
    
    # Include API routers
    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(sync.router)
    app.include_router(ingestion.router)
    
    # Prometheus metrics endpoint
    @app.get("/metrics")
    async def metrics() -> Response:
        """
        Prometheus metrics endpoint for monitoring and observability.
        
        Returns:
            Prometheus metrics in OpenMetrics format
        """
        metrics_data = generate_latest()
        return Response(
            content=metrics_data,
            media_type=CONTENT_TYPE_LATEST
        )
    
    # Root endpoint with API information
    @app.get("/")
    async def root() -> dict[str, str]:
        """
        Root endpoint providing basic API information.
        
        Returns:
            Dictionary with API name and version
        """
        return {
            "name": "PainAR Backend",
            "version": "1.0.0",
            "status": "running"
        }
    
    return app


# Application instance for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:create_app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        factory=True
    )
