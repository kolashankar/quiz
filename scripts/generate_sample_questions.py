#!/usr/bin/env python3
"""
Sample Question Generation Script for Quiz Application
Generates 100 questions (20 per exam for 5 exams) using Gemini AI
"""

import sys
import os
import asyncio
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor import motor_asyncio
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'user_app/backend/.env'))

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "quiz_db"

# Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

# Exam configurations (20 questions per exam)
EXAM_CONFIGS = [
    {
        "name": "JEE",
        "full_name": "Joint Entrance Examination",
        "description": "Engineering entrance exam for IITs and NITs",
        "subjects": ["Physics", "Chemistry", "Mathematics"],
        "questions_per_subject": 7,  # ~20 questions total
    },
    {
        "name": "GATE",
        "full_name": "Graduate Aptitude Test in Engineering",
        "description": "Graduate engineering entrance exam",
        "subjects": ["Electrical Engineering", "Computer Science", "Mechanical Engineering"],
        "questions_per_subject": 7,
    },
    {
        "name": "UPSC",
        "full_name": "Union Public Service Commission",
        "description": "Civil services examination",
        "subjects": ["History", "Geography", "Polity"],
        "questions_per_subject": 7,
    },
    {
        "name": "NEET",
        "full_name": "National Eligibility cum Entrance Test",
        "description": "Medical entrance exam",
        "subjects": ["Biology", "Physics", "Chemistry"],
        "questions_per_subject": 7,
    },
    {
        "name": "NMMS",
        "full_name": "National Means cum Merit Scholarship",
        "description": "Scholarship exam for class 8 students",
        "subjects": ["Science", "Mathematics", "Social Studies"],
        "questions_per_subject": 7,
    },
]


async def generate_questions_with_ai(exam_name: str, subject: str, count: int = 7):
    """Generate questions using Gemini AI"""
    prompt = f"""Generate {count} multiple-choice questions for {exam_name} - {subject}.
    
Format each question as a JSON object with these fields:
- question_text: The question (string)
- options: Array of 4 options (array of strings)
- correct_answer: Index of correct option 0-3 (number)
- difficulty: "easy", "medium", or "hard" (string)
- explanation: Detailed explanation of the answer (string)
- hint: A helpful hint (string, optional)
- solution: Step-by-step solution (string, optional)
- tags: Relevant tags (array of strings)

Return a JSON array of {count} questions. Make questions diverse across difficulty levels.
Ensure questions are accurate, educational, and at the appropriate {exam_name} level."""

    try:
        if not GEMINI_API_KEY:
            print(f"⚠️  No Gemini API key found. Using mock questions for {exam_name} - {subject}")
            return generate_mock_questions(exam_name, subject, count)
        
        print(f"🤖 Generating {count} questions for {exam_name} - {subject}...")
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        text = response.text
        # Try to find JSON array in response
        start_idx = text.find('[')
        end_idx = text.rfind(']') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_text = text[start_idx:end_idx]
            questions = json.loads(json_text)
            print(f"✅ Generated {len(questions)} questions for {exam_name} - {subject}")
            return questions
        else:
            print(f"⚠️  Could not parse AI response. Using mock questions.")
            return generate_mock_questions(exam_name, subject, count)
            
    except Exception as e:
        print(f"❌ Error generating questions with AI: {e}")
        print(f"⚠️  Using mock questions for {exam_name} - {subject}")
        return generate_mock_questions(exam_name, subject, count)


def generate_mock_questions(exam_name: str, subject: str, count: int = 7):
    """Generate mock questions when AI is unavailable"""
    difficulties = ["easy", "medium", "hard"]
    questions = []
    
    for i in range(count):
        difficulty = difficulties[i % 3]
        questions.append({
            "question_text": f"{exam_name} - {subject}: Sample Question {i+1} ({difficulty})",
            "options": [
                f"Option A for question {i+1}",
                f"Option B for question {i+1}",
                f"Option C for question {i+1}",
                f"Option D for question {i+1}",
            ],
            "correct_answer": i % 4,
            "difficulty": difficulty,
            "explanation": f"This is a sample explanation for {exam_name} - {subject} question {i+1}. In a real scenario, this would contain detailed reasoning.",
            "hint": f"Sample hint: Consider the basic principles of {subject}",
            "solution": f"Step 1: Analyze the question\nStep 2: Apply {subject} concepts\nStep 3: Arrive at the correct answer",
            "tags": [exam_name, subject, difficulty],
        })
    
    return questions


