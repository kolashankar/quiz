"""FastAPI Microservice for PDF Extraction and CSV Generation"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import shutil
import logging
from datetime import datetime
import json

from pdf_extractor import PDFExtractor
from csv_generator import CSVGenerator
from uploadthing_client import UploadThingClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Quiz CSV Generator API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "./uploads"
OUTPUT_DIR = "./generated_csvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize clients (will be configured via environment variables)
UPLOADTHING_SECRET = os.getenv('UPLOADTHING_SECRET', '')
UPLOADTHING_APP_ID = os.getenv('UPLOADTHING_APP_ID', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

uploadthing_client = None
if UPLOADTHING_SECRET and UPLOADTHING_APP_ID:
    uploadthing_client = UploadThingClient(UPLOADTHING_SECRET, UPLOADTHING_APP_ID)

csv_generator = None
if GEMINI_API_KEY:
    csv_generator = CSVGenerator(GEMINI_API_KEY, uploadthing_client)

pdf_extractor = PDFExtractor()

# Job storage (in-memory, can be replaced with Redis/Database)
jobs = {}


# Pydantic models
class GenerateCSVRequest(BaseModel):
    exam_name: str
    questions_per_subject: int = 40


class PDFToCSVRequest(BaseModel):
    exam_name: str
    year: str
    subject: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: float
    message: str
    result: Optional[Dict[str, Any]] = None


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "uploadthing_configured": uploadthing_client is not None,
        "gemini_configured": csv_generator is not None
    }


# Generate CSV for an exam
@app.post("/generate-exam-csv")
async def generate_exam_csv(request: GenerateCSVRequest, background_tasks: BackgroundTasks):
    """Generate CSV file for a specific exam using AI"""
    
    if not csv_generator:
        raise HTTPException(status_code=500, detail="Gemini API not configured")
    
    # Validate exam name
    valid_exams = ['JEE', 'GATE', 'UPSC', 'NEET', 'NMMS']
    if request.exam_name not in valid_exams:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid exam name. Must be one of: {', '.join(valid_exams)}"
        )
    
    # Create job ID
    job_id = f"{request.exam_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    # Initialize job status
    jobs[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "progress": 0.0,
        "message": "Starting CSV generation...",
        "result": None
    }
    
    # Start generation in background
    background_tasks.add_task(
        generate_csv_background,
        job_id,
        request.exam_name,
        request.questions_per_subject
    )
    
    return {
        "job_id": job_id,
        "status": "processing",
        "message": f"CSV generation started for {request.exam_name}"
    }


async def generate_csv_background(job_id: str, exam_name: str, questions_per_subject: int):
    """Background task for CSV generation"""
    try:
        # Update progress
        jobs[job_id]["progress"] = 10
        jobs[job_id]["message"] = f"Generating questions for {exam_name}..."
        
        # Generate CSV
        result = csv_generator.generate_exam_csv(
            exam_name=exam_name,
            questions_per_subject=questions_per_subject,
            output_dir=OUTPUT_DIR
        )
        
        if result['success']:
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["progress"] = 100
            jobs[job_id]["message"] = "CSV generation completed successfully"
            jobs[job_id]["result"] = result
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["message"] = result.get('error', 'Unknown error')
            
    except Exception as e:
        logger.error(f"CSV generation error: {str(e)}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["message"] = str(e)


# Convert PDF to CSV
@app.post("/pdf-to-csv")
async def pdf_to_csv(
    background_tasks: BackgroundTasks,
    exam_name: str,
    year: str,
    subject: str,
    pdf_file: UploadFile = File(...),
    answer_key_file: Optional[UploadFile] = File(None)
):
    """Convert PDF question paper to CSV format"""
    
    try:
        # Save uploaded files
        pdf_path = os.path.join(UPLOAD_DIR, f"pdf_{datetime.utcnow().timestamp()}_{pdf_file.filename}")
        with open(pdf_path, "wb") as f:
            shutil.copyfileobj(pdf_file.file, f)
        
        answer_key_path = None
        if answer_key_file:
            answer_key_path = os.path.join(UPLOAD_DIR, f"answer_{datetime.utcnow().timestamp()}_{answer_key_file.filename}")
            with open(answer_key_path, "wb") as f:
                shutil.copyfileobj(answer_key_file.file, f)
        
        # Create job ID
        job_id = f"pdf_{exam_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Initialize job status
        jobs[job_id] = {
            "job_id": job_id,
            "status": "processing",
            "progress": 0.0,
            "message": "Starting PDF extraction...",
            "result": None
        }
        
        # Start extraction in background
        background_tasks.add_task(
            pdf_to_csv_background,
            job_id,
            exam_name,
            year,
            subject,
            pdf_path,
            answer_key_path
        )
        
        return {
            "job_id": job_id,
            "status": "processing",
            "message": "PDF extraction started"
        }
        
    except Exception as e:
        logger.error(f"PDF upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def pdf_to_csv_background(job_id: str, exam_name: str, year: str, subject: str, pdf_path: str, answer_key_path: Optional[str]):
    """Background task for PDF to CSV conversion"""
    try:
        # Update progress
        jobs[job_id]["progress"] = 20
        jobs[job_id]["message"] = "Extracting questions from PDF..."
        
        # Extract from PDF
        extraction_result = pdf_extractor.extract_from_pdf(pdf_path, answer_key_path)
        
        if not extraction_result['success']:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["message"] = extraction_result.get('error', 'PDF extraction failed')
            return
        
        # Update progress
        jobs[job_id]["progress"] = 60
        jobs[job_id]["message"] = "Converting to CSV format..."
        
        # Convert extracted questions to CSV format
        csv_questions = []
        for q in extraction_result['questions']:
            # Generate UID
            uid = str(uuid.uuid4())
            
            # Handle images if any
            image_url = ""
            if uploadthing_client and q.get('related_images'):
                # Upload first related image
                img = q['related_images'][0]
                img_data = img['data']
                img_filename = f"{uid}_image.{img['format']}"
                
                upload_result = uploadthing_client.upload_base64_image(img_data, img_filename)
                if upload_result['success']:
                    image_url = upload_result['url']
            
            # Create CSV row
            csv_row = {
                'UID': uid,
                'Exam': exam_name,
                'Year': year,
                'Subject': subject,
                'Chapter': 'Extracted from PDF',
                'Topic': subject,
                'QuestionType': 'MCQ-SC',
                'QuestionText': q['question_text'],
                'OptionA': q['options'][0] if len(q['options']) > 0 else '',
                'OptionB': q['options'][1] if len(q['options']) > 1 else '',
                'OptionC': q['options'][2] if len(q['options']) > 2 else '',
                'OptionD': q['options'][3] if len(q['options']) > 3 else '',
                'CorrectAnswer': q.get('correct_answer', ''),
                'AnswerChoicesCount': len(q['options']),
                'Marks': 2,
                'NegativeMarks': -0.5,
                'TimeLimitSeconds': 120,
                'Difficulty': 'Medium',
                'Tags': f'{exam_name},{subject}',
                'FormulaLaTeX': '',
                'ImageUploadThingURL': image_url,
                'ImageAltText': f"Image for question {q['question_number']}",
                'Explanation': '',
                'ConfidenceScore': q.get('confidence_score', 0.5),
                'SourceNotes': q.get('source_notes', 'Extracted from PDF')
            }
            
            csv_questions.append(csv_row)
        
        # Write CSV
        csv_filename = f"{exam_name}_{subject}_{year}_extracted.csv"
        csv_path = os.path.join(OUTPUT_DIR, csv_filename)
        
        import csv
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=CSVGenerator.CSV_COLUMNS)
            writer.writeheader()
            writer.writerows(csv_questions)
        
        # Generate report
        report_filename = f"{exam_name}_{subject}_{year}_extraction_report.txt"
        report_path = os.path.join(OUTPUT_DIR, report_filename)
        
        with open(report_path, 'w') as f:
            f.write(f"PDF Extraction Report\n")
            f.write(f"{'=' * 60}\n\n")
            f.write(f"Extraction Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
            f.write(f"Exam: {exam_name}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Year: {year}\n")
            f.write(f"Total Questions Extracted: {len(csv_questions)}\n\n")
            
            if extraction_result.get('warnings'):
                f.write("Warnings:\n")
                for warning in extraction_result['warnings']:
                    f.write(f"  - {warning}\n")
            else:
                f.write("No warnings. Extraction completed successfully.\n")
        
        # Update job status
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["message"] = "PDF conversion completed successfully"
        jobs[job_id]["result"] = {
            'success': True,
            'total_questions': len(csv_questions),
            'csv_file': csv_path,
            'report_file': report_path,
            'warnings': extraction_result.get('warnings', [])
        }
        
        # Cleanup
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        if answer_key_path and os.path.exists(answer_key_path):
            os.remove(answer_key_path)
            
    except Exception as e:
        logger.error(f"PDF to CSV conversion error: {str(e)}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["message"] = str(e)


# Get job status
@app.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a background job"""
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return jobs[job_id]


