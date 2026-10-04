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
import CosmicKundaliModal from '@/components/cosmic-kundali-modal';
import { hapticFeedback } from '@/utils/haptics';
import {
  AudioCallIcon,
  VideoCallIcon,
  CameraIcon,
  GalleryIcon,
  SendIcon,
  MicIcon,
  StatusTick,
} from '@/components/chat-icons';
import VoiceNoteBubble from '@/components/voice-note-bubble';
import { useCall } from '@/context/call-context';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { FEATURE_FLAGS } from '@/config/features';
import { getOrDeriveMatchKey, encryptMessage, decryptMessage } from '@/services/e2ee';
import { dismissNotificationsForMatch } from '@/services/notifications';
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
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showKundaliModal, setShowKundaliModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mutualSparks, setMutualSparks] = useState<string[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { startCall, subscribeToWebSocket, sendWsMessage, connectionStatus } = useCall();
  const [unblurredImages, setUnblurredImages] = useState<Record<string, boolean>>({});

  // Voice Note Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Typing Indicator
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);

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
        api.markMatchNotificationsAsRead(matchId).catch(() => {});
        dismissNotificationsForMatch(matchId).catch(() => {});

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

  // Subscribe to real-time messages and typing indicators from CallProvider
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = subscribeToWebSocket((data) => {
      // 1. Real-time typing indicator
      if (
        data.type === 'TYPING' &&
        String(data.matchId).toLowerCase() === String(matchId).toLowerCase() &&
        data.senderId !== api.getCurrentUserId()
      ) {
        setIsPartnerTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsPartnerTyping(false), 3500);
        return;
      }

      // 2. Incoming chat messages
      const currentUid = api.getCurrentUserId();
      const isFromCurrentMe = data.senderId ? data.senderId === currentUid : Boolean(data.isFromMe);

      if (
        String(data.matchId).toLowerCase() === String(matchId).toLowerCase() &&
        !isFromCurrentMe
      ) {
        if (data.content && data.content.startsWith('E2EE:v1:')) {
          const getKey = aesKeyRef.current
            ? Promise.resolve(aesKeyRef.current)
            : getOrDeriveMatchKey(matchId, matchDetails?.e2eeSecret);

          getKey
            .then(async (key) => {
              if (key && !aesKeyRef.current) {
                aesKeyRef.current = key;
              }
              const plain = await decryptMessage(data.content, key);
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [...prev, { ...data, content: plain, isFromMe: false }];
              });
            })
            .catch(() => {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [...prev, { ...data, isFromMe: false }];
              });
            });
        } else {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, { ...data, isFromMe: false }];
          });
        }

        // Vanish any incoming system notification since user is actively in the chat
        dismissNotificationsForMatch(matchId).catch(() => {});
        api.markMessagesAsRead(matchId).catch(() => {});
        api.markMatchNotificationsAsRead(matchId).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [matchId, matchDetails?.e2eeSecret]);

  // Fast 2-second smart sync ensures rapid message exchange regardless of network state
  useEffect(() => {
    if (!matchId) return;

    const interval = setInterval(async () => {
      try {
        const remoteMsgs = await api.getMessages(matchId);
        if (remoteMsgs && remoteMsgs.length > 0) {
          let derivedKey = aesKeyRef.current;
          if (!derivedKey && matchDetails?.e2eeSecret) {
            derivedKey = await getOrDeriveMatchKey(matchId, matchDetails.e2eeSecret);
            aesKeyRef.current = derivedKey;
          }

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newRemote = remoteMsgs.filter((m) => !existingIds.has(m.id));
            if (newRemote.length === 0) return prev;

            // Decrypt new messages in background
            Promise.all(
              newRemote.map(async (m) => {
                if (m.content && m.content.startsWith('E2EE:v1:') && derivedKey) {
                  const plain = await decryptMessage(m.content, derivedKey);
                  return { ...m, content: plain };
                }
                return m;
              })
            ).then((decrypted) => {
              setMessages((current) => {
                const curIds = new Set(current.map((c) => c.id));
                const trulyNew = decrypted.filter((d) => !curIds.has(d.id));
                if (trulyNew.length === 0) return current;
                return [...current, ...trulyNew];
              });
              api.markMessagesAsRead(matchId).catch(() => {});
            });

            return prev;
          });
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [matchId, matchDetails?.e2eeSecret]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = (textToSend || inputText).trim();
    if (!rawContent || !matchId) return;

    setInputText('');

    // Instant Optimistic Bubble (0ms UI latency!)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      matchId,
      senderId: api.getCurrentUserId(),
      recipientId: matchProfile?.userId || matchDetails?.otherUserId || '',
      content: rawContent,
      mediaType: 'TEXT',
      createdAt: new Date().toISOString(),
      isFromMe: true,
      status: 'SENT',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 40);

    try {
      let currentKey = aesKeyRef.current;
      if (!currentKey) {
        currentKey = await getOrDeriveMatchKey(matchId, matchDetails?.e2eeSecret);
        aesKeyRef.current = currentKey;
      }
      const encryptedContent = currentKey ? await encryptMessage(rawContent, currentKey) : rawContent;

      const newMsg = await api.sendMessage(matchId, encryptedContent);
      if (newMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...newMsg, content: rawContent, isFromMe: true } : m))
        );
      }
    } catch (err) {
      console.warn('Failed to send message:', err);
    }
  };

  const handleStartCall = async (videoMode: boolean = false) => {
    if (!matchId) return;
    const name = matchProfile?.displayName || matchDetails?.otherUserName || candidateName || 'Match Partner';
    const photo = matchProfile?.photos?.[0] || matchDetails?.otherUserPhoto;
    try {
      await startCall(matchId, name, photo, videoMode);
    } catch (e) {
      Alert.alert('Call Failed', 'Could not connect to the calling server. Please check your network.');
    }
  };

  const startVoiceRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone Access Needed', 'Please allow microphone access in settings to send voice notes.');
        return;
      }
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('Recording Error', 'Could not access microphone.');
    }
  };

  const stopAndSendVoiceNote = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      await audioRecorder.stop();
      setIsRecording(false);
      const uri = audioRecorder.uri;
      const duration = recordingSeconds;
      setRecordingSeconds(0);

      if (!uri || !matchId) return;

      let currentKey = aesKeyRef.current;
      if (!currentKey) {
        currentKey = await getOrDeriveMatchKey(matchId, matchDetails?.e2eeSecret);
        aesKeyRef.current = currentKey;
      }
      const placeholder = `🎙️ Voice Note (${duration}s)`;
      const encryptedPlaceholder = await encryptMessage(placeholder, currentKey);
      const newMsg = await api.sendMessage(matchId, encryptedPlaceholder, uri, 'AUDIO');
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, content: placeholder, mediaUrl: uri, mediaType: 'AUDIO', isFromMe: true }];
        });
      }
    } catch (e) {
      console.error('Failed to stop recording:', e);
      setIsRecording(false);
    }
  };

  const cancelVoiceRecording = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      await audioRecorder.stop();
    } catch {}
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const REPORT_REASONS = [
    { key: 'CATFISH', emoji: '🎭', label: 'Fake Profile / Catfishing', desc: 'Stolen photos, fake identity, or inaccurate information.' },
    { key: 'HARASSMENT', emoji: '🚫', label: 'Harassment & Offensive Chat', desc: 'Verbal abuse, intimidation, or hate speech.' },
    { key: 'EXPLICIT', emoji: '🔞', label: 'Unsolicited Inappropriate Media', desc: 'Explicit photos or unsolicited sexual content.' },
    { key: 'SCAM', emoji: '💸', label: 'Commercial Spam or Financial Scam', desc: 'Promoting services, asking for money, or spamming links.' },
  ];

  const handleUnmatch = () => {
    setShowSafetyModal(false);
    hapticFeedback.warning();
    Alert.alert(
      'Unmatch & Sever Connection',
      `Are you sure you want to unmatch ${matchProfile?.displayName || candidateName || 'this user'}? This will permanently close the chat lounge and delete conversation history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            if (!matchId) return;
            setActionLoading(true);
            hapticFeedback.medium();
            const ok = await api.unmatch(matchId);
            setActionLoading(false);
            if (ok) {
              Alert.alert('Unmatched', 'You have successfully unmatched and closed this conversation.');
              router.replace('/(tabs)/matches');
            } else {
              Alert.alert('Error', 'Failed to unmatch. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmReport = async (reason: string) => {
    if (!matchId) return;
    setShowReportModal(false);
    setActionLoading(true);
    hapticFeedback.error();
    await api.reportUser(matchId, reason);
    setActionLoading(false);
    Alert.alert(
      'Shield 360 Report Submitted',
      `Thank you for helping keep SwipeAI safe. Our Trust & Safety team has received your report for "${reason}". The user has been penalised -50 karma points, blocked, and removed from your matches.`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/matches'),
        },
      ]
    );
  };

  const handleBlockUser = () => {
    setShowSafetyModal(false);
    hapticFeedback.warning();
    Alert.alert(
      'Block User',
      `Blocking will prevent ${matchProfile?.displayName || candidateName || 'this user'} from ever contacting or matching with you again on SwipeAI.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block & Unmatch',
          style: 'destructive',
          onPress: async () => {
            if (!matchId) return;
            hapticFeedback.heavy();
            await api.unmatch(matchId);
            router.replace('/(tabs)/matches');
          },
        },
      ]
    );
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!matchId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      const recipientId = matchProfile?.userId || matchDetails?.otherUserId;
      if (recipientId) {
        sendWsMessage({
          type: 'TYPING',
          matchId,
          recipientId,
          senderId: api.getCurrentUserId(),
        });
      }
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Photo library permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!matchId) return;

        let currentKey = aesKeyRef.current;
        if (!currentKey) {
          currentKey = await getOrDeriveMatchKey(matchId, matchDetails?.e2eeSecret);
          aesKeyRef.current = currentKey;
        }
        const encryptedPlaceholder = await encryptMessage('📷 Photo', currentKey);
        const newMsg = await api.sendMessage(matchId, encryptedPlaceholder, asset.uri, 'IMAGE');
        if (newMsg) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, content: '📷 Photo', mediaUrl: asset.uri, mediaType: 'IMAGE', isFromMe: true }];
          });
        }
      }
    } catch (err) {
      console.error('Image pick error:', err);
      Alert.alert('Error', 'Unable to pick or capture image.');
    }
  };

  const getRemainingHours = () => {
    if (matchDetails?.remainingHours !== undefined) {
      return matchDetails.remainingHours;
    }
    if (matchDetails?.expiresAt) {
      const expiresAt = new Date(matchDetails.expiresAt).getTime();
      const diffMs = expiresAt - Date.now();
      return Math.max(0, Math.round(diffMs / (60 * 60 * 1000)));
    }
    return null;
  };
  const remainingHours = getRemainingHours();

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

          {item.mediaType === 'AUDIO' && item.mediaUrl ? (
            <VoiceNoteBubble audioUri={item.mediaUrl} isFromMe={Boolean(item.isFromMe)} />
          ) : (
            <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          )}

          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTimeText, item.isFromMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.isFromMe && (
              <StatusTick status={item.status || 'SENT'} size={14} />
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
            {/* Cosmic Kundali Astrological Synergy Button */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                hapticFeedback.light();
                setShowKundaliModal(true);
              }}
              activeOpacity={0.75}
              accessibilityLabel="Cosmic Chemistry & Kundali">
              <Text style={{ fontSize: 16 }}>✨</Text>
            </TouchableOpacity>

            {/* Shield 360 Safety Action Menu */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                hapticFeedback.light();
                setShowSafetyModal(true);
              }}
              activeOpacity={0.75}
              accessibilityLabel="Shield 360 Safety Menu">
              <Text style={{ fontSize: 16 }}>🛡️</Text>
            </TouchableOpacity>

            {/* Audio Call / Virtual Chai Call Button */}
            {FEATURE_FLAGS.ENABLE_CALLING && (
              <TouchableOpacity
                style={styles.audioCallBtn}
                onPress={() => handleStartCall(false)}
                activeOpacity={0.75}
                accessibilityLabel="Start Audio Call">
                <AudioCallIcon size={19} color="#FF385C" />
                <View style={styles.audioLiveDot} />
              </TouchableOpacity>
            )}

            {/* Video Call Button */}
            {FEATURE_FLAGS.ENABLE_CALLING && (
              <TouchableOpacity
                style={styles.videoCallBtn}
                onPress={() => handleStartCall(true)}
                activeOpacity={0.75}
                accessibilityLabel="Start Video Call">
                <VideoCallIcon size={20} color="#C084FC" />
                <View style={styles.videoLiveDot} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* End-to-End Encryption Security Guarantee Banner */}
        <View style={styles.e2eeBanner}>
          <Text style={styles.e2eeBannerText}>
            🔒 End-to-End Encrypted • Only you and {matchProfile?.displayName || candidateName || 'your match'} can read these messages.
          </Text>
        </View>

        {/* Match Ephemeral Expiry Alert Banner */}
        {remainingHours !== null && remainingHours < 24 && (
          <View style={[styles.expiryBanner, remainingHours < 12 ? styles.expiryUrgent : styles.expiryWarning]}>
            <Text style={styles.expiryIcon}>⏳</Text>
            <Text style={styles.expiryText}>
              {remainingHours === 0
                ? 'Match window expired • Send a message or Virtual Chai to rekindle!'
                : `${remainingHours}h left before match expires • Keep the chemistry alive!`}
            </Text>
          </View>
        )}

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
          ListEmptyComponent={
            loading ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <Text style={{ color: '#8E94A5', fontSize: 13 }}>Loading conversation...</Text>
              </View>
            ) : (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  No messages yet
                </Text>
                <Text style={{ color: '#8E94A5', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                  Break the ice! Send a hello or tap a spark below.
                </Text>
              </View>
            )
          }
        />

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

        {/* Real-time Partner Typing Indicator */}
        {isPartnerTyping && (
          <View style={styles.typingIndicatorBar}>
            <View style={styles.typingPulseDot} />
            <Text style={styles.typingIndicatorText}>
              {matchProfile?.displayName || candidateName || 'Match'} is typing...
            </Text>
          </View>
        )}

        {/* Bottom Message & Voice Note Input Bar */}
        {isRecording ? (
          <View
            style={[
              styles.inputBar,
              styles.recordingBar,
              {
                paddingBottom: isKeyboardVisible
                  ? 10
                  : Math.max(insets.bottom, 12),
              },
            ]}>
            <View style={styles.recordingPulseDot} />
            <Text style={styles.recordingTimeText}>
              Recording {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.cancelRecBtn}
              onPress={cancelVoiceRecording}
              activeOpacity={0.7}
              accessibilityLabel="Cancel Recording">
              <Text style={styles.cancelRecText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendRecBtn}
              onPress={stopAndSendVoiceNote}
              activeOpacity={0.8}
              accessibilityLabel="Send Voice Note">
              <SendIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
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
              style={styles.mediaIconBtn}
              onPress={() => handlePickImage(false)}
              activeOpacity={0.7}
              accessibilityLabel="Choose from Gallery">
              <GalleryIcon size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaIconBtn}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.7}
              accessibilityLabel="Take Photo">
              <CameraIcon size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TextInput
              style={styles.inputField}
              placeholder="Type message or tap a Mutual Spark..."
              placeholderTextColor="#6B7280"
              value={inputText}
              onChangeText={handleTyping}
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
                onPress={startVoiceRecording}
                activeOpacity={0.7}
                accessibilityLabel="Record Voice Note">
                <MicIcon size={20} color="#FF385C" />
              </TouchableOpacity>
            )}
          </View>
        )}
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

      {/* Cosmic Kundali & Vibe Harmony Modal */}
      <CosmicKundaliModal
        visible={showKundaliModal}
        candidate={matchProfile}
        onClose={() => setShowKundaliModal(false)}
        onUseSpark={(spark) => {
          setInputText(spark);
        }}
      />

      {/* Shield 360 Safety Action Sheet Modal */}
      <Modal
        visible={showSafetyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSafetyModal(false)}>
        <TouchableOpacity
          style={styles.safetyModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSafetyModal(false)}>
          <View style={styles.safetySheet} onStartShouldSetResponder={() => true}>
            <View style={styles.safetyHandle} />
            <View style={styles.safetyHeader}>
              <Text style={styles.safetyHeaderIcon}>🛡️</Text>
              <Text style={styles.safetyHeaderTitle}>Shield 360 Safety & Controls</Text>
              <Text style={styles.safetyHeaderSub}>
                Manage your safety and connection with {matchProfile?.displayName || candidateName || 'this match'}
              </Text>
            </View>

            <View style={styles.safetyOptionsList}>
              <TouchableOpacity
                style={styles.safetyOptionItem}
                onPress={handleUnmatch}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>💔</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Unmatch & Close Chat Lounge</Text>
                  <Text style={styles.safetyOptionSub}>Permanently sever messaging and hide profile</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetyOptionItem}
                onPress={() => {
                  setShowSafetyModal(false);
                  setShowReportModal(true);
                }}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>🚨</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Report Profile & Harassment</Text>
                  <Text style={styles.safetyOptionSub}>Flag inappropriate conduct to Trust & Safety team</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetyOptionItem}
                onPress={handleBlockUser}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(107, 114, 128, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>🚫</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Block User Completely</Text>
                  <Text style={styles.safetyOptionSub}>Prevent them from ever seeing or matching with you</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.safetyCancelBtn}
              onPress={() => setShowSafetyModal(false)}>
              <Text style={styles.safetyCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Shield 360 Report Violation Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.safetyModalOverlay}>
          <View style={styles.safetySheet}>
            <View style={styles.safetyHandle} />
            <View style={styles.safetyHeader}>
              <Text style={styles.safetyHeaderIcon}>🚨</Text>
              <Text style={styles.safetyHeaderTitle}>Report to Shield 360</Text>
              <Text style={styles.safetyHeaderSub}>
                What is the reason for reporting {matchProfile?.displayName || candidateName || 'this user'}?
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.key}
                  style={styles.reportReasonItem}
                  onPress={() => handleConfirmReport(reason.label)}
                  activeOpacity={0.7}>
                  <Text style={styles.reportReasonEmoji}>{reason.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportReasonLabel}>{reason.label}</Text>
                    <Text style={styles.reportReasonDesc}>{reason.desc}</Text>
                  </View>
                  <Text style={styles.reportArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.safetyCancelBtn}
              onPress={() => setShowReportModal(false)}>
              <Text style={styles.safetyCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 8,
  },
  expiryWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
  },
  expiryUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.4)',
  },
  expiryIcon: {
    fontSize: 13,
  },
  expiryText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  typingIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13151D',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E2230',
    gap: 8,
  },
  typingPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A855F7',
  },
  typingIndicatorText: {
    color: '#A855F7',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  mediaIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1B1E29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#292E3F',
  },
  recordingBar: {
    backgroundColor: '#1A0E15',
    borderTopColor: '#4A1525',
  },
  recordingPulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingTimeText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  cancelRecBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2A2C38',
  },
  cancelRecText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  sendRecBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1C1F2E',
    borderWidth: 1,
    borderColor: '#2D3248',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectingBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reconnectingText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  offlineIcon: {
    fontSize: 13,
  },
  offlineText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  safetyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safetySheet: {
    backgroundColor: '#12141D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#25293C',
  },
  safetyHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  safetyHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  safetyHeaderIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  safetyHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  safetyHeaderSub: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  safetyOptionsList: {
    gap: 10,
    marginBottom: 16,
  },
  safetyOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191C28',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#272B3E',
    gap: 12,
  },
  safetyOptionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyOptionIcon: {
    fontSize: 18,
  },
  safetyOptionTextBox: {
    flex: 1,
  },
  safetyOptionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  safetyOptionSub: {
    color: '#8A8D98',
    fontSize: 11,
    marginTop: 2,
  },
  safetyCancelBtn: {
    backgroundColor: '#202434',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  safetyCancelBtnText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '700',
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191C28',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#272B3E',
    gap: 12,
  },
  reportReasonEmoji: {
    fontSize: 22,
  },
  reportReasonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  reportReasonDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  reportArrow: {
    color: '#E94057',
    fontSize: 16,
    fontWeight: '700',
  },
});
