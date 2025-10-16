from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from api.v1.auth.models import UserCreate, UserLogin, UserResponse, Token, PushTokenUpdate
from core.security import get_password_hash, verify_password, create_access_token, get_current_user
from core.database import get_database

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    """Register a new user"""
    db = get_database()
    
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

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    db = get_database()
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

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user.get("created_at", datetime.utcnow())
    )

@router.post("/push-token")
async def update_push_token(
    token_data: PushTokenUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's push notification token"""
    db = get_database()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"push_token": token_data.push_token}}
    )
    return {"success": True, "message": "Push token updated"}
