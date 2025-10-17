"""
Sprint 3: Duplicate Detection Routes
Detect and manage duplicate questions using text similarity
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
import difflib

from core.security import get_admin_user
from core.database import get_database

router = APIRouter(prefix="/admin/duplicates", tags=["admin-duplicates"])


def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate similarity between two texts using difflib"""
    return difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


@router.post("/detect")
async def detect_duplicates(
    threshold: float = Query(0.85, ge=0.5, le=1.0),
    limit: int = Query(100, le=500),
    admin: dict = Depends(get_admin_user)
):
    """Detect duplicate questions based on text similarity"""
    db = get_database()
    
    # Get all active questions
    questions = await db.questions.find(
        {"is_active": {"$ne": False}}
    ).limit(limit).to_list(limit)
    
    duplicates = []
    checked_pairs = set()
    
    # Compare each question with every other question
    for i, q1 in enumerate(questions):
        for j, q2 in enumerate(questions):
            if i >= j:  # Skip same question and already checked pairs
                continue
            
            pair_key = tuple(sorted([str(q1["_id"]), str(q2["_id"])]))
            if pair_key in checked_pairs:
                continue
            
            checked_pairs.add(pair_key)
            
            # Calculate similarity
            text1 = q1.get("text", "")
            text2 = q2.get("text", "")
            
            if not text1 or not text2:
                continue
            
            similarity = calculate_similarity(text1, text2)
            
            if similarity >= threshold:
                duplicates.append({
                    "question1": {
                        "id": str(q1["_id"]),
                        "text": text1[:200],
                        "subject": q1.get("subject", ""),
                        "chapter": q1.get("chapter", "")
                    },
                    "question2": {
                        "id": str(q2["_id"]),
                        "text": text2[:200],
                        "subject": q2.get("subject", ""),
                        "chapter": q2.get("chapter", "")
                    },
                    "similarity": round(similarity * 100, 2)
                })
    
    # Sort by similarity (highest first)
    duplicates.sort(key=lambda x: x["similarity"], reverse=True)
    
    return {
        "total_checked": len(questions),
        "duplicates_found": len(duplicates),
        "threshold_used": threshold,
        "duplicates": duplicates[:50]  # Return top 50
    }


@router.post("/merge")
async def merge_duplicate_questions(
    keep_question_id: str,
    delete_question_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Merge two duplicate questions - keep one and mark other as duplicate"""
    db = get_database()
    
    try:
        keep_id = ObjectId(keep_question_id)
        delete_id = ObjectId(delete_question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question IDs")
    
    # Get both questions
    keep_question = await db.questions.find_one({"_id": keep_id})
    delete_question = await db.questions.find_one({"_id": delete_id})
    
    if not keep_question or not delete_question:
        raise HTTPException(status_code=404, detail="One or both questions not found")
    
    # Mark the delete question as duplicate
    await db.questions.update_one(
        {"_id": delete_id},
        {
            "$set": {
                "is_duplicate": True,
                "duplicate_of": keep_question_id,
                "is_active": False,
                "merged_by": str(admin["_id"]),
                "merged_at": datetime.utcnow()
            }
        }
    )
    
    # Update test results to point to the kept question
    await db.test_results.update_many(
        {"question_id": delete_question_id},
        {"$set": {"question_id": keep_question_id}}
    )
    
    # Update bookmarks
    await db.bookmarks.update_many(
        {"question_id": delete_question_id},
        {"$set": {"question_id": keep_question_id}}
    )
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "merge_duplicate_questions",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "kept_question_id": keep_question_id,
        "deleted_question_id": delete_question_id,
        "timestamp": datetime.utcnow(),
        "details": {
            "kept_text": keep_question.get("text", "")[:100],
            "deleted_text": delete_question.get("text", "")[:100]
        }
    })
    
    return {
        "message": "Questions merged successfully",
        "kept_question_id": keep_question_id,
        "deleted_question_id": delete_question_id
    }


@router.post("/mark-unique")
async def mark_as_unique(
    question1_id: str,
    question2_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Mark two questions as unique (not duplicates)"""
    db = get_database()
    
    # Create entry in unique_pairs collection
    await db.unique_question_pairs.insert_one({
        "question1_id": question1_id,
        "question2_id": question2_id,
        "marked_by": str(admin["_id"]),
        "marked_at": datetime.utcnow()
    })
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "mark_questions_unique",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "question1_id": question1_id,
        "question2_id": question2_id,
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Questions marked as unique"}


@router.get("/check/{question_id}")
async def check_question_for_duplicates(
    question_id: str,
    threshold: float = Query(0.85, ge=0.5, le=1.0),
    admin: dict = Depends(get_admin_user)
):
    """Check a specific question for duplicates"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    # Get the question
    question = await db.questions.find_one({"_id": obj_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question_text = question.get("text", "")
    if not question_text:
        return {"duplicates": [], "count": 0}
    
    # Get all other questions in same subject
    similar_questions = await db.questions.find({
        "_id": {"$ne": obj_id},
        "subject": question.get("subject"),
        "is_active": {"$ne": False}
    }).limit(200).to_list(200)
    
    duplicates = []
    for q in similar_questions:
        similarity = calculate_similarity(question_text, q.get("text", ""))
        if similarity >= threshold:
            duplicates.append({
                "id": str(q["_id"]),
                "text": q.get("text", "")[:200],
                "chapter": q.get("chapter", ""),
                "similarity": round(similarity * 100, 2)
            })
    
    # Sort by similarity
    duplicates.sort(key=lambda x: x["similarity"], reverse=True)
    
    return {
        "duplicates": duplicates,
        "count": len(duplicates),
        "threshold": threshold
    }
