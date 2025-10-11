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
import { Card, Loading } from '../../../src/components/common';
import { quizService } from '../../../src/services/api/quiz';
import { Exam } from '../../../src/types';

export default function QuizScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = async () => {
    try {
      const examList = await quizService.getExams();
      setExams(examList);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  useEffect(() => {
    fetchExams().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExams();
    setRefreshing(false);
  };

  const handleExamSelect = (exam: Exam) => {
    router.push({
      pathname: '/(tabs)/quiz/hierarchy',
      params: {
        examId: exam.id,
        examName: exam.name,
        level: 'subject',
      },
    });
  };

  if (loading) {
    return <Loading text="Loading exams..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select an Exam</Text>
          <Text style={styles.subtitle}>Choose your competitive exam to start practicing</Text>
        </View>

        {exams.map((exam) => (
          <Card key={exam.id} style={styles.examCard}>
            <TouchableOpacity
              style={styles.examTouchable}
              onPress={() => handleExamSelect(exam)}
            >
              <View style={styles.examHeader}>
                <View style={styles.examIcon}>
                  <Ionicons name="school" size={28} color="#007AFF" />
                </View>
                <View style={styles.examInfo}>
                  <Text style={styles.examName}>{exam.name}</Text>
                  <Text style={styles.examDescription}>{exam.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </Card>
        ))}

        {exams.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="library-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Exams Available</Text>
              <Text style={styles.emptySubtitle}>
                Exams will appear here once they are added to the system.
              </Text>
            </View>
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
  examCard: {
    marginBottom: 12,
    padding: 0,
  },
  examTouchable: {
    padding: 16,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  examDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  emptyCard: {
    marginTop: 48,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});