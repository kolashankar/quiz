'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Loading } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import { Analytics } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  TrophyIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  BookmarkIcon,
  ChartBarIcon,
  SparklesIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = async () => {
    try {
      const [analyticsData, recommendationsData] = await Promise.all([
        quizService.getUserAnalytics().catch(() => null),
        quizService.getRecommendations().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  };

  useEffect(() => {
    fetchHomeData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  if (loading) {
    return <Loading text="Loading your dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">Welcome back!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{user?.email}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TrophyIcon className="w-8 h-8 text-warning" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.total_tests}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tests Taken</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <StarIcon className="w-8 h-8 text-success" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.average_score.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <ArrowTrendingUpIcon className="w-8 h-8 text-info" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.strong_topics.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Strong Topics</div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/quiz"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition"
          >
            <BookOpenIcon className="w-10 h-10 text-primary mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">Take Quiz</span>
          </Link>
          <Link
            href="/dashboard/bookmarks"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-warning hover:bg-warning/5 dark:hover:bg-warning/10 transition"
          >
            <BookmarkIcon className="w-10 h-10 text-warning mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">Bookmarks</span>
          </Link>
          <Link
            href="/dashboard/leaderboard"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-success hover:bg-success/5 dark:hover:bg-success/10 transition"
          >
            <TrophyIcon className="w-10 h-10 text-success mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">Leaderboard</span>
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
          >
            <ChartBarIcon className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">Analytics</span>
          </Link>
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations && recommendations.recommended_topics && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Recommended for You</h2>
          {recommendations.message && (
            <p className="text-gray-600 dark:text-gray-400 italic mb-4">{recommendations.message}</p>
          )}
          <div className="space-y-3">
            {recommendations.recommended_topics.slice(0, 3).map((topic: any, index: number) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-gradient-to-r from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 border border-warning/20 dark:border-warning/30"
              >
                <div className="flex items-start gap-3">
                  <LightBulbIcon className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{topic.topic_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{topic.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Suggestions */}
      {analytics && analytics.improvement_suggestions.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            AI Study Tips
          </h2>
          <div className="space-y-3">
            {analytics.improvement_suggestions.slice(0, 3).map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"
              >
                <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-900 dark:text-gray-100">{suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
