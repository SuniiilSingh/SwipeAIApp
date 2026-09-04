import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding before navigation is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide native splash screen on Android/iOS once layout mounts
    const dismissSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // ignore if already hidden
      }
    };
    dismissSplash();
  }, []);

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
