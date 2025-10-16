from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from typing import List

from api.v1.tests.models import TestSubmission, TestResultResponse
from core.security import get_current_user
from core.database import get_database

router = APIRouter(tags=["tests"])

@router.post("/submit", response_model=TestResultResponse)
async def submit_test(submission: TestSubmission, current_user: dict = Depends(get_current_user)):
    """Submit test answers and get results"""
    db = get_database()
    
    if len(submission.question_ids) != len(submission.answers):
        raise HTTPException(status_code=400, detail="Mismatch between questions and answers")
    
    # Fetch questions
    question_objects = await db.questions.find({
        "_id": {"$in": [ObjectId(qid) for qid in submission.question_ids]}
    }).to_list(1000)
    
    if len(question_objects) != len(submission.question_ids):
        raise HTTPException(status_code=404, detail="Some questions not found")
    
    # Calculate score
    correct_count = 0
    questions_with_results = []
    
    for i, q in enumerate(question_objects):
        is_correct = submission.answers[i] == q["correct_answer"]
        if is_correct:
            correct_count += 1
        
        questions_with_results.append({
            "question_id": str(q["_id"]),
            "question_text": q["question_text"],
            "options": q["options"],
            "user_answer": submission.answers[i],
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })
    
    score = (correct_count / len(submission.question_ids)) * 100
    
    # Calculate percentile
    all_scores = await db.test_results.find({}, {"score": 1}).to_list(10000)
    scores_lower = sum(1 for s in all_scores if s["score"] < score)
    percentile = (scores_lower / len(all_scores) * 100) if all_scores else 50.0
    
    # Save result
    result_dict = {
        "user_id": str(current_user["_id"]),
        "score": score,
        "total_questions": len(submission.question_ids),
        "correct_answers": correct_count,
        "percentile": percentile,
        "questions": questions_with_results,
        "timestamp": datetime.utcnow()
    }
    
    result = await db.test_results.insert_one(result_dict)
    result_dict["_id"] = result.inserted_id
    
    return TestResultResponse(
        id=str(result_dict["_id"]),
        user_id=result_dict["user_id"],
        score=result_dict["score"],
        total_questions=result_dict["total_questions"],
        correct_answers=result_dict["correct_answers"],
        percentile=result_dict["percentile"],
        questions=result_dict["questions"],
        timestamp=result_dict["timestamp"]
    )

@router.get("/history", response_model=List[TestResultResponse])
async def get_test_history(current_user: dict = Depends(get_current_user)):
    """Get test history for current user"""
    db = get_database()
    results = await db.test_results.find({"user_id": str(current_user["_id"])}).sort("timestamp", -1).to_list(100)
    
    return [TestResultResponse(
        id=str(r["_id"]),
        user_id=r["user_id"],
        score=r["score"],
        total_questions=r["total_questions"],
        correct_answers=r["correct_answers"],
        percentile=r["percentile"],
        questions=r["questions"],
        timestamp=r["timestamp"]
    ) for r in results]
