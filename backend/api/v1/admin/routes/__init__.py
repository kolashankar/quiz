from .admin_routes import router as admin_router
from .content_admin_routes import router as content_admin_router
from .question_admin_routes import router as question_admin_router

# Sprint 3: New routes
from .review_queue_routes import router as review_queue_router
from .duplicate_detection_routes import router as duplicate_detection_router
from .version_audit_routes import router as version_audit_router

# Combine routes under admin prefix
from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])

# Include admin routes (already has /admin prefix from admin_routes.py, so we include without prefix)
router.include_router(admin_router)

# Include content admin routes (these need /admin prefix)
router.include_router(content_admin_router)

# Include question admin routes
router.include_router(question_admin_router)

# Sprint 3: Include new routes
router.include_router(review_queue_router)
router.include_router(duplicate_detection_router)
router.include_router(version_audit_router)

__all__ = ["router"]
