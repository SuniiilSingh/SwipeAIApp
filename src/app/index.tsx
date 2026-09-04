import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

export default function RootIndex() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check authentication token and route immediately
    const timer = setTimeout(() => {
      const token = api.getAuthToken();
      if (!token) {
        router.replace('/auth');
      } else {
        router.replace('/(tabs)');
      }
      setChecking(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E94057" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
