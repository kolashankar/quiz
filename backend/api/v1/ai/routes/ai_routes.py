from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, BackgroundTasks
from typing import Dict, Any, List
import os
import google.generativeai as genai
import pandas as pd
import io
import uuid
import json
from datetime import datetime
import hashlib

from api.v1.ai.models import AIRecommendationRequest
from core.security import get_current_user, get_admin_user
from core.database import get_database
from api.v1.ai.services.pdf_processor import pdf_processor

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


@router.get("/progress/{job_id}")
async def get_pdf_processing_progress(job_id: str, admin: dict = Depends(get_admin_user)):
    """Get progress status for a PDF processing job"""
    progress = pdf_processor.get_progress(job_id)
    
    if not progress:
        raise HTTPException(status_code=404, detail="Job not found or expired")
    
    return progress

@router.post("/generate-csv-from-pdf")
async def generate_questions_from_pdf(
    file: UploadFile = File(...),
    exam: str = "JEE",
    subject: str = "Physics",
    questions_per_chapter: int = 10,
    admin: dict = Depends(get_admin_user)
):
    """Generate questions CSV from uploaded PDF using Gemini AI
    
    Sprint 2 Enhanced Version with:
    - File size validation (50MB limit)
    - Progress tracking for long operations
    - Caching for repeated PDF analysis
    - Detailed step-by-step progress updates
    
    This endpoint:
    1. Validates and analyzes the uploaded PDF content
    2. Extracts key concepts, topics, and answer keys from PDF
    3. Generates questions based on PDF content with tricks, tips, and logical solutions
    4. Returns CSV in 24-column format
    """
    # Generate job ID for progress tracking
    job_id = str(uuid.uuid4())
    
    try:
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Step 1: Read and validate PDF file
        pdf_processor.set_progress(job_id, "uploading", 10, "Uploading PDF file...")
        pdf_content = await file.read()
        
        # Validate file
        is_valid, error_message = pdf_processor.validate_file(pdf_content, file.filename)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Calculate file hash for caching
        file_hash = pdf_processor.get_file_hash(pdf_content)
        
        # Check cache
        pdf_processor.set_progress(job_id, "checking_cache", 20, "Checking cache for previous analysis...")
        cached_result = pdf_processor.get_cached_result(file_hash, exam, subject)
        
        if cached_result:
            pdf_processor.set_progress(job_id, "completed", 100, "Retrieved from cache")
            cached_result["job_id"] = job_id
            cached_result["from_cache"] = True
            return cached_result
        
        # Use Gemini 1.5 Pro with PDF support
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        
        # Upload PDF to Gemini
        pdf_file = genai.upload_file(io.BytesIO(pdf_content), mime_type="application/pdf")
        
        # Step 1: Analyze PDF to extract structure and content
        analysis_prompt = f"""
        Analyze this PDF document thoroughly and provide:
        
        1. **Main Topics/Chapters**: List all major chapters or topics covered
        2. **Key Concepts**: Important concepts, formulas, and theories per chapter
        3. **Answer Keys**: If this PDF contains solutions or answer keys, extract them
        4. **Difficulty Patterns**: Note the difficulty progression
        5. **Important Tips/Tricks**: Any shortcuts, tricks, or tips mentioned
        
        Format your response as JSON:
        {{
            "chapters": [
                {{
                    "name": "Chapter name",
                    "concepts": ["concept1", "concept2"],
                    "formulas": ["formula1", "formula2"],
                    "tips": ["tip1", "tip2"]
                }}
            ],
            "exam_type": "{exam}",
            "subject": "{subject}",
            "answer_keys": {{}},
            "overall_difficulty": "medium"
        }}
        """
        
        analysis_response = model.generate_content([pdf_file, analysis_prompt])
        analysis_text = analysis_response.text.strip()
        
        # Clean and parse JSON
        if analysis_text.startswith("```"):
            analysis_text = analysis_text.split("```")[1]
            if analysis_text.startswith("json"):
                analysis_text = analysis_text[4:]
        analysis_text = analysis_text.strip()
        
        try:
            pdf_analysis = json.loads(analysis_text)
        except json.JSONDecodeError:
            # Fallback to simple extraction
            pdf_analysis = {
                "chapters": [{"name": "Main Content", "concepts": [], "formulas": [], "tips": []}],
                "exam_type": exam,
                "subject": subject,
                "answer_keys": {},
                "overall_difficulty": "medium"
            }
        
        # Step 2: Generate questions based on PDF analysis
        all_questions = []
        chapters = pdf_analysis.get("chapters", [{"name": "Main Content"}])
        
        for chapter_info in chapters[:5]:  # Limit to 5 chapters
            chapter_name = chapter_info.get("name", "Chapter")
            concepts = chapter_info.get("concepts", [])
            formulas = chapter_info.get("formulas", [])
            tips = chapter_info.get("tips", [])
            
            generation_prompt = f"""
            Based on the PDF content for Chapter: "{chapter_name}", generate {questions_per_chapter} high-quality competitive exam questions.
            
            **Context from PDF:**
            - Concepts: {', '.join(concepts[:5]) if concepts else 'From chapter content'}
            - Key Formulas: {', '.join(formulas[:3]) if formulas else 'Relevant formulas'}
            - Tips/Tricks: {', '.join(tips[:3]) if tips else 'Include shortcuts'}
            
            **Requirements:**
            1. Questions should be based ONLY on content from the PDF
            2. Use the concepts, formulas, and topics mentioned in the PDF
            3. If PDF has answer keys, align questions with those patterns
            4. Mix difficulty: 30% Easy, 50% Medium, 20% Hard
            5. Include DETAILED explanations with:
               - TRICK: Mention time-saving shortcuts
               - LOGIC: Explain the reasoning step-by-step
               - TIP: Add memory aids or common mistake warnings
            6. Use LaTeX for formulas where applicable (use $...$ or $$...$$)
            7. Make questions realistic for {exam} exam
            
            Return ONLY a valid JSON array (no markdown, no extra text):
            [
              {{
                "question_text": "Question based on PDF content",
                "option_a": "Option A",
                "option_b": "Option B", 
                "option_c": "Option C",
                "option_d": "Option D",
                "correct_answer": "A",
                "difficulty": "medium",
                "explanation": "LOGIC: [Step by step reasoning]. TRICK: [Shortcut method]. TIP: [Common mistake to avoid]",
                "formula_latex": "$formula$",
                "year": "2024",
                "topic": "Specific topic from PDF",
                "tags": "tag1,tag2"
              }}
            ]
            """
            
            response = model.generate_content([pdf_file, generation_prompt])
            response_text = response.text.strip()
            
            # Clean response
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            try:
                questions_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON array
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
                    "Year": q.get("year", "2024"),
                    "Subject": subject,
                    "Chapter": chapter_name,
                    "Topic": q.get("topic", chapter_name),
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
                    "Tags": q.get("tags", f"{exam},{subject},{chapter_name}"),
                    "FormulaLaTeX": q.get("formula_latex", ""),
                    "ImageUploadThingURL": "",
                    "ImageAltText": "",
                    "Explanation": q.get("explanation", ""),
                    "ConfidenceScore": 0.95,
                    "SourceNotes": f"AI-generated from PDF for {exam} {subject} - {chapter_name}"
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
            "subject": subject,
            "total_questions": len(all_questions),
            "chapters_processed": len(chapters),
            "csv_content": csv_content,
            "pdf_analysis": {
                "chapters": [c.get("name") for c in chapters],
                "total_concepts": sum(len(c.get("concepts", [])) for c in chapters)
            },
            "message": f"Generated {len(all_questions)} questions from PDF for {exam} - {subject}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF-based CSV generation failed: {str(e)}")


