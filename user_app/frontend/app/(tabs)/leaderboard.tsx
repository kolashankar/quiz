import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Card, Loading } from '../../src/components/common';
import { quizService } from '../../src/services/api/quiz';
import { LeaderboardEntry } from '../../src/types';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const data = await quizService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#8E8E93';
    }
  };

  const isCurrentUser = (email: string) => {
    return user?.email === email;
  };

  if (loading) {
    return <Loading text="Loading leaderboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>
            Top performers based on average quiz scores
          </Text>
        </View>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Card style={styles.podiumCard}>
            <View style={styles.podium}>
              {/* Second Place */}
              <View style={[styles.podiumPosition, styles.secondPlace]}>
                <Text style={styles.podiumRank}>🥈</Text>
                <Text style={styles.podiumScore}>
                  {leaderboard[1].average_score.toFixed(1)}%
                </Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[1].user_email.split('@')[0]}
                </Text>
              </View>

              {/* First Place */}
              <View style={[styles.podiumPosition, styles.firstPlace]}>
                <Text style={styles.podiumRank}>🥇</Text>
                <Text style={styles.podiumScore}>
                  {leaderboard[0].average_score.toFixed(1)}%
                </Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[0].user_email.split('@')[0]}
                </Text>
              </View>

              {/* Third Place */}
              <View style={[styles.podiumPosition, styles.thirdPlace]}>
                <Text style={styles.podiumRank}>🥉</Text>
                <Text style={styles.podiumScore}>
                  {leaderboard[2].average_score.toFixed(1)}%
                </Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[2].user_email.split('@')[0]}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Full Leaderboard */}
        <Card style={styles.leaderboardCard}>
          <Text style={styles.sectionTitle}>Full Rankings</Text>
          
          {leaderboard.map((entry, index) => (
            <View
              key={index}
              style={[
                styles.leaderboardItem,
                isCurrentUser(entry.user_email) && styles.currentUserItem,
              ]}
            >
              <View style={styles.rankContainer}>
                {getRankIcon(entry.rank) ? (
                  <Text style={styles.rankIcon}>{getRankIcon(entry.rank)}</Text>
                ) : (
                  <View style={[styles.rankCircle, { backgroundColor: getRankColor(entry.rank) }]}>
                    <Text style={styles.rankText}>{entry.rank}</Text>
                  </View>
                )}
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={[
                    styles.userName,
                    isCurrentUser(entry.user_email) && styles.currentUserName,
                  ]}>
                    {entry.user_email.split('@')[0]}
                    {isCurrentUser(entry.user_email) && ' (You)'}
                  </Text>
                  {isCurrentUser(entry.user_email) && (
                    <Ionicons name="person-circle" size={16} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.userStats}>
                  {entry.total_tests} test{entry.total_tests !== 1 ? 's' : ''} taken
                </Text>
              </View>

              <View style={styles.scoreContainer}>
                <Text style={[
                  styles.userScore,
                  isCurrentUser(entry.user_email) && styles.currentUserScore,
                ]}>
                  {entry.average_score.toFixed(1)}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${entry.average_score}%`,
                        backgroundColor: isCurrentUser(entry.user_email) ? '#007AFF' : '#34C759',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </Card>

        {leaderboard.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="trophy-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Rankings Yet</Text>
              <Text style={styles.emptySubtitle}>
                Take some quizzes to appear on the leaderboard!
              </Text>
            </View>
          </Card>
        )}

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.statValue}>{leaderboard.length}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statValue}>
                {leaderboard.length > 0 ? leaderboard[0].average_score.toFixed(1) : '0'}%
              </Text>
              <Text style={styles.statLabel}>Top Score</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="analytics" size={24} color="#34C759" />
              <Text style={styles.statValue}>
                {leaderboard.length > 0
                  ? (leaderboard.reduce((sum, entry) => sum + entry.average_score, 0) / leaderboard.length).toFixed(1)
                  : '0'
                }%
              </Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  podiumCard: {
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 20,
  },
  podiumPosition: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 80,
  },
  firstPlace: {
    backgroundColor: '#FFD700',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: -20,
  },
  secondPlace: {
    backgroundColor: '#C0C0C0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: -10,
  },
  thirdPlace: {
    backgroundColor: '#CD7F32',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  podiumRank: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    textAlign: 'center',
  },
  leaderboardCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  rankIcon: {
    fontSize: 24,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  currentUserName: {
    color: '#007AFF',
  },
  userStats: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  userScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  currentUserScore: {
    color: '#007AFF',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
});