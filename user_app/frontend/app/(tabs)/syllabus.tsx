import React, { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';

interface HierarchyItem {
  id: string;
  name: string;
  description?: string;
  children?: HierarchyItem[];
  type: 'exam' | 'subject' | 'chapter' | 'topic' | 'subtopic' | 'section' | 'subsection';
}

export default function SyllabusScreen() {
  const [syllabus, setSyllabus] = useState<HierarchyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      // Fetch all exams first
      const examsResponse = await axios.get(`${backendUrl}/api/exams`);
      const exams = examsResponse.data;

      // Build hierarchy
      const hierarchy: HierarchyItem[] = [];
      
      for (const exam of exams) {
        const examItem: HierarchyItem = {
          id: exam.id || exam._id,
          name: exam.name,
          description: exam.description,
          type: 'exam',
          children: [],
        };

        // Fetch subjects for this exam
        try {
          const subjectsResponse = await axios.get(`${backendUrl}/api/subjects?exam_id=${examItem.id}`);
          const subjects = subjectsResponse.data;

          for (const subject of subjects) {
            const subjectItem: HierarchyItem = {
              id: subject.id || subject._id,
              name: subject.name,
              description: subject.description,
              type: 'subject',
              children: [],
            };

            // Fetch chapters for this subject
            try {
              const chaptersResponse = await axios.get(`${backendUrl}/api/chapters?subject_id=${subjectItem.id}`);
              const chapters = chaptersResponse.data;

              for (const chapter of chapters) {
                const chapterItem: HierarchyItem = {
                  id: chapter.id || chapter._id,
                  name: chapter.name,
                  description: chapter.description,
                  type: 'chapter',
                  children: [],
                };

                // Fetch topics for this chapter
                try {
                  const topicsResponse = await axios.get(`${backendUrl}/api/topics?chapter_id=${chapterItem.id}`);
                  const topics = topicsResponse.data;

                  for (const topic of topics) {
                    chapterItem.children?.push({
                      id: topic.id || topic._id,
                      name: topic.name,
                      description: topic.description,
                      type: 'topic',
                    });
                  }
                } catch (error) {
                  console.error('Error fetching topics:', error);
                }

                subjectItem.children?.push(chapterItem);
              }
            } catch (error) {
              console.error('Error fetching chapters:', error);
            }

            examItem.children?.push(subjectItem);
          }
        } catch (error) {
          console.error('Error fetching subjects:', error);
        }

        hierarchy.push(examItem);
      }

      setSyllabus(hierarchy);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      Alert.alert('Error', 'Failed to load syllabus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderHierarchyItem = (item: HierarchyItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const iconName = getIconForType(item.type);
    const iconColor = getColorForType(item.type);

    return (
      <View key={item.id} style={[styles.hierarchyItem, { paddingLeft: level * 20 }]}>
        <TouchableOpacity
          style={styles.itemHeader}
          onPress={() => hasChildren && toggleExpand(item.id)}
          disabled={!hasChildren}
        >
          <View style={styles.itemLeft}>
            <Ionicons name={iconName} size={20} color={iconColor} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          {hasChildren && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#8E8E93"
            />
          )}
        </TouchableOpacity>

        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {item.children?.map(child => renderHierarchyItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const getIconForType = (type: string): any => {
    const icons: Record<string, any> = {
      exam: 'school',
      subject: 'book',
      chapter: 'folder',
      topic: 'list',
      subtopic: 'document',
      section: 'albums',
      subsection: 'reader',
    };
    return icons[type] || 'document-text';
  };

  const getColorForType = (type: string): string => {
    const colors: Record<string, string> = {
      exam: '#007AFF',
      subject: '#34C759',
      chapter: '#FF9500',
      topic: '#5856D6',
      subtopic: '#FF2D55',
      section: '#AF52DE',
      subsection: '#FF3B30',
    };
    return colors[type] || '#8E8E93';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Syllabus...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Syllabus</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <Text style={styles.infoText}>
          Explore the complete syllabus structure. Tap on any section to expand and view details.
        </Text>
      </View>

      {/* Syllabus Content */}
      <ScrollView style={styles.scrollView}>
        {syllabus.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Syllabus Available</Text>
            <Text style={styles.emptySubtitle}>
              The syllabus content will be available soon.
            </Text>
          </View>
        ) : (
          syllabus.map(item => renderHierarchyItem(item))
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerRight: {
    width: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  hierarchyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  childrenContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
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
    paddingVertical: 48,
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
  },
});
