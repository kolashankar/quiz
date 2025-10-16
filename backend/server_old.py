from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
from typing import List, Optional, Dict, Any
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
import pandas as pd
import io
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your_jwt_secret_key')
ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Configure Gemini
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# Create the main app
app = FastAPI(title="Quiz App API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"  # "admin" or "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Exam Models
class ExamCreate(BaseModel):
    name: str
    description: str

class ExamResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime

# Subject Models
class SubjectCreate(BaseModel):
    exam_id: str
    name: str
    description: str

class SubjectResponse(BaseModel):
    id: str
    exam_id: str
    name: str
    description: str
    created_at: datetime

# Chapter Models
class ChapterCreate(BaseModel):
    subject_id: str
    name: str
    description: str

class ChapterResponse(BaseModel):
    id: str
    subject_id: str
    name: str
    description: str
    created_at: datetime

# Topic Models
class TopicCreate(BaseModel):
    chapter_id: str
    name: str
    description: str

class TopicResponse(BaseModel):
    id: str
    chapter_id: str
    name: str
    description: str
    created_at: datetime

# Sub-Topic Models (Level 5)
class SubTopicCreate(BaseModel):
    topic_id: str
    name: str
    description: str

class SubTopicResponse(BaseModel):
    id: str
    topic_id: str
    name: str
    description: str
    created_at: datetime

# Section Models (Level 6)
class SectionCreate(BaseModel):
    sub_topic_id: str
    name: str
    description: str

class SectionResponse(BaseModel):
    id: str
    sub_topic_id: str
    name: str
    description: str
    created_at: datetime

# Sub-Section Models (Level 7)
class SubSectionCreate(BaseModel):
    section_id: str
    name: str
    description: str

class SubSectionResponse(BaseModel):
    id: str
    section_id: str
    name: str
    description: str
    created_at: datetime

# Question Models (Level 8)
class QuestionCreate(BaseModel):
    sub_section_id: str
    question_text: str
    options: List[str]
    correct_answer: int  # Index of correct option
    difficulty: str  # "easy", "medium", "hard"
    tags: List[str] = []
    explanation: str = ""
    hint: str = ""  # Hint for solving the question
    solution: str = ""  # Detailed solution
    code_snippet: str = ""  # Code example for DSA questions
    image_url: str = ""  # Image URL or base64
    formula: str = ""  # Mathematical formula (LaTeX format)
    # Extended fields for 24-column CSV format
    uid: str = ""  # Unique ID for question
    exam: str = ""  # Exam name (JEE, GATE, UPSC, NEET, NMMS)
    year: str = ""  # Question year
    subject: str = ""  # Subject name
    chapter: str = ""  # Chapter name
    topic: str = ""  # Topic name (optional)
    question_type: str = "MCQ-SC"  # MCQ-SC, MCQ-MC, Integer, TrueFalse, Match, AssertionReason
    answer_choices_count: int = 4  # Number of options
    marks: float = 1.0  # Marks for correct answer
    negative_marks: float = 0.0  # Negative marks for wrong answer
    time_limit_seconds: int = 120  # Time limit per question
    formula_latex: str = ""  # LaTeX formula (same as formula)
    image_alt_text: str = ""  # Alt text for images
    confidence_score: float = 1.0  # AI confidence score (0.0-1.0)
    source_notes: str = ""  # Source information

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

# Test Models
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

# Bookmark Models
class BookmarkCreate(BaseModel):
    question_id: str

class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    question_id: str
    created_at: datetime

# Analytics Models
class AnalyticsResponse(BaseModel):
    user_id: str
    total_tests: int
    average_score: float
    strong_topics: List[Dict[str, Any]]
    weak_topics: List[Dict[str, Any]]
    improvement_suggestions: List[str]

# Push Notification Models
class PushTokenUpdate(BaseModel):
    push_token: str

class SendNotificationRequest(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    target_users: Optional[List[str]] = None  # User IDs, if None sends to all
    exam_id: Optional[str] = None  # Send to users who selected this exam

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTHENTICATION ROUTES ====================

@api_router.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create token
    access_token = create_access_token({"sub": str(result.inserted_id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=str(user_dict["_id"]),
            email=user_dict["email"],
            role=user_dict["role"],
            created_at=user_dict.get("created_at", datetime.utcnow())
        )
    }

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token({"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            role=user["role"],
            created_at=user.get("created_at", datetime.utcnow())
        )
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user.get("created_at", datetime.utcnow())
    )

# ==================== ADMIN ROUTES - EXAMS ====================

@api_router.post("/admin/exams", response_model=ExamResponse)
async def create_exam(exam: ExamCreate, admin: dict = Depends(get_admin_user)):
    exam_dict = {
        **exam.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.exams.insert_one(exam_dict)
    exam_dict["_id"] = result.inserted_id
    
    return ExamResponse(
        id=str(exam_dict["_id"]),
        name=exam_dict["name"],
        description=exam_dict["description"],
        created_at=exam_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/exams", response_model=List[ExamResponse])
async def get_exams(admin: dict = Depends(get_admin_user)):
    exams = await db.exams.find().to_list(1000)
    return [ExamResponse(
        id=str(exam["_id"]),
        name=exam["name"],
        description=exam["description"],
        created_at=exam.get("created_at", datetime.utcnow())
    ) for exam in exams]

@api_router.get("/exams", response_model=List[ExamResponse])
async def get_exams_public():
    exams = await db.exams.find().to_list(1000)
    return [ExamResponse(
        id=str(exam["_id"]),
        name=exam["name"],
        description=exam["description"],
        created_at=exam.get("created_at", datetime.utcnow())
    ) for exam in exams]

@api_router.put("/admin/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, exam: ExamCreate, admin: dict = Depends(get_admin_user)):
    result = await db.exams.update_one(
        {"_id": ObjectId(exam_id)},
        {"$set": exam.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    updated_exam = await db.exams.find_one({"_id": ObjectId(exam_id)})
    return ExamResponse(
        id=str(updated_exam["_id"]),
        name=updated_exam["name"],
        description=updated_exam["description"],
        created_at=updated_exam.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/exams/{exam_id}")
async def delete_exam(exam_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.exams.delete_one({"_id": ObjectId(exam_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"message": "Exam deleted successfully"}

# ==================== ADMIN ROUTES - SUBJECTS ====================

@api_router.post("/admin/subjects", response_model=SubjectResponse)
async def create_subject(subject: SubjectCreate, admin: dict = Depends(get_admin_user)):
    subject_dict = {
        **subject.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.subjects.insert_one(subject_dict)
    subject_dict["_id"] = result.inserted_id
    
    return SubjectResponse(
        id=str(subject_dict["_id"]),
        exam_id=subject_dict["exam_id"],
        name=subject_dict["name"],
        description=subject_dict["description"],
        created_at=subject_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/subjects", response_model=List[SubjectResponse])
async def get_subjects(exam_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"exam_id": exam_id} if exam_id else {}
    subjects = await db.subjects.find(query).to_list(1000)
    return [SubjectResponse(
        id=str(subject["_id"]),
        exam_id=subject["exam_id"],
        name=subject["name"],
        description=subject["description"],
        created_at=subject.get("created_at", datetime.utcnow())
    ) for subject in subjects]

@api_router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects_public(exam_id: Optional[str] = None):
    query = {"exam_id": exam_id} if exam_id else {}
    subjects = await db.subjects.find(query).to_list(1000)
    return [SubjectResponse(
        id=str(subject["_id"]),
        exam_id=subject["exam_id"],
        name=subject["name"],
        description=subject["description"],
        created_at=subject.get("created_at", datetime.utcnow())
    ) for subject in subjects]

@api_router.put("/admin/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: str, subject: SubjectCreate, admin: dict = Depends(get_admin_user)):
    result = await db.subjects.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": subject.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    updated_subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    return SubjectResponse(
        id=str(updated_subject["_id"]),
        exam_id=updated_subject["exam_id"],
        name=updated_subject["name"],
        description=updated_subject["description"],
        created_at=updated_subject.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/subjects/{subject_id}")
async def delete_subject(subject_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.subjects.delete_one({"_id": ObjectId(subject_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}

# ==================== ADMIN ROUTES - CHAPTERS ====================

@api_router.post("/admin/chapters", response_model=ChapterResponse)
async def create_chapter(chapter: ChapterCreate, admin: dict = Depends(get_admin_user)):
    chapter_dict = {
        **chapter.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.chapters.insert_one(chapter_dict)
    chapter_dict["_id"] = result.inserted_id
    
    return ChapterResponse(
        id=str(chapter_dict["_id"]),
        subject_id=chapter_dict["subject_id"],
        name=chapter_dict["name"],
        description=chapter_dict["description"],
        created_at=chapter_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/chapters", response_model=List[ChapterResponse])
async def get_chapters(subject_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"subject_id": subject_id} if subject_id else {}
    chapters = await db.chapters.find(query).to_list(1000)
    return [ChapterResponse(
        id=str(chapter["_id"]),
        subject_id=chapter["subject_id"],
        name=chapter["name"],
        description=chapter["description"],
        created_at=chapter.get("created_at", datetime.utcnow())
    ) for chapter in chapters]

@api_router.get("/chapters", response_model=List[ChapterResponse])
async def get_chapters_public(subject_id: Optional[str] = None):
    query = {"subject_id": subject_id} if subject_id else {}
    chapters = await db.chapters.find(query).to_list(1000)
    return [ChapterResponse(
        id=str(chapter["_id"]),
        subject_id=chapter["subject_id"],
        name=chapter["name"],
        description=chapter["description"],
        created_at=chapter.get("created_at", datetime.utcnow())
    ) for chapter in chapters]

@api_router.put("/admin/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(chapter_id: str, chapter: ChapterCreate, admin: dict = Depends(get_admin_user)):
    result = await db.chapters.update_one(
        {"_id": ObjectId(chapter_id)},
        {"$set": chapter.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    updated_chapter = await db.chapters.find_one({"_id": ObjectId(chapter_id)})
    return ChapterResponse(
        id=str(updated_chapter["_id"]),
        subject_id=updated_chapter["subject_id"],
        name=updated_chapter["name"],
        description=updated_chapter["description"],
        created_at=updated_chapter.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/chapters/{chapter_id}")
async def delete_chapter(chapter_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.chapters.delete_one({"_id": ObjectId(chapter_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return {"message": "Chapter deleted successfully"}

# ==================== ADMIN ROUTES - TOPICS ====================

@api_router.post("/admin/topics", response_model=TopicResponse)
async def create_topic(topic: TopicCreate, admin: dict = Depends(get_admin_user)):
    topic_dict = {
        **topic.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.topics.insert_one(topic_dict)
    topic_dict["_id"] = result.inserted_id
    
    return TopicResponse(
        id=str(topic_dict["_id"]),
        chapter_id=topic_dict["chapter_id"],
        name=topic_dict["name"],
        description=topic_dict["description"],
        created_at=topic_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/topics", response_model=List[TopicResponse])
async def get_topics(chapter_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"chapter_id": chapter_id} if chapter_id else {}
    topics = await db.topics.find(query).to_list(1000)
    return [TopicResponse(
        id=str(topic["_id"]),
        chapter_id=topic["chapter_id"],
        name=topic["name"],
        description=topic["description"],
        created_at=topic.get("created_at", datetime.utcnow())
    ) for topic in topics]

@api_router.get("/topics", response_model=List[TopicResponse])
async def get_topics_public(chapter_id: Optional[str] = None):
    query = {"chapter_id": chapter_id} if chapter_id else {}
    topics = await db.topics.find(query).to_list(1000)
    return [TopicResponse(
        id=str(topic["_id"]),
        chapter_id=topic["chapter_id"],
        name=topic["name"],
        description=topic["description"],
        created_at=topic.get("created_at", datetime.utcnow())
    ) for topic in topics]

@api_router.put("/admin/topics/{topic_id}", response_model=TopicResponse)
async def update_topic(topic_id: str, topic: TopicCreate, admin: dict = Depends(get_admin_user)):
    result = await db.topics.update_one(
        {"_id": ObjectId(topic_id)},
        {"$set": topic.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    updated_topic = await db.topics.find_one({"_id": ObjectId(topic_id)})
    return TopicResponse(
        id=str(updated_topic["_id"]),
        chapter_id=updated_topic["chapter_id"],
        name=updated_topic["name"],
        description=updated_topic["description"],
        created_at=updated_topic.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/topics/{topic_id}")
async def delete_topic(topic_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.topics.delete_one({"_id": ObjectId(topic_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted successfully"}

# ==================== ADMIN ROUTES - SUB-TOPICS ====================

@api_router.post("/admin/sub-topics", response_model=SubTopicResponse)
async def create_sub_topic(sub_topic: SubTopicCreate, admin: dict = Depends(get_admin_user)):
    sub_topic_dict = {
        **sub_topic.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.sub_topics.insert_one(sub_topic_dict)
    sub_topic_dict["_id"] = result.inserted_id
    
    return SubTopicResponse(
        id=str(sub_topic_dict["_id"]),
        topic_id=sub_topic_dict["topic_id"],
        name=sub_topic_dict["name"],
        description=sub_topic_dict["description"],
        created_at=sub_topic_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/sub-topics", response_model=List[SubTopicResponse])
async def get_sub_topics(topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"topic_id": topic_id} if topic_id else {}
    sub_topics = await db.sub_topics.find(query).to_list(1000)
    return [SubTopicResponse(
        id=str(st["_id"]),
        topic_id=st["topic_id"],
        name=st["name"],
        description=st["description"],
        created_at=st.get("created_at", datetime.utcnow())
    ) for st in sub_topics]

@api_router.get("/sub-topics", response_model=List[SubTopicResponse])
async def get_sub_topics_public(topic_id: Optional[str] = None):
    query = {"topic_id": topic_id} if topic_id else {}
    sub_topics = await db.sub_topics.find(query).to_list(1000)
    return [SubTopicResponse(
        id=str(st["_id"]),
        topic_id=st["topic_id"],
        name=st["name"],
        description=st["description"],
        created_at=st.get("created_at", datetime.utcnow())
    ) for st in sub_topics]

@api_router.put("/admin/sub-topics/{sub_topic_id}", response_model=SubTopicResponse)
async def update_sub_topic(sub_topic_id: str, sub_topic: SubTopicCreate, admin: dict = Depends(get_admin_user)):
    result = await db.sub_topics.update_one(
        {"_id": ObjectId(sub_topic_id)},
        {"$set": sub_topic.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-topic not found")
    
    updated_sub_topic = await db.sub_topics.find_one({"_id": ObjectId(sub_topic_id)})
    return SubTopicResponse(
        id=str(updated_sub_topic["_id"]),
        topic_id=updated_sub_topic["topic_id"],
        name=updated_sub_topic["name"],
        description=updated_sub_topic["description"],
        created_at=updated_sub_topic.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/sub-topics/{sub_topic_id}")
async def delete_sub_topic(sub_topic_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.sub_topics.delete_one({"_id": ObjectId(sub_topic_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sub-topic not found")
    return {"message": "Sub-topic deleted successfully"}

# ==================== ADMIN ROUTES - SECTIONS ====================

@api_router.post("/admin/sections", response_model=SectionResponse)
async def create_section(section: SectionCreate, admin: dict = Depends(get_admin_user)):
    section_dict = {
        **section.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.sections.insert_one(section_dict)
    section_dict["_id"] = result.inserted_id
    
    return SectionResponse(
        id=str(section_dict["_id"]),
        sub_topic_id=section_dict["sub_topic_id"],
        name=section_dict["name"],
        description=section_dict["description"],
        created_at=section_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/sections", response_model=List[SectionResponse])
async def get_sections(sub_topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"sub_topic_id": sub_topic_id} if sub_topic_id else {}
    sections = await db.sections.find(query).to_list(1000)
    return [SectionResponse(
        id=str(s["_id"]),
        sub_topic_id=s["sub_topic_id"],
        name=s["name"],
        description=s["description"],
        created_at=s.get("created_at", datetime.utcnow())
    ) for s in sections]

@api_router.get("/sections", response_model=List[SectionResponse])
async def get_sections_public(sub_topic_id: Optional[str] = None):
    query = {"sub_topic_id": sub_topic_id} if sub_topic_id else {}
    sections = await db.sections.find(query).to_list(1000)
    return [SectionResponse(
        id=str(s["_id"]),
        sub_topic_id=s["sub_topic_id"],
        name=s["name"],
        description=s["description"],
        created_at=s.get("created_at", datetime.utcnow())
    ) for s in sections]

@api_router.put("/admin/sections/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, section: SectionCreate, admin: dict = Depends(get_admin_user)):
    result = await db.sections.update_one(
        {"_id": ObjectId(section_id)},
        {"$set": section.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    updated_section = await db.sections.find_one({"_id": ObjectId(section_id)})
    return SectionResponse(
        id=str(updated_section["_id"]),
        sub_topic_id=updated_section["sub_topic_id"],
        name=updated_section["name"],
        description=updated_section["description"],
        created_at=updated_section.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/sections/{section_id}")
async def delete_section(section_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.sections.delete_one({"_id": ObjectId(section_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}

# ==================== ADMIN ROUTES - SUB-SECTIONS ====================

@api_router.post("/admin/sub-sections", response_model=SubSectionResponse)
async def create_sub_section(sub_section: SubSectionCreate, admin: dict = Depends(get_admin_user)):
    sub_section_dict = {
        **sub_section.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.sub_sections.insert_one(sub_section_dict)
    sub_section_dict["_id"] = result.inserted_id
    
    return SubSectionResponse(
        id=str(sub_section_dict["_id"]),
        section_id=sub_section_dict["section_id"],
        name=sub_section_dict["name"],
        description=sub_section_dict["description"],
        created_at=sub_section_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/sub-sections", response_model=List[SubSectionResponse])
async def get_sub_sections(section_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"section_id": section_id} if section_id else {}
    sub_sections = await db.sub_sections.find(query).to_list(1000)
    return [SubSectionResponse(
        id=str(ss["_id"]),
        section_id=ss["section_id"],
        name=ss["name"],
        description=ss["description"],
        created_at=ss.get("created_at", datetime.utcnow())
    ) for ss in sub_sections]

@api_router.get("/sub-sections", response_model=List[SubSectionResponse])
async def get_sub_sections_public(section_id: Optional[str] = None):
    query = {"section_id": section_id} if section_id else {}
    sub_sections = await db.sub_sections.find(query).to_list(1000)
    return [SubSectionResponse(
        id=str(ss["_id"]),
        section_id=ss["section_id"],
        name=ss["name"],
        description=ss["description"],
        created_at=ss.get("created_at", datetime.utcnow())
    ) for ss in sub_sections]

@api_router.put("/admin/sub-sections/{sub_section_id}", response_model=SubSectionResponse)
async def update_sub_section(sub_section_id: str, sub_section: SubSectionCreate, admin: dict = Depends(get_admin_user)):
    result = await db.sub_sections.update_one(
        {"_id": ObjectId(sub_section_id)},
        {"$set": sub_section.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-section not found")
    
    updated_sub_section = await db.sub_sections.find_one({"_id": ObjectId(sub_section_id)})
    return SubSectionResponse(
        id=str(updated_sub_section["_id"]),
        section_id=updated_sub_section["section_id"],
        name=updated_sub_section["name"],
        description=updated_sub_section["description"],
        created_at=updated_sub_section.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/sub-sections/{sub_section_id}")
async def delete_sub_section(sub_section_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.sub_sections.delete_one({"_id": ObjectId(sub_section_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sub-section not found")
    return {"message": "Sub-section deleted successfully"}


# ==================== ADMIN ROUTES - QUESTIONS ====================

@api_router.post("/admin/questions", response_model=QuestionResponse)
async def create_question(question: QuestionCreate, admin: dict = Depends(get_admin_user)):
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
        created_at=question_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/questions", response_model=List[QuestionResponse])
async def get_questions_admin(sub_section_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
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
        created_at=q.get("created_at", datetime.utcnow())
    ) for q in questions]

@api_router.put("/admin/questions/{question_id}", response_model=QuestionResponse)
async def update_question(question_id: str, question: QuestionCreate, admin: dict = Depends(get_admin_user)):
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
        created_at=updated_question.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/questions/{question_id}")
async def delete_question(question_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.questions.delete_one({"_id": ObjectId(question_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}

# ==================== ADMIN ROUTES - BULK UPLOAD ====================

@api_router.post("/admin/questions/bulk-upload")
async def bulk_upload_questions(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
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

# ==================== ADMIN ROUTES - ANALYTICS ====================

@api_router.get("/admin/analytics/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "user"})
    total_questions = await db.questions.count_documents({})
    total_tests = await db.test_results.count_documents({})
    total_exams = await db.exams.count_documents({})
    
    # Get popular topics
    pipeline = [
        {"$group": {"_id": "$topic_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    popular_questions = await db.questions.aggregate(pipeline).to_list(5)
    
    return {
        "total_users": total_users,
        "total_questions": total_questions,
        "total_tests": total_tests,
        "total_exams": total_exams,
        "popular_questions_by_topic": popular_questions
    }

# ==================== USER ROUTES - QUESTIONS ====================

@api_router.get("/questions", response_model=List[QuestionResponse])
async def get_questions(
    sub_section_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 50
):
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
        created_at=q.get("created_at", datetime.utcnow())
    ) for q in questions]

# ==================== USER ROUTES - TESTS ====================

@api_router.post("/tests/submit", response_model=TestResultResponse)
async def submit_test(submission: TestSubmission, current_user: dict = Depends(get_current_user)):
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
    
    # Calculate percentile (simplified - compare with all tests)
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

@api_router.get("/tests/history", response_model=List[TestResultResponse])
async def get_test_history(current_user: dict = Depends(get_current_user)):
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

# ==================== USER ROUTES - BOOKMARKS ====================

@api_router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(bookmark: BookmarkCreate, current_user: dict = Depends(get_current_user)):
    # Check if already bookmarked
    existing = await db.bookmarks.find_one({
        "user_id": str(current_user["_id"]),
        "question_id": bookmark.question_id
    })
    
    if existing:
        return BookmarkResponse(
            id=str(existing["_id"]),
            user_id=existing["user_id"],
            question_id=existing["question_id"],
            created_at=existing.get("created_at", datetime.utcnow())
        )
    
    bookmark_dict = {
        "user_id": str(current_user["_id"]),
        "question_id": bookmark.question_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.bookmarks.insert_one(bookmark_dict)
    bookmark_dict["_id"] = result.inserted_id
    
    return BookmarkResponse(
        id=str(bookmark_dict["_id"]),
        user_id=bookmark_dict["user_id"],
        question_id=bookmark_dict["question_id"],
        created_at=bookmark_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    bookmarks = await db.bookmarks.find({"user_id": str(current_user["_id"])}).to_list(1000)
    
    return [BookmarkResponse(
        id=str(b["_id"]),
        user_id=b["user_id"],
        question_id=b["question_id"],
        created_at=b.get("created_at", datetime.utcnow())
    ) for b in bookmarks]

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.bookmarks.delete_one({
        "_id": ObjectId(bookmark_id),
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark deleted successfully"}

# ==================== USER ROUTES - ANALYTICS & AI ====================

@api_router.get("/analytics/performance", response_model=AnalyticsResponse)
async def get_user_analytics(current_user: dict = Depends(get_current_user)):
    # Get all test results for user
    results = await db.test_results.find({"user_id": str(current_user["_id"])}).to_list(1000)
    
    if not results:
        return AnalyticsResponse(
            user_id=str(current_user["_id"]),
            total_tests=0,
            average_score=0.0,
            strong_topics=[],
            weak_topics=[],
            improvement_suggestions=[]
        )
    
    # Calculate average score
    total_tests = len(results)
    average_score = sum(r["score"] for r in results) / total_tests
    
    # Analyze topic-wise performance
    topic_performance = {}
    
    for result in results:
        for q in result["questions"]:
            question = await db.questions.find_one({"_id": ObjectId(q["question_id"])})
            if question:
                topic_id = question["topic_id"]
                if topic_id not in topic_performance:
                    topic_performance[topic_id] = {"correct": 0, "total": 0}
                
                topic_performance[topic_id]["total"] += 1
                if q["is_correct"]:
                    topic_performance[topic_id]["correct"] += 1
    
    # Calculate percentages and identify strong/weak topics
    topic_scores = []
    for topic_id, performance in topic_performance.items():
        percentage = (performance["correct"] / performance["total"]) * 100
        topic = await db.topics.find_one({"_id": ObjectId(topic_id)})
        
        if topic:
            topic_scores.append({
                "topic_id": topic_id,
                "topic_name": topic["name"],
                "percentage": percentage,
                "correct": performance["correct"],
                "total": performance["total"]
            })
    
    topic_scores.sort(key=lambda x: x["percentage"], reverse=True)
    
    strong_topics = topic_scores[:3]
    weak_topics = topic_scores[-3:]
    
    # Generate AI suggestions using Gemini
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Analyze this student's performance and provide 3-5 personalized improvement suggestions:
        
        Total Tests: {total_tests}
        Average Score: {average_score:.2f}%
        
        Strong Topics: {', '.join([t['topic_name'] for t in strong_topics])}
        Weak Topics: {', '.join([t['topic_name'] for t in weak_topics])}
        
        Provide actionable, specific recommendations for improvement. Format as a bullet-point list.
        """
        
        response = model.generate_content(prompt)
        suggestions = response.text.strip().split('\n')
        suggestions = [s.strip('- ').strip() for s in suggestions if s.strip()]
    except Exception as e:
        suggestions = [
            f"Focus more on weak topics: {', '.join([t['topic_name'] for t in weak_topics])}",
            "Practice more questions regularly",
            "Review explanations for incorrect answers"
        ]
    
    return AnalyticsResponse(
        user_id=str(current_user["_id"]),
        total_tests=total_tests,
        average_score=average_score,
        strong_topics=strong_topics,
        weak_topics=weak_topics,
        improvement_suggestions=suggestions[:5]
    )

@api_router.get("/recommendations/tests")
async def get_test_recommendations(current_user: dict = Depends(get_current_user)):
    # Get user's weak topics
    analytics = await get_user_analytics(current_user)
    
    if not analytics.weak_topics:
        # If no history, recommend popular topics
        popular_topics = await db.topics.find().limit(5).to_list(5)
        return {
            "message": "Get started with these popular topics",
            "recommended_topics": [
                {
                    "topic_id": str(t["_id"]),
                    "topic_name": t["name"],
                    "reason": "Popular among students"
                } for t in popular_topics
            ]
        }
    
    # Recommend practice on weak topics
    recommendations = []
    for weak_topic in analytics.weak_topics:
        recommendations.append({
            "topic_id": weak_topic["topic_id"],
            "topic_name": weak_topic["topic_name"],
            "reason": f"Practice needed - Current accuracy: {weak_topic['percentage']:.1f}%",
            "current_performance": weak_topic["percentage"]
        })
    
    return {
        "message": "Based on your performance, we recommend focusing on these topics",
        "recommended_topics": recommendations
    }

# ==================== LEADERBOARD ====================

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    # Aggregate to get average scores per user
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "average_score": {"$avg": "$score"},
            "total_tests": {"$sum": 1}
        }},
        {"$sort": {"average_score": -1}},
        {"$limit": limit}
    ]
    
    leaderboard_data = await db.test_results.aggregate(pipeline).to_list(limit)
    
    # Get user details
    leaderboard = []
    for idx, entry in enumerate(leaderboard_data):
        user = await db.users.find_one({"_id": ObjectId(entry["_id"])})
        if user:
            leaderboard.append({
                "rank": idx + 1,
                "user_email": user["email"],
                "average_score": round(entry["average_score"], 2),
                "total_tests": entry["total_tests"]
            })
    
    return leaderboard

# ==================== PASSWORD RESET ====================

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str
    reset_code: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Request password reset - generates a reset code"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate a simple reset code (in production, send via email)
    import random
    import string
    reset_code = ''.join(random.choices(string.digits, k=6))
    
    # Store reset code in database (expires in 15 minutes)
    await db.password_resets.update_one(
        {"email": request.email},
        {
            "$set": {
                "reset_code": reset_code,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(minutes=15)
            }
        },
        upsert=True
    )
    
    # In production, send email here
    # For MVP, return code for testing (remove in production)
    return {
        "message": "Reset code generated",
        "reset_code": reset_code  # Remove this in production
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: PasswordReset):
    """Reset password using the reset code"""
    # Verify reset code
    reset_entry = await db.password_resets.find_one({
        "email": request.email,
        "reset_code": request.reset_code
    })
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check if expired
    if reset_entry["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code has expired")
    
    # Update password
    hashed_password = pwd_context.hash(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password": hashed_password}}
    )
    
    # Delete reset code
    await db.password_resets.delete_one({"email": request.email})
    
    return {"message": "Password reset successful"}

# ==================== PROFILE UPDATE ====================

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None  # base64 image

@api_router.put("/profile", response_model=UserResponse)
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_data = {}
    
    if profile.name:
        update_data["name"] = profile.name
    
    if profile.email and profile.email != current_user["email"]:
        # Check if email already exists
        existing = await db.users.find_one({"email": profile.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = profile.email
    
    if profile.avatar:
        update_data["avatar"] = profile.avatar
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        role=updated_user["role"],
        created_at=updated_user.get("created_at", datetime.utcnow())
    )

# ==================== SEARCH & FILTER ====================

@api_router.get("/search/hierarchy")
async def search_hierarchy(
    query: str,
    level: Optional[str] = None,  # exam, subject, chapter, topic, etc.
    exam_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Search across the hierarchy"""
    results = {
        "exams": [],
        "subjects": [],
        "chapters": [],
        "topics": [],
        "sub_topics": [],
        "sections": [],
        "sub_sections": [],
        "questions": []
    }
    
    search_filter = {"name": {"$regex": query, "$options": "i"}}
    
    # Search exams
    if not level or level == "exam":
        exams = await db.exams.find(search_filter).to_list(10)
        results["exams"] = [{"id": str(e["_id"]), "name": e["name"]} for e in exams]
    
    # Search subjects
    if not level or level == "subject":
        subject_filter = search_filter.copy()
        if exam_id:
            subject_filter["exam_id"] = exam_id
        subjects = await db.subjects.find(subject_filter).to_list(10)
        results["subjects"] = [{"id": str(s["_id"]), "name": s["name"]} for s in subjects]
    
    # Search chapters
    if not level or level == "chapter":
        chapter_filter = search_filter.copy()
        if subject_id:
            chapter_filter["subject_id"] = subject_id
        chapters = await db.chapters.find(chapter_filter).to_list(10)
        results["chapters"] = [{"id": str(c["_id"]), "name": c["name"]} for c in chapters]
    
    # Similar for other levels...
    
    return results

# ==================== BATCH BOOKMARKS ====================

class BatchBookmarkRequest(BaseModel):
    question_ids: List[str]
    action: str  # "add" or "remove"

@api_router.post("/bookmarks/batch")
async def batch_bookmark_operation(request: BatchBookmarkRequest, current_user: dict = Depends(get_current_user)):
    """Add or remove multiple bookmarks at once"""
    user_id = str(current_user["_id"])
    
    if request.action == "add":
        # Add bookmarks
        for question_id in request.question_ids:
            # Check if bookmark already exists
            existing = await db.bookmarks.find_one({
                "user_id": user_id,
                "question_id": question_id
            })
            if not existing:
                await db.bookmarks.insert_one({
                    "user_id": user_id,
                    "question_id": question_id,
                    "created_at": datetime.utcnow()
                })
        return {"message": f"Added {len(request.question_ids)} bookmarks"}
    
    elif request.action == "remove":
        # Remove bookmarks
        await db.bookmarks.delete_many({
            "user_id": user_id,
            "question_id": {"$in": request.question_ids}
        })
        return {"message": f"Removed {len(request.question_ids)} bookmarks"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'add' or 'remove'")

# ==================== ENHANCED ANALYTICS ====================

@api_router.get("/analytics/difficulty-breakdown")
async def get_difficulty_breakdown(current_user: dict = Depends(get_current_user)):
    """Get performance breakdown by difficulty level"""
    user_id = str(current_user["_id"])
    
    # Get all test results
    results = await db.test_results.find({"user_id": user_id}).to_list(None)
    
    difficulty_stats = {
        "easy": {"correct": 0, "total": 0},
        "medium": {"correct": 0, "total": 0},
        "hard": {"correct": 0, "total": 0}
    }
    
    for result in results:
        for q in result["questions"]:
            question = await db.questions.find_one({"_id": ObjectId(q["question_id"])})
            if question:
                difficulty = question["difficulty"]
                difficulty_stats[difficulty]["total"] += 1
                if q["is_correct"]:
                    difficulty_stats[difficulty]["correct"] += 1
    
    # Calculate percentages
    breakdown = []
    for diff, stats in difficulty_stats.items():
        if stats["total"] > 0:
            percentage = (stats["correct"] / stats["total"]) * 100
        else:
            percentage = 0
        
        breakdown.append({
            "difficulty": diff,
            "correct": stats["correct"],
            "total": stats["total"],
            "percentage": round(percentage, 2)
        })
    
    return {"difficulty_breakdown": breakdown}

# ==================== ENHANCED LEADERBOARD ====================

@api_router.get("/leaderboard/filtered")
async def get_filtered_leaderboard(
    scope: str = "global",  # global, exam, subject
    scope_id: Optional[str] = None,
    period: str = "all_time",  # all_time, weekly, monthly
    limit: int = 50
):
    """Get leaderboard with filters"""
    
    # Build date filter for period
    date_filter = {}
    if period == "weekly":
        week_ago = datetime.utcnow() - timedelta(days=7)
        date_filter = {"timestamp": {"$gte": week_ago}}
    elif period == "monthly":
        month_ago = datetime.utcnow() - timedelta(days=30)
        date_filter = {"timestamp": {"$gte": month_ago}}
    
    # Build scope filter
    # For MVP, we'll use global scope
    # In full implementation, filter by exam/subject questions
    
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": "$user_id",
            "average_score": {"$avg": "$score"},
            "total_tests": {"$sum": 1}
        }},
        {"$sort": {"average_score": -1}},
        {"$limit": limit}
    ]
    
    leaderboard_data = await db.test_results.aggregate(pipeline).to_list(limit)
    
    # Get user details
    leaderboard = []
    for idx, entry in enumerate(leaderboard_data):
        user = await db.users.find_one({"_id": ObjectId(entry["_id"])})
        if user:
            leaderboard.append({
                "rank": idx + 1,
                "user_id": str(user["_id"]),
                "user_email": user["email"],
                "user_name": user.get("name", user["email"].split("@")[0]),
                "average_score": round(entry["average_score"], 2),
                "total_tests": entry["total_tests"]
            })
    
    # Calculate percentile for current user
    total_users = len(leaderboard)
    
    return {
        "leaderboard": leaderboard,
        "total_users": total_users,
        "period": period,
        "scope": scope
    }

# ==================== FILTERED QUESTIONS ====================

@api_router.get("/questions/filtered")
async def get_filtered_questions(
    sub_section_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    bookmarked: Optional[bool] = None,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get questions with filters"""
    query = {}
    
    if sub_section_id:
        query["sub_section_id"] = sub_section_id
    
    if difficulty:
        query["difficulty"] = difficulty
    
    questions = await db.questions.find(query).limit(limit).to_list(limit)
    
    # If bookmarked filter is applied
    if bookmarked is not None:
        user_id = str(current_user["_id"])
        bookmarked_questions = await db.bookmarks.find({"user_id": user_id}).to_list(None)
        bookmarked_ids = {b["question_id"] for b in bookmarked_questions}
        
        if bookmarked:
            # Only include bookmarked questions
            questions = [q for q in questions if str(q["_id"]) in bookmarked_ids]
        else:
            # Exclude bookmarked questions
            questions = [q for q in questions if str(q["_id"]) not in bookmarked_ids]
    
    return [
        QuestionResponse(
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
            created_at=q.get("created_at", datetime.utcnow())
        ) for q in questions
    ]

# ==================== SYLLABUS MANAGEMENT ====================

class SyllabusCreate(BaseModel):
    exam_id: str
    title: str
    content: str  # Detailed syllabus content
    ai_generated: bool = False

class SyllabusResponse(BaseModel):
    id: str
    exam_id: str
    title: str
    content: str
    ai_generated: bool
    created_at: datetime

@api_router.post("/admin/syllabus", response_model=SyllabusResponse)
async def create_syllabus(syllabus: SyllabusCreate, admin: dict = Depends(get_admin_user)):
    syllabus_dict = {
        **syllabus.dict(),
        "created_at": datetime.utcnow()
    }
    result = await db.syllabuses.insert_one(syllabus_dict)
    syllabus_dict["_id"] = result.inserted_id
    
    return SyllabusResponse(
        id=str(syllabus_dict["_id"]),
        exam_id=syllabus_dict["exam_id"],
        title=syllabus_dict["title"],
        content=syllabus_dict["content"],
        ai_generated=syllabus_dict["ai_generated"],
        created_at=syllabus_dict.get("created_at", datetime.utcnow())
    )

@api_router.get("/admin/syllabus", response_model=List[SyllabusResponse])
async def get_syllabuses(exam_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"exam_id": exam_id} if exam_id else {}
    syllabuses = await db.syllabuses.find(query).to_list(1000)
    return [SyllabusResponse(
        id=str(s["_id"]),
        exam_id=s["exam_id"],
        title=s["title"],
        content=s["content"],
        ai_generated=s.get("ai_generated", False),
        created_at=s.get("created_at", datetime.utcnow())
    ) for s in syllabuses]

@api_router.get("/syllabus", response_model=List[SyllabusResponse])
async def get_syllabuses_public(exam_id: Optional[str] = None):
    query = {"exam_id": exam_id} if exam_id else {}
    syllabuses = await db.syllabuses.find(query).to_list(1000)
    return [SyllabusResponse(
        id=str(s["_id"]),
        exam_id=s["exam_id"],
        title=s["title"],
        content=s["content"],
        ai_generated=s.get("ai_generated", False),
        created_at=s.get("created_at", datetime.utcnow())
    ) for s in syllabuses]

@api_router.put("/admin/syllabus/{syllabus_id}", response_model=SyllabusResponse)
async def update_syllabus(syllabus_id: str, syllabus: SyllabusCreate, admin: dict = Depends(get_admin_user)):
    result = await db.syllabuses.update_one(
        {"_id": ObjectId(syllabus_id)},
        {"$set": syllabus.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    updated_syllabus = await db.syllabuses.find_one({"_id": ObjectId(syllabus_id)})
    return SyllabusResponse(
        id=str(updated_syllabus["_id"]),
        exam_id=updated_syllabus["exam_id"],
        title=updated_syllabus["title"],
        content=updated_syllabus["content"],
        ai_generated=updated_syllabus.get("ai_generated", False),
        created_at=updated_syllabus.get("created_at", datetime.utcnow())
    )

@api_router.delete("/admin/syllabus/{syllabus_id}")
async def delete_syllabus(syllabus_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.syllabuses.delete_one({"_id": ObjectId(syllabus_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return {"message": "Syllabus deleted successfully"}

@api_router.post("/admin/syllabus/generate-ai")
async def generate_syllabus_ai(exam_name: str, admin: dict = Depends(get_admin_user)):
    """Generate syllabus using Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Generate a comprehensive syllabus for the {exam_name} examination. 
        Include:
        1. Overview of the exam
        2. Subject-wise breakdown
        3. Important topics for each subject
        4. Recommended study approach
        5. Key areas to focus on
        
        Format the response in a clear, structured manner with sections and bullet points.
        """
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        return {
            "success": True,
            "exam_name": exam_name,
            "generated_content": content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# ==================== PUSH NOTIFICATIONS ====================

class PushTokenCreate(BaseModel):
    token: str
    device_type: str = "android"  # or "ios"

class NotificationCreate(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    target_users: Optional[List[str]] = None  # User IDs, None for all users
    exam_id: Optional[str] = None  # Target users of specific exam

@api_router.post("/notifications/register-token")
async def register_push_token(token_data: PushTokenCreate, current_user: dict = Depends(get_current_user)):
    """Register Expo push notification token for user"""
    await db.push_tokens.update_one(
        {"user_id": str(current_user["_id"])},
        {
            "$set": {
                "token": token_data.token,
                "device_type": token_data.device_type,
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    return {"message": "Push token registered successfully"}

@api_router.post("/admin/notifications/send")
async def send_notification(notification: NotificationCreate, admin: dict = Depends(get_admin_user)):
    """Send push notification to users"""
    import requests
    
    # Get target tokens
    query = {}
    if notification.target_users:
        query["user_id"] = {"$in": notification.target_users}
    
    tokens = await db.push_tokens.find(query).to_list(None)
    
    # If exam_id specified, filter by users who have taken tests for that exam
    if notification.exam_id and not notification.target_users:
        # Get users who have taken tests (simplified - in production, link tests to exams)
        user_ids = set()
        test_results = await db.test_results.find().to_list(None)
        user_ids = {r["user_id"] for r in test_results}
        tokens = [t for t in tokens if t["user_id"] in user_ids]
    
    # Prepare Expo push notifications
    expo_messages = []
    for token_doc in tokens:
        if token_doc["token"].startswith("ExponentPushToken"):
            message = {
                "to": token_doc["token"],
                "title": notification.title,
                "body": notification.body,
                "data": notification.data or {},
                "sound": "default"
            }
            expo_messages.append(message)
    
    # Send to Expo Push API
    if expo_messages:
        try:
            response = requests.post(
                "https://exp.host/--/api/v2/push/send",
                json=expo_messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            
            # Store notification in database
            notification_doc = {
                "title": notification.title,
                "body": notification.body,
                "data": notification.data,
                "target_users": notification.target_users,
                "exam_id": notification.exam_id,
                "sent_count": len(expo_messages),
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notification_doc)
            
            return {
                "success": True,
                "sent_count": len(expo_messages),
                "message": f"Notification sent to {len(expo_messages)} devices"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")
    
    return {"success": False, "message": "No valid push tokens found"}

@api_router.get("/notifications/history")
async def get_notification_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    """Get notification history for user"""
    notifications = await db.notifications.find({
        "$or": [
            {"target_users": None},  # Global notifications
            {"target_users": str(current_user["_id"])}
        ]
    }).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [
        {
            "id": str(n["_id"]),
            "title": n["title"],
            "body": n["body"],
            "data": n.get("data"),
            "created_at": n["created_at"]
        } for n in notifications
    ]

# ==================== PRACTICE MODE ====================

class PracticeSessionSubmit(BaseModel):
    question_id: str
    user_answer: int
    is_correct: bool

@api_router.post("/practice/check-answer")
async def check_practice_answer(
    question_id: str,
    user_answer: int,
    current_user: dict = Depends(get_current_user)
):
    """Check answer during practice mode"""
    question = await db.questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = user_answer == question["correct_answer"]
    
    # Store practice attempt
    practice_doc = {
        "user_id": str(current_user["_id"]),
        "question_id": question_id,
        "user_answer": user_answer,
        "correct_answer": question["correct_answer"],
        "is_correct": is_correct,
        "timestamp": datetime.utcnow()
    }
    await db.practice_attempts.insert_one(practice_doc)
    
    return {
        "is_correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question.get("explanation", ""),
        "options": question["options"]
    }

@api_router.get("/practice/history")
async def get_practice_history(current_user: dict = Depends(get_current_user), limit: int = 50):
    """Get practice history for user"""
    attempts = await db.practice_attempts.find(
        {"user_id": str(current_user["_id"])}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return attempts

# ==================== ENHANCED ANALYTICS ====================

@api_router.get("/analytics/subject-wise")
async def get_subject_wise_analytics(current_user: dict = Depends(get_current_user)):
    """Get subject-wise performance analytics"""
    # Get all test results
    results = await db.test_results.find({"user_id": str(current_user["_id"])}).to_list(None)
    
    subject_performance = {}
    
    for result in results:
        for q in result["questions"]:
            question = await db.questions.find_one({"_id": ObjectId(q["question_id"])})
            if question:
                # Traverse up to find subject
                sub_section = await db.sub_sections.find_one({"_id": ObjectId(question["sub_section_id"])})
                if sub_section:
                    section = await db.sections.find_one({"_id": ObjectId(sub_section["section_id"])})
                    if section:
                        sub_topic = await db.sub_topics.find_one({"_id": ObjectId(section["sub_topic_id"])})
                        if sub_topic:
                            topic = await db.topics.find_one({"_id": ObjectId(sub_topic["topic_id"])})
                            if topic:
                                chapter = await db.chapters.find_one({"_id": ObjectId(topic["chapter_id"])})
                                if chapter:
                                    subject = await db.subjects.find_one({"_id": ObjectId(chapter["subject_id"])})
                                    if subject:
                                        subject_id = str(subject["_id"])
                                        if subject_id not in subject_performance:
                                            subject_performance[subject_id] = {
                                                "subject_name": subject["name"],
                                                "correct": 0,
                                                "total": 0
                                            }
                                        
                                        subject_performance[subject_id]["total"] += 1
                                        if q["is_correct"]:
                                            subject_performance[subject_id]["correct"] += 1
    
    # Calculate percentages
    result_data = []
    for subject_id, perf in subject_performance.items():
        percentage = (perf["correct"] / perf["total"]) * 100 if perf["total"] > 0 else 0
        result_data.append({
            "subject_id": subject_id,
            "subject_name": perf["subject_name"],
            "correct": perf["correct"],
            "total": perf["total"],
            "percentage": round(percentage, 2)
        })
    
    result_data.sort(key=lambda x: x["percentage"], reverse=True)
    return {"subject_wise_performance": result_data}

@api_router.get("/analytics/chapter-wise")
async def get_chapter_wise_analytics(subject_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get chapter-wise performance analytics"""
    results = await db.test_results.find({"user_id": str(current_user["_id"])}).to_list(None)
    
    chapter_performance = {}
    
    for result in results:
        for q in result["questions"]:
            question = await db.questions.find_one({"_id": ObjectId(q["question_id"])})
            if question:
                # Traverse up to find chapter
                sub_section = await db.sub_sections.find_one({"_id": ObjectId(question["sub_section_id"])})
                if sub_section:
                    section = await db.sections.find_one({"_id": ObjectId(sub_section["section_id"])})
                    if section:
                        sub_topic = await db.sub_topics.find_one({"_id": ObjectId(section["sub_topic_id"])})
                        if sub_topic:
                            topic = await db.topics.find_one({"_id": ObjectId(sub_topic["topic_id"])})
                            if topic:
                                chapter = await db.chapters.find_one({"_id": ObjectId(topic["chapter_id"])})
                                if chapter:
                                    # Filter by subject if specified
                                    if subject_id and chapter["subject_id"] != subject_id:
                                        continue
                                    
                                    chapter_id = str(chapter["_id"])
                                    if chapter_id not in chapter_performance:
                                        chapter_performance[chapter_id] = {
                                            "chapter_name": chapter["name"],
                                            "subject_id": chapter["subject_id"],
                                            "correct": 0,
                                            "total": 0
                                        }
                                    
                                    chapter_performance[chapter_id]["total"] += 1
                                    if q["is_correct"]:
                                        chapter_performance[chapter_id]["correct"] += 1
    
    # Calculate percentages
    result_data = []
    for chapter_id, perf in chapter_performance.items():
        percentage = (perf["correct"] / perf["total"]) * 100 if perf["total"] > 0 else 0
        result_data.append({
            "chapter_id": chapter_id,
            "chapter_name": perf["chapter_name"],
            "subject_id": perf["subject_id"],
            "correct": perf["correct"],
            "total": perf["total"],
            "percentage": round(percentage, 2)
        })
    
    result_data.sort(key=lambda x: x["percentage"], reverse=True)
    return {"chapter_wise_performance": result_data}

@api_router.get("/analytics/export")
async def export_analytics(format: str = "json", current_user: dict = Depends(get_current_user)):
    """Export user analytics data"""
    # Get all data
    test_results = await db.test_results.find({"user_id": str(current_user["_id"])}).to_list(None)
    analytics = await get_user_analytics(current_user)
    subject_analytics = await get_subject_wise_analytics(current_user)
    
    export_data = {
        "user_id": str(current_user["_id"]),
        "user_email": current_user["email"],
        "total_tests": len(test_results),
        "average_score": analytics.average_score,
        "strong_topics": analytics.strong_topics,
        "weak_topics": analytics.weak_topics,
        "subject_wise_performance": subject_analytics["subject_wise_performance"],
        "test_history": [
            {
                "test_id": str(r["_id"]),
                "score": r["score"],
                "total_questions": r["total_questions"],
                "correct_answers": r["correct_answers"],
                "percentile": r["percentile"],
                "timestamp": r["timestamp"].isoformat()
            } for r in test_results
        ],
        "exported_at": datetime.utcnow().isoformat()
    }
    
    if format == "csv":
        # Convert to CSV format (simplified)
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(["Test ID", "Score", "Total Questions", "Correct Answers", "Percentile", "Timestamp"])
        
        # Write test data
        for test in export_data["test_history"]:
            writer.writerow([
                test["test_id"],
                test["score"],
                test["total_questions"],
                test["correct_answers"],
                test["percentile"],
                test["timestamp"]
            ])
        
        return {"format": "csv", "data": output.getvalue()}
    
    return {"format": "json", "data": export_data}

# ==================== EXCEL UPLOAD SUPPORT ====================

@api_router.post("/admin/questions/bulk-upload-excel")
async def bulk_upload_questions_excel(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    """Bulk upload questions from Excel file"""
    try:
        contents = await file.read()
        
        # Check file extension
        if file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="File must be CSV or Excel (.xlsx, .xls)")
        
        # Expected columns: sub_section_id, question_text, option1, option2, option3, option4, correct_answer, difficulty, tags, explanation
        required_columns = ["sub_section_id", "question_text", "option1", "option2", "option3", "option4", "correct_answer", "difficulty"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"File must contain columns: {required_columns}")
        
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
                "created_at": datetime.utcnow()
            }
            questions.append(question_dict)
        
        if questions:
            result = await db.questions.insert_many(questions)
            return {
                "success": True,
                "message": f"Successfully uploaded {len(result.inserted_ids)} questions",
                "count": len(result.inserted_ids)
            }
        else:
            raise HTTPException(status_code=400, detail="No valid questions found in file")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

# ==================== AI TOOLS ENHANCEMENT ====================

@api_router.post("/admin/ai/generate-questions")
async def generate_questions_ai(
    topic_name: str,
    difficulty: str,
    count: int = 5,
    admin: dict = Depends(get_admin_user)
):
    """Generate questions using Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Generate {count} multiple-choice questions for the topic: {topic_name}
        Difficulty level: {difficulty}
        
        For each question, provide:
        1. Question text
        2. Four options (A, B, C, D)
        3. Correct answer (letter)
        4. Brief explanation
        
        Format as JSON array with fields: question_text, options, correct_answer_index, explanation
        """
        
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "topic_name": topic_name,
            "difficulty": difficulty,
            "generated_content": response.text.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@api_router.post("/admin/ai/improve-question")
async def improve_question_ai(
    question_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Improve an existing question using AI"""
    question = await db.questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Improve this multiple-choice question:
        
        Question: {question['question_text']}
        Options: {', '.join(question['options'])}
        Correct Answer: {question['options'][question['correct_answer']]}
        
        Provide:
        1. Improved question text (clearer, more precise)
        2. Better options (if needed)
        3. Enhanced explanation
        
        Format as JSON with fields: improved_question, improved_options, improved_explanation
        """
        
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "original_question": question["question_text"],
            "suggestions": response.text.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI improvement failed: {str(e)}")

@api_router.post("/admin/ai/analyze-question")
async def analyze_question_ai(
    question_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Analyze question quality using AI"""
    question = await db.questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Analyze this multiple-choice question for quality:
        
        Question: {question['question_text']}
        Options: {', '.join(question['options'])}
        Difficulty: {question['difficulty']}
        
        Provide analysis on:
        1. Question clarity
        2. Option quality (are they distinct and plausible?)
        3. Difficulty appropriateness
        4. Potential improvements
        5. Common student mistakes
        
        Format as structured feedback.
        """
        
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "question_id": question_id,
            "analysis": response.text.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# ==================== ADMIN ANALYTICS ENHANCED ====================

@api_router.get("/admin/analytics/detailed")
async def get_detailed_admin_analytics(
    exam_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get detailed admin analytics with filters"""
    
    # Build date filter
    date_filter = {}
    if date_from:
        date_filter["$gte"] = datetime.fromisoformat(date_from)
    if date_to:
        date_filter["$lte"] = datetime.fromisoformat(date_to)
    
    test_query = {}
    if date_filter:
        test_query["timestamp"] = date_filter
    
    # Get basic counts
    total_users = await db.users.count_documents({"role": "user"})
    total_questions = await db.questions.count_documents({})
    total_tests = await db.test_results.count_documents(test_query)
    total_exams = await db.exams.count_documents({})
    
    # Get test statistics
    test_results = await db.test_results.find(test_query).to_list(None)
    
    if test_results:
        avg_score = sum(r["score"] for r in test_results) / len(test_results)
        avg_time_per_test = len(test_results) / max(1, (datetime.utcnow() - test_results[0]["timestamp"]).days)
    else:
        avg_score = 0
        avg_time_per_test = 0
    
    # Popular subjects
    subject_popularity = {}
    for result in test_results:
        for q in result.get("questions", []):
            question = await db.questions.find_one({"_id": ObjectId(q["question_id"])})
            if question:
                # Get subject (simplified traversal)
                sub_section = await db.sub_sections.find_one({"_id": ObjectId(question["sub_section_id"])})
                if sub_section:
                    section = await db.sections.find_one({"_id": ObjectId(sub_section["section_id"])})
                    if section:
                        sub_topic = await db.sub_topics.find_one({"_id": ObjectId(section["sub_topic_id"])})
                        if sub_topic:
                            topic = await db.topics.find_one({"_id": ObjectId(sub_topic["topic_id"])})
                            if topic:
                                chapter = await db.chapters.find_one({"_id": ObjectId(topic["chapter_id"])})
                                if chapter:
                                    subject_id_key = chapter["subject_id"]
                                    subject_popularity[subject_id_key] = subject_popularity.get(subject_id_key, 0) + 1
    
    popular_subjects = sorted(subject_popularity.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_users": total_users,
        "total_questions": total_questions,
        "total_tests": total_tests,
        "total_exams": total_exams,
        "average_score": round(avg_score, 2),
        "tests_per_day": round(avg_time_per_test, 2),
        "popular_subjects": [
            {"subject_id": subj_id, "test_count": count}
            for subj_id, count in popular_subjects
        ],
        "date_range": {
            "from": date_from,
            "to": date_to
        }
    }

# ==================== AI CSV GENERATION ====================

@api_router.post("/admin/ai/generate-csv")
async def generate_questions_csv_ai(
    exam: str,
    subjects: List[str],
    questions_per_subject: int = 40,
    admin: dict = Depends(get_admin_user)
):
    """Generate questions in 24-column CSV format using Gemini AI with tips and tricks"""
    try:
        import uuid
        import json
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        all_questions = []
        
        # Subject-specific chapter mappings for realistic questions
        subject_chapters = {
            "Physics": ["Mechanics", "Thermodynamics", "Optics", "Electromagnetism"],
            "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
            "Mathematics": ["Calculus", "Algebra", "Trigonometry", "Coordinate Geometry"],
            "History": ["Ancient History", "Medieval History", "Modern History"],
            "Geography": ["Physical Geography", "Human Geography", "Economic Geography"],
            "Biology": ["Cell Biology", "Genetics", "Ecology", "Human Physiology"],
            "Electrical": ["Circuit Theory", "Power Systems", "Control Systems", "Machines"],
            "Computer Science": ["Data Structures", "Algorithms", "DBMS", "Operating Systems"],
            "General Studies": ["Polity", "Economy", "Environment", "Current Affairs"]
        }
        
        for subject in subjects:
            chapters = subject_chapters.get(subject, ["Core Concepts", "Advanced Topics", "Applications"])
            
            # Distribute questions across chapters
            questions_per_chapter = questions_per_subject // len(chapters)
            
            for chapter in chapters:
                prompt = f"""
                Generate {questions_per_chapter} competitive exam questions for {exam} - {subject} - {chapter}.
                
                Requirements:
                1. Mix of difficulty: 30% Easy, 50% Medium, 20% Hard
                2. Use previous years' question style (2018-2024)
                3. Include SHORT explanations with TIME-SAVING TRICKS and SHORTCUTS
                4. Add LaTeX formulas where applicable (use $...$ or $$...$$)
                5. Each question must be realistic and exam-worthy
                
                Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
                [
                  {{
                    "question_text": "The question text here",
                    "option_a": "First option",
                    "option_b": "Second option", 
                    "option_c": "Third option",
                    "option_d": "Fourth option",
                    "correct_answer": "A",
                    "difficulty": "easy",
                    "explanation": "Short explanation with TRICK: [mention shortcut/tip]",
                    "formula_latex": "$formula here$",
                    "year": "2023",
                    "topic": "Specific topic name",
                    "tags": "tag1,tag2"
                  }}
                ]
                """
                
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                
                # Clean response - remove markdown code blocks if present
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                response_text = response_text.strip()
                
                try:
                    questions_data = json.loads(response_text)
                except json.JSONDecodeError:
                    # Fallback: try to extract JSON array
                    import re
                    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                    if json_match:
                        questions_data = json.loads(json_match.group())
                    else:
                        continue
                
                # Convert to 24-column format
                for q in questions_data:
                    question_dict = {
                        "UID": str(uuid.uuid4()),
                        "Exam": exam,
                        "Year": q.get("year", "2023"),
                        "Subject": subject,
                        "Chapter": chapter,
                        "Topic": q.get("topic", chapter),
                        "QuestionType": "MCQ-SC",
                        "QuestionText": q.get("question_text", ""),
                        "OptionA": q.get("option_a", ""),
                        "OptionB": q.get("option_b", ""),
                        "OptionC": q.get("option_c", ""),
                        "OptionD": q.get("option_d", ""),
                        "CorrectAnswer": q.get("correct_answer", "A"),
                        "AnswerChoicesCount": 4,
                        "Marks": 4.0 if exam in ["JEE", "GATE"] else 2.0,
                        "NegativeMarks": 1.0 if exam in ["JEE", "GATE"] else 0.0,
                        "TimeLimitSeconds": 180 if q.get("difficulty") == "hard" else 120,
                        "Difficulty": q.get("difficulty", "medium"),
                        "Tags": q.get("tags", f"{exam},{subject}"),
                        "FormulaLaTeX": q.get("formula_latex", ""),
                        "ImageUploadThingURL": "",
                        "ImageAltText": "",
                        "Explanation": q.get("explanation", ""),
                        "ConfidenceScore": 0.95,
                        "SourceNotes": f"AI-generated for {exam} {subject}"
                    }
                    all_questions.append(question_dict)
        
        # Create DataFrame and CSV
        df = pd.DataFrame(all_questions)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        return {
            "success": True,
            "exam": exam,
            "total_questions": len(all_questions),
            "csv_content": csv_content,
            "message": f"Generated {len(all_questions)} questions for {exam}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI CSV generation failed: {str(e)}")

# ==================== PUSH NOTIFICATIONS ====================

# Update user's push token
@api_router.post("/user/push-token")
async def update_push_token(
    token_data: PushTokenUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's Expo push notification token"""
    try:
        user_id = current_user['user_id']
        
        # Update user's push token in database
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"push_token": token_data.push_token, "updated_at": datetime.utcnow()}}
        )
        
        return {"success": True, "message": "Push token updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update push token: {str(e)}")

# Admin: Send push notifications
@api_router.post("/admin/notifications/send")
async def send_push_notifications(
    notification: SendNotificationRequest,
    current_user: dict = Depends(get_admin_user)
):
    """Send push notifications to users (Admin only)"""
    try:
        # Build query to find target users
        query = {}
        
        if notification.target_users:
            # Send to specific users
            query["_id"] = {"$in": [ObjectId(uid) for uid in notification.target_users]}
        elif notification.exam_id:
            # Send to users who selected this exam
            query["selected_exam_id"] = notification.exam_id
        # else: send to all users
        
        # Get users with push tokens
        users = await db.users.find(
            {**query, "push_token": {"$exists": True, "$ne": None}},
            {"push_token": 1, "email": 1}
        ).to_list(length=None)
        
        if not users:
            return {
                "success": True,
                "sent_count": 0,
                "message": "No users found with push tokens"
            }
        
        # Prepare push messages
        messages = []
        for user in users:
            push_token = user.get("push_token")
            if push_token and push_token.startswith("ExponentPushToken"):
                messages.append(PushMessage(
                    to=push_token,
                    title=notification.title,
                    body=notification.body,
                    data=notification.data or {},
                    sound="default",
                    badge=1
                ))
        
        if not messages:
            return {
                "success": True,
                "sent_count": 0,
                "message": "No valid push tokens found"
            }
        
        # Send notifications
        client = PushClient()
        sent_count = 0
        failed_tokens = []
        
        try:
            # Send in chunks of 100 (Expo limit)
            chunk_size = 100
            for i in range(0, len(messages), chunk_size):
                chunk = messages[i:i + chunk_size]
                tickets = client.publish_multiple(chunk)
                
                # Check for errors
                for j, ticket in enumerate(tickets):
                    if ticket.status == 'ok':
                        sent_count += 1
                    else:
                        failed_tokens.append(chunk[j].to)
                        logger.error(f"Failed to send notification: {ticket.message}")
        
        except PushServerError as e:
            logger.error(f"Push server error: {e}")
            raise HTTPException(status_code=500, detail=f"Push server error: {str(e)}")
        except Exception as e:
            logger.error(f"Error sending notifications: {e}")
            raise HTTPException(status_code=500, detail=f"Error sending notifications: {str(e)}")
        
        # Store notification in database
        await db.notifications.insert_one({
            "title": notification.title,
            "body": notification.body,
            "data": notification.data,
            "target_users": notification.target_users,
            "exam_id": notification.exam_id,
            "sent_count": sent_count,
            "failed_count": len(failed_tokens),
            "sent_by": current_user['user_id'],
            "created_at": datetime.utcnow()
        })
        
        return {
            "success": True,
            "sent_count": sent_count,
            "failed_count": len(failed_tokens),
            "message": f"Successfully sent {sent_count} notification(s)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send notifications error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notifications: {str(e)}")

# Get notification history (Admin)
@api_router.get("/admin/notifications/history")
async def get_notification_history(
    limit: int = 50,
    current_user: dict = Depends(get_admin_user)
):
    """Get notification history (Admin only)"""
    try:
        notifications = await db.notifications.find().sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string
        for notif in notifications:
            notif["_id"] = str(notif["_id"])
            if notif.get("sent_by"):
                notif["sent_by"] = str(notif["sent_by"])
        
        return {"notifications": notifications, "total": len(notifications)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notification history: {str(e)}")

# Get user's notifications
@api_router.get("/user/notifications")
async def get_user_notifications(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get user's notification history"""
    try:
        user_id = current_user['user_id']
        
        # Get notifications sent to this user or to all users
        notifications = await db.notifications.find({
            "$or": [
                {"target_users": user_id},
                {"target_users": None}
            ]
        }).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string
        for notif in notifications:
            notif["_id"] = str(notif["_id"])
        
        return {"notifications": notifications, "total": len(notifications)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

# Include the router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
