import React, { useEffect } from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 960;

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
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c', 'U', 'u'].includes(e.key)) {
          e.preventDefault();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's')) {
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

    const cleanupNotifications = setupNotificationObserver(router);

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
        
        {isDesktop ? (
          /* ========================================================
             DESKTOP WORLD-CLASS WEB EXPERIENCE
             ======================================================== */
          <View style={webStyles.desktopWrapper}>
            {/* Ambient Background Glows */}
            <View style={webStyles.glowOrb1} />
            <View style={webStyles.glowOrb2} />

            {/* Left Column: Brand & Marketing Overview */}
            <View style={webStyles.desktopLeftPane}>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://blunderr.in')}
                activeOpacity={0.8}
                style={{ alignSelf: 'flex-start', marginBottom: 20 }}>
                <Text style={webStyles.desktopBrandText}>
                  Blunder<Text style={webStyles.desktopAccentR}>R</Text>
                </Text>
              </TouchableOpacity>

              <View style={webStyles.livePill}>
                <View style={webStyles.liveDot} />
                <Text style={webStyles.livePillText}>WEB VIEW LIVE • ZERO CATFISH</Text>
              </View>

              <Text style={webStyles.desktopHeading}>
                Meet On Your{'\n'}True Wavelength.
              </Text>

              <Text style={webStyles.desktopSub}>
                India’s premier connection network with 3D Biometric Liveness Verification, Micro-Community Circles, and Vedic Cosmic Kundali.
              </Text>

              <View style={webStyles.featureCardStack}>
                <View style={webStyles.featureMiniCard}>
                  <Text style={webStyles.featureIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={webStyles.featureTitle}>3D Biometric Liveness</Text>
                    <Text style={webStyles.featureDesc}>Zero bots, zero deepfakes, 100% genuine verified humans.</Text>
                  </View>
                </View>

                <View style={webStyles.featureMiniCard}>
                  <Text style={webStyles.featureIcon}>🏙️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={webStyles.featureTitle}>Neighborhood Circles</Text>
                    <Text style={webStyles.featureDesc}>Match inside tech hubs, creatives & coffee tribes.</Text>
                  </View>
                </View>

                <View style={webStyles.featureMiniCard}>
                  <Text style={webStyles.featureIcon}>☕</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={webStyles.featureTitle}>15s Virtual Chai Calls</Text>
                    <Text style={webStyles.featureDesc}>Encrypted voice dates before sharing personal phone numbers.</Text>
                  </View>
                </View>
              </View>

              {/* Download Buttons Group */}
              <Text style={webStyles.downloadLabel}>Get the Official Mobile App:</Text>
              <View style={webStyles.desktopBtnRow}>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://expo.dev/artifacts/eas/1VbdICRgtwwG-knj2ouL9qq7aWufivcxiNRdc75npCM.apk')}
                  style={webStyles.desktopApkBtn}
                  activeOpacity={0.85}>
                  <Text style={webStyles.desktopApkBtnText}>🤖 Android APK</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (typeof window !== 'undefined') window.location.href = '/#download-apple';
                  }}
                  style={webStyles.desktopIosBtn}
                  activeOpacity={0.85}>
                  <Text style={webStyles.desktopIosBtnText}> Apple iOS</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => Linking.openURL('https://blunderr.in')}
                style={{ marginTop: 24 }}>
                <Text style={webStyles.backLinkText}>← Back to Overview & Privacy</Text>
              </TouchableOpacity>
            </View>

            {/* Right Column: Sleek Phone Mockup Device */}
            <View style={webStyles.desktopRightPane}>
              <View style={webStyles.phoneShell}>
                <View style={webStyles.phoneScreen}>
                  <Stack
                    initialRouteName="index"
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: '#0E0F13' },
                      animation: 'slide_from_right',
                    }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/index" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/onboarding-decks" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="matches/icebreaker" options={{ headerShown: false }} />
                    <Stack.Screen name="safe-date/index" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
                  </Stack>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ========================================================
             MOBILE NATIVE / MOBILE WEB RESPONSIVE EXPERIENCE
             ======================================================== */
          <View style={webStyles.mobileWrapper}>
            {Platform.OS === 'web' && (
              <View style={webStyles.mobileWebHeader}>
                <Text style={webStyles.mobileWebTitle}>⚡ BlunderR Web View</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://expo.dev/artifacts/eas/1VbdICRgtwwG-knj2ouL9qq7aWufivcxiNRdc75npCM.apk')}
                    style={webStyles.miniHeaderBtnApk}
                    activeOpacity={0.8}>
                    <Text style={webStyles.miniHeaderBtnText}>🤖 APK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (typeof window !== 'undefined') window.location.href = '/#download-apple';
                    }}
                    style={webStyles.miniHeaderBtnIos}
                    activeOpacity={0.8}>
                    <Text style={webStyles.miniHeaderBtnText}> iOS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={webStyles.mobileAppContainer}>
              <Stack
                initialRouteName="index"
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0E0F13' },
                  animation: 'slide_from_right',
                }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="auth/index" options={{ headerShown: false }} />
                <Stack.Screen name="auth/onboarding-decks" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="matches/icebreaker" options={{ headerShown: false }} />
                <Stack.Screen name="safe-date/index" options={{ headerShown: false }} />
                <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
              </Stack>
            </View>
          </View>
        )}
      </CallProvider>
    </SafeAreaProvider>
  );
}

const webStyles: Record<string, any> = StyleSheet.create({
  // Desktop Studio Layout
  desktopWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#06070B',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOrb1: {
    position: 'absolute',
    top: -120,
    left: '10%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    // @ts-ignore
    filter: 'blur(100px)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -150,
    right: '25%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(139, 92, 246, 0.09)',
    // @ts-ignore
    filter: 'blur(120px)',
  },
  desktopLeftPane: {
    width: 480,
    paddingHorizontal: 40,
    paddingVertical: 30,
    justifyContent: 'center',
    zIndex: 10,
  },
  desktopBrandText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FF385C',
    letterSpacing: -0.5,
  },
  desktopAccentR: {
    color: '#F59E0B',
    fontSize: 38,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  livePillText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  desktopHeading: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  desktopSub: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 23,
    marginBottom: 24,
  },
  featureCardStack: {
    gap: 12,
    marginBottom: 28,
  },
  featureMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(20, 23, 36, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: '#8E94A5',
    lineHeight: 15,
  },
  downloadLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  desktopBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  desktopApkBtn: {
    flex: 1,
    backgroundColor: '#FF385C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopApkBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  desktopIosBtn: {
    flex: 1,
    backgroundColor: '#181C2C',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopIosBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  backLinkText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },

  // Desktop Phone Shell
  desktopRightPane: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  phoneShell: {
    width: 420,
    height: 840,
    maxHeight: '94vh' as any,
    backgroundColor: '#000',
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#26293B',
    padding: 3,
    // @ts-ignore
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 56, 92, 0.25)',
    overflow: 'hidden',
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: '#0E0F13',
  },

  // Mobile Web Experience (< 960px)
  mobileWrapper: {
    flex: 1,
    backgroundColor: '#08080E',
    width: '100%',
    height: '100%',
  },
  mobileWebHeader: {
    backgroundColor: '#10121A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E212E',
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  mobileWebTitle: {
    color: '#F1F5F9',
    fontWeight: '800',
    fontSize: 11,
  },
  miniHeaderBtnApk: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  miniHeaderBtnIos: {
    backgroundColor: '#181C2C',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  miniHeaderBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 10,
  },
  mobileAppContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0E0F13',
  },
});
