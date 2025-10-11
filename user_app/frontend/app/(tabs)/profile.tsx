import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Card, Loading, Button } from '../../src/components/common';
import { quizService } from '../../src/services/api/quiz';
import { Analytics, TestResult } from '../../src/types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      const [analyticsData, historyData] = await Promise.all([
        quizService.getUserAnalytics().catch(() => null),
        quizService.getTestHistory().catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setTestHistory(historyData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    fetchProfileData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34C759';
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  if (loading) {
    return <Loading text="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'admin' ? 'Administrator' : 'Student'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/profile/edit')} 
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Performance Analytics */}
        {analytics && (
          <Card style={styles.analyticsCard}>
            <Text style={styles.sectionTitle}>Performance Analytics</Text>
            
            <View style={styles.statsOverview}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Ionicons name="trophy" size={24} color="#FF9500" />
                </View>
                <Text style={styles.statValue}>{analytics.total_tests}</Text>
                <Text style={styles.statLabel}>Tests Taken</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: getScoreColor(analytics.average_score) + '20' }]}>
                  <Ionicons name="star" size={24} color={getScoreColor(analytics.average_score)} />
                </View>
                <Text style={[styles.statValue, { color: getScoreColor(analytics.average_score) }]}>
                  {analytics.average_score.toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>Average Score</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Ionicons name="trending-up" size={24} color="#34C759" />
                </View>
                <Text style={styles.statValue}>{analytics.strong_topics.length}</Text>
                <Text style={styles.statLabel}>Strong Topics</Text>
              </View>
            </View>

            {/* Strong Topics */}
            {analytics.strong_topics.length > 0 && (
              <View style={styles.topicsSection}>
                <Text style={styles.subsectionTitle}>Strong Topics</Text>
                {analytics.strong_topics.slice(0, 3).map((topic, index) => (
                  <View key={index} style={styles.topicItem}>
                    <View style={styles.topicInfo}>
                      <Text style={styles.topicName}>{topic.topic_name}</Text>
                      <Text style={styles.topicStats}>
                        {topic.correct}/{topic.total} correct
                      </Text>
                    </View>
                    <Text style={[styles.topicScore, { color: '#34C759' }]}>
                      {topic.percentage.toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Weak Topics */}
            {analytics.weak_topics.length > 0 && (
              <View style={styles.topicsSection}>
                <Text style={styles.subsectionTitle}>Areas to Improve</Text>
                {analytics.weak_topics.slice(0, 3).map((topic, index) => (
                  <View key={index} style={styles.topicItem}>
                    <View style={styles.topicInfo}>
                      <Text style={styles.topicName}>{topic.topic_name}</Text>
                      <Text style={styles.topicStats}>
                        {topic.correct}/{topic.total} correct
                      </Text>
                    </View>
                    <Text style={[styles.topicScore, { color: '#FF3B30' }]}>
                      {topic.percentage.toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* AI Recommendations */}
        {analytics && analytics.improvement_suggestions.length > 0 && (
          <Card style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={24} color="#AF52DE" />
              <Text style={styles.sectionTitle}>AI Study Tips</Text>
            </View>
            {analytics.improvement_suggestions.slice(0, 4).map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Ionicons name="bulb" size={16} color="#FF9500" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Recent Test History */}
        {testHistory.length > 0 && (
          <Card style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent Tests</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {testHistory.slice(0, 5).map((test, index) => (
              <View key={test.id} style={styles.testItem}>
                <View style={styles.testInfo}>
                  <Text style={styles.testDate}>
                    {new Date(test.timestamp).toLocaleDateString()}
                  </Text>
                  <Text style={styles.testStats}>
                    {test.correct_answers}/{test.total_questions} questions
                  </Text>
                </View>
                
                <View style={styles.testScore}>
                  <Text style={[styles.scoreText, { color: getScoreColor(test.score) }]}>
                    {test.score.toFixed(1)}%
                  </Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreFill,
                        {
                          width: `${test.score}%`,
                          backgroundColor: getScoreColor(test.score),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="analytics" size={20} color="#007AFF" />
            <Text style={styles.actionText}>View Detailed Analytics</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="download" size={20} color="#34C759" />
            <Text style={styles.actionText}>Export Test Results</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="settings" size={20} color="#8E8E93" />
            <Text style={styles.actionText}>Account Settings</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutBtn}
          />
        </View>
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
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  editButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  analyticsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  topicsSection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  topicStats: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  topicScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiCard: {
    marginBottom: 16,
    backgroundColor: '#FAF5FF',
    borderColor: '#AF52DE',
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  testInfo: {
    flex: 1,
  },
  testDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  testStats: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  testScore: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
    marginLeft: 12,
  },
  logoutContainer: {
    marginBottom: 32,
  },
  logoutBtn: {
    borderColor: '#FF3B30',
  },
});