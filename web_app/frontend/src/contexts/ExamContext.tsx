'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Exam } from '../types';
import { quizService } from '../lib/quiz-service';

interface ExamContextType {
  selectedExam: Exam | null;
  exams: Exam[];
  loading: boolean;
  setSelectedExam: (exam: Exam | null) => void;
  refreshExams: () => Promise<void>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_exam';

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedExam, setSelectedExamState] = useState<Exam | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const fetchedExams = await quizService.getExams();
      setExams(fetchedExams);

      // Try to restore selected exam from localStorage
      if (typeof window !== 'undefined') {
        const savedExamId = localStorage.getItem(STORAGE_KEY);
        if (savedExamId) {
          const savedExam = fetchedExams.find(exam => exam.id === savedExamId);
          if (savedExam) {
            setSelectedExamState(savedExam);
          } else if (fetchedExams.length > 0) {
            // If saved exam not found, select first one
            setSelectedExamState(fetchedExams[0]);
            localStorage.setItem(STORAGE_KEY, fetchedExams[0].id);
          }
        } else if (fetchedExams.length > 0) {
          // No saved exam, select first one
          setSelectedExamState(fetchedExams[0]);
          localStorage.setItem(STORAGE_KEY, fetchedExams[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedExam = (exam: Exam | null) => {
    setSelectedExamState(exam);
    if (typeof window !== 'undefined') {
      if (exam) {
        localStorage.setItem(STORAGE_KEY, exam.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const refreshExams = async () => {
    await loadExams();
  };

  return (
    <ExamContext.Provider
      value={{
        selectedExam,
        exams,
        loading,
        setSelectedExam,
        refreshExams,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return context;
};
