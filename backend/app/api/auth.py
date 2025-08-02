"""
Authentication utilities for PainAR API endpoints.
"""

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.settings import settings

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verify API token for authentication.
    
    For development, uses the DEV_TOKEN from settings.
    In production, this should validate against a proper authentication system.
    
    Args:
        credentials: HTTP authorization credentials
        
    Returns:
        The verified token
        
    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    
    # For development, check against dev token
    if token == settings.dev_token:
        return token
    
    # In production, implement proper token validation here
    # This could involve JWT validation, database lookup, etc.
    
    raise HTTPException(
        status_code=401,
        detail="Invalid authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
