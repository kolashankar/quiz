"""
Sprint 3: Version Control & Audit Logs Routes
Track question changes and admin actions
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from core.security import get_admin_user, get_current_user
from core.database import get_database

router = APIRouter(prefix="/admin", tags=["admin-version-control"])


# ==================== VERSION CONTROL ====================

@router.get("/questions/{question_id}/history")
async def get_question_history(
    question_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Get complete edit history for a question"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    # Get current question
    question = await db.questions.find_one({"_id": obj_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Get version history
    versions = await db.question_versions.find(
        {"question_id": question_id}
    ).sort("version_number", -1).to_list(100)
    
    return {
        "question_id": question_id,
        "current_version": {
            **question,
            "_id": str(question["_id"]),
            "created_at": question.get("created_at", datetime.utcnow()).isoformat()
        },
        "version_history": [
            {
                **v,
                "_id": str(v["_id"]),
                "created_at": v.get("created_at", datetime.utcnow()).isoformat()
            }
            for v in versions
        ],
        "total_versions": len(versions)
    }


@router.post("/questions/{question_id}/create-version")
async def create_question_version(
    question_id: str,
    change_note: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Create a new version before updating a question"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    # Get current question
    question = await db.questions.find_one({"_id": obj_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Count existing versions
    version_count = await db.question_versions.count_documents({"question_id": question_id})
    
    # Create version snapshot
    version_data = {
        "question_id": question_id,
        "version_number": version_count + 1,
        "snapshot": {
            k: v for k, v in question.items() if k != "_id"
        },
        "created_by": str(admin["_id"]),
        "created_by_email": admin.get("email"),
        "created_at": datetime.utcnow(),
        "change_note": change_note or "Version created before update"
    }
    
    result = await db.question_versions.insert_one(version_data)
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "create_question_version",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "question_id": question_id,
        "version_number": version_count + 1,
        "timestamp": datetime.utcnow(),
        "details": {"change_note": change_note}
    })
    
    return {
        "message": "Version created successfully",
        "version_id": str(result.inserted_id),
        "version_number": version_count + 1
    }


@router.post("/questions/{question_id}/restore/{version_number}")
async def restore_question_version(
    question_id: str,
    version_number: int,
    admin: dict = Depends(get_admin_user)
):
    """Restore a question to a previous version"""
    db = get_database()
    
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question ID")
    
    # Get the version
    version = await db.question_versions.find_one({
        "question_id": question_id,
        "version_number": version_number
    })
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Create a new version of current state before restoring
    await create_question_version(question_id, f"Auto-backup before restoring to v{version_number}", admin)
    
    # Restore the version
    snapshot = version["snapshot"]
    snapshot["updated_at"] = datetime.utcnow()
    snapshot["updated_by"] = str(admin["_id"])
    snapshot["restored_from_version"] = version_number
    
    await db.questions.update_one(
        {"_id": obj_id},
        {"$set": snapshot}
    )
    
    # Log audit entry
    await db.audit_logs.insert_one({
        "action": "restore_question_version",
        "admin_id": str(admin["_id"]),
        "admin_email": admin.get("email"),
        "question_id": question_id,
        "restored_version": version_number,
        "timestamp": datetime.utcnow()
    })
    
    return {
        "message": f"Question restored to version {version_number}",
        "question_id": question_id,
        "restored_version": version_number
    }


@router.get("/questions/{question_id}/compare")
async def compare_question_versions(
    question_id: str,
    version1: int,
    version2: int,
    admin: dict = Depends(get_admin_user)
):
    """Compare two versions of a question"""
    db = get_database()
    
    # Get both versions
    v1 = await db.question_versions.find_one({
        "question_id": question_id,
        "version_number": version1
    })
    v2 = await db.question_versions.find_one({
        "question_id": question_id,
        "version_number": version2
    })
    
    if not v1 or not v2:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    
    # Compare key fields
    fields_to_compare = ["text", "options", "correct_answer", "explanation", "difficulty", "tags"]
    differences = {}
    
    for field in fields_to_compare:
        val1 = v1["snapshot"].get(field)
        val2 = v2["snapshot"].get(field)
        if val1 != val2:
            differences[field] = {
                f"version_{version1}": val1,
                f"version_{version2}": val2
            }
    
    return {
        "question_id": question_id,
        "version1": version1,
        "version2": version2,
        "differences": differences,
        "has_changes": len(differences) > 0
    }


# ==================== AUDIT LOGS ====================

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get audit logs with filtering"""
    db = get_database()
    
    # Build filter
    filter_query = {}
    
    if action:
        filter_query["action"] = action
    
    if admin_id:
        filter_query["admin_id"] = admin_id
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filter_query["timestamp"] = {"$gte": start_dt}
        except:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if "timestamp" in filter_query:
                filter_query["timestamp"]["$lte"] = end_dt
            else:
                filter_query["timestamp"] = {"$lte": end_dt}
        except:
            pass
    
    # Get logs
    skip = (page - 1) * limit
    logs = await db.audit_logs.find(filter_query).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.audit_logs.count_documents(filter_query)
    
    return {
        "logs": [
            {
                **log,
                "_id": str(log["_id"]),
                "timestamp": log.get("timestamp", datetime.utcnow()).isoformat()
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/audit-logs/actions")
async def get_available_actions(admin: dict = Depends(get_admin_user)):
    """Get list of all action types in audit logs"""
    db = get_database()
    
    actions = await db.audit_logs.distinct("action")
    
    return {"actions": sorted(actions)}


@router.get("/audit-logs/stats")
async def get_audit_log_stats(
    days: int = Query(7, ge=1, le=90),
    admin: dict = Depends(get_admin_user)
):
    """Get statistics about admin actions"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total actions in period
    total_actions = await db.audit_logs.count_documents({
        "timestamp": {"$gte": start_date}
    })
    
    # Actions by type
    action_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    actions_by_type = await db.audit_logs.aggregate(action_pipeline).to_list(100)
    
    # Actions by admin
    admin_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": "$admin_id",
            "email": {"$first": "$admin_email"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    actions_by_admin = await db.audit_logs.aggregate(admin_pipeline).to_list(10)
    
    # Daily activity
    daily_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_activity = await db.audit_logs.aggregate(daily_pipeline).to_list(90)
    
    return {
        "period_days": days,
        "total_actions": total_actions,
        "actions_by_type": [
            {"action": a["_id"], "count": a["count"]}
            for a in actions_by_type
        ],
        "top_admins": [
            {
                "admin_id": a["_id"],
                "email": a.get("email", "Unknown"),
                "actions": a["count"]
            }
            for a in actions_by_admin
        ],
        "daily_activity": [
            {"date": d["_id"], "actions": d["count"]}
            for d in daily_activity
        ]
    }


# ==================== DATA EXPORT ====================

@router.get("/analytics/export")
async def export_analytics_data(
    format: str = Query("json", regex="^(json|csv)$"),
    days: int = Query(30, ge=1, le=365),
    admin: dict = Depends(get_admin_user)
):
    """Export analytics data for reporting"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Gather analytics data
    analytics = {}
    
    # User statistics
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({
        "last_login": {"$gte": start_date}
    })
    new_users = await db.users.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    analytics["users"] = {
        "total": total_users,
        "active_last_30d": active_users,
        "new_last_30d": new_users
    }
    
    # Question statistics
    total_questions = await db.questions.count_documents({"is_active": {"$ne": False}})
    by_difficulty = await db.questions.aggregate([
        {"$match": {"is_active": {"$ne": False}}},
        {"$group": {"_id": "$difficulty", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    analytics["questions"] = {
        "total": total_questions,
        "by_difficulty": {d["_id"]: d["count"] for d in by_difficulty}
    }
    
    # Test statistics
    total_tests = await db.test_results.count_documents({})
    tests_in_period = await db.test_results.count_documents({
        "timestamp": {"$gte": start_date}
    })
    
    avg_score_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$score"}}}
    ]
    avg_score_result = await db.test_results.aggregate(avg_score_pipeline).to_list(1)
    avg_score = avg_score_result[0]["avg_score"] if avg_score_result else 0
    
    analytics["tests"] = {
        "total": total_tests,
        "last_30d": tests_in_period,
        "avg_score_last_30d": round(avg_score, 2)
    }
    
    # Engagement metrics
    analytics["engagement"] = {
        "tests_per_user": round(tests_in_period / max(active_users, 1), 2),
        "questions_per_test": round(total_questions / max(total_tests, 1), 2)
    }
    
    analytics["export_info"] = {
        "generated_at": datetime.utcnow().isoformat(),
        "period_days": days,
        "format": format
    }
    
    if format == "csv":
        # Convert to CSV format
        import io
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers and data
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Users", analytics["users"]["total"]])
        writer.writerow(["Active Users (30d)", analytics["users"]["active_last_30d"]])
        writer.writerow(["New Users (30d)", analytics["users"]["new_last_30d"]])
        writer.writerow(["Total Questions", analytics["questions"]["total"]])
        writer.writerow(["Total Tests", analytics["tests"]["total"]])
        writer.writerow(["Tests (30d)", analytics["tests"]["last_30d"]])
        writer.writerow(["Avg Score (30d)", analytics["tests"]["avg_score_last_30d"]])
        
        return {
            "format": "csv",
            "content": output.getvalue(),
            "filename": f"analytics_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        }
    
    return {
        "format": "json",
        "data": analytics
    }
