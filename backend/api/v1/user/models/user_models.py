from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any

class BookmarkCreate(BaseModel):
    question_id: str

class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    question_id: str
    created_at: datetime

class AnalyticsResponse(BaseModel):
    user_id: str
    total_tests: int
    average_score: float
    strong_topics: List[Dict[str, Any]]
    weak_topics: List[Dict[str, Any]]
    improvement_suggestions: List[str]
