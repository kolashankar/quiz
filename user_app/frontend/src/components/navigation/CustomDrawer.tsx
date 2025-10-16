import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { apiClient } from '../../services/api/client';
import { authService } from '../../services/api/auth';

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface ExamItem {
  _id: string;
  id?: string;
  name: string;
  description?: string;
}

export default function CustomDrawer({ visible, onClose }: DrawerProps) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, actualTheme, colors, toggleTheme } = useTheme();
  const router = useRouter();
  const [showExamSwitcher, setShowExamSwitcher] = useState(false);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [switchingExam, setSwitchingExam] = useState(false);
  
  const styles = createStyles(colors);

  useEffect(() => {
    if (showExamSwitcher && exams.length === 0) {
      fetchExams();
    }
  }, [showExamSwitcher]);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const response = await apiClient.get('/api/exams');
      setExams(response.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleExamSwitch = async (examId: string) => {
    setSwitchingExam(true);
    try {
      await authService.selectExam(examId);
      await authService.getCurrentUser();
      setShowExamSwitcher(false);
      onClose();
    } catch (error) {
      console.error('Error switching exam:', error);
    } finally {
      setSwitchingExam(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/');
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={[styles.drawer, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
              <View style={styles.headerContent}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || user?.email || 'User'}
                  </Text>
                  <Text style={styles.userRole} numberOfLines={1}>
                    {user?.selected_exam_name || 'No Exam Selected'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowExamSwitcher(true)}>
                <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Switch Exam</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => handleNavigation('/(tabs)/syllabus')}>
                <Ionicons name="book" size={24} color={colors.primary} />
                <Text style={[styles.menuText, { color: colors.text }]}>Exam Syllabus</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/notifications')}>
                <Ionicons name="notifications" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Notifications</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/analytics')}>
                <Ionicons name="analytics" size={24} color="#007AFF" />
                <Text style={styles.menuText}>My Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/practice')}>
                <Ionicons name="fitness" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Practice Mode</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/about')}>
                <Ionicons name="information-circle" size={24} color="#007AFF" />
                <Text style={styles.menuText}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/privacy')}>
                <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Privacy Policy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/contact')}>
                <Ionicons name="mail" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Contact Support</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                <Ionicons name={theme === 'light' ? 'sunny' : theme === 'dark' ? 'moon' : 'contrast'} size={24} color="#007AFF" />
                <Text style={styles.menuText}>
                  Theme: {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}
                </Text>
                <View style={styles.themeIndicator}>
                  <Text style={styles.themeIndicatorText}>{actualTheme === 'dark' ? '🌙' : '☀️'}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, styles.whatsappItem]} onPress={() => { Linking.openURL('https://whatsapp.com/channel/0029VaeW5Vu4WT9pTBq8eL2i'); onClose(); }}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={[styles.menuText, styles.whatsappText]}>Join WhatsApp Community</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/(tabs)/settings')}>
                <Ionicons name="settings" size={24} color="#007AFF" />
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>

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

      <Modal visible={showExamSwitcher} animationType="slide" transparent onRequestClose={() => setShowExamSwitcher(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !switchingExam && setShowExamSwitcher(false)}>
          <View style={styles.examSwitcherModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exam</Text>
              <TouchableOpacity onPress={() => setShowExamSwitcher(false)} disabled={switchingExam}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {loadingExams ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading exams...</Text>
              </View>
            ) : (
              <ScrollView style={styles.examList} showsVerticalScrollIndicator={true}>
                {exams.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>No exams available</Text>
                  </View>
                ) : (
                  exams.map((exam) => {
                    const examId = exam._id || exam.id || '';
                    const isSelected = user?.selected_exam_id === examId;
                    return (
                      <TouchableOpacity
                        key={examId}
                        style={[styles.examItem, isSelected && styles.selectedExamItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleExamSwitch(examId)}
                        disabled={switchingExam || isSelected}
                      >
                        <View style={styles.examContent}>
                          <Ionicons name={isSelected ? "checkmark-circle" : "school"} size={32} color={isSelected ? "#34C759" : "#007AFF"} />
                          <View style={styles.examTextContainer}>
                            <Text style={[styles.examName, { color: colors.text }]} numberOfLines={2}>{exam.name}</Text>
                            {exam.description && <Text style={[styles.examDescription, { color: colors.textSecondary }]} numberOfLines={1}>{exam.description}</Text>}
                          </View>
                        </View>
                        {!isSelected && <Ionicons name="chevron-forward" size={20} color="#8E8E93" />}
                        {switchingExam && isSelected && <ActivityIndicator size="small" color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-start' },
  drawer: { width: '80%', height: '100%', backgroundColor: colors.background, elevation: 5, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  header: { backgroundColor: '#007AFF', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16, borderWidth: 2, borderColor: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  userRole: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
  closeButton: { padding: 4 },
  content: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuText: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 16 },
  logoutText: { color: '#FF3B30' },
  whatsappItem: { backgroundColor: '#E7F8F0' },
  whatsappText: { color: '#25D366', fontWeight: '600' },
  badge: { backgroundColor: '#FF3B30', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  divider: { height: 8, backgroundColor: colors.border },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#8E8E93' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  examSwitcherModal: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  examList: { maxHeight: '100%' },
  examItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectedExamItem: { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
  examContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  examTextContainer: { flex: 1, marginLeft: 16 },
  examName: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 4 },
  examDescription: { fontSize: 14, color: colors.textSecondary },
  themeIndicator: { backgroundColor: colors.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  themeIndicatorText: { fontSize: 16 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.text },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.text },
});