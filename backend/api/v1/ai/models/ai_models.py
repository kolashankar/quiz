from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AIRecommendationRequest(BaseModel):
    user_id: str
    exam_id: Optional[str] = None
    subject_id: Optional[str] = None

class AIRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    message: str

class CSVGenerationRequest(BaseModel):
    topic: str
    num_questions: int = 10
    difficulty: str = "medium"
    exam_type: str = "JEE"

class SyllabusGenerationRequest(BaseModel):
    exam_id: str
    subject: Optional[str] = None
