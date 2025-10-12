# Genuis User App - Frontend (Mobile)

Expo/React Native mobile application for students to take quizzes and track performance.

## Features

- **Authentication**: Email/password login and signup
- **Quiz Mode**: Timed tests with scoring
- **Practice Mode**: Untimed practice
- **8-Level Hierarchy**: Navigate through exam structure
- **Bookmarks**: Save questions for review
- **Analytics**: Performance tracking and insights
- **Leaderboard**: Compare with other users
- **AI Recommendations**: Personalized study suggestions
- **Push Notifications**: Exam updates
- **Responsive Sidebar**: Hamburger menu navigation

## Technology Stack

- Expo SDK 52
- React Native
- Expo Router (file-based routing)
- TypeScript
- Axios for API calls
- AsyncStorage for local data
- Expo Notifications

## Installation

```bash
cd user_app/frontend
yarn install
```

## Environment Variables

Create `.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

## Development

```bash
# Start Expo development server
expor start

# Start with tunnel (for testing on physical device)
expo start --tunnel

# Run on Android
expo start --android

# Run on iOS
expo start --ios
```

## Project Structure

```
app/
├── (auth)/          # Authentication screens
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/          # Main tab navigation
│   ├── index.tsx   # Home/Dashboard
│   ├── quiz/       # Quiz screens
│   ├── profile.tsx
│   └── bookmarks.tsx
src/
├── components/     # Reusable components
├── context/        # React contexts
├── services/       # API services
└── constants/      # App constants
```

## Key Screens

- **Home**: Dashboard with stats and recommendations
- **Quiz**: Browse and take timed tests
- **Practice**: Untimed practice mode
- **Bookmarks**: Saved questions
- **Profile**: User info and settings
- **Analytics**: Performance insights
- **Leaderboard**: Rankings

## Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## App Configuration

- App name: **Genuis**
- Package: `com.genuis.app`
- Version: 1.0.0

## Testing

- Use Expo Go app on Android/iOS
- Scan QR code from `expo start`
