import React, { useEffect } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import { usePreventScreenCapture } from 'expo-screen-capture';
import {
  ensureNotificationChannelsCreatedAsync,
  registerForPushNotificationsAsync,
  setupNotificationObserver,
} from '@/services/notifications';
import { CallProvider } from '@/context/call-context';

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
          'Screenshots and screen recordings are strictly disabled across BlunderR to eliminate catfishing, protect verified profiles, and guarantee message privacy.'
        );
      });
    } catch (e) {}

    // Hide native splash screen on Android/iOS once layout mounts
    SplashScreen.hideAsync().catch(() => {});

    // Ensure notification channels exist and register for Expo Push Notifications
    ensureNotificationChannelsCreatedAsync().catch(() => {});
    registerForPushNotificationsAsync().catch(() => {});

    // Disable right-click inspect and DevTools shortcuts on Web
    let removeWebInspectBlock: (() => void) | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // F12
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        // Ctrl+Shift+I / J / C / K
        if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        // Mac: Cmd+Option+I / J / C / U
        if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c', 'U', 'u'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        // Ctrl+U / Cmd+U (View source)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
          e.preventDefault();
          return false;
        }
        // Ctrl+S / Cmd+S (Save page)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
          e.preventDefault();
          return false;
        }
      };

      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('keydown', handleKeyDown);

      removeWebInspectBlock = () => {
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      cleanupNotifications?.();
      captureSubscription?.remove?.();
      removeWebInspectBlock?.();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <CallProvider>
        <StatusBar style="light" />
        <View style={webStyles.outerContainer}>
          {Platform.OS === 'web' && (
            <View style={webStyles.webHeader}>
              <Text style={webStyles.webHeaderTitle}>⚡ BlunderR Web View</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://expo.dev/artifacts/eas/1VbdICRgtwwG-knj2ouL9qq7aWufivcxiNRdc75npCM.apk')}
                  style={webStyles.webApkBtn}
                  activeOpacity={0.8}>
                  <Text style={webStyles.webApkBtnText}>🤖 Android APK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/#download-apple';
                    }
                  }}
                  style={webStyles.webIosBtn}
                  activeOpacity={0.8}>
                  <Text style={webStyles.webIosBtnText}> Apple iOS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={webStyles.appFrame}>
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
          </View>
        </View>
      </CallProvider>
    </SafeAreaProvider>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#08080E',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  webHeader: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#12141F',
    borderBottomWidth: 1,
    borderBottomColor: '#1E212E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  webHeaderTitle: {
    color: '#F1F5F9',
    fontWeight: '800',
    fontSize: 13,
  },
  webApkBtn: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  webApkBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  webIosBtn: {
    backgroundColor: '#1E212E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  webIosBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 580 : undefined,
    height: '100%',
    backgroundColor: '#0E0F13',
    overflow: 'hidden',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#1E212E',
  },
});
