// Base URL already includes /api from env: http://localhost:8001/api
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_ME: '/auth/me',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Profile
  PROFILE_UPDATE: '/profile/update',
  
  // Hierarchy
  EXAMS: '/exams',
  SUBJECTS: '/subjects',
  CHAPTERS: '/chapters',
  TOPICS: '/topics',
  SUB_TOPICS: '/sub-topics',
  SECTIONS: '/sections',
  SUB_SECTIONS: '/sub-sections',
  
  // Questions
  QUESTIONS: '/questions',
  QUESTIONS_FILTERED: '/questions/filtered',
  
  // Search
  SEARCH: '/search',
  
  // Tests
  TESTS_SUBMIT: '/tests/submit',
  TESTS_HISTORY: '/tests/history',
  
  // Bookmarks
  BOOKMARKS: '/bookmarks',
  BOOKMARKS_BATCH: '/bookmarks/batch',
  
  // Analytics
  ANALYTICS_PERFORMANCE: '/analytics/performance',
  ANALYTICS_DIFFICULTY: '/analytics/difficulty-breakdown',
  RECOMMENDATIONS: '/recommendations/tests',
  
  // Leaderboard
  LEADERBOARD: '/leaderboard',
  LEADERBOARD_FILTERED: '/leaderboard/filtered',
};
