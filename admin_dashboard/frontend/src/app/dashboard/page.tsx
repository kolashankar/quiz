'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { api } from '@/services/auth/authService';
import { Spinner } from '@/components/ui/common/Spinner';
import { 
  BookOpenIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
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
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/analytics/dashboard');
        setStats(response.data.overview);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quiz Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Overview
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="card p-6">
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-primary-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-8 w-8 text-primary-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exams</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalExams || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <BookOpenIcon className="h-8 w-8 text-primary-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subjects</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalSubjects || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <QuestionMarkCircleIcon className="h-8 w-8 text-primary-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Questions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalQuestions || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-primary-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalTests || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Content Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/exams" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Exams</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 1</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/subjects" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-primary-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Subjects</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 2</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/chapters" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Chapters</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 3</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/topics" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Topics</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 4</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/subtopics" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Subtopics</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 5</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/sections" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sections</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 6</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/subsections" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-pink-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Subsections</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 7</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/questions" className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <QuestionMarkCircleIcon className="h-6 w-6 text-red-600" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Questions</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Level 8</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Additional Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Tools & Analytics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/bulk-upload" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <PlusIcon className="h-6 w-6 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">CSV Bulk Upload</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload questions via CSV</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/analytics" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View insights and reports</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/ai-tools" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">AI Tools</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered features</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Advanced Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/advanced-analytics" className="card p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex flex-col">
                <ChartBarIcon className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Advanced Analytics</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">User engagement, difficulty analysis, trends</p>
              </div>
            </Link>

            <Link href="/dashboard/bulk-operations" className="card p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div className="flex flex-col">
                <PlusIcon className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Bulk Operations</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Bulk edit, delete, export questions</p>
              </div>
            </Link>

            <Link href="/dashboard/question-quality" className="card p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex flex-col">
                <QuestionMarkCircleIcon className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Question Quality</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Review queue, flagging, duplicates</p>
              </div>
            </Link>

            <Link href="/dashboard/communication-tools" className="card p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <div className="flex flex-col">
                <UserGroupIcon className="h-8 w-8 text-orange-600 mb-3" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Communication</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Announcements, emails, notifications</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Content Structure Overview */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Content Structure (8-Level Hierarchy)
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">1. Exams</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(UPSC, JEE, NEET, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalExams || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">2. Subjects</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Physics, Chemistry, Math, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalSubjects || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">3. Chapters</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Mechanics, Organic Chemistry, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalChapters || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">4. Topics</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Force, Energy, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalTopics || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">5. Sub-Topics</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Newton&apos;s Laws, Work-Energy, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalSubtopics || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">6. Sections</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(First Law, Second Law, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalSections || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">7. Sub-Sections</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Applications, Examples, etc.)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalSubsections || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">8. Questions</span>
                <span className="text-sm text-primary-600 dark:text-primary-400">(MCQ Questions with explanations)</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{stats?.totalQuestions || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}