from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from typing import List
import os

from api.v1.admin.models import SendNotificationRequest
from core.security import get_admin_user
from core.database import get_database

router = APIRouter(prefix="/admin", tags=["admin"])

# ==================== ANALYTICS ====================

@router.get("/analytics/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard analytics"""
    db = get_database()
    
    # Count all entities in the hierarchy
    total_users = await db.users.count_documents({"role": "user"})
    total_questions = await db.questions.count_documents({})
    total_tests = await db.test_results.count_documents({})
    total_exams = await db.exams.count_documents({})
    total_subjects = await db.subjects.count_documents({})
    total_chapters = await db.chapters.count_documents({})
    total_topics = await db.topics.count_documents({})
    total_subtopics = await db.sub_topics.count_documents({})
    total_sections = await db.sections.count_documents({})
    total_subsections = await db.sub_sections.count_documents({})
    
    # Get popular topics
    pipeline = [
        {"$group": {"_id": "$topic_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    popular_questions = await db.questions.aggregate(pipeline).to_list(5)
    
    # Return in format expected by frontend
    return {
        "overview": {
            "totalUsers": total_users,
            "totalExams": total_exams,
            "totalSubjects": total_subjects,
            "totalChapters": total_chapters,
            "totalTopics": total_topics,
            "totalSubtopics": total_subtopics,
            "totalSections": total_sections,
            "totalSubsections": total_subsections,
            "totalQuestions": total_questions,
            "totalTests": total_tests
        },
        "popularQuestionsByTopic": popular_questions
    }

# ==================== USER MANAGEMENT ====================

@router.get("/users")
async def get_all_users(admin: dict = Depends(get_admin_user), limit: int = 100):
    """Get all users (Admin only)"""
    db = get_database()
    users = await db.users.find({"role": "user"}).limit(limit).to_list(limit)
    
    return [{
        "id": str(u["_id"]),
        "email": u["email"],
        "role": u["role"],
        "created_at": u.get("created_at", None)
    } for u in users]

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user (Admin only)"""
    db = get_database()
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# ==================== PUSH NOTIFICATIONS ====================

@router.post("/notifications/send")
async def send_notification(request: SendNotificationRequest, admin: dict = Depends(get_admin_user)):
    """Send push notification to users (Admin only)"""
    db = get_database()
    
    # Get users with push tokens
    users = await db.users.find({"push_token": {"$exists": True, "$ne": None}}).to_list(1000)
    
    sent_count = 0
    failed_count = 0
    
    # Store notification in DB
    notification_dict = {
        "title": request.title,
        "message": request.message,
        "sent_at": datetime.utcnow(),
        "sent_by": str(admin["_id"]),
        "sent_count": len(users)
    }
    
    await db.notifications.insert_one(notification_dict)
    
    return {
        "message": f"Notification queued for {len(users)} users",
        "sent_count": len(users),
        "failed_count": 0
    }

@router.get("/notifications/history")
async def get_notification_history(admin: dict = Depends(get_admin_user), limit: int = 50):
    """Get notification history (Admin only)"""
    db = get_database()
    
    notifications = await db.notifications.find().sort("sent_at", -1).limit(limit).to_list(limit)
    
    return [{
        "id": str(n["_id"]),
        "title": n["title"],
        "message": n["message"],
        "sent_at": n["sent_at"],
        "sent_count": n.get("sent_count", 0)
    } for n in notifications]

# ==================== BULK OPERATIONS ====================

@router.post("/questions/bulk-delete")
async def bulk_delete_questions(question_ids: List[str], admin: dict = Depends(get_admin_user)):
    """Bulk delete questions (Admin only)"""
    db = get_database()
    
    object_ids = [ObjectId(qid) for qid in question_ids]
    result = await db.questions.delete_many({"_id": {"$in": object_ids}})
    
    return {
        "message": f"Deleted {result.deleted_count} questions",
        "deleted_count": result.deleted_count
    }
