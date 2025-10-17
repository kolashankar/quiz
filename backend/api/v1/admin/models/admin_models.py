from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SendNotificationRequest(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    target_users: Optional[List[str]] = None
    exam_id: Optional[str] = None

class BatchUpdatePayload(BaseModel):
    ids: List[str]
    updates: Dict[str, Any]
