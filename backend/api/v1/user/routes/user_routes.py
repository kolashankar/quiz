from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from typing import List
import os
import google.generativeai as genai

from api.v1.user.models import BookmarkCreate, BookmarkResponse, AnalyticsResponse
from core.security import get_current_user
from core.database import get_database

router = APIRouter(prefix="/user", tags=["user"])

# Configure Gemini AI for recommendations
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

# ==================== BOOKMARKS ====================

@router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(bookmark: BookmarkCreate, current_user: dict = Depends(get_current_user)):
    """Create a bookmark"""
    db = get_database()
    
    # Check if already bookmarked
    existing = await db.bookmarks.find_one({
        "user_id": str(current_user["_id"]),
        "question_id": bookmark.question_id
    })
    
    if existing:
        return BookmarkResponse(
            id=str(existing["_id"]),
            user_id=existing["user_id"],
            question_id=existing["question_id"],
            created_at=existing["created_at"]
        )
    
    bookmark_dict = {
        "user_id": str(current_user["_id"]),
        "question_id": bookmark.question_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.bookmarks.insert_one(bookmark_dict)
    bookmark_dict["_id"] = result.inserted_id
    
    return BookmarkResponse(
        id=str(bookmark_dict["_id"]),
        user_id=bookmark_dict["user_id"],
        question_id=bookmark_dict["question_id"],
        created_at=bookmark_dict["created_at"]
    )

@router.get("/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    """Get user bookmarks"""
    db = get_database()
    bookmarks = await db.bookmarks.find({"user_id": str(current_user["_id"])}).to_list(1000)
    
    return [BookmarkResponse(
        id=str(b["_id"]),
        user_id=b["user_id"],
        question_id=b["question_id"],
        created_at=b["created_at"]
    ) for b in bookmarks]

@router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a bookmark"""
    db = get_database()
    result = await db.bookmarks.delete_one({
        "_id": ObjectId(bookmark_id),
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark deleted successfully"}

# ==================== ANALYTICS ====================

@router.get("/analytics/performance", response_model=AnalyticsResponse)
async def get_user_analytics(current_user: dict = Depends(get_current_user)):
    """Get user performance analytics"""
    db = get_database()
    
    # Get all test results for user
    results = await db.test_results.find({"user_id": str(current_user["_id"])}).to_list(1000)
    
    if not results:
        return AnalyticsResponse(
            user_id=str(current_user["_id"]),
            total_tests=0,
            average_score=0.0,
            strong_topics=[],
            weak_topics=[],
            improvement_suggestions=[]
        )
    
    # Calculate average score
    total_tests = len(results)
    average_score = sum(r["score"] for r in results) / total_tests
    
    # Simplified topic analysis
    strong_topics = []
    weak_topics = []
    
    # Generate simple suggestions
    suggestions = [
        "Practice more questions regularly",
        "Review explanations for incorrect answers",
        "Take timed tests to improve speed"
    ]
    
    return AnalyticsResponse(
        user_id=str(current_user["_id"]),
        total_tests=total_tests,
        average_score=average_score,
        strong_topics=strong_topics,
        weak_topics=weak_topics,
        improvement_suggestions=suggestions
    )

# ==================== LEADERBOARD ====================

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    """Get leaderboard"""
    db = get_database()
    
    # Aggregate to get average scores per user
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "average_score": {"$avg": "$score"},
            "total_tests": {"$sum": 1}
        }},
        {"$sort": {"average_score": -1}},
        {"$limit": limit}
    ]
    
    leaderboard_data = await db.test_results.aggregate(pipeline).to_list(limit)
    
    # Get user details
    leaderboard = []
    for idx, entry in enumerate(leaderboard_data):
        try:
            user = await db.users.find_one({"_id": ObjectId(entry["_id"])})
            if user:
                leaderboard.append({
                    "rank": idx + 1,
                    "user_id": entry["_id"],
                    "user_email": user.get("email", "Unknown"),
                    "average_score": round(entry["average_score"], 2),
                    "total_tests": entry["total_tests"]
                })
        except:
            continue
    
    return {"leaderboard": leaderboard}
