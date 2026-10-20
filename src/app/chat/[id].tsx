import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import { api, normalizeImageUrl } from '@/services/api';
import { CandidateCard, ChatMessage, MatchItem, VirtualChaiSession } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import CosmicKundaliModal from '@/components/cosmic-kundali-modal';
import { privateDetector } from '@/utils/private-detector';
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
import { useLivenessRecovery } from '@/services/liveness-recovery';
import LivenessRetakeModal from '@/components/liveness-retake-modal';
import { getOrDeriveMatchKey, encryptMessage, decryptMessage } from '@/services/e2ee';
import { dismissNotificationsForMatch } from '@/services/notifications';
import { playMessageReceivedSound } from '@/services/sound-service';
import type { AESEncryptionKey } from 'expo-crypto';
import FlowerBokehOverlay from '@/components/flower-bokeh-overlay';
import LuxuryDateProposalModal, { DateProposalPayload } from '@/components/luxury-date-proposal-modal';
import RescheduleDateModal, { CounterProposalPayload } from '@/components/reschedule-date-modal';
import DateProposalBubble, { parseDateProposal, DateProposalData } from '@/components/date-proposal-bubble';
import ScheduledDateCardModal from '@/components/scheduled-date-card-modal';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const aesKeyRef = useRef<AESEncryptionKey | null>(null);
  const { needsRetry: needsLivenessRetry } = useLivenessRecovery();
  const [showLivenessRetakeModal, setShowLivenessRetakeModal] = useState(false);
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
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [reportRemarks, setReportRemarks] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('Inappropriate or offensive behavior');
  const [blockRemarks, setBlockRemarks] = useState('');
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [showKundaliModal, setShowKundaliModal] = useState(false);
  const [showDatePlanModal, setShowDatePlanModal] = useState(false);
  const [showScheduledDateModal, setShowScheduledDateModal] = useState(false);
  const [dateVenue, setDateVenue] = useState('');
  const [dateNote, setDateNote] = useState('');
  const [showFlowerShower, setShowFlowerShower] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [activeProposalForReschedule, setActiveProposalForReschedule] = useState<DateProposalData | null>(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mutualSparks, setMutualSparks] = useState<string[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showIcebreakerRecap, setShowIcebreakerRecap] = useState(true);
  const [isQuizExpanded, setIsQuizExpanded] = useState(false);
  const [showSafeSpot, setShowSafeSpot] = useState(false);
  const [dismissedMilestone, setDismissedMilestone] = useState<number>(0);
  const [currentUserGender, setCurrentUserGender] = useState<string>('OTHER');

  const { startCall, subscribeToWebSocket, sendWsMessage, connectionStatus, setActiveChatMatchId } = useCall();
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
        const [msgs, matchData, sparksRes, myProf] = await Promise.all([
          api.getMessages(matchId),
          api.getMatchDetails(matchId),
          api.getWingmanSparks(matchId).catch(() => null),
          api.getMyProfile().catch(() => null),
        ]);

        if (myProf?.gender) {
          setCurrentUserGender(myProf.gender);
        }

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
          if (matchData.dateVenue) setDateVenue(matchData.dateVenue);
          if (matchData.dateNote) setDateNote(matchData.dateNote);
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
              bio: 'High-intent match on BlunderR.',
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

  // Register active chat room in CallProvider so app knows user is on this screen
  useEffect(() => {
    if (matchId) {
      setActiveChatMatchId?.(matchId);
    }
    return () => {
      setActiveChatMatchId?.(null);
    };
  }, [matchId, setActiveChatMatchId]);

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
        // Audible chime and haptics on receiving device!
        playMessageReceivedSound().catch(() => {});

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
              if (plain && (plain.startsWith('[BLUNDERR_DATE_PROPOSAL]') || plain.startsWith('[BLUNDERR_DATE_ACCEPTED]'))) {
                setShowFlowerShower(true);
                hapticFeedback.success();
              }
              const normalizedMediaUrl = data.mediaUrl ? normalizeImageUrl(data.mediaUrl) : undefined;
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [...prev, { ...data, content: plain, mediaUrl: normalizedMediaUrl, isFromMe: false }];
              });
            })
            .catch(() => {
              const normalizedMediaUrl = data.mediaUrl ? normalizeImageUrl(data.mediaUrl) : undefined;
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [...prev, { ...data, mediaUrl: normalizedMediaUrl, isFromMe: false }];
              });
            });
        } else {
          const normalizedMediaUrl = data.mediaUrl ? normalizeImageUrl(data.mediaUrl) : undefined;
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, { ...data, mediaUrl: normalizedMediaUrl, isFromMe: false }];
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

                // Play sound if incoming message is from the partner
                const partnerIncoming = trulyNew.filter((m) => !m.isFromMe && m.senderId !== api.getCurrentUserId());
                if (partnerIncoming.length > 0) {
                  playMessageReceivedSound().catch(() => {});
                  if (partnerIncoming.some((m) => m.content && (m.content.startsWith('[BLUNDERR_DATE_PROPOSAL]') || m.content.startsWith('[BLUNDERR_DATE_ACCEPTED]')))) {
                    setShowFlowerShower(true);
                    hapticFeedback.success();
                  }
                }

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

      const tempId = `temp-voice-${Date.now()}`;
      const placeholder = `🎙️ Voice Note (${duration}s)`;

      // Optimistic message with local uri for zero-latency preview
      const optimisticMsg: ChatMessage = {
        id: tempId,
        matchId,
        senderId: api.getCurrentUserId(),
        recipientId: matchProfile?.userId || matchDetails?.otherUserId || '',
        content: placeholder,
        mediaUrl: uri,
        mediaType: 'AUDIO',
        createdAt: new Date().toISOString(),
        isFromMe: true,
        status: 'SENT',
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 40);

      // Upload audio file to Cloudflare R2 / backend
      const uploadedUrl = await api.uploadAudio(uri);
      const audioUrlToSend = uploadedUrl || uri;

      let currentKey = aesKeyRef.current;
      if (!currentKey) {
        currentKey = await getOrDeriveMatchKey(matchId, matchDetails?.e2eeSecret);
        aesKeyRef.current = currentKey;
      }
      const encryptedPlaceholder = await encryptMessage(placeholder, currentKey);
      const newMsg = await api.sendMessage(matchId, encryptedPlaceholder, audioUrlToSend, 'AUDIO');
      if (newMsg) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...newMsg, content: placeholder, mediaUrl: audioUrlToSend, mediaType: 'AUDIO', isFromMe: true }
              : m
          )
        );
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

  const CHAT_BLOCK_REASONS = [
    { key: 'UNCOMFORTABLE', emoji: '😬', label: 'Made me uncomfortable' },
    { key: 'OFFENSIVE', emoji: '🚫', label: 'Inappropriate or offensive behavior' },
    { key: 'NO_VIBE', emoji: '🙅', label: 'No connection / Not interested' },
    { key: 'SPAM', emoji: '🤖', label: 'Commercial spam or fake profile' },
    { key: 'OTHER', emoji: '💬', label: 'Other personal reason' },
  ];

  const handleSendProposal = async (payload: DateProposalPayload) => {
    setIsSendingProposal(true);
    try {
      const proposalData: DateProposalData = {
        date: payload.date,
        time: payload.time,
        timeVibe: payload.timeVibe,
        venue: payload.venue,
        note: payload.note,
        status: 'PENDING',
        emergencyContact: payload.emergencyContact,
      };
      const proposalText = `[BLUNDERR_DATE_PROPOSAL]${JSON.stringify(proposalData)}`;
      setShowDatePlanModal(false);
      setDismissedMilestone(9999);
      setShowFlowerShower(true);
      hapticFeedback.success();
      await handleSendMessage(proposalText);
    } catch (e) {
      console.error('Failed to send date proposal:', e);
      Alert.alert('Error', 'Unable to send proposal. Please try again.');
    } finally {
      setIsSendingProposal(false);
    }
  };

  const handleAcceptProposal = async (data: DateProposalData) => {
    if (!matchId) return;
    try {
      hapticFeedback.success();
      setShowFlowerShower(true);
      const acceptedData: DateProposalData = {
        date: data.date,
        time: data.time,
        venue: data.venue,
        status: 'ACCEPTED',
      };
      const acceptText = `[BLUNDERR_DATE_ACCEPTED]${JSON.stringify(acceptedData)}`;
      await handleSendMessage(acceptText);

      // Mark planned in backend & free Rule of 5 slot
      await api.markDatePlanned(matchId, data.venue, `${data.date} at ${data.time}`);
      setMatchDetails((prev) => (prev ? { ...prev, status: 'DATE_PLANNED', dateVenue: data.venue } : prev));
      Alert.alert(
        '🥂 Date Confirmed!',
        `Your date with ${matchProfile?.displayName || candidateName || 'your match'} is officially set for ${data.date} at ${data.time}! Added to Date Book & Rule of 5 slot freed.`
      );
    } catch (e) {
      console.error('Failed to accept proposal:', e);
    }
  };

  const handleOpenReschedule = (data: DateProposalData) => {
    setActiveProposalForReschedule(data);
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = async (payload: CounterProposalPayload) => {
    setShowRescheduleModal(false);
    if (!matchId) return;

    if (payload.isStrictDecline) {
      const declineData: DateProposalData = {
        date: activeProposalForReschedule?.date || '',
        time: activeProposalForReschedule?.time || '',
        venue: activeProposalForReschedule?.venue || '',
        status: 'DECLINED',
        reason: payload.reason,
      };
      const declineText = `[BLUNDERR_DATE_DECLINED]${JSON.stringify(declineData)}`;
      await handleSendMessage(declineText);
      Alert.alert('Date Declined', 'Polite decline message sent. You can continue chatting anytime.');
    } else {
      const rescheduleData: DateProposalData = {
        date: activeProposalForReschedule?.date || '',
        time: activeProposalForReschedule?.time || '',
        venue: activeProposalForReschedule?.venue || '',
        status: 'RESCHEDULED',
        reason: payload.reason,
        newDate: payload.newDate,
        newTime: payload.newTime,
        newVenue: payload.newVenue,
        note: payload.note,
      };
      const rescheduleText = `[BLUNDERR_DATE_RESCHEDULE]${JSON.stringify(rescheduleData)}`;
      await handleSendMessage(rescheduleText);
      Alert.alert('Alternate Plan Sent ➔', `Suggested ${payload.newDate} at ${payload.newTime} to ${matchProfile?.displayName || candidateName || 'your match'}!`);
    }
  };

  const handleAcceptCounterOffer = async (data: DateProposalData) => {
    if (!matchId) return;
    try {
      hapticFeedback.success();
      setShowFlowerShower(true);
      const finalDate = data.newDate || data.date;
      const finalTime = data.newTime || data.time;
      const finalVenue = data.newVenue || data.venue;

      const acceptedData: DateProposalData = {
        date: finalDate,
        time: finalTime,
        venue: finalVenue,
        status: 'ACCEPTED',
      };
      const acceptText = `[BLUNDERR_DATE_ACCEPTED]${JSON.stringify(acceptedData)}`;
      await handleSendMessage(acceptText);

      await api.markDatePlanned(matchId, finalVenue, `${finalDate} at ${finalTime}`);
      setMatchDetails((prev) => (prev ? { ...prev, status: 'DATE_PLANNED', dateVenue: finalVenue } : prev));
      Alert.alert(
        '🥂 Counter-Offer Accepted!',
        `Your date with ${matchProfile?.displayName || candidateName || 'your match'} is confirmed for ${finalDate} at ${finalTime} at ${finalVenue}!`
      );
    } catch (e) {
      console.error('Failed to accept counter-offer:', e);
    }
  };

  const handleConfirmDatePlan = async () => {
    if (!matchId) return;
    setActionLoading(true);
    hapticFeedback.success();
    const ok = await api.markDatePlanned(matchId, dateVenue.trim() || undefined, dateNote.trim() || undefined);
    setActionLoading(false);
    if (ok) {
      setShowDatePlanModal(false);
      setMatchDetails((prev) => (prev ? { ...prev, status: 'DATE_PLANNED', dateVenue, dateNote } : prev));
      Alert.alert(
        '☕ Real Date Planned!',
        'Awesome! This connection has been saved in your Date Book and your active Rule of 5 slot is now freed up for new connections.',
        [{ text: 'Great! 🎉' }]
      );
    } else {
      Alert.alert('Error', 'Unable to mark date as planned. Please check your network and try again.');
    }
  };

  const handleGracefulExit = () => {
    setShowSafetyModal(false);
    hapticFeedback.light();
    Alert.alert(
      '🕊️ Respectful Farewell',
      `Send a warm farewell note to ${matchProfile?.displayName || candidateName || 'your match'} and gracefully exit. This frees active Rule of 5 slots for both of you with zero negative impact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Graceful Exit',
          style: 'default',
          onPress: async () => {
            if (!matchId) return;
            setActionLoading(true);
            hapticFeedback.medium();
            const ok = await api.gracefulExit(matchId, 'Thank you for the conversation! Wishing you the best.');
            setActionLoading(false);
            if (ok) {
              Alert.alert('Graceful Farewell', 'Conversation closed respectfully. Your active Rule of 5 slot has been freed.');
              router.replace('/(tabs)/matches');
            } else {
              Alert.alert('Error', 'Failed to exit gracefully. Please try again.');
            }
          },
        },
      ]
    );
  };

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

  const handleOpenReportModal = () => {
    setShowSafetyModal(false);
    setSelectedReportReason(null);
    setReportRemarks('');
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    if (!matchId || !selectedReportReason) return;
    setActionLoading(true);
    hapticFeedback.error();
    await api.reportUser(matchId, selectedReportReason, reportRemarks);
    setActionLoading(false);
    setShowReportModal(false);
    Alert.alert(
      'Shield 360 Report Submitted',
      `Thank you for helping keep BlunderR safe. Our Trust & Safety team has received your report for "${selectedReportReason}". Your remarks have been forwarded to admin review. The user has been penalized -50 karma points, blocked, and removed from your matches.`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/matches'),
        },
      ]
    );
  };

  const handleOpenBlockModal = () => {
    setShowSafetyModal(false);
    setBlockReason('Inappropriate or offensive behavior');
    setBlockRemarks('');
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    if (!matchId) return;
    setBlockingLoading(true);
    hapticFeedback.heavy();
    await api.blockMatch(matchId, blockReason, blockRemarks);
    setBlockingLoading(false);
    setShowBlockModal(false);
    Alert.alert(
      'User Blocked & Unmatched',
      `${matchProfile?.displayName || candidateName || 'User'} has been blocked and unmatched. Your remarks have been submitted to admin review.`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/matches'),
        },
      ]
    );
  };

  const handleRequestReveal = (messageId: string) => {
    hapticFeedback.warning();
    Alert.alert(
      '⚠️ Sensitive Content Warning',
      'BlunderR Private Detector has blurred this incoming photo to protect you from unsolicited sensitive imagery. Are you sure you want to view it?',
      [
        {
          text: 'Keep Blurred',
          style: 'cancel',
        },
        {
          text: 'Report & Block',
          style: 'destructive',
          onPress: () => {
            privateDetector.reportMedia(messageId, 'UNSOLICITED_SENSITIVE_MEDIA');
            setSelectedReportReason('Unsolicited Inappropriate Media');
            setReportRemarks('Sent unsolicited explicit media in chat');
            setShowReportModal(true);
          },
        },
        {
          text: 'Reveal Photo',
          onPress: async () => {
            hapticFeedback.medium();
            await privateDetector.revealImage(messageId);
            setUnblurredImages((prev) => ({ ...prev, [messageId]: true }));
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
          base64: true,
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
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!matchId) return;

        const tempId = `temp-img-${Date.now()}`;

        // Instant optimistic preview for sender
        const optimisticMsg: ChatMessage = {
          id: tempId,
          matchId,
          senderId: api.getCurrentUserId(),
          recipientId: matchProfile?.userId || matchDetails?.otherUserId || '',
          content: '📷 Photo',
          mediaUrl: asset.uri,
          mediaType: 'IMAGE',
          createdAt: new Date().toISOString(),
          isFromMe: true,
          status: 'SENT',
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 40);

        // Upload photo to Cloudflare R2 / backend with Layer 2 SafeDate Shield scan
        let imageUrlToSend: string;
        try {
          const uploadedImageUrl = await api.uploadImage(asset.uri, asset.base64);
          imageUrlToSend = uploadedImageUrl || asset.uri;
        } catch (uploadErr: any) {
          // Remove optimistic message if upload was blocked
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          if (uploadErr?.message?.includes('EXPLICIT_CONTENT_REJECTED')) {
            Alert.alert(
              '🛡️ SafeDate Shield Alert',
              'This photo was blocked by Shield 360 AI for explicit or sensitive content.\n\nBlunderR strictly prohibits non-consensual explicit media in chat lounges. Violations result in an immediate account suspension.'
            );
            return;
          }
          throw uploadErr;
        }

        let currentKey = aesKeyRef.current;
        if (!currentKey) {
          currentKey = await getOrDeriveMatchKey(matchId, matchDetails?.e2eeSecret);
          aesKeyRef.current = currentKey;
        }
        const encryptedPlaceholder = await encryptMessage('📷 Photo', currentKey);
        const newMsg = await api.sendMessage(matchId, encryptedPlaceholder, imageUrlToSend, 'IMAGE');
        if (newMsg) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...newMsg, content: '📷 Photo', mediaUrl: imageUrlToSend, mediaType: 'IMAGE', isFromMe: true }
                : m
            )
          );
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes('EXPLICIT_CONTENT_REJECTED')) {
        console.error('Image pick error:', err);
        Alert.alert('Error', 'Unable to pick or upload image.');
      }
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

  function cleanDateStr(val?: string): string {
    if (!val) return 'Tomorrow';
    const trimmed = String(val).trim();
    if (trimmed.toLowerCase().includes('invalid')) return 'Tomorrow';
    return trimmed;
  }

  function cleanTimeStr(val?: string): string {
    if (!val) return '7:30 PM';
    const trimmed = String(val).trim();
    if (trimmed.toLowerCase().includes('invalid')) return '7:30 PM';
    return trimmed;
  }

  function formatBubbleTime(createdAt?: any): string {
    if (!createdAt) return '';
    if (typeof createdAt === 'object' && createdAt !== null) {
      if (createdAt.dateTime?.time) {
        const h = createdAt.dateTime.time.hour ?? 0;
        const m = createdAt.dateTime.time.minute ?? 0;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m < 10 ? '0' : ''}${m} ${ampm}`;
      }
    }
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return '';
  }

  // Derive whether date is confirmed and the latest confirmed details
  const confirmedProposalData = useMemo<DateProposalData | null>(() => {
    // 1. Check messages in reverse for accepted date proposal
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.content && msg.content.startsWith('[BLUNDERR_DATE_ACCEPTED]')) {
        try {
          const jsonStr = msg.content.replace('[BLUNDERR_DATE_ACCEPTED]', '').trim();
          const parsed = JSON.parse(jsonStr) as DateProposalData;
          if (parsed && (parsed.date || parsed.venue)) {
            return {
              ...parsed,
              date: cleanDateStr(parsed.date),
              time: cleanTimeStr(parsed.time),
              venue: parsed.venue || 'Confirmed SafeDate Hub',
              status: 'ACCEPTED',
            };
          }
        } catch {}
      }
    }

    // 2. If match is marked DATE_PLANNED or an accepted message exists, check proposal for sender's view
    const isPlanned = matchDetails?.status === 'DATE_PLANNED' || messages.some(
      (m) => typeof m.content === 'string' && m.content.startsWith('[BLUNDERR_DATE_ACCEPTED]')
    );

    if (isPlanned) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.content && msg.content.startsWith('[BLUNDERR_DATE_PROPOSAL]')) {
          try {
            const jsonStr = msg.content.replace('[BLUNDERR_DATE_PROPOSAL]', '').trim();
            const parsed = JSON.parse(jsonStr) as DateProposalData;
            if (parsed && (parsed.date || parsed.venue)) {
              return {
                ...parsed,
                date: cleanDateStr(parsed.date),
                time: cleanTimeStr(parsed.time),
                venue: parsed.venue || 'Confirmed SafeDate Hub',
                status: 'ACCEPTED',
              };
            }
          } catch {}
        }
      }
    }

    // 3. Fallback to matchDetails if status === 'DATE_PLANNED' or dateVenue
    if (matchDetails?.status === 'DATE_PLANNED' || matchDetails?.datePlannedAt || matchDetails?.dateVenue) {
      let dateStr = 'Tomorrow';
      let timeStr = '7:30 PM';
      if (matchDetails.datePlannedAt) {
        if (matchDetails.datePlannedAt.includes(' at ')) {
          const parts = matchDetails.datePlannedAt.split(' at ');
          dateStr = parts[0] || dateStr;
          timeStr = parts[1] || timeStr;
        } else {
          dateStr = matchDetails.datePlannedAt;
        }
      }
      return {
        date: cleanDateStr(dateStr),
        time: cleanTimeStr(timeStr),
        venue: matchDetails.dateVenue || 'Verified Partner Venue',
        note: matchDetails.dateNote || 'SafeDate Shield™ Verified Meeting',
        status: 'ACCEPTED' as const,
      };
    }
    return null;
  }, [messages, matchDetails?.status, matchDetails?.datePlannedAt, matchDetails?.dateVenue, matchDetails?.dateNote]);

  const isDateConfirmed = Boolean(confirmedProposalData || matchDetails?.status === 'DATE_PLANNED');

  const hasAnyProposalSentOrConfirmed = useMemo(() => {
    if (isDateConfirmed || matchDetails?.status === 'DATE_PLANNED') return true;
    return messages.some((m) => {
      if (typeof m.content !== 'string') return false;
      return (
        m.content.startsWith('[BLUNDERR_DATE_PROPOSAL]') ||
        m.content.startsWith('[BLUNDERR_DATE_ACCEPTED]') ||
        m.content.startsWith('[BLUNDERR_DATE_RESCHEDULE]')
      );
    });
  }, [messages, isDateConfirmed, matchDetails?.status]);

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const parsedProposal = parseDateProposal(item.content);
    if (parsedProposal.type !== 'NONE' && parsedProposal.data) {
      return (
        <DateProposalBubble
          type={parsedProposal.type}
          data={parsedProposal.data}
          isFromMe={Boolean(item.isFromMe)}
          partnerName={matchProfile?.displayName || candidateName || 'your match'}
          isDateConfirmed={isDateConfirmed}
          onAccept={() => handleAcceptProposal(parsedProposal.data!)}
          onReschedule={() => handleOpenReschedule(parsedProposal.data!)}
          onDecline={() => {
            setActiveProposalForReschedule(parsedProposal.data);
            setShowRescheduleModal(true);
          }}
          onAcceptCounter={() => handleAcceptCounterOffer(parsedProposal.data!)}
          onProposeNew={() => {
            if (isDateConfirmed) {
              setShowScheduledDateModal(true);
            } else {
              setShowDatePlanModal(true);
            }
          }}
        />
      );
    }

    const isBlurred =
      privateDetector.shouldBlurImage(item.id, Boolean(item.isFromMe), item.isBlurred) &&
      !unblurredImages[item.id];

    return (
      <View style={[styles.messageBubbleRow, item.isFromMe ? styles.myMessageRow : styles.theirMessageRow]}>
        <View style={[styles.messageBubble, item.isFromMe ? styles.myMessageBubble : styles.theirMessageBubble]}>
          {item.mediaType === 'IMAGE' && item.mediaUrl && (
            <View style={styles.imageContainer}>
              {isBlurred ? (
                <View style={styles.blurredBox}>
                  <ExpoImage
                    source={{ uri: normalizeImageUrl(item.mediaUrl) }}
                    style={[styles.chatImage, styles.blurredBackdrop]}
                    contentFit="cover"
                    blurRadius={Platform.OS === 'web' ? 20 : 35}
                  />
                  <View style={styles.shieldContentOverlay}>
                    <Text style={styles.shieldIcon}>🛡️</Text>
                    <Text style={styles.shieldTitle}>Sensitive Content Warning</Text>
                    <Text style={styles.shieldSub}>
                      {item.blurReason || 'Auto-blurred by Shield 360 Private Detector.'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={styles.revealBtn}
                        onPress={() => handleRequestReveal(item.id)}
                        activeOpacity={0.8}>
                        <Text style={styles.revealBtnText}>👁️ Tap to View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.revealBtn, { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: '#EF4444' }]}
                        onPress={() => {
                          hapticFeedback.light();
                          privateDetector.reportMedia(item.id, 'UNSOLICITED_SENSITIVE_MEDIA');
                          setSelectedReportReason('Unsolicited Inappropriate Media');
                          setReportRemarks('Reported explicit photo in chat lounge');
                          setShowReportModal(true);
                        }}
                        activeOpacity={0.8}>
                        <Text style={[styles.revealBtnText, { color: '#FCA5A5' }]}>🚨 Report</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <ExpoImage
                  source={{ uri: normalizeImageUrl(item.mediaUrl) }}
                  style={styles.chatImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              )}
            </View>
          )}

          {item.mediaType === 'AUDIO' && item.mediaUrl ? (
            <VoiceNoteBubble audioUri={item.mediaUrl} isFromMe={Boolean(item.isFromMe)} />
          ) : item.mediaType === 'IMAGE' ? (
            item.content && item.content !== '📷 Photo' ? (
              <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.content}
              </Text>
            ) : null
          ) : (
            <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          )}

          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTimeText, item.isFromMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
              {formatBubbleTime(item.createdAt)}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            style={styles.headerProfileBox}
            activeOpacity={0.8}>
            <View style={styles.headerAvatarWrapper}>
              <ExpoImage
                source={{
                  uri:
                    normalizeImageUrl(matchProfile?.photos?.[0] || matchDetails?.otherUserPhoto) ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=75',
                }}
                style={styles.headerSmallAvatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
              <View style={styles.headerOnlineBadge} />
            </View>

            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {matchProfile?.displayName || matchDetails?.otherUserName || candidateName || 'Match'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {FEATURE_FLAGS.ENABLE_DIGILOCKER ? '🛡️ DigiLocker Verified • 🔒 E2EE' : '👤 Verified • 🔒 E2EE'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerCallActionRow}>
            {/* Plan Real Date / View Scheduled Date (Rule of 5 Slot Freer) */}
            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                isDateConfirmed && styles.headerIconBtnActiveDate,
              ]}
              onPress={() => {
                hapticFeedback.light();
                if (isDateConfirmed) {
                  setShowScheduledDateModal(true);
                } else {
                  setShowDatePlanModal(true);
                }
              }}
              activeOpacity={0.75}
              accessibilityLabel={isDateConfirmed ? "View Scheduled Date Card" : "Plan Real Date"}>
              <Text style={{ fontSize: 16 }}>{isDateConfirmed ? '🥂' : '☕'}</Text>
              {isDateConfirmed && <View style={styles.headerScheduledDateDot} />}
            </TouchableOpacity>

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

        {/* Date Planned Banner OR Ephemeral Expiry Alert Banner */}
        {isDateConfirmed ? (
          <View style={styles.datePlannedBanner}>
            <Text style={styles.datePlannedIcon}>🥂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.datePlannedTitle}>Real Date Confirmed!</Text>
              <Text style={styles.datePlannedSub} numberOfLines={1}>
                {confirmedProposalData?.venue || matchDetails?.dateVenue ? `📍 ${confirmedProposalData?.venue || matchDetails?.dateVenue} • ` : ''}
                {confirmedProposalData?.date ? `📅 ${confirmedProposalData.date} • ` : ''}
                Active Rule of 5 slot unlocked
              </Text>
            </View>
            <TouchableOpacity
              style={styles.datePlannedDetailsBtn}
              onPress={() => setShowScheduledDateModal(true)}
              activeOpacity={0.8}>
              <Text style={styles.datePlannedDetailsText}>View Card</Text>
            </TouchableOpacity>
          </View>
        ) : remainingHours !== null && remainingHours < 24 ? (
          <View style={[styles.expiryBanner, remainingHours < 12 ? styles.expiryUrgent : styles.expiryWarning]}>
            <Text style={styles.expiryIcon}>⏳</Text>
            <Text style={styles.expiryText}>
              {remainingHours === 0
                ? 'Match window expired • Send a message or Virtual Chai to rekindle!'
                : `${remainingHours}h left before match expires • Keep the chemistry alive!`}
            </Text>
          </View>
        ) : null}

        {/* Compact 10s Icebreaker Quiz Pill (Collapsible, space-efficient) */}
        {matchDetails?.icebreakerQuiz?.isCompleted && showIcebreakerRecap && (
          <View style={styles.compactQuizPill}>
            <TouchableOpacity
              style={styles.compactQuizTouchable}
              onPress={() => setIsQuizExpanded(!isQuizExpanded)}
              activeOpacity={0.8}>
              <Text style={styles.compactQuizIcon}>⚡</Text>
              <Text style={styles.compactQuizText} numberOfLines={isQuizExpanded ? undefined : 1}>
                {isQuizExpanded
                  ? `10s Quiz: "${matchDetails.icebreakerQuiz.question || 'Mutual Prompt'}"\n✓ ${matchDetails.icebreakerQuiz.isMutualAgreement ? 'Mutual Agreement Spark!' : 'Completed • Chat Unlocked'}`
                  : `10s Quiz: "${matchDetails.icebreakerQuiz.question || 'Mutual Prompt'}" • ${matchDetails.icebreakerQuiz.isMutualAgreement ? 'Mutual Spark ✨' : 'Unlocked'}`}
              </Text>
              <Text style={styles.compactQuizArrow}>{isQuizExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.compactQuizCloseBtn}
              onPress={() => setShowIcebreakerRecap(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.compactQuizCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Compact Safe Date Spot Strip (Only when conversation hasn't started) */}
        {showSafeSpot && messages.length === 0 && (
          <View style={styles.compactSafeSpotStrip}>
            <TouchableOpacity
              style={styles.compactSafeSpotTouch}
              onPress={() => router.push('/safe-date')}>
              <Text style={{ fontSize: 13 }}>📍</Text>
              <Text style={styles.compactSafeSpotText} numberOfLines={1}>
                Blue Tokai Indiranagar (15% Off Safe Date)
              </Text>
              <Text style={styles.compactSafeSpotArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSafeSpot(false)}
              style={styles.compactSafeSpotClose}>
              <Text style={styles.compactQuizCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* High-Chemistry Milestone Celebration Strip (20, 50, 100 messages) */}
        {(() => {
          const count = messages.length;
          const milestone = count >= 100 ? 100 : count >= 50 ? 50 : count >= 20 ? 20 : 0;
          const showPrompt = milestone > 0 && dismissedMilestone !== milestone && !hasAnyProposalSentOrConfirmed;
          if (!showPrompt) return null;
          return (
            <View style={styles.milestonePromptCard}>
              <View style={styles.milestonePromptTopRow}>
                <View style={styles.milestoneBadge}>
                  <Text style={styles.milestoneBadgeIcon}>🥂</Text>
                  <Text style={styles.milestoneBadgeText}>{milestone}+ Messages Exchanged!</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDismissedMilestone(milestone)}
                  style={styles.milestoneCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.compactQuizCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.milestoneSubText}>
                Serious chemistry detected! Ready to turn this conversation into a real coffee or cocktail date?
              </Text>
              <View style={styles.milestoneActionRow}>
                <TouchableOpacity
                  style={styles.proposeDateBtn}
                  onPress={() => {
                    hapticFeedback.success();
                    if (isDateConfirmed) {
                      setShowScheduledDateModal(true);
                    } else {
                      setShowDatePlanModal(true);
                    }
                  }}>
                  <Text style={styles.proposeDateBtnText}>Propose a Real Date ☕</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keepChattingBtn}
                  onPress={() => {
                    hapticFeedback.light();
                    setDismissedMilestone(milestone);
                  }}>
                  <Text style={styles.keepChattingBtnText}>Keep Chatting 💬</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

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
                  ? (Platform.OS === 'ios' ? 8 : 8)
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
                  ? (Platform.OS === 'ios' ? 8 : 8)
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
              onFocus={() => {
                setIsKeyboardVisible(true);
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
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
        scheduledDate={confirmedProposalData}
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
                onPress={handleGracefulExit}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>🕊️</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Graceful Farewell (Respectful Exit)</Text>
                  <Text style={styles.safetyOptionSub}>End conversation respectfully • Frees Rule of 5 slot with 0 penalty</Text>
                </View>
              </TouchableOpacity>

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
                onPress={handleOpenReportModal}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>🚨</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Report Profile & Harassment</Text>
                  <Text style={styles.safetyOptionSub}>Flag inappropriate conduct with admin remarks</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetyOptionItem}
                onPress={handleOpenBlockModal}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(107, 114, 128, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>🚫</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Block User Completely</Text>
                  <Text style={styles.safetyOptionSub}>Prevent them from ever contacting you & send remarks to admin</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetyOptionItem}
                onPress={() => {
                  setShowSafetyModal(false);
                  hapticFeedback.light();
                  router.push('/blocked-profiles' as any);
                }}
                activeOpacity={0.7}>
                <View style={[styles.safetyOptionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Text style={styles.safetyOptionIcon}>🛡️</Text>
                </View>
                <View style={styles.safetyOptionTextBox}>
                  <Text style={styles.safetyOptionTitle}>Blocked & Reported Profiles Hub</Text>
                  <Text style={styles.safetyOptionSub}>Manage blocked accounts, review report status & unblock anytime</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safetyModalOverlay}>
          <View style={styles.safetySheet}>
            <View style={styles.safetyHandle} />
            <View style={styles.safetyHeader}>
              <Text style={styles.safetyHeaderIcon}>🚨</Text>
              <Text style={styles.safetyHeaderTitle}>Report to Shield 360</Text>
              <Text style={styles.safetyHeaderSub}>
                Help keep BlunderR safe. Our Trust & Safety team reviews all reports and remarks within 24 hours.
              </Text>
            </View>

            {actionLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E94057" />
                <Text style={{ color: '#CACDD8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
                  Submitting report and shielding chat lounge...
                </Text>
              </View>
            ) : !selectedReportReason ? (
              <>
                <Text style={styles.chatModalSubTitle}>Select Violation Reason</Text>
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.key}
                      style={styles.reportReasonItem}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedReportReason(reason.label);
                      }}
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
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.chatSelectedReasonBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text style={{ fontSize: 14 }}>🚩</Text>
                    <Text style={styles.chatSelectedReasonText} numberOfLines={1}>{selectedReportReason}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReportReason(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.chatChangeReasonText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.chatRemarksLabel}>Remarks for Admin Review (Optional)</Text>
                <TextInput
                  style={styles.chatRemarksInput}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  placeholder="Provide context or details about the conversation, screenshots, or messages so our admin moderation desk can take swift action..."
                  placeholderTextColor="#6B7280"
                  value={reportRemarks}
                  onChangeText={setReportRemarks}
                  textAlignVertical="top"
                />
                <View style={styles.chatRemarksMetaRow}>
                  <Text style={styles.chatRemarksHint}>Strictly confidential admin report.</Text>
                  <Text style={styles.chatRemarksCounter}>{reportRemarks.length}/500</Text>
                </View>

                <View style={styles.chatShieldNoticeBox}>
                  <Text style={styles.chatShieldNoticeText}>
                    🛡️ <Text style={{ fontWeight: '700', color: '#FDA4AF' }}>SafeDate Shield™:</Text> Submitting this report will apply a -50 karma penalty, sever this match, and close this chat lounge permanently.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.chatSubmitReportBtn}
                  onPress={handleConfirmReport}
                  activeOpacity={0.85}>
                  <Text style={styles.chatSubmitReportBtnText}>🚨 Submit Report & Block User</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chatBackReasonBtn}
                  onPress={() => setSelectedReportReason(null)}>
                  <Text style={styles.chatBackReasonBtnText}>← Choose Another Reason</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Block & Unmatch Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safetyModalOverlay}>
          <View style={styles.safetySheet}>
            <View style={styles.safetyHandle} />
            <View style={styles.safetyHeader}>
              <Text style={styles.safetyHeaderIcon}>🚫</Text>
              <Text style={styles.safetyHeaderTitle}>Block {matchProfile?.displayName || candidateName || 'User'}</Text>
              <Text style={styles.safetyHeaderSub}>
                This will unmatch, permanently close this chat lounge, and prevent them from ever contacting you again.
              </Text>
            </View>

            {blockingLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={{ color: '#CACDD8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
                  Blocking user and recording feedback...
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.chatRemarksLabel}>Select Reason</Text>
                <View style={styles.chatBlockChipsWrap}>
                  {CHAT_BLOCK_REASONS.map((item) => {
                    const isSelected = blockReason === item.label;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.chatBlockChip, isSelected && styles.chatBlockChipActive]}
                        onPress={() => {
                          hapticFeedback.selection();
                          setBlockReason(item.label);
                        }}>
                        <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
                        <Text style={[styles.chatBlockChipText, isSelected && styles.chatBlockChipTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.chatRemarksLabel}>Remarks for Admin Review (Optional)</Text>
                <TextInput
                  style={styles.chatRemarksInput}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  placeholder="Optional: Tell admin why you are blocking this user (e.g. ghosting, rude tone, suspicious link)..."
                  placeholderTextColor="#6B7280"
                  value={blockRemarks}
                  onChangeText={setBlockRemarks}
                  textAlignVertical="top"
                />
                <View style={styles.chatRemarksMetaRow}>
                  <Text style={styles.chatRemarksHint}>Recorded confidentially for Trust & Safety review.</Text>
                  <Text style={styles.chatRemarksCounter}>{blockRemarks.length}/500</Text>
                </View>

                <TouchableOpacity
                  style={styles.chatConfirmBlockBtn}
                  onPress={handleConfirmBlock}
                  activeOpacity={0.85}>
                  <Text style={styles.chatConfirmBlockBtnText}>🚫 Block User & Close Chat Lounge</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.safetyCancelBtn}
                  onPress={() => setShowBlockModal(false)}>
                  <Text style={styles.safetyCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Luxury Date Proposal Modal */}
      <LuxuryDateProposalModal
        visible={showDatePlanModal && !isDateConfirmed}
        onClose={() => setShowDatePlanModal(false)}
        onSendProposal={handleSendProposal}
        candidateName={matchProfile?.displayName || candidateName || 'your match'}
        isSending={isSendingProposal}
        userGender={currentUserGender}
      />

      {/* Scheduled Date Card Modal */}
      <ScheduledDateCardModal
        visible={showScheduledDateModal}
        onClose={() => setShowScheduledDateModal(false)}
        candidateName={matchProfile?.displayName || candidateName || 'your match'}
        candidatePhoto={matchProfile?.photos?.[0] || matchDetails?.otherUserPhoto}
        dateData={confirmedProposalData || {
          date: 'Tomorrow',
          time: '7:30 PM',
          venue: matchDetails?.dateVenue || 'Verified SafeDate Partner Hub',
          status: 'ACCEPTED',
        }}
      />

      {/* Polite Reschedule & Counter-Offer Modal */}
      <RescheduleDateModal
        visible={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onSubmit={handleSubmitReschedule}
        proposerName={matchProfile?.displayName || candidateName || 'your match'}
      />

      {/* 3D Liveness Retake Recovery Modal (Single-Flag System) */}
      <LivenessRetakeModal
        visible={showLivenessRetakeModal}
        onClose={() => setShowLivenessRetakeModal(false)}
        referrer="Chat Lounge"
      />

      {/* Live Flower Bokeh & Rose Petal Shower Overlay */}
      <FlowerBokehOverlay
        active={showFlowerShower}
        onFinish={() => setShowFlowerShower(false)}
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
  headerProfileBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
    marginRight: 6,
  },
  headerAvatarWrapper: {
    position: 'relative',
  },
  headerSmallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#20222C',
    borderWidth: 1.5,
    borderColor: 'rgba(233, 64, 87, 0.45)',
  },
  headerOnlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0E0F13',
  },
  headerTitleBox: {
    flex: 1,
    justifyContent: 'center',
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
  compactQuizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 64, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.25)',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compactQuizTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactQuizIcon: {
    fontSize: 12,
  },
  compactQuizText: {
    flex: 1,
    color: '#FF6584',
    fontSize: 11,
    fontWeight: '700',
  },
  compactQuizArrow: {
    color: '#FF6584',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  compactQuizCloseBtn: {
    paddingLeft: 6,
    paddingVertical: 2,
  },
  compactQuizCloseText: {
    color: '#8A8D98',
    fontSize: 12,
    fontWeight: '700',
  },
  compactSafeSpotStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.25)',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compactSafeSpotTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactSafeSpotText: {
    flex: 1,
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
  },
  compactSafeSpotArrow: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '800',
  },
  milestonePromptCard: {
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.3)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    padding: 12,
  },
  milestonePromptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneBadgeIcon: {
    fontSize: 14,
  },
  milestoneBadgeText: {
    color: '#FF6584',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  milestoneCloseBtn: {
    padding: 4,
  },
  milestoneSubText: {
    color: '#C3C7D4',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  milestoneActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposeDateBtn: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposeDateBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  keepChattingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keepChattingBtnText: {
    color: '#8A8D98',
    fontSize: 11,
    fontWeight: '700',
  },
  compactSafeSpotClose: {
    paddingLeft: 6,
    paddingVertical: 2,
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
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 12,
  },
  blurredBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  shieldContentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(15, 17, 24, 0.72)',
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  revealBtnText: {
    color: '#ffffff',
    fontSize: 11,
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
  headerIconBtnActiveDate: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.6)',
  },
  headerScheduledDateDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#0E0F13',
  },
  datePlannedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 10,
  },
  datePlannedIcon: {
    fontSize: 18,
  },
  datePlannedTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  datePlannedSub: {
    color: '#A7F3D0',
    fontSize: 11,
    marginTop: 1,
  },
  datePlannedDetailsBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  datePlannedDetailsText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
  },
  datePlanSheet: {
    backgroundColor: '#161822',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: '#262A3C',
  },
  datePlanForm: {
    marginTop: 14,
    marginBottom: 16,
    gap: 8,
  },
  datePlanInputLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  datePlanInput: {
    backgroundColor: '#0F1118',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3248',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  confirmDateBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmDateBtnText: {
    color: '#0E0F13',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  alreadyPlannedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  alreadyPlannedText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  chatLivenessLockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  chatLivenessIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatLivenessLockedTitle: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800',
  },
  chatLivenessLockedSub: {
    color: '#FECACA',
    fontSize: 11,
    marginTop: 1,
  },
  chatLivenessUnlockBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  chatLivenessUnlockText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chatModalSubTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  chatSelectedReasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  chatSelectedReasonText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  chatChangeReasonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  chatRemarksLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  chatRemarksInput: {
    backgroundColor: '#11131B',
    borderWidth: 1,
    borderColor: '#262A38',
    borderRadius: 14,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  chatRemarksMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  chatRemarksHint: {
    color: '#6B7280',
    fontSize: 11,
  },
  chatRemarksCounter: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  chatShieldNoticeBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  chatShieldNoticeText: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 17,
  },
  chatSubmitReportBtn: {
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#E94057',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chatSubmitReportBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chatBackReasonBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  chatBackReasonBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  chatBlockChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chatBlockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191C28',
    borderWidth: 1,
    borderColor: '#272B3E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chatBlockChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
  },
  chatBlockChipText: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '600',
  },
  chatBlockChipTextActive: {
    color: '#F87171',
    fontWeight: '700',
  },
  chatConfirmBlockBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  chatConfirmBlockBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
