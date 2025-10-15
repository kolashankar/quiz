from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from typing import List, Optional

from api.v1.content.models import (
    ExamCreate, ExamResponse,
    SubjectCreate, SubjectResponse,
    ChapterCreate, ChapterResponse,
    TopicCreate, TopicResponse,
    SubTopicCreate, SubTopicResponse,
    SectionCreate, SectionResponse,
    SubSectionCreate, SubSectionResponse
)
from core.security import get_current_user, get_admin_user
from core.database import get_database

router = APIRouter(prefix="/content", tags=["content"])

# ==================== EXAM ROUTES ====================

@router.post("/admin/exams", response_model=ExamResponse)
async def create_exam(exam: ExamCreate, admin: dict = Depends(get_admin_user)):
    """Create a new exam (Admin only)"""
    db = get_database()
    exam_dict = {
        "name": exam.name,
        "description": exam.description,
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

@router.get("/admin/exams", response_model=List[ExamResponse])
async def get_exams_admin(admin: dict = Depends(get_admin_user)):
    """Get all exams (Admin)"""
    db = get_database()
    exams = await db.exams.find().to_list(length=1000)
    return [ExamResponse(id=str(e["_id"]), name=e["name"], description=e["description"], created_at=e["created_at"]) for e in exams]

@router.get("/exams", response_model=List[ExamResponse])
async def get_exams_public():
    """Get all exams (Public)"""
    db = get_database()
    exams = await db.exams.find().to_list(length=1000)
    return [ExamResponse(id=str(e["_id"]), name=e["name"], description=e["description"], created_at=e["created_at"]) for e in exams]

@router.put("/admin/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, exam: ExamCreate, admin: dict = Depends(get_admin_user)):
    """Update an exam (Admin only)"""
    db = get_database()
    await db.exams.update_one(
        {"_id": ObjectId(exam_id)},
        {"$set": {"name": exam.name, "description": exam.description}}
    )
    updated_exam = await db.exams.find_one({"_id": ObjectId(exam_id)})
    return ExamResponse(
        id=str(updated_exam["_id"]),
        name=updated_exam["name"],
        description=updated_exam["description"],
        created_at=updated_exam["created_at"]
    )

@router.delete("/admin/exams/{exam_id}")
async def delete_exam(exam_id: str, admin: dict = Depends(get_admin_user)):
    """Delete an exam (Admin only)"""
    db = get_database()
    await db.exams.delete_one({"_id": ObjectId(exam_id)})
    return {"success": True, "message": "Exam deleted"}

# ==================== SUBJECT ROUTES ====================

@router.post("/admin/subjects", response_model=SubjectResponse)
async def create_subject(subject: SubjectCreate, admin: dict = Depends(get_admin_user)):
    """Create a new subject (Admin only)"""
    db = get_database()
    subject_dict = {
        "exam_id": subject.exam_id,
        "name": subject.name,
        "description": subject.description,
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

@router.get("/admin/subjects", response_model=List[SubjectResponse])
async def get_subjects_admin(exam_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get subjects (Admin)"""
    db = get_database()
    query = {"exam_id": exam_id} if exam_id else {}
    subjects = await db.subjects.find(query).to_list(length=1000)
    return [SubjectResponse(id=str(s["_id"]), exam_id=s["exam_id"], name=s["name"], description=s["description"], created_at=s["created_at"]) for s in subjects]

@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects_public(exam_id: Optional[str] = None):
    """Get subjects (Public)"""
    db = get_database()
    query = {"exam_id": exam_id} if exam_id else {}
    subjects = await db.subjects.find(query).to_list(length=1000)
    return [SubjectResponse(id=str(s["_id"]), exam_id=s["exam_id"], name=s["name"], description=s["description"], created_at=s["created_at"]) for s in subjects]

@router.put("/admin/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: str, subject: SubjectCreate, admin: dict = Depends(get_admin_user)):
    """Update a subject (Admin only)"""
    db = get_database()
    await db.subjects.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": {"exam_id": subject.exam_id, "name": subject.name, "description": subject.description}}
    )
    updated_subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    return SubjectResponse(
        id=str(updated_subject["_id"]),
        exam_id=updated_subject["exam_id"],
        name=updated_subject["name"],
        description=updated_subject["description"],
        created_at=updated_subject["created_at"]
    )

@router.delete("/admin/subjects/{subject_id}")
async def delete_subject(subject_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a subject (Admin only)"""
    db = get_database()
    await db.subjects.delete_one({"_id": ObjectId(subject_id)})
    return {"success": True, "message": "Subject deleted"}

# ==================== CHAPTER ROUTES ====================

@router.post("/admin/chapters", response_model=ChapterResponse)
async def create_chapter(chapter: ChapterCreate, admin: dict = Depends(get_admin_user)):
    """Create a new chapter (Admin only)"""
    db = get_database()
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

@router.get("/admin/chapters", response_model=List[ChapterResponse])
async def get_chapters_admin(subject_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get chapters (Admin)"""
    db = get_database()
    query = {"subject_id": subject_id} if subject_id else {}
    chapters = await db.chapters.find(query).to_list(1000)
    return [ChapterResponse(
        id=str(chapter["_id"]),
        subject_id=chapter["subject_id"],
        name=chapter["name"],
        description=chapter["description"],
        created_at=chapter["created_at"]
    ) for chapter in chapters]

@router.get("/chapters", response_model=List[ChapterResponse])
async def get_chapters_public(subject_id: Optional[str] = None):
    """Get chapters (Public)"""
    db = get_database()
    query = {"subject_id": subject_id} if subject_id else {}
    chapters = await db.chapters.find(query).to_list(1000)
    return [ChapterResponse(
        id=str(chapter["_id"]),
        subject_id=chapter["subject_id"],
        name=chapter["name"],
        description=chapter["description"],
        created_at=chapter["created_at"]
    ) for chapter in chapters]

@router.put("/admin/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(chapter_id: str, chapter: ChapterCreate, admin: dict = Depends(get_admin_user)):
    """Update a chapter (Admin only)"""
    db = get_database()
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

@router.delete("/admin/chapters/{chapter_id}")
async def delete_chapter(chapter_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a chapter (Admin only)"""
    db = get_database()
    result = await db.chapters.delete_one({"_id": ObjectId(chapter_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return {"message": "Chapter deleted successfully"}

# ==================== TOPIC ROUTES ====================

@router.post("/admin/topics", response_model=TopicResponse)
async def create_topic(topic: TopicCreate, admin: dict = Depends(get_admin_user)):
    """Create a new topic (Admin only)"""
    db = get_database()
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

@router.get("/admin/topics", response_model=List[TopicResponse])
async def get_topics_admin(chapter_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get topics (Admin)"""
    db = get_database()
    query = {"chapter_id": chapter_id} if chapter_id else {}
    topics = await db.topics.find(query).to_list(1000)
    return [TopicResponse(
        id=str(topic["_id"]),
        chapter_id=topic["chapter_id"],
        name=topic["name"],
        description=topic["description"],
        created_at=topic["created_at"]
    ) for topic in topics]

@router.get("/topics", response_model=List[TopicResponse])
async def get_topics_public(chapter_id: Optional[str] = None):
    """Get topics (Public)"""
    db = get_database()
    query = {"chapter_id": chapter_id} if chapter_id else {}
    topics = await db.topics.find(query).to_list(1000)
    return [TopicResponse(
        id=str(topic["_id"]),
        chapter_id=topic["chapter_id"],
        name=topic["name"],
        description=topic["description"],
        created_at=topic["created_at"]
    ) for topic in topics]

@router.put("/admin/topics/{topic_id}", response_model=TopicResponse)
async def update_topic(topic_id: str, topic: TopicCreate, admin: dict = Depends(get_admin_user)):
    """Update a topic (Admin only)"""
    db = get_database()
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

@router.delete("/admin/topics/{topic_id}")
async def delete_topic(topic_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a topic (Admin only)"""
    db = get_database()
    result = await db.topics.delete_one({"_id": ObjectId(topic_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted successfully"}

# ==================== SUB-TOPIC ROUTES ====================

@router.post("/admin/sub-topics", response_model=SubTopicResponse)
async def create_sub_topic(sub_topic: SubTopicCreate, admin: dict = Depends(get_admin_user)):
    """Create a new sub-topic (Admin only)"""
    db = get_database()
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

@router.get("/admin/sub-topics", response_model=List[SubTopicResponse])
async def get_sub_topics_admin(topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get sub-topics (Admin)"""
    db = get_database()
    query = {"topic_id": topic_id} if topic_id else {}
    sub_topics = await db.sub_topics.find(query).to_list(1000)
    return [SubTopicResponse(
        id=str(st["_id"]),
        topic_id=st["topic_id"],
        name=st["name"],
        description=st["description"],
        created_at=st["created_at"]
    ) for st in sub_topics]

@router.get("/sub-topics", response_model=List[SubTopicResponse])
async def get_sub_topics_public(topic_id: Optional[str] = None):
    """Get sub-topics (Public)"""
    db = get_database()
    query = {"topic_id": topic_id} if topic_id else {}
    sub_topics = await db.sub_topics.find(query).to_list(1000)
    return [SubTopicResponse(
        id=str(st["_id"]),
        topic_id=st["topic_id"],
        name=st["name"],
        description=st["description"],
        created_at=st["created_at"]
    ) for st in sub_topics]

@router.put("/admin/sub-topics/{sub_topic_id}", response_model=SubTopicResponse)
async def update_sub_topic(sub_topic_id: str, sub_topic: SubTopicCreate, admin: dict = Depends(get_admin_user)):
    """Update a sub-topic (Admin only)"""
    db = get_database()
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

@router.delete("/admin/sub-topics/{sub_topic_id}")
async def delete_sub_topic(sub_topic_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a sub-topic (Admin only)"""
    db = get_database()
    result = await db.sub_topics.delete_one({"_id": ObjectId(sub_topic_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sub-topic not found")
    return {"message": "Sub-topic deleted successfully"}

# ==================== SECTION ROUTES ====================

@router.post("/admin/sections", response_model=SectionResponse)
async def create_section(section: SectionCreate, admin: dict = Depends(get_admin_user)):
    """Create a new section (Admin only)"""
    db = get_database()
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

@router.get("/admin/sections", response_model=List[SectionResponse])
async def get_sections_admin(sub_topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get sections (Admin)"""
    db = get_database()
    query = {"sub_topic_id": sub_topic_id} if sub_topic_id else {}
    sections = await db.sections.find(query).to_list(1000)
    return [SectionResponse(
        id=str(s["_id"]),
        sub_topic_id=s["sub_topic_id"],
        name=s["name"],
        description=s["description"],
        created_at=s["created_at"]
    ) for s in sections]

@router.get("/sections", response_model=List[SectionResponse])
async def get_sections_public(sub_topic_id: Optional[str] = None):
    """Get sections (Public)"""
    db = get_database()
    query = {"sub_topic_id": sub_topic_id} if sub_topic_id else {}
    sections = await db.sections.find(query).to_list(1000)
    return [SectionResponse(
        id=str(s["_id"]),
        sub_topic_id=s["sub_topic_id"],
        name=s["name"],
        description=s["description"],
        created_at=s["created_at"]
    ) for s in sections]

@router.put("/admin/sections/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, section: SectionCreate, admin: dict = Depends(get_admin_user)):
    """Update a section (Admin only)"""
    db = get_database()
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

@router.delete("/admin/sections/{section_id}")
async def delete_section(section_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a section (Admin only)"""
    db = get_database()
    result = await db.sections.delete_one({"_id": ObjectId(section_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}

# ==================== SUB-SECTION ROUTES ====================

@router.post("/admin/sub-sections", response_model=SubSectionResponse)
async def create_sub_section(sub_section: SubSectionCreate, admin: dict = Depends(get_admin_user)):
    """Create a new sub-section (Admin only)"""
    db = get_database()
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

@router.get("/admin/sub-sections", response_model=List[SubSectionResponse])
async def get_sub_sections_admin(section_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get sub-sections (Admin)"""
    db = get_database()
    query = {"section_id": section_id} if section_id else {}
    sub_sections = await db.sub_sections.find(query).to_list(1000)
    return [SubSectionResponse(
        id=str(ss["_id"]),
        section_id=ss["section_id"],
        name=ss["name"],
        description=ss["description"],
        created_at=ss["created_at"]
    ) for ss in sub_sections]

@router.get("/sub-sections", response_model=List[SubSectionResponse])
async def get_sub_sections_public(section_id: Optional[str] = None):
    """Get sub-sections (Public)"""
    db = get_database()
    query = {"section_id": section_id} if section_id else {}
    sub_sections = await db.sub_sections.find(query).to_list(1000)
    return [SubSectionResponse(
        id=str(ss["_id"]),
        section_id=ss["section_id"],
        name=ss["name"],
        description=ss["description"],
        created_at=ss["created_at"]
    ) for ss in sub_sections]

@router.put("/admin/sub-sections/{sub_section_id}", response_model=SubSectionResponse)
async def update_sub_section(sub_section_id: str, sub_section: SubSectionCreate, admin: dict = Depends(get_admin_user)):
    """Update a sub-section (Admin only)"""
    db = get_database()
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

@router.delete("/admin/sub-sections/{sub_section_id}")
async def delete_sub_section(sub_section_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a sub-section (Admin only)"""
    db = get_database()
    result = await db.sub_sections.delete_one({"_id": ObjectId(sub_section_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sub-section not found")
    return {"message": "Sub-section deleted successfully"}
