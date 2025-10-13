export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_ME: '/api/auth/me',
  FORGOT_PASSWORD: '/api/forgot-password',
  RESET_PASSWORD: '/api/reset-password',
  
  // Profile
  PROFILE_UPDATE: '/api/profile/update',
  
  // Hierarchy
  EXAMS: '/api/exams',
  SUBJECTS: '/api/subjects',
  CHAPTERS: '/api/chapters',
  TOPICS: '/api/topics',
  SUB_TOPICS: '/api/sub-topics',
  SECTIONS: '/api/sections',
  SUB_SECTIONS: '/api/sub-sections',
  
  // Questions
  QUESTIONS: '/api/questions',
  QUESTIONS_FILTERED: '/api/questions/filtered',
  
  // Search
  SEARCH: '/api/search',
  
  // Tests
  TESTS_SUBMIT: '/api/tests/submit',
  TESTS_HISTORY: '/api/tests/history',
  
  // Bookmarks
  BOOKMARKS: '/api/bookmarks',
  BOOKMARKS_BATCH: '/api/bookmarks/batch',
  
  // Analytics
  ANALYTICS_PERFORMANCE: '/api/analytics/performance',
  ANALYTICS_DIFFICULTY: '/api/analytics/difficulty-breakdown',
  RECOMMENDATIONS: '/api/recommendations/tests',
  
  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
  LEADERBOARD_FILTERED: '/api/leaderboard/filtered',
};
