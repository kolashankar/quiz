import { api } from '../auth/authService';
import {
  Exam, Subject, Chapter, Topic, Subtopic, Section, Subsection, Question,
  CreateExam, CreateSubject, CreateChapter, CreateTopic, CreateSubtopic,
  CreateSection, CreateSubsection, CreateQuestion,
  PaginationResponse, BatchUpdatePayload, AIQuestionRequest, AIQuestionResponse, AnalyticsData
} from '@/types/admin';

// Exams API
export const examService = {
  async getAll(): Promise<Exam[]> {
    const response = await api.get('/admin/exams');
    return response.data;
  },

  async getById(id: string): Promise<Exam> {
    const response = await api.get(`/admin/exams/${id}`);
    return response.data;
  },

  async create(data: CreateExam): Promise<Exam> {
    const response = await api.post('/admin/exams', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateExam>): Promise<Exam> {
    const response = await api.put(`/admin/exams/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/exams/${id}`);
  },
};

// Subjects API
export const subjectService = {
  async getAll(examId?: string): Promise<Subject[]> {
    const response = await api.get('/admin/subjects', {
      params: examId ? { examId } : undefined
    });
    return response.data;
  },

  async getById(id: string): Promise<Subject> {
    const response = await api.get(`/admin/subjects/${id}`);
    return response.data;
  },

  async create(data: CreateSubject): Promise<Subject> {
    const response = await api.post('/admin/subjects', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSubject>): Promise<Subject> {
    const response = await api.put(`/admin/subjects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/subjects/${id}`);
  },
};

// Chapters API
export const chapterService = {
  async getAll(subjectId?: string): Promise<Chapter[]> {
    const response = await api.get('/admin/chapters', {
      params: subjectId ? { subjectId } : undefined
    });
    return response.data;
  },

  async getById(id: string): Promise<Chapter> {
    const response = await api.get(`/admin/chapters/${id}`);
    return response.data;
  },

  async create(data: CreateChapter): Promise<Chapter> {
    const response = await api.post('/admin/chapters', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateChapter>): Promise<Chapter> {
    const response = await api.put(`/admin/chapters/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/chapters/${id}`);
  },
};

// Topics API
export const topicService = {
  async getAll(chapterId?: string): Promise<Topic[]> {
    const response = await api.get('/admin/topics', {
      params: chapterId ? { chapterId } : undefined
    });
    return response.data;
  },

  async getById(id: string): Promise<Topic> {
    const response = await api.get(`/admin/topics/${id}`);
    return response.data;
  },

  async create(data: CreateTopic): Promise<Topic> {
    const response = await api.post('/admin/topics', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateTopic>): Promise<Topic> {
    const response = await api.put(`/admin/topics/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/topics/${id}`);
  },
};

// Subtopics API
export const subtopicService = {
  async getAll(topicId?: string): Promise<Subtopic[]> {
    const response = await api.get('/admin/subtopics', {
      params: topicId ? { topicId } : undefined
    });
    return response.data;
  },

  async getById(id: string): Promise<Subtopic> {
    const response = await api.get(`/admin/subtopics/${id}`);
    return response.data;
  },

  async create(data: CreateSubtopic): Promise<Subtopic> {
    const response = await api.post('/admin/subtopics', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSubtopic>): Promise<Subtopic> {
    const response = await api.put(`/admin/subtopics/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/subtopics/${id}`);
  },
};

// Sections API
export const sectionService = {
  async getAll(subtopicId?: string): Promise<Section[]> {
    const response = await api.get('/admin/sections', {
      params: subtopicId ? { subtopicId } : undefined
    });
    return response.data;
  },

  async getById(id: string): Promise<Section> {
    const response = await api.get(`/admin/sections/${id}`);
    return response.data;
  },

  async create(data: CreateSection): Promise<Section> {
    const response = await api.post('/admin/sections', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSection>): Promise<Section> {
    const response = await api.put(`/admin/sections/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/sections/${id}`);
  },
};

// Subsections API
export const subsectionService = {
  async getAll(sectionId?: string): Promise<Subsection[]> {
    const response = await api.get('/admin/subsections', {
      params: sectionId ? { sectionId } : undefined
    });
    return response.data;
  },

  async getById(id: string): Promise<Subsection> {
    const response = await api.get(`/admin/subsections/${id}`);
    return response.data;
  },

  async create(data: CreateSubsection): Promise<Subsection> {
    const response = await api.post('/admin/subsections', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSubsection>): Promise<Subsection> {
    const response = await api.put(`/admin/subsections/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/subsections/${id}`);
  },
};

// Questions API
export const questionService = {
  async getAll(params?: {
    subsectionId?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginationResponse<Question>> {
    const response = await api.get('/admin/questions', { params });
    return response.data;
  },

  async getById(id: string): Promise<Question> {
    const response = await api.get(`/admin/questions/${id}`);
    return response.data;
  },

  async create(data: CreateQuestion): Promise<Question> {
    const response = await api.post('/admin/questions', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateQuestion>): Promise<Question> {
    const response = await api.put(`/admin/questions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/questions/${id}`);
  },

  async batchUpdate(payload: BatchUpdatePayload): Promise<void> {
    await api.post('/admin/questions/batch', payload);
  },

  async batchDelete(ids: string[]): Promise<void> {
    await api.post('/admin/questions/batch-delete', { ids });
  },

  async uploadCSV(file: File, subsectionId: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subsectionId', subsectionId);
    const response = await api.post('/admin/questions/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// AI Service
export const aiService = {
  async generateQuestions(data: AIQuestionRequest): Promise<AIQuestionResponse> {
    const response = await api.post('/admin/ai/generate-questions', data);
    return response.data;
  },

  async suggestDifficulty(questionText: string): Promise<{ difficulty: string }> {
    const response = await api.post('/admin/ai/suggest-difficulty', { questionText });
    return response.data;
  },

  async generateExplanation(questionText: string, correctAnswer: string): Promise<{ explanation: string }> {
    const response = await api.post('/admin/ai/generate-explanation', {
      questionText,
      correctAnswer
    });
    return response.data;
  },
};

// Analytics API
export const analyticsService = {
  async getDashboardStats(): Promise<AnalyticsData> {
    const response = await api.get('/admin/analytics/dashboard');
    return response.data;
  },

  async getQuestionDistribution(): Promise<any> {
    const response = await api.get('/admin/analytics/questions');
    return response.data;
  },

  async getExamStats(): Promise<any> {
    const response = await api.get('/admin/analytics/exams');
    return response.data;
  },
};
