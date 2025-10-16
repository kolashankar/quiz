# Quiz App - Comprehensive Learning Platform

A full-stack quiz application with a unified FastAPI backend serving three frontends: **Mobile App (Expo)**, **Web App (Next.js)**, and **Admin Dashboard (Next.js)**. Features AI-powered question generation, hierarchical content management, and comprehensive analytics.

### 🏗️ Architecture Overview

```
/app/
├── backend/                    # Unified FastAPI Backend
│   ├── api/v1/                # API version 1
│   │   ├── auth/              # Authentication & Authorization
│   │   ├── content/           # Hierarchical Content Management
│   │   ├── questions/         # Question Management
│   │   ├── tests/             # Test Submission & Results
│   │   ├── user/              # User Features (Bookmarks, Analytics)
│   │   ├── admin/             # Admin Features
│   │   └── ai/                # AI Services (Gemini Integration)
│   ├── core/                  # Core Utilities
│   │   ├── config/            # Settings & Configuration
│   │   ├── database/          # MongoDB Connection
│   │   ├── security/          # Auth & Password Management
│   │   └── middleware/        # Error Handlers
│   ├── main.py                # FastAPI Application Entry Point
│   └── requirements.txt       # Python Dependencies
│
├── admin_dashboard/frontend/  # Admin Dashboard (Next.js)
│   ├── src/app/               # Next.js App Router
│   ├── src/components/        # Reusable Components
│   ├── src/services/          # API Services
│   └── package.json           # Node.js Dependencies
│
├── user_app/frontend/         # Mobile App (Expo)
│   ├── app/                   # Expo Router
│   ├── src/components/        # React Native Components
│   ├── src/context/           # Context Providers
│   └── package.json           # Expo Dependencies
│
└── web_app/frontend/          # Web App (Next.js)
    ├── src/app/               # Next.js App Router
    ├── src/components/        # Web Components
    └── package.json           # Node.js Dependencies
```

## 🚀 Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** MongoDB (Motor async driver)
- **Authentication:** JWT (JSON Web Tokens)
- **AI Integration:** Google Gemini API
- **Password Hashing:** bcrypt
- **Server:** Uvicorn (ASGI)

### Frontend
- **Mobile App:** Expo (React Native)
- **Web App:** Next.js 15 (React 19)
- **Admin Dashboard:** Next.js 15 (React 19)
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS (Web), React Native Styles (Mobile)

### Database Schema
- MongoDB collections: `users`, `exams`, `subjects`, `chapters`, `topics`, `sub_topics`, `sections`, `sub_sections`, `questions`, `test_results`, `bookmarks`, `notifications`, `user_analytics`

## 📦 Installation & Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd /app/backend
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**
Create a `.env` file in `/app/backend/`:
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db

# JWT Configuration
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
```

4. **Run the backend:**
```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

5. **Access API Documentation:**
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`
- Health Check: `http://localhost:8001/health`

### Admin Dashboard Setup

1. **Navigate to admin dashboard:**
```bash
cd /app/admin_dashboard/frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Configure environment:**
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_APP_NAME="Quiz Admin Dashboard"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

4. **Run development server:**
```bash
npm run dev
# or
yarn dev
```

5. **Build for production:**
```bash
npm run build
npm run start
```

Access at: `http://localhost:3001`

### Web App Setup

1. **Navigate to web app:**
```bash
cd /app/web_app/frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Configure environment:**
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

4. **Run development server:**
```bash
npm run dev
# or
yarn dev
```

5. **Build for production:**
```bash
npm run build
npm run start
```

Access at: `http://localhost:3000`

### Mobile App Setup

