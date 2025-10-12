import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
}

export function ResponsiveContainer({ 
  children, 
  maxWidth = 1200,
  backgroundColor = '#F2F2F7' 
}: ResponsiveContainerProps) {
  const isWeb = Platform.OS === 'web';
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  if (!isWeb) {
    // On mobile, just return children as-is
    return <>{children}</>;
  }

  // Web responsive layout
  return (
    <View style={[styles.webContainer, { backgroundColor }]}>
      <View style={[
        styles.contentWrapper,
        { maxWidth },
        isMobile && styles.mobileWrapper,
        isTablet && styles.tabletWrapper,
        isDesktop && styles.desktopWrapper,
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  mobileWrapper: {
    paddingHorizontal: 0,
  },
  tabletWrapper: {
    paddingHorizontal: 24,
  },
  desktopWrapper: {
    paddingHorizontal: 32,
  },
});
