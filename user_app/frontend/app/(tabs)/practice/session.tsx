import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import axios from 'axios';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  explanation?: string;
  hint?: string;
  solution?: string;
  tags?: string[];
}

interface UserAnswer {
  questionId: string;
  selectedOption: number | null;
  isCorrect: boolean | null;
  showAnswer: boolean;
}

export default function PracticeSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const difficulty = params.difficulty as string;
      const count = parseInt(params.questionCount as string) || 20;

      const queryParams: any = { limit: count };
      if (difficulty !== 'all') {
        queryParams.difficulty = difficulty;
      }

      const response = await axios.get(`${backendUrl}/api/questions`, {
        params: queryParams,
      });
      const fetchedQuestions = response.data || [];

      if (fetchedQuestions.length === 0) {
        Alert.alert(
          'No Questions Available',
          'There are no questions available for your selection.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setQuestions(fetchedQuestions);

      // Initialize user answers
      const answersMap = new Map<string, UserAnswer>();
      fetchedQuestions.forEach((q: Question) => {
        answersMap.set(q.id, {
          questionId: q.id,
          selectedOption: null,
          isCorrect: null,
          showAnswer: false,
        });
      });
      setUserAnswers(answersMap);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = userAnswers.get(currentQuestion.id);

    if (!currentAnswer || currentAnswer.showAnswer) return;

    const isCorrect = optionIndex === currentQuestion.correct_answer;

    const updatedAnswer: UserAnswer = {
      ...currentAnswer,
      selectedOption: optionIndex,
      isCorrect: isCorrect,
      showAnswer: true, // Auto-show answer in practice mode
    };

    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion.id, updatedAnswer);
    setUserAnswers(newAnswers);
  };

  const toggleShowAnswer = () => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = userAnswers.get(currentQuestion.id);

    if (!currentAnswer) return;

    const updatedAnswer: UserAnswer = {
      ...currentAnswer,
      showAnswer: !currentAnswer.showAnswer,
    };

    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion.id, updatedAnswer);
    setUserAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const calculateStats = () => {
    let answered = 0;
    let correct = 0;

    userAnswers.forEach((answer) => {
      if (answer.selectedOption !== null) {
        answered++;
        if (answer.isCorrect) {
          correct++;
        }
      }
    });

    return {
      total: questions.length,
      answered,
      correct,
      incorrect: answered - correct,
      unanswered: questions.length - answered,
      accuracy: answered > 0 ? ((correct / answered) * 100).toFixed(1) : '0',
    };
  };

  const savePracticeHistory = async () => {
    try {
      const stats = calculateStats();
      const history = {
        timestamp: new Date().toISOString(),
        ...stats,
      };

      const existingHistory = await AsyncStorage.getItem('practiceHistory');
      const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
      historyArray.unshift(history);

      // Keep only last 10 sessions
      if (historyArray.length > 10) {
        historyArray.splice(10);
      }

      await AsyncStorage.setItem('practiceHistory', JSON.stringify(historyArray));
    } catch (error) {
      console.error('Error saving practice history:', error);
    }
  };

  const handleFinish = async () => {
    await savePracticeHistory();
    setShowSummary(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading practice session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Questions Available</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers.get(currentQuestion.id);
  const stats = calculateStats();

  // Summary Screen
  if (showSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.summaryContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            <Text style={styles.summaryTitle}>Practice Session Complete!</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardTotal]}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statCard, styles.statCardCorrect]}>
                <Text style={styles.statNumber}>{stats.correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={[styles.statCard, styles.statCardIncorrect]}>
                <Text style={styles.statNumber}>{stats.incorrect}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={[styles.statCard, styles.statCardAccuracy]}>
                <Text style={styles.statNumber}>{stats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={styles.summaryButton}
                onPress={() => setShowSummary(false)}
              >
                <Ionicons name="eye" size={20} color="#FFFFFF" />
                <Text style={styles.summaryButtonText}>Review Questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summaryButton, styles.summaryButtonSecondary]}
                onPress={() => router.back()}
              >
                <Ionicons name="add-circle" size={20} color="#007AFF" />
                <Text style={[styles.summaryButtonText, styles.summaryButtonTextSecondary]}>
                  New Session
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summaryButton, styles.summaryButtonSecondary]}
                onPress={() => router.push('/(tabs)' as any)}
              >
                <Ionicons name="home" size={20} color="#007AFF" />
                <Text style={[styles.summaryButtonText, styles.summaryButtonTextSecondary]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Practice Session Screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Practice Mode</Text>
          <Text style={styles.headerSubtitle}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statsChip}>
            <Text style={styles.statsChipText}>
              {stats.correct}/{stats.answered}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${((currentIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={[styles.difficultyBadge, styles[`difficulty${currentQuestion.difficulty}`]]}>
              <Text style={styles.difficultyText}>
                {currentQuestion.difficulty}
              </Text>
            </View>
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <View style={styles.tags}>
                {currentQuestion.tags.slice(0, 2).map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentAnswer?.selectedOption === index;
              const isCorrect = index === currentQuestion.correct_answer;
              const showResult = currentAnswer?.showAnswer;

              let optionStyle = [styles.optionButton];
              let iconName = 'ellipse-outline';
              let iconColor = '#8E8E93';

              if (showResult) {
                if (isCorrect) {
                  optionStyle.push(styles.optionButtonCorrect);
                  if (isSelected) {
                    iconName = 'checkmark-circle';
                    iconColor = '#34C759';
                  }
                } else if (isSelected && !isCorrect) {
                  optionStyle.push(styles.optionButtonIncorrect);
                  iconName = 'close-circle';
                  iconColor = '#FF3B30';
                }
              } else if (isSelected) {
                optionStyle.push(styles.optionButtonSelected);
                iconColor = '#007AFF';
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={optionStyle}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={currentAnswer?.showAnswer}
                >
                  <Ionicons name={iconName as any} size={24} color={iconColor} />
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Toggle Answer Button */}
          {!currentAnswer?.showAnswer && currentAnswer?.selectedOption !== null && (
            <TouchableOpacity
              style={styles.showAnswerButton}
              onPress={toggleShowAnswer}
            >
              <Ionicons name="eye" size={20} color="#007AFF" />
              <Text style={styles.showAnswerButtonText}>Show Correct Answer</Text>
            </TouchableOpacity>
          )}

          {/* Explanation Section */}
          {currentAnswer?.showAnswer && (
            <View style={styles.explanationSection}>
              {currentQuestion.hint && (
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeader}>
                    <Ionicons name="bulb" size={20} color="#FF9500" />
                    <Text style={styles.explanationTitle}>Hint</Text>
                  </View>
                  <Text style={styles.explanationText}>{currentQuestion.hint}</Text>
                </View>
              )}

              {currentQuestion.explanation && (
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeader}>
                    <Ionicons name="book" size={20} color="#007AFF" />
                    <Text style={styles.explanationTitle}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                </View>
              )}

              {currentQuestion.solution && (
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeader}>
                    <Ionicons name="checkmark-done" size={20} color="#34C759" />
                    <Text style={styles.explanationTitle}>Solution</Text>
                  </View>
                  <Text style={styles.explanationText}>{currentQuestion.solution}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Question Palette */}
        <View style={styles.paletteCard}>
          <Text style={styles.paletteTitle}>Question Palette</Text>
          <View style={styles.paletteGrid}>
            {questions.map((q, idx) => {
              const answer = userAnswers.get(q.id);
              let buttonStyle = [styles.paletteButton];

              if (answer?.isCorrect) {
                buttonStyle.push(styles.paletteButtonCorrect);
              } else if (answer?.selectedOption !== null && !answer?.isCorrect) {
                buttonStyle.push(styles.paletteButtonIncorrect);
              } else if (answer?.selectedOption !== null) {
                buttonStyle.push(styles.paletteButtonAnswered);
              }

              if (idx === currentIndex) {
                buttonStyle.push(styles.paletteButtonCurrent);
              }

              return (
                <TouchableOpacity
                  key={q.id}
                  style={buttonStyle}
                  onPress={() => jumpToQuestion(idx)}
                >
                  <Text style={styles.paletteButtonText}>{idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.paletteLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotCorrect]} />
              <Text style={styles.legendText}>Correct</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotIncorrect]} />
              <Text style={styles.legendText}>Incorrect</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotUnanswered]} />
              <Text style={styles.legendText}>Not Attempted</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finish Practice</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerButton: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  statsChip: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E5E7',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  questionCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyeasy: {
    backgroundColor: '#E8F5E9',
  },
  difficultymedium: {
    backgroundColor: '#FFF4E6',
  },
  difficultyhard: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#007AFF',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1D1D1F',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    gap: 12,
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionButtonCorrect: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E9',
  },
  optionButtonIncorrect: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1D1D1F',
  },
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 8,
  },
  showAnswerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  explanationSection: {
    marginTop: 20,
    gap: 12,
  },
  explanationCard: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1D1D1F',
  },
  paletteCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  paletteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paletteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  paletteButtonAnswered: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  paletteButtonCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34C759',
  },
  paletteButtonIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
  },
  paletteButtonCurrent: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  paletteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  paletteLegend: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotCorrect: {
    backgroundColor: '#34C759',
  },
  legendDotIncorrect: {
    backgroundColor: '#FF3B30',
  },
  legendDotUnanswered: {
    backgroundColor: '#F2F2F7',
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 6,
  },
  navButtonDisabled: {
    backgroundColor: '#F2F2F7',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finishButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#34C759',
    borderRadius: 8,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Summary Screen Styles
  summaryContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
    width: '100%',
  },
  statCard: {
    width: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardTotal: {
    backgroundColor: '#E3F2FD',
  },
  statCardCorrect: {
    backgroundColor: '#E8F5E9',
  },
  statCardIncorrect: {
    backgroundColor: '#FFEBEE',
  },
  statCardAccuracy: {
    backgroundColor: '#FFF4E6',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  summaryActions: {
    width: '100%',
    gap: 12,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    gap: 8,
  },
  summaryButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  summaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryButtonTextSecondary: {
    color: '#007AFF',
  },
});
