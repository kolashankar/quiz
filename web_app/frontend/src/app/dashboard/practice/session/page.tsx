'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Loading } from '@/components/common';
import api from '@/lib/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Question {
  _id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  explanation: string;
  hint: string;
  solution: string;
  formula: string;
  tags: string[];
  image_url?: string;
}

interface UserAnswer {
  questionId: string;
  selectedOption: number | null;
  isCorrect: boolean | null;
  showAnswer: boolean;
}

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [showStats, setShowStats] = useState(false);

  const mode = searchParams.get('mode') || 'exam';
  const difficulty = searchParams.get('difficulty') || 'all';
  const count = parseInt(searchParams.get('count') || '20');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Build query based on filters
      const params: any = { limit: count };
      
      if (difficulty !== 'all') {
        params.difficulty = difficulty;
      }
      
      // Fetch questions from API
      const response = await api.get('/questions', { params });
      const fetchedQuestions = response.data || [];
      
      setQuestions(fetchedQuestions);
      
      // Initialize user answers
      const answersMap = new Map<string, UserAnswer>();
      fetchedQuestions.forEach((q: Question) => {
        answersMap.set(q._id, {
          questionId: q._id,
          selectedOption: null,
          isCorrect: null,
          showAnswer: false,
        });
      });
      setUserAnswers(answersMap);
      
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = userAnswers.get(currentQuestion._id);
    
    if (!currentAnswer) return;
    
    const isCorrect = optionIndex === currentQuestion.correct_answer;
    
    const updatedAnswer: UserAnswer = {
      ...currentAnswer,
      selectedOption: optionIndex,
      isCorrect: isCorrect,
      showAnswer: true, // Auto-show answer in practice mode
    };
    
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion._id, updatedAnswer);
    setUserAnswers(newAnswers);
  };

  const toggleShowAnswer = () => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = userAnswers.get(currentQuestion._id);
    
    if (!currentAnswer) return;
    
    const updatedAnswer: UserAnswer = {
      ...currentAnswer,
      showAnswer: !currentAnswer.showAnswer,
    };
    
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion._id, updatedAnswer);
    setUserAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const calculateStats = () => {
    let answered = 0;
    let correct = 0;
    
    userAnswers.forEach((answer) => {
      if (answer.selectedOption !== null) {
        answered++;
        if (answer.isCorrect) {
          correct++;
        }
      }
    });
    
    return {
      total: questions.length,
      answered,
      correct,
      incorrect: answered - correct,
      unanswered: questions.length - answered,
      accuracy: answered > 0 ? ((correct / answered) * 100).toFixed(1) : '0',
    };
  };

  const handleFinish = () => {
    setShowStats(true);
  };

  if (loading) {
    return <Loading />;
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">No Questions Found</h2>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">
          No questions available for the selected criteria.
        </p>
        <Button onClick={() => router.push('/dashboard/practice/start')}>
          Back to Configuration
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers.get(currentQuestion._id);
  const stats = calculateStats();

  if (showStats) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Practice Session Summary
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Questions</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Correct</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-600">{stats.incorrect}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Incorrect</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.accuracy}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Accuracy</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowStats(false)}
            >
              Review Questions
            </Button>
            <Button
              onClick={() => router.push('/dashboard/practice/start')}
            >
              New Practice Session
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Practice Mode</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Question {currentIndex + 1} of {questions.length} • No timer
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-green-700">
              Correct: {stats.correct}
            </span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              Answered: {stats.answered}/{stats.total}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentQuestion.difficulty === 'easy'
              ? 'bg-green-100 text-green-700'
              : currentQuestion.difficulty === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {currentQuestion.difficulty}
          </span>
          {currentQuestion.tags && currentQuestion.tags.length > 0 && (
            <div className="flex gap-2">
              {currentQuestion.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {currentQuestion.question_text}
          </h3>
          
          {/* Formula */}
          {currentQuestion.formula && (
            <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {currentQuestion.formula}
              </ReactMarkdown>
            </div>
          )}

          {/* Image */}
          {currentQuestion.image_url && (
            <div className="my-4">
              <img
                src={currentQuestion.image_url}
                alt="Question diagram"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = currentAnswer?.selectedOption === index;
            const isCorrect = index === currentQuestion.correct_answer;
            const showResult = currentAnswer?.showAnswer;
            
            let optionClass = 'border-2 border-gray-300 hover:border-gray-400';
            
            if (showResult) {
              if (isCorrect) {
                optionClass = 'border-2 border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                optionClass = 'border-2 border-red-500 bg-red-50';
              }
            } else if (isSelected) {
              optionClass = 'border-2 border-blue-500 bg-blue-50';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={currentAnswer?.showAnswer}
                className={`w-full p-4 rounded-lg text-left transition-all ${optionClass} ${
                  currentAnswer?.showAnswer ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center">
                  <span className="font-semibold mr-3 text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircleIcon className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle Answer Button */}
        {!currentAnswer?.showAnswer && currentAnswer?.selectedOption !== null && (
          <Button
            onClick={toggleShowAnswer}
            variant="outline"
            className="w-full mb-4"
          >
            Show Correct Answer
          </Button>
        )}

        {/* Explanation Section */}
        {currentAnswer?.showAnswer && (
          <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Hint */}
            {currentQuestion.hint && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <LightBulbIcon className="w-5 h-5 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">Hint</h4>
                    <p className="text-yellow-800">{currentQuestion.hint}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            {currentQuestion.explanation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
                    <div className="text-blue-800 prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {currentQuestion.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Solution */}
            {currentQuestion.solution && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Detailed Solution</h4>
                  <div className="text-green-800 prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {currentQuestion.solution}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          variant="outline"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentIndex === questions.length - 1 ? (
            <Button onClick={handleFinish}>
              Finish Practice
            </Button>
          ) : (
            <Button onClick={goToNext}>
              Next
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Question Palette */}
      <Card className="mt-6 p-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Question Palette</h4>
        <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
          {questions.map((q, idx) => {
            const answer = userAnswers.get(q._id);
            let bgColor = 'bg-gray-200';
            
            if (answer?.selectedOption !== null && answer?.isCorrect) {
              bgColor = 'bg-green-500 text-white';
            } else if (answer?.selectedOption !== null && !answer?.isCorrect) {
              bgColor = 'bg-red-500 text-white';
            } else if (answer?.selectedOption !== null) {
              bgColor = 'bg-blue-500 text-white';
            }
            
            return (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${bgColor} ${
                  idx === currentIndex ? 'ring-2 ring-gray-900' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Correct</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Incorrect</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
            <span>Not Attempted</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PracticeSessionContent />
    </Suspense>
  );
}