@router.post("/admin/ai/generate-questions")
async def ai_generate_questions(
    topic: str,
    difficulty: str = "medium",
    count: int = 5,
    admin: dict = Depends(get_admin_user)
):
    """Generate questions using AI for a specific topic"""
    try:
        if not gemini_api_key:
            return {
                "success": False,
                "message": "Gemini API key not configured",
                "questions": []
            }
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        Generate {count} multiple-choice questions for the topic: "{topic}"
        Difficulty level: {difficulty}
        
        Requirements:
        - Create realistic competitive exam questions
        - Include 4 options (A, B, C, D)
        - Provide detailed explanation with tricks and tips
        - Include LaTeX formulas where applicable
        
        Return ONLY valid JSON array:
        [
          {{
            "question_text": "Question here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "LOGIC: ... TRICK: ... TIP: ...",
            "formula_latex": "$formula$"
          }}
        ]
        """
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        questions = json.loads(response_text)
        
        return {
            "success": True,
            "questions": questions,
            "count": len(questions)
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"AI generation failed: {str(e)}",
            "questions": []
        }


@router.post("/admin/ai/suggest-difficulty")
async def ai_suggest_difficulty(
    question_text: str,
    admin: dict = Depends(get_admin_user)
):
    """Use AI to suggest difficulty level for a question"""
    try:
        if not gemini_api_key:
            return {
                "difficulty": "medium",
                "confidence": 0.5,
                "reasoning": "Default difficulty (API key not configured)"
            }
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        Analyze this question and suggest its difficulty level:
        
        Question: {question_text}
        
        Consider:
        - Concept complexity
        - Steps required to solve
        - Time needed
        - Common knowledge vs advanced concepts
        
        Respond ONLY with JSON:
        {{
            "difficulty": "easy|medium|hard",
            "confidence": 0.0-1.0,
            "reasoning": "Brief explanation why this difficulty"
        }}
        """
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        result = json.loads(response_text)
        return result
    
    except Exception as e:
        return {
            "difficulty": "medium",
            "confidence": 0.5,
            "reasoning": f"Error in analysis: {str(e)}"
        }


