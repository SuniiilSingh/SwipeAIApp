import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { api } from '@/services/api';

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndRedirect = async () => {
      try {
        const token = await api.initAuth();
        if (!isMounted) return;

        if (!token) {
          router.replace('/auth');
          return;
        }

        // 1. Check local cached onboarding status
        const completedLocally = await api.isOnboardingCompleted();
        if (completedLocally) {
          router.replace('/(tabs)');
          return;
        }

        // 2. Query backend profile to check if details and verifications were already completed
        try {
          const profile = await api.getMyProfile();
          const isPhoneOrWaVerified = Boolean(profile.whatsappVerified || profile.phoneE164);
          const isLivenessVerified = Boolean((profile.livenessScore && profile.livenessScore >= 0.85) || profile.digilockerVerified);
          const hasDatingIntent = Boolean(profile.intent);

          if (isPhoneOrWaVerified && isLivenessVerified && hasDatingIntent) {
            await api.setOnboardingCompleted(true);
            router.replace('/(tabs)');
            return;
          }
        } catch (profileErr) {
          // If profile check fails but token exists, redirect to discovery
          router.replace('/(tabs)');
          return;
        }

        // If onboarding is incomplete, proceed to auth to finish remaining steps
        router.replace('/auth');
      } catch (e) {
        if (isMounted) {
          router.replace('/auth');
        }
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    checkSessionAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E94057" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1016',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
