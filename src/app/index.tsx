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

        // 1. Fetch user profile to verify basic info (Name, Gender, Orientation) and >=30% completion
        try {
          const profile = await api.getMyProfile();
          const hasName = Boolean(profile?.displayName?.trim() || profile?.fullName?.trim());
          const hasGender = Boolean(profile?.gender || profile?.genderDisplay);
          const hasOrientation = Boolean(profile?.sexualOrientation);
          const completionPct = profile?.completionPercentage || 0;
          const isProfileComplete = hasName && hasGender && hasOrientation && completionPct >= 30;

          // If profile is incomplete, directly redirect to fill profile details
          if (!isProfileComplete) {
            router.replace({ pathname: '/(tabs)/profile', params: { edit: 'true', reason: 'incomplete' } });
            return;
          }

          // 2. Check local cached onboarding status
          const completedLocally = await api.isOnboardingCompleted();
          if (completedLocally) {
            router.replace('/(tabs)');
            return;
          }

          // 3. Check if phone/wa, liveness, and intent were already completed
          const isPhoneOrWaVerified = Boolean(profile.whatsappVerified || profile.phoneE164);
          const isLivenessVerified = Boolean((profile.livenessScore && profile.livenessScore >= 0.85) || profile.digilockerVerified);
          const hasDatingIntent = Boolean(profile.intent || profile.relationshipIntent);

          if (isPhoneOrWaVerified && isLivenessVerified && hasDatingIntent) {
            await api.setOnboardingCompleted(true);
            router.replace('/(tabs)');
            return;
          }
        } catch (profileErr) {
          // If profile check fails, route to auth
          router.replace('/auth');
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
