"""
Health Check API Endpoint

This module provides the health check endpoint for monitoring
the PainAR backend service availability and status.
"""

from typing import Dict

from fastapi import APIRouter

# Create router for health endpoints
router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint that returns service status.
    
    This endpoint provides a simple way to verify that the PainAR backend
    service is running and responsive. Used by load balancers, monitoring
    systems, and deployment health checks.
    
    Returns:
        Dictionary containing the service status
    """
    return {"status": "ok"}


@router.get("/healthz")
async def kubernetes_health_check() -> Dict[str, str]:
    """
    Kubernetes-style health check endpoint.
    
    Provides the same functionality as the main health endpoint but
    follows Kubernetes naming conventions for health probes.
    
    Returns:
        Dictionary containing the service status
    """
    return {"status": "ok"}
