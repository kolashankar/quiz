from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import Dict, Any, List
import os
import google.generativeai as genai
import pandas as pd
import io
import uuid
import json
from datetime import datetime

from api.v1.ai.models import AIRecommendationRequest
from core.security import get_current_user, get_admin_user
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

@router.post("/generate-csv")
async def generate_questions_csv_ai(
    exam: str,
    subjects: List[str],
    questions_per_subject: int = 40,
    admin: dict = Depends(get_admin_user)
):
    """Generate questions in CSV format using Gemini AI with tips and tricks"""
    try:
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
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

