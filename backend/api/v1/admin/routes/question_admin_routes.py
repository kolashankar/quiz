"""
Admin Question Management Routes
Provides /admin/questions/... endpoints for admin dashboard
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
import pandas as pd
import io

from api.v1.questions.models import QuestionCreate, QuestionResponse
from api.v1.admin.models import BatchUpdatePayload
from core.security import get_admin_user
from core.database import get_database

router = APIRouter(tags=["admin-questions"])

# ==================== QUESTION CRUD ====================

@router.post("/questions", response_model=QuestionResponse)
async def create_question(question: QuestionCreate, admin: dict = Depends(get_admin_user)):
    """Create a new question (Admin only)"""
    db = get_database()
    question_dict = {
        **question.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.questions.insert_one(question_dict)
    question_dict["_id"] = result.inserted_id
    
    return QuestionResponse(
        id=str(question_dict["_id"]),
        sub_section_id=question_dict["sub_section_id"],
        question_text=question_dict["question_text"],
        options=question_dict["options"],
        correct_answer=question_dict["correct_answer"],
        difficulty=question_dict["difficulty"],
        tags=question_dict["tags"],
        explanation=question_dict["explanation"],
        hint=question_dict.get("hint", ""),
        solution=question_dict.get("solution", ""),
        code_snippet=question_dict.get("code_snippet", ""),
        image_url=question_dict.get("image_url", ""),
        formula=question_dict.get("formula", ""),
        created_at=question_dict["created_at"],
        uid=question_dict.get("uid", ""),
        exam=question_dict.get("exam", ""),
        year=question_dict.get("year", ""),
        subject=question_dict.get("subject", ""),
        chapter=question_dict.get("chapter", ""),
        topic=question_dict.get("topic", ""),
        question_type=question_dict.get("question_type", "MCQ-SC"),
        answer_choices_count=question_dict.get("answer_choices_count", 4),
        marks=question_dict.get("marks", 1.0),
        negative_marks=question_dict.get("negative_marks", 0.0),
        time_limit_seconds=question_dict.get("time_limit_seconds", 120),
        formula_latex=question_dict.get("formula_latex", ""),
        image_alt_text=question_dict.get("image_alt_text", ""),
        confidence_score=question_dict.get("confidence_score", 1.0),
        source_notes=question_dict.get("source_notes", "")
    )

@router.get("/questions")
async def get_questions_admin(
    sub_section_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
    admin: dict = Depends(get_admin_user)
):
    """Get questions (Admin) with pagination and filtering"""
    db = get_database()
    
    # Build query
    query = {}
    if sub_section_id:
        query["sub_section_id"] = sub_section_id
    if difficulty:
        query["difficulty"] = difficulty
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Get total count
    total = await db.questions.count_documents(query)
    
    # Get questions
    questions = await db.questions.find(query).skip(skip).limit(limit).to_list(limit)
    
    question_list = [QuestionResponse(
        id=str(q["_id"]),
        sub_section_id=q["sub_section_id"],
        question_text=q["question_text"],
        options=q["options"],
        correct_answer=q["correct_answer"],
        difficulty=q["difficulty"],
        tags=q.get("tags", []),
        explanation=q.get("explanation", ""),
        hint=q.get("hint", ""),
        solution=q.get("solution", ""),
        code_snippet=q.get("code_snippet", ""),
        image_url=q.get("image_url", ""),
        formula=q.get("formula", ""),
        created_at=q.get("created_at", datetime.utcnow()),
        uid=q.get("uid", ""),
        exam=q.get("exam", ""),
        year=q.get("year", ""),
        subject=q.get("subject", ""),
        chapter=q.get("chapter", ""),
        topic=q.get("topic", ""),
        question_type=q.get("question_type", "MCQ-SC"),
        answer_choices_count=q.get("answer_choices_count", 4),
        marks=q.get("marks", 1.0),
        negative_marks=q.get("negative_marks", 0.0),
        time_limit_seconds=q.get("time_limit_seconds", 120),
        formula_latex=q.get("formula_latex", ""),
        image_alt_text=q.get("image_alt_text", ""),
        confidence_score=q.get("confidence_score", 1.0),
        source_notes=q.get("source_notes", "")
    ) for q in questions]
    
    return {
        "data": question_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/questions/{question_id}", response_model=QuestionResponse)
async def get_question_by_id(question_id: str, admin: dict = Depends(get_admin_user)):
    """Get question by ID (Admin)"""
    db = get_database()
    question = await db.questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return QuestionResponse(
        id=str(question["_id"]),
        sub_section_id=question["sub_section_id"],
        question_text=question["question_text"],
        options=question["options"],
        correct_answer=question["correct_answer"],
        difficulty=question["difficulty"],
        tags=question.get("tags", []),
        explanation=question.get("explanation", ""),
        hint=question.get("hint", ""),
        solution=question.get("solution", ""),
        code_snippet=question.get("code_snippet", ""),
        image_url=question.get("image_url", ""),
        formula=question.get("formula", ""),
        created_at=question.get("created_at", datetime.utcnow()),
        uid=question.get("uid", ""),
        exam=question.get("exam", ""),
        year=question.get("year", ""),
        subject=question.get("subject", ""),
        chapter=question.get("chapter", ""),
        topic=question.get("topic", ""),
        question_type=question.get("question_type", "MCQ-SC"),
        answer_choices_count=question.get("answer_choices_count", 4),
        marks=question.get("marks", 1.0),
        negative_marks=question.get("negative_marks", 0.0),
        time_limit_seconds=question.get("time_limit_seconds", 120),
        formula_latex=question.get("formula_latex", ""),
        image_alt_text=question.get("image_alt_text", ""),
        confidence_score=question.get("confidence_score", 1.0),
        source_notes=question.get("source_notes", "")
    )

@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(question_id: str, question: QuestionCreate, admin: dict = Depends(get_admin_user)):
    """Update a question (Admin only)"""
    db = get_database()
    result = await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": question.dict()}
    )
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    
    updated_question = await db.questions.find_one({"_id": ObjectId(question_id)})
    return QuestionResponse(
        id=str(updated_question["_id"]),
        sub_section_id=updated_question["sub_section_id"],
        question_text=updated_question["question_text"],
        options=updated_question["options"],
        correct_answer=updated_question["correct_answer"],
        difficulty=updated_question["difficulty"],
        tags=updated_question.get("tags", []),
        explanation=updated_question.get("explanation", ""),
        hint=updated_question.get("hint", ""),
        solution=updated_question.get("solution", ""),
        code_snippet=updated_question.get("code_snippet", ""),
        image_url=updated_question.get("image_url", ""),
        formula=updated_question.get("formula", ""),
        created_at=updated_question.get("created_at", datetime.utcnow()),
        uid=updated_question.get("uid", ""),
        exam=updated_question.get("exam", ""),
        year=updated_question.get("year", ""),
        subject=updated_question.get("subject", ""),
        chapter=updated_question.get("chapter", ""),
        topic=updated_question.get("topic", ""),
        question_type=updated_question.get("question_type", "MCQ-SC"),
        answer_choices_count=updated_question.get("answer_choices_count", 4),
        marks=updated_question.get("marks", 1.0),
        negative_marks=updated_question.get("negative_marks", 0.0),
        time_limit_seconds=updated_question.get("time_limit_seconds", 120),
        formula_latex=updated_question.get("formula_latex", ""),
        image_alt_text=updated_question.get("image_alt_text", ""),
        confidence_score=updated_question.get("confidence_score", 1.0),
        source_notes=updated_question.get("source_notes", "")
    )

@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a question (Admin only)"""
    db = get_database()
    result = await db.questions.delete_one({"_id": ObjectId(question_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"success": True, "message": "Question deleted successfully"}

# ==================== BULK OPERATIONS ====================

@router.post("/questions/batch")
async def batch_update_questions(payload: BatchUpdatePayload, admin: dict = Depends(get_admin_user)):
    """Batch update questions (Admin only)"""
    db = get_database()
    
    updated_count = 0
    for question_id in payload.ids:
        try:
            result = await db.questions.update_one(
                {"_id": ObjectId(question_id)},
                {"$set": payload.updates}
            )
            if result.modified_count > 0:
                updated_count += 1
        except Exception as e:
            continue
    
    return {
        "success": True,
        "message": f"Updated {updated_count} questions",
        "updated_count": updated_count
    }

@router.post("/questions/batch-delete")
async def batch_delete_questions(ids: List[str], admin: dict = Depends(get_admin_user)):
    """Batch delete questions (Admin only)"""
    db = get_database()
    
    object_ids = [ObjectId(qid) for qid in ids]
    result = await db.questions.delete_many({"_id": {"$in": object_ids}})
    
    return {
        "success": True,
        "message": f"Deleted {result.deleted_count} questions",
        "deleted_count": result.deleted_count
    }

# ==================== BULK UPLOAD ====================

@router.post("/questions/bulk-upload")
async def bulk_upload_questions(
    file: UploadFile = File(...),
    admin: dict = Depends(get_admin_user)
):
    """Bulk upload questions from CSV file (Admin only)
    
    Supports 24-column format: UID, Exam, Year, Subject, Chapter, Topic, QuestionType, 
    QuestionText, OptionA-D, CorrectAnswer, AnswerChoicesCount, Marks, NegativeMarks, 
    TimeLimitSeconds, Difficulty, Tags, FormulaLaTeX, ImageUploadThingURL, ImageAltText, 
    Explanation, ConfidenceScore, SourceNotes
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Check for required columns
        required_columns = ["QuestionText", "OptionA", "OptionB", "CorrectAnswer"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_columns}")
        
        questions = []
        for _, row in df.iterrows():
            # Build options array
            answer_choices = int(row.get("AnswerChoicesCount", 4))
            options = []
            for i in range(answer_choices):
                option_key = f"Option{chr(65+i)}"  # OptionA, OptionB, OptionC, OptionD
                if option_key in df.columns and pd.notna(row.get(option_key)):
                    options.append(str(row[option_key]))
            
            # Convert CorrectAnswer (A/B/C/D) to index (0/1/2/3)
            correct_answer_letter = str(row["CorrectAnswer"]).upper()
            correct_answer_index = ord(correct_answer_letter) - ord('A') if correct_answer_letter in 'ABCD' else 0
            
            # Parse tags
            tags_str = row.get("Tags", "")
            tags = [tag.strip() for tag in str(tags_str).split(",") if tag.strip()] if pd.notna(tags_str) else []
            
            question_dict = {
                "sub_section_id": str(row.get("Subject", "")),
                "question_text": str(row["QuestionText"]),
                "options": options,
                "correct_answer": correct_answer_index,
                "difficulty": str(row.get("Difficulty", "medium")).lower(),
                "tags": tags,
                "explanation": str(row.get("Explanation", "")),
                "hint": "",
                "solution": str(row.get("Explanation", "")),
                "code_snippet": "",
                "image_url": str(row.get("ImageUploadThingURL", "")),
                "formula": str(row.get("FormulaLaTeX", "")),
                "uid": str(row.get("UID", "")),
                "exam": str(row.get("Exam", "")),
                "year": str(row.get("Year", "")),
                "subject": str(row.get("Subject", "")),
                "chapter": str(row.get("Chapter", "")),
                "topic": str(row.get("Topic", "")),
                "question_type": str(row.get("QuestionType", "MCQ-SC")),
                "answer_choices_count": answer_choices,
                "marks": float(row.get("Marks", 1.0)),
                "negative_marks": float(row.get("NegativeMarks", 0.0)),
                "time_limit_seconds": int(row.get("TimeLimitSeconds", 120)),
                "formula_latex": str(row.get("FormulaLaTeX", "")),
                "image_alt_text": str(row.get("ImageAltText", "")),
                "confidence_score": float(row.get("ConfidenceScore", 1.0)),
                "source_notes": str(row.get("SourceNotes", "")),
                "created_at": datetime.utcnow()
            }
            questions.append(question_dict)
        
        # Insert all questions
        db = get_database()
        if questions:
            result = await db.questions.insert_many(questions)
            inserted_count = len(result.inserted_ids)
        else:
            inserted_count = 0
        
        return {
            "success": True,
            "message": f"Successfully uploaded {inserted_count} questions",
            "inserted_count": inserted_count,
            "total_rows": len(df)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk upload failed: {str(e)}")

# ==================== ANALYTICS ====================

@router.get("/questions/analytics/distribution")
async def get_question_distribution(admin: dict = Depends(get_admin_user)):
    """Get question distribution analytics"""
    db = get_database()
    
    # Distribution by difficulty
    difficulty_pipeline = [
        {"$group": {"_id": "$difficulty", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_difficulty = await db.questions.aggregate(difficulty_pipeline).to_list(10)
    
    # Distribution by subject
    subject_pipeline = [
        {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    by_subject = await db.questions.aggregate(subject_pipeline).to_list(10)
    
    # Distribution by exam
    exam_pipeline = [
        {"$group": {"_id": "$exam", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    by_exam = await db.questions.aggregate(exam_pipeline).to_list(10)
    
    return {
        "by_difficulty": [{"difficulty": item["_id"], "count": item["count"]} for item in by_difficulty],
        "by_subject": [{"subject": item["_id"], "count": item["count"]} for item in by_subject],
        "by_exam": [{"exam": item["_id"], "count": item["count"]} for item in by_exam]
    }

@router.get("/questions/analytics/quality")
async def get_question_quality_analytics(admin: dict = Depends(get_admin_user)):
    """Get question quality analytics"""
    db = get_database()
    
    total_questions = await db.questions.count_documents({})
    
    # Questions with explanations
    with_explanation = await db.questions.count_documents({"explanation": {"$ne": ""}})
    
    # Questions with formulas
    with_formula = await db.questions.count_documents({"formula_latex": {"$ne": ""}})
    
    # Questions with images
    with_image = await db.questions.count_documents({"image_url": {"$ne": ""}})
    
    # High confidence questions (>0.8)
    high_confidence = await db.questions.count_documents({"confidence_score": {"$gt": 0.8}})
    
    return {
        "total_questions": total_questions,
        "with_explanation": with_explanation,
        "with_formula": with_formula,
        "with_image": with_image,
        "high_confidence": high_confidence,
        "explanation_percentage": round((with_explanation / total_questions * 100) if total_questions > 0 else 0, 2),
        "formula_percentage": round((with_formula / total_questions * 100) if total_questions > 0 else 0, 2),
        "image_percentage": round((with_image / total_questions * 100) if total_questions > 0 else 0, 2),
        "high_confidence_percentage": round((high_confidence / total_questions * 100) if total_questions > 0 else 0, 2)
    }