1. **Navigate to mobile app:**
```bash
cd /app/user_app/frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Configure environment:**
Create `.env` file:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

4. **Run development server:**
```bash
npm start
# or
yarn start
```

5. **Run on specific platform:**
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

6. **Scan QR code with Expo Go app** (iOS/Android) or open web preview

## 🎯 Features

### Admin Dashboard Features
✅ **Content Management**
- 8-level hierarchical content structure (Exam → Subject → Chapter → Topic → SubTopic → Section → SubSection → Questions)
- Full CRUD operations for all content levels
- Bulk operations (edit, delete, export)

✅ **Question Management**
- Create, edit, delete questions
- 24-column CSV format support
- Bulk upload via CSV
- Multiple question types: MCQ-SC, MCQ-MC, Integer, True/False, Match the Following, Assertion-Reason
- Rich content support: LaTeX formulas, code snippets, images, hints, solutions, explanations

✅ **AI-Powered Tools**
- AI question generation using Gemini 2.0 Flash
- CSV generation with tricks & shortcuts
- Subject-specific question generation
- Difficulty level distribution (Easy 30%, Medium 50%, Hard 20%)

✅ **Analytics Dashboard**
- User statistics
- Question statistics
- Test performance metrics
- Active users tracking

✅ **User Management**
- View all users
- User activity tracking
- Role management

✅ **Notifications**
- Push notification management
- Broadcast notifications
- Targeted notifications
- Notification history

### Mobile App Features
✅ **Authentication**
- User registration
- Login with JWT
- Profile management

✅ **Quiz Taking**
- 8-level hierarchical quiz navigation
- Timed quiz mode
- Practice mode (no timer, instant feedback)
- Question bookmarking
- LaTeX formula rendering
- Code syntax highlighting

✅ **Performance Tracking**
- Test history
- Detailed results with explanations
- Performance analytics
- Strong/weak topic identification
- Progress tracking over time

✅ **Leaderboard**
- Global rankings
- Exam-specific leaderboards
- Subject-specific rankings

✅ **AI Recommendations**
- Personalized study recommendations
- Weak topic identification
- Question suggestions based on performance

✅ **User Features**
- Dark/Light/Auto theme
- Bookmark management
- Notification center
- Profile editing
- Settings management

### Web App Features
✅ All mobile app features with desktop-optimized UI
✅ Responsive design (mobile, tablet, desktop)
✅ Practice mode with advanced filters
✅ Interactive charts & analytics
✅ Server-side rendering for SEO

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user profile
- `POST /push-token` - Update push notification token

### Content Management (`/api`)
**Admin Routes:**
- `POST /admin/exams` - Create exam
- `GET /admin/exams` - Get all exams
- `PUT /admin/exams/{id}` - Update exam
- `DELETE /admin/exams/{id}` - Delete exam
- Similar endpoints for: subjects, chapters, topics, subtopics, sections, subsections

**Public Routes:**
- `GET /exams` - Get all exams
- `GET /subjects?exam_id={id}` - Get subjects for exam
- `GET /chapters?subject_id={id}` - Get chapters for subject
- And so on for all levels...

### Questions (`/api`)
**Admin Routes:**
- `POST /admin/questions` - Create question
- `POST /admin/questions/bulk-upload` - Bulk upload from CSV
- `PUT /admin/questions/{id}` - Update question
- `DELETE /admin/questions/{id}` - Delete question

**Public Routes:**
- `GET /questions` - Get questions (with filtering)
- `GET /questions/{id}` - Get single question

### Tests (`/api/tests`)
- `POST /submit` - Submit test answers
- `GET /history` - Get test history

### User Features (`/api`)
- `POST /bookmarks` - Create bookmark
- `GET /bookmarks` - Get user bookmarks
- `DELETE /bookmarks/{id}` - Delete bookmark
- `GET /leaderboard` - Get leaderboard
- `GET /analytics` - Get user analytics

### AI Services (`/api/ai`)
- `POST /recommendations` - Get AI-powered study recommendations
- `GET /test-recommendations` - Get test recommendations based on performance
- `POST /generate-csv` - Generate questions CSV using Gemini AI

### Admin Features (`/api/admin`)
- `GET /dashboard` - Dashboard analytics
- `GET /users` - Get all users
- `POST /notifications/send` - Send push notifications
- `GET /notifications/history` - Notification history

## 🛠️ Development Commands

### Backend
```bash
# Run development server
python main.py

# Run with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Run tests
pytest tests/

# Check for linting issues
ruff check .

# Format code
black .
```

### Admin Dashboard
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint

# Type check
npm run type-check
```

### Web App
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint
```

### Mobile App
```bash
# Development
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web

