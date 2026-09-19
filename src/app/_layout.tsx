import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { registerForPushNotificationsAsync, setupNotificationObserver } from '@/services/notifications';

export default function RootLayout() {
  const router = useRouter();

  // Enforce zero-screenshot / zero-screen-recording policy across all app screens
  usePreventScreenCapture();

  useEffect(() => {
    // Ensure native FLAG_SECURE / screen recording protection is permanently active
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});

    // Screenshot attempt detector
    let captureSubscription: any = null;
    try {
      captureSubscription = ScreenCapture.addScreenshotListener(() => {
        Alert.alert(
          'Privacy Protection Active 🛡️',
          'Screenshots and screen recordings are strictly disabled across Blunderr Dating to eliminate catfishing, protect verified profiles, and guarantee message privacy.'
        );
      });
    } catch (e) {}

    // Hide native splash screen on Android/iOS once layout mounts
    SplashScreen.hideAsync().catch(() => {});

    // Register for Expo Push Notifications
    registerForPushNotificationsAsync().catch(() => {});

    // Listen to push notification interactions / tap responses
    const cleanupNotifications = setupNotificationObserver(router);

    return () => {
      cleanupNotifications?.();
      captureSubscription?.remove?.();
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
        <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
