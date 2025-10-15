# 📚 Quiz Application - Complete System Documentation

## 🏗️ System Architecture

Three integrated applications sharing one backend and database:

```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard    Web App    Mobile App       │
│  (Next.js:3002)  (Next.js:3000)  (Expo)        │
│         │               │            │          │
│         └───────────────┴────────────┘          │
│                     ▼                            │
│        Shared Backend (FastAPI:8001)            │
│                     ▼                            │
│          MongoDB (Single Database)              │
└─────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
quiz-app/
├── user_app/
│   ├── backend/          # FastAPI (SHARED by all apps)
│   └── frontend/         # Expo Mobile App
├── web_app/
│   └── frontend/         # Next.js Web (Responsive)
├── admin_dashboard/
│   ├── backend/          # Admin-specific APIs
│   └── frontend/         # Admin UI
└── sample_data/          # Sample CSV/Excel files
```

## 🚀 Quick Start

> **📘 For detailed setup instructions with troubleshooting, see [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)**

### 1. Backend Setup (user_app/backend) - SHARED BY ALL APPS

⚠️ **IMPORTANT**: This backend serves BOTH mobile and web apps!

```bash
cd user_app/backend
pip install -r requirements.txt

# Create .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db
JWT_SECRET=your_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=AIzaSyAP3N0jTzOMpLTRyy9d77Osq2gwpxZned4
EOF

# Start backend on port 8001
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**✅ Test it:** Open http://localhost:8001/docs

### 2. Mobile App Setup (user_app/frontend)

```bash
cd user_app/frontend
yarn install

# Additional dependencies
yarn add @react-native-async-storage/async-storage
yarn add @react-navigation/native @react-navigation/bottom-tabs
yarn add expo-constants expo-linking expo-notifications
yarn add react-native-chart-kit react-native-svg axios zustand
yarn add expo-image-picker expo-haptics

yarn start
```

### 3. Web App Setup (web_app/frontend)

```bash
cd web_app/frontend
yarn install

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8001/api
EOF

yarn dev  # http://localhost:3000
```

### 4. Admin Dashboard Setup

```bash
cd admin_dashboard/frontend
yarn install

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8001/api
EOF

yarn dev  # http://localhost:3002
```

## 🗄️ Database (Single MongoDB)

### 8-Level Hierarchy:
```
Exam → Subject → Chapter → Topic → Sub-Topic → Section → Sub-Section → Question
```

### Key Collections:
- **users**: Authentication & profiles
- **exams, subjects, chapters, topics, sub_topics, sections, sub_sections**: 8-level hierarchy
- **questions**: Enhanced with hint, solution, code_snippet, image_url, formula
- **test_results**: Quiz results with analytics
- **bookmarks**: User bookmarks
- **password_resets, push_tokens, syllabuses**: Supporting data

### Question Schema (Extended - 24 Column CSV Support):
```javascript
{
  // Core fields
  sub_section_id: String,
  question_text: String,
  options: [String],  // 2-4 options
  correct_answer: Number,  // 0-3
  difficulty: String,  // easy/medium/hard
  tags: [String],
  explanation: String,
  
  // Enhanced fields
  hint: String,
  solution: String,
  code_snippet: String,
  image_url: String,
  formula: String,  // LaTeX format
  
  // Extended fields (24-column CSV format)
  uid: String,  // Unique ID
  exam: String,  // JEE, GATE, UPSC, NEET, NMMS
  year: String,  // Question year
  subject: String,
  chapter: String,
  topic: String,  // Optional
  question_type: String,  // MCQ-SC, MCQ-MC, Integer, TrueFalse, Match, AssertionReason
  answer_choices_count: Number,
  marks: Number,
  negative_marks: Number,
  time_limit_seconds: Number,
  formula_latex: String,
  image_alt_text: String,
  confidence_score: Number,  // 0.0-1.0
  source_notes: String
}
```

## 🔌 API Endpoints

### Authentication
- POST `/api/auth/signup` - Register
- POST `/api/auth/login` - Login
- POST `/api/auth/forgot-password` - Reset request
- POST `/api/auth/reset-password` - Reset
- PUT `/api/profile` - Update profile

### Admin APIs (require admin role)
- CRUD for all 8 levels: `/api/admin/exams`, `/api/admin/subjects`, etc.
- POST `/api/admin/questions/bulk-upload` - CSV upload (supports legacy & 24-column format)
- POST `/api/admin/ai/generate-csv` - AI-powered CSV generation with tips & tricks
- GET `/api/admin/analytics/dashboard`

### User APIs
- GET `/api/exams`, `/api/subjects`, etc. - Browse hierarchy
- GET `/api/questions?sub_section_id=&difficulty=`
- POST `/api/tests/submit` - Submit test
- GET `/api/tests/history`
- GET `/api/analytics/performance` - AI-powered
- GET `/api/leaderboard/filtered?period=weekly`
- POST `/api/bookmarks`, `/api/bookmarks/batch`

## 📦 Dependencies

### Backend (Python)
All in `user_app/backend/requirements.txt`:
- fastapi, uvicorn, motor, pydantic
- python-jose, passlib, bcrypt (auth)
- pandas, openpyxl (CSV/Excel)
- google-generativeai (AI)
- exponent-server-sdk (push notifications)

### Mobile App (package.json)
```json
{
  "expo": "^54.0.13",
  "react": "19.0.0",
  "react-native": "0.79.5",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-navigation/native": "^7.1.6",
  "@react-navigation/bottom-tabs": "^7.3.10",
  "expo-router": "~5.1.4",
  "expo-notifications": "^0.32.12",
  "react-native-chart-kit": "^6.12.0",
  "zustand": "^5.0.8",
  "axios": "^1.12.2"
}
```

### Web App (package.json)
```json
{
  "next": "^14.1.0",
  "react": "^18.2.0",
  "tailwindcss": "^3.4.1",
  "@headlessui/react": "^1.7.18",
  "framer-motion": "^11.0.5",
  "recharts": "^2.10.4",
  "axios": "^1.6.7"
}
```

## 📝 Sample Data Files

### GATE_EEE_Questions.csv
10 Electrical Engineering questions with formulas, hints, solutions

### JEE_Advanced_Questions.xlsx
10 Multi-subject questions (Physics, Chemistry, Math) with professional formatting

**Upload via:**
```bash
curl -X POST http://localhost:8001/api/admin/questions/bulk-upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@sample_data/GATE_EEE_Questions.csv"
```

## 🎯 Features

### Mobile App (Expo)
- 🔐 Authentication
- 📊 Dashboard with analytics
- 🧭 8-level quiz navigation
- ⏱️ Timed quizzes
- 🎯 Practice mode (no timer, instant feedback)
- 📈 Results with explanations
- 🔖 Bookmarks
- 🏆 Leaderboards
- 🤖 AI recommendations (Gemini)
- 📱 Push notifications

### Web App (Next.js) - Fully Responsive
- ✅ All mobile app features
- ✅ Practice mode with exam/subject/chapter filters
- 📱 Mobile & Desktop responsive
- ⚡ Server-side rendering
- 🎨 Modern UI with Tailwind
- 📊 Interactive charts
- 📝 LaTeX formula rendering
- 💻 Code syntax highlighting

### Admin Dashboard
- 📝 Question management (24-column CSV support)
- 📤 CSV bulk upload (legacy & new format)
- 🤖 AI CSV generation with shortcuts & tricks
- 📊 Analytics dashboard
- 👥 User management

## 🔄 How It Works

1. **Single Backend**: `user_app/backend` serves all apps on port 8001
2. **Shared Database**: Single MongoDB with all collections
3. **Role-Based Access**: JWT tokens with admin/user roles
4. **API Prefix**: All routes use `/api/` prefix

### Data Flow:
```
Admin Dashboard → Creates Questions → Backend
                                        ↓
                                  MongoDB
                                        ↓
