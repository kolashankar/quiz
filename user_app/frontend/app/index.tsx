import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Loading } from '../src/components/common';

export default function IndexScreen() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading text="Loading..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}