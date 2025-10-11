import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HierarchyNavigation } from '../../types';

interface BreadcrumbProps {
  navigation: HierarchyNavigation;
  onNavigate: (level: string, item?: any) => void;
}

export const HierarchyBreadcrumb: React.FC<BreadcrumbProps> = ({
  navigation,
  onNavigate,
}) => {
  const breadcrumbItems = [
    { level: 'exam', item: navigation.exam, label: navigation.exam?.name || 'Exam' },
    { level: 'subject', item: navigation.subject, label: navigation.subject?.name },
    { level: 'chapter', item: navigation.chapter, label: navigation.chapter?.name },
    { level: 'topic', item: navigation.topic, label: navigation.topic?.name },
    { level: 'subTopic', item: navigation.subTopic, label: navigation.subTopic?.name },
    { level: 'section', item: navigation.section, label: navigation.section?.name },
    { level: 'subSection', item: navigation.subSection, label: navigation.subSection?.name },
  ].filter(item => item.item);

  return (
    <View style={styles.container}>
      {breadcrumbItems.map((breadcrumb, index) => (
        <View key={breadcrumb.level} style={styles.breadcrumbItem}>
          {index > 0 && <Ionicons name="chevron-forward" size={16} color="#8E8E93" />}
          <TouchableOpacity
            onPress={() => onNavigate(breadcrumb.level, breadcrumb.item)}
            style={styles.breadcrumbButton}
          >
            <Text
              style={[
                styles.breadcrumbText,
                index === breadcrumbItems.length - 1 && styles.currentBreadcrumb,
              ]}
            >
              {breadcrumb.label}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#007AFF',
  },
  currentBreadcrumb: {
    color: '#1D1D1F',
    fontWeight: '500',
  },
});