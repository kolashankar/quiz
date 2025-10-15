from bson import ObjectId
from pydantic import BaseModel
from typing import Any

class PyObjectId(str):
    """Custom Pydantic type for MongoDB ObjectId"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class BaseResponse(BaseModel):
    """Base response model with common fields"""
    class Config:
        from_attributes = True
        populate_by_name = True
