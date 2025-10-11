import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number;
  onAnswerSelect: (index: number) => void;
  onBookmark: () => void;
  isBookmarked: boolean;
  showSolution?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onBookmark,
  isBookmarked,
  showSolution = false,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#34C759';
      case 'medium':
        return '#FF9500';
      case 'hard':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getDifficultyBackgroundColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#E8F5E8';
      case 'medium':
        return '#FFF4E6';
      case 'hard':
        return '#FFEBEE';
      default:
        return '#F0F0F0';
    }
  };

  return (
    <Card style={styles.questionCard}>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <View style={styles.questionMeta}>
          <Text style={styles.questionNumber}>
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyBackgroundColor(question.difficulty) },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(question.difficulty) },
              ]}
            >
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onBookmark} style={styles.bookmarkButton}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#FF9500' : '#8E8E93'}
          />
        </TouchableOpacity>
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.question_text}</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = showSolution && index === question.correct_answer;
          const isWrong = showSolution && isSelected && !isCorrect;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.selectedOption,
                isCorrect && styles.correctOption,
                isWrong && styles.wrongOption,
              ]}
              onPress={() => !showSolution && onAnswerSelect(index)}
              disabled={showSolution}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionCircle,
                    isSelected && styles.selectedCircle,
                    isCorrect && styles.correctCircle,
                    isWrong && styles.wrongCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      (isSelected || isCorrect) && styles.selectedLabel,
                    ]}
                  >
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText,
                    isCorrect && styles.correctOptionText,
                  ]}
                >
                  {option}
                </Text>
                {showSolution && isCorrect && (
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                )}
                {showSolution && isWrong && (
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tags */}
      {question.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>Tags:</Text>
          <View style={styles.tags}>
            {question.tags.slice(0, 4).map((tag, index) => (
              <Text key={index} style={styles.tag}>
                {tag}
              </Text>
            ))}
            {question.tags.length > 4 && (
              <Text style={styles.tag}>+{question.tags.length - 4}</Text>
            )}
          </View>
        </View>
      )}

      {/* Explanation (shown in solution mode) */}
      {showSolution && question.explanation && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationHeader}>
            <Ionicons name="bulb" size={18} color="#007AFF" />
            <Text style={styles.explanationTitle}>Explanation</Text>
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#1D1D1F',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  correctOption: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E8',
  },
  wrongOption: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFEBEE',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedCircle: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  correctCircle: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  wrongCircle: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B30',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: '#1D1D1F',
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#007AFF',
  },
  correctOptionText: {
    color: '#34C759',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
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
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20,
  },
});