export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const API_PREFIX = '/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_PREFIX}/auth/login`,
  AUTH_SIGNUP: `${API_PREFIX}/auth/signup`,
  AUTH_ME: `${API_PREFIX}/auth/me`,
  FORGOT_PASSWORD: `${API_PREFIX}/forgot-password`,
  RESET_PASSWORD: `${API_PREFIX}/reset-password`,
  
  // Profile
  PROFILE_UPDATE: `${API_PREFIX}/profile/update`,
  
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
  QUESTIONS_FILTERED: `${API_PREFIX}/questions/filtered`,
  
  // Search
  SEARCH: `${API_PREFIX}/search`,
  
  // Tests
  TESTS_SUBMIT: `${API_PREFIX}/tests/submit`,
  TESTS_HISTORY: `${API_PREFIX}/tests/history`,
  
  // Bookmarks
  BOOKMARKS: `${API_PREFIX}/bookmarks`,
  BOOKMARKS_BATCH: `${API_PREFIX}/bookmarks/batch`,
  
  // Analytics
  ANALYTICS_PERFORMANCE: `${API_PREFIX}/analytics/performance`,
  ANALYTICS_DIFFICULTY: `${API_PREFIX}/analytics/difficulty-breakdown`,
  RECOMMENDATIONS: `${API_PREFIX}/recommendations/tests`,
  
  // Leaderboard
  LEADERBOARD: `${API_PREFIX}/leaderboard`,
  LEADERBOARD_FILTERED: `${API_PREFIX}/leaderboard/filtered`,
};
