// Common types for admin dashboard

export interface Exam {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  examId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  exam?: Exam;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  code: string;
  description?: string;
  subjectId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  code: string;
  description?: string;
  chapterId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chapter?: Chapter;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  id: string;
  name: string;
  code: string;
  description?: string;
  topicId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topic?: Topic;
  sections?: Section[];
}

export interface Section {
  id: string;
  name: string;
  code: string;
  description?: string;
  subtopicId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subtopic?: Subtopic;
  subsections?: Subsection[];
}

export interface Subsection {
  id: string;
  name: string;
  code: string;
  description?: string;
  sectionId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  section?: Section;
  questions?: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  timeLimit?: number;
  marks: number;
  negativeMarks?: number;
  subsectionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subsection?: Subsection;
}

export interface PaginationResponse<T> {
  data?: T[];
  questions?: Question[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface CreateExam {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateSubject {
  name: string;
  code: string;
  description?: string;
  examId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateChapter {
  name: string;
  code: string;
  description?: string;
  subjectId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateTopic {
  name: string;
  code: string;
  description?: string;
  chapterId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateSubtopic {
  name: string;
  code: string;
  description?: string;
  topicId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateSection {
  name: string;
  code: string;
  description?: string;
  subtopicId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateSubsection {
  name: string;
  code: string;
  description?: string;
  sectionId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  timeLimit?: number;
  marks?: number;
  negativeMarks?: number;
  subsectionId: string;
  isActive?: boolean;
}

export interface BatchUpdatePayload {
  ids: string[];
  updates: Partial<Question>;
}

export interface AIQuestionRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count?: number;
}

export interface AIQuestionResponse {
  questions: CreateQuestion[];
}

export interface AnalyticsData {
  totalExams: number;
  totalSubjects: number;
  totalChapters: number;
  totalTopics: number;
  totalSubtopics: number;
  totalSections: number;
  totalSubsections: number;
  totalQuestions: number;
  totalUsers: number;
  totalTests: number;
  questionsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  recentActivity: {
    date: string;
    type: string;
    count: number;
  }[];
}
