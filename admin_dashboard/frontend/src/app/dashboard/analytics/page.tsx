'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { api } from '@/services/auth/authService';
import { Spinner } from '@/components/ui/common/Spinner';
import { 
  ChartBarIcon,
  AcademicCapIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  TrendingUpIcon,
  EyeIcon,
  CalendarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalExams: number;
    totalSubjects: number;
    totalChapters: number;
    totalTopics: number;
    totalSubtopics: number;
    totalSections: number;
    totalSubsections: number;
    totalQuestions: number;
    totalTests: number;
  };
  statistics: {
    difficultyDistribution: { difficulty: string; _count: { id: number } }[];
    questionsPerExam: { examName: string; questionCount: number }[];
  };
  recentActivity: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [aiInsights, setAIInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      setLoadingInsights(true);
      const response = await api.post('/admin/analytics/ai-suggestions', {
        type: 'content-analysis',
        context: { timeRange }
      });
      setAIInsights(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const formatDifficultyData = () => {
    if (!data?.statistics.difficultyDistribution) return [];
    return data.statistics.difficultyDistribution.map(item => ({
      difficulty: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
      count: item._count.id,
      fill: item.difficulty === 'easy' ? '#10B981' : 
            item.difficulty === 'medium' ? '#F59E0B' : '#EF4444'
    }));
  };

  const formatExamData = () => {
    if (!data?.statistics.questionsPerExam) return [];
    return data.statistics.questionsPerExam.slice(0, 10); // Top 10 exams
  };

  const formatHierarchyData = () => {
    if (!data?.overview) return [];
    return [
      { level: 'Exams', count: data.overview.totalExams, color: '#8B5CF6' },
      { level: 'Subjects', count: data.overview.totalSubjects, color: '#06B6D4' },
      { level: 'Chapters', count: data.overview.totalChapters, color: '#10B981' },
      { level: 'Topics', count: data.overview.totalTopics, color: '#F59E0B' },
      { level: 'Subtopics', count: data.overview.totalSubtopics, color: '#EF4444' },
      { level: 'Sections', count: data.overview.totalSections, color: '#8B5CF6' },
      { level: 'Subsections', count: data.overview.totalSubsections, color: '#06B6D4' },
      { level: 'Questions', count: data.overview.totalQuestions, color: '#10B981' }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="input"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={fetchAIInsights}
                disabled={loadingInsights}
                className="btn-primary flex items-center space-x-2"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>{loadingInsights ? 'Analyzing...' : 'AI Insights'}</span>
              </button>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex mt-4">
            <ol className="flex items-center space-x-2">
              <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li>
              <li><span className="mx-2">/</span><span>Analytics</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-blue-100">Total Users</p>
                <p className="text-3xl font-bold">{data?.overview.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-green-100">Total Exams</p>
                <p className="text-3xl font-bold">{data?.overview.totalExams || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center">
              <QuestionMarkCircleIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-purple-100">Total Questions</p>
                <p className="text-3xl font-bold">{data?.overview.totalQuestions || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-orange-100">Tests Taken</p>
                <p className="text-3xl font-bold">{data?.overview.totalTests || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Content Hierarchy Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Hierarchy</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatHierarchyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Difficulty Distribution */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Difficulty Distribution</h3>
              <EyeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatDifficultyData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ difficulty, count }) => `${difficulty}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {formatDifficultyData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Questions per Exam */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions per Exam</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={formatExamData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="examName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="questionCount" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Panel */}
        {aiInsights && (
          <div className="card p-6 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <SparklesIcon className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {aiInsights}
              </pre>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0">
                    <QuestionMarkCircleIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      New question added
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.subsection?.name} • {activity.difficulty}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activity found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}