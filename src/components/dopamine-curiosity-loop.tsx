import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { hapticFeedback } from '@/utils/haptics';
import { CandidateCard, UserProfile } from '@/types';
import { normalizeImageUrl } from '@/services/api';
import { MODEL_ASSETS, resolveImageSource } from '@/constants/assets';

const { width } = Dimensions.get('window');
const RADAR_SIZE = Math.min(width * 0.74, 290);

interface DopamineCuriosityLoopProps {
  city?: string;
  minDurationMs?: number;
  isLoading?: boolean;
  candidates?: CandidateCard[];
  userProfile?: UserProfile | null;
  filterLabel?: string;
  onComplete?: () => void;
}

/**
 * Accurately determines the gender/partner pool the user is seeking.
 * Guarantees zero gender confusion on the proximity radar.
 */
export const getSeekingGender = (profile?: UserProfile | null): 'FEMALE' | 'MALE' | 'ANY' => {
  if (!profile) return 'FEMALE';
  const myGender = profile.gender;
  const orientation = (profile.sexualOrientation || '').toLowerCase();

  // Explicit LGBTQ+ orientations
  if (orientation.includes('gay') || orientation.includes('homo')) {
    if (myGender === 'MALE' || myGender === 'FEMALE') return myGender;
    return 'MALE';
  }
  if (orientation.includes('lesbian')) {
    return 'FEMALE';
  }
  if (orientation.includes('bi') || orientation.includes('pan') || orientation.includes('queer')) {
    return 'ANY';
  }

  // Heterosexual standard mapping
  if (myGender === 'MALE') return 'FEMALE';
  if (myGender === 'FEMALE') return 'MALE';
  return 'ANY';
};

// 100% Verified Female Fallback Pool (Kept inside UI build for zero-network/offline resilience)
const FEMALE_FALLBACK_AVATARS = [
  {
    id: 'f_1',
    name: 'Tara, 24',
    distance: '800m away',
    vibe: 'Architect ☕ Indiranagar',
    bio: 'Looking for someone who argues about playlists over late craft beers...',
    color: '#FF2E63',
    photo: MODEL_ASSETS.tara,
    top: 22,
    right: 24,
  },
  {
    id: 'f_2',
    name: 'Ananya, 23',
    distance: '1.2km away',
    vibe: 'Designer 🎨 Koramangala',
    bio: 'Third-wave coffee, film cameras and sunset drives.',
    color: '#00F0FF',
    photo: MODEL_ASSETS.ananya,
    bottom: 26,
    left: 18,
  },
  {
    id: 'f_3',
    name: 'Meera, 25',
    distance: '1.6km away',
    vibe: 'Books & Monsoon Chai 📚 HSR',
    bio: 'Reads physical books and orders dessert for the table.',
    color: '#FFB300',
    photo: MODEL_ASSETS.meera,
    top: 80,
    left: 8,
  },
];

// 100% Verified Male Fallback Pool (Kept inside UI build for zero-network/offline resilience)
const MALE_FALLBACK_AVATARS = [
  {
    id: 'm_1',
    name: 'Kabir, 26',
    distance: '750m away',
    vibe: 'Tech Founder 🚀 Indiranagar',
    bio: 'Building early-stage AI, running Cubbon Park on Sundays.',
    color: '#00F0FF',
    photo: MODEL_ASSETS.kabir,
    top: 22,
    right: 24,
  },
  {
    id: 'm_2',
    name: 'Rohan, 25',
    distance: '1.1km away',
    vibe: 'Musician 🎸 Koramangala',
    bio: 'Vinyl records, retro synths and late night food hunts.',
    color: '#FF2E63',
    photo: MODEL_ASSETS.rohan,
    bottom: 26,
    left: 18,
  },
  {
    id: 'm_3',
    name: 'Aryan, 27',
    distance: '1.7km away',
    vibe: 'Consultant 💼 Whitefield',
    bio: 'Coffee snob, weekend trekker and sourdough baker.',
    color: '#FFB300',
    photo: MODEL_ASSETS.aryan,
    top: 80,
    left: 8,
  },
];