# Download generated CSV
@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated CSV or report file"""
    
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='text/csv' if filename.endswith('.csv') else 'text/plain'
    )


# List all generated files
@app.get("/generated-files")
async def list_generated_files():
    """List all generated CSV and report files"""
    
    files = []
    if os.path.exists(OUTPUT_DIR):
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                files.append({
                    'filename': filename,
                    'size': os.path.getsize(file_path),
                    'created_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat()
                })
    
    return {'files': files}


# Configure API keys
@app.post("/configure")
async def configure_api_keys(
    gemini_api_key: Optional[str] = None,
    uploadthing_secret: Optional[str] = None,
    uploadthing_app_id: Optional[str] = None
):
    """Configure API keys (for testing/development)"""
    
    global csv_generator, uploadthing_client, GEMINI_API_KEY, UPLOADTHING_SECRET, UPLOADTHING_APP_ID
    
    if gemini_api_key:
        GEMINI_API_KEY = gemini_api_key
        csv_generator = CSVGenerator(GEMINI_API_KEY, uploadthing_client)
    
    if uploadthing_secret and uploadthing_app_id:
        UPLOADTHING_SECRET = uploadthing_secret
        UPLOADTHING_APP_ID = uploadthing_app_id
        uploadthing_client = UploadThingClient(UPLOADTHING_SECRET, UPLOADTHING_APP_ID)
        
        if csv_generator:
            csv_generator.uploadthing_client = uploadthing_client
    
    return {
        "success": True,
        "message": "API keys configured",
        "gemini_configured": csv_generator is not None,
        "uploadthing_configured": uploadthing_client is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")
