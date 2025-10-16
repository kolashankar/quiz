"""
Admin Content Management Routes
Provides /admin/... routes that map to /content/admin/... for admin dashboard
"""

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
from core.security import get_admin_user
from core.database import get_database

router = APIRouter(tags=["admin-content"])

# ==================== EXAM ROUTES ====================

@router.post("/exams", response_model=ExamResponse)
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

@router.get("/exams", response_model=List[ExamResponse])
async def get_exams_admin(admin: dict = Depends(get_admin_user)):
    """Get all exams (Admin)"""
    db = get_database()
    exams = await db.exams.find().to_list(length=1000)
    return [ExamResponse(
        id=str(e["_id"]), 
        name=e["name"], 
        description=e["description"], 
        created_at=e.get("created_at", datetime.utcnow())
    ) for e in exams]

@router.get("/exams/{exam_id}", response_model=ExamResponse)
async def get_exam_by_id(exam_id: str, admin: dict = Depends(get_admin_user)):
    """Get exam by ID (Admin)"""
    db = get_database()
    exam = await db.exams.find_one({"_id": ObjectId(exam_id)})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamResponse(
        id=str(exam["_id"]),
        name=exam["name"],
        description=exam["description"],
        created_at=exam.get("created_at", datetime.utcnow())
    )

