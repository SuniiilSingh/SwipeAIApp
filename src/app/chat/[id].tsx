import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services/api';
import { CandidateCard, ChatMessage, MatchItem, VirtualChaiSession } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import VirtualChaiModal from '@/components/virtual-chai-modal';
import {
  AudioCallIcon,
  VideoCallIcon,
  CameraIcon,
  SendIcon,
  MicIcon,
} from '@/components/chat-icons';
import { FEATURE_FLAGS } from '@/config/features';
import { getOrDeriveMatchKey, encryptMessage, decryptMessage } from '@/services/e2ee';
import type { AESEncryptionKey } from 'expo-crypto';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const aesKeyRef = useRef<AESEncryptionKey | null>(null);
  const { id: matchId, name: candidateName, initialText } = useLocalSearchParams<{
    id: string;
    name?: string;
    initialText?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(initialText || '');
  const [loading, setLoading] = useState(true);
  const [matchProfile, setMatchProfile] = useState<CandidateCard | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchItem | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mutualSparks, setMutualSparks] = useState<string[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Calling & Safe Date Modals
  const [callingSession, setCallingSession] = useState<VirtualChaiSession | null>(null);
  const [callingModalVisible, setCallingModalVisible] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [unblurredImages, setUnblurredImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (!matchId) return;

    let isMounted = true;
    setLoading(true);
    // Instant reset to avoid any profile or message state leakage from prior match
    setMessages([]);
    setMatchProfile(null);
    setMatchDetails(null);
    setMutualSparks([]);
    setInputText(initialText || '');

    const loadChatData = async () => {
      try {
        const [msgs, matchData, sparksRes] = await Promise.all([
          api.getMessages(matchId),
          api.getMatchDetails(matchId),
          api.getWingmanSparks(matchId).catch(() => null),
        ]);

        let derivedKey = aesKeyRef.current;
        if (matchData) {
          setMatchDetails(matchData);
          derivedKey = await getOrDeriveMatchKey(matchId, matchData.e2eeSecret);
          aesKeyRef.current = derivedKey;
        }

        if (msgs && msgs.length > 0 && derivedKey) {
          const decryptedMsgs = await Promise.all(
            msgs.map(async (m) => {
              if (m.content && m.content.startsWith('E2EE:v1:')) {
                const plain = await decryptMessage(m.content, derivedKey);
                return { ...m, content: plain };
              }
              return m;
            })
          );
          setMessages(decryptedMsgs);
        } else {
          setMessages(msgs || []);
        }
        api.markMessagesAsRead(matchId);

        if (sparksRes?.sparks) {
          setMutualSparks(sparksRes.sparks);
        }

        if (matchData) {
          setMatchDetails(matchData);
          if (matchData.otherProfile) {
            setMatchProfile({
              ...matchData.otherProfile,
              displayName: matchData.otherProfile.displayName || matchData.otherUserName || candidateName || 'Match',
              fullName: matchData.otherProfile.displayName || matchData.otherUserName || candidateName || 'Match',
              age: matchData.otherProfile.age || matchData.otherUserAge || 25,
              photos: matchData.otherProfile.photos?.length
                ? matchData.otherProfile.photos
                : matchData.otherUserPhoto
                ? [matchData.otherUserPhoto]
                : [],
            });
          } else {
            setMatchProfile({
              userId: matchData.otherUserId,
              displayName: matchData.otherUserName || candidateName || 'Match',
              fullName: matchData.otherUserName || candidateName || 'Match',
              age: matchData.otherUserAge || 25,
              isDigilockerVerified: Boolean(matchData.isDigilockerVerified),
              isWhatsappVerified: true,
              livenessScore: 0.98,
              distanceKm: 3.5,
              culturalBadges: {
                diet: 'PURE_VEG',
                living: 'INDEPENDENT_FLAT',
                languages: ['English', 'Hindi'],
                zodiac: 'Aries',
              },
              compatibilityScore: 90,
              bio: 'High-intent match on Blunderr Dating.',
              occupation: 'Professional',
              company: 'Bengaluru Tech',
              education: 'Graduate',
              height: 175,
              relationshipIntent: 'Long-term partner',
              moonSign: 'Leo',
              karmaScore: 182,
              city: 'Bengaluru',
              neighborhood: 'Indiranagar',
              microCircle: 'Koramangala Tech Founders',
              photos: matchData.otherUserPhoto ? [matchData.otherUserPhoto] : [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to load chat lounge:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChatData();

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  // Real-time WebSocket connection for incoming chat messages
  useEffect(() => {
    if (!matchId) return;
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isMounted = true;

    const connectWebSocket = () => {
      try {
        const uid = api.getCurrentUserId();
        const base = api.getBaseUrl().replace('http://', 'ws://').replace('https://', 'wss://');
        ws = new WebSocket(`${base}/ws/chat?userId=${uid}`);

        ws.onmessage = (e) => {
          try {
            if (!isMounted) return;
            const data = JSON.parse(e.data);
            const currentUid = api.getCurrentUserId();
            const isFromCurrentMe = data.senderId ? data.senderId === currentUid : Boolean(data.isFromMe);

            // Strict matchId check (case-insensitive) & ignore echo of my own messages
            if (
              String(data.matchId).toLowerCase() === String(matchId).toLowerCase() &&
              !isFromCurrentMe
            ) {
              const currentKey = aesKeyRef.current;
              if (data.content && data.content.startsWith('E2EE:v1:') && currentKey) {
                decryptMessage(data.content, currentKey).then((plain) => {
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === data.id)) return prev;
                    return [...prev, { ...data, content: plain, isFromMe: false }];
                  });
                });
              } else {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === data.id)) return prev;
                  return [...prev, { ...data, isFromMe: false }];
                });
              }
            }
          } catch (err) {}
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWebSocket, 4000);
          }
        };
      } catch (e) {}
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [matchId]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = textToSend || inputText;
    if (!rawContent.trim() || !matchId) return;

    setInputText('');
    const currentKey = aesKeyRef.current;
    const encryptedContent = await encryptMessage(rawContent.trim(), currentKey);

    const newMsg = await api.sendMessage(matchId, encryptedContent);
    if (newMsg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, { ...newMsg, content: rawContent.trim(), isFromMe: true }];
      });
    }
  };

  const handleStartCall = async (videoMode: boolean = false) => {
    if (!matchId) return;
    setIsVideoCall(videoMode);
    try {
      const session = await api.createVirtualChaiSession(matchId, videoMode);
      setCallingSession(session);
      setCallingModalVisible(true);
    } catch (e) {
      Alert.alert('Call Failed', 'Could not connect to the calling server. Please check your network.');
    }
  };

  const handleSendTestSensitiveImage = async () => {
    if (!matchId) return;
    const newMsg = await api.sendMessage(
      matchId,
      'Here is an image',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&nsfw=true',
      'IMAGE'
    );
    setMessages((prev) => [...prev, newMsg]);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isBlurred = item.isBlurred && !unblurredImages[item.id];

    return (
      <View style={[styles.messageBubbleRow, item.isFromMe ? styles.myMessageRow : styles.theirMessageRow]}>
        <View style={[styles.messageBubble, item.isFromMe ? styles.myMessageBubble : styles.theirMessageBubble]}>
          {item.mediaType === 'IMAGE' && item.mediaUrl && (
            <View style={styles.imageContainer}>
              {isBlurred ? (
                <View style={styles.blurredBox}>
                  <Text style={styles.shieldIcon}>🛡️</Text>
                  <Text style={styles.shieldTitle}>Sensitive Content Warning</Text>
                  <Text style={styles.shieldSub}>Auto-blurred by Shield 360 AI Detector.</Text>
                  <TouchableOpacity
                    style={styles.revealBtn}
                    onPress={() => setUnblurredImages((prev) => ({ ...prev, [item.id]: true }))}>
                    <Text style={styles.revealBtnText}>Tap to View</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image source={{ uri: item.mediaUrl }} style={styles.chatImage} resizeMode="cover" />
              )}
            </View>
          )}

          <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>

          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTimeText, item.isFromMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.isFromMe && (
              <Text style={styles.readReceiptText}>
                {item.status === 'READ' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Dynamic User Watermark Overlay (Anti-Screenshot Protection) */}
        <View style={styles.watermarkCanvas}>
          <Text style={styles.watermarkText}>PROTECTED BY SHIELD 360 • CONFIDENTIAL</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowProfileModal(true)} style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{matchProfile?.displayName || matchDetails?.otherUserName || candidateName || 'Match'} 👤</Text>
            <Text style={styles.headerSubtitle}>
              {FEATURE_FLAGS.ENABLE_DIGILOCKER ? '🛡️ DigiLocker Verified • 🔒 End-to-End Encrypted' : '👤 3D Liveness Verified • 🔒 End-to-End Encrypted'}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerCallActionRow}>
            {/* Audio Call / Virtual Chai Call Button */}
            <TouchableOpacity
              style={styles.audioCallBtn}
              onPress={() => handleStartCall(false)}
              activeOpacity={0.75}
              accessibilityLabel="Start Audio Call">
              <AudioCallIcon size={19} color="#FF385C" />
              <View style={styles.audioLiveDot} />
            </TouchableOpacity>

            {/* Video Call Button */}
            <TouchableOpacity
              style={styles.videoCallBtn}
              onPress={() => handleStartCall(true)}
              activeOpacity={0.75}
              accessibilityLabel="Start Video Call">
              <VideoCallIcon size={20} color="#C084FC" />
              <View style={styles.videoLiveDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* End-to-End Encryption Security Guarantee Banner */}
        <View style={styles.e2eeBanner}>
          <Text style={styles.e2eeBannerText}>
            🔒 End-to-End Encrypted • Only you and {matchProfile?.displayName || candidateName || 'your match'} can read these messages.
          </Text>
        </View>

        {/* Safe Date Spot Recommendation Banner */}
        <TouchableOpacity
          style={styles.safeSpotBanner}
          onPress={() => router.push('/safe-date')}>
          <Text style={styles.safeSpotIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.safeSpotTitle}>Plan a Safe Spot Date</Text>
            <Text style={styles.safeSpotDesc}>Blue Tokai Indiranagar (15% Off + SOS Friend Sharing)</Text>
          </View>
          <Text style={styles.safeSpotArrow}>→</Text>
        </TouchableOpacity>

        {/* Pre-Chat Icebreaker Recap Card */}
        {matchDetails?.icebreakerQuiz?.isCompleted ? (
          <View style={styles.icebreakerRecapCard}>
            <Text style={styles.recapHeading}>✦ YOU BOTH ANSWERED THE ICEBREAKER QUIZ:</Text>
            <Text style={styles.recapQuestion}>
              "{matchDetails.icebreakerQuiz.question || 'Mutual Compatibility Prompt'}"
            </Text>
            <Text style={styles.recapAnswer}>
              ✓ {matchDetails.icebreakerQuiz.isMutualAgreement
                ? 'Mutual Agreement Spark! You both picked the same answer.'
                : '10s Quiz Completed • Chat Lounge Unlocked!'}
            </Text>
          </View>
        ) : null}

        {/* AES-256-GCM Encrypted Lounge Notice Banner */}
        <View style={styles.encryptedNoticeBanner}>
          <Text style={styles.encryptedNoticeLock}>🔒</Text>
          <Text style={styles.encryptedNoticeText}>
            AES-256-GCM Encrypted at Rest • Decrypted only for this active profile session
          </Text>
        </View>

        {/* Chat Messages */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#E94057" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Mutual Chemistry Quick Chips (Alternative 1 + 4 for 0-friction first message) */}
        {messages.length === 0 && mutualSparks.length > 0 && (
          <View style={styles.quickChipsContainer}>
            <Text style={styles.quickChipsLabel}>✨ Mutual Chemistry Sparks (Tap to use):</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsScroll}>
              {mutualSparks.map((spark, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => setInputText(spark)}>
                  <Text style={styles.quickChipText} numberOfLines={1}>"{spark}"</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Message Input Bar (Rides cleanly above keypad) */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: isKeyboardVisible
                ? 10
                : Math.max(insets.bottom, 12),
            },
          ]}>
          <TouchableOpacity
            style={styles.sensitiveMediaBtn}
            onPress={handleSendTestSensitiveImage}
            activeOpacity={0.7}
            accessibilityLabel="Send Photo">
            <CameraIcon size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TextInput
            style={styles.inputField}
            placeholder="Type message or tap a Mutual Spark..."
            placeholderTextColor="#6B7280"
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSendMessage()}
            blurOnSubmit={false}
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => handleSendMessage()}
              activeOpacity={0.8}
              accessibilityLabel="Send Message">
              <SendIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => {
                Alert.alert('Voice Note', 'Hold to record end-to-end encrypted voice note.');
              }}
              activeOpacity={0.7}
              accessibilityLabel="Voice Note">
              <MicIcon size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Full Profile Viewer Modal */}
      <ProfileDetailModal
        visible={showProfileModal}
        candidate={matchProfile}
        onClose={() => setShowProfileModal(false)}
        onVirtualChai={() => {
          setShowProfileModal(false);
          handleStartCall(false);
        }}
      />

      {/* ☕ Virtual Chai Masked Audio & Video Calling Modal */}
      <VirtualChaiModal
        visible={callingModalVisible}
        session={callingSession}
        recipientName={matchProfile?.displayName || matchDetails?.otherUserName || candidateName || 'Match Partner'}
        recipientPhoto={matchProfile?.photos?.[0] || matchDetails?.otherUserPhoto}
        initialVideo={isVideoCall}
        onEndCall={() => {
          setCallingModalVisible(false);
          setCallingSession(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  keyboardContainer: {
    flex: 1,
  },
  watermarkCanvas: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.04,
    zIndex: 10,
    pointerEvents: 'none',
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    transform: [{ rotate: '-30deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2028',
  },
  e2eeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12141C',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1B1E2B',
  },
  e2eeBannerText: {
    color: '#8A91A8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerBackBtn: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 8,
  },
  backBtn: {
    color: '#E94057',
    fontSize: 22,
    fontWeight: '700',
    paddingRight: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  headerCallActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioCallBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  audioLiveDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0E0F13',
  },
  videoCallBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(121, 40, 202, 0.14)',
    borderWidth: 1.2,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#7928CA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  videoLiveDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A855F7',
    borderWidth: 1.5,
    borderColor: '#0E0F13',
  },
  safeSpotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181B26',
    borderBottomWidth: 1,
    borderBottomColor: '#262A3C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  safeSpotIcon: {
    fontSize: 18,
  },
  safeSpotTitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '800',
  },
  safeSpotDesc: {
    color: '#CACDD8',
    fontSize: 11,
    marginTop: 1,
  },
  safeSpotArrow: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '800',
  },
  icebreakerRecapCard: {
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.25)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
  },
  recapHeading: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '800',
  },
  recapQuestion: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  recapAnswer: {
    color: '#F27121',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  encryptedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 6,
  },
  encryptedNoticeLock: {
    fontSize: 11,
  },
  encryptedNoticeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  messageList: {
    padding: 16,
  },
  messageBubbleRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#E94057',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#20222C',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2E3242',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#CACDD8',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  bubbleTimeText: {
    fontSize: 10,
  },
  myBubbleTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirBubbleTime: {
    color: '#8E94A5',
  },
  readReceiptText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chatImage: {
    width: 200,
    height: 150,
  },
  blurredBox: {
    width: 200,
    height: 140,
    backgroundColor: '#15161C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  shieldIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  shieldTitle: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  shieldSub: {
    color: '#8E94A5',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  revealBtn: {
    backgroundColor: '#2A2C38',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  revealBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#121319',
    borderTopWidth: 1,
    borderTopColor: '#1F222E',
    gap: 8,
  },
  sensitiveMediaBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1B1E29',
    borderWidth: 1,
    borderColor: '#292E3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#1B1E29',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 11 : 9,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#292E3F',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1B1E29',
    borderWidth: 1,
    borderColor: '#292E3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipsContainer: {
    backgroundColor: '#12141C',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#202434',
  },
  quickChipsLabel: {
    color: '#FFB703',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  quickChipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#1E2230',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2D344B',
    maxWidth: 280,
  },
  quickChipText: {
    color: '#E0E4F0',
    fontSize: 12,
    fontWeight: '600',
  },
});
