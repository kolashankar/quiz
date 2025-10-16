'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading, Button, Input } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { quizService } from '@/lib/quiz-service';
import { authService } from '@/lib/auth-service';
import { Analytics, TestResult } from '@/types';
import toast from 'react-hot-toast';
import {
  UserIcon,
  PencilIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  SparklesIcon,
  ClockIcon,
  CalendarIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');

  const fetchData = async () => {
    try {
      const [analyticsData, historyData, difficultyData] = await Promise.all([
        quizService.getUserAnalytics(),
        quizService.getTestHistory(),
        quizService.getDifficultyBreakdown(),
      ]);
      setAnalytics(analyticsData);
      setTestHistory(historyData || []);
      setDifficultyBreakdown(difficultyData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updatedUser = await authService.updateProfile({ email, name });
      updateUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading profile..." />;
  }

  // Prepare performance over time data
  const performanceData = testHistory
    .slice(-10)
    .map((test, index) => ({
      name: `Test ${index + 1}`,
      score: test.score,
      date: new Date(test.timestamp).toLocaleDateString(),
    }));

  // Prepare difficulty breakdown pie chart data
  const pieData = Array.isArray(difficultyBreakdown) ? difficultyBreakdown.map((item) => ({
    name: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
    value: item.percentage,
    correct: item.correct,
    total: item.total,
  })) : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile & Analytics</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'analytics'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Test History
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      type="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        isLoading={saving}
                        variant="primary"
                        size="small"
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditing(false);
                          setEmail(user?.email || '');
                          setName(user?.name || '');
                        }}
                        variant="outline"
                        size="small"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {user?.name || user?.email}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">{user?.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4 capitalize">{user?.role}</p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => setEditing(true)}
                        variant="outline"
                        size="small"
                        className="w-full"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        onClick={() => setChangingPassword(!changingPassword)}
                        variant="outline"
                        size="small"
                        className="w-full"
                      >
                        <KeyIcon className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </>
                )}

                {/* Change Password Form */}
                {changingPassword && !editing && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <Input
                      type="password"
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Input
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                      type="password"
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleChangePassword}
                        isLoading={saving}
                        variant="primary"
                        size="small"
                        className="flex-1"
                      >
                        Update
                      </Button>
                      <Button
                        onClick={() => {
                          setChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        variant="outline"
                        size="small"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Performance Overview</h3>
              {analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <TrophyIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.total_tests}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Tests Taken</div>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <ChartBarIcon className="w-8 h-8 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.average_score.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Avg Score</div>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <FireIcon className="w-8 h-8 text-warning mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.strong_topics.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Strong Topics</div>
                  </div>
                  <div className="text-center p-4 bg-danger/10 rounded-lg">
                    <SparklesIcon className="w-8 h-8 text-danger mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.weak_topics.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Needs Work</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  No analytics available yet. Take a quiz to see your performance!
                </p>
              )}
            </Card>

            {/* Strong Topics */}
            {analytics && analytics.strong_topics.length > 0 && (
              <Card className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <FireIcon className="w-5 h-5 text-warning" />
                  Strong Topics
                </h3>
                <div className="space-y-2">
                  {analytics.strong_topics.slice(0, 5).map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-success/5 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{topic.topic_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                          {topic.correct} / {topic.total} correct
                        </div>
                      </div>
                      <div className="text-lg font-bold text-success">
                        {topic.percentage.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Weak Topics */}
            {analytics && analytics.weak_topics.length > 0 && (
              <Card className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-danger" />
                  Topics to Improve
                </h3>
                <div className="space-y-2">
                  {analytics.weak_topics.slice(0, 5).map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-danger/5 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{topic.topic_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                          {topic.correct} / {topic.total} correct
                        </div>
                      </div>
                      <div className="text-lg font-bold text-danger">
                        {topic.percentage.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* AI Suggestions */}
          {analytics && analytics.improvement_suggestions.length > 0 && (
            <div className="lg:col-span-3">
              <Card>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  AI Study Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.improvement_suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-900 dark:text-gray-100">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Over Time Chart */}
          {performanceData.length > 0 && (
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Difficulty Breakdown Pie Chart */}
            {pieData.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Difficulty-wise Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-700 dark:text-gray-300 dark:text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {item.correct}/{item.total} ({item.value.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Performance Bar Chart */}
            {difficultyBreakdown.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Accuracy by Difficulty</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentage" fill="#3B82F6" name="Accuracy %" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Test History Tab */}
      {activeTab === 'history' && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Test History</h3>
          {testHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">Topic</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      Correct
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">Time</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      Percentile
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {testHistory.map((test, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 dark:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(test.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900 dark:text-gray-100">N/A</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            test.score >= 80
                              ? 'bg-success/10 text-success'
                              : test.score >= 60
                              ? 'bg-warning/10 text-warning'
                              : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {test.score.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {test.correct_answers}/{test.total_questions}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            N/A
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-primary">
                          {test.percentile.toFixed(0)}th
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrophyIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Tests Taken Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Start taking quizzes to see your history!</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
