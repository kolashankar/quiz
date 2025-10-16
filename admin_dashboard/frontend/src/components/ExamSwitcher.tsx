'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';

interface Exam {
  id: string;
  name: string;
  description: string;
}

export default function ExamSwitcher() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
    if (user?.selected_exam_id) {
      setSelectedExam(user.selected_exam_id);
    }
  }, [user]);

  const fetchExams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content/exams`);
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const handleExamChange = async (examId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/select-exam`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exam_id: examId })
      });

      if (response.ok) {
        setSelectedExam(examId);
        setIsOpen(false);
        // Reload page to refresh content
        window.location.reload();
      }
    } catch (error) {
      console.error('Error selecting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedExamData = exams.find(e => e.id === selectedExam);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {selectedExamData ? selectedExamData.name : 'Select Exam'}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-2">Switch Exam</h3>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => handleExamChange(exam.id)}
                disabled={loading}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedExam === exam.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium text-sm">{exam.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{exam.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
