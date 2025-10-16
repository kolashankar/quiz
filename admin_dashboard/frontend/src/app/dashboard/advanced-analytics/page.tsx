'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/auth/authService';
import { Spinner } from '@/components/ui/common/Spinner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [groupBy, setGroupBy] = useState('day');
  
  const [userEngagement, setUserEngagement] = useState<any>(null);
  const [questionDifficulty, setQuestionDifficulty] = useState<any>(null);
  const [successByTopic, setSuccessByTopic] = useState<any>(null);
  const [timeTrends, setTimeTrends] = useState<any>(null);
  const [performanceDist, setPerformanceDist] = useState<any>(null);

  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [engagement, difficulty, success, trends, distribution] = await Promise.all([
        api.get(`/admin/analytics/user-engagement?period=${period}`),
        api.get('/admin/analytics/question-difficulty-analysis'),
        api.get('/admin/analytics/success-rate-by-topic'),
        api.get(`/admin/analytics/time-based-trends?period=${period}&groupBy=${groupBy}`),
        api.get('/admin/analytics/performance-distribution')
      ]);

      setUserEngagement(engagement.data);
      setQuestionDifficulty(difficulty.data);
      setSuccessByTopic(success.data);
      setTimeTrends(trends.data);
      setPerformanceDist(distribution.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="input"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* User Engagement Metrics */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <UserGroupIcon className="h-6 w-6 mr-2 text-primary-600" />
          User Engagement
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-blue-600">{userEngagement?.totalUsers || 0}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            <p className="text-2xl font-bold text-green-600">{userEngagement?.activeUsers || 0}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">New Users</p>
            <p className="text-2xl font-bold text-purple-600">{userEngagement?.newUsers || 0}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</p>
            <p className="text-2xl font-bold text-orange-600">{userEngagement?.retentionRate || 0}%</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userEngagement?.dailyActivity || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" name="Active Users" />
            <Line type="monotone" dataKey="testsCount" stroke="#82ca9d" name="Tests" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Question Difficulty Analysis */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <AcademicCapIcon className="h-6 w-6 mr-2 text-primary-600" />
          Question Difficulty Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Difficulty Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Easy', value: questionDifficulty?.difficultyBreakdown?.easy?.count || 0 },
                    { name: 'Medium', value: questionDifficulty?.difficultyBreakdown?.medium?.count || 0 },
                    { name: 'Hard', value: questionDifficulty?.difficultyBreakdown?.hard?.count || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">Average Success Rate by Difficulty</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { difficulty: 'Easy', successRate: parseFloat(questionDifficulty?.difficultyBreakdown?.easy?.avgSuccessRate || 0) },
                  { difficulty: 'Medium', successRate: parseFloat(questionDifficulty?.difficultyBreakdown?.medium?.avgSuccessRate || 0) },
                  { difficulty: 'Hard', successRate: parseFloat(questionDifficulty?.difficultyBreakdown?.hard?.avgSuccessRate || 0) }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Mismatched Questions:</strong> {questionDifficulty?.mismatchedQuestions || 0} questions have difficulty levels that don't match their actual performance.
          </p>
        </div>
      </div>

      {/* Time-Based Trends */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-primary-600" />
          Performance Trends
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
            <p className="text-xl font-bold capitalize"
              style={{ color: timeTrends?.summary?.trend === 'improving' ? '#10b981' : timeTrends?.summary?.trend === 'declining' ? '#ef4444' : '#6b7280' }}
            >
              {timeTrends?.summary?.trend || 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
            <p className="text-xl font-bold">{timeTrends?.summary?.totalTests || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
            <p className="text-xl font-bold">{timeTrends?.summary?.avgScore || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Percentage</p>
            <p className="text-xl font-bold">{timeTrends?.summary?.avgPercentage || 0}%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeTrends?.trends || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgPercentage" stroke="#8884d8" name="Avg Percentage" />
            <Line type="monotone" dataKey="testsCount" stroke="#82ca9d" name="Tests Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Success Rate by Topic */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-primary-600" />
          Success Rate by Topic
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3 text-red-600">Weakest Topics</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {successByTopic?.weakestTopics?.slice(0, 10).map((topic: any, idx: number) => (
                <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="font-medium text-sm">{topic.topicName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{topic.examName} - {topic.subjectName}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs">Success Rate: {topic.successRate}%</span>
                    <span className="text-xs text-gray-500">{topic.totalAttempts} attempts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3 text-green-600">Strongest Topics</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {successByTopic?.strongestTopics?.slice(0, 10).map((topic: any, idx: number) => (
                <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-sm">{topic.topicName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{topic.examName} - {topic.subjectName}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs">Success Rate: {topic.successRate}%</span>
                    <span className="text-xs text-gray-500">{topic.totalAttempts} attempts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceDist?.distribution || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Number of Tests" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
