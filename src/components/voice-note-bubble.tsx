import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PlayIcon, PauseIcon } from './chat-icons';

interface VoiceNoteBubbleProps {
  audioUri: string;
  isFromMe: boolean;
}

export default function VoiceNoteBubble({ audioUri, isFromMe }: VoiceNoteBubbleProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  let player: any = null;
  let status: any = null;

  try {
    player = useAudioPlayer(audioUri);
    status = useAudioPlayerStatus(player);
  } catch (err) {
    // Fallback if audio hardware unavailable
  }

  const isPlaying = Boolean(status?.playing);
  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      if (currentTime >= duration && duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const cycleSpeed = () => {
    const nextSpeed: 1 | 1.5 | 2 = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    try {
      player?.setPlaybackRate?.(nextSpeed);
    } catch {}
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playBtn, isFromMe ? styles.myPlayBtn : styles.theirPlayBtn]}
        onPress={togglePlay}
        activeOpacity={0.8}>
        {isPlaying ? <PauseIcon size={14} color="#FFF" /> : <PlayIcon size={14} color="#FFF" />}
      </TouchableOpacity>

      <View style={styles.waveSection}>
        <View style={styles.waveBarRow}>
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 40, 70].map((h, i) => {
            const barProgress = (i / 14) * 100;
            const isPlayed = barProgress <= progressPercent;
            return (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: (h / 100) * 22 },
                  isPlayed
                    ? isFromMe
                      ? styles.barPlayedMy
                      : styles.barPlayedTheir
                    : styles.barUnplayed,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.timerRow}>
          <Text style={styles.timerText}>
            {isPlaying ? formatTime(currentTime) : duration > 0 ? formatTime(duration) : 'Voice note'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed} activeOpacity={0.7}>
        <Text style={styles.speedText}>{playbackSpeed}x</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 200,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPlayBtn: {
    backgroundColor: '#7C3AED',
  },
  theirPlayBtn: {
    backgroundColor: '#E11D48',
  },
  waveSection: {
    flex: 1,
    justifyContent: 'center',
  },
  waveBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 24,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  barPlayedMy: {
    backgroundColor: '#FFFFFF',
  },
  barPlayedTheir: {
    backgroundColor: '#F43F5E',
  },
  barUnplayed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  timerRow: {
    marginTop: 2,
  },
  timerText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '600',
  },
  speedBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
