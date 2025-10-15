from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import os
import google.generativeai as genai

from api.v1.ai.models import AIRecommendationRequest
from core.security import get_current_user
from core.database import get_database

router = APIRouter(prefix="/ai", tags=["ai"])

# Configure Gemini AI
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

@router.post("/recommendations")
async def get_ai_recommendations(request: AIRecommendationRequest, current_user: dict = Depends(get_current_user)):
    """Get AI-powered study recommendations"""
    
    if not gemini_api_key:
        return {
            "recommendations": [
                "Practice more questions regularly",
                "Review topics you find challenging",
                "Take timed tests to improve speed"
            ]
        }
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are a personalized study advisor. Based on the student's context, provide 3-5 specific, actionable recommendations.
        
        Context: {request.context}
        
        Provide brief, numbered recommendations focused on effective study strategies.
        """
        
        response = model.generate_content(prompt)
        recommendations = response.text.strip().split('\n')
        recommendations = [r.strip('- ').strip() for r in recommendations if r.strip()][:5]
        
        return {"recommendations": recommendations}
    
    except Exception as e:
        return {
            "recommendations": [
                "Practice more questions regularly",
                "Review topics you find challenging",
                "Take timed tests to improve speed"
            ],
            "error": str(e)
        }

@router.get("/test-recommendations")
async def get_test_recommendations(current_user: dict = Depends(get_current_user)):
    """Get AI-powered test recommendations based on performance"""
    db = get_database()
    
    # Get user's recent test results
    results = await db.test_results.find({"user_id": str(current_user["_id"])}).sort("timestamp", -1).limit(10).to_list(10)
    
    if not results:
        # No history, recommend popular topics
        topics = await db.topics.find().limit(5).to_list(5)
        return {
            "message": "Get started with these popular topics",
            "recommended_topics": [{
                "topic_id": str(t["_id"]),
                "topic_name": t["name"],
                "reason": "Popular among students"
            } for t in topics]
        }
    
    # Simple recommendation based on recent performance
    avg_score = sum(r["score"] for r in results) / len(results)
    
    if avg_score < 60:
        message = "Focus on building fundamentals with easier topics"
    elif avg_score < 80:
        message = "Great progress! Continue with mixed difficulty"
    else:
        message = "Excellent performance! Challenge yourself with advanced topics"
    
    topics = await db.topics.find().limit(5).to_list(5)
    
    return {
        "message": message,
        "average_score": round(avg_score, 2),
        "recommended_topics": [{
            "topic_id": str(t["_id"]),
            "topic_name": t["name"],
            "reason": "Recommended based on your performance"
        } for t in topics]
    }
