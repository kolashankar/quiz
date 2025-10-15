# Quiz App Unified Backend

## Overview
A consolidated FastAPI backend serving the **Mobile App (Expo)**, **Web App (Next.js)**, and **Admin Dashboard** with a clean, scalable 5-level nested architecture.

## Architecture

### 5-Level Nested Structure
```
/app/backend/
├── api/                                  # Level 1: API layer
│   └── v1/                               # Level 2: API version
│       ├── auth/                         # Level 3: Feature domain
│       │   ├── routes/                   # Level 4: Layer type
│       │   │   └── auth_routes.py        # Level 5: Specific implementation
│       │   ├── services/
│       │   │   └── auth_service.py
│       │   └── models/
│       │       └── auth_models.py
│       ├── content/                      # Hierarchical content management
│       │   ├── routes/
│       │   ├── services/
│       │   └── models/
│       ├── questions/                    # Question management
│       ├── tests/                        # Test submission & results
│       ├── user/                         # User features (bookmarks, analytics)
│       ├── admin/                        # Admin features
│       └── ai/                           # AI services (Gemini, recommendations)
├── core/                                 # Core utilities
│   ├── config/                           # Settings & configuration
│   ├── database/                         # MongoDB connection
│   ├── security/                         # Auth & password management
│   └── middleware/                       # Error handlers, rate limiting
├── python_services/                      # External Python microservices
│   ├── csv_generator.py                  # AI-powered CSV generation
│   ├── pdf_extractor.py                  # PDF question extraction
│   └── uploadthing_client.py             # File upload service
├── main.py                               # FastAPI application entry point
├── server.py                             # Supervisor entry point (imports main)
└── server_old.py                         # Legacy monolithic server (backup)
```

## Features by Module

### 🔐 Authentication (`api/v1/auth/`)
- User registration (signup)
- User login with JWT tokens
- Profile management
- Push notification token management
- Role-based access control (user/admin)

### 📚 Content Management (`api/v1/content/`)
8-level hierarchical structure:
1. **Exam** (JEE, NEET, UPSC, etc.)
2. **Subject** (Physics, Chemistry, Math, etc.)
3. **Chapter**
4. **Topic**
5. **Sub-Topic**
6. **Section**
7. **Sub-Section**
8. **Questions** (linked to sub-sections)

Each level has full CRUD operations for admins and read-only access for users.

### ❓ Questions (`api/v1/questions/`)
- Question CRUD with 24-column CSV support
- Bulk upload via CSV
- Advanced filtering (by difficulty, tags, subject, chapter, etc.)
- Support for:
  - Multiple choice questions (MCQ-SC, MCQ-MC)
  - Integer type
  - True/False
  - Match the following
  - Assertion-Reason
- Rich content support:
  - LaTeX formulas
  - Code snippets
  - Images (base64)
  - Hints, solutions, explanations

### 📝 Tests (`api/v1/tests/`)
- Test submission with automatic scoring
- Practice mode (no timer, instant feedback)
- Timed quiz mode
- Test history
- Detailed results with:
  - Score & percentage
  - Percentile ranking
  - Question-wise analysis
  - Time taken per question

### 👤 User Features (`api/v1/user/`)
- **Bookmarks**: Save questions for later review
- **Analytics**: 
  - Performance tracking
  - Strong/weak topic identification
  - Progress over time
- **Leaderboard**: Rankings by exam/subject

### 🎯 AI Services (`api/v1/ai/`)
- **Gemini Integration**:
  - Personalized question recommendations
  - Weak topic identification
  - Study plan generation
- **CSV Generation**:
  - AI-powered question generation
  - Topic-specific questions with shortcuts & tricks
- **PDF Extraction**:
  - Extract questions from PDF documents

### 👨‍💼 Admin (`api/v1/admin/`)
- Dashboard analytics
- User management
- Push notifications (broadcast & targeted)
- Notification history
- Bulk operations
- Communication management
- Question quality monitoring

## Core Modules

### Configuration (`core/config/`)
- Environment-based settings
- Pydantic validation
- Centralized configuration management

### Database (`core/database/`)
- MongoDB Motor (async driver)
- Connection pooling
- Database access helpers

### Security (`core/security/`)
- JWT token generation & validation
- Password hashing (bcrypt)
- Authentication dependencies
- Role-based authorization

### Middleware (`core/middleware/`)
- Error handling (HTTP, validation, general)
- Request/response logging
- CORS configuration

## API Endpoints

### Base URL
```
http://localhost:8001/api
```

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/push-token` - Update push token

#### Content (Admin)
- `POST /api/admin/exams` - Create exam
- `GET /api/admin/exams` - Get all exams
- `PUT /api/admin/exams/{id}` - Update exam
- `DELETE /api/admin/exams/{id}` - Delete exam
- Similar endpoints for subjects, chapters, topics, etc.

#### Content (Public)
- `GET /api/exams` - Get all exams
- `GET /api/subjects?exam_id={id}` - Get subjects for exam
- `GET /api/chapters?subject_id={id}` - Get chapters for subject
- And so on...

#### Questions
- `POST /api/admin/questions` - Create question
- `POST /api/admin/questions/bulk-upload` - Bulk upload from CSV
- `GET /api/questions` - Get questions (with filtering)
- `PUT /api/admin/questions/{id}` - Update question
- `DELETE /api/admin/questions/{id}` - Delete question

#### Tests
- `POST /api/tests/submit` - Submit test answers
- `GET /api/tests/history` - Get test history

#### User Features
- `POST /api/bookmarks` - Create bookmark
- `GET /api/bookmarks` - Get user bookmarks
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/analytics` - Get user analytics

