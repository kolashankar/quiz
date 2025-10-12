'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import { Exam } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AcademicCapIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function QuizPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const examList = await quizService.getExams();
      setExams(examList);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    }
  };

  useEffect(() => {
    fetchExams().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    toast.loading('Refreshing...', { id: 'refresh' });
    await fetchExams();
    toast.success('Refreshed!', { id: 'refresh' });
  };

  if (loading) {
    return <Loading text="Loading exams..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Select an Exam</h1>
          <p className="text-gray-600 mt-2">Choose your competitive exam to start practicing</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <Card key={exam.id} padding="none">
            <Link
              href={`/dashboard/quiz/hierarchy?examId=${exam.id}&examName=${encodeURIComponent(exam.name)}&level=subject`}
              className="block p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <AcademicCapIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </Card>
        ))}

        {exams.length === 0 && (
          <Card className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Available</h3>
            <p className="text-gray-600">Exams will appear here once they are added to the system.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
