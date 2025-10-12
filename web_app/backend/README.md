# Genuis User Web App - Backend

**Note:** The web app shares the same backend as the user mobile app.

## Backend Location

The backend for both the mobile app and web app is located at:
```
/user_app/backend/
```

## Why Shared Backend?

- **Single Source of Truth**: One API serves both platforms
- **Consistent Data**: Same database and business logic
- **Easier Maintenance**: Update once, works everywhere
- **Code Reuse**: No duplication of authentication, validation, etc.

## API Base URL

Both applications connect to the same FastAPI server:
```
http://localhost:8001
```

## Supported Clients

1. **Mobile App** (Expo/React Native)
2. **Web App** (Next.js)
3. **Admin Dashboard** (Next.js)

## Key Features

- RESTful API
- JWT authentication
- MongoDB database
- Gemini AI integration
- Push notifications (mobile only)
- File uploads (CSV/Excel)
- Real-time analytics

## Setup & Installation

Refer to the main backend README:
```
/user_app/backend/README.md
```

## API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Environment Configuration

The same `.env` file in `/user_app/backend/` is used.

## Database

Shared MongoDB database:
- Database Name: `quiz_app_db`
- Connection: `mongodb://localhost:27017`

## CORS Configuration

The backend is configured to accept requests from:
- Mobile app (Expo)
- Web app (Next.js on port 3000)
- Admin dashboard (Next.js on port 3002)

## Development

Start the backend server:
```bash
cd /user_app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Testing

Test API endpoints:
```bash
# Health check
curl http://localhost:8001/api/health

# Test authentication
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Architecture

```
╭─────────────────╮
│ Mobile App      │
│ (Expo)          │
╰────────┬───────╯
         │
         │ HTTP/REST
         │
╭────────┴────────╮
│                  │
│  FastAPI Backend │
│  (Port 8001)     │
│                  │
╰────────┬────────╯
         │
         │ HTTP/REST
         │
╭────────┴────────╮
│ Web App         │
│ (Next.js)       │
╰─────────────────╯
```

## Scaling

For production:
- Use load balancer for multiple backend instances
- Enable MongoDB replication
- Use Redis for caching
- CDN for static assets

## Monitoring

- Health endpoint: `/api/health`
- Logs: Check FastAPI logs
- Database: MongoDB Atlas monitoring

## Support

For backend issues, refer to:
- `/user_app/backend/README.md`
- API documentation at `/docs`
- GitHub issues
