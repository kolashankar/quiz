# Genuis Admin Dashboard - Backend

Node.js backend for the admin dashboard using Express and Prisma.

## Features

- RESTful API for admin operations
- JWT authentication
- Prisma ORM for database
- File upload handling
- CORS configuration

## Technology Stack

- Node.js
- Express.js
- Prisma ORM
- MongoDB
- JWT for authentication
- Multer for file uploads

## Installation

```bash
cd admin_dashboard/backend
npm install
```

## Environment Variables

Create `.env`:

```env
DATABASE_URL=mongodb://localhost:27017/quiz_admin_db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
PORT=8002
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

## Development

```bash
npm run dev  # Runs on port 8002
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Content Management
- `GET/POST/PUT/DELETE /api/admin/exams`
- `GET/POST/PUT/DELETE /api/admin/subjects`
- `GET/POST/PUT/DELETE /api/admin/questions`

### Analytics
- `GET /api/admin/analytics` - Dashboard stats

### Notifications
- `POST /api/admin/notifications/send` - Send push notifications

## Project Structure

```
src/
├── routes/          # API routes
├── controllers/     # Request handlers
├── middlewares/     # Auth, error handling
├── services/        # Business logic
└── utils/           # Helper functions
prisma/
└── schema.prisma    # Database schema
```
