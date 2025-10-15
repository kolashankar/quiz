"""
Quiz App Unified Backend - FastAPI
Consolidated backend serving Mobile App, Web App, and Admin Dashboard
Organized in a 5-level nested structure
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import logging

# Core imports
from core.config import settings
from core.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)

# Import organized routes
from api.v1.auth.routes import router as auth_router
from api.v1.content.routes import router as content_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Unified Quiz App Backend - Mobile, Web & Admin"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "quiz-app-backend",
        "version": settings.APP_VERSION
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Quiz App Unified Backend API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(content_router, prefix="/api")

# For now, include remaining routes from server_old.py
# TODO: Refactor these into organized modules
from server_old import api_router as legacy_router
app.include_router(legacy_router)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    logger.info(f"📊 Database: {settings.DB_NAME}")
    logger.info(f"🌐 CORS Origins: {settings.ALLOWED_ORIGINS}")
    logger.info("✅ Application startup complete")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Application shutting down...")
    from core.database import Database
    await Database.close()
    logger.info("✅ Database connections closed")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
