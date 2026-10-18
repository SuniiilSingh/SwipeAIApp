import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

interface FlowerBokehOverlayProps {
  active: boolean;
  onFinish?: () => void;
  durationMs?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PetalItem {
  id: number;
  startX: number;
  size: number;
  animY: Animated.Value;
  animRotate: Animated.Value;
  animDrift: Animated.Value;
  opacity: Animated.Value;
  color: string;
}

interface BokehOrbItem {
  id: number;
  x: number;
  y: number;
  size: number;
  pulseAnim: Animated.Value;
  color: string;
}

const PETAL_COLORS = [
  'rgba(255, 56, 92, 0.85)',
  'rgba(255, 107, 134, 0.85)',
  'rgba(244, 114, 182, 0.85)',
  'rgba(251, 113, 133, 0.9)',
  'rgba(254, 205, 211, 0.95)',
];

const BOKEH_COLORS = [
  'rgba(255, 56, 92, 0.28)',
  'rgba(245, 158, 11, 0.22)',
  'rgba(244, 114, 182, 0.25)',
  'rgba(236, 72, 153, 0.2)',
  'rgba(168, 85, 247, 0.18)',
];

export default function FlowerBokehOverlay({
  active,
  onFinish,
  durationMs = 5500,
}: FlowerBokehOverlayProps) {
  const petalsRef = useRef<PetalItem[]>([]);
  const orbsRef = useRef<BokehOrbItem[]>([]);
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Initialize petals and orbs once
  if (petalsRef.current.length === 0) {
    const petals: PetalItem[] = [];
    for (let i = 0; i < 28; i++) {
      petals.push({
        id: i,
        startX: Math.random() * SCREEN_WIDTH,
        size: Math.floor(Math.random() * 12) + 12,
        animY: new Animated.Value(-40),
        animRotate: new Animated.Value(0),
        animDrift: new Animated.Value(0),
        opacity: new Animated.Value(0),
        color: PETAL_COLORS[i % PETAL_COLORS.length],
      });
    }
    petalsRef.current = petals;
  }

  if (orbsRef.current.length === 0) {
    const orbs: BokehOrbItem[] = [];
    for (let i = 0; i < 9; i++) {
      orbs.push({
        id: i,
        x: Math.random() * (SCREEN_WIDTH - 80) + 10,
        y: Math.random() * (SCREEN_HEIGHT - 200) + 80,
        size: Math.floor(Math.random() * 70) + 50,
        pulseAnim: new Animated.Value(0),
        color: BOKEH_COLORS[i % BOKEH_COLORS.length],
      });
    }
    orbsRef.current = orbs;
  }

  useEffect(() => {
    if (!active) {
      containerOpacity.setValue(0);
      return;
    }

    // Fade in container
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Animate bokeh orbs pulsing gently
    orbsRef.current.forEach((orb, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb.pulseAnim, {
            toValue: 1,
            duration: 1800 + idx * 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb.pulseAnim, {
            toValue: 0,
            duration: 1800 + idx * 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Animate each petal falling with random delay and drift
    const anims = petalsRef.current.map((petal, index) => {
      petal.animY.setValue(-40);
      petal.animRotate.setValue(0);
      petal.animDrift.setValue(0);
      petal.opacity.setValue(0);

      const delay = (index * 130) % 2200;
      const fallDuration = 3200 + Math.random() * 1800;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(petal.opacity, {
              toValue: 0.95,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(fallDuration - 800),
            Animated.timing(petal.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(petal.animY, {
            toValue: SCREEN_HEIGHT + 60,
            duration: fallDuration,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(petal.animRotate, {
            toValue: 1,
            duration: fallDuration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(petal.animDrift, {
              toValue: 1,
              duration: fallDuration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(petal.animDrift, {
              toValue: 0,
              duration: fallDuration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(anims).start();

    // Auto complete timer
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [active, durationMs, onFinish]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity: containerOpacity }]}>
      {/* Glowing Bokeh Orbs */}
      {orbsRef.current.map((orb) => {
        const scale = orb.pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1.25],
        });
        const orbOpacity = orb.pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 0.8],
        });

        return (
          <Animated.View
            key={`orb-${orb.id}`}
            style={[
              styles.bokehOrb,
              {
                left: orb.x,
                top: orb.y,
                width: orb.size,
                height: orb.size,
                borderRadius: orb.size / 2,
                backgroundColor: orb.color,
                opacity: orbOpacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}

      {/* Floating Rose Petals */}
      {petalsRef.current.map((petal) => {
        const spin = petal.animRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '480deg'],
        });
        const translateX = petal.animDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [-24, 28],
        });

        return (
          <Animated.View
            key={`petal-${petal.id}`}
            style={[
              styles.petal,
              {
                left: petal.startX,
                width: petal.size,
                height: petal.size * 1.35,
                backgroundColor: petal.color,
                opacity: petal.opacity,
                transform: [
                  { translateY: petal.animY },
                  { translateX },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    overflow: 'hidden',
  },
  bokehOrb: {
    position: 'absolute',
    ...(Platform.OS === 'web'
      ? { filter: 'blur(22px)' }
      : { shadowColor: '#FF385C', shadowRadius: 30, shadowOpacity: 0.6, elevation: 8 }),
  },
  petal: {
    position: 'absolute',
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 2,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 4,
  },
});
