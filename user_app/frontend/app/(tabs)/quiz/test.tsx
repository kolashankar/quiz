import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, Loading, Button } from '../../../src/components/common';
import { TimerDisplay } from '../../../src/components/quiz/TimerDisplay';
import { QuestionCard } from '../../../src/components/quiz/QuestionCard';
import { quizService } from '../../../src/services/api/quiz';
import { useTimer } from '../../../src/hooks/useTimer';
import { Question } from '../../../src/types';

export default function TestScreen() {
  const params = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  
  // NEW: Track question status for navigation bar
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  
  // Enhanced timer with 30 minutes (1800 seconds)
  const timer = useTimer({
    initialTime: 30 * 60,
    onTimeUp: handleTimeUp,
    autoStart: false,
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle app state changes to pause/resume timer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      timer.pause();
      setIsPaused(true);
    } else if (nextAppState === 'active' && isPaused) {
      // Show resume dialog when app becomes active
      Alert.alert(
        'Resume Test',
        'Would you like to resume your test?',
        [
          { text: 'Exit Test', onPress: handleExitTest, style: 'destructive' },
          { text: 'Resume', onPress: handleResumeTest },
        ]
      );
    }
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Time\'s Up!',
      'Your test time has expired. The test will be automatically submitted.',
      [{ text: 'OK', onPress: submitTest }]
    );
  };

  const handleResumeTest = () => {
    timer.resume();
    setIsPaused(false);
  };

  const handleExitTest = () => {
    Alert.alert(
      'Exit Test',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const fetchQuestions = async () => {
    try {
      const questionParams: any = {};
      
      if (params.topicId) {
        questionParams.topic_id = params.topicId;
      }
      
      // Default to 10 questions for a test
      questionParams.limit = 10;
      
      const questionList = await quizService.getQuestions(questionParams);
      
      if (questionList.length === 0) {
        Alert.alert(
          'No Questions Available',
          'There are no questions available for this selection. Please try another topic.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      setQuestions(questionList);
      setAnswers(new Array(questionList.length).fill(-1));
      
      // Start timer after questions are loaded
      timer.start();
      
      // Fetch existing bookmarks
      fetchBookmarks();
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
      router.back();
    }
  };

  const fetchBookmarks = async () => {
    try {
      const bookmarks = await quizService.getBookmarks();
      const bookmarkIds = new Set(bookmarks.map(b => b.question_id));
      setBookmarked(bookmarkIds);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleBookmark = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    try {
      if (bookmarked.has(currentQuestion.id)) {
        // Remove bookmark logic would go here
        const newBookmarked = new Set(bookmarked);
        newBookmarked.delete(currentQuestion.id);
        setBookmarked(newBookmarked);
      } else {
        await quizService.createBookmark(currentQuestion.id);
        const newBookmarked = new Set(bookmarked);
        newBookmarked.add(currentQuestion.id);
        setBookmarked(newBookmarked);
      }
    } catch (error) {
      console.error('Error bookmarking question:', error);
    }
  };

  const handleSubmitTest = async () => {
    if (answers.includes(-1)) {
      Alert.alert(
        'Incomplete Test',
        'You have unanswered questions. Do you want to submit anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitTest },
        ]
      );
    } else {
      submitTest();
    }
  };

  const submitTest = async () => {
    setSubmitting(true);
    try {
      const submission = {
        question_ids: questions.map(q => q.id),
        answers: answers,
      };
      
      const result = await quizService.submitTest(submission);
      
      router.replace({
        pathname: '/(tabs)/quiz/result',
        params: {
          resultId: result.id,
          score: result.score.toString(),
          totalQuestions: result.total_questions.toString(),
          correctAnswers: result.correct_answers.toString(),
          percentile: result.percentile.toString(),
        },
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      Alert.alert('Error', 'Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchQuestions().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading text="Loading quiz..." />;
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Questions Available</Text>
          <Text style={styles.emptySubtitle}>
            There are no questions available for this selection.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleExitTest} style={styles.exitButton}>
            <Ionicons name="close" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <TimerDisplay
            timeLeft={timer.timeLeft}
            isRunning={timer.isRunning}
            onPause={timer.pause}
            onResume={timer.resume}
            formatTime={timer.formatTime}
            getTimeStatus={timer.getTimeStatus}
          />
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseContent}>
            <Ionicons name="pause-circle" size={64} color="#007AFF" />
            <Text style={styles.pauseTitle}>Test Paused</Text>
            <Text style={styles.pauseSubtitle}>Tap resume to continue your test</Text>
            <View style={styles.pauseButtons}>
              <Button
                title="Resume Test"
                onPress={handleResumeTest}
                style={styles.resumeButton}
              />
              <Button
                title="Exit Test"
                onPress={handleExitTest}
                variant="outline"
                style={styles.exitTestButton}
              />
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <QuestionCard
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
          onBookmark={handleBookmark}
          isBookmarked={bookmarked.has(currentQuestion.id)}
        />

        {/* Navigation Indicators */}
        <Card style={styles.navigationCard}>
          <Text style={styles.navigationTitle}>Question Overview</Text>
          <View style={styles.questionGrid}>
            {questions.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.questionGridItem,
                  index === currentQuestionIndex && styles.currentQuestion,
                  answers[index] !== -1 && styles.answeredQuestion,
                  bookmarked.has(questions[index].id) && styles.bookmarkedQuestion,
                ]}
                onPress={() => setCurrentQuestionIndex(index)}
              >
                <Text
                  style={[
                    styles.questionGridText,
                    index === currentQuestionIndex && styles.currentQuestionText,
                    answers[index] !== -1 && styles.answeredQuestionText,
                  ]}
                >
                  {index + 1}
                </Text>
                {bookmarked.has(questions[index].id) && (
                  <Ionicons name="bookmark" size={12} color="#FF9500" style={styles.gridBookmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.currentQuestion]} />
              <Text style={styles.legendText}>Current</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.answeredQuestion]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="bookmark" size={12} color="#FF9500" />
              <Text style={styles.legendText}>Bookmarked</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Enhanced Navigation */}
      <View style={styles.navigation}>
        <View style={styles.navSection}>
          <Button
            title="Previous"
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            size="small"
          />
          <Button
            title={timer.isRunning ? "Pause" : "Resume"}
            onPress={timer.isRunning ? timer.pause : timer.resume}
            variant="outline"
            size="small"
            style={styles.pauseBtn}
          />
        </View>
        
        <View style={styles.navCenter}>
          <Text style={styles.questionIndicator}>
            {answers.filter(a => a !== -1).length} / {questions.length} answered
          </Text>
          <View style={styles.progressIndicator}>
            <View style={styles.progressDots}>
              {Array.from({ length: Math.min(questions.length, 10) }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index < currentQuestionIndex && styles.completedDot,
                    index === currentQuestionIndex && styles.currentDot,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.navSection}>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              title={submitting ? "Submitting..." : "Submit Test"}
              onPress={handleSubmitTest}
              disabled={submitting || !timer.isRunning}
              size="small"
              style={styles.submitBtn}
            />
          ) : (
            <Button
              title="Next"
              onPress={handleNext}
              size="small"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    minHeight: 80,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  exitButton: {
    padding: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    width: 60,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pauseContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    margin: 32,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
  },
  pauseSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  pauseButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeButton: {
    flex: 1,
  },
  exitTestButton: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  bookmarkButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 18,
    color: '#1D1D1F',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 12,
    minWidth: 20,
  },
  optionText: {
    fontSize: 16,
    color: '#1D1D1F',
    flex: 1,
  },
  selectedOptionText: {
    color: '#007AFF',
  },
  metaCard: {
    marginBottom: 16,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  difficulty: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyeasy: {
    backgroundColor: '#E8F5E8',
    color: '#34C759',
  },
  difficultymedium: {
    backgroundColor: '#FFF4E6',
    color: '#FF9500',
  },
  difficultyhard: {
    backgroundColor: '#FFEBEE',
    color: '#FF3B30',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tagsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  questionIndicator: {
    fontSize: 14,
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
});