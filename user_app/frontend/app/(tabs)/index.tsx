import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Card, Loading } from '../../src/components/common';
import { quizService } from '../../src/services/api/quiz';
import { Analytics } from '../../src/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = async () => {
    try {
      const [analyticsData, recommendationsData] = await Promise.all([
        quizService.getUserAnalytics().catch(() => null),
        quizService.getRecommendations().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  };

  useEffect(() => {
    fetchHomeData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  if (loading) {
    return <Loading text="Loading your dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Quick Stats */}
        {analytics && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Your Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={24} color="#FF9500" />
                <Text style={styles.statValue}>{analytics.total_tests}</Text>
                <Text style={styles.statLabel}>Tests Taken</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={24} color="#34C759" />
                <Text style={styles.statValue}>{analytics.average_score.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={24} color="#007AFF" />
                <Text style={styles.statValue}>{analytics.strong_topics.length}</Text>
                <Text style={styles.statLabel}>Strong Topics</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/quiz')}
            >
              <Ionicons name="library" size={32} color="#007AFF" />
              <Text style={styles.actionText}>Take Quiz</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/bookmarks')}
            >
              <Ionicons name="bookmark" size={32} color="#FF9500" />
              <Text style={styles.actionText}>Bookmarks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/leaderboard')}
            >
              <Ionicons name="trophy" size={32} color="#34C759" />
              <Text style={styles.actionText}>Leaderboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="analytics" size={32} color="#AF52DE" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recommendations */}
        {recommendations && recommendations.recommended_topics && (
          <Card style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <Text style={styles.recommendationMessage}>{recommendations.message}</Text>
            {recommendations.recommended_topics.slice(0, 3).map((topic: any, index: number) => (
              <TouchableOpacity key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationContent}>
                  <Ionicons name="bulb" size={20} color="#FF9500" />
                  <Text style={styles.recommendationTitle}>{topic.topic_name}</Text>
                </View>
                <Text style={styles.recommendationReason}>{topic.reason}</Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* AI Suggestions */}
        {analytics && analytics.improvement_suggestions.length > 0 && (
          <Card style={styles.suggestionsCard}>
            <Text style={styles.sectionTitle}>AI Study Tips</Text>
            {analytics.improvement_suggestions.slice(0, 3).map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Ionicons name="sparkles" size={16} color="#AF52DE" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </Card>
        )}
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  emailText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 16,
  },
  actionsCard: {
    marginBottom: 16,
  },
  recommendationsCard: {
    marginBottom: 16,
  },
  suggestionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    marginTop: 8,
    textAlign: 'center',
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  recommendationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 28,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginLeft: 8,
    flex: 1,
  },
});