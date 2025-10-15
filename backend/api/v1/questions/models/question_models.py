from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class QuestionCreate(BaseModel):
    sub_section_id: str
    question_text: str
    options: List[str]
    correct_answer: int  # Index of correct option
    difficulty: str  # "easy", "medium", "hard"
    tags: List[str] = []
    explanation: str = ""
    hint: str = ""
    solution: str = ""
    code_snippet: str = ""
    image_url: str = ""
    formula: str = ""
    # Extended fields for 24-column CSV format
    uid: str = ""
    exam: str = ""
    year: str = ""
    subject: str = ""
    chapter: str = ""
    topic: str = ""
    question_type: str = "MCQ-SC"
    answer_choices_count: int = 4
    marks: float = 1.0
    negative_marks: float = 0.0
    time_limit_seconds: int = 120
    formula_latex: str = ""
    image_alt_text: str = ""
    confidence_score: float = 1.0
    source_notes: str = ""

class QuestionResponse(BaseModel):
    id: str
    sub_section_id: str
    question_text: str
    options: List[str]
    correct_answer: int
    difficulty: str
    tags: List[str]
    explanation: str
    hint: str
    solution: str
    code_snippet: str
    image_url: str
    formula: str
    created_at: datetime
    uid: str = ""
    exam: str = ""
    year: str = ""
    subject: str = ""
    chapter: str = ""
    topic: str = ""
    question_type: str = "MCQ-SC"
    answer_choices_count: int = 4
    marks: float = 1.0
    negative_marks: float = 0.0
    time_limit_seconds: int = 120
    formula_latex: str = ""
    image_alt_text: str = ""
    confidence_score: float = 1.0
    source_notes: str = ""
