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
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from '../../src/context/AuthContext';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/analytics/difficulty-breakdown`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportResults = async () => {
    try {
      // Create CSV content
      let csvContent = 'Difficulty,Correct,Total,Percentage\n';
      analytics?.breakdown?.forEach((item: any) => {
        csvContent += `${item.difficulty},${item.correct},${item.total},${item.percentage}%\n`;
      });

      // Save to file
      const fileUri = (documentDirectory || '') + 'analytics_export.csv';
      await writeAsStringAsync(fileUri, csvContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Analytics exported successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Analytics</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportResults}>
          <Ionicons name="download" size={20} color="#FFFFFF" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'overview' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'subjects' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('subjects')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'subjects' && styles.activeTabText,
            ]}
          >
            By Subject
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'chapters' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('chapters')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'chapters' && styles.activeTabText,
            ]}
          >
            By Chapter
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'overview' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Difficulty Breakdown</Text>
          {analytics?.breakdown?.map((item: any, index: number) => (
            <View key={index} style={styles.difficultyCard}>
              <View style={styles.difficultyHeader}>
                <Text style={styles.difficultyName}>
                  {item.difficulty.toUpperCase()}
                </Text>
                <Text style={styles.percentage}>{item.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.percentage}%` },
                    item.difficulty === 'easy' && styles.easyColor,
                    item.difficulty === 'medium' && styles.mediumColor,
                    item.difficulty === 'hard' && styles.hardColor,
                  ]}
                />
              </View>
              <Text style={styles.stats}>
                {item.correct} / {item.total} questions
              </Text>
            </View>
          ))}
        </View>
      )}

      {selectedTab === 'subjects' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
          <View style={styles.comingSoon}>
            <Ionicons name="construct" size={48} color="#8E8E93" />
            <Text style={styles.comingSoonText}>
              Subject analytics coming soon!
            </Text>
          </View>
        </View>
      )}

      {selectedTab === 'chapters' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Chapter-wise Performance</Text>
          <View style={styles.comingSoon}>
            <Ionicons name="construct" size={48} color="#8E8E93" />
            <Text style={styles.comingSoonText}>
              Chapter analytics coming soon!
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exportText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  difficultyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  percentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
    borderRadius: 4,
  },
  easyColor: {
    backgroundColor: '#34C759',
  },
  mediumColor: {
    backgroundColor: '#FF9500',
  },
  hardColor: {
    backgroundColor: '#FF3B30',
  },
  stats: {
    fontSize: 14,
    color: '#8E8E93',
  },
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
});