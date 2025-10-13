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
  }, [selectedExam]);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, scope, selectedExam, selectedSubject]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchLeaderboard();
    toast.success('Leaderboard refreshed!');
  };

  if (loading) {
    return <Loading text="Loading leaderboard..." />;
  }

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-2">Compete with top learners</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
        >
          Refresh
        </button>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="text-center pt-12 pb-6 bg-gradient-to-b from-gray-100">
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-gray-700">2</span>
            </div>
            <div className="text-lg font-bold text-gray-900 truncate px-2">
              {top3[1]?.user_email}
            </div>
            <div className="text-2xl font-bold text-primary mt-2">
              {top3[1]?.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {top3[1]?.total_tests} tests
            </div>
          </Card>

          {/* 1st Place */}
          <Card className="text-center pt-8 pb-6 bg-gradient-to-b from-warning/20 relative">
            <TrophyIcon className="w-12 h-12 text-warning mx-auto mb-2" />
            <div className="w-24 h-24 rounded-full bg-warning flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl font-bold text-white">1</span>
            </div>
            <div className="text-xl font-bold text-gray-900 truncate px-2">
              {top3[0]?.user_email}
            </div>
            <div className="text-3xl font-bold text-warning mt-2">
              {top3[0]?.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {top3[0]?.total_tests} tests
            </div>
          </Card>

          {/* 3rd Place */}
          <Card className="text-center pt-12 pb-6 bg-gradient-to-b from-orange-100">
            <div className="w-20 h-20 rounded-full bg-orange-300 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-orange-700">3</span>
            </div>
            <div className="text-lg font-bold text-gray-900 truncate px-2">
              {top3[2]?.user_email}
            </div>
            <div className="text-2xl font-bold text-primary mt-2">
              {top3[2]?.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {top3[2]?.total_tests} tests
            </div>
          </Card>
        </div>
      )}

      {/* Remaining Rankings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Rankings</h2>
        <div className="space-y-2">
          {remaining.map((entry) => {
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
                    <div className="font-semibold text-gray-900">
                      {entry.user_email}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{entry.total_tests} tests taken</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {entry.average_score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Score</div>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rankings Yet</h3>
            <p className="text-gray-600">Take a quiz to appear on the leaderboard!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
