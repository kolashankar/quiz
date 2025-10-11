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
import { Card, Loading } from '../../src/components/common';
import { quizService } from '../../src/services/api/quiz';
import { Bookmark, Question } from '../../src/types';

interface BookmarkWithQuestion extends Bookmark {
  question?: Question;
}

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookmarks = async () => {
    try {
      const bookmarkList = await quizService.getBookmarks();
      
      // Fetch question details for each bookmark
      const bookmarksWithQuestions = await Promise.all(
        bookmarkList.map(async (bookmark) => {
          try {
            // Since we don't have a direct endpoint to get a single question,
            // we'll fetch all questions and find the matching one
            const questions = await quizService.getQuestions();
            const question = questions.find(q => q.id === bookmark.question_id);
            return { ...bookmark, question };
          } catch (error) {
            return bookmark;
          }
        })
      );
      
      setBookmarks(bookmarksWithQuestions);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  useEffect(() => {
    fetchBookmarks().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await quizService.deleteBookmark(bookmarkId);
              setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert('Error', 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading text="Loading bookmarks..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Bookmarks</Text>
          <Text style={styles.subtitle}>
            {bookmarks.length} question{bookmarks.length !== 1 ? 's' : ''} saved for later
          </Text>
        </View>

        {bookmarks.map((bookmark) => (
          <Card key={bookmark.id} style={styles.bookmarkCard}>
            <View style={styles.bookmarkHeader}>
              <View style={styles.bookmarkIcon}>
                <Ionicons name="bookmark" size={20} color="#FF9500" />
              </View>
              <View style={styles.bookmarkInfo}>
                <Text style={styles.bookmarkDate}>
                  Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveBookmark(bookmark.id)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            {bookmark.question ? (
              <View style={styles.questionContent}>
                <Text style={styles.questionText}>
                  {bookmark.question.question_text}
                </Text>

                <View style={styles.optionsContainer}>
                  {bookmark.question.options.map((option, index) => (
                    <View
                      key={index}
                      style={[
                        styles.optionItem,
                        index === bookmark.question!.correct_answer && styles.correctOption,
                      ]}
                    >
                      <Text style={styles.optionLabel}>
                        {String.fromCharCode(65 + index)}.
                      </Text>
                      <Text style={styles.optionText}>{option}</Text>
                      {index === bookmark.question!.correct_answer && (
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.questionMeta}>
                  <View style={styles.difficultyContainer}>
                    <Text style={styles.difficultyLabel}>Difficulty:</Text>
                    <Text
                      style={[
                        styles.difficulty,
                        styles[`difficulty${bookmark.question.difficulty}`],
                      ]}
                    >
                      {bookmark.question.difficulty.charAt(0).toUpperCase() +
                        bookmark.question.difficulty.slice(1)}
                    </Text>
                  </View>

                  {bookmark.question.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {bookmark.question.tags.slice(0, 3).map((tag, index) => (
                        <Text key={index} style={styles.tag}>
                          {tag}
                        </Text>
                      ))}
                      {bookmark.question.tags.length > 3 && (
                        <Text style={styles.tag}>+{bookmark.question.tags.length - 3}</Text>
                      )}
                    </View>
                  )}
                </View>

                {bookmark.question.explanation && (
                  <View style={styles.explanationContainer}>
                    <Text style={styles.explanationTitle}>Explanation:</Text>
                    <Text style={styles.explanationText}>
                      {bookmark.question.explanation}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.questionUnavailable}>
                <Ionicons name="alert-circle-outline" size={24} color="#FF9500" />
                <Text style={styles.unavailableText}>
                  Question details unavailable
                </Text>
              </View>
            )}
          </Card>
        ))}

        {bookmarks.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="bookmark-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
              <Text style={styles.emptySubtitle}>
                Questions you bookmark during tests will appear here for quick reference.
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => {
                  // Navigate to quiz
                }}
              >
                <Text style={styles.emptyActionText}>Start Taking Quizzes</Text>
              </TouchableOpacity>
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
  bookmarkCard: {
    marginBottom: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookmarkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 8,
  },
  questionContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  questionText: {
    fontSize: 16,
    color: '#1D1D1F',
    lineHeight: 22,
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
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
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
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
  questionUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  unavailableText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
  },
  emptyCard: {
    marginTop: 48,
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
    marginBottom: 24,
  },
  emptyAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});