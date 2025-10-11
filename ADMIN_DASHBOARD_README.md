# Quiz App Admin Dashboard

## Access URL
**Admin Dashboard:** `http://YOUR_DOMAIN:8002` or access via the deployment URL on port 8002

## Default Admin Credentials
- **Email:** admin@quiz.com
- **Password:** admin123

## Features

### 1. Dashboard Overview
- View total users, questions, tests, and exams
- Real-time statistics

### 2. Exam Management
- Create, edit, and delete exams (UPSC, JEE, NEET, EAPCET, etc.)
- Organize competitive exam categories

### 3. Subject Management
- Add subjects under each exam
- Example: Physics, Chemistry, Mathematics for JEE

### 4. Chapter Management
- Create chapters within subjects
- Hierarchical organization: Exam → Subject → Chapter

### 5. Topic Management
- Add topics under each chapter
- Fine-grained content organization

### 6. Question Management
- Add questions with:
  - 4 multiple choice options
  - Correct answer selection
  - Difficulty levels (Easy, Medium, Hard)
  - Tags for categorization
  - Detailed explanations

### 7. Bulk Upload (CSV)
- Upload multiple questions at once
- Download CSV template from the dashboard
- CSV Format:
  ```csv
  topic_id,question_text,option1,option2,option3,option4,correct_answer,difficulty,tags,explanation
  ```

## CSV Template Example

```csv
topic_id,question_text,option1,option2,option3,option4,correct_answer,difficulty,tags,explanation
68e77cdf20554690a1697efc,What is 2+2?,2,3,4,5,2,easy,math,The sum of 2 and 2 is 4
68e77cdf20554690a1697efc,What is the capital of India?,Mumbai,Delhi,Kolkata,Chennai,1,easy,geography,Delhi is the capital city of India
```

**CSV Fields:**
- `topic_id`: ID of the topic (get from Topics section)
- `question_text`: The question
- `option1-4`: Four answer options
- `correct_answer`: Index of correct option (0-3)
- `difficulty`: easy, medium, or hard
- `tags`: Comma-separated tags (optional)
- `explanation`: Detailed explanation (optional)

## How to Use

1. **Login**
   - Navigate to the admin dashboard
   - Enter admin credentials

2. **Create Hierarchy**
   - Start with Exams (e.g., UPSC, JEE)
   - Add Subjects under exams
   - Add Chapters under subjects
   - Add Topics under chapters

3. **Add Questions**
   - **Manual:** Use the Questions tab to add individual questions
   - **Bulk:** Use CSV upload to add multiple questions

4. **Monitor Usage**
   - View dashboard stats
   - Track user engagement

## Technical Details

### Backend API
- **Base URL:** `/api`
- **Authentication:** JWT Bearer token
- **Database:** MongoDB

### API Endpoints Used

**Authentication:**
- POST `/api/auth/login` - Admin login
- GET `/api/auth/me` - Get current user

**Admin Endpoints (Require admin role):**
- POST/GET/PUT/DELETE `/api/admin/exams` - Exam CRUD
- POST/GET/PUT/DELETE `/api/admin/subjects` - Subject CRUD
- POST/GET/PUT/DELETE `/api/admin/chapters` - Chapter CRUD
- POST/GET/PUT/DELETE `/api/admin/topics` - Topic CRUD
- POST/GET/PUT/DELETE `/api/admin/questions` - Question CRUD
- POST `/api/admin/questions/bulk-upload` - CSV upload
- GET `/api/admin/analytics/dashboard` - Dashboard stats

## Security

- Admin-only access with JWT authentication
- Role-based authorization (admin role required)
- Secure password hashing with bcrypt
- CORS enabled for cross-origin requests

## Notes

- Always create the hierarchy in order: Exam → Subject → Chapter → Topic → Questions
- Save topic IDs when creating topics (needed for CSV upload)
- Questions can have tags for better organization
- Explanations help students understand correct answers
