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
  EnvelopeIcon,
  PencilIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  SparklesIcon,
  ClockIcon,
  CalendarIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
      setTestHistory(historyData);
      setDifficultyBreakdown(difficultyData);
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
      const updatedUser = await authService.updateProfile({ email });
      updateUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading profile..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Profile & Analytics</h1>

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
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.email}</h2>
                  <p className="text-sm text-gray-600 mb-4 capitalize">{user?.role}</p>
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    size="small"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Overview</h3>
            {analytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrophyIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{analytics.total_tests}</div>
                  <div className="text-sm text-gray-600">Tests Taken</div>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <ChartBarIcon className="w-8 h-8 text-success mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.average_score.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <FireIcon className="w-8 h-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.strong_topics.length}
                  </div>
                  <div className="text-sm text-gray-600">Strong Topics</div>
                </div>
                <div className="text-center p-4 bg-danger/10 rounded-lg">
                  <SparklesIcon className="w-8 h-8 text-danger mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.weak_topics.length}
                  </div>
                  <div className="text-sm text-gray-600">Needs Work</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No analytics available yet. Take a quiz to see your performance!</p>
            )}
          </Card>
        </div>
      </div>

      {/* Strong Topics */}
      {analytics && analytics.strong_topics.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FireIcon className="w-6 h-6 text-warning" />
            Strong Topics
          </h3>
          <div className="space-y-3">
            {analytics.strong_topics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">{topic.topic_name}</div>
                  <div className="text-sm text-gray-600">
                    {topic.correct} / {topic.total} correct
                  </div>
                </div>
                <div className="text-2xl font-bold text-success">{topic.percentage.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weak Topics */}
      {analytics && analytics.weak_topics.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-danger" />
            Topics to Improve
          </h3>
          <div className="space-y-3">
            {analytics.weak_topics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-danger/5 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">{topic.topic_name}</div>
                  <div className="text-sm text-gray-600">
                    {topic.correct} / {topic.total} correct
                  </div>
                </div>
                <div className="text-2xl font-bold text-danger">{topic.percentage.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Suggestions */}
      {analytics && analytics.improvement_suggestions.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
            AI Study Recommendations
          </h3>
          <div className="space-y-3">
            {analytics.improvement_suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-900">{suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
