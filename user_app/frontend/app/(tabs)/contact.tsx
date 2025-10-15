import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// EmailJS Configuration (Update with your EmailJS credentials)
const EMAILJS_SERVICE_ID = 'service_xxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxx';
const EMAILJS_PUBLIC_KEY = 'xxxxxxxxxxxxxxxxxxx';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email using EmailJS REST API
      const templateParams = {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message,
        to_name: 'Quiz App Support Team',
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your message has been sent! We\'ll get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                setName('');
                setEmail('');
                setSubject('');
                setMessage('');
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again or contact us directly at support@genuis.com'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="chatbubbles" size={48} color="#007AFF" />
          <Text style={styles.infoTitle}>Get in Touch</Text>
          <Text style={styles.infoText}>
            Have questions or feedback? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </Text>
        </View>

        {/* Quick Contact Options */}
        <View style={styles.quickContactSection}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => openLink('mailto:support@quizmaster.com')}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@quizmaster.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => openLink('tel:+1234567890')}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#34C759' }]}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+1 (234) 567-8900</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => openLink('https://quizmaster.com')}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="globe" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.quizmaster.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => openLink('https://twitter.com/quizmaster')}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#5856D6' }]}>
              <Ionicons name="logo-twitter" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Social Media</Text>
              <Text style={styles.contactValue}>@quizmaster</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="What is this about?"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Your message..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Office Hours */}
        <View style={styles.hoursSection}>
          <Text style={styles.sectionTitle}>Office Hours</Text>
          <View style={styles.hoursCard}>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Monday - Friday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Saturday</Text>
              <Text style={styles.hoursTime}>10:00 AM - 4:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sunday</Text>
              <Text style={styles.hoursTime}>Closed</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
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
  scrollView: {
    flex: 1,
  },
  infoSection: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickContactSection: {
    padding: 16,
    backgroundColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  formSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1D1D1F',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hoursSection: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    marginTop: 16,
  },
  hoursCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  hoursDay: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  hoursTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
