import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CandidateCard } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

interface MatchCelebrationModalProps {
  visible: boolean;
  candidate: CandidateCard | null;
  matchId?: string;
  onPlayIcebreaker: (matchId: string) => void;
  onOpenChat: (matchId: string, candidateName: string) => void;
  onKeepSwiping: () => void;
}

export default function MatchCelebrationModal({
  visible,
  candidate,
  matchId,
  onPlayIcebreaker,
  onOpenChat,
  onKeepSwiping,
}: MatchCelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      hapticFeedback.success();

      // Enter animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous heart pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
        scaleAnim.setValue(0.3);
        opacityAnim.setValue(0);
        heartPulseAnim.setValue(1);
      };
    }
  }, [visible]);

  if (!visible || !candidate) return null;

  const candidatePhoto = candidate.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';
  const myPhoto = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepSwiping}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          {/* Confetti & Sparkles Heading */}
          <Text style={styles.sparkleIcon}>✨ 🎉 ✨</Text>
          <Text style={styles.headline}>It’s a Vibe Match!</Text>
          <Text style={styles.subheadline}>
            You and <Text style={styles.boldName}>{candidate.displayName}</Text> both matched!
          </Text>

          {/* Avatars Collision with Pulsing Heart */}
          <View style={styles.avatarsWrapper}>
            <View style={[styles.avatarBox, styles.avatarLeft]}>
              <ExpoImage
                source={{ uri: myPhoto }}
                style={styles.avatarImage}
                contentFit="cover"
              />
              <View style={styles.avatarTag}>
                <Text style={styles.avatarTagText}>You</Text>
              </View>
            </View>

            <Animated.View
              style={[
                styles.heartBadge,
                { transform: [{ scale: heartPulseAnim }] },
              ]}>
              <Text style={styles.heartText}>💖</Text>
            </Animated.View>

            <View style={[styles.avatarBox, styles.avatarRight]}>
              <ExpoImage
                source={{ uri: candidatePhoto }}
                style={styles.avatarImage}
                contentFit="cover"
              />
              <View style={styles.avatarTag}>
                <Text style={styles.avatarTagText}>{candidate.displayName}</Text>
              </View>
            </View>
          </View>

          {/* Compatibility Pill */}
          <View style={styles.compatPill}>
            <Text style={styles.compatText}>
              ⚡ {candidate.compatibilityScore || 92}% Compatibility Vibe
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.infoText}>
            Break the ice with a 10-second rapid quiz or jump straight into the encrypted lounge!
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              hapticFeedback.medium();
              if (matchId) {
                onPlayIcebreaker(matchId);
              } else {
                onKeepSwiping();
              }
            }}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Play 10s Icebreaker ⚡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              hapticFeedback.medium();
              if (matchId) {
                onOpenChat(matchId, candidate.displayName);
              } else {
                onKeepSwiping();
              }
            }}
            activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Say Hi in Chat 💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.keepSwipingBtn}
            onPress={() => {
              hapticFeedback.light();
              onKeepSwiping();
            }}
            activeOpacity={0.7}>
            <Text style={styles.keepSwipingText}>Keep Swiping ↺</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: Math.min(width - 32, 380),
    backgroundColor: '#161823',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FF385C',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  sparkleIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  headline: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subheadline: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  boldName: {
    color: '#FF7B90',
    fontWeight: '800',
  },
  avatarsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 22,
    position: 'relative',
    height: 110,
    width: '100%',
  },
  avatarBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FF385C',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#202330',
  },
  avatarLeft: {
    transform: [{ translateX: 14 }],
    zIndex: 1,
  },
  avatarRight: {
    transform: [{ translateX: -14 }],
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarTag: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  avatarTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  heartBadge: {
    position: 'absolute',
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1424',
    borderWidth: 2,
    borderColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 18,
  },
  compatPill: {
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  compatText: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '800',
  },
  infoText: {
    color: '#7F8496',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#FF385C',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#202434',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#32384E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: '#E0E4F0',
    fontSize: 13,
    fontWeight: '700',
  },
  keepSwipingBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  keepSwipingText: {
    color: '#7C8294',
    fontSize: 12,
    fontWeight: '600',
  },
});
