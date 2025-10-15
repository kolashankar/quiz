# Genuis User App - Backend

FastAPI backend serving both mobile and web user applications.

## Features

- **Authentication**: JWT-based auth with bcrypt
- **8-Level Hierarchy**: Full CRUD for exam structure
- **Quiz Management**: Test submission and scoring
- **Analytics**: Performance tracking and insights
- **AI Integration**: Gemini Pro for recommendations
- **Bookmarks**: Save and manage questions
- **Leaderboard**: User rankings
- **Push Notifications**: Expo push notification integration
- **CSV Bulk Upload**: Import questions from CSV

## Technology Stack

- FastAPI (Python 3.9+)
- MongoDB (Motor async driver)
- JWT authentication
- Google Gemini Pro AI
- Expo Push Notifications
- Pandas for CSV processing

## Installation

```bash
cd user_app/backend
pip install -r requirements.txt
```

## Environment Variables

Create `.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your_gemini_api_key_here
```

## Development

```bash
# Start server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## API Documentation

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Hierarchy (Public)
- `GET /api/exams` - List exams
- `GET /api/subjects` - List subjects
- `GET /api/chapters` - List chapters
- `GET /api/topics` - List topics
- `GET /api/sub-topics` - List sub-topics
- `GET /api/sections` - List sections
- `GET /api/sub-sections` - List sub-sections
- `GET /api/questions` - List questions

### Admin Hierarchy
- `POST/PUT/DELETE /api/admin/exams`
- `POST/PUT/DELETE /api/admin/subjects`
- Similar for all hierarchy levels

### User Features
- `POST /api/tests/submit` - Submit test
- `GET /api/tests/history` - Test history
- `GET/POST/DELETE /api/bookmarks` - Bookmark management
- `GET /api/analytics/performance` - User analytics
- `GET /api/analytics/difficulty-breakdown` - Difficulty stats
- `GET /api/recommendations/tests` - AI recommendations
- `GET /api/leaderboard` - Rankings
- `GET /api/leaderboard/filtered` - Filtered leaderboard

### Profile
- `PUT /api/profile` - Update profile

### Notifications
- `POST /api/notifications/register-token` - Register push token
- `POST /api/admin/notifications/send` - Send notifications (admin)
- `GET /api/user/notifications` - Get user notifications

### Search
- `GET /api/search/hierarchy` - Search across hierarchy
- `GET /api/questions/filtered` - Filtered questions

### Bulk Upload
- `POST /api/admin/questions/bulk-upload` - CSV upload

## Database Collections

- `users` - User accounts
- `exams` - Exam categories
- `subjects` - Subjects under exams
- `chapters` - Chapters under subjects
- `topics` - Topics under chapters
- `sub_topics` - Sub-topics
- `sections` - Sections
- `sub_sections` - Sub-sections
- `questions` - Quiz questions
- `test_results` - User test submissions
- `bookmarks` - Saved questions
- `push_tokens` - Device tokens for notifications
- `notifications` - Notification history
- `syllabuses` - Exam syllabuses

## AI Features

### Gemini Pro Integration
- Personalized test recommendations
- Performance analysis
- Study improvement suggestions
- Syllabus generation

## CSV Upload Format

```csv
sub_section_id,question_text,option1,option2,option3,option4,correct_answer,difficulty,tags,explanation
673abc...,What is 2+2?,2,3,4,5,2,easy,math,Simple addition
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=.
```

## Production Deployment

```bash
# Using Gunicorn
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```
