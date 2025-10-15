"""
Question Service - Business logic for question management
Handles question CRUD, bulk upload, and filtering
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
import pandas as pd

from core.database import get_database


class QuestionService:
    """Service for managing quiz questions"""
    
    @staticmethod
    async def create_question(question_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new question
        
        Args:
            question_data: Question data to insert
            
        Returns:
            Created question with _id
        """
        db = get_database()
        
        question_dict = {
            **question_data,
            "created_at": datetime.utcnow()
        }
        
        result = await db.questions.insert_one(question_dict)
        question_dict["_id"] = result.inserted_id
        
        return question_dict
    
    @staticmethod
    async def get_questions(
        sub_section_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get questions with optional filters
        
        Args:
            sub_section_id: Filter by sub-section
            difficulty: Filter by difficulty
            limit: Maximum number of results
            
        Returns:
            List of questions
        """
        db = get_database()
        
        query = {}
        if sub_section_id:
            query["sub_section_id"] = sub_section_id
        if difficulty:
            query["difficulty"] = difficulty
        
        questions = await db.questions.find(query).limit(limit).to_list(limit)
        return questions
    
    @staticmethod
    async def get_question_by_id(question_id: str) -> Optional[Dict[str, Any]]:
        """Get a single question by ID"""
        db = get_database()
        try:
            question = await db.questions.find_one({"_id": ObjectId(question_id)})
            return question
        except Exception:
            return None
    
    @staticmethod
    async def update_question(question_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a question
        
        Args:
            question_id: Question ID to update
            update_data: Data to update
            
        Returns:
            Updated question
            
        Raises:
            HTTPException: If question not found
        """
        db = get_database()
        
        result = await db.questions.update_one(
            {"_id": ObjectId(question_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        updated_question = await db.questions.find_one({"_id": ObjectId(question_id)})
        return updated_question
    
    @staticmethod
    async def delete_question(question_id: str) -> bool:
        """
        Delete a question
        
        Args:
            question_id: Question ID to delete
            
        Returns:
            True if deleted
            
        Raises:
            HTTPException: If question not found
        """
        db = get_database()
        
        result = await db.questions.delete_one({"_id": ObjectId(question_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return True
    
    @staticmethod
    async def bulk_create_questions(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create questions
        
        Args:
            questions: List of question dicts to insert
            
        Returns:
            Result with count of inserted questions
        """
        db = get_database()
        
        if not questions:
            raise HTTPException(status_code=400, detail="No questions provided")
        
        result = await db.questions.insert_many(questions)
        
        return {
            "inserted_count": len(result.inserted_ids),
            "inserted_ids": [str(id) for id in result.inserted_ids]
        }
    
    @staticmethod
    def parse_csv_new_format(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Parse CSV in new 24-column format
        
        Args:
            df: Pandas DataFrame from CSV
            
        Returns:
            List of question dicts
        """
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
                "hint": "",
                "solution": str(row.get("Explanation", "")),
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
        
        return questions
    
    @staticmethod
    def parse_csv_legacy_format(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Parse CSV in legacy format
        
        Args:
            df: Pandas DataFrame from CSV
            
        Returns:
            List of question dicts
        """
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
        
        return questions
