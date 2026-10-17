import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { normalizeImageUrl } from '@/services/api';
import { hapticFeedback } from '@/utils/haptics';

interface DiscoveryVoiceSnippetProps {
  audioUri?: string | null;
  durationSec?: number;
  promptText?: string | null;
  displayName?: string;
}

export default function DiscoveryVoiceSnippet({
  audioUri,
  durationSec = 15,
  promptText,
  displayName = 'Candidate',
}: DiscoveryVoiceSnippetProps) {
  // If candidate has no custom audio, use clean preview or placeholder
  const resolvedUri = audioUri ? normalizeImageUrl(audioUri) : null;
  let player: any = null;
  let status: any = null;

  try {
    player = useAudioPlayer(resolvedUri, { updateInterval: 100 });
    status = useAudioPlayerStatus(player);
  } catch (err) {
    // Audio hardware fallback
  }

  // Waveform heights animated during playback
  const wave1 = useRef(new Animated.Value(6)).current;
  const wave2 = useRef(new Animated.Value(14)).current;
  const wave3 = useRef(new Animated.Value(10)).current;
  const wave4 = useRef(new Animated.Value(18)).current;

  const isPlaying = Boolean(status?.playing);
  const currentTime = status?.currentTime ?? 0;
  const totalDuration = (status?.duration && status.duration > 0) ? status.duration : durationSec;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(wave1, { toValue: 18, duration: 250, useNativeDriver: false }),
            Animated.timing(wave2, { toValue: 8, duration: 250, useNativeDriver: false }),
            Animated.timing(wave3, { toValue: 20, duration: 250, useNativeDriver: false }),
            Animated.timing(wave4, { toValue: 10, duration: 250, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(wave1, { toValue: 8, duration: 250, useNativeDriver: false }),
            Animated.timing(wave2, { toValue: 20, duration: 250, useNativeDriver: false }),
            Animated.timing(wave3, { toValue: 7, duration: 250, useNativeDriver: false }),
            Animated.timing(wave4, { toValue: 18, duration: 250, useNativeDriver: false }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      wave1.setValue(6);
      wave2.setValue(14);
      wave3.setValue(10);
      wave4.setValue(16);
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    hapticFeedback.light();
    if (!player || !resolvedUri) return;

    try {
      if (Platform.OS !== 'web') {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
        });
      }
    } catch {}

    if (isPlaying) {
      player.pause();
    } else {
      if (currentTime >= totalDuration && totalDuration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatSecs = (sec: number) => {
    const s = Math.floor(sec);
    return `0:${String(s).padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[styles.voicePromptPill, isPlaying && styles.voicePromptPillActive]}
      activeOpacity={0.8}
      onPress={togglePlay}>
      <View style={[styles.playBtnCircle, isPlaying && styles.playBtnCircleActive]}>
        <Text style={styles.playIconText}>{isPlaying ? '⏸' : '▶'}</Text>
      </View>

      {/* Animated Mini Waveform */}
      <View style={styles.waveformContainer}>
        <Animated.View style={[styles.waveBar, { height: wave1 }]} />
        <Animated.View style={[styles.waveBar, { height: wave2 }]} />
        <Animated.View style={[styles.waveBar, { height: wave3 }]} />
        <Animated.View style={[styles.waveBar, { height: wave4 }]} />
      </View>

      <Text style={styles.voicePromptDuration}>
        {isPlaying ? formatSecs(currentTime) : formatSecs(totalDuration)}
      </Text>

      <Text style={styles.voicePromptLabel} numberOfLines={1}>
        {promptText || `Hear ${displayName}'s authentic voice note`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  voicePromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 26, 0.78)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginTop: 4,
  },
  voicePromptPillActive: {
    borderColor: '#FF385C',
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
  },
  playBtnCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  playBtnCircleActive: {
    backgroundColor: '#FF385C',
  },
  playIconText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    gap: 3,
    marginRight: 8,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#FF385C',
    borderRadius: 2,
  },
  voicePromptDuration: {
    color: '#FF6584',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginRight: 6,
  },
  voicePromptLabel: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
