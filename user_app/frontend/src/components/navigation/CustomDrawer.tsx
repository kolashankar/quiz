import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function CustomDrawer({ visible, onClose }: DrawerProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showExamSwitcher, setShowExamSwitcher] = useState(false);

  const exams = [
    { id: 'upsc', name: 'UPSC Civil Services', icon: 'school' },
    { id: 'jee', name: 'JEE Main & Advanced', icon: 'calculator' },
    { id: 'neet', name: 'NEET', icon: 'medical' },
    { id: 'eapcet', name: 'EAPCET', icon: 'desktop' },
  ];

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleExamSwitch = (examId: string) => {
    // Logic to switch exam will be implemented
    setShowExamSwitcher(false);
    onClose();
    // TODO: Update user's selected exam in backend
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/');
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user?.email || 'User'}</Text>
                  <Text style={styles.userRole}>Student</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Drawer Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Exam Switcher */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowExamSwitcher(true)}
              >
                <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Switch Exam</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>

              {/* Syllabus */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/syllabus')}
              >
                <Ionicons name="book" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Exam Syllabus</Text>
              </TouchableOpacity>

              {/* Notifications */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/notifications')}
              >
                <Ionicons name="notifications" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Notifications</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Analytics */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/analytics')}
              >
                <Ionicons name="analytics" size={24} color="#007AFF" />
                <Text style={styles.menuText}>My Analytics</Text>
              </TouchableOpacity>

              {/* Practice Mode */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/practice')}
              >
                <Ionicons name="fitness" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Practice Mode</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* About Us */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/about')}
              >
                <Ionicons name="information-circle" size={24} color="#007AFF" />
                <Text style={styles.menuText}>About Us</Text>
              </TouchableOpacity>

              {/* Privacy Policy */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/privacy')}
              >
                <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Privacy Policy</Text>
              </TouchableOpacity>

              {/* Contact */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/contact')}
              >
                <Ionicons name="mail" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Contact Support</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* WhatsApp Community */}
              <TouchableOpacity
                style={[styles.menuItem, styles.whatsappItem]}
                onPress={() => {
                  Linking.openURL('https://whatsapp.com/channel/0029VaeW5Vu4WT9pTBq8eL2i');
                  onClose();
                }}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={[styles.menuText, styles.whatsappText]}>Join WhatsApp Community</Text>
              </TouchableOpacity>

              {/* Settings */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/(tabs)/settings')}
              >
                <Ionicons name="settings" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out" size={24} color="#FF3B30" />
                <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>QuizMaster v1.0.0</Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Exam Switcher Modal */}
      <Modal
        visible={showExamSwitcher}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExamSwitcher(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowExamSwitcher(false)}
        >
          <View style={styles.examSwitcherModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exam</Text>
              <TouchableOpacity onPress={() => setShowExamSwitcher(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {exams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.examItem}
                  onPress={() => handleExamSwitch(exam.id)}
                >
                  <Ionicons
                    name={exam.icon as any}
                    size={32}
                    color="#007AFF"
                  />
                  <Text style={styles.examName}>{exam.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  drawer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 16,
  },
  logoutText: {
    color: '#FF3B30',
  },
  whatsappItem: {
    backgroundColor: '#E7F8F0',
  },
  whatsappText: {
    color: '#25D366',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 8,
    backgroundColor: '#F8F8F8',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  examSwitcherModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  examName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
});
