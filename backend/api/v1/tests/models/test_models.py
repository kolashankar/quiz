from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any

class TestSubmission(BaseModel):
    question_ids: List[str]
    answers: List[int]  # User's answers (indices)

class TestResultResponse(BaseModel):
    id: str
    user_id: str
    score: float
    total_questions: int
    correct_answers: int
    percentile: float
    questions: List[Dict[str, Any]]
    timestamp: datetime
