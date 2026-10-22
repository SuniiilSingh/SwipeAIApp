import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CandidateCard } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import { normalizeImageUrl } from '@/services/api';
import { MODEL_ASSETS, getModelAsset, resolveImageSource } from '@/constants/assets';

const { width } = Dimensions.get('window');

interface MatchCelebrationModalProps {
  visible: boolean;
  candidate: CandidateCard | null;
  myPhoto?: string;
  matchId?: string;
  onPlayIcebreaker: (matchId: string) => void;
  onOpenChat: (matchId: string, candidateName: string) => void;
  onKeepSwiping: () => void;
}

export default function MatchCelebrationModal({
  visible,
  candidate,
  myPhoto,
  matchId,
  onPlayIcebreaker,
  onOpenChat,
  onKeepSwiping,
}: MatchCelebrationModalProps) {
  const [messageText, setMessageText] = useState('');
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
        setMessageText('');
      };
    }
  }, [visible]);

  if (!visible || !candidate) return null;

  const candidatePhoto = resolveImageSource(normalizeImageUrl(candidate.photos?.[0]), getModelAsset(candidate.displayName));
  const currentMyPhoto = resolveImageSource(normalizeImageUrl(myPhoto), MODEL_ASSETS.defaultAvatar);

  const handleSendMessage = () => {
    hapticFeedback.medium();
    if (matchId) {
      onOpenChat(matchId, candidate.displayName);
    } else {
      onKeepSwiping();
    }
  };

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
          {/* Confetti / Sparkles Header */}
          <Text style={styles.sparkleIcon}>✨ ✨ ✨</Text>
          <Text style={styles.headline}>IT’S A MATCH!</Text>
          <Text style={styles.subheadline}>
            You and <Text style={styles.boldName}>{candidate.displayName}</Text> liked each other
          </Text>

          {/* Intersecting Avatars with Neon Glowing Rings */}
          <View style={styles.avatarsWrapper}>
            <View style={[styles.avatarBox, styles.avatarLeft]}>
              <ExpoImage
                source={currentMyPhoto}
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
                source={candidatePhoto}
                style={styles.avatarImage}
                contentFit="cover"
              />
              <View style={styles.avatarTag}>
                <Text style={styles.avatarTagText}>{candidate.displayName}</Text>
              </View>
            </View>
          </View>

          {/* Quick Icebreaker Input Box */}
          <View style={styles.inputBoxWrap}>
            <TextInput
              style={styles.messageInput}
              placeholder={`Say something witty to ${candidate.displayName}... 🍸`}
              placeholderTextColor="#94A3B8"
              value={messageText}
              onChangeText={setMessageText}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <View style={styles.micIconWrap}>
              <Text style={{ fontSize: 16 }}>🎙️</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSendMessage}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>
              {messageText.trim().length > 0 ? 'Send Message 💬' : 'Send a Message'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              hapticFeedback.medium();
              if (matchId) {
                onPlayIcebreaker(matchId);
              } else {
                onKeepSwiping();
              }
            }}
            activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Play 10s Icebreaker Quiz ⚡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.keepSwipingBtn}
            onPress={() => {
              hapticFeedback.light();
              onKeepSwiping();
            }}
            activeOpacity={0.7}>
            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
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
    backgroundColor: '#0C0D14',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FF2B66',
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 10px 40px rgba(255, 43, 102, 0.45)' },
      default: {
        shadowColor: '#FF2B66',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 12,
      },
    }),
  },
  sparkleIcon: {
    fontSize: 20,
    marginBottom: 6,
    letterSpacing: 4,
  },
  headline: {
    color: '#FF2B66',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subheadline: {
    color: '#E2E8F0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  boldName: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  avatarsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
    height: 110,
    width: '100%',
  },
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FF2B66',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#161822',
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#140810',
    borderWidth: 2,
    borderColor: '#FF2B66',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 0px 15px rgba(255, 43, 102, 0.7)' },
      default: {
        shadowColor: '#FF2B66',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  heartText: {
    fontSize: 20,
  },
  inputBoxWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161824',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  messageInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 13,
  },
  micIconWrap: {
    paddingLeft: 8,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF2B66',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0px 4px 15px rgba(255, 43, 102, 0.5)' },
      default: {
        shadowColor: '#FF2B66',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#1A1D2B',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
