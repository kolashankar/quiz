# Genuis User Web App - Frontend

Next.js-based web version of the Genuis mobile app, providing the same features in a responsive web interface.

## Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Hamburger Sidebar**: Collapsible navigation menu
- **Authentication**: Email/password login and signup
- **Quiz Mode**: Timed tests with real-time scoring
- **Practice Mode**: Untimed practice
- **8-Level Hierarchy**: Navigate through exam structure
- **Bookmarks**: Save and review questions
- **Analytics Dashboard**: Performance insights and charts
- **Leaderboard**: Compare scores with others
- **AI Recommendations**: Personalized study suggestions
- **Profile Management**: Update info and settings

## Technology Stack

- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Axios for API calls
- React Context for state management
- Heroicons for icons
- Recharts for analytics visualizations

## Installation

```bash
cd web_app/frontend
yarn install
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Development

```bash
yarn dev  # Runs on http://localhost:3000
```

## Build & Deploy

```bash
yarn build
yarn start
```

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Auth pages (login, signup)
│   ├── dashboard/         # Main dashboard and features
│   │   ├── page.tsx      # Home dashboard
│   │   ├── quiz/         # Quiz pages
│   │   ├── practice/     # Practice mode
│   │   ├── bookmarks/    # Bookmarks
│   │   ├── analytics/    # Analytics
│   │   ├── leaderboard/  # Leaderboard
│   │   ├── profile/      # Profile
│   │   └── layout.tsx    # Dashboard layout with sidebar
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home redirect
├── components/            # Reusable components
│   └── Sidebar.tsx       # Navigation sidebar
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication
├── services/              # API services
│   └── api.ts            # Axios instance
└── app/globals.css       # Global styles
```

## Key Pages

### Authentication
- `/auth/login` - User login
- `/auth/signup` - User registration

### Dashboard
- `/dashboard` - Home dashboard with stats and recommendations
- `/dashboard/quiz` - Browse and take quizzes
- `/dashboard/practice` - Practice mode
- `/dashboard/bookmarks` - Saved questions
- `/dashboard/leaderboard` - User rankings
- `/dashboard/analytics` - Performance analytics
- `/dashboard/notifications` - Notifications
- `/dashboard/profile` - User profile
- `/dashboard/settings` - App settings

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Sidebar Behavior

- **Mobile/Tablet**: Hamburger menu icon, sidebar slides in from left
- **Desktop**: Sidebar always visible, content shifts right

## Features Comparison with Mobile App

| Feature | Mobile | Web |
|---------|--------|-----|
| Authentication | ✅ | ✅ |
| Quiz Mode | ✅ | ✅ |
| Practice Mode | ✅ | ✅ |
| Bookmarks | ✅ | ✅ |
| Analytics | ✅ | ✅ |
| Leaderboard | ✅ | ✅ |
| AI Recommendations | ✅ | ✅ |
| Push Notifications | ✅ | ❌ |
| Offline Mode | ✅ | ❌ |

## Backend API

The web app uses the same FastAPI backend as the mobile app (`/user_app/backend/`).

## Styling

- Tailwind CSS for utility-first styling
- Dark mode support
- Custom color scheme matching mobile app

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Testing

Test the responsive design:
- Chrome DevTools responsive mode
- Different screen sizes
- Touch interactions on tablets

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Self-hosted
```bash
yarn build
yarn start
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Server-side rendering (SSR)
- Code splitting
- Image optimization
- Lazy loading
