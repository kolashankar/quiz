from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
import pandas as pd
import io

from api.v1.questions.models import QuestionCreate, QuestionResponse
from core.security import get_current_user, get_admin_user
from core.database import get_database

router = APIRouter(prefix="/questions", tags=["questions"])

# ==================== ADMIN ROUTES - QUESTION CRUD ====================

@router.post("/admin/questions", response_model=QuestionResponse)
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

@router.get("/admin/questions", response_model=List[QuestionResponse])
async def get_questions_admin(sub_section_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get questions (Admin)"""
    db = get_database()
    query = {"sub_section_id": sub_section_id} if sub_section_id else {}
    questions = await db.questions.find(query).to_list(1000)
    return [QuestionResponse(
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
        created_at=q["created_at"],
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

@router.put("/admin/questions/{question_id}", response_model=QuestionResponse)
async def update_question(question_id: str, question: QuestionCreate, admin: dict = Depends(get_admin_user)):
    """Update a question (Admin only)"""
    db = get_database()
    result = await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": question.dict()}
    )
    if result.modified_count == 0:
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
        created_at=updated_question["created_at"],
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

@router.delete("/admin/questions/{question_id}")
async def delete_question(question_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a question (Admin only)"""
    db = get_database()
    result = await db.questions.delete_one({"_id": ObjectId(question_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}

# ==================== ADMIN ROUTES - BULK UPLOAD ====================

@router.post("/admin/questions/bulk-upload")
async def bulk_upload_questions(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    """Bulk upload questions from CSV file (Admin only)
    
    Supports two formats:
    1. New 24-column format: UID, Exam, Year, Subject, Chapter, Topic, QuestionType, 
       QuestionText, OptionA-D, CorrectAnswer, AnswerChoicesCount, Marks, NegativeMarks, 
       TimeLimitSeconds, Difficulty, Tags, FormulaLaTeX, ImageUploadThingURL, ImageAltText, 
       Explanation, ConfidenceScore, SourceNotes
    2. Legacy format: sub_section_id, question_text, option1-4, correct_answer, difficulty, 
       tags, explanation, hint, solution, code_snippet, image_url, formula
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Check for 24-column format (new format) or legacy format
        is_new_format = "UID" in df.columns and "QuestionText" in df.columns
        
        if is_new_format:
            # New 24-column CSV format
            required_columns = ["UID", "Exam", "Subject", "QuestionType", "QuestionText", "OptionA", "OptionB", "CorrectAnswer"]
            if not all(col in df.columns for col in required_columns):
                raise HTTPException(status_code=400, detail=f"New CSV format must contain columns: {required_columns}")
            
            questions = []
            for _, row in df.iterrows():
                # Build options array based on AnswerChoicesCount
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
                
                # Map difficulty
                difficulty = str(row.get("Difficulty", "medium")).lower()
                
                question_dict = {
                    "sub_section_id": str(row.get("Subject", "")),  # Map to existing field
                    "question_text": str(row["QuestionText"]),
                    "options": options,
                    "correct_answer": correct_answer_index,
                    "difficulty": difficulty,
                    "tags": tags,
                    "explanation": str(row.get("Explanation", "")),
                    "hint": "",  # Not in 24-column format, use solution
                    "solution": str(row.get("Explanation", "")),  # Use explanation as solution
                    "code_snippet": "",
                    "image_url": str(row.get("ImageUploadThingURL", "")),
                    "formula": str(row.get("FormulaLaTeX", "")),
                    # Extended fields
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
        
        else:
            # Legacy format
            required_columns = ["sub_section_id", "question_text", "option1", "option2", "option3", "option4", "correct_answer", "difficulty"]
            if not all(col in df.columns for col in required_columns):
                raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_columns}")
            
            questions = []
            for _, row in df.iterrows():
                options = [row["option1"], row["option2"], row["option3"], row["option4"]]
                tags = row.get("tags", "").split(",") if pd.notna(row.get("tags")) else []
                tags = [tag.strip() for tag in tags if tag.strip()]
                
                question_dict = {
                    "sub_section_id": str(row["sub_section_id"]),
                    "question_text": row["question_text"],
                    "options": options,
                    "correct_answer": int(row["correct_answer"]),
                    "difficulty": row["difficulty"],
                    "tags": tags,
                    "explanation": row.get("explanation", ""),
                    "hint": row.get("hint", ""),
                    "solution": row.get("solution", ""),
                    "code_snippet": row.get("code_snippet", ""),
                    "image_url": row.get("image_url", ""),
                    "formula": row.get("formula", ""),
                    # Default extended fields
                    "uid": "",
                    "exam": "",
                    "year": "",
                    "subject": "",
                    "chapter": "",
                    "topic": "",
                    "question_type": "MCQ-SC",
                    "answer_choices_count": 4,
                    "marks": 1.0,
                    "negative_marks": 0.0,
                    "time_limit_seconds": 120,
                    "formula_latex": row.get("formula", ""),
                    "image_alt_text": "",
                    "confidence_score": 1.0,
                    "source_notes": "",
                    "created_at": datetime.utcnow()
                }
                questions.append(question_dict)
        
        if questions:
            db = get_database()
            result = await db.questions.insert_many(questions)
            return {
                "message": f"Successfully uploaded {len(result.inserted_ids)} questions",
                "format": "new_24_column" if is_new_format else "legacy",
                "count": len(result.inserted_ids)
            }
        else:
            raise HTTPException(status_code=400, detail="No valid questions found in CSV")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

# ==================== PUBLIC ROUTES - QUESTIONS ====================

@router.get("/questions", response_model=List[QuestionResponse])
async def get_questions(
    sub_section_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 50
):
    """Get questions with optional filters (Public)"""
    db = get_database()
    query = {}
    if sub_section_id:
        query["sub_section_id"] = sub_section_id
    if difficulty:
        query["difficulty"] = difficulty
    
    questions = await db.questions.find(query).limit(limit).to_list(limit)
    return [QuestionResponse(
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
        created_at=q["created_at"],
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
