'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Loading, Button } from '@/components/common';
import { TimerDisplay } from '@/components/quiz/TimerDisplay';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { quizService } from '@/lib/quiz-service';
import { useTimer } from '@/hooks/useTimer';
import { Question } from '@/types';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { FlagIcon as FlagSolidIcon } from '@heroicons/react/24/solid';

export default function TestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));

  const timer = useTimer({
    initialTime: 30 * 60,
    onTimeUp: handleTimeUp,
    autoStart: false,
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  function handleTimeUp() {
    toast.error("Time's up! Submitting test...");
    submitTest();
  }

  const fetchQuestions = async () => {
    try {
      const topicId = searchParams.get('topicId');
      const questionParams: any = {};
      
      if (topicId) {
        questionParams.topic_id = topicId;
      }
      
      questionParams.limit = 10;
      
      const questionList = await quizService.getQuestions(questionParams);
      
      if (questionList.length === 0) {
        toast.error('No questions available for this selection');
        router.back();
        return;
      }
      
      setQuestions(questionList);
      setAnswers(new Array(questionList.length).fill(-1));
      timer.start();
      
      fetchBookmarks();
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const bookmarks = await quizService.getBookmarks();
      const bookmarkIds = new Set(bookmarks.map((b: any) => b.question_id));
      setBookmarked(bookmarkIds);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setVisitedQuestions(prev => new Set([...prev, nextIndex]));
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setVisitedQuestions(prev => new Set([...prev, prevIndex]));
    }
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
    setVisitedQuestions(prev => new Set([...prev, index]));
  };

  const handleToggleBookmark = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const isBookmarked = bookmarked.has(currentQuestion.id);

    try {
      if (isBookmarked) {
        const bookmarks = await quizService.getBookmarks();
        const bookmark = bookmarks.find((b: any) => b.question_id === currentQuestion.id);
        if (bookmark) {
          await quizService.deleteBookmark(bookmark.id);
          const newBookmarked = new Set(bookmarked);
          newBookmarked.delete(currentQuestion.id);
          setBookmarked(newBookmarked);
          toast.success('Bookmark removed');
        }
      } else {
        await quizService.createBookmark(currentQuestion.id);
        const newBookmarked = new Set(bookmarked);
        newBookmarked.add(currentQuestion.id);
        setBookmarked(newBookmarked);
        toast.success('Question bookmarked');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleToggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const getQuestionStatus = (index: number) => {
    if (markedForReview.has(index)) return 'marked';
    if (answers[index] !== -1) return 'answered';
    if (visitedQuestions.has(index)) return 'visited';
    return 'unvisited';
  };

  const submitTest = async () => {
    const unansweredCount = answers.filter(a => a === -1).length;
    
    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    timer.pause();

    try {
      const submission = {
        question_ids: questions.map(q => q.id),
        answers: answers,
      };

      const result = await quizService.submitTest(submission);
      
      toast.success('Test submitted successfully!');
      router.push(`/dashboard/quiz/result?testId=${result.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test');
      timer.resume();
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitTest = () => {
    const confirmed = window.confirm(
      'Are you sure you want to exit? Your progress will be lost.'
    );
    if (confirmed) {
      router.push('/dashboard/quiz');
    }
  };

  if (loading) {
    return <Loading text="Loading questions..." />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.filter(a => a !== -1).length;
  const progress = (answeredCount / questions.length) * 100;
  const isMarkedForReview = markedForReview.has(currentQuestionIndex);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExitTest}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                title="Exit Test"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-lg font-semibold text-gray-900">
                  {answeredCount} / {questions.length}
                </div>
              </div>
            </div>

            <TimerDisplay timeLeft={timer.timeLeft} isRunning={timer.isRunning} />

            <Button
              onClick={submitTest}
              disabled={submitting}
              variant="primary"
              size="medium"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Navigation Bar */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                const isCurrent = index === currentQuestionIndex;
                
                const statusColors = {
                  answered: 'bg-success text-white border-success',
                  marked: 'bg-warning text-white border-warning',
                  visited: 'bg-danger text-white border-danger',
                  unvisited: 'bg-gray-300 text-gray-700 border-gray-300',
                };
                
                return (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full font-semibold text-sm transition border-2 ${
                      isCurrent
                        ? 'ring-4 ring-blue-300 scale-110'
                        : ''
                    } ${statusColors[status as keyof typeof statusColors]}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-gray-600">Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="text-gray-600">Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger"></div>
                <span className="text-gray-600">Visited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            {/* Mark for Review Button */}
            <button
              onClick={handleToggleMarkForReview}
              className={`w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                isMarkedForReview
                  ? 'bg-warning border-warning text-white'
                  : 'bg-yellow-50 border-warning text-warning hover:bg-yellow-100'
              }`}
            >
              {isMarkedForReview ? (
                <FlagSolidIcon className="w-5 h-5" />
              ) : (
                <FlagIcon className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
              </span>
            </button>

            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestionIndex]}
              onSelectAnswer={handleAnswerSelect}
              isBookmarked={bookmarked.has(currentQuestion.id)}
              onToggleBookmark={handleToggleBookmark}
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                size="medium"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="medium"
                >
                  Next
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitTest}
                  disabled={submitting}
                  variant="secondary"
                  size="medium"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === currentQuestionIndex;
                  
                  const statusColors = {
                    answered: 'bg-success text-white',
                    marked: 'bg-warning text-white',
                    visited: 'bg-danger text-white',
                    unvisited: 'bg-gray-200 text-gray-700',
                  };
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuestionNavigation(index)}
                      className={`aspect-square rounded-lg font-semibold text-sm transition ${
                        isCurrent
                          ? 'ring-2 ring-primary'
                          : 'hover:opacity-80'
                      } ${statusColors[status as keyof typeof statusColors]}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success"></div>
                  <span className="text-gray-700">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning"></div>
                  <span className="text-gray-700">Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-danger"></div>
                  <span className="text-gray-700">Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-200"></div>
                  <span className="text-gray-700">Not Visited</span>
                </div>
              </div>
            </Card>

            {/* Test Stats */}
            <Card className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-semibold text-success">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Not Answered:</span>
                  <span className="font-semibold text-danger">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marked:</span>
                  <span className="font-semibold text-warning">{markedForReview.size}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
