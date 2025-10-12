import { apiClient } from './api-client';
import { API_ENDPOINTS } from '../constants/api';
import {
  Exam,
  Subject,
  Chapter,
  Topic,
  SubTopic,
  Section,
  SubSection,
  Question,
  TestSubmission,
  TestResult,
  Bookmark,
  Analytics,
  LeaderboardEntry,
  DifficultyBreakdown,
} from '../types';

export const quizService = {
  // Hierarchy APIs
  async getExams(): Promise<Exam[]> {
    const response = await apiClient.get(API_ENDPOINTS.EXAMS);
    return response.data;
  },

  async getSubjects(examId?: string): Promise<Subject[]> {
    const params = examId ? { exam_id: examId } : {};
    const response = await apiClient.get(API_ENDPOINTS.SUBJECTS, { params });
    return response.data;
  },

  async getChapters(subjectId?: string): Promise<Chapter[]> {
    const params = subjectId ? { subject_id: subjectId } : {};
    const response = await apiClient.get(API_ENDPOINTS.CHAPTERS, { params });
    return response.data;
  },

  async getTopics(chapterId?: string): Promise<Topic[]> {
    const params = chapterId ? { chapter_id: chapterId } : {};
    const response = await apiClient.get(API_ENDPOINTS.TOPICS, { params });
    return response.data;
  },

  async getSubTopics(topicId?: string): Promise<SubTopic[]> {
    const params = topicId ? { topic_id: topicId } : {};
    const response = await apiClient.get(API_ENDPOINTS.SUB_TOPICS, { params });
    return response.data;
  },

  async getSections(subTopicId?: string): Promise<Section[]> {
    const params = subTopicId ? { sub_topic_id: subTopicId } : {};
    const response = await apiClient.get(API_ENDPOINTS.SECTIONS, { params });
    return response.data;
  },

  async getSubSections(sectionId?: string): Promise<SubSection[]> {
    const params = sectionId ? { section_id: sectionId } : {};
    const response = await apiClient.get(API_ENDPOINTS.SUB_SECTIONS, { params });
    return response.data;
  },

  // Questions
  async getQuestions(params?: {
    topic_id?: string;
    difficulty?: string;
    limit?: number;
  }): Promise<Question[]> {
    const response = await apiClient.get(API_ENDPOINTS.QUESTIONS, { params });
    return response.data;
  },

  async getFilteredQuestions(params: {
    difficulty?: string;
    sub_section_id?: string;
    bookmarked?: boolean;
  }): Promise<Question[]> {
    const response = await apiClient.get(API_ENDPOINTS.QUESTIONS_FILTERED, { params });
    return response.data;
  },

  // Search
  async search(query: string, filters?: {
    level?: string;
    exam_id?: string;
    subject_id?: string;
  }): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.SEARCH, {
      params: { query, ...filters },
    });
    return response.data;
  },

  // Tests
  async submitTest(submission: TestSubmission): Promise<TestResult> {
    const response = await apiClient.post(API_ENDPOINTS.TESTS_SUBMIT, submission);
    return response.data;
  },

  async getTestHistory(): Promise<TestResult[]> {
    const response = await apiClient.get(API_ENDPOINTS.TESTS_HISTORY);
    return response.data;
  },

  // Bookmarks
  async createBookmark(questionId: string): Promise<Bookmark> {
    const response = await apiClient.post(API_ENDPOINTS.BOOKMARKS, {
      question_id: questionId,
    });
    return response.data;
  },

  async getBookmarks(): Promise<any[]> {
    const response = await apiClient.get(API_ENDPOINTS.BOOKMARKS);
    return response.data;
  },

  async deleteBookmark(bookmarkId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.BOOKMARKS}/${bookmarkId}`);
  },

  async batchBookmarks(action: 'add' | 'remove', questionIds: string[]): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.BOOKMARKS_BATCH, {
      action,
      question_ids: questionIds,
    });
    return response.data;
  },

  // Analytics
  async getUserAnalytics(): Promise<Analytics> {
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS_PERFORMANCE);
    return response.data;
  },

  async getDifficultyBreakdown(): Promise<DifficultyBreakdown[]> {
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS_DIFFICULTY);
    return response.data;
  },

  async getRecommendations(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.RECOMMENDATIONS);
    return response.data;
  },

  // Leaderboard
  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get(API_ENDPOINTS.LEADERBOARD, {
      params: { limit },
    });
    return response.data;
  },

  async getFilteredLeaderboard(params: {
    period?: 'weekly' | 'monthly' | 'all_time';
    scope?: 'global' | 'exam' | 'subject';
    exam_id?: string;
    subject_id?: string;
  }): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.LEADERBOARD_FILTERED, { params });
    return response.data;
  },
};
