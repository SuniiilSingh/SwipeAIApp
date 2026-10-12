import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticFeedback } from '@/utils/haptics';

const { width, height } = Dimensions.get('window');

interface DopamineCuriosityLoopProps {
  city?: string;
  minDurationMs?: number;
  onComplete?: () => void;
}

const RADAR_SCAN_STEPS = [
  {
    phase: 1,
    title: '⚡ Proximity Radar Active',
    sub: 'Sweeping 5km radius for verified singles...',
    tag: 'SCANNING FREQUENCY 5.8 GHz',
    status: 'LOCKING RADAR',
  },
  {
    phase: 2,
    title: '🛡️ Zero-Bot Validation',
    sub: 'Filtering catfish & checking 3D facial liveness...',
    tag: '100% HUMAN ASSURANCE',
    status: 'VERIFYING BIOMETRICS',
  },
  {
    phase: 3,
    title: '🔥 High-Chemistry Match Detected',
    sub: 'Found active singles matching your banter vibe!',
    tag: 'NEARBY COMPATIBILITY > 94%',
    status: 'MATCHES IDENTIFIED',
  },
  {
    phase: 4,
    title: '✨ Curating Discovery Deck',
    sub: 'Locking top candidates to your discovery feed...',
    tag: 'DECK READY',
    status: 'LAUNCHING FEED',
  },
];

const MYSTERY_AVATARS = [
  {
    id: 'av_1',
    name: 'Kiara, 24',
    distance: '800m away',
    vibe: 'Architect ☕ Sour Beers',
    color: '#FF2E63',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    top: 24,
    right: 28,
  },
  {
    id: 'av_2',
    name: 'Rohan, 25',
    distance: '1.2km away',
    vibe: 'Indie Vinyl & Late Drives',
    color: '#00F0FF',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bottom: 30,
    left: 20,
  },
  {
    id: 'av_3',
    name: 'Ananya, 23',
    distance: '1.8km away',
    vibe: 'Third Wave & Monsoon Chai',
    color: '#FFB300',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    top: 85,
    left: 10,
  },
];

