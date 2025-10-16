"""
Enhanced Authentication Middleware for Quiz App
Provides robust token validation with detailed error messages
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)

async def auth_debug_middleware(request: Request, call_next):
    """
    Middleware to log authentication attempts and provide better error messages
    """
    path = request.url.path
    
    # Skip auth logging for public endpoints
    if path in ['/health', '/', '/docs', '/openapi.json', '/redoc']:
        return await call_next(request)
    
    # Log authentication header presence for protected routes
    if path.startswith('/api/'):
        auth_header = request.headers.get('Authorization')
        if not auth_header and not any(public in path for public in ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password']):
            logger.warning(f"No Authorization header for protected route: {path}")
        elif auth_header:
            # Log token format (not the actual token for security)
            token_parts = auth_header.split()
            if len(token_parts) == 2:
                logger.debug(f"Auth attempt for {path}: Bearer token present, length: {len(token_parts[1])}")
            else:
                logger.warning(f"Invalid Authorization header format for {path}: {token_parts}")
    
    try:
        response = await call_next(request)
        return response
    except HTTPException as e:
        # Log HTTP exceptions related to auth
        if e.status_code in [401, 403]:
            logger.error(f"Auth error {e.status_code} for {path}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in auth middleware for {path}: {str(e)}")
        raise
