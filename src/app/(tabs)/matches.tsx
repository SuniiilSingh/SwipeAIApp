import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { api } from '@/services/api';
import { CandidateCard, MatchItem, UserProfile, MatchCapacityInfo, BlockedUserItem } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import SubscriptionGatingModal, { GatingFeatureType } from '@/components/subscription-gating-modal';
import { hapticFeedback } from '@/utils/haptics';
import { useCall } from '@/context/call-context';
import { FEATURE_FLAGS } from '@/config/features';
import { useLivenessRecovery } from '@/services/liveness-recovery';
import LivenessRetakeModal from '@/components/liveness-retake-modal';

export type MatchFilterType = 'ALL' | 'ACTIVE' | 'QUIZ' | 'EXPIRING' | 'DATES_PLANNED';

export default function MatchesScreen() {
  const router = useRouter();
  const { subscribeToWebSocket } = useCall();
  const { needsRetry: needsLivenessRetry } = useLivenessRecovery();
  const [showLivenessRetakeModal, setShowLivenessRetakeModal] = useState(false);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [likesReceived, setLikesReceived] = useState<CandidateCard[]>([]);
  const [selectedLikeCandidate, setSelectedLikeCandidate] = useState<CandidateCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MatchFilterType>('ALL');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [capacity, setCapacity] = useState<MatchCapacityInfo | null>(null);
  const [showRuleOfFiveModal, setShowRuleOfFiveModal] = useState(false);
  const [showSlotManagerModal, setShowSlotManagerModal] = useState(false);
  const [pendingQueuedMatch, setPendingQueuedMatch] = useState<MatchItem | null>(null);
  const [isFreeingSlot, setIsFreeingSlot] = useState(false);
  const [gatingModalVisible, setGatingModalVisible] = useState(false);
  const [gatingFeature, setGatingFeature] = useState<GatingFeatureType>('REVIVE');
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlocked(true);
    try {
      const list = await api.getBlockedAndReportedUsers();
      setBlockedUsers(list);
    } catch (e) {
      console.warn('Failed to load blocked users:', e);
    } finally {
      setLoadingBlocked(false);
    }
  }, []);

  const openBlockedModal = () => {
    hapticFeedback.light();
    setShowBlockedModal(true);
    loadBlockedUsers();
  };

  const handleUnblockUser = (item: BlockedUserItem) => {
    hapticFeedback.medium();
    Alert.alert(
      'Unblock Account',
      `Unblock ${item.displayName}? This user will reappear in your discovery feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            setUnblockingUserId(item.targetUserId);
            try {
              const ok = await api.unblockUser(item.targetUserId);
              if (ok) {
                hapticFeedback.success();
                setBlockedUsers((prev) => prev.filter((u) => u.targetUserId !== item.targetUserId));
              } else {
                Alert.alert('Notice', 'Unable to unblock at this time. Please try again.');
              }
            } catch (err) {
              Alert.alert('Notice', 'Failed to unblock.');
            } finally {
              setUnblockingUserId(null);
            }
          },
        },
      ]
    );
  };

  // Breathing pulse animation for <12h expiring matches and expired matches
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const getUrgencyRingColor = (item: MatchItem) => {
    if (item.status === 'DATE_PLANNED') return '#FFD700'; // Gold
    if (item.status === 'EXPIRED' || item.remainingHours === 0) return '#FF4757'; // Crimson
    if (item.remainingHours <= 12) return '#FF4757'; // Crimson urgent
    if (item.remainingHours <= 24) return '#FFA502'; // Amber warning
    if (item.status === 'QUEUED_CAPACITY') return '#64748B'; // Muted slate queue
    return '#2ED573'; // Emerald fresh
  };

  const activeRuleOfFiveMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === 'ACTIVE_CHAT' || m.status === 'PENDING_ICEBREAKER' || m.status === 'EXPIRED')
      .sort((a, b) => {
        // Prioritize EXPIRED matches first, then lowest remaining hours
        if (a.status === 'EXPIRED' && b.status !== 'EXPIRED') return -1;
        if (b.status === 'EXPIRED' && a.status !== 'EXPIRED') return 1;
        return a.remainingHours - b.remainingHours;
      });
  }, [matches]);

  const handleResolveSlotAndUnlock = async (matchToResolve: MatchItem, action: 'PLAN_DATE' | 'FAREWELL') => {
    if (!pendingQueuedMatch) return;
    setIsFreeingSlot(true);
    hapticFeedback.medium();
    try {
      let ok = false;
      if (action === 'PLAN_DATE') {
        ok = await api.markDatePlanned(matchToResolve.id, 'Planned Date', 'Scheduled real meet');
      } else {
        ok = await api.gracefulExit(matchToResolve.id, 'Thank you for the conversation! Wishing you the very best.');
      }

      if (!ok) {
        Alert.alert('Error', 'Unable to resolve conversation. Please try again.');
        setIsFreeingSlot(false);
        return;
      }

      // Unlock the queued match specifically
      await api.unlockQueuedMatch(pendingQueuedMatch.id);
      await loadMatches(true);
      setShowSlotManagerModal(false);
      setIsFreeingSlot(false);

      hapticFeedback.success();
      Alert.alert(
        '🎉 Slot Freed!',
        action === 'PLAN_DATE'
          ? `Date planned with ${matchToResolve.otherUserName}! Your active slot has been freed and ${pendingQueuedMatch.otherUserName} is unlocked.`
          : `Farewell sent to ${matchToResolve.otherUserName}. Your active slot has been freed and ${pendingQueuedMatch.otherUserName} is unlocked.`,
        [
          {
            text: 'Start Chatting 💬',
            onPress: () => {
              router.push({
                pathname: '/chat/[id]',
                params: { id: pendingQueuedMatch.id, name: pendingQueuedMatch.otherUserName },
              });
            },
          },
        ]
      );
    } catch (err) {
      console.warn('handleResolveSlotAndUnlock error:', err);
      Alert.alert('Error', 'Failed to unlock connection.');
      setIsFreeingSlot(false);
    }
  };

  const loadMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [list, profile, likes, cap, blocked] = await Promise.all([
        api.getMatches(),
        api.getMyProfile().catch(() => null),
        api.getLikesReceived().catch(() => []),
        api.getMatchCapacity().catch(() => null),
        api.getBlockedAndReportedUsers().catch(() => []),
      ]);
      setMatches(list);
      if (profile) setUserProfile(profile);
      if (Array.isArray(likes)) setLikesReceived(likes);
      if (cap) setCapacity(cap);
      if (Array.isArray(blocked)) setBlockedUsers(blocked);
    } catch (err) {
      console.warn('[MatchesScreen] Failed to load matches:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const isDatePlannedMatch = (m: MatchItem) => {
    return (
      m.status === 'DATE_PLANNED' ||
      Boolean(m.datePlannedAt) ||
      Boolean(m.dateVenue) ||
      (typeof m.lastMessage === 'string' && m.lastMessage.includes('[BLUNDERR_DATE_ACCEPTED]'))
    );
  };

  const formatLastMessagePreview = (msg?: string) => {
    if (!msg) return 'Chat lounge unlocked! Say hi 👋';
    if (msg.startsWith('[BLUNDERR_DATE_ACCEPTED]')) return '🥂 Date Confirmed & Scheduled!';
    if (msg.startsWith('[BLUNDERR_DATE_PROPOSAL]')) return '💌 Real Date Invitation Proposed!';
    if (msg.startsWith('[BLUNDERR_DATE_RESCHEDULE]')) return '💬 Suggested Alternate Date Plan';
    if (msg.startsWith('[BLUNDERR_DATE_DECLINED]')) return '✖️ Date Proposal Declined';
    if (msg.startsWith('E2EE:v1:')) return '🔒 Encrypted message';
    return msg;
  };

  // Instant refresh on tab focus so matches appear immediately without pull-to-refresh
  // Always land with 'ALL' filter selected
  useFocusEffect(
    useCallback(() => {
      setFilterType('ALL');
      setSearchQuery('');
      loadMatches(matches.length > 0);
    }, [loadMatches, matches.length])
  );

  // Instant real-time UI refresh over WebSocket when matches or likes occur
  useEffect(() => {
    const unsubscribe = subscribeToWebSocket((data) => {
      if (
        data.type === 'MATCH' ||
        data.type === 'LIKE' ||
        data.type === 'ICEBREAKER_ANSWERED' ||
        data.type === 'CHAT_UNLOCKED' ||
        data.type === 'CHAT'
      ) {
        loadMatches(true);
      }
    });
    return unsubscribe;
  }, [subscribeToWebSocket, loadMatches]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMatches(true);
    setIsRefreshing(false);
  };

  const handleLikeCandidate = async (candidate: CandidateCard) => {
    try {
      hapticFeedback.success();
      const res = await api.interact(candidate.userId, 'LIKE');
      setSelectedLikeCandidate(null);
      setLikesReceived((prev) => prev.filter((c) => c.userId !== candidate.userId));
      await loadMatches(true);
      if (res?.isMatch && res?.matchId) {
        router.push({
          pathname: '/matches/icebreaker',
          params: { matchId: res.matchId },
        });
      }
    } catch (err) {
      console.warn('Failed to like candidate:', err);
    }
  };

  const handlePassCandidate = async (candidate: CandidateCard) => {
    try {
      hapticFeedback.selection();
      await api.interact(candidate.userId, 'PASS');
      setSelectedLikeCandidate(null);
      setLikesReceived((prev) => prev.filter((c) => c.userId !== candidate.userId));
    } catch (err) {
      console.warn('Failed to pass candidate:', err);
    }
  };

  const counts = useMemo(() => ({
    all: matches.length,
    active: matches.filter((m) => !isDatePlannedMatch(m) && (m.status === 'ACTIVE_CHAT' || (m.status === 'PENDING_ICEBREAKER' && (m.icebreakerQuiz?.hasAnswered || m.icebreakerQuiz?.isCompleted)))).length,
    quiz: matches.filter((m) => !isDatePlannedMatch(m) && m.status === 'PENDING_ICEBREAKER' && !m.icebreakerQuiz?.hasAnswered && !m.icebreakerQuiz?.isCompleted).length,
    expiring: matches.filter((m) => !isDatePlannedMatch(m) && m.remainingHours <= 24).length,
    datesPlanned: matches.filter(isDatePlannedMatch).length,
  }), [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || (item.otherUserName && item.otherUserName.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      const isQuizPending = item.status === 'PENDING_ICEBREAKER' && !item.icebreakerQuiz?.hasAnswered && !item.icebreakerQuiz?.isCompleted;
      const isPlanned = isDatePlannedMatch(item);

      if (filterType === 'DATES_PLANNED') return isPlanned;
      if (filterType === 'QUIZ') return isQuizPending && !isPlanned;
      if (filterType === 'EXPIRING') return item.remainingHours <= 24 && !isPlanned;
      if (filterType === 'ACTIVE') return !isQuizPending && !isPlanned;
      return true;
    });
  }, [matches, searchQuery, filterType]);

  const handleSelectFilter = (type: MatchFilterType) => {
    hapticFeedback.selection();
    setFilterType(type);
  };

  const getCandidateProfile = (item: MatchItem): CandidateCard => {
    if (item.otherProfile) {
      return {
        ...item.otherProfile,
        displayName: item.otherProfile.displayName || item.otherUserName,
        age: item.otherProfile.age || item.otherUserAge,
        photos: item.otherProfile.photos?.length
          ? item.otherProfile.photos
          : item.otherUserPhoto
          ? [item.otherUserPhoto]
          : [],
      };
    }
    return {
      userId: item.otherUserId,
      displayName: item.otherUserName,
      fullName: item.otherUserName,
      age: item.otherUserAge,
      isDigilockerVerified: item.isDigilockerVerified,
      isWhatsappVerified: true,
      livenessScore: 0.98,
      distanceKm: 3.5,
      culturalBadges: {
        diet: 'PURE_VEG',
        living: 'INDEPENDENT_FLAT',
        languages: ['English', 'Hindi'],
        zodiac: 'Aries',
      },
      compatibilityScore: 92,
      bio: 'High-intent match on BlunderR. Unlocked 48h ephemeral chat lounge.',
      occupation: 'Professional',
      company: 'Bengaluru Tech',
      education: 'Bachelors Degree',
      height: 175,
      relationshipIntent: 'Long-term partner',
      interests: 'Coffee, Music, Reading, Travel, Foodie',
      photos: item.otherUserPhoto ? [item.otherUserPhoto] : [],
    };
  };

  const renderMatchItem = ({ item }: { item: MatchItem }) => {
    const isPending = item.status === 'PENDING_ICEBREAKER' && !item.icebreakerQuiz?.hasAnswered && !item.icebreakerQuiz?.isCompleted;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => {
          if (item.status === 'QUEUED_CAPACITY') {
            hapticFeedback.medium();
            setPendingQueuedMatch(item);
            setShowSlotManagerModal(true);
            return;
          }
          if (FEATURE_FLAGS.ENABLE_STORE && (item.status === 'EXPIRED' || item.remainingHours <= 0) && item.status !== 'DATE_PLANNED' && !userProfile?.hasActivePass) {
            hapticFeedback.warning();
            setGatingFeature('REVIVE');
            setGatingModalVisible(true);
            return;
          }
          if (isPending) {
            router.push({
              pathname: '/matches/icebreaker',
              params: { matchId: item.id },
            });
          } else {
            router.push({
              pathname: '/chat/[id]',
              params: { id: item.id, name: item.otherUserName },
            });
          }
        }}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setSelectedMatch(item)}>
          {/* Urgency Color-Coded Ring */}
          <View
            style={[
              styles.avatarRing,
              { borderColor: getUrgencyRingColor(item) },
              isDatePlannedMatch(item) && styles.avatarRingGold,
            ]}>
            <ExpoImage
              source={{ uri: item.otherUserPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=75' }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          </View>

          {/* Pulsing Breathing Ring Glow for < 12h or Expired */}
          {(item.remainingHours <= 12 || item.status === 'EXPIRED') && !isDatePlannedMatch(item) && item.status !== 'QUEUED_CAPACITY' && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulsingGlowRing,
                { opacity: pulseAnim },
              ]}
            />
          )}

          {isDatePlannedMatch(item) && (
            <View style={styles.datePlannedAvatarBadge}>
              <Text style={{ fontSize: 10 }}>🥂</Text>
            </View>
          )}

          {item.isDigilockerVerified && (
            <View style={styles.goldBadgeDot}>
              <Text style={styles.goldBadgeDotText}>🛡️</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.matchName}>{item.otherUserName}, {item.otherUserAge}</Text>
            {isDatePlannedMatch(item) ? (
              <View style={styles.datePlannedBadge}>
                <Text style={styles.datePlannedText}>☕ Date Planned</Text>
              </View>
            ) : item.status === 'QUEUED_CAPACITY' ? (
              <View style={styles.queuedBadge}>
                <Text style={styles.queuedBadgeText}>🔒 Queued (5/5)</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.timerBadge,
                  (item.remainingHours <= 12 || item.status === 'EXPIRED')
                    ? styles.timerBadgeUrgent
                    : item.remainingHours <= 24
                    ? styles.timerBadgeWarning
                    : isPending
                    ? styles.timerBadgePending
                    : styles.timerBadgeNormal,
                ]}>
                <Text
                  style={[
                    styles.timerText,
                    (item.remainingHours <= 12 || item.status === 'EXPIRED')
                      ? styles.timerTextUrgent
                      : item.remainingHours <= 24
                      ? styles.timerTextWarning
                      : isPending
                      ? styles.timerTextPending
                      : styles.timerTextNormal,
                  ]}>
                  ⏳ {item.status === 'EXPIRED' || item.remainingHours === 0 ? 'Expired' : `${item.remainingHours}h left`}
                </Text>
              </View>
            )}
          </View>

          {isPending ? (
            <View style={styles.quizUnlockRow}>
              <Text style={styles.quizPrompt}>⚡ 10s Rapid-Fire Quiz Required</Text>
              <Text style={styles.quizSub}>Answer 1 quick question to unlock chat lounge</Text>
            </View>
          ) : (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {formatLastMessagePreview(item.lastMessage)}
            </Text>
          )}
        </View>

        <View style={styles.chevronBox}>
          <Text style={styles.chevron}>{isPending ? 'Play →' : '💬'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Matches & Conversations</Text>
          <Text style={styles.subtitle}>48h Ephemeral Timer • Ghost-Buster Protected</Text>
        </View>
      </View>

      {/* Ghost-Buster Karma Reminder */}
      <View style={styles.karmaBanner}>
        <Text style={styles.karmaIcon}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.karmaTitle}>Match Karma Active (Score: 145)</Text>
          <Text style={styles.karmaSub}>
            Exchanging 4+ messages boosts profile spotlight; ghosting docks -8 karma points.
          </Text>
        </View>
      </View>

      {/* Received Likes / Sparks Carousel */}
      {likesReceived.length > 0 && (
        <View style={styles.sparksSection}>
          <View style={styles.sparksHeader}>
            <Text style={styles.sparksTitle}>💖 New Sparks • Liked You ({likesReceived.length})</Text>
            <Text style={styles.sparksSub}>Tap to view profile & match back</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sparksScroll}>
            {likesReceived.map((item) => {
              const hasSparkNote = Boolean(item.commentText);
              return (
                <TouchableOpacity
                  key={item.userId}
                  style={[styles.sparkCard, hasSparkNote && styles.sparkCardWithNote]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLikeCandidate(item)}>
                  <View style={[styles.sparkAvatarWrap, hasSparkNote && styles.sparkAvatarWrapWithNote]}>
                    <ExpoImage
                      source={{ uri: item.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' }}
                      style={styles.sparkAvatar}
                      contentFit="cover"
                    />
                    <View style={[styles.sparkBadge, hasSparkNote && styles.sparkNoteBadge]}>
                      <Text style={{ fontSize: 10 }}>{hasSparkNote ? '✨' : '❤️'}</Text>
                    </View>
                  </View>
                  <Text style={styles.sparkName} numberOfLines={1}>
                    {item.displayName || 'Someone'}
                  </Text>
                  {hasSparkNote ? (
                    <Text style={styles.sparkNoteText} numberOfLines={1}>
                      💬 {item.commentText}
                    </Text>
                  ) : (
                    <Text style={styles.sparkHint}>Liked you</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Rule of 5 Active Match Capacity Bar */}
      <TouchableOpacity
        style={[styles.ruleOfFiveCard, capacity?.isAtCapacity && styles.ruleOfFiveCardCapacity]}
        onPress={() => {
          hapticFeedback.light();
          setShowRuleOfFiveModal(true);
        }}
        activeOpacity={0.85}>
        <View style={styles.ruleOfFiveLeft}>
          <View style={[styles.ruleOfFiveIconBadge, capacity?.isAtCapacity && styles.ruleOfFiveIconBadgeCapacity]}>
            <Text style={{ fontSize: 13 }}>{capacity?.isAtCapacity ? '⚡' : '🎯'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.ruleOfFiveTitleRow}>
              <Text style={styles.ruleOfFiveTitle}>Rule of 5 Focus</Text>
              <Text style={[styles.ruleOfFiveCount, capacity?.isAtCapacity && styles.ruleOfFiveCountCapacity]}>
                {capacity?.activeMatchesCount ?? matches.filter((m) => m.status === 'ACTIVE_CHAT' || m.status === 'PENDING_ICEBREAKER').length}/5 Active
              </Text>
            </View>
            <Text style={styles.ruleOfFiveSub} numberOfLines={1}>
              {capacity?.isAtCapacity
                ? 'Focus limit reached • Plan a date to free a slot'
                : `${5 - (capacity?.activeMatchesCount ?? matches.filter((m) => m.status === 'ACTIVE_CHAT' || m.status === 'PENDING_ICEBREAKER').length)} slots open • Zero ghosting culture`}
            </Text>
          </View>
        </View>

        {/* 5 Slot Dots */}
        <View style={styles.ruleOfFiveDotsRow}>
          {[1, 2, 3, 4, 5].map((slot) => {
            const currentActive = capacity?.activeMatchesCount ?? matches.filter((m) => m.status === 'ACTIVE_CHAT' || m.status === 'PENDING_ICEBREAKER').length;
            const isFilled = slot <= currentActive;
            return (
              <View
                key={slot}
                style={[
                  styles.slotDot,
                  isFilled ? (currentActive >= 5 ? styles.slotDotCapacity : styles.slotDotFilled) : styles.slotDotEmpty,
                ]}
              />
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search matches by name..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Smart Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsContent}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
            onPress={() => handleSelectFilter('ALL')}
            activeOpacity={0.8}>
            <Text style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'ACTIVE' && styles.filterChipActive]}
            onPress={() => handleSelectFilter('ACTIVE')}
            activeOpacity={0.8}>
            <Text style={[styles.filterChipText, filterType === 'ACTIVE' && styles.filterChipTextActive]}>
              💬 Active Lounge ({counts.active})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'DATES_PLANNED' && styles.filterChipActive]}
            onPress={() => handleSelectFilter('DATES_PLANNED')}
            activeOpacity={0.8}>
            <Text style={[styles.filterChipText, filterType === 'DATES_PLANNED' && styles.filterChipTextActive]}>
              ☕ Planned Dates ({counts.datesPlanned})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'QUIZ' && styles.filterChipActive]}
            onPress={() => handleSelectFilter('QUIZ')}
            activeOpacity={0.8}>
            <Text style={[styles.filterChipText, filterType === 'QUIZ' && styles.filterChipTextActive]}>
              ⚡ Quiz Required ({counts.quiz})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'EXPIRING' && styles.filterChipActive]}
            onPress={() => handleSelectFilter('EXPIRING')}
            activeOpacity={0.8}>
            <Text style={[styles.filterChipText, filterType === 'EXPIRING' && styles.filterChipTextActive]}>
              ⏳ Expiring Soon ({counts.expiring})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterChipBlocked}
            onPress={() => {
              hapticFeedback.light();
              router.push('/blocked-profiles' as any);
            }}
            activeOpacity={0.8}>
            <Text style={styles.filterChipBlockedText}>
              🛡️ Blocked & Reported ({blockedUsers.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E94057" />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💌</Text>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptySub}>Send high-intent comments on prompt cards in discovery!</Text>
        </View>
      ) : filteredMatches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No Matches Found</Text>
          <Text style={styles.emptySub}>
            No conversations match your search or current filter.
          </Text>
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => {
              setSearchQuery('');
              setFilterType('ALL');
            }}>
            <Text style={styles.clearFilterBtnText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#E94057"
            />
          }
        />
      )}

      {/* Full Profile Viewer Modal */}
      <ProfileDetailModal
        visible={!!selectedMatch}
        candidate={selectedMatch ? getCandidateProfile(selectedMatch) : null}
        onClose={() => setSelectedMatch(null)}
        scheduledDate={
          selectedMatch?.status === 'DATE_PLANNED' || selectedMatch?.datePlannedAt || selectedMatch?.dateVenue
            ? {
                date: selectedMatch.datePlannedAt ? selectedMatch.datePlannedAt.split(' at ')[0] || selectedMatch.datePlannedAt : 'Scheduled Date',
                time: selectedMatch.datePlannedAt && selectedMatch.datePlannedAt.includes(' at ') ? selectedMatch.datePlannedAt.split(' at ')[1] : '7:30 PM',
                venue: selectedMatch.dateVenue || 'Verified Partner Venue',
                note: selectedMatch.dateNote || 'Confirmed SafeDate',
                status: 'ACCEPTED' as const,
              }
            : null
        }
        onStartChat={() => {
          if (!selectedMatch) return;
          const target = selectedMatch;
          setSelectedMatch(null);
          if (FEATURE_FLAGS.ENABLE_STORE && target.remainingHours <= 0 && !userProfile?.hasActivePass) {
            hapticFeedback.warning();
            setGatingFeature('REVIVE');
            setGatingModalVisible(true);
            return;
          }
          if (target.status === 'PENDING_ICEBREAKER') {
            router.push({
              pathname: '/matches/icebreaker',
              params: { matchId: target.id },
            });
          } else {
            router.push({
              pathname: '/chat/[id]',
              params: { id: target.id, name: target.otherUserName },
            });
          }
        }}
        onVirtualChai={() => {
          if (!selectedMatch) return;
          const target = selectedMatch;
          setSelectedMatch(null);
          router.push({
            pathname: '/chat/[id]',
            params: { id: target.id, name: target.otherUserName },
          });
        }}
      />

      {/* PLAN / SUBSCRIPTION GATING MODAL */}
      <SubscriptionGatingModal
        visible={gatingModalVisible}
        feature={gatingFeature}
        onClose={() => setGatingModalVisible(false)}
        onUpgrade={() => {
          setGatingModalVisible(false);
          router.push('/(tabs)/store');
        }}
      />

      {/* Profile Detail Modal for Incoming Sparks / Likes */}
      <ProfileDetailModal
        visible={Boolean(selectedLikeCandidate)}
        candidate={selectedLikeCandidate}
        onClose={() => setSelectedLikeCandidate(null)}
        onLike={() => {
          if (selectedLikeCandidate) handleLikeCandidate(selectedLikeCandidate);
        }}
        onPass={() => {
          if (selectedLikeCandidate) handlePassCandidate(selectedLikeCandidate);
        }}
      />

      {/* Rule of 5 Explainer Modal */}
      <Modal
        visible={showRuleOfFiveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRuleOfFiveModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.ruleModalContent}>
            <View style={styles.ruleModalIconWrapper}>
              <Text style={{ fontSize: 32 }}>🎯</Text>
            </View>

            <Text style={styles.ruleModalTitle}>The Rule of 5</Text>
            <Text style={styles.ruleModalSubtitle}>Why BlunderR caps active chats at 5</Text>

            <View style={styles.ruleModalPillars}>
              <View style={styles.rulePillarRow}>
                <Text style={styles.rulePillarIcon}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rulePillarHeading}>Zero Ghosting Graveyards</Text>
                  <Text style={styles.rulePillarText}>
                    Other apps let people collect 100 dead matches. Here, every match gets your genuine focus and respect.
                  </Text>
                </View>
              </View>

              <View style={styles.rulePillarRow}>
                <Text style={styles.rulePillarIcon}>☕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rulePillarHeading}>Plan a Date to Free a Slot</Text>
                  <Text style={styles.rulePillarText}>
                    When you schedule a date or exchange numbers, the chat moves to your Date Book and opens a fresh slot!
                  </Text>
                </View>
              </View>

              <View style={styles.rulePillarRow}>
                <Text style={styles.rulePillarIcon}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rulePillarHeading}>300% Higher Reply Rate</Text>
                  <Text style={styles.rulePillarText}>
                    Because everyone has a 5-match cap, your messages actually get read, appreciated, and replied to.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.ruleModalBtn}
              onPress={() => {
                hapticFeedback.light();
                setShowRuleOfFiveModal(false);
              }}
              activeOpacity={0.85}>
              <Text style={styles.ruleModalBtnText}>Got it, let's connect!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5-Slot Capacity Manager Modal (User-Choice Slot Freeing) */}
      <Modal
        visible={showSlotManagerModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isFreeingSlot) setShowSlotManagerModal(false);
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.slotManagerContent}>
            <View style={styles.slotManagerHeader}>
              <View style={styles.slotManagerBadge}>
                <Text style={{ fontSize: 18 }}>🎯</Text>
                <Text style={styles.slotManagerBadgeText}>Active Limit Reached (5/5)</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSlotManagerModal(false)}
                disabled={isFreeingSlot}
                style={styles.slotManagerCloseBtn}>
                <Text style={styles.slotManagerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.slotManagerTitle}>
              Unlock chat with {pendingQueuedMatch?.otherUserName || 'your match'}
            </Text>
            <Text style={styles.slotManagerSub}>
              Under the Rule of 5, you can have up to 5 active chats. Choose one of your existing conversations below to resolve so you can start chatting:
            </Text>

            {isFreeingSlot ? (
              <View style={styles.slotManagerLoading}>
                <ActivityIndicator size="large" color="#FF385C" />
                <Text style={styles.slotManagerLoadingText}>Freeing active slot & unlocking conversation...</Text>
              </View>
            ) : (
              <ScrollView style={styles.slotManagerList} showsVerticalScrollIndicator={false}>
                {activeRuleOfFiveMatches.length === 0 ? (
                  <Text style={styles.slotManagerEmptyText}>No active conversations to resolve.</Text>
                ) : (
                  activeRuleOfFiveMatches.map((m) => {
                    const isExp = m.status === 'EXPIRED' || m.remainingHours === 0;
                    return (
                      <View key={m.id} style={[styles.slotMatchCard, isExp && styles.slotMatchCardExpired]}>
                        <View style={styles.slotMatchCardLeft}>
                          <ExpoImage
                            source={{ uri: m.otherUserPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=75' }}
                            style={[
                              styles.slotMatchAvatar,
                              { borderColor: getUrgencyRingColor(m) },
                            ]}
                            contentFit="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <View style={styles.slotMatchNameRow}>
                              <Text style={styles.slotMatchName}>{m.otherUserName}, {m.otherUserAge}</Text>
                              <View
                                style={[
                                  styles.slotStatusPill,
                                  isExp ? styles.slotStatusPillExpired : styles.slotStatusPillActive,
                                ]}>
                                <Text
                                  style={[
                                    styles.slotStatusPillText,
                                    isExp ? styles.slotStatusPillTextExpired : styles.slotStatusPillTextActive,
                                  ]}>
                                  {isExp ? '⏳ Expired' : `⏳ ${m.remainingHours}h left`}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.slotMatchSnippet} numberOfLines={1}>
                              {m.lastMessage || 'Recent connection'}
                            </Text>
                          </View>
                        </View>

                        {/* Action buttons to free slot */}
                        <View style={styles.slotActionRow}>
                          <TouchableOpacity
                            style={styles.slotPlanDateBtn}
                            onPress={() => handleResolveSlotAndUnlock(m, 'PLAN_DATE')}>
                            <Text style={styles.slotPlanDateBtnText}>Plan Date ☕</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.slotFarewellBtn}
                            onPress={() => handleResolveSlotAndUnlock(m, 'FAREWELL')}>
                            <Text style={styles.slotFarewellBtnText}>Farewell 🕊️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.slotManagerDismissBtn}
              onPress={() => setShowSlotManagerModal(false)}
              disabled={isFreeingSlot}>
              <Text style={styles.slotManagerDismissBtnText}>Keep Current 5 Chats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3D Liveness Retake Recovery Modal (Single-Flag System) */}
      <LivenessRetakeModal
        visible={showLivenessRetakeModal}
        onClose={() => setShowLivenessRetakeModal(false)}
        referrer="Matches & Chats"
        onSuccess={() => {
          loadMatches(true);
        }}
      />

      {/* Blocked & Reported Accounts Management Modal */}
      <Modal
        visible={showBlockedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockedModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.blockedModalContent}>
            <View style={styles.blockedModalHeader}>
              <View style={styles.blockedModalTitleWrap}>
                <View style={styles.blockedModalShieldIcon}>
                  <Text style={{ fontSize: 20 }}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedModalTitle}>Blocked & Reported Accounts</Text>
                  <Text style={styles.blockedModalSub}>
                    Reported or blocked someone by mistake? Unblock them here.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowBlockedModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingBlocked ? (
              <View style={styles.blockedLoadingWrap}>
                <ActivityIndicator size="small" color="#FF385C" />
                <Text style={styles.blockedLoadingText}>Loading blocked accounts...</Text>
              </View>
            ) : blockedUsers.length === 0 ? (
              <View style={styles.blockedEmptyWrap}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>✨</Text>
                <Text style={styles.blockedEmptyTitle}>Zero Blocked Accounts</Text>
                <Text style={styles.blockedEmptySub}>
                  You haven't blocked or reported any profiles. Accounts you block will appear here for easy unblocking.
                </Text>
              </View>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.targetUserId}
                style={{ maxHeight: 380 }}
                contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.blockedUserCard}>
                    <View style={styles.blockedAvatarWrap}>
                      {item.photoUrl ? (
                        <ExpoImage
                          source={{ uri: item.photoUrl }}
                          style={styles.blockedAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.blockedAvatarFallback}>
                          <Text style={styles.blockedAvatarInitial}>
                            {(item.displayName || 'M').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.blockedUserInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.blockedUserName}>
                          {item.displayName}, {item.age}
                        </Text>
                        <View
                          style={[
                            styles.blockedTypeBadge,
                            item.type.includes('REPORTED')
                              ? styles.blockedTypeBadgeReported
                              : styles.blockedTypeBadgeBlocked,
                          ]}>
                          <Text
                            style={[
                              styles.blockedTypeBadgeText,
                              item.type.includes('REPORTED')
                                ? styles.blockedTypeBadgeTextReported
                                : styles.blockedTypeBadgeTextBlocked,
                            ]}>
                            {item.type.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.blockedUserCity}>📍 {item.city}</Text>

                      {item.reason ? (
                        <Text style={styles.blockedReasonText} numberOfLines={1}>
                          Reason: {item.reason}
                        </Text>
                      ) : null}

                      {item.remarks ? (
                        <Text style={styles.blockedRemarksText} numberOfLines={1}>
                          "{item.remarks}"
                        </Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={styles.unblockBtn}
                      disabled={unblockingUserId === item.targetUserId}
                      onPress={() => handleUnblockUser(item)}
                      activeOpacity={0.75}>
                      {unblockingUserId === item.targetUserId ? (
                        <ActivityIndicator size="small" color="#FF385C" />
                      ) : (
                        <Text style={styles.unblockBtnText}>Unblock</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.blockedDoneBtn}
              onPress={() => setShowBlockedModal(false)}>
              <Text style={styles.blockedDoneBtnText}>Done</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2028',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    color: '#8A8D98',
    fontSize: 12,
    marginTop: 2,
  },
  karmaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 64, 87, 0.1)',
    borderWidth: 1,
    borderColor: '#E94057',
    margin: 16,
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  karmaIcon: {
    fontSize: 20,
  },
  karmaTitle: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  karmaSub: {
    color: '#A8ACBA',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181920',
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#262934',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  goldBadgeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFC107',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadgeDotText: {
    fontSize: 10,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  timerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  timerBadgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  timerBadgePending: {
    backgroundColor: 'rgba(242, 113, 33, 0.15)',
    borderColor: '#F27121',
  },
  timerBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  timerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timerTextNormal: {
    color: '#34D399',
  },
  timerTextPending: {
    color: '#F27121',
  },
  timerTextWarning: {
    color: '#FCD34D',
  },
  timerTextUrgent: {
    color: '#F87171',
  },
  quizUnlockRow: {
    marginTop: 4,
  },
  quizPrompt: {
    color: '#F27121',
    fontSize: 12,
    fontWeight: '700',
  },
  quizSub: {
    color: '#7F8496',
    fontSize: 11,
    marginTop: 2,
  },
  lastMessage: {
    color: '#8E94A5',
    fontSize: 13,
    marginTop: 4,
  },
  chevronBox: {
    marginLeft: 8,
    padding: 4,
  },
  chevron: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    color: '#8A8D98',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  viewProfileChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1F28',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  viewProfileChipText: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181922',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#252836',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
    marginLeft: 4,
  },
  clearSearchText: {
    color: '#8A8D98',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabsContainer: {
    marginBottom: 10,
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#161720',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262938',
  },
  filterChipActive: {
    backgroundColor: 'rgba(233, 64, 87, 0.16)',
    borderColor: '#E94057',
  },
  filterChipText: {
    color: '#8A8D98',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FF6584',
    fontWeight: '700',
  },
  clearFilterBtn: {
    marginTop: 14,
    backgroundColor: '#E94057',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sparksSection: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  sparksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparksTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6584',
  },
  sparksSub: {
    fontSize: 11,
    color: '#8A8D98',
  },
  sparksScroll: {
    gap: 12,
    paddingRight: 16,
  },
  sparkCard: {
    alignItems: 'center',
    width: 68,
  },
  sparkAvatarWrap: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#E94057',
    padding: 2,
    backgroundColor: '#1E2028',
  },
  sparkAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  sparkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#E94057',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0E0F13',
  },
  sparkName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  sparkHint: {
    color: '#FF6584',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  sparkCardWithNote: {
    width: 84,
  },
  sparkAvatarWrapWithNote: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  sparkNoteBadge: {
    backgroundColor: '#F59E0B',
  },
  sparkNoteText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  // Rule of 5 Capacity Card
  ruleOfFiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141724',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ruleOfFiveCardCapacity: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  ruleOfFiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ruleOfFiveIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleOfFiveIconBadgeCapacity: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  ruleOfFiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleOfFiveTitle: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '800',
  },
  ruleOfFiveCount: {
    color: '#FF385C',
    fontSize: 11,
    fontWeight: '800',
  },
  ruleOfFiveCountCapacity: {
    color: '#F59E0B',
  },
  ruleOfFiveSub: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 1,
  },
  ruleOfFiveDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotDotFilled: {
    backgroundColor: '#FF385C',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  slotDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  slotDotCapacity: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  // Date Planned Badge
  datePlannedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
  },
  datePlannedText: {
    color: '#00E676',
    fontSize: 10.5,
    fontWeight: '800',
  },
  // Rule of 5 Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ruleModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0E111A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    alignItems: 'center',
  },
  ruleModalIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  ruleModalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  ruleModalSubtitle: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  ruleModalPillars: {
    width: '100%',
    gap: 14,
    marginBottom: 22,
  },
  rulePillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rulePillarIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  rulePillarHeading: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rulePillarText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  ruleModalBtn: {
    width: '100%',
    backgroundColor: '#FF385C',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  ruleModalBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  matchesLivenessGateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    gap: 12,
  },
  matchesLivenessIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchesLivenessTitle: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800',
  },
  matchesLivenessSub: {
    color: '#FECACA',
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  matchesLivenessBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  matchesLivenessBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // Urgency Rings & Avatar Badges
  avatarRing: {
    borderRadius: 32,
    borderWidth: 2.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingGold: {
    borderColor: '#FFD700',
    borderWidth: 2.5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  pulsingGlowRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FF4757',
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
  },
  datePlannedAvatarBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#0E111A',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  queuedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
  },
  queuedBadgeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  // 5-Slot Capacity Manager Modal Styles
  slotManagerContent: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#0E111A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
  },
  slotManagerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  slotManagerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotManagerBadgeText: {
    color: '#FF6584',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  slotManagerCloseBtn: {
    padding: 6,
  },
  slotManagerCloseText: {
    color: '#8A8D98',
    fontSize: 13,
    fontWeight: '700',
  },
  slotManagerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  slotManagerSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  slotManagerLoading: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotManagerLoadingText: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '600',
  },
  slotManagerList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  slotManagerEmptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 20,
  },
  slotMatchCard: {
    backgroundColor: '#161924',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 12,
    marginBottom: 10,
  },
  slotMatchCardExpired: {
    borderColor: 'rgba(255, 71, 87, 0.4)',
    backgroundColor: 'rgba(255, 71, 87, 0.05)',
  },
  slotMatchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  slotMatchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  slotMatchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  slotMatchName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  slotStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotStatusPillActive: {
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
  },
  slotStatusPillExpired: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  slotStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  slotStatusPillTextActive: {
    color: '#2ED573',
  },
  slotStatusPillTextExpired: {
    color: '#FF4757',
  },
  slotMatchSnippet: {
    color: '#64748B',
    fontSize: 11,
  },
  slotActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotPlanDateBtn: {
    flex: 1,
    backgroundColor: '#00E676',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPlanDateBtnText: {
    color: '#0A0C12',
    fontSize: 11.5,
    fontWeight: '800',
  },
  slotFarewellBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFarewellBtnText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '700',
  },
  slotManagerDismissBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  slotManagerDismissBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  headerShieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.3)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerShieldIcon: {
    fontSize: 13,
  },
  headerShieldText: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '800',
  },
  headerShieldBadge: {
    backgroundColor: '#FF385C',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  headerShieldBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  filterChipBlocked: {
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  filterChipBlockedText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '700',
  },
  blockedModalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#161822',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  blockedModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  blockedModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  blockedModalShieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  blockedModalSub: {
    color: '#8E94A8',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  modalCloseX: {
    color: '#8E94A8',
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  blockedLoadingWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  blockedLoadingText: {
    color: '#8E94A8',
    fontSize: 13,
  },
  blockedEmptyWrap: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  blockedEmptySub: {
    color: '#6F7487',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  blockedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1018',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  blockedAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: '#1E2230',
  },
  blockedAvatar: {
    width: '100%',
    height: '100%',
  },
  blockedAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1F36',
  },
  blockedAvatarInitial: {
    color: '#FF6B8B',
    fontSize: 18,
    fontWeight: '800',
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  blockedUserCity: {
    color: '#767C92',
    fontSize: 11,
    marginTop: 1,
  },
  blockedTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  blockedTypeBadgeBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  blockedTypeBadgeReported: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  blockedTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  blockedTypeBadgeTextBlocked: {
    color: '#FCA5A5',
  },
  blockedTypeBadgeTextReported: {
    color: '#FCD34D',
  },
  blockedReasonText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  blockedRemarksText: {
    color: '#64748B',
    fontSize: 10.5,
    fontStyle: 'italic',
    marginTop: 1,
  },
  unblockBtn: {
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderWidth: 1,
    borderColor: '#FF385C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockBtnText: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '800',
  },
  blockedDoneBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

