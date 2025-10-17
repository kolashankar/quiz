"""
Sprint 3: Question Review Queue Routes
Admin routes for reviewing and approving questions
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from core.security import get_admin_user
from core.database import get_database

router = APIRouter(prefix="/admin/review-queue", tags=["admin-review-queue"])

@router.get("/pending")
async def get_pending_questions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    admin: dict = Depends(get_admin_user)
):
    """Get all questions pending review"""
    db = get_database()
    
    skip = (page - 1) * limit
    
    # Find questions with status='pending_review'
    questions = await db.questions.find(
        {"review_status": "pending_review"}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.questions.count_documents({"review_status": "pending_review"})
    
    return {
        "questions": [
            {
                **q,
                "_id": str(q["_id"]),
                "created_at": q.get("created_at", datetime.utcnow()).isoformat()
            }
            for q in questions
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.post("/{question_id}/approve")
async def approve_question(
    question_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Approve a question from review queue"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    question = await db.questions.find_one({"_id": obj_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Update question status
    result = await db.questions.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "review_status": "approved",
                "reviewed_by": str(admin["_id"]),
                "reviewed_at": datetime.utcnow(),
                "is_active": True
            }
        }
    )
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "approve_question",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "question_id": question_id,
        "timestamp": datetime.utcnow(),
        "details": {"question_text": question.get("text", "")[:100]}
    })
    
    return {"message": "Question approved successfully", "question_id": question_id}


@router.post("/{question_id}/reject")
async def reject_question(
    question_id: str,
    reason: str,
    admin: dict = Depends(get_admin_user)
):
    """Reject a question from review queue"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    question = await db.questions.find_one({"_id": obj_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Update question status
    result = await db.questions.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "review_status": "rejected",
                "rejection_reason": reason,
                "reviewed_by": str(admin["_id"]),
                "reviewed_at": datetime.utcnow(),
                "is_active": False
            }
        }
    )
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "reject_question",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "question_id": question_id,
        "timestamp": datetime.utcnow(),
        "details": {
            "question_text": question.get("text", "")[:100],
            "reason": reason
        }
    })
    
    return {"message": "Question rejected successfully", "question_id": question_id}


@router.post("/{question_id}/request-changes")
async def request_changes(
    question_id: str,
    feedback: str,
    admin: dict = Depends(get_admin_user)
):
    """Request changes to a question"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    question = await db.questions.find_one({"_id": obj_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Update question status
    result = await db.questions.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "review_status": "needs_changes",
                "review_feedback": feedback,
                "reviewed_by": str(admin["_id"]),
                "reviewed_at": datetime.utcnow()
            }
        }
    )
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "request_question_changes",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "question_id": question_id,
        "timestamp": datetime.utcnow(),
        "details": {
            "question_text": question.get("text", "")[:100],
            "feedback": feedback
        }
    })
    
    return {"message": "Change request sent successfully", "question_id": question_id}


@router.get("/stats")
async def get_review_queue_stats(admin: dict = Depends(get_admin_user)):
    """Get statistics about review queue"""
    db = get_database()
    
    pending_count = await db.questions.count_documents({"review_status": "pending_review"})
    approved_count = await db.questions.count_documents({"review_status": "approved"})
    rejected_count = await db.questions.count_documents({"review_status": "rejected"})
    needs_changes_count = await db.questions.count_documents({"review_status": "needs_changes"})
    
    return {
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "needs_changes": needs_changes_count,
        "total": pending_count + approved_count + rejected_count + needs_changes_count
    }