export default function DopamineCuriosityLoop({
  city = 'Bangalore',
  minDurationMs = 2800,
  onComplete,
}: DopamineCuriosityLoopProps) {
  const [stepIndex, setStepIndex] = useState(0);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringScaleAnim = useRef(new Animated.Value(0.85)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0.4)).current;
  const bubbleScale1 = useRef(new Animated.Value(0)).current;
  const bubbleScale2 = useRef(new Animated.Value(0)).current;
  const bubbleScale3 = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial tactile haptic feedback
    hapticFeedback.medium();

    // 2. Continuous rotating sonar sweep
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Heartbeat pulsing on center pin
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

    // 4. Breathing concentric radar rings
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

    // 5. Pop mystery avatars sequentially as sonar sweeps
    const t1 = setTimeout(() => {
      hapticFeedback.light();
      Animated.spring(bubbleScale1, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 600);

    const t2 = setTimeout(() => {
      hapticFeedback.light();
      setStepIndex(1);
      Animated.spring(bubbleScale2, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 1300);

    const t3 = setTimeout(() => {
      hapticFeedback.medium();
      setStepIndex(2);
      Animated.spring(bubbleScale3, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 2000);

    const t4 = setTimeout(() => {
      setStepIndex(3);
    }, 2600);

    // 6. Dopamine Progress Meter filling to 100%
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDurationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 7. Complete after duration with smooth fade out
    const finishTimer = setTimeout(() => {
      hapticFeedback.success();
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(finishTimer);
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

  const currentStep = RADAR_SCAN_STEPS[stepIndex] || RADAR_SCAN_STEPS[0];
  const displayCity = city ? (city.includes('Bengaluru') || city.includes('Bangalore') ? 'Indiranagar & Koramangala' : city) : 'Indiranagar & Koramangala';

  return (
    <Animated.View style={[styles.container, { opacity: fadeOutAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* TOP STATUS HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>
              BLUNDERR<Text style={styles.brandSpark}>⚡</Text>
            </Text>
            <View style={styles.liveRadarPill}>
              <View style={styles.radarDot} />
              <Text style={styles.radarPillText}>RADAR ACTIVE</Text>
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

          {/* MYSTERY DISCOVERED SINGLES IN ORBIT */}
          {/* 1. Kiara */}
          <Animated.View
            style={[
              styles.avatarBubble,
              {
                top: MYSTERY_AVATARS[0].top,
                right: MYSTERY_AVATARS[0].right,
                borderColor: MYSTERY_AVATARS[0].color,
                shadowColor: MYSTERY_AVATARS[0].color,
                transform: [{ scale: bubbleScale1 }],
              },
            ]}>
            <Image
              source={{ uri: MYSTERY_AVATARS[0].photo }}
              style={styles.avatarImage}
            />
            <View style={[styles.avatarTag, { backgroundColor: MYSTERY_AVATARS[0].color }]}>
              <Text style={styles.avatarTagText}>📍 800m</Text>
            </View>
          </Animated.View>

          {/* 2. Rohan */}
          <Animated.View
            style={[
              styles.avatarBubble,
              {
                bottom: MYSTERY_AVATARS[1].bottom,
                left: MYSTERY_AVATARS[1].left,
                borderColor: MYSTERY_AVATARS[1].color,
                shadowColor: MYSTERY_AVATARS[1].color,
                transform: [{ scale: bubbleScale2 }],
              },
            ]}>
            <Image
              source={{ uri: MYSTERY_AVATARS[1].photo }}
              style={styles.avatarImage}
            />
            <View style={[styles.avatarTag, { backgroundColor: MYSTERY_AVATARS[1].color }]}>
              <Text style={styles.avatarTagText}>📍 1.2km</Text>
            </View>
          </Animated.View>

          {/* 3. Ananya */}
          <Animated.View
            style={[
              styles.avatarBubble,
              {
                top: MYSTERY_AVATARS[2].top,
                left: MYSTERY_AVATARS[2].left,
                borderColor: MYSTERY_AVATARS[2].color,
                shadowColor: MYSTERY_AVATARS[2].color,
                transform: [{ scale: bubbleScale3 }],
              },
            ]}>
            <Image
              source={{ uri: MYSTERY_AVATARS[2].photo }}
              style={styles.avatarImage}
            />
            <View style={[styles.avatarTag, { backgroundColor: MYSTERY_AVATARS[2].color }]}>
              <Text style={styles.avatarTagText}>📍 1.8km</Text>
            </View>
          </Animated.View>
        </View>

        {/* BOTTOM REAL-TIME DOPAMINE HOOK */}
        <View style={styles.bottomSection}>
          
          {/* Phase Badge */}
          <View style={styles.phaseBadgeRow}>
            <View style={styles.phasePill}>
              <Text style={styles.phasePillText}>{currentStep.tag}</Text>
            </View>
            <Text style={styles.statusLiveText}>● {currentStep.status}</Text>
          </View>

          {/* Main Scanning Headline */}
          <Text style={styles.headlineTitle}>{currentStep.title}</Text>
          <Text style={styles.headlineSub}>{currentStep.sub}</Text>

          {/* Live Mystery Match Teaser Card */}
          <View style={styles.teaserCard}>
            <View style={styles.teaserTopRow}>
              <Text style={styles.teaserCategory}>⚡ LIVE DISCOVERY SPOTLIGHT</Text>
              <Text style={styles.teaserDistance}>📍 3 within 1.5 km</Text>
            </View>
            <Text style={styles.teaserQuote}>
              "Looking for someone who argues about playlists over late craft beers..."
            </Text>
            <View style={styles.teaserTrustRow}>
              <Text style={styles.teaserTrustBadge}>🛡️ 3D Liveness Verified</Text>
              <Text style={styles.teaserTrustBadge}>☕ Third Wave Regular</Text>
            </View>
          </View>

          {/* Dopamine Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

        </View>

      </SafeAreaView>
    </Animated.View>
  );
}

const RADAR_SIZE = Math.min(width * 0.76, 290);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#08080E',
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topHeader: {
    paddingTop: Platform.OS === 'android' ? 10 : 4,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSpark: {
    color: '#FF2E63',
  },
  liveRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
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
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  phasePillText: {
    color: '#FF5E85',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
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
