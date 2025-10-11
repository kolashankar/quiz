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
import { router, useLocalSearchParams } from 'expo-router';
import { Card, Loading, Button } from '../../../src/components/common';
import { HierarchyBreadcrumb } from '../../../src/components/quiz/HierarchyBreadcrumb';
import { quizService } from '../../../src/services/api/quiz';
import { HierarchyNavigation } from '../../../src/types';

export default function HierarchyScreen() {
  const params = useLocalSearchParams();
  const [navigation, setNavigation] = useState<HierarchyNavigation>({});
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentLevel = params.level as string;

  const levelConfig = {
    subject: {
      title: 'Select Subject',
      subtitle: 'Choose a subject to practice',
      icon: 'book',
      nextLevel: 'chapter',
      fetchFunction: () => quizService.getSubjects(params.examId as string),
    },
    chapter: {
      title: 'Select Chapter',
      subtitle: 'Choose a chapter to practice',
      icon: 'document-text',
      nextLevel: 'topic',
      fetchFunction: () => quizService.getChapters(params.subjectId as string),
    },
    topic: {
      title: 'Select Topic',
      subtitle: 'Choose a topic to practice',
      icon: 'library',
      nextLevel: 'subTopic',
      fetchFunction: () => quizService.getTopics(params.chapterId as string),
    },
    subTopic: {
      title: 'Select Sub-Topic',
      subtitle: 'Choose a sub-topic to practice',
      icon: 'list',
      nextLevel: 'section',
      fetchFunction: () => quizService.getSubTopics(params.topicId as string),
    },
    section: {
      title: 'Select Section',
      subtitle: 'Choose a section to practice',
      icon: 'folder',
      nextLevel: 'subSection',
      fetchFunction: () => quizService.getSections(params.subTopicId as string),
    },
    subSection: {
      title: 'Select Sub-Section',
      subtitle: 'Choose a sub-section to practice',
      icon: 'folder-open',
      nextLevel: 'questions',
      fetchFunction: () => quizService.getSubSections(params.sectionId as string),
    },
  };

  useEffect(() => {
    buildNavigation();
    fetchItems();
  }, [params]);

  const buildNavigation = () => {
    const nav: HierarchyNavigation = {};
    
    if (params.examId) {
      nav.exam = { id: params.examId as string, name: params.examName as string };
    }
    if (params.subjectId) {
      nav.subject = { id: params.subjectId as string, name: params.subjectName as string };
    }
    if (params.chapterId) {
      nav.chapter = { id: params.chapterId as string, name: params.chapterName as string };
    }
    if (params.topicId) {
      nav.topic = { id: params.topicId as string, name: params.topicName as string };
    }
    if (params.subTopicId) {
      nav.subTopic = { id: params.subTopicId as string, name: params.subTopicName as string };
    }
    if (params.sectionId) {
      nav.section = { id: params.sectionId as string, name: params.sectionName as string };
    }
    if (params.subSectionId) {
      nav.subSection = { id: params.subSectionId as string, name: params.subSectionName as string };
    }

    setNavigation(nav);
  };

  const fetchItems = async () => {
    try {
      const config = levelConfig[currentLevel as keyof typeof levelConfig];
      if (config) {
        const data = await config.fetchFunction();
        setItems(data);
      }
    } catch (error) {
      console.error(`Error fetching ${currentLevel}:`, error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const handleItemSelect = (item: any) => {
    const config = levelConfig[currentLevel as keyof typeof levelConfig];
    
    if (config.nextLevel === 'questions') {
      // Navigate to test screen with questions
      router.push({
        pathname: '/(tabs)/quiz/test',
        params: {
          ...params,
          subSectionId: item.id,
          subSectionName: item.name,
        },
      });
    } else {
      // Navigate to next level
      const nextParams = {
        ...params,
        level: config.nextLevel,
        [`${currentLevel}Id`]: item.id,
        [`${currentLevel}Name`]: item.name,
      };
      
      router.push({
        pathname: '/(tabs)/quiz/hierarchy',
        params: nextParams,
      });
    }
  };

  const handleBreadcrumbNavigation = (level: string, item?: any) => {
    if (level === 'exam') {
      router.push('/(tabs)/quiz');
    } else {
      const levelMap: { [key: string]: string } = {
        subject: 'subject',
        chapter: 'topic', 
        topic: 'subTopic',
        subTopic: 'section',
        section: 'subSection',
      };
      
      router.push({
        pathname: '/(tabs)/quiz/hierarchy',
        params: {
          ...params,
          level: levelMap[level],
        },
      });
    }
  };

  const handleStartQuiz = () => {
    // Get questions from current topic/level and start quiz
    const topicId = params.topicId || navigation.topic?.id;
    if (topicId) {
      router.push({
        pathname: '/(tabs)/quiz/test',
        params: {
          topicId,
          mode: 'topic',
        },
      });
    }
  };

  useEffect(() => {
    fetchItems().finally(() => setLoading(false));
  }, [currentLevel]);

  if (loading) {
    return <Loading text={`Loading ${currentLevel}s...`} />;
  }

  const config = levelConfig[currentLevel as keyof typeof levelConfig];

  return (
    <SafeAreaView style={styles.container}>
      <HierarchyBreadcrumb navigation={navigation} onNavigate={handleBreadcrumbNavigation} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{config?.title}</Text>
          <Text style={styles.subtitle}>{config?.subtitle}</Text>
        </View>

        {/* Quick Start Button - Available from Topic level onwards */}
        {(currentLevel === 'topic' || ['subTopic', 'section', 'subSection'].includes(currentLevel)) && (
          <Card style={styles.quickStartCard}>
            <View style={styles.quickStartContent}>
              <Ionicons name="flash" size={24} color="#34C759" />
              <Text style={styles.quickStartTitle}>Quick Start</Text>
              <Text style={styles.quickStartSubtitle}>
                Start a quiz with all available questions from this level
              </Text>
            </View>
            <Button
              title="Start Quiz"
              onPress={handleStartQuiz}
              variant="secondary"
              size="small"
            />
          </Card>
        )}

        {items.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <TouchableOpacity
              style={styles.itemTouchable}
              onPress={() => handleItemSelect(item)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemIcon}>
                  <Ionicons name={config?.icon as any} size={24} color="#007AFF" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </Card>
        ))}

        {items.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="folder-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No {config?.title?.split(' ')[1]}s Available</Text>
              <Text style={styles.emptySubtitle}>
                Content will appear here once it's added to the system.
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
  quickStartCard: {
    marginBottom: 16,
    backgroundColor: '#F0FFF4',
    borderColor: '#34C759',
    borderWidth: 1,
  },
  quickStartContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 8,
  },
  quickStartSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    marginBottom: 12,
    padding: 0,
  },
  itemTouchable: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  itemDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
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