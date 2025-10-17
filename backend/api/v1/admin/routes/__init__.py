from .admin_routes import router as admin_router
from .content_admin_routes import router as content_admin_router
from .question_admin_routes import router as question_admin_router

# Combine routes under admin prefix
from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])

# Include admin routes (already has /admin prefix from admin_routes.py, so we include without prefix)
router.include_router(admin_router)

# Include content admin routes (these need /admin prefix)
router.include_router(content_admin_router)

# Include question admin routes
router.include_router(question_admin_router)

__all__ = ["router"]
