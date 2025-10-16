'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Loading } from '@/components/common';
import api from '@/lib/api';
import {
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Exam {
  _id: string;
  name: string;
  description: string;
}

interface Subject {
  _id: string;
  exam_id: string;
  name: string;
}

interface Chapter {
  _id: string;
  subject_id: string;
  name: string;
}

export default function PracticeStartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'exam' | 'subject' | 'chapter'>('exam');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<string>('all');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSubjects(selectedExam);
      // Select all subjects by default
      if (subjects.length > 0) {
        setSelectedSubjects(subjects.map(s => s._id));
      }
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedSubjects.length > 0) {
      fetchChapters(selectedSubjects);
    }
  }, [selectedSubjects]);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data || []);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (examId: string) => {
    try {
      const response = await api.get(`/subjects?exam_id=${examId}`);
      const fetchedSubjects = response.data || [];
      setSubjects(fetchedSubjects);
      // Auto-select all subjects
      setSelectedSubjects(fetchedSubjects.map((s: Subject) => s._id));
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchChapters = async (subjectIds: string[]) => {
    try {
      const allChapters: Chapter[] = [];
      for (const subjectId of subjectIds) {
        const response = await api.get(`/chapters?subject_id=${subjectId}`);
        allChapters.push(...(response.data || []));
      }
      setChapters(allChapters);
      // Auto-select all chapters
      setSelectedChapters(allChapters.map((c: Chapter) => c._id));
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleStartPractice = () => {
    const params = new URLSearchParams({
      mode: filterMode,
      exam: selectedExam,
      subjects: selectedSubjects.join(','),
      chapters: selectedChapters.join(','),
      count: questionCount.toString(),
      difficulty: difficulty,
      isPractice: 'true',
    });

    router.push(`/dashboard/practice/session?${params.toString()}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Start Practice Session
        </h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
          Configure your practice session - no timer, review anytime
        </p>
      </div>

      {/* Filter Mode Selection */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <FunnelIcon className="w-5 h-5 mr-2" />
          Practice Mode
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setFilterMode('exam')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterMode === 'exam'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <AcademicCapIcon className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <div className="font-semibold">Exam-wise</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Practice by exam with subject selection</div>
          </button>

          <button
            onClick={() => setFilterMode('subject')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterMode === 'subject'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <BookOpenIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="font-semibold">Subject-wise</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Practice by subjects with chapter selection</div>
          </button>

          <button
            onClick={() => setFilterMode('chapter')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterMode === 'chapter'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <div className="font-semibold">Chapter-wise</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Practice specific chapters</div>
          </button>
        </div>
      </Card>

      {/* Exam Selection */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Exam</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => (
            <button
              key={exam._id}
              onClick={() => setSelectedExam(exam._id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedExam === exam._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">{exam.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{exam.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Subject Selection */}
      {selectedExam && (filterMode === 'exam' || filterMode === 'subject') && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Subjects {filterMode === 'exam' && '(All selected by default)'}
            </h3>
            <div className="flex gap-2">
              <Button
                size="small"
                variant="outline"
                onClick={() => setSelectedSubjects(subjects.map(s => s._id))}
              >
                Select All
              </Button>
              <Button
                size="small"
                variant="outline"
                onClick={() => setSelectedSubjects([])}
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map(subject => (
              <label
                key={subject._id}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSubjects.includes(subject._id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject._id)}
                  onChange={() => toggleSubject(subject._id)}
                  className="mr-2"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Chapter Selection */}
      {selectedSubjects.length > 0 && (filterMode === 'subject' || filterMode === 'chapter') && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Chapters (All selected by default)
            </h3>
            <div className="flex gap-2">
              <Button
                size="small"
                variant="outline"
                onClick={() => setSelectedChapters(chapters.map(c => c._id))}
              >
                Select All
              </Button>
              <Button
                size="small"
                variant="outline"
                onClick={() => setSelectedChapters([])}
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {chapters.map(chapter => (
              <label
                key={chapter._id}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedChapters.includes(chapter._id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedChapters.includes(chapter._id)}
                  onChange={() => toggleChapter(chapter._id)}
                  className="mr-2"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{chapter.name}</span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Configuration */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Practice Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={questionCount}
              onChange={e => setQuestionCount(parseInt(e.target.value) || 20)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStartPractice}
          disabled={!selectedExam || (filterMode !== 'exam' && selectedSubjects.length === 0)}
          className="px-8"
        >
          Start Practice Session
        </Button>
      </div>
    </div>
  );
}
