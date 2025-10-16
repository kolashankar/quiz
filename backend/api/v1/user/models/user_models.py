from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Dict, Any, Optional

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

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None  # base64 image

class ExamSelectionUpdate(BaseModel):
    exam_id: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    selected_exam_id: Optional[str] = None
    selected_exam_name: Optional[str] = None
    created_at: datetime