Mobile/Web App ← Fetches Questions ← Backend
```

## 🔐 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app
JWT_SECRET=your_secret
GEMINI_API_KEY=AIzaSy...
```

### Mobile (.env)
```
EXPO_BACKEND_URL=http://localhost:8001/api
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

## 📊 Features Matrix

| Feature | Mobile | Web | Admin |
|---------|--------|-----|-------|
| Authentication | ✅ | ✅ | ✅ |
| Quiz Navigation | ✅ | ✅ | ✅ |
| Take Quizzes | ✅ | ✅ | ❌ |
| Practice Mode | 🔄 | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ |
| Bookmarks | ✅ | ✅ | ❌ |
| Leaderboard | ✅ | ✅ | ✅ |
| Question Mgmt | ❌ | ❌ | ✅ |
| CSV Upload | ❌ | ❌ | ✅ |
| AI CSV Generator | ❌ | ❌ | ✅ |
| AI Features | ✅ | ✅ | ✅ |
| Responsive | Mobile | All | Desktop |

## 🐛 Common Issues

### Backend won't start
```bash
sudo systemctl start mongodb  # Start MongoDB
lsof -i :8001  # Check port
pip install -r requirements.txt  # Install deps
```

### Mobile can't connect
- Android emulator: use `10.0.2.2:8001`
- iOS simulator: use `localhost:8001`
- Physical device: use computer's IP

### Web build errors
```bash
rm -rf node_modules .next
yarn install && yarn build
```

## 📚 API Documentation

Once backend is running:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 🚢 Deployment

### Backend
- Deploy to: Heroku, Railway, AWS, DigitalOcean
- Use: Uvicorn/Gunicorn

### Mobile
```bash
eas build --platform android
eas build --platform ios
```

### Web
- Deploy to: Vercel, Netlify
```bash
yarn build && yarn start
```

## 🎯 Tech Stack Summary

- **Backend**: FastAPI + MongoDB + Gemini AI
- **Mobile**: React Native + Expo Router + Zustand
- **Web**: Next.js 14 + Tailwind CSS + Recharts
- **Admin**: Next.js + React Quill + Recharts

## 📞 Support

For issues or questions, contact: support@example.com

---
**Version**: 1.0.0 | **Last Updated**: 2025
