from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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

# Sub-Topic Models
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

# Section Models
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

# Sub-Section Models
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
