import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  badge?: number;
}

export function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (Platform.OS !== 'web') {
    return null;
  }

  const mainMenuItems: MenuItem[] = [
    { title: 'Home', icon: 'home', path: '/(tabs)/index' },
    { title: 'Quiz', icon: 'library', path: '/(tabs)/quiz' },
    { title: 'Bookmarks', icon: 'bookmark', path: '/(tabs)/bookmarks' },
    { title: 'Leaderboard', icon: 'trophy', path: '/(tabs)/leaderboard' },
    { title: 'Profile', icon: 'person', path: '/(tabs)/profile' },
  ];

  const otherMenuItems: MenuItem[] = [
    { title: 'Analytics', icon: 'analytics', path: '/(tabs)/analytics' },
    { title: 'Practice', icon: 'fitness', path: '/(tabs)/practice' },
    { title: 'Notifications', icon: 'notifications', path: '/(tabs)/notifications', badge: 3 },
    { title: 'Syllabus', icon: 'book', path: '/(tabs)/syllabus' },
  ];

  const settingsMenuItems: MenuItem[] = [
    { title: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
    { title: 'About', icon: 'information-circle', path: '/(tabs)/about' },
    { title: 'Privacy', icon: 'shield-checkmark', path: '/(tabs)/privacy' },
    { title: 'Contact', icon: 'mail', path: '/(tabs)/contact' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.path}
      style={[styles.menuItem, isActive(item.path) && styles.menuItemActive]}
      onPress={() => handleNavigation(item.path)}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={isActive(item.path) ? '#007AFF' : '#8E8E93'}
      />
      <Text style={[styles.menuText, isActive(item.path) && styles.menuTextActive]}>
        {item.title}
      </Text>
      {item.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.sidebar}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="school" size={32} color="#007AFF" />
          <Text style={styles.logoText}>QuizMaster</Text>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || user?.email || 'User'}
          </Text>
          <Text style={styles.userRole}>Student</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {/* Main Navigation */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>MAIN</Text>
          {mainMenuItems.map(renderMenuItem)}
        </View>

        {/* Other Features */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>FEATURES</Text>
          {otherMenuItems.map(renderMenuItem)}
        </View>

        {/* Settings & Info */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          {settingsMenuItems.map(renderMenuItem)}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>QuizMaster v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 All rights reserved</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    height: '100vh' as any,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E7',
    flexDirection: 'column',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#8E8E93',
  },
  menu: {
    flex: 1,
  },
  menuSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#1D1D1F',
  },
  menuTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