async def setup_database():
    """Setup database with exams and subjects"""
    client = motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("\n📊 Setting up database structure...")
    
    exam_ids = {}
    subject_ids = {}
    
    for exam_config in EXAM_CONFIGS:
        # Create exam
        exam_doc = {
            "name": exam_config["name"],
            "full_name": exam_config["full_name"],
            "description": exam_config["description"],
            "created_at": datetime.utcnow(),
        }
        
        existing_exam = await db.exams.find_one({"name": exam_config["name"]})
        if existing_exam:
            exam_id = str(existing_exam["_id"])
            print(f"✓ Exam already exists: {exam_config['name']}")
        else:
            result = await db.exams.insert_one(exam_doc)
            exam_id = str(result.inserted_id)
            print(f"✓ Created exam: {exam_config['name']}")
        
        exam_ids[exam_config["name"]] = exam_id
        subject_ids[exam_config["name"]] = {}
        
        # Create subjects
        for subject_name in exam_config["subjects"]:
            subject_doc = {
                "name": subject_name,
                "exam_id": exam_id,
                "description": f"{subject_name} for {exam_config['name']}",
                "created_at": datetime.utcnow(),
            }
            
            existing_subject = await db.subjects.find_one({
                "name": subject_name,
                "exam_id": exam_id
            })
            
            if existing_subject:
                subject_id = str(existing_subject["_id"])
                print(f"  ✓ Subject already exists: {subject_name}")
            else:
                result = await db.subjects.insert_one(subject_doc)
                subject_id = str(result.inserted_id)
                print(f"  ✓ Created subject: {subject_name}")
            
            subject_ids[exam_config["name"]][subject_name] = subject_id
    
    client.close()
    return exam_ids, subject_ids


async def generate_and_save_questions():
    """Main function to generate and save questions"""
    print("=" * 60)
    print("🎓 Quiz Application - Sample Question Generator")
    print("=" * 60)
    print(f"📝 Generating 100 questions total (20 per exam)")
    print(f"🤖 Using: {'Gemini AI' if GEMINI_API_KEY else 'Mock Data'}")
    print("=" * 60)
    
    # Setup database
    exam_ids, subject_ids = await setup_database()
    
    # Connect to database
    client = motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    total_generated = 0
    
    # Generate questions for each exam
    for exam_config in EXAM_CONFIGS:
        exam_name = exam_config["name"]
        exam_id = exam_ids[exam_name]
        
        print(f"\n📚 Processing {exam_name}...")
        
        for subject_name in exam_config["subjects"]:
            subject_id = subject_ids[exam_name][subject_name]
            count = exam_config["questions_per_subject"]
            
            # Generate questions
            questions = await generate_questions_with_ai(exam_name, subject_name, count)
            
            # Save to database
            for question in questions:
                question_doc = {
                    **question,
                    "exam_id": exam_id,
                    "subject_id": subject_id,
                    "created_at": datetime.utcnow(),
                }
                
                await db.questions.insert_one(question_doc)
                total_generated += 1
            
            # Small delay to avoid rate limiting
            await asyncio.sleep(1)
    
    client.close()
    
    print("\n" + "=" * 60)
    print(f"✅ Successfully generated {total_generated} questions!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   Total Questions: {total_generated}")
    print(f"   Exams: {len(EXAM_CONFIGS)}")
    print(f"   Questions per Exam: ~20")
    print("\n✨ Database is ready for testing!")


if __name__ == "__main__":
    asyncio.run(generate_and_save_questions())
