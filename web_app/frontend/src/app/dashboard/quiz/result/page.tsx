'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Loading, Button } from '@/components/common';
import { TestResult } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShareIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const testId = searchParams.get('testId');

  useEffect(() => {
    // In a real scenario, you'd fetch the test result by ID
    // For now, we'll simulate it
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [testId]);

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

  if (loading) {
    return <Loading text="Loading results..." />;
  }

  // Mock data for demonstration
  const mockResult: TestResult = {
    id: testId || '1',
    user_id: 'user1',
    score: 75,
    total_questions: 10,
    correct_answers: 8,
    percentile: 85,
    questions: [],
    timestamp: new Date().toISOString(),
  };

  const displayResult = result || mockResult;
  const scorePercentage = displayResult.score;
  const isPassed = scorePercentage >= 60;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Result Summary */}
      <Card className="mb-6 text-center">
        <div className="mb-6">
          <TrophyIcon className={`w-20 h-20 mx-auto mb-4 ${
            isPassed ? 'text-success' : 'text-warning'
          }`} />
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
                stroke={isPassed ? '#48bb78' : '#ed8936'}
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
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{displayResult.correct_answers}</div>
            <div className="text-sm text-gray-600 mt-1">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-danger">
              {displayResult.total_questions - displayResult.correct_answers}
            </div>
            <div className="text-sm text-gray-600 mt-1">Incorrect</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{displayResult.percentile}th</div>
            <div className="text-sm text-gray-600 mt-1">Percentile</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
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
      </Card>

      {/* Question Review - Placeholder */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Review</h2>
        <p className="text-gray-600">Detailed question review will be available soon.</p>
      </Card>
    </div>
  );
}