## Environment Variables

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db

# JWT
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=8001
HOST=0.0.0.0

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:19006

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
SMTP_FROM=Quiz App <noreply@quizapp.com>
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- MongoDB
- Virtual environment (recommended)

### Installation

1. **Install Dependencies**
```bash
cd /app/backend
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. **Run the Server**
```bash
# Development mode
python main.py

# Or with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

4. **Access API Documentation**
```
http://localhost:8001/docs  # Swagger UI
http://localhost:8001/redoc # ReDoc
```

## Development

### Adding New Endpoints

1. **Create Models** (`api/v1/{module}/models/`)
```python
from pydantic import BaseModel

class ItemCreate(BaseModel):
    name: str
    description: str
```

2. **Create Routes** (`api/v1/{module}/routes/`)
```python
from fastapi import APIRouter
router = APIRouter(prefix="/items", tags=["items"])

@router.post("/")
async def create_item(item: ItemCreate):
    # Implementation
    pass
```

3. **Register Router** (`main.py`)
```python
from api.v1.items.routes import router as items_router
app.include_router(items_router, prefix="/api")
```

### Creating Services

Extract business logic from routes to services:

```python
# api/v1/{module}/services/{module}_service.py
class ItemService:
    @staticmethod
    async def create_item(item_data: dict):
        # Business logic here
        pass
```

## Testing

### Run Tests
```bash
pytest tests/
```

### Test Coverage
```bash
pytest --cov=api --cov=core tests/
```

### Manual API Testing
```bash
# Health check
curl http://localhost:8001/health

# Get exams
curl http://localhost:8001/api/exams

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## Migration from Old Structure

### Current State
- ✅ Core infrastructure migrated
- ✅ Authentication module complete
- ✅ Content management (partial)
- ⚠️ Legacy routes available via `server_old.py`

### Migration Process
The system uses a hybrid approach:
- **New routes**: Organized in `api/v1/` structure
- **Legacy routes**: Imported from `server_old.py` in `main.py`
- **Gradual migration**: Routes being moved to new structure incrementally

### To Complete Migration
1. Move remaining routes to organized structure
2. Extract business logic to services
3. Remove `server_old.py` import from `main.py`
4. Delete `server_old.py`

## Database Schema

### Collections
- `users` - User accounts
- `exams` - Exam definitions
- `subjects` - Subjects per exam
- `chapters` - Chapters per subject
- `topics` - Topics per chapter
- `sub_topics` - Sub-topics per topic
- `sections` - Sections per sub-topic
- `sub_sections` - Sub-sections per section
- `questions` - Questions linked to sub-sections
- `test_results` - Test submissions & results
- `bookmarks` - User bookmarks
- `notifications` - Push notifications
- `user_analytics` - User performance analytics

### Indexes
- `users.email` (unique)
- `questions.sub_section_id`
- `questions.difficulty`
- `test_results.user_id`
- `bookmarks.user_id + question_id` (compound, unique)

## Performance

### Optimization Strategies
- **Async Operations**: All database operations are async
- **Connection Pooling**: MongoDB Motor handles connection pooling
- **Indexing**: Strategic indexes on frequently queried fields
- **Pagination**: Limit results for large collections
- **Caching**: (TODO) Redis for frequently accessed data

### Monitoring
- Health check endpoint: `/health`
- Startup/shutdown logging
- Request/response logging (via middleware)

## Security

### Authentication
- JWT tokens with configurable expiry
- Bcrypt password hashing (cost factor: 12)
- HTTP-only token transmission

### Authorization
- Role-based access control (user/admin)
- Protected admin routes
- Per-endpoint authorization checks

### Best Practices
- Environment variables for secrets
- CORS configuration
- Input validation (Pydantic)
- SQL injection prevention (MongoDB parameterized queries)

## Deployment

### Production Considerations
1. Set `DEBUG=False` in settings
2. Use production-grade MongoDB instance
3. Configure proper CORS origins
4. Use HTTPS
5. Set strong JWT secret
6. Configure rate limiting
7. Set up monitoring & logging
8. Use environment-specific `.env` files

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## Troubleshooting

### Common Issues

**Import Errors**
```bash
# Ensure you're in the correct directory
cd /app/backend
python -c "from main import app; print('OK')"
```

**Database Connection**
```bash
# Check MongoDB is running
mongo --eval "db.adminCommand('ping')"
```

**Port Already in Use**
```bash
# Find and kill process
lsof -ti:8001 | xargs kill -9
```

## Contributing

### Code Style
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions small and focused

### Commit Guidelines
- Use descriptive commit messages
- One feature per commit
- Reference issue numbers

## License
MIT License

## Support
For issues and questions, please create an issue in the repository.

---

**Last Updated:** October 15, 2024  
**Version:** 1.0.0  
**Maintained By:** Quiz App Development Team
