'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  AcademicCapIcon,
  BookmarkIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, recommendationsRes] = await Promise.all([
        api.get('/api/analytics/performance'),
        api.get('/api/recommendations/tests'),
      ]);
      setAnalytics(analyticsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.email.split('@')[0]}!</h1>
        <p className="text-blue-100">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics?.total_tests || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tests Taken</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics?.average_score ? `${analytics.average_score.toFixed(1)}%` : '0%'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FireIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics?.strong_topics?.length || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Strong Topics</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">--</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Rank</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/quiz"
            className="flex items-center p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition"
          >
            <AcademicCapIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Take Quiz</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Test your knowledge</p>
            </div>
          </Link>

          <Link
            href="/dashboard/practice"
            className="flex items-center p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 transition"
          >
            <SparklesIcon className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Practice Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Practice without timer</p>
            </div>
          </Link>

          <Link
            href="/dashboard/bookmarks"
            className="flex items-center p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 transition"
          >
            <BookmarkIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review saved questions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <SparklesIcon className="w-6 h-6 text-yellow-500 mr-2" />
            Recommended for You
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{recommendations.message}</p>
          <div className="space-y-3">
            {recommendations.recommended_topics?.map((topic: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{topic.topic_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{topic.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {analytics?.improvement_suggestions && analytics.improvement_suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Study Tips</h2>
          <ul className="space-y-3">
            {analytics.improvement_suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
