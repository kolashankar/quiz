import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
export const API_PREFIX = '/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_PREFIX}/auth/login`,
  AUTH_SIGNUP: `${API_PREFIX}/auth/signup`,
  AUTH_ME: `${API_PREFIX}/auth/me`,
  
  // Hierarchy
  EXAMS: `${API_PREFIX}/exams`,
  SUBJECTS: `${API_PREFIX}/subjects`,
  CHAPTERS: `${API_PREFIX}/chapters`,
  TOPICS: `${API_PREFIX}/topics`,
  SUB_TOPICS: `${API_PREFIX}/sub-topics`,
  SECTIONS: `${API_PREFIX}/sections`,
  SUB_SECTIONS: `${API_PREFIX}/sub-sections`,
  
  // Questions
  QUESTIONS: `${API_PREFIX}/questions`,
  
  // Tests
  TESTS_SUBMIT: `${API_PREFIX}/tests/submit`,
  TESTS_HISTORY: `${API_PREFIX}/tests/history`,
  
  // Bookmarks
  BOOKMARKS: `${API_PREFIX}/bookmarks`,
  
  // Analytics
  ANALYTICS_PERFORMANCE: `${API_PREFIX}/analytics/performance`,
  RECOMMENDATIONS: `${API_PREFIX}/recommendations/tests`,
  
  // Leaderboard
  LEADERBOARD: `${API_PREFIX}/leaderboard`,
};