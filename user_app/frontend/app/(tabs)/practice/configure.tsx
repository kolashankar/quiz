import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// No slider needed - using buttons instead
import Constants from 'expo-constants';
import axios from 'axios';
import { useAuth } from '../../../src/context/AuthContext';

interface Exam {
  id: string;
  name: string;
  description: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
}

export default function PracticeConfigureScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState('all');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSubjects(selectedExam);
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedSubjects.length > 0) {
      fetchChapters(selectedSubjects);
    }
  }, [selectedSubjects]);

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/exams`);
      setExams(response.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (examId: string) => {
    try {
      const response = await axios.get(`${backendUrl}/api/subjects?exam_id=${examId}`);
      const fetchedSubjects = response.data || [];
      setSubjects(fetchedSubjects);
      // Auto-select all subjects
      setSelectedSubjects(fetchedSubjects.map((s: any) => s.id));
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchChapters = async (subjectIds: string[]) => {
    try {
      const allChapters: Chapter[] = [];
      for (const subjectId of subjectIds) {
        const response = await axios.get(`${backendUrl}/api/chapters?subject_id=${subjectId}`);
        allChapters.push(...(response.data || []));
      }
      setChapters(allChapters);
      // Auto-select all chapters
      setSelectedChapters(allChapters.map((c: any) => c.id));
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleStartPractice = () => {
    if (!selectedExam) return;

    router.push({
      pathname: '/(tabs)/practice/session',
      params: {
        examId: selectedExam,
        subjectIds: selectedSubjects.join(','),
        chapterIds: selectedChapters.join(','),
        questionCount: questionCount.toString(),
        difficulty,
      },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Configure Practice</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Exam</Text>
          {exams.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={[
                styles.optionCard,
                selectedExam === exam.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedExam(exam.id)}
            >
              <Ionicons
                name={selectedExam === exam.id ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedExam === exam.id ? '#007AFF' : '#8E8E93'}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{exam.name}</Text>
                <Text style={styles.optionDescription}>{exam.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedExam && subjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Subjects</Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedSubjects(
                    selectedSubjects.length === subjects.length
                      ? []
                      : subjects.map(s => s.id)
                  )
                }
              >
                <Text style={styles.toggleText}>
                  {selectedSubjects.length === subjects.length ? 'Clear All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.checkboxItem,
                  selectedSubjects.includes(subject.id) && styles.selectedCheckbox,
                ]}
                onPress={() => toggleSubject(subject.id)}
              >
                <Ionicons
                  name={
                    selectedSubjects.includes(subject.id)
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={24}
                  color={selectedSubjects.includes(subject.id) ? '#007AFF' : '#8E8E93'}
                />
                <Text style={styles.checkboxText}>{subject.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedSubjects.length > 0 && chapters.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Chapters</Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedChapters(
                    selectedChapters.length === chapters.length
                      ? []
                      : chapters.map(c => c.id)
                  )
                }
              >
                <Text style={styles.toggleText}>
                  {selectedChapters.length === chapters.length ? 'Clear All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
            {chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={[
                  styles.checkboxItem,
                  selectedChapters.includes(chapter.id) && styles.selectedCheckbox,
                ]}
                onPress={() => toggleChapter(chapter.id)}
              >
                <Ionicons
                  name={
                    selectedChapters.includes(chapter.id)
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={24}
                  color={selectedChapters.includes(chapter.id) ? '#007AFF' : '#8E8E93'}
                />
                <Text style={styles.checkboxText}>{chapter.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Questions: {questionCount}</Text>
          <View style={styles.questionCountButtons}>
            {[5, 10, 15, 20, 30, 40, 50].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countButton,
                  questionCount === count && styles.countButtonSelected,
                ]}
                onPress={() => setQuestionCount(count)}
              >
                <Text
                  style={[
                    styles.countButtonText,
                    questionCount === count && styles.countButtonTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          {['all', 'easy', 'medium', 'hard'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyCard,
                difficulty === level && styles.selectedDifficulty,
              ]}
              onPress={() => setDifficulty(level)}
            >
              <Ionicons
                name={difficulty === level ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={difficulty === level ? '#007AFF' : '#8E8E93'}
              />
              <Text style={styles.difficultyText}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !selectedExam && styles.startButtonDisabled,
          ]}
          onPress={handleStartPractice}
          disabled={!selectedExam}
        >
          <Text style={styles.startButtonText}>Start Practice Session</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
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
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  selectedCheckbox: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  checkboxText: {
    fontSize: 16,
    color: '#1D1D1F',
    marginLeft: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  selectedDifficulty: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  difficultyText: {
    fontSize: 16,
    color: '#1D1D1F',
    marginLeft: 12,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
