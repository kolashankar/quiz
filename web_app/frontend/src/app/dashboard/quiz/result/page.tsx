'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Loading, Button } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import { TestResult, DifficultyBreakdown } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShareIcon,
  HomeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { renderLatex } from '@/lib/latex-renderer';
import { renderCodeBlocks } from '@/components/quiz/CodeBlock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<DifficultyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const testId = searchParams.get('testId');

  useEffect(() => {
    fetchTestResult();
  }, [testId]);

  const fetchTestResult = async () => {
    try {
      const history = await quizService.getTestHistory();
      const latestResult = history[0];
      setResult(latestResult);
      
      // Fetch difficulty breakdown
      const breakdown = await quizService.getDifficultyBreakdown();
      setDifficultyBreakdown(breakdown);
    } catch (error) {
      console.error('Error fetching test result:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleShare = () => {
    if (result) {
      const shareText = `I scored ${result.score.toFixed(1)}% on my quiz! 🎉`;
      if (navigator.share) {
        navigator.share({
          title: 'My Quiz Result',
          text: shareText,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareText);
        toast.success('Result copied to clipboard!');
      }
    }
  };

  const renderFormattedText = (text: string) => {
    if (text.includes('```')) {
      return renderCodeBlocks(text);
    }
    if (text.includes('$')) {
      return renderLatex(text);
    }
    return text;
  };

  if (loading) {
    return <Loading text="Loading results..." />;
  }

  if (!result) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <XCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600 mb-6">Unable to load test results.</p>
          <Link href="/dashboard/quiz">
            <Button variant="primary">Take Another Quiz</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const scorePercentage = result.score;
  const isPassed = scorePercentage >= 60;
  const scoreColor = isPassed ? '#48bb78' : '#ed8936';

  // Prepare chart data
  const difficultyChartData = difficultyBreakdown.map(item => ({
    difficulty: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
    percentage: item.percentage,
    correct: item.correct,
    total: item.total,
  }));

  const COLORS = {
    Easy: '#48bb78',
    Medium: '#ed8936',
    Hard: '#f56565',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Result Summary */}
      <Card className="mb-6">
        <div className="text-center">
          <div className="mb-6">
            <TrophyIcon className={`w-20 h-20 mx-auto mb-4`} style={{ color: scoreColor }} />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-gray-600">
              {isPassed
                ? "You've passed the test with flying colors!"
                : "You're making progress. Keep going!"}
            </p>
          </div>

          {/* Score Circle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={scoreColor}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - scorePercentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-gray-900">{scorePercentage.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{result.correct_answers}</div>
              <div className="text-sm text-gray-600 mt-1">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">
                {result.total_questions - result.correct_answers}
              </div>
              <div className="text-sm text-gray-600 mt-1">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{result.percentile}th</div>
              <div className="text-sm text-gray-600 mt-1">Percentile</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleShare} variant="outline" size="medium">
              <ShareIcon className="w-5 h-5 mr-2" />
              Share Result
            </Button>
            <Link href="/dashboard/quiz">
              <Button variant="primary" size="medium">
                Take Another Quiz
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="medium">
                <HomeIcon className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Performance Charts */}
      {difficultyBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Difficulty Breakdown Bar Chart */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Difficulty</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={difficultyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold">{data.difficulty}</p>
                          <p className="text-sm">Score: {data.percentage.toFixed(1)}%</p>
                          <p className="text-sm">Correct: {data.correct}/{data.total}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Difficulty Breakdown Pie Chart */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Question Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ difficulty, percentage }) => `${difficulty}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {difficultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.difficulty as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {difficultyBreakdown.map((item) => (
          <Card key={item.difficulty}>
            <div className={`text-center p-4 rounded-lg ${
              item.difficulty === 'easy'
                ? 'bg-easy/10'
                : item.difficulty === 'medium'
                ? 'bg-medium/10'
                : 'bg-hard/10'
            }`}>
              <div className={`text-xs font-bold uppercase mb-2 ${
                item.difficulty === 'easy'
                  ? 'text-easy'
                  : item.difficulty === 'medium'
                  ? 'text-medium'
                  : 'text-hard'
              }`}>
                {item.difficulty}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {item.percentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">
                {item.correct} / {item.total} correct
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Question Review */}
      {result.questions && result.questions.length > 0 && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Review</h2>
          <p className="text-gray-600 mb-6">Review your answers and learn from explanations</p>
          
          <div className="space-y-4">
            {result.questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleQuestionExpanded(index)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      question.is_correct ? 'bg-success' : 'bg-danger'
                    }`}>
                      {question.is_correct ? (
                        <CheckCircleIcon className="w-5 h-5 text-white" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">Question {index + 1}</div>
                      <div className="text-sm text-gray-600 line-clamp-1">{question.question_text}</div>
                    </div>
                  </div>
                  {expandedQuestions.has(index) ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedQuestions.has(index) && (
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    {/* Question Text */}
                    <div className="mb-4">
                      <div className="text-lg font-medium text-gray-900 mb-2">
                        {renderFormattedText(question.question_text)}
                      </div>
                      {question.difficulty && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          question.difficulty === 'easy'
                            ? 'bg-easy/10 text-easy border border-easy'
                            : question.difficulty === 'medium'
                            ? 'bg-medium/10 text-medium border border-medium'
                            : 'bg-hard/10 text-hard border border-hard'
                        }`}>
                          {question.difficulty.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Question Image */}
                    {question.image && (
                      <div className="mb-4">
                        <img
                          src={question.image}
                          alt="Question"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border-2 ${
                            optIndex === question.correct_answer
                              ? 'bg-success/10 border-success'
                              : optIndex === question.user_answer && !question.is_correct
                              ? 'bg-danger/10 border-danger'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="flex-1">{renderFormattedText(option)}</span>
                            {optIndex === question.correct_answer && (
                              <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0" />
                            )}
                            {optIndex === question.user_answer && !question.is_correct && (
                              <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hint */}
                    {question.hint && (
                      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <LightBulbIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-yellow-800 mb-1">Hint:</div>
                            <div className="text-sm text-gray-800">{renderFormattedText(question.hint)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="p-4 bg-blue-50 border-l-4 border-primary rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <AcademicCapIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-primary mb-1">Explanation:</div>
                            <div className="text-sm text-gray-800">{renderFormattedText(question.explanation)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Code Snippet */}
                    {question.code_snippet && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Code Reference:</div>
                        {renderCodeBlocks(`\`\`\`${question.code_language || 'javascript'}\n${question.code_snippet}\n\`\`\``)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 justify-center mt-6">
        <Link href="/dashboard/analytics">
          <Button variant="outline">View Detailed Analytics</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
