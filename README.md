# Genuis - Comprehensive Quiz Application

A full-stack quiz application with AI-powered features, supporting multiple competitive exams with an 8-level content hierarchy.

## 🌟 Project Overview

**Genuis** is a comprehensive quiz platform consisting of:
1. **Admin Dashboard** (Web) - Content management and analytics
2. **User Mobile App** (Android) - For students to take quizzes
3. **User Web App** (Web) - Web version of the mobile app
4. **Backend API** (FastAPI) - Unified backend serving all applications

## 📁 Project Structure

```
/app/
├── admin_dashboard/        # Admin web dashboard (Next.js)
│   ├── frontend/          # Next.js frontend
│   └── backend/           # Node.js backend (Express/Prisma)
├── user_app/              # User mobile app (Expo/React Native)
│   ├── frontend/          # Expo React Native app
│   └── backend/           # FastAPI backend
├── web_app/               # User web app (Next.js)
│   └── frontend/          # Next.js frontend (shares user_app backend)
└── README.md              # This file
```

## 🎯 Key Features

### For Users
- **8-Level Content Hierarchy**: Exam → Subject → Chapter → Topic → Sub-Topic → Section → Sub-Section → Question
- **Quiz Mode**: Timed tests with real-time scoring
- **Practice Mode**: Untimed practice with instant feedback
- **AI-Powered Recommendations**: Personalized test suggestions based on performance
- **Analytics Dashboard**: Detailed performance insights and progress tracking
- **Bookmarks**: Save important questions for later review
- **Leaderboard**: Compare scores with other users
- **Push Notifications**: Get updates about new content and exams

### For Admins
- **Content Management**: Manage exams, subjects, chapters, topics, and questions
- **Bulk Upload**: CSV/Excel import for questions
- **AI Tools**: Question generation, improvement, and analysis using Gemini Pro
- **Analytics**: User engagement and performance metrics
- **Notification System**: Send targeted or global push notifications
- **Syllabus Management**: Create and manage exam syllabuses with AI assistance

## 🚀 Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt
- **AI Integration**: Google Gemini Pro
- **Push Notifications**: Expo Push Notifications

### Admin Dashboard
- **Framework**: Next.js 14 (React)
- **Backend**: Node.js + Express + Prisma
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Charts**: Recharts

### User Mobile App
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **State Management**: React Context
- **UI**: React Native components

### User Web App
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Backend**: Shares user_app FastAPI backend

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB
- Yarn or npm

### 1. Clone and Install Dependencies

```bash
# Install admin dashboard dependencies
cd admin_dashboard/frontend && yarn install
cd ../backend && npm install

# Install user app dependencies
cd ../../user_app/frontend && yarn install
cd ../backend && pip install -r requirements.txt

# Install web app dependencies
cd ../../web_app/frontend && yarn install
```

### 2. Environment Configuration

#### User App Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Admin Dashboard Backend (.env)
```env
DATABASE_URL=mongodb://localhost:27017/quiz_admin_db
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

#### Web App Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### 3. Start Services

```bash
# Start MongoDB
sudo systemctl start mongodb

# Start User App Backend (Port 8001)
cd user_app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Start Admin Dashboard (Port 8002)
cd admin_dashboard/frontend
yarn dev  # Runs on port 3002

# Start User Mobile App (Port 3000)
cd user_app/frontend
expo start

# Start User Web App (Port 3000)
cd web_app/frontend
yarn dev
```

## 📱 Access Points

| Application | URL | Port |
|------------|-----|------|
| Admin Dashboard | http://localhost:3002 | 3002 |
| User Web App | http://localhost:3000 | 3000 |
| User Mobile App | Via Expo Go App | - |
| Backend API | http://localhost:8001 | 8001 |

## 👤 Default Credentials

### Admin Account
- Email: `admin@quiz.com`
- Password: `admin123`

## 📊 API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

---

**Made with ❤️ by the Genuis Team**