@router.put("/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, exam: ExamCreate, admin: dict = Depends(get_admin_user)):
    """Update an exam (Admin only)"""
    db = get_database()
    await db.exams.update_one(
        {"_id": ObjectId(exam_id)},
        {"$set": {"name": exam.name, "description": exam.description}}
    )
    updated_exam = await db.exams.find_one({"_id": ObjectId(exam_id)})
    if not updated_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamResponse(
        id=str(updated_exam["_id"]),
        name=updated_exam["name"],
        description=updated_exam["description"],
        created_at=updated_exam.get("created_at", datetime.utcnow())
    )

@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str, admin: dict = Depends(get_admin_user)):
    """Delete an exam (Admin only)"""
    db = get_database()
    result = await db.exams.delete_one({"_id": ObjectId(exam_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"success": True, "message": "Exam deleted"}

# ==================== SUBJECT ROUTES ====================

@router.post("/subjects", response_model=SubjectResponse)
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

@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects_admin(exam_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all subjects (Admin) - optionally filter by exam_id"""
    db = get_database()
    query = {"exam_id": exam_id} if exam_id else {}
    subjects = await db.subjects.find(query).to_list(length=1000)
    return [SubjectResponse(
        id=str(s["_id"]),
        exam_id=s["exam_id"],
        name=s["name"],
        description=s["description"],
        created_at=s.get("created_at", datetime.utcnow())
    ) for s in subjects]

@router.get("/subjects/{subject_id}", response_model=SubjectResponse)
async def get_subject_by_id(subject_id: str, admin: dict = Depends(get_admin_user)):
    """Get subject by ID (Admin)"""
    db = get_database()
    subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return SubjectResponse(
        id=str(subject["_id"]),
        exam_id=subject["exam_id"],
        name=subject["name"],
        description=subject["description"],
        created_at=subject.get("created_at", datetime.utcnow())
    )

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: str, subject: SubjectCreate, admin: dict = Depends(get_admin_user)):
    """Update a subject (Admin only)"""
    db = get_database()
    await db.subjects.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": {"exam_id": subject.exam_id, "name": subject.name, "description": subject.description}}
    )
    updated_subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    if not updated_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return SubjectResponse(
        id=str(updated_subject["_id"]),
        exam_id=updated_subject["exam_id"],
        name=updated_subject["name"],
        description=updated_subject["description"],
        created_at=updated_subject.get("created_at", datetime.utcnow())
    )

@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a subject (Admin only)"""
    db = get_database()
    result = await db.subjects.delete_one({"_id": ObjectId(subject_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"success": True, "message": "Subject deleted"}

# ==================== CHAPTER ROUTES ====================

@router.post("/chapters", response_model=ChapterResponse)
async def create_chapter(chapter: ChapterCreate, admin: dict = Depends(get_admin_user)):
    """Create a new chapter (Admin only)"""
    db = get_database()
    chapter_dict = {
        "subject_id": chapter.subject_id,
        "name": chapter.name,
        "description": chapter.description,
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

@router.get("/chapters", response_model=List[ChapterResponse])
async def get_chapters_admin(subject_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all chapters (Admin) - optionally filter by subject_id"""
    db = get_database()
    query = {"subject_id": subject_id} if subject_id else {}
    chapters = await db.chapters.find(query).to_list(length=1000)
    return [ChapterResponse(
        id=str(c["_id"]),
        subject_id=c["subject_id"],
        name=c["name"],
        description=c["description"],
        created_at=c.get("created_at", datetime.utcnow())
    ) for c in chapters]

@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter_by_id(chapter_id: str, admin: dict = Depends(get_admin_user)):
    """Get chapter by ID (Admin)"""
    db = get_database()
    chapter = await db.chapters.find_one({"_id": ObjectId(chapter_id)})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return ChapterResponse(
        id=str(chapter["_id"]),
        subject_id=chapter["subject_id"],
        name=chapter["name"],
        description=chapter["description"],
        created_at=chapter.get("created_at", datetime.utcnow())
    )

@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(chapter_id: str, chapter: ChapterCreate, admin: dict = Depends(get_admin_user)):
    """Update a chapter (Admin only)"""
    db = get_database()
    await db.chapters.update_one(
        {"_id": ObjectId(chapter_id)},
        {"$set": {"subject_id": chapter.subject_id, "name": chapter.name, "description": chapter.description}}
    )
    updated_chapter = await db.chapters.find_one({"_id": ObjectId(chapter_id)})
    if not updated_chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return ChapterResponse(
        id=str(updated_chapter["_id"]),
        subject_id=updated_chapter["subject_id"],
        name=updated_chapter["name"],
        description=updated_chapter["description"],
        created_at=updated_chapter.get("created_at", datetime.utcnow())
    )

@router.delete("/chapters/{chapter_id}")
async def delete_chapter(chapter_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a chapter (Admin only)"""
    db = get_database()
    result = await db.chapters.delete_one({"_id": ObjectId(chapter_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return {"success": True, "message": "Chapter deleted"}

# ==================== TOPIC ROUTES ====================

@router.post("/topics", response_model=TopicResponse)
async def create_topic(topic: TopicCreate, admin: dict = Depends(get_admin_user)):
    """Create a new topic (Admin only)"""
    db = get_database()
    topic_dict = {
        "chapter_id": topic.chapter_id,
        "name": topic.name,
        "description": topic.description,
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

@router.get("/topics", response_model=List[TopicResponse])
async def get_topics_admin(chapter_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all topics (Admin) - optionally filter by chapter_id"""
    db = get_database()
    query = {"chapter_id": chapter_id} if chapter_id else {}
    topics = await db.topics.find(query).to_list(length=1000)
    return [TopicResponse(
        id=str(t["_id"]),
        chapter_id=t["chapter_id"],
        name=t["name"],
        description=t["description"],
        created_at=t.get("created_at", datetime.utcnow())
    ) for t in topics]

@router.get("/topics/{topic_id}", response_model=TopicResponse)
async def get_topic_by_id(topic_id: str, admin: dict = Depends(get_admin_user)):
    """Get topic by ID (Admin)"""
    db = get_database()
    topic = await db.topics.find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return TopicResponse(
        id=str(topic["_id"]),
        chapter_id=topic["chapter_id"],
        name=topic["name"],
        description=topic["description"],
        created_at=topic.get("created_at", datetime.utcnow())
    )

@router.put("/topics/{topic_id}", response_model=TopicResponse)
async def update_topic(topic_id: str, topic: TopicCreate, admin: dict = Depends(get_admin_user)):
    """Update a topic (Admin only)"""
    db = get_database()
    await db.topics.update_one(
        {"_id": ObjectId(topic_id)},
        {"$set": {"chapter_id": topic.chapter_id, "name": topic.name, "description": topic.description}}
    )
    updated_topic = await db.topics.find_one({"_id": ObjectId(topic_id)})
    if not updated_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return TopicResponse(
        id=str(updated_topic["_id"]),
        chapter_id=updated_topic["chapter_id"],
        name=updated_topic["name"],
        description=updated_topic["description"],
        created_at=updated_topic.get("created_at", datetime.utcnow())
    )

@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a topic (Admin only)"""
    db = get_database()
    result = await db.topics.delete_one({"_id": ObjectId(topic_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"success": True, "message": "Topic deleted"}

# ==================== SUBTOPIC ROUTES ====================

@router.post("/subtopics", response_model=SubTopicResponse)
async def create_subtopic(subtopic: SubTopicCreate, admin: dict = Depends(get_admin_user)):
    """Create a new subtopic (Admin only)"""
    db = get_database()
    subtopic_dict = {
        "topic_id": subtopic.topic_id,
        "name": subtopic.name,
        "description": subtopic.description,
        "created_at": datetime.utcnow()
    }
    result = await db.sub_topics.insert_one(subtopic_dict)
    subtopic_dict["_id"] = result.inserted_id
    
    return SubTopicResponse(
        id=str(subtopic_dict["_id"]),
        topic_id=subtopic_dict["topic_id"],
        name=subtopic_dict["name"],
        description=subtopic_dict["description"],
        created_at=subtopic_dict["created_at"]
    )

@router.get("/subtopics", response_model=List[SubTopicResponse])
async def get_subtopics_admin(topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all subtopics (Admin) - optionally filter by topic_id"""
    db = get_database()
    query = {"topic_id": topic_id} if topic_id else {}
    subtopics = await db.sub_topics.find(query).to_list(length=1000)
    return [SubTopicResponse(
        id=str(st["_id"]),
        topic_id=st["topic_id"],
        name=st["name"],
        description=st["description"],
        created_at=st.get("created_at", datetime.utcnow())
    ) for st in subtopics]

@router.get("/subtopics/{subtopic_id}", response_model=SubTopicResponse)
async def get_subtopic_by_id(subtopic_id: str, admin: dict = Depends(get_admin_user)):
    """Get subtopic by ID (Admin)"""
    db = get_database()
    subtopic = await db.sub_topics.find_one({"_id": ObjectId(subtopic_id)})
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    return SubTopicResponse(
        id=str(subtopic["_id"]),
        topic_id=subtopic["topic_id"],
        name=subtopic["name"],
        description=subtopic["description"],
        created_at=subtopic.get("created_at", datetime.utcnow())
    )

@router.put("/subtopics/{subtopic_id}", response_model=SubTopicResponse)
async def update_subtopic(subtopic_id: str, subtopic: SubTopicCreate, admin: dict = Depends(get_admin_user)):
    """Update a subtopic (Admin only)"""
    db = get_database()
    await db.sub_topics.update_one(
        {"_id": ObjectId(subtopic_id)},
        {"$set": {"topic_id": subtopic.topic_id, "name": subtopic.name, "description": subtopic.description}}
    )
    updated_subtopic = await db.sub_topics.find_one({"_id": ObjectId(subtopic_id)})
    if not updated_subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    return SubTopicResponse(
        id=str(updated_subtopic["_id"]),
        topic_id=updated_subtopic["topic_id"],
        name=updated_subtopic["name"],
        description=updated_subtopic["description"],
        created_at=updated_subtopic.get("created_at", datetime.utcnow())
    )

@router.delete("/subtopics/{subtopic_id}")
async def delete_subtopic(subtopic_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a subtopic (Admin only)"""
    db = get_database()
    result = await db.sub_topics.delete_one({"_id": ObjectId(subtopic_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    return {"success": True, "message": "Subtopic deleted"}

# ==================== SECTION ROUTES ====================

@router.post("/sections", response_model=SectionResponse)
async def create_section(section: SectionCreate, admin: dict = Depends(get_admin_user)):
    """Create a new section (Admin only)"""
    db = get_database()
    section_dict = {
        "sub_topic_id": section.sub_topic_id,
        "name": section.name,
        "description": section.description,
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

@router.get("/sections", response_model=List[SectionResponse])
async def get_sections_admin(sub_topic_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all sections (Admin) - optionally filter by sub_topic_id"""
    db = get_database()
    query = {"sub_topic_id": sub_topic_id} if sub_topic_id else {}
    sections = await db.sections.find(query).to_list(length=1000)
    return [SectionResponse(
        id=str(s["_id"]),
        sub_topic_id=s["sub_topic_id"],
        name=s["name"],
        description=s["description"],
        created_at=s.get("created_at", datetime.utcnow())
    ) for s in sections]

@router.get("/sections/{section_id}", response_model=SectionResponse)
async def get_section_by_id(section_id: str, admin: dict = Depends(get_admin_user)):
    """Get section by ID (Admin)"""
    db = get_database()
    section = await db.sections.find_one({"_id": ObjectId(section_id)})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return SectionResponse(
        id=str(section["_id"]),
        sub_topic_id=section["sub_topic_id"],
        name=section["name"],
        description=section["description"],
        created_at=section.get("created_at", datetime.utcnow())
    )

@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, section: SectionCreate, admin: dict = Depends(get_admin_user)):
    """Update a section (Admin only)"""
    db = get_database()
    await db.sections.update_one(
        {"_id": ObjectId(section_id)},
        {"$set": {"sub_topic_id": section.sub_topic_id, "name": section.name, "description": section.description}}
    )
    updated_section = await db.sections.find_one({"_id": ObjectId(section_id)})
    if not updated_section:
        raise HTTPException(status_code=404, detail="Section not found")
    return SectionResponse(
        id=str(updated_section["_id"]),
        sub_topic_id=updated_section["sub_topic_id"],
        name=updated_section["name"],
        description=updated_section["description"],
        created_at=updated_section.get("created_at", datetime.utcnow())
    )

@router.delete("/sections/{section_id}")
async def delete_section(section_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a section (Admin only)"""
    db = get_database()
    result = await db.sections.delete_one({"_id": ObjectId(section_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"success": True, "message": "Section deleted"}

# ==================== SUBSECTION ROUTES ====================

@router.post("/subsections", response_model=SubSectionResponse)
async def create_subsection(subsection: SubSectionCreate, admin: dict = Depends(get_admin_user)):
    """Create a new subsection (Admin only)"""
    db = get_database()
    subsection_dict = {
        "section_id": subsection.section_id,
        "name": subsection.name,
        "description": subsection.description,
        "created_at": datetime.utcnow()
    }
    result = await db.sub_sections.insert_one(subsection_dict)
    subsection_dict["_id"] = result.inserted_id
    
    return SubSectionResponse(
        id=str(subsection_dict["_id"]),
        section_id=subsection_dict["section_id"],
        name=subsection_dict["name"],
        description=subsection_dict["description"],
        created_at=subsection_dict["created_at"]
    )

@router.get("/subsections", response_model=List[SubSectionResponse])
async def get_subsections_admin(section_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all subsections (Admin) - optionally filter by section_id"""
    db = get_database()
    query = {"section_id": section_id} if section_id else {}
    subsections = await db.sub_sections.find(query).to_list(length=1000)
    return [SubSectionResponse(
        id=str(ss["_id"]),
        section_id=ss["section_id"],
        name=ss["name"],
        description=ss["description"],
        created_at=ss.get("created_at", datetime.utcnow())
    ) for ss in subsections]

@router.get("/subsections/{subsection_id}", response_model=SubSectionResponse)
async def get_subsection_by_id(subsection_id: str, admin: dict = Depends(get_admin_user)):
    """Get subsection by ID (Admin)"""
    db = get_database()
    subsection = await db.sub_sections.find_one({"_id": ObjectId(subsection_id)})
    if not subsection:
        raise HTTPException(status_code=404, detail="Subsection not found")
    return SubSectionResponse(
        id=str(subsection["_id"]),
        section_id=subsection["section_id"],
        name=subsection["name"],
        description=subsection["description"],
        created_at=subsection.get("created_at", datetime.utcnow())
    )

@router.put("/subsections/{subsection_id}", response_model=SubSectionResponse)
async def update_subsection(subsection_id: str, subsection: SubSectionCreate, admin: dict = Depends(get_admin_user)):
    """Update a subsection (Admin only)"""
    db = get_database()
    await db.sub_sections.update_one(
        {"_id": ObjectId(subsection_id)},
        {"$set": {"section_id": subsection.section_id, "name": subsection.name, "description": subsection.description}}
    )
    updated_subsection = await db.sub_sections.find_one({"_id": ObjectId(subsection_id)})
    if not updated_subsection:
        raise HTTPException(status_code=404, detail="Subsection not found")
    return SubSectionResponse(
        id=str(updated_subsection["_id"]),
        section_id=updated_subsection["section_id"],
        name=updated_subsection["name"],
        description=updated_subsection["description"],
        created_at=updated_subsection.get("created_at", datetime.utcnow())
    )

@router.delete("/subsections/{subsection_id}")
async def delete_subsection(subsection_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a subsection (Admin only)"""
    db = get_database()
    result = await db.sub_sections.delete_one({"_id": ObjectId(subsection_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subsection not found")
    return {"success": True, "message": "Subsection deleted"}
