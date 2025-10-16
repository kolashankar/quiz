'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading, Button } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import { useAuth } from '@/contexts/AuthContext';
import { LeaderboardEntry } from '@/types';
import toast from 'react-hot-toast';
import {
  TrophyIcon,
  FireIcon,
  StarIcon,
  FunnelIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type Period = 'all_time' | 'weekly' | 'monthly';
type Scope = 'global' | 'exam' | 'subject';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all_time');
  const [scope, setScope] = useState<Scope>('global');
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    averageScore: 0,
  });

  const fetchLeaderboard = async () => {
    try {
      const params: any = { period, scope };
      if (scope === 'exam' && selectedExam) {
        params.exam_id = selectedExam;
      }
      if (scope === 'subject' && selectedSubject) {
        params.subject_id = selectedSubject;
      }

      const data = await quizService.getFilteredLeaderboard(params);
      setLeaderboard(data.leaderboard || data);
      
      // Calculate stats
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        const participants = data.leaderboard.length;
        const avgScore = participants > 0 
          ? data.leaderboard.reduce((sum: number, entry: any) => sum + entry.average_score, 0) / participants
          : 0;
        setStats({
          totalParticipants: participants,
          averageScore: avgScore,
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const data = await quizService.getExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchSubjects = async (examId?: string) => {
    try {
      const data = await quizService.getSubjects(examId);
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (scope === 'exam' && selectedExam) {
      fetchSubjects(selectedExam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchLeaderboard();
  }, [period, scope, selectedExam, selectedSubject]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchLeaderboard();
    toast.success('Leaderboard refreshed!');
  };

  const handleScopeChange = (newScope: Scope) => {
    setScope(newScope);
    setSelectedExam('');
    setSelectedSubject('');
  };

  if (loading) {
    return <Loading text="Loading leaderboard..." />;
  }

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Find current user's rank
  const currentUserEntry = leaderboard.find((entry) => entry.user_email === user?.email);
  const nearbyUsers = currentUserEntry
    ? leaderboard.slice(
        Math.max(0, (currentUserEntry.rank || 0) - 3),
        Math.min(leaderboard.length, (currentUserEntry.rank || 0) + 2)
      )
    : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">Leaderboard</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">Compete with top learners</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:bg-gray-700 transition"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Filter Options</h3>
          
          {/* Time Period Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Time Period</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPeriod('all_time')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === 'all_time'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === 'weekly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === 'monthly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Scope Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Scope</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleScopeChange('global')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  scope === 'global'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => handleScopeChange('exam')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  scope === 'exam'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Exam
              </button>
              <button
                onClick={() => handleScopeChange('subject')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  scope === 'subject'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Subject
              </button>
            </div>
          </div>

          {/* Exam Filter (when scope is exam or subject) */}
          {(scope === 'exam' || scope === 'subject') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Select Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Exams</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Filter (when scope is subject) */}
          {scope === 'subject' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Participants</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalParticipants}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Average Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.averageScore.toFixed(1)}%</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-warning" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Your Rank</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {currentUserEntry ? `#${currentUserEntry.rank}` : 'N/A'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="text-center pt-12 pb-6 bg-gradient-to-b from-gray-100">
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600">2</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate px-2">
              {top3[1]?.user_email}
            </div>
            <div className="text-2xl font-bold text-primary mt-2">
              {top3[1]?.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
              {top3[1]?.total_tests} tests
            </div>
          </Card>

          {/* 1st Place */}
          <Card className="text-center pt-8 pb-6 bg-gradient-to-b from-warning/20 relative">
            <TrophyIcon className="w-12 h-12 text-warning mx-auto mb-2" />
            <div className="w-24 h-24 rounded-full bg-warning flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl font-bold text-white">1</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate px-2">
              {top3[0]?.user_email}
            </div>
            <div className="text-3xl font-bold text-warning mt-2">
              {top3[0]?.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
              {top3[0]?.total_tests} tests
            </div>
          </Card>

          {/* 3rd Place */}
          <Card className="text-center pt-12 pb-6 bg-gradient-to-b from-orange-100">
            <div className="w-20 h-20 rounded-full bg-orange-300 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-orange-700">3</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate px-2">
              {top3[2]?.user_email}
            </div>
            <div className="text-2xl font-bold text-primary mt-2">
              {top3[2]?.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
              {top3[2]?.total_tests} tests
            </div>
          </Card>
        </div>
      )}

      {/* Nearby Rankings (for current user) */}
      {currentUserEntry && nearbyUsers.length > 0 && (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-primary" />
            Your Position
          </h2>
          <div className="space-y-2">
            {nearbyUsers.map((entry) => {
              const isCurrentUser = entry.user_email === user?.email;
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser ? 'bg-primary text-white' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCurrentUser ? 'bg-white text-primary' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <div className={`font-semibold ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                        {entry.user_email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-white dark:bg-gray-800 text-primary px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                        {entry.total_tests} tests
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${isCurrentUser ? 'text-white' : 'text-primary'}`}>
                      {entry.average_score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* All Rankings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">All Rankings</h2>
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_email === user?.email;
            return (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isCurrentUser ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {entry.user_email}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{entry.total_tests} tests taken</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {entry.average_score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">Avg Score</div>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Rankings Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Take a quiz to appear on the leaderboard!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
