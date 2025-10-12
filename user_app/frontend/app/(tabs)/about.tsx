import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Quiz Master</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Quiz Master</Text>
          <Text style={styles.sectionText}>
            Quiz Master is a comprehensive quiz application designed to help students prepare for competitive exams including UPSC, JEE, NEET, EAPCET, and more.
          </Text>
          <Text style={styles.sectionText}>
            Our platform offers an extensive question bank, personalized recommendations powered by AI, detailed analytics, and practice modes to help you excel in your exams.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            <FeatureItem icon="checkmark-circle" text="8-Level Hierarchical Content Organization" />
            <FeatureItem icon="brain" text="AI-Powered Personalized Recommendations" />
            <FeatureItem icon="stats-chart" text="Detailed Performance Analytics" />
            <FeatureItem icon="trophy" text="Leaderboard & Competitive Mode" />
            <FeatureItem icon="bookmark" text="Bookmark Important Questions" />
            <FeatureItem icon="time" text="Timed & Practice Modes" />
            <FeatureItem icon="trending-up" text="Track Your Progress Over Time" />
            <FeatureItem icon="notifications" text="Get Notified About New Content" />
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            We are committed to making quality education accessible to everyone. Our mission is to empower students with the tools and resources they need to succeed in their academic journey.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <TouchableOpacity style={styles.contactButton} onPress={() => openLink('mailto:support@quizmaster.com')}>
            <Ionicons name="mail" size={20} color="#007AFF" />
            <Text style={styles.contactButtonText}>support@quizmaster.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={() => openLink('https://quizmaster.com')}>
            <Ionicons name="globe" size={20} color="#007AFF" />
            <Text style={styles.contactButtonText}>www.quizmaster.com</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Quiz Master. All rights reserved.</Text>
          <Text style={styles.footerText}>Made with ❤️ for students everywhere</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color="#34C759" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#1D1D1F',
    lineHeight: 24,
    marginBottom: 12,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#1D1D1F',
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
});