@router.post("/admin/ai/generate-explanation")
async def ai_generate_explanation(
    question_text: str,
    correct_answer: str,
    admin: dict = Depends(get_admin_user)
):
    """Use AI to generate detailed explanation with tricks and tips"""
    try:
        if not gemini_api_key:
            return {
                "explanation": "Explanation not available (API key not configured)"
            }
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        Generate a comprehensive explanation for this question:
        
        Question: {question_text}
        Correct Answer: {correct_answer}
        
        Provide explanation in this format:
        
        LOGIC: [Step-by-step reasoning with clear steps]
        
        TRICK: [Time-saving shortcut or pattern recognition method]
        
        TIP: [Common mistake to avoid or memory aid]
        
        FORMULA: [If applicable, key formula in LaTeX format like $E=mc^2$]
        
        Keep it concise but complete.
        """
        
        response = model.generate_content(prompt)
        explanation = response.text.strip()
        
        return {
            "explanation": explanation
        }
    
    except Exception as e:
        return {
            "explanation": f"Unable to generate explanation: {str(e)}"
        }


# ==================== ADVANCED ANALYTICS ====================

@router.get("/admin/analytics/advanced")
async def get_advanced_analytics(admin: dict = Depends(get_admin_user)):
    """Get advanced analytics for admin dashboard"""
    db = get_database()
    
    # Question engagement - most attempted questions
    question_attempts_pipeline = [
        {"$group": {"_id": "$question_id", "attempts": {"$sum": 1}}},
        {"$sort": {"attempts": -1}},
        {"$limit": 10}
    ]
    top_questions = await db.test_results.aggregate(question_attempts_pipeline).to_list(10)
    
    # User engagement - active users
    active_users_pipeline = [
        {"$group": {"_id": "$user_id", "tests_taken": {"$sum": 1}}},
        {"$match": {"tests_taken": {"$gte": 5}}},
        {"$count": "active_users"}
    ]
    active_users_result = await db.test_results.aggregate(active_users_pipeline).to_list(1)
    active_users = active_users_result[0]["active_users"] if active_users_result else 0
    
    # Difficulty analysis - average scores by difficulty
    difficulty_pipeline = [
        {"$lookup": {
            "from": "questions",
            "localField": "question_id",
            "foreignField": "_id",
            "as": "question"
        }},
        {"$unwind": "$question"},
        {"$group": {
            "_id": "$question.difficulty",
            "avg_score": {"$avg": "$score"},
            "count": {"$sum": 1}
        }}
    ]
    difficulty_stats = await db.test_results.aggregate(difficulty_pipeline).to_list(10)
    
    # Time trends - tests per day (last 7 days)
    from datetime import datetime, timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    time_pipeline = [
        {"$match": {"timestamp": {"$gte": seven_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "tests": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    time_trends = await db.test_results.aggregate(time_pipeline).to_list(7)
    
    return {
        "engagement": {
            "active_users": active_users,
            "top_questions": [{"question_id": str(q["_id"]), "attempts": q["attempts"]} for q in top_questions]
        },
        "difficulty_analysis": [
            {
                "difficulty": d["_id"],
                "avg_score": round(d["avg_score"], 2),
                "attempts": d["count"]
            } for d in difficulty_stats
        ],
        "time_trends": [
            {"date": t["_id"], "tests": t["tests"]} for t in time_trends
        ]
    }