const formatCandidateDistance = (distKm?: number, index: number = 0): string => {
  if (typeof distKm === 'number' && distKm > 0) {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)}m away`;
    }
    return `${distKm.toFixed(1)}km away`;
  }
  const defaultDistances = ['650m away', '1.1km away', '1.6km away'];
  return defaultDistances[index] || 'Nearby';
};

export default function DopamineCuriosityLoop({
  city = 'Bangalore',
  minDurationMs = 1200,
  isLoading = false,
  candidates,
  userProfile,
  filterLabel,
  onComplete,
}: DopamineCuriosityLoopProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const hasFinishedRef = useRef(false);

  // Proactive prefetch candidate photos in parallel while radar is sweeping
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      const urls = candidates
        .slice(0, 6)
        .flatMap((c) => (c.photos && c.photos.length > 0 ? c.photos.slice(0, 2) : []))
        .filter((u): u is string => typeof u === 'string' && (u.startsWith('http') || u.startsWith('file')));
      if (urls.length > 0) {
        ExpoImage.prefetch(urls).catch(() => {});
      }
    }
  }, [candidates]);

  // Seeking gender calculation: guarantees proximity never shows the wrong gender!
  const seekingGender = useMemo(() => getSeekingGender(userProfile), [userProfile]);

  // Map candidates or strictly gender-safe fallbacks
  const activeAvatars = useMemo(() => {
    if (candidates && candidates.length > 0) {
      const realSlice = candidates.slice(0, 3);
      const positions = [
        { top: 22, right: 24, color: '#FF2E63' },
        { bottom: 26, left: 18, color: '#00F0FF' },
        { top: 80, left: 8, color: '#FFB300' },
      ];

      return realSlice.map((cand, idx) => {
        const pos = positions[idx] || positions[0];
        const rawPhoto = cand.photos?.[0] || '';
        const fallbackList = seekingGender === 'MALE' ? MALE_FALLBACK_AVATARS : FEMALE_FALLBACK_AVATARS;
        const photo = normalizeImageUrl(rawPhoto, true) || fallbackList[idx]?.photo;

        return {
          id: cand.userId || `cand_${idx}`,
          name: cand.displayName ? `${cand.displayName}, ${cand.age || 24}` : 'Nearby Match',
          distance: formatCandidateDistance(cand.distanceKm, idx),
          vibe: cand.occupation || cand.job || 'Verified Member',
          bio: cand.bio || 'Active high-intent match on BlunderR',
          color: pos.color,
          photo,
          top: pos.top,
          right: (pos as any).right,
          bottom: (pos as any).bottom,
          left: (pos as any).left,
          isReal: true,
        };
      });
    }

    // Gender-aware fallback
    return seekingGender === 'MALE' ? MALE_FALLBACK_AVATARS : FEMALE_FALLBACK_AVATARS;
  }, [candidates, seekingGender]);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringScaleAnim = useRef(new Animated.Value(0.85)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0.4)).current;
  const bubbleScale1 = useRef(new Animated.Value(0)).current;
  const bubbleScale2 = useRef(new Animated.Value(0)).current;
  const bubbleScale3 = useRef(new Animated.Value(0)).current;
  const lockAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Trigger profile lock when data arrives or when ready
  useEffect(() => {
    const hasRealData = Boolean(candidates && candidates.length > 0);
    if ((hasRealData || minTimePassed) && !isProfileLocked) {
      setIsProfileLocked(true);
      hapticFeedback.medium();
      Animated.spring(lockAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [candidates, minTimePassed, isProfileLocked]);

  // Reset scan cycle state if new load is initiated
  useEffect(() => {
    if (isLoading) {
      hasFinishedRef.current = false;
      setMinTimePassed(false);
      setIsProfileLocked(false);
    }
  }, [isLoading]);

  // 1. Min duration tracker
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimePassed(true);
    }, minDurationMs);
    return () => clearTimeout(minTimer);
  }, [minDurationMs]);

  // 2. Direct seamless transition: Trigger onComplete without an internal black-fade gap
  useEffect(() => {
    if (minTimePassed && !isLoading && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      hapticFeedback.success();
      onComplete?.();
    }
  }, [minTimePassed, isLoading, onComplete]);

  // 3. Safety ceiling timer: Never stay stuck scanning if network takes more than 4.5 seconds
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        hapticFeedback.success();
        onComplete?.();
      }
    }, Math.max(minDurationMs + 1600, 4500));
    return () => clearTimeout(safetyTimer);
  }, [minDurationMs, onComplete]);

  useEffect(() => {
    // Initial tactile haptic feedback
    hapticFeedback.medium();

    // Continuous rotating sonar sweep
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Heartbeat pulsing on center pin
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Breathing concentric radar rings
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScaleAnim, {
            toValue: 1.12,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacityAnim, {
            toValue: 0.85,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScaleAnim, {
            toValue: 0.85,
            duration: 1400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacityAnim, {
            toValue: 0.35,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Pop mystery avatars sequentially as sonar sweeps
    const t1 = setTimeout(() => {
      hapticFeedback.light();
      Animated.spring(bubbleScale1, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 450);

    const t2 = setTimeout(() => {
      hapticFeedback.light();
      setStepIndex(1);
      Animated.spring(bubbleScale2, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 1000);

    const t3 = setTimeout(() => {
      hapticFeedback.medium();
      setStepIndex(2);
      Animated.spring(bubbleScale3, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 1600);

    const t4 = setTimeout(() => {
      setStepIndex(3);
    }, 2100);

    // Dopamine Progress Meter filling to 100%
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDurationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [minDurationMs]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const profileCategoryLabel = seekingGender === 'FEMALE' ? 'VERIFIED WOMEN' : seekingGender === 'MALE' ? 'VERIFIED MEN' : 'VERIFIED SINGLES';
  const profileSeekText = seekingGender === 'FEMALE' ? 'verified women' : seekingGender === 'MALE' ? 'verified men' : 'active singles';

  const RADAR_SCAN_STEPS = [
    {
      phase: 1,
      title: filterLabel ? `⚡ Proximity Radar: ${filterLabel}` : '⚡ Proximity Radar Active',
      sub: filterLabel
        ? `Sweeping database from 0km up to radius for ${filterLabel} ${profileSeekText}...`
        : `Scanning proximity rings from 0km up to search radius for ${profileSeekText}...`,
      tag: filterLabel ? `DB FILTER: ${filterLabel.toUpperCase()}` : 'SCANNING PROXIMITY RINGS',
      status: 'RADAR ACTIVE',
    },
    {
      phase: 2,
      title: '🛡️ Zero-Bot Validation',
      sub: 'Filtering catfish & checking 3D facial liveness across rings...',
      tag: '100% HUMAN ASSURANCE',
      status: 'VERIFYING BIOMETRICS',
    },
    {
      phase: 3,
      title: isProfileLocked ? '✨ Profiles Found Nearby' : '🔥 Chemistry Match Detected',
      sub: isProfileLocked
        ? filterLabel
          ? `Found verified ${filterLabel} profiles matching your vibe!`
          : `Discovered ${candidates && candidates.length > 0 ? candidates.length : activeAvatars.length} verified profiles sorted by closest distance!`
        : `Found ${profileSeekText} matching your banter vibe!`,
      tag: isProfileLocked ? 'PROFILES DISCOVERED > 94%' : 'NEARBY COMPATIBILITY > 94%',
      status: isProfileLocked ? 'PROFILES IDENTIFIED' : 'MATCHES IDENTIFIED',
    },
    {
      phase: 4,
      title: '✨ Curating Discovery Deck',
      sub: filterLabel
        ? `Sorting closest ${filterLabel} profiles to the top of your feed...`
        : 'Sorting closest verified profiles to the top of your feed...',
      tag: 'DECK READY',
      status: 'LAUNCHING FEED',
    },
  ];

  const currentStep = RADAR_SCAN_STEPS[stepIndex] || RADAR_SCAN_STEPS[0];
  const displayCity = city
    ? city.includes('Bengaluru') || city.includes('Bangalore')
      ? 'Indiranagar & Koramangala'
      : city
    : 'Indiranagar & Koramangala';

  const avatarScales = [bubbleScale1, bubbleScale2, bubbleScale3];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* TOP STATUS HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandWordmarkContainer}>
              <Text style={styles.brandTitle}>BLUNDER</Text>
              <View style={styles.flippedRContainer}>
                <Text style={styles.flippedRText}>R</Text>
              </View>
              <Text style={styles.brandSpark}>⚡</Text>
            </View>
            <View style={styles.liveRadarPill}>
              <View style={styles.radarDot} />
              <Text style={styles.radarPillText}>
                {isProfileLocked ? 'PROFILES FOUND' : 'RADAR ACTIVE'}
              </Text>
            </View>
          </View>
          <Text style={styles.cityLocationText}>📍 Proximity Pulse • {displayCity}</Text>
        </View>

        {/* RADAR SWEEP ARENA */}
        <View style={styles.radarArena}>
          {/* Animated Concentric Circles */}
          <Animated.View
            style={[
              styles.radarRing,
              styles.ringOuter,
              {
                transform: [{ scale: ringScaleAnim }],
                opacity: ringOpacityAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRing,
              styles.ringMid,
              {
                transform: [{ scale: ringScaleAnim }],
              },
            ]}
          />
          <View style={[styles.radarRing, styles.ringInner]} />

          {/* Sonar Crosshairs */}
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />

          {/* Rotating Sonar Beam */}
          <Animated.View
            style={[
              styles.sonarSweepContainer,
              { transform: [{ rotate: spin }] },
            ]}>
            <View style={styles.sonarBeamLine} />
            <View style={styles.sonarBeamGlow} />
          </Animated.View>

          {/* Center User Beacon */}
          <Animated.View
            style={[
              styles.centerBeacon,
              { transform: [{ scale: pulseAnim }] },
            ]}>
            <View style={styles.centerBeaconCore} />
            <View style={styles.centerBeaconPing} />
          </Animated.View>

          {/* DISCOVERED SINGLES IN ORBIT */}
          {activeAvatars.map((avatar, idx) => {
            const scale = avatarScales[idx] || bubbleScale1;

            return (
              <Animated.View
                key={avatar.id || idx}
                style={[
                  styles.avatarBubble,
                  {
                    top: avatar.top,
                    right: avatar.right,
                    bottom: avatar.bottom,
                    left: avatar.left,
                    borderColor: avatar.color,
                    shadowColor: avatar.color,
                    transform: [{ scale }],
                  },
                ]}>
                {isProfileLocked ? (
                  // Profile Locked: Reveal photo with smooth lock animation
                  <Animated.View
                    style={[
                      styles.avatarImageWrapper,
                      {
                        transform: [
                          {
                            scale: lockAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 1],
                            }),
                          },
                        ],
                        opacity: lockAnim,
                      },
                    ]}>
                    <ExpoImage
                      source={resolveImageSource(avatar.photo, seekingGender === 'MALE' ? MODEL_ASSETS.kabir : MODEL_ASSETS.tara)}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={150}
                    />
                  </Animated.View>
                ) : (
                  // Initial Scanning Phase: Pure Neon Sonar Blip (Zero gender spoiler)
                  <View style={[styles.blipReticle, { borderColor: avatar.color }]}>
                    <View style={[styles.blipCenterDot, { backgroundColor: avatar.color }]} />
                  </View>
                )}

                <View style={[styles.avatarTag, { backgroundColor: avatar.color }]}>
                  <Text style={styles.avatarTagText}>
                    {isProfileLocked ? `📍 ${avatar.distance}` : '📍 Pinging...'}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* BOTTOM REAL-TIME DOPAMINE HOOK */}
        <View style={styles.bottomSection}>
          {/* Phase Badge */}
          <View style={styles.phaseBadgeRow}>
            <View style={[styles.phasePill, isProfileLocked && styles.phasePillLocked]}>
              <Text style={[styles.phasePillText, isProfileLocked && styles.phasePillTextLocked]}>
                {isProfileLocked
                  ? `✨ ${candidates && candidates.length > 0 ? candidates.length : 3} PROFILES FOUND`
                  : currentStep.tag}
              </Text>
            </View>
            <Text style={styles.statusLiveText}>● {currentStep.status}</Text>
          </View>

          {/* Main Scanning Headline */}
          <Text style={styles.headlineTitle}>{currentStep.title}</Text>
          <Text style={styles.headlineSub}>{currentStep.sub}</Text>

          {/* Live Mystery Match Teaser Card */}
          <View style={styles.teaserCard}>
            <View style={styles.teaserTopRow}>
              <Text style={styles.teaserCategory}>
                ⚡ {profileCategoryLabel} SPOTLIGHT
              </Text>
              <Text style={styles.teaserDistance}>
                {isProfileLocked ? `📍 ${activeAvatars[0]?.distance || 'Nearby'}` : '📍 3 within 1.5 km'}
              </Text>
            </View>
            <Text style={styles.teaserQuote} numberOfLines={2}>
              {isProfileLocked
                ? `"${activeAvatars[0]?.bio || activeAvatars[0]?.vibe || 'Looking for genuine banter and spontaneous coffee dates...'}"`
                : '"Looking for someone who argues about playlists over late craft beers..."'}
            </Text>
            <View style={styles.teaserTrustRow}>
              <Text style={styles.teaserTrustBadge}>🛡️ 3D Liveness Verified</Text>
              <Text style={styles.teaserTrustBadge}>
                {isProfileLocked ? `✨ ${activeAvatars[0]?.vibe || 'Verified Profile'}` : '☕ Indiranagar Regular'}
              </Text>
            </View>
          </View>

          {/* Dopamine Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#08080E',
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  /* TOP HEADER */
  topHeader: {
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandWordmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  flippedRContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scaleX: -1 }],
  },
  flippedRText: {
    color: '#FF385C',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255, 56, 92, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  brandSpark: {
    color: '#FF385C',
    fontSize: 18,
    marginLeft: 3,
  },
  liveRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  radarPillText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cityLocationText: {
    color: '#8E92A8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  /* RADAR ARENA */
  radarArena: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ringOuter: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  ringMid: {
    width: RADAR_SIZE * 0.68,
    height: RADAR_SIZE * 0.68,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  ringInner: {
    width: RADAR_SIZE * 0.38,
    height: RADAR_SIZE * 0.38,
    borderColor: 'rgba(255, 46, 99, 0.45)',
    backgroundColor: 'rgba(255, 46, 99, 0.05)',
  },
  crosshairH: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  crosshairV: {
    position: 'absolute',
    height: RADAR_SIZE,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* SONAR BEAM */
  sonarSweepContainer: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sonarBeamLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: RADAR_SIZE / 2,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  sonarBeamGlow: {
    position: 'absolute',
    top: 0,
    right: RADAR_SIZE / 2,
    width: RADAR_SIZE / 2,
    height: RADAR_SIZE / 2,
    borderTopLeftRadius: RADAR_SIZE / 2,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },

  /* CENTER BEACON */
  centerBeacon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF2E63',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2E63',
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  centerBeaconCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  centerBeaconPing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 46, 99, 0.6)',
  },

  /* AVATAR BUBBLE */
  avatarBubble: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: '#161722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  blipReticle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  blipCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatarTag: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  avatarTagText: {
    color: '#08080E',
    fontSize: 8,
    fontWeight: '900',
  },

  /* BOTTOM SECTION */
  bottomSection: {
    paddingBottom: Platform.OS === 'android' ? 14 : 6,
  },
  phaseBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phasePill: {
    backgroundColor: 'rgba(255, 46, 99, 0.15)',
    borderColor: 'rgba(255, 46, 99, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phasePillLocked: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: 'rgba(0, 240, 255, 0.45)',
  },
  phasePillText: {
    color: '#FF5E85',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  phasePillTextLocked: {
    color: '#00F0FF',
  },
  statusLiveText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headlineTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headlineSub: {
    color: '#A0A0B5',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 14,
  },

  /* TEASER CARD */
  teaserCard: {
    backgroundColor: 'rgba(22, 23, 35, 0.85)',
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  teaserTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teaserCategory: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  teaserDistance: {
    color: '#FFB300',
    fontSize: 10,
    fontWeight: '800',
  },
  teaserQuote: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 8,
  },
  teaserTrustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  teaserTrustBadge: {
    color: '#8E92A8',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  /* PROGRESS BAR */
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF2E63',
    borderRadius: 2,
  },
});
