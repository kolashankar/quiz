import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Last Updated */}
        <View style={styles.updateSection}>
          <Text style={styles.updateText}>Last Updated: January 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionText}>
            Welcome to Quiz Master. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data and tell you about your privacy rights.
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            We collect the following types of information:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Account Information: Email address, name, and password" />
            <BulletPoint text="Profile Data: Avatar, preferences, and settings" />
            <BulletPoint text="Usage Data: Quiz attempts, scores, time spent, and performance metrics" />
            <BulletPoint text="Device Information: Device type, OS version, and app version" />
            <BulletPoint text="Analytics Data: App usage patterns and feature interactions" />
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use your information to:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Provide and maintain our services" />
            <BulletPoint text="Personalize your learning experience with AI recommendations" />
            <BulletPoint text="Track your progress and generate performance analytics" />
            <BulletPoint text="Send you notifications about new content and updates" />
            <BulletPoint text="Improve our app and develop new features" />
            <BulletPoint text="Ensure security and prevent fraud" />
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate security measures to protect your personal data:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Data is encrypted during transmission and at rest" />
            <BulletPoint text="Passwords are securely hashed and never stored in plain text" />
            <BulletPoint text="Access to personal data is restricted to authorized personnel only" />
            <BulletPoint text="Regular security audits and updates are performed" />
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.sectionText}>
            We do not sell your personal data. We may share your data with:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="AI Service Providers: For generating personalized recommendations (anonymized)" />
            <BulletPoint text="Analytics Providers: For app performance monitoring (anonymized)" />
            <BulletPoint text="Legal Authorities: When required by law" />
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Access your personal data" />
            <BulletPoint text="Correct inaccurate data" />
            <BulletPoint text="Request deletion of your data" />
            <BulletPoint text="Export your data" />
            <BulletPoint text="Opt-out of marketing communications" />
            <BulletPoint text="Withdraw consent at any time" />
          </View>
        </View>

        {/* Section 6 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
          <Text style={styles.sectionText}>
            We use cookies and similar tracking technologies to improve your experience. You can control cookie preferences in your device settings.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Our service is intended for users aged 13 and above. We do not knowingly collect data from children under 13. If you believe we have collected data from a child, please contact us immediately.
          </Text>
        </View>

        {/* Section 8 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color="#007AFF" />
              <Text style={styles.contactText}>privacy@quizmaster.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="globe" size={20} color="#007AFF" />
              <Text style={styles.contactText}>www.quizmaster.com/privacy</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletItem}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
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
  updateSection: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
  },
  updateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#1D1D1F',
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 8,
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#1D1D1F',
    lineHeight: 22,
  },
  contactInfo: {
    marginTop: 12,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
