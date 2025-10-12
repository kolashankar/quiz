'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import { Analytics, DifficultyBreakdown } from '@/types';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<DifficultyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [analyticsData, difficultyData] = await Promise.all([
        quizService.getUserAnalytics().catch(() => null),
        quizService.getDifficultyBreakdown().catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setDifficultyBreakdown(difficultyData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <Loading text="Loading analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Available</h3>
          <p className="text-gray-600">Take a quiz to see your detailed performance analytics.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Detailed Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.total_tests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.average_score.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <FireIcon className="w-6 h-6 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.strong_topics.length}</div>
              <div className="text-sm text-gray-600">Strong Topics</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Difficulty Breakdown */}
      {difficultyBreakdown.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Difficulty</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficultyBreakdown.map((item) => (
              <div
                key={item.difficulty}
                className={`p-4 rounded-lg border-2 ${
                  item.difficulty === 'easy'
                    ? 'border-easy bg-easy/5'
                    : item.difficulty === 'medium'
                    ? 'border-medium bg-medium/5'
                    : 'border-hard bg-hard/5'
                }`}
              >
                <div className="text-center">
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
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strong Topics */}
      {analytics.strong_topics.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FireIcon className="w-6 h-6 text-success" />
            Your Strong Topics
          </h2>
          <div className="space-y-3">
            {analytics.strong_topics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{topic.topic_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {topic.correct} out of {topic.total} questions answered correctly
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success">{topic.percentage.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weak Topics */}
      {analytics.weak_topics.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-warning" />
            Topics That Need Practice
          </h2>
          <div className="space-y-3">
            {analytics.weak_topics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{topic.topic_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {topic.correct} out of {topic.total} questions answered correctly
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-warning">{topic.percentage.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
