import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../../../src/components/common';
import { quizService } from '../../../src/services/api/quiz';
import { TestResult } from '../../../src/types';

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const score = parseFloat(params.score as string);
  const totalQuestions = parseInt(params.totalQuestions as string);
  const correctAnswers = parseInt(params.correctAnswers as string);
  const percentile = parseFloat(params.percentile as string);

  useEffect(() => {
    fetchTestResult();
  }, []);

  const fetchTestResult = async () => {
    try {
      const history = await quizService.getTestHistory();
      const latestResult = history[0]; // Get the most recent result
      setResult(latestResult);
    } catch (error) {
      console.error('Error fetching test result:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34C759';
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const getGradeText = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Very Good!';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const toggleQuestionExpansion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just scored ${score.toFixed(1)}% in my QuizMaster test! Got ${correctAnswers} out of ${totalQuestions} questions correct. 📚`,
      });
    } catch (error) {
      console.error('Error sharing result:', error);
    }
  };

  const handleRetakeQuiz = () => {
    router.push('/(tabs)/quiz');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>
                {score.toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.gradeText}>{getGradeText(score)}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{percentile.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Percentile</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${score}%`,
                    backgroundColor: getScoreColor(score) 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {correctAnswers} out of {totalQuestions} questions correct
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Share Result"
            onPress={handleShare}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Retake Quiz"
            onPress={handleRetakeQuiz}
            style={styles.actionButton}
          />
        </View>

        {/* Question Review */}
        {result && result.questions && (
          <Card style={styles.reviewCard}>
            <Text style={styles.sectionTitle}>Question Review</Text>
            
            {result.questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <TouchableOpacity
                  style={styles.questionHeader}
                  onPress={() => toggleQuestionExpansion(index)}
                >
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                    <Ionicons
                      name={question.is_correct ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={question.is_correct ? "#34C759" : "#FF3B30"}
                    />
                  </View>
                  <Text style={styles.questionSummary} numberOfLines={2}>
                    {question.question_text}
                  </Text>
                  <Ionicons
                    name={expandedQuestions.has(index) ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>

                {expandedQuestions.has(index) && (
                  <View style={styles.questionDetails}>
                    <Text style={styles.fullQuestionText}>{question.question_text}</Text>
                    
                    <View style={styles.optionsContainer}>
                      {question.options.map((option, optIndex) => (
                        <View
                          key={optIndex}
                          style={[
                            styles.optionItem,
                            optIndex === question.correct_answer && styles.correctOption,
                            optIndex === question.user_answer && !question.is_correct && styles.wrongOption,
                          ]}
                        >
                          <Text style={styles.optionLabel}>
                            {String.fromCharCode(65 + optIndex)}.
                          </Text>
                          <Text style={styles.optionText}>{option}</Text>
                          {optIndex === question.correct_answer && (
                            <Ionicons name="checkmark" size={16} color="#34C759" />
                          )}
                          {optIndex === question.user_answer && !question.is_correct && (
                            <Ionicons name="close" size={16} color="#FF3B30" />
                          )}
                        </View>
                      ))}
                    </View>

                    {question.explanation && (
                      <View style={styles.explanationContainer}>
                        <Text style={styles.explanationTitle}>Explanation:</Text>
                        <Text style={styles.explanationText}>{question.explanation}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          <Button
            title="View Analytics"
            onPress={() => router.push('/(tabs)/profile')}
            variant="outline"
          />
          <Button
            title="Back to Home"
            onPress={() => router.push('/(tabs)')}
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
  scoreCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  reviewCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  questionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    paddingBottom: 12,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  questionNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginRight: 4,
  },
  questionSummary: {
    flex: 1,
    fontSize: 14,
    color: '#1D1D1F',
  },
  questionDetails: {
    marginTop: 12,
    paddingLeft: 12,
  },
  fullQuestionText: {
    fontSize: 16,
    color: '#1D1D1F',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  correctOption: {
    backgroundColor: '#E8F5E8',
    borderColor: '#34C759',
    borderWidth: 1,
  },
  wrongOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
  },
  explanationContainer: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
});