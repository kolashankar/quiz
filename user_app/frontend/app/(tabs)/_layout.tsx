import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Platform, Dimensions } from 'react-native';
import CustomDrawer from '../../src/components/navigation/CustomDrawer';
import { WebSidebar } from '../../src/components/layout/WebSidebar';

export default function TabLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const isWeb = Platform.OS === 'web';
  const { width } = Dimensions.get('window');
  const showWebSidebar = isWeb && width >= 1024; // Show sidebar on desktop web

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Web Sidebar for Desktop */}
      {showWebSidebar && <WebSidebar />}
      
      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: isWeb && width >= 768 ? {
              display: 'none' as any, // Hide tab bar on tablet and desktop web
            } : {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E5E7',
              paddingTop: 8,
              paddingBottom: 8,
              height: 60,
            },
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShown: !showWebSidebar, // Hide header on desktop web with sidebar
            headerLeft: !showWebSidebar ? () => (
              <TouchableOpacity
                onPress={() => setDrawerVisible(true)}
                style={{ marginLeft: 16 }}
              >
                <Ionicons name="menu" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            ) : undefined,
          }}
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Genuis',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          headerTitle: 'Take Quiz',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          headerTitle: 'My Bookmarks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          headerTitle: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      
      {/* Hidden screens - accessible via drawer but not shown in tab bar */}
      <Tabs.Screen
        name="syllabus"
        options={{
          href: null, // Hide from tab bar
          title: 'Syllabus',
          headerTitle: 'Exam Syllabus',
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
          title: 'About Us',
          headerTitle: 'About Genuis',
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          href: null,
          title: 'Privacy Policy',
          headerTitle: 'Privacy Policy',
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          href: null,
          title: 'Contact',
          headerTitle: 'Contact Us',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
          title: 'Analytics',
          headerTitle: 'My Analytics',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
          headerTitle: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          href: null,
          title: 'Practice',
          headerTitle: 'Practice Mode',
        }}
      />
      <Tabs.Screen
        name="practice/configure"
        options={{
          href: null,
          title: 'Configure Practice',
          headerTitle: 'Configure Practice',
        }}
      />
      <Tabs.Screen
        name="practice/session"
        options={{
          href: null,
          title: 'Practice Session',
          headerTitle: 'Practice Session',
        }}
      />
      <Tabs.Screen
        name="profile/edit"
        options={{
          href: null,
          title: 'Edit Profile',
          headerTitle: 'Edit Profile',
        }}
      />
        </Tabs>
        <CustomDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      </View>
    </View>
  );
}