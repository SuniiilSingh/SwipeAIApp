import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { registerForPushNotificationsAsync, setupNotificationObserver } from '@/services/notifications';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Hide native splash screen on Android/iOS once layout mounts
    SplashScreen.hideAsync().catch(() => {});

    // Register for Expo Push Notifications
    registerForPushNotificationsAsync().catch(() => {});

    // Listen to push notification interactions / tap responses
    const cleanupNotifications = setupNotificationObserver(router);

    return () => {
      cleanupNotifications?.();
    };
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0E0F13' },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="matches/icebreaker" options={{ headerShown: false }} />
        <Stack.Screen name="safe-date/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