# Clear cache
npm run clear
```

## 🧪 Testing

### Backend Testing
```bash
cd /app/backend
pytest tests/ -v
pytest --cov=api --cov=core tests/
```

### Frontend Testing
```bash
# Admin Dashboard
cd /app/admin_dashboard/frontend
npm run test

# Web App
cd /app/web_app/frontend
npm run test

# Mobile App
cd /app/user_app/frontend
npm run test
```

## 🚢 Deployment

### Backend Deployment
1. Set production environment variables
2. Use production-grade MongoDB instance
3. Configure proper CORS origins
4. Use HTTPS
5. Set strong JWT secret
6. Configure rate limiting

**Docker Deployment:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Deployment
**Vercel (Recommended for Next.js apps):**
```bash
# Admin Dashboard
cd /app/admin_dashboard/frontend
vercel --prod

# Web App
cd /app/web_app/frontend
vercel --prod
```

**Expo (Mobile App):**
```bash
cd /app/user_app/frontend
eas build --platform all
eas submit --platform all
```

## 📊 Database Indexes

For optimal performance, create these MongoDB indexes:
```javascript
// Users
db.users.createIndex({ "email": 1 }, { unique: true })

// Questions
db.questions.createIndex({ "sub_section_id": 1 })
db.questions.createIndex({ "difficulty": 1 })
db.questions.createIndex({ "tags": 1 })

// Test Results
db.test_results.createIndex({ "user_id": 1, "timestamp": -1 })

// Bookmarks
db.bookmarks.createIndex({ "user_id": 1, "question_id": 1 }, { unique: true })
```

## 🔐 Security

- JWT token-based authentication
- Bcrypt password hashing (cost factor: 12)
- Role-based access control (user/admin)
- Input validation using Pydantic
- CORS configuration
- Environment variables for secrets
- Protected admin routes

## 🐛 Troubleshooting

### Backend Issues

**Import Errors:**
```bash
cd /app/backend
python -c "from main import app; print('OK')"
```

**Database Connection:**
```bash
mongo --eval "db.adminCommand('ping')"
```

**Port Already in Use:**
```bash
lsof -ti:8001 | xargs kill -9
```

### Frontend Issues

**Module Not Found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build Errors:**
```bash
npm run clean
npm install
npm run build
```

### Expo Issues

**Metro Bundler Issues:**
```bash
npm start -- --clear
```

**iOS/Android Build Issues:**
```bash
cd ios && pod install
cd android && ./gradlew clean
```

## 📈 Performance Optimization

### Backend
- Async operations for all database calls
- MongoDB connection pooling
- Strategic indexing on frequently queried fields
- Pagination for large result sets
- Response caching (planned)

### Frontend
- Server-side rendering (Next.js)
- Code splitting
- Image optimization
- Lazy loading
- Bundle size optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- **Python:** Follow PEP 8, use type hints
- **JavaScript/TypeScript:** Follow ESLint rules
- **React:** Use functional components with hooks
- **Git:** Conventional commit messages

## 📝 License

MIT License - see LICENSE file for details

## 👥 Team

Quiz App Development Team

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Email: support@quizapp.com
- WhatsApp Community: [Join Here](https://whatsapp.com/channel/0029VaeW5Vu4WT9pTBq8eL2i)

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Unified backend with organized 5-level structure
- ✅ Complete hierarchical content management (8 levels)
- ✅ AI-powered question generation with Gemini
- ✅ Mobile app with Expo
- ✅ Web app with Next.js
- ✅ Admin dashboard with comprehensive features
- ✅ Authentication & authorization
- ✅ Bookmarks & leaderboards
- ✅ Analytics & performance tracking
- ✅ Push notifications
- ✅ Practice & timed quiz modes

## 🎯 Roadmap

### Planned Features
- [ ] Redis caching for improved performance
- [ ] Rate limiting for API endpoints
- [ ] Email notifications
- [ ] Social login (Google, Facebook)
- [ ] Video explanations for questions
- [ ] Live quiz competitions
- [ ] Study groups & collaboration
- [ ] Flashcards & study notes
- [ ] Offline mode for mobile app
- [ ] Advanced analytics with ML insights

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
