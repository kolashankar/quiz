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
import google.generativeai as genai

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

class QuestionResponse(BaseModel):
    id: str
    sub_section_id: str
    question_text: str
    options: List[str]
    correct_answer: int
    difficulty: str
    tags: List[str]
    explanation: str
    created_at: datetime

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
            created_at=user_dict["created_at"]
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
            created_at=user["created_at"]
        )
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user["created_at"]
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
        created_at=exam_dict["created_at"]
    )

@api_router.get("/admin/exams", response_model=List[ExamResponse])
async def get_exams(admin: dict = Depends(get_admin_user)):
    exams = await db.exams.find().to_list(1000)
    return [ExamResponse(
        id=str(exam["_id"]),
        name=exam["name"],
        description=exam["description"],
        created_at=exam["created_at"]
    ) for exam in exams]

@api_router.get("/exams", response_model=List[ExamResponse])
async def get_exams_public():
    exams = await db.exams.find().to_list(1000)
    return [ExamResponse(
        id=str(exam["_id"]),
        name=exam["name"],
        description=exam["description"],
        created_at=exam["created_at"]
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
        created_at=updated_exam["created_at"]
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
        created_at=subject_dict["created_at"]
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
        created_at=subject["created_at"]
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
        created_at=subject["created_at"]
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
        created_at=updated_subject["created_at"]
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
        created_at=chapter_dict["created_at"]
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
        created_at=chapter["created_at"]
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
        created_at=chapter["created_at"]
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
        created_at=updated_chapter["created_at"]
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
        created_at=topic_dict["created_at"]
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
        created_at=topic["created_at"]
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
        created_at=topic["created_at"]
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
        created_at=updated_topic["created_at"]
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
        created_at=sub_topic_dict["created_at"]
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
        created_at=st["created_at"]
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
        created_at=st["created_at"]
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
        created_at=updated_sub_topic["created_at"]
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
        created_at=section_dict["created_at"]
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
        created_at=s["created_at"]
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
        created_at=s["created_at"]
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
        created_at=updated_section["created_at"]
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
        created_at=sub_section_dict["created_at"]
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
        created_at=ss["created_at"]
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
        created_at=ss["created_at"]
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
        created_at=updated_sub_section["created_at"]
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
        created_at=question_dict["created_at"]
    )

@api_router.get("/admin/questions", response_model=List[QuestionResponse])
async def get_questions_admin(topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {"topic_id": topic_id} if topic_id else {}
    questions = await db.questions.find(query).to_list(1000)
    return [QuestionResponse(
        id=str(q["_id"]),
        topic_id=q["topic_id"],
        question_text=q["question_text"],
        options=q["options"],
        correct_answer=q["correct_answer"],
        difficulty=q["difficulty"],
        tags=q.get("tags", []),
        explanation=q.get("explanation", ""),
        created_at=q["created_at"]
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
        created_at=updated_question["created_at"]
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
        
        # Expected CSV columns: sub_section_id, question_text, option1, option2, option3, option4, correct_answer, difficulty, tags, explanation
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
                "created_at": datetime.utcnow()
            }
            questions.append(question_dict)
        
        if questions:
            result = await db.questions.insert_many(questions)
            return {"message": f"Successfully uploaded {len(result.inserted_ids)} questions"}
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
    topic_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 50
):
    query = {}
    if topic_id:
        query["topic_id"] = topic_id
    if difficulty:
        query["difficulty"] = difficulty
    
    questions = await db.questions.find(query).limit(limit).to_list(limit)
    return [QuestionResponse(
        id=str(q["_id"]),
        topic_id=q["topic_id"],
        question_text=q["question_text"],
        options=q["options"],
        correct_answer=q["correct_answer"],
        difficulty=q["difficulty"],
        tags=q.get("tags", []),
        explanation=q.get("explanation", ""),
        created_at=q["created_at"]
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
            created_at=existing["created_at"]
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
        created_at=bookmark_dict["created_at"]
    )

@api_router.get("/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    bookmarks = await db.bookmarks.find({"user_id": str(current_user["_id"])}).to_list(1000)
    
    return [BookmarkResponse(
        id=str(b["_id"]),
        user_id=b["user_id"],
        question_id=b["question_id"],
        created_at=b["created_at"]
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
        created_at=updated_user["created_at"]
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
            created_at=q["created_at"]
        ) for q in questions
    ]

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
