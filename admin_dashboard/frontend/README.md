# Genuis Admin Dashboard - Frontend

Next.js-based admin dashboard for managing quiz content, users, and analytics.

## Features

- **Content Management**: Full CRUD for exams, subjects, chapters, topics, questions
- **Bulk Upload**: CSV/Excel import with drag-drop
- **AI Tools**: Question generation and improvement using Gemini Pro
- **Analytics Dashboard**: Interactive charts and metrics
- **Notification System**: Send push notifications to users
- **Responsive Design**: Works on desktop, tablet, and mobile

## Technology Stack

- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Axios for API calls
- React Hook Form
- Recharts for analytics
- React Hot Toast for notifications

## Installation

```bash
cd admin_dashboard/frontend
yarn install
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Development

```bash
yarn dev  # Runs on http://localhost:3002
```

## Build & Deploy

```bash
yarn build
yarn start
```

## Project Structure

```
src/
├── app/              # Next.js 14 App Router pages
│   ├── auth/        # Login page
│   └── dashboard/   # Dashboard pages
├── components/      # Reusable components
├── contexts/        # React contexts (Auth, Theme)
├── services/        # API service layer
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Default Admin Credentials

- Email: `admin@quiz.com`
- Password: `admin123`

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Key Pages

- `/auth/login` - Admin login
- `/dashboard` - Dashboard overview
- `/dashboard/exams` - Exam management
- `/dashboard/subjects` - Subject management
- `/dashboard/questions` - Question management
- `/dashboard/bulk-upload` - CSV/Excel import
- `/dashboard/ai-tools` - AI question tools
- `/dashboard/analytics` - Analytics dashboard
- `/dashboard/notifications` - Push notifications
