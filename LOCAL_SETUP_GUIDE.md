# 🚀 Local Development Setup Guide - Quiz Application

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Port & URL Configuration](#port--url-configuration)
5. [Environment Variables Explained](#environment-variables-explained)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Testing the Setup](#testing-the-setup)

---

## 🏗️ Architecture Overview

This quiz application consists of **THREE separate applications** that share **ONE backend**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Mobile App   │    │  Web App     │    │ Admin Dashboard  │  │
│  │ (Expo/RN)    │    │ (Next.js)    │    │ (Next.js+Node)   │  │
│  │ Port: Varies │    │ Port: 3000   │    │ Frontend: 3001   │  │
│  │              │    │              │    │ Backend: 8002    │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                    │                      │            │
│         └────────────────────┼──────────────────────┘            │
│                              │                                   │
│                    ┌─────────▼─────────┐                         │
│                    │  SHARED BACKEND   │                         │
│                    │   (FastAPI)       │                         │
│                    │   Port: 8001      │                         │
│                    └─────────┬─────────┘                         │
│                              │                                   │
│                    ┌─────────▼─────────┐                         │
│                    │   MongoDB         │                         │
│                    │   Port: 27017     │                         │
│                    │   (Local)         │                         │
│                    └───────────────────┘                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points:
- **user_app/backend** = Main shared backend (FastAPI) on port **8001**
- **web_app** = Does NOT have its own backend, uses user_app/backend
- **admin_dashboard/backend** = Separate Node.js backend on port **8002** (admin-specific features only)
- **MongoDB** = Local database on port **27017**

---

## 🔧 Prerequisites

Before starting, ensure you have:

1. **Python 3.11+** installed
2. **Node.js 18+** and npm/yarn installed
3. **MongoDB** installed and running locally
4. **Git** installed

### Check if MongoDB is running:
```bash
# Check if MongoDB process is running
pgrep -a mongod

# If not running, start it
sudo systemctl start mongod
# OR (Mac)
brew services start mongodb-community
```

---

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd quiz-app
```

---

### Step 2: Setup Shared Backend (MOST IMPORTANT!)

This backend serves BOTH mobile app AND web app.

```bash
cd user_app/backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db
JWT_SECRET=your_jwt_secret_key_change_in_production_2024
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=AIzaSyAP3N0jTzOMpLTRyy9d77Osq2gwpxZned4
EOF

# Start the backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**✅ Backend should now be running on http://localhost:8001**

Test it:
```bash
# In a new terminal
curl http://localhost:8001/docs
# Should return HTML page (Swagger docs)
```

---

### Step 3: Setup Web App (Frontend only)

The web app does NOT have its own backend!

```bash
cd web_app/frontend

# Install dependencies
npm install
# OR
yarn install

# Create .env file
cat > .env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8001/api
EOF

# Create .env.local (overrides .env)
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8001/api
EOF

# Start the web app
npm run dev
# OR
yarn dev
```

**✅ Web app should now be running on http://localhost:3000**

---

### Step 4: Setup Mobile App (Expo)

```bash
cd user_app/frontend

# Install dependencies
yarn install

# Create/Update .env file
cat > .env << 'EOF'
EXPO_TUNNEL_SUBDOMAIN=quizify-admin
EXPO_PACKAGER_HOSTNAME=http://10.72.20.143:8001
EXPO_PUBLIC_BACKEND_URL=http://10.72.20.143:8001
EXPO_USE_FAST_RESOLVER=1
METRO_CACHE_ROOT=/user_app/frontend/.metro-cache
EAS_SKIP_AUTO_FINGERPRINT=1
EOF

# Start Expo
yarn start
# OR
expo start
```

**Note:** For mobile app:
- **Android Emulator**: Use `http://10.0.2.2:8001`
- **iOS Simulator**: Use `http://localhost:8001`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:8001`)

---

### Step 5: Setup Admin Dashboard (Optional)

Admin dashboard has its own separate backend.

#### Admin Backend:
```bash
cd admin_dashboard/backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
# Database (Shared with User App)
DATABASE_URL=mongodb+srv://tracktravellingapp_db_user:1dnz5bKXAabypS85@quiz.bo7k6ct.mongodb.net/quizdb?retryWrites=true&w=majority&appName=Quiz

# JWT
JWT_SECRET=prhIMBXU541NeQOXaBhScMPGvwXhWHvgToJ4Bp0QIEwkJfqCU4a7pY4RTvdReONm
JWT_EXPIRES_IN=7d

# Server
PORT=8002
NODE_ENV=development

# Python Microservice URL
PYTHON_SERVICE_URL=http://localhost:8003

# Gemini AI
GEMINI_API_KEY=AIzaSyAP3N0jTzOMpLTRyy9d77Osq2gwpxZned4

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Backend API URL (User App Backend)
BACKEND_API_URL=http://localhost:8001

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@quizapp.com
SMTP_PASS=sample_password_123
SMTP_FROM=Quiz App Admin <admin@quizapp.com>
EOF

# Start admin backend
npm run dev
```

#### Admin Frontend:
```bash
cd admin_dashboard/frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8002/api
NEXT_PUBLIC_APP_NAME=Quiz Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF

# Start admin frontend
npm run dev
```

**✅ Admin should now be running on:**
- Frontend: http://localhost:3001
- Backend: http://localhost:8002

---

## 🔌 Port & URL Configuration

### Complete Port Map

| Application | Component | Port | URL |
|------------|-----------|------|-----|
| **User Backend** | FastAPI (Shared) | 8001 | http://localhost:8001 |
| **Web App** | Next.js Frontend | 3000 | http://localhost:3000 |
| **Mobile App** | Expo Dev Server | Varies | Via Expo Go app |
| **Admin Backend** | Node.js | 8002 | http://localhost:8002 |
| **Admin Frontend** | Next.js | 3001 | http://localhost:3001 |
| **Admin Python Service** | FastAPI | 8003 | http://localhost:8003 |
| **MongoDB** | Database | 27017 | mongodb://localhost:27017 |

### API URLs Explained

#### For Web App (web_app/frontend):
```bash
# .env or .env.local
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```
**Why `/api`?**
- The FastAPI backend prefixes all routes with `/api`
- Example routes: `/api/auth/login`, `/api/exams`, `/api/questions`

#### For Mobile App (user_app/frontend):
```bash
# .env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_COMPUTER_IP:8001
```
**Important:**
- Replace `YOUR_COMPUTER_IP` with your actual local IP
- Find it: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
- Example: `http://192.168.1.100:8001`

#### For Admin Frontend:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8002/api
```
**Note:** Admin uses its own backend (port 8002), not the shared backend!

---

## 🔐 Environment Variables Explained

### User App Backend (.env)
```bash
# Database Connection
MONGO_URL=mongodb://localhost:27017
DB_NAME=quiz_app_db

# Authentication
JWT_SECRET=your_secret_key_here  # Change in production!
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
```

### Web App Frontend (.env & .env.local)
```bash
# Backend API URL - MUST include /api
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

### Mobile App Frontend (.env)
```bash
# Expo Configuration
EXPO_TUNNEL_SUBDOMAIN=quizify-admin
EXPO_PACKAGER_HOSTNAME=http://YOUR_IP:8001
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:8001

# Performance
EXPO_USE_FAST_RESOLVER=1
METRO_CACHE_ROOT=/user_app/frontend/.metro-cache
EAS_SKIP_AUTO_FINGERPRINT=1
```

---

## ❌ Common Issues & Solutions

### Issue 1: "403 Forbidden" when accessing `/api/auth/me`

**Problem:** Web app shows "403 Forbidden" when trying to authenticate.

**Causes:**
1. Backend not running on port 8001
2. Wrong URL in `.env` (missing `/api`)
3. Invalid JWT token

**Solutions:**
```bash
# 1. Check if backend is running
curl http://localhost:8001/docs
# Should return HTML

# 2. Check .env file
cd web_app/frontend
cat .env
# Should show: NEXT_PUBLIC_API_URL=http://localhost:8001/api

# 3. Test signup/login directly
curl -X POST http://localhost:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

### Issue 2: MongoDB Connection Refused (localhost:27017)

**Problem:** Backend shows `Connection refused` error for MongoDB.

**Causes:**
1. MongoDB not installed
2. MongoDB not running
3. Wrong MONGO_URL in .env

**Solutions:**
```bash
# 1. Check if MongoDB is running
pgrep -a mongod

# 2. Start MongoDB
sudo systemctl start mongod
# OR (Mac)
brew services start mongodb-community

# 3. Verify connection
mongo --eval "db.version()"
# OR
mongosh --eval "db.version()"

# 4. Check .env
cd user_app/backend
cat .env | grep MONGO_URL
# Should show: MONGO_URL=mongodb://localhost:27017
```

**Alternative:** Use MongoDB Atlas (Cloud):
```bash
# In user_app/backend/.env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/quiz_app_db?retryWrites=true&w=majority
```

---

### Issue 3: Mobile App Shows "Something Went Wrong"

**Problem:** Mobile app can't connect to backend.

**Causes:**
1. Wrong IP address in EXPO_PUBLIC_BACKEND_URL
2. Backend not accessible from mobile device
3. Firewall blocking connections

**Solutions:**
```bash
# 1. Find your computer's IP address
# Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr IPv4

# 2. Update user_app/frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_ACTUAL_IP:8001

# Example:
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001

# 3. Test from mobile/emulator
curl http://YOUR_IP:8001/docs
```

---

### Issue 4: Web App Can't Login/Signup

**Problem:** Login/signup buttons don't work, console shows errors.

**Causes:**
1. NEXT_PUBLIC_API_URL missing `/api`
2. Backend CORS not configured
3. TypeScript errors in frontend

**Solutions:**
```bash
# 1. Fix .env
cd web_app/frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8001/api" > .env
echo "NEXT_PUBLIC_API_URL=http://localhost:8001/api" > .env.local

# 2. Restart Next.js
pkill -f "next dev"
npm run dev

# 3. Check backend CORS
cd user_app/backend
grep -A 5 "CORSMiddleware" server.py
# Should allow http://localhost:3000
```

---

### Issue 5: TypeScript Errors in QuestionCard.tsx

**Problem:** TypeScript errors about missing properties: `image`, `hint`, `code_language`, `code_snippet`.

**Solution:** Already fixed! The `Question` interface now includes:
```typescript
export interface Question {
  // ... existing fields ...
  hint?: string;
  solution?: string;
  code_snippet?: string;
  code_language?: string;
  image?: string;
  image_url?: string;
  formula?: string;
}
```

---

## ✅ Testing the Setup

### Test Backend
```bash
# Health check (if endpoint exists)
curl http://localhost:8001/

# Signup
curl -X POST http://localhost:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get exams (requires auth)
TOKEN="your_token_here"
curl http://localhost:8001/api/exams \
  -H "Authorization: Bearer $TOKEN"
```

### Test Web App
1. Open http://localhost:3000
2. Click "Sign Up" and create account
3. Login with credentials
4. Navigate to dashboard

### Test Mobile App
1. Open Expo Go app on your phone
2. Scan QR code from terminal
3. App should load and show login screen
4. Sign up and test features

---

## 🎯 Quick Reference: What Runs Where?

### When Developing Locally:

#### Terminal 1 - Backend (REQUIRED!)
```bash
cd user_app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### Terminal 2 - Web App (Optional)
```bash
cd web_app/frontend
npm run dev
```

#### Terminal 3 - Mobile App (Optional)
```bash
cd user_app/frontend
yarn start
```

#### Terminal 4 - Admin Backend (Optional)
```bash
cd admin_dashboard/backend
npm run dev
```

#### Terminal 5 - Admin Frontend (Optional)
```bash
cd admin_dashboard/frontend
npm run dev
```

---

## 📞 Need Help?

If you're still having issues:

1. **Check all processes are running:**
```bash
# Backend
curl http://localhost:8001/docs

# Web App
curl http://localhost:3000

# MongoDB
pgrep -a mongod
```

2. **Check logs:**
```bash
# Backend logs (in terminal where uvicorn is running)
# Web app logs (in terminal where npm run dev is running)
# Mobile logs (in Expo Go app or terminal)
```

3. **Restart everything:**
```bash
# Kill all processes
pkill -f uvicorn
pkill -f "next dev"
pkill -f expo

# Restart in order: MongoDB → Backend → Frontend
```

---

**Last Updated:** October 2025
**Version:** 2.0.0
