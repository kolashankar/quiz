export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Subject {
  id: string;
  exam_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface SubTopic {
  id: string;
  topic_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Section {
  id: string;
  sub_topic_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface SubSection {
  id: string;
  section_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Question {
  id: string;
  sub_section_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  tags: string[];
  explanation: string;
  hint?: string;
  solution?: string;
  code_snippet?: string;
  code_language?: string;
  image?: string;
  image_url?: string;
  formula?: string;
  created_at: string;
}

export interface TestSubmission {
  question_ids: string[];
  answers: number[];
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  options: string[];
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

export interface TestResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentile: number;
  questions: QuestionResult[];
  timestamp: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

export interface TopicPerformance {
  topic_id: string;
  topic_name: string;
  percentage: number;
  correct: number;
  total: number;
}

export interface Analytics {
  user_id: string;
  total_tests: number;
  average_score: number;
  strong_topics: TopicPerformance[];
  weak_topics: TopicPerformance[];
  improvement_suggestions: string[];
}

export interface LeaderboardEntry {
  rank: number;
  user_email: string;
  average_score: number;
  total_tests: number;
}

export interface HierarchyNavigation {
  exam?: Exam;
  subject?: Subject;
  chapter?: Chapter;
  topic?: Topic;
  subTopic?: SubTopic;
  section?: Section;
  subSection?: SubSection;
}

export interface DifficultyBreakdown {
  difficulty: string;
  correct: number;
  total: number;
  percentage: number;
}
