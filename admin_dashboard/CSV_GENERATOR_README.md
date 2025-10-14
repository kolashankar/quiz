# PDF-to-CSV Pipeline & AI Exam CSV Generator

## Overview

This feature provides a complete pipeline for:
1. **AI-powered CSV generation**: Generate 600 high-quality exam questions using Gemini AI
2. **PDF-to-CSV conversion**: Extract questions from PDF papers with OCR support
3. **UploadThing integration**: Automatic image upload and URL generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Admin Dashboard Frontend                   │
│              (React/Next.js - Port 3001)                    │
│              /dashboard/csv-generator                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend (Port 8002)                     │
│          /api/admin/csv-generator/*                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Proxy to Python Service
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Python FastAPI Microservice (Port 8003)             │
│    - PDF Extraction (PyMuPDF + Tesseract OCR)              │
│    - CSV Generation (Gemini AI)                             │
│    - UploadThing Integration                                │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
/app/admin_dashboard/
├── backend/
│   ├── src/routes/csv-generator/
│   │   └── admin.js              # Node.js API routes
│   └── python_services/
│       ├── main.py                # FastAPI microservice
│       ├── pdf_extractor.py       # PDF extraction logic
│       ├── csv_generator.py       # CSV generation logic
│       ├── uploadthing_client.py  # UploadThing integration
│       ├── requirements.txt       # Python dependencies
│       └── .env                   # Configuration
└── frontend/
    └── src/app/dashboard/csv-generator/
        └── page.tsx               # UI component
```

## Setup Instructions

### 1. Install Dependencies

**Python dependencies:**
```bash
cd /app/admin_dashboard/backend/python_services
pip install -r requirements.txt
```

**System dependencies:**
```bash
apt-get update
apt-get install -y tesseract-ocr
```

**Node.js dependencies:**
```bash
cd /app/admin_dashboard/backend
npm install
```

### 2. Configure Environment Variables

**Python service (.env):**
```env
UPLOADTHING_SECRET=sk_live_0e4d8e238d8eb2617131bd7c8ffc2e97f1fb5461d0d14a56bcb7cfd08d6ae473
UPLOADTHING_APP_ID=6bg2nvya79
GEMINI_API_KEY=sk-emergent-88eCeEaD982EcB45b3
PORT=8003
```

**Node.js backend (.env):**
```env
PORT=8002
PYTHON_SERVICE_URL=http://localhost:8003
```

### 3. Start Services

**Start Python microservice:**
```bash
cd /app/admin_dashboard/backend/python_services
python main.py
```

**Start Node.js backend:**
```bash
cd /app/admin_dashboard/backend
npm start
```

**Start Frontend (if not running):**
```bash
cd /app/admin_dashboard/frontend
npm run dev
```

### 4. Verify Services

**Check Python microservice:**
```bash
curl http://localhost:8003/health
```

Expected response:
```json
{
  "status": "healthy",
  "uploadthing_configured": true,
  "gemini_configured": true
}
```

**Check Node.js backend:**
```bash
curl http://localhost:8002/health
```

**Check CSV generator route:**
```bash
curl http://localhost:8002/api/admin/csv-generator/health
```

## API Endpoints

### Generate Exam CSV

**Endpoint:** `POST /api/admin/csv-generator/generate-exam`

**Request Body:**
```json
{
  "exam_name": "JEE",
  "questions_per_subject": 40
}
```

**Response:**
```json
{
  "job_id": "JEE_20250114_123456",
  "status": "processing",
  "message": "CSV generation started for JEE"
}
```

### Convert PDF to CSV

**Endpoint:** `POST /api/admin/csv-generator/pdf-to-csv`

**Form Data:**
- `exam_name`: "JEE"
- `year`: "2024"
- `subject`: "Physics"
- `pdf_file`: File (PDF question paper)
- `answer_key_file`: File (optional, answer key PDF)

**Response:**
```json
{
  "job_id": "pdf_JEE_20250114_123456",
  "status": "processing",
  "message": "PDF extraction started"
}
```

### Check Job Status

**Endpoint:** `GET /api/admin/csv-generator/job-status/:job_id`

**Response:**
```json
{
  "job_id": "JEE_20250114_123456",
  "status": "completed",
  "progress": 100,
  "message": "CSV generation completed successfully",
  "result": {
    "total_questions": 120,
    "csv_file": "/path/to/JEE_questions.csv",
    "json_file": "/path/to/JEE_metadata.json"
  }
}
```

### Download File

**Endpoint:** `GET /api/admin/csv-generator/download/:filename`

Downloads the generated CSV or report file.

### List Generated Files

**Endpoint:** `GET /api/admin/csv-generator/files`

**Response:**
```json
{
  "files": [
    {
      "filename": "JEE_questions.csv",
      "size": 524288,
      "created_at": "2025-01-14T12:34:56.000Z"
    }
  ]
}
```

## CSV Schema

The generated CSV follows this 24-column schema:

| Column | Description |
|--------|-------------|
| UID | Unique identifier (UUID4) |
| Exam | Exam name (JEE, GATE, etc.) |
| Year | Year of the question |
| Subject | Subject name |
| Chapter | Chapter name |
| Topic | Topic name |
| QuestionType | MCQ-SC, MCQ-MC, Integer, TrueFalse, etc. |
| QuestionText | The question text |
| OptionA | Option A text |
| OptionB | Option B text |
| OptionC | Option C text |
| OptionD | Option D text |
| CorrectAnswer | A, B, C, or D |
| AnswerChoicesCount | Number of options (usually 4) |
| Marks | Marks for correct answer |
| NegativeMarks | Negative marks for wrong answer |
| TimeLimitSeconds | Time limit in seconds |
| Difficulty | Easy, Medium, or Hard |
| Tags | Comma-separated tags |
| FormulaLaTeX | LaTeX formula (if any) |
| ImageUploadThingURL | UploadThing image URL |
| ImageAltText | Alt text for image |
| Explanation | Detailed explanation |
| ConfidenceScore | 0.0 to 1.0 |
| SourceNotes | Source information |

## Supported Exams

1. **JEE** (Joint Entrance Examination)
   - Subjects: Physics, Chemistry, Mathematics
   
2. **GATE** (Graduate Aptitude Test in Engineering)
   - Subjects: Computer Science, Electronics, Mechanical Engineering
   
3. **UPSC** (Union Public Service Commission)
   - Subjects: History, Geography, Polity
   
4. **NEET** (National Eligibility cum Entrance Test)
   - Subjects: Physics, Chemistry, Biology
   
5. **NMMS** (National Means cum Merit Scholarship)
   - Subjects: Mathematics, Science, Social Science

## Question Generation Details

- **Questions per subject**: 40 (configurable)
- **Total questions per exam**: 120 (3 subjects × 40 questions)
- **Difficulty distribution**: 30% Easy, 50% Medium, 20% Hard
- **Question types**: MCQ-SC, MCQ-MC, Integer, TrueFalse, AssertionReason
- **AI model**: Gemini Pro via Emergent LLM Key

## PDF Extraction Features

- **OCR Support**: Tesseract OCR for scanned PDFs
- **Text Extraction**: PyMuPDF and pdfplumber for digital PDFs
- **Pattern Recognition**: Multiple question and answer key patterns
- **Image Extraction**: Automatic image extraction and upload to UploadThing
- **Confidence Scoring**: Each extracted question has a confidence score
- **Answer Matching**: Automatic matching of questions with answer keys

## UI Features

### AI CSV Generation
- Exam selection dropdown
- Questions per subject configuration
- Real-time progress bar
- Status updates
- Success/failure notifications
- One-click download

### PDF to CSV Conversion
- Drag-and-drop file upload
- Exam/year/subject configuration
- Optional answer key upload
- Real-time conversion progress
- Warning display for extraction issues
- Download CSV and processing report

### File Manager
- List all generated files
- File size and creation date
- Quick download access

## Troubleshooting

### Python service not starting

```bash
# Check if port 8003 is in use
lsof -i :8003

# Check Python service logs
tail -f /tmp/python_service.log

# Verify dependencies
cd /app/admin_dashboard/backend/python_services
pip list | grep -E 'pymupdf|pytesseract|pdfplumber|google-generativeai'
```

### Node.js backend not starting

```bash
# Check if port 8002 is in use
lsof -i :8002

# Check logs
tail -f /tmp/admin_backend.log

# Verify dependencies
cd /app/admin_dashboard/backend
npm list express axios multer
```

### OCR not working

```bash
# Verify Tesseract installation
tesseract --version

# Reinstall if needed
apt-get install -y tesseract-ocr
```

### UploadThing upload failing

- Verify API keys in `/app/admin_dashboard/backend/python_services/.env`
- Check UploadThing account status
- Review Python service logs for upload errors

## Performance Notes

- **CSV Generation**: Takes 2-5 minutes for 120 questions (depending on AI API speed)
- **PDF Extraction**: 30 seconds to 2 minutes depending on PDF size and quality
- **Background Processing**: All operations run in background to avoid blocking

## Security Considerations

- All routes protected with admin authentication
- File size limits: 50MB for PDF uploads
- Uploaded files cleaned up after processing
- API keys stored securely in environment variables

## Future Enhancements

- [ ] Batch generation for all exams at once
- [ ] Question deduplication across exams
- [ ] Advanced PDF layout detection
- [ ] Support for more question types
- [ ] Question quality scoring
- [ ] Export to multiple formats (Excel, JSON)
- [ ] Scheduling for automated generation

## Support

For issues or questions:
1. Check logs in `/tmp/python_service.log` and `/tmp/admin_backend.log`
2. Verify all services are running using health check endpoints
3. Review environment variables configuration
4. Check Emergent LLM Key balance

---

**Last Updated**: January 2025  
**Version**: 1.0.0
