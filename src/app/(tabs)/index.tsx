import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { ActionType, CandidateCard, ContextType, SparkNoteQuota, UserProfile } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import SparkNoteModal from '@/components/spark-note-modal';
import DesireProfileModal from '@/components/desire-profile-modal';
import MatchCelebrationModal from '@/components/match-celebration-modal';
import CosmicKundaliModal from '@/components/cosmic-kundali-modal';
import MicroCommunityModal from '@/components/micro-community-modal';
import SubscriptionGatingModal, { GatingFeatureType } from '@/components/subscription-gating-modal';
import { MicroCircle } from '@/types';
import { FEATURE_FLAGS } from '@/config/features';
import { Image as ExpoImage } from 'expo-image';
import { MODEL_ASSETS, MEME_ASSETS, getModelAsset, resolveImageSource } from '@/constants/assets';
import { hapticFeedback } from '@/utils/haptics';
import { BlunderRWordmark } from '@/components/blunderr-wordmark';
import DopamineCuriosityLoop from '@/components/dopamine-curiosity-loop';
import { useLivenessRecovery } from '@/services/liveness-recovery';
import LivenessRetakeModal from '@/components/liveness-retake-modal';
import DiscoveryVoiceSnippet from '@/components/discovery-voice-snippet';
import { VibeQuizCard } from '@/components/vibe-quiz-card';
import { LifestyleSyncModal } from '@/components/lifestyle-sync-modal';
import { getEngagementStatus, recordSwipeEvent, markInterstitialShownToday } from '@/utils/engagement-cadence';
import { useThemedStyles } from '@/context/theme-context';

const PRESERVE_PHOTO_SCRIM_STYLES = [
  'photoBottomScrim',
  'candidateNameText',
  'promptTeaserText',
  'lifestyleChip',
  'lifestyleChipText',
  'voicePromptPill',
  'voicePromptDuration',
  'voicePromptLabel',
  'photoCountPill',
  'locationPill',
  'datingVerifiedPill',
] as const;

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = Math.max(470, Math.min(height - 180, 590));

const getDietBadge = (diet?: string) => {
  switch (diet) {
    case 'STRICT_JAIN':
      return '🪷 Strict Jain';
    case 'PURE_VEG':
      return '🥦 Pure Veg';
    case 'VEGAN':
      return '🌱 Vegan';
    case 'EGGETARIAN':
      return '🍳 Eggetarian';
    case 'NON_VEG':
      return '🍗 Non-Veg';
    default:
      return diet ? `🥗 ${diet.replace('_', ' ')}` : '🥗 Veg';
  }
};

const FILTER_TAGS = [
  { id: 'ALL', label: '🌟 All Profiles' },
  { id: 'PURE_VEG', label: '🥦 Pure Veg' },
  { id: 'STRICT_JAIN', label: '🪷 Strict Jain' },
  { id: 'VEGAN', label: '🌱 Vegan' },
  { id: 'EGGETARIAN', label: '🍳 Eggetarian' },
  { id: 'NON_VEG', label: '🍗 Non-Veg' },
  { id: 'MOUNTAINS', label: '🏔️ Mountains' },
  { id: 'BEACHES', label: '🏖️ Beaches' },
  { id: 'NON_SMOKER', label: '🚭 Non-Smoker' },
  { id: 'NON_DRINKER', label: '🚫 Teetotaler' },
];

const FALLBACK_DISCOVERY_CANDIDATES: CandidateCard[] = [
  {
    userId: 'c_tanya_24',
    displayName: 'Tanya',
    age: 24,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 98,
    distanceKm: 2.1,
    city: 'Bengaluru',
    neighborhood: 'Indiranagar 100ft Rd',
    microCircle: '☕ Indiranagar Third Wave Cafe Club',
    job: 'Product Designer @ Fintech',
    institute: 'NID Ahmedabad',
    height: 168,
    photos: [
      MODEL_ASSETS.tara,
      MODEL_ASSETS.ananya,
    ],
    bio: 'Designing user journeys by day, hunting for sour beers & indie gig spots by night. Low social battery for small talk.',
    culturalBadges: {
      diet: 'PURE_VEG' as any,
      living: 'WITH_FLATMATES' as any,
      languages: ['English', 'Hindi'],
      zodiac: 'Taurus ♉ (Rohini)',
    },
    compatibilityScore: 96,
    cosmicChemistry: {
      synergyTag: 'Rohini & Uttara Phalguni 32/36 Gunas',
      score: 96,
    },
    selectedMemeTitle: 'Sunday brunch priorities 🥐',
    selectedMemeUrl: MEME_ASSETS[3],
  },
  {
    userId: 'c_aarav_26',
    displayName: 'Aarav',
    age: 26,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 96,
    distanceKm: 3.4,
    city: 'Bengaluru',
    neighborhood: 'Koramangala 4th Block',
    microCircle: '🚀 Koramangala Tech Founders & Builders',
    job: 'Founding Engineer @ AI Infra',
    institute: 'IIT Roorkee',
    height: 181,
    photos: [
      MODEL_ASSETS.kabir,
      MODEL_ASSETS.rohan,
    ],
    bio: 'Training LLMs by sunrise, deadlifting by sunset. If you enjoy spontaneous weekend road trips and filter coffee, say hi.',
    culturalBadges: {
      diet: 'EGGETARIAN' as any,
      living: 'ALONE' as any,
      languages: ['English', 'Hindi', 'Kannada'],
      zodiac: 'Scorpio ♏ (Anuradha)',
    },
    compatibilityScore: 92,
    cosmicChemistry: {
      synergyTag: 'Deep Graha Maitri Resonance',
      score: 92,
    },
    selectedMemeTitle: 'Pushing code straight to production 💻',
    selectedMemeUrl: MEME_ASSETS[1],
  },
  {
    userId: 'c_meera_25',
    displayName: 'Meera',
    age: 25,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 97,
    distanceKm: 1.8,
    city: 'Bengaluru',
    neighborhood: 'HSR Sector 3',
    microCircle: '🎨 Bangalore Indie Art & Gig Scene',
    job: 'Brand Strategist & Writer',
    institute: 'St. Xavier’s College',
    height: 165,
    photos: [
      MODEL_ASSETS.meera,
      MODEL_ASSETS.rhea,
    ],
    bio: 'Curating Spotify playlists instead of talking about feelings. Passionate about street photography, monsoon walks, and old bakeries.',
    culturalBadges: {
      diet: 'PURE_VEG' as any,
      living: 'WITH_FAMILY' as any,
      languages: ['English', 'Hindi', 'Gujarati'],
      zodiac: 'Cancer ♋ (Pushya)',
    },
    compatibilityScore: 94,
    cosmicChemistry: {
      synergyTag: 'Pushya Nakshatra High Emotional Bond',
      score: 94,
    },
    selectedMemeTitle: 'My social battery at loud parties 🔋',
    selectedMemeUrl: MEME_ASSETS[0],
  },
];

export default function DiscoveryScreen() {
  const router = useRouter();
  const styles = useThemedStyles(baseStyles, PRESERVE_PHOTO_SCRIM_STYLES as any);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactScreen = windowWidth < 390;
  const isTinyScreen = windowWidth < 355;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCuriosityLoopActive, setIsCuriosityLoopActive] = useState(true);
  const [radarCycleKey, setRadarCycleKey] = useState(1);
  const [isRadarDismissing, setIsRadarDismissing] = useState(false);
  const radarFadeAnim = useRef(new Animated.Value(1)).current;
  const loopTimerFinishedRef = useRef(false);
  const feedLoadedRef = useRef(false);

  const dismissRadar = useCallback(() => {
    setIsRadarDismissing(true);
    Animated.timing(radarFadeAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsCuriosityLoopActive(false);
      setIsRadarDismissing(false);
    });
  }, [radarFadeAnim]);
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [remainingSwipes, setRemainingSwipes] = useState(25);
  const [swipedHistory, setSwipedHistory] = useState<{ candidate: CandidateCard; action: ActionType }[]>([]);

  // User Profile & Plan Gating State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gatingModalVisible, setGatingModalVisible] = useState(false);
  const [gatingFeature, setGatingFeature] = useState<GatingFeatureType>('SWIPE');

  // Exact 1-screen viewport dimensions
  const [feedDimensions, setFeedDimensions] = useState<{ width: number; height: number }>({
    width,
    height: Math.max(450, height - 160),
  });

  // Reference to main candidate cards FlatList (enables resetting to 1st profile upon returning to tab)
  const feedFlatListRef = useRef<FlatList<any>>(null);

  // Selected Candidate for Full Profile Inspection Sheet
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCard | null>(null);
  const [showFullProfileModal, setShowFullProfileModal] = useState(false);
  const [showDesireModal, setShowDesireModal] = useState(false);
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState<MicroCircle | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  // Match celebration state
  const [matchedCandidate, setMatchedCandidate] = useState<CandidateCard | null>(null);
  const [celebrationMatchId, setCelebrationMatchId] = useState<string | undefined>(undefined);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [kundaliCandidate, setKundaliCandidate] = useState<CandidateCard | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2000);
  };

  // Spark Note state
  const [sparkNoteModalVisible, setSparkNoteModalVisible] = useState(false);
  const [sparkNoteCandidate, setSparkNoteCandidate] = useState<CandidateCard | null>(null);
  const [sparkNoteQuota, setSparkNoteQuota] = useState<SparkNoteQuota | null>(null);
  const [sparkNoteContext, setSparkNoteContext] = useState<{
    type: ContextType;
    targetId?: string;
    title?: string;
    previewUrl?: string;
    promptText?: string;
  }>({ type: 'PHOTO' });

  // Comment Modal state (legacy fallback)
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    type: ContextType;
    targetId: string;
    title: string;
  }>({ type: 'PROMPT', targetId: 'prompt_chai', title: 'Bio & Lifestyle Prompt' });
  const [commentText, setCommentText] = useState('');

  // Sachet Micro-Chai Modal state
  const [chaiModalVisible, setChaiModalVisible] = useState(false);
  const [chaiTargetCandidate, setChaiTargetCandidate] = useState<CandidateCard | null>(null);

  // Unread notification count for header badge
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Single-flag Async 3D Liveness Recovery
  const { needsRetry: needsLivenessRetry } = useLivenessRecovery();
  const [showLivenessRetakeModal, setShowLivenessRetakeModal] = useState(false);

  // Smart Lifestyle Sync & 1-Tap Vibe Quiz (Flow 1, 3, 4)
  const [showLifestyleSyncModal, setShowLifestyleSyncModal] = useState(false);
  const [dismissedQuiz, setDismissedQuiz] = useState(false);
  const [reflectedToast, setReflectedToast] = useState<string | null>(null);
  const [isEngagementEligible, setIsEngagementEligible] = useState(false);

  const showReflectedToast = (msg: string) => {
    setReflectedToast(msg);
    setTimeout(() => {
      setReflectedToast((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  useFocusEffect(
    useCallback(() => {
      // 🚀 Reset discovery feed scroll position back to the beginning (1st profile)
      // whenever user returns to Discovery tab from Matches, Profile, etc.
      try {
        feedFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch (_) {}

      const resetTimer = setTimeout(() => {
        try {
          feedFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        } catch (_) {}
      }, 60);

      loadFeed();
      api.getSparkNoteQuota().then(setSparkNoteQuota).catch(() => {});
      api.getUnreadNotificationCount().then(setUnreadNotificationCount).catch(() => {});
      getEngagementStatus()
        .then((status) => setIsEngagementEligible(status.isEligibleForPrompt))
        .catch(() => {});

      return () => {
        clearTimeout(resetTimer);
      };
    }, [])
  );

  const activeFilterLabel = selectedCommunityFilter
    ? `Circle: ${selectedCommunityFilter.name}`
    : selectedFilter !== 'ALL'
    ? FILTER_TAGS.find((t) => t.id === selectedFilter)?.label
    : undefined;
  const hasActiveFilter = Boolean(activeFilterLabel);

  const loadFeed = async (communityOverride?: MicroCircle | null, filterOverride?: string) => {
    feedLoadedRef.current = false;
    loopTimerFinishedRef.current = false;
    setIsRadarDismissing(false);
    radarFadeAnim.setValue(1);
    setIsCuriosityLoopActive(true);
    setRadarCycleKey((prev) => prev + 1);
    try {
      // 1. Discovery Gating Check: Name, Gender, Sexual Orientation and >= 30% completion required
      const myProfile = await api.getMyProfile();
      setUserProfile(myProfile);
      const hasName = Boolean(myProfile.displayName?.trim() || myProfile.fullName?.trim());
      const hasGender = Boolean(myProfile.gender || myProfile.genderDisplay);
      const hasOrientation = Boolean(myProfile.sexualOrientation);
      const completionPct = myProfile.completionPercentage || 0;

      if (!hasName || !hasGender || !hasOrientation || completionPct < 30) {
        setLoading(false);
        setRefreshing(false);
        setIsCuriosityLoopActive(false);
        router.replace('/auth/onboarding-decks' as any);
        return;
      }

      let lat = myProfile.latitude;
      let lon = myProfile.longitude;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          // Instant cached location (0ms) to eliminate GPS lock stalls
          const cachedLoc = await Location.getLastKnownPositionAsync().catch(() => null);
          if (cachedLoc?.coords) {
            lat = cachedLoc.coords.latitude;
            lon = cachedLoc.coords.longitude;
          } else {
            // Strict 650ms timeout race so GPS satellite lock never stalls the feed
            const freshLoc = (await Promise.race([
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 650)),
            ]).catch(() => null)) as Location.LocationObject | null;
            if (freshLoc?.coords) {
              lat = freshLoc.coords.latitude;
              lon = freshLoc.coords.longitude;
            }
          }
        }
      } catch (e) {}

      const effectiveCommunity = communityOverride !== undefined ? communityOverride : selectedCommunityFilter;
      const effectiveFilter = filterOverride !== undefined ? filterOverride : selectedFilter;

      let dietaryFilters: string[] | undefined = undefined;
      if (effectiveFilter && ['PURE_VEG', 'STRICT_JAIN', 'VEGAN', 'EGGETARIAN', 'NON_VEG'].includes(effectiveFilter)) {
        dietaryFilters = [effectiveFilter];
      }

      const feed = await api.getFeed({
        maxDistanceKm: myProfile.maxDistanceKm,
        latitude: lat,
        longitude: lon,
        microCircle: effectiveCommunity ? effectiveCommunity.name : undefined,
        dietaryFilters,
      });

      // Accurately capture database candidates. If database returns an array, honor it.
      const list = feed && Array.isArray(feed.candidates)
        ? feed.candidates
        : FALLBACK_DISCOVERY_CANDIDATES;

      setCandidates(list);
      try {
        feedFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch (_) {}
      setRemainingSwipes(myProfile.hasActivePass ? 999 : (feed?.remainingDailySwipes ?? 25));

      // Immediately prefetch top candidate hero images while radar is still sweeping
      if (list && list.length > 0) {
        const topImageUrls = list
          .slice(0, 6)
          .flatMap((c) => (c.photos && c.photos.length > 0 ? c.photos.slice(0, 2) : []))
          .filter((u): u is string => typeof u === 'string' && (u.startsWith('http') || u.startsWith('file')));
        if (topImageUrls.length > 0) {
          ExpoImage.prefetch(topImageUrls).catch(() => {});
        }
      }
    } catch (e) {
      setCandidates(FALLBACK_DISCOVERY_CANDIDATES);
      setRemainingSwipes(userProfile?.hasActivePass ? 999 : 25);
    } finally {
      feedLoadedRef.current = true;
      setLoading(false);
      setRefreshing(false);
      if (loopTimerFinishedRef.current) {
        dismissRadar();
      }
    }
  };

  const handleLoopComplete = () => {
    loopTimerFinishedRef.current = true;
    if (feedLoadedRef.current) {
      dismissRadar();
    }
  };

  const handleSelectFilter = (filterId: string) => {
    const nextFilter = selectedFilter === filterId ? 'ALL' : filterId;
    setSelectedFilter(nextFilter);
    hapticFeedback.medium();
    radarFadeAnim.setValue(1);
    setIsCuriosityLoopActive(true);
    setLoading(true);
    loadFeed(selectedCommunityFilter, nextFilter);
  };

  const handleSelectCommunityFilter = (comm: MicroCircle | null) => {
    setSelectedCommunityFilter(comm);
    hapticFeedback.medium();
    radarFadeAnim.setValue(1);
    setIsCuriosityLoopActive(true);
    setLoading(true);
    loadFeed(comm, selectedFilter);
  };

  const handleClearFiltersAndShowAll = () => {
    hapticFeedback.medium();
    setSelectedFilter('ALL');
    setSelectedCommunityFilter(null);
    radarFadeAnim.setValue(1);
    setIsCuriosityLoopActive(true);
    setLoading(true);
    loadFeed(null, 'ALL');
  };

  const handleScanDatabaseMore = () => {
    hapticFeedback.heavy();
    radarFadeAnim.setValue(1);
    setIsCuriosityLoopActive(true);
    setLoading(true);
    loadFeed(selectedCommunityFilter, selectedFilter);
  };

  const handleRefresh = () => {
    radarFadeAnim.setValue(1);
    setIsCuriosityLoopActive(true);
    setRefreshing(true);
    loadFeed();
  };

  const handleOpenProfile = (candidate: CandidateCard) => {
    setSelectedCandidate(candidate);
    setShowFullProfileModal(true);
  };

  const handleOpenSparkNote = (
    candidate: CandidateCard,
    contextType: ContextType = 'PHOTO',
    contextTargetId?: string,
    contextTitle?: string,
    previewUrl?: string,
    promptText?: string
  ) => {
    setSparkNoteCandidate(candidate);
    setSparkNoteContext({
      type: contextType,
      targetId: contextTargetId || 'photo_0',
      title: contextTitle || `${candidate.displayName}'s Profile`,
      previewUrl: previewUrl || candidate.photos?.[0] || candidate.photo1,
      promptText: promptText,
    });
    setSparkNoteModalVisible(true);
  };

  const handleAction = async (
    targetCandidate: CandidateCard,
    actionType: ActionType,
    noteText?: string
  ) => {
    if (!targetCandidate) return;

    // 1. PLAN GATING CHECKS (Skipped in 100% Free Launch mode):
    if (FEATURE_FLAGS.ENABLE_STORE) {
      if (actionType === 'LIKE' && !noteText) {
        const isVip = Boolean(userProfile?.hasActivePass);
        if (!isVip && remainingSwipes <= 0) {
          hapticFeedback.warning();
          setGatingFeature('SWIPE');
          setGatingModalVisible(true);
          return;
        }
      }

      if (actionType === 'SUPER_SPARK') {
        const isVip = Boolean(userProfile?.hasActivePass);
        const sparks = userProfile?.sparksBalance || 0;
        if (!isVip && sparks <= 0) {
          hapticFeedback.warning();
          setGatingFeature('SUPER_LIKE');
          setGatingModalVisible(true);
          return;
        }
      }
    }

    const targetId = targetCandidate.userId;
    const targetName = targetCandidate.displayName || 'Candidate';

    // 1. Record in swiped history for Rewind & increment daily engagement counter
    setSwipedHistory((prev) => [{ candidate: targetCandidate, action: actionType }, ...prev.slice(0, 9)]);
    recordSwipeEvent()
      .then((status) => setIsEngagementEligible(status.isEligibleForPrompt))
      .catch(() => {});

    // 2. Immediately remove the profile from candidates so it GOES AWAY and the next loads
    setCandidates((prev) => prev.filter((c) => c.userId !== targetId));

    // 3. If the full detail sheet is viewing this candidate, dismiss it
    if (selectedCandidate?.userId === targetId) {
      setShowFullProfileModal(false);
      setSelectedCandidate(null);
    }

    // 4. Show instant tactile feedback toast & haptics
    if (noteText) {
      hapticFeedback.heavy();
      showToast(`✨ Sent Spark Note to ${targetName}!`);
      setSparkNoteQuota((prev) =>
        prev
          ? {
              ...prev,
              usedToday: prev.usedToday + 1,
              remainingToday: Math.max(0, prev.remainingToday - 1),
              canSendFree: false,
            }
          : null
      );
    } else if (actionType === 'PASS') {
      hapticFeedback.light();
      showToast(`✕ Passed on ${targetName}`);
    } else if (actionType === 'LIKE') {
      hapticFeedback.medium();
      showToast(`❤️ Liked ${targetName}`);
    } else if (actionType === 'SUPER_SPARK') {
      hapticFeedback.heavy();
      showToast(`⚡ Sent Super Spark to ${targetName}!`);
    }

    // 5. Record interaction in backend
    try {
      const res = await api.interact(
        targetId,
        actionType,
        selectedContext.type,
        selectedContext.targetId,
        noteText || ''
      );

      if (res.isMatch) {
        setMatchedCandidate(targetCandidate);
        setCelebrationMatchId(res.matchId || targetId);
        setShowCelebrationModal(true);
      }

      setRemainingSwipes(res.remainingDailySwipes);
    } catch (e) {}

    setCommentText('');
    setCommentModalVisible(false);
  };

  const handleRewind = () => {
    if (FEATURE_FLAGS.ENABLE_STORE && !userProfile?.hasActivePass) {
      hapticFeedback.warning();
      setGatingFeature('REWIND');
      setGatingModalVisible(true);
      return;
    }
    if (swipedHistory.length === 0) {
      showToast('No swiped profiles to rewind!');
      return;
    }
    hapticFeedback.medium();
    const [lastSwiped, ...restHistory] = swipedHistory;
    setSwipedHistory(restHistory);
    setCandidates((prev) => [
      lastSwiped.candidate,
      ...prev.filter((c) => c.userId !== lastSwiped.candidate.userId),
    ]);
    showToast(`↺ Restored ${lastSwiped.candidate.displayName || 'profile'}`);
  };

  const handleSendCuttingChai = (candidate: CandidateCard) => {
    if (FEATURE_FLAGS.ENABLE_STORE) {
      const isVip = Boolean(userProfile?.hasActivePass);
      const sparks = userProfile?.sparksBalance || 0;
      if (!isVip && sparks <= 0) {
        hapticFeedback.warning();
        setGatingFeature('SUPER_LIKE');
        setGatingModalVisible(true);
        return;
      }
    }
    setChaiTargetCandidate(candidate);
    setChaiModalVisible(true);
  };

  const confirmSendCuttingChai = async (candidateOverride?: CandidateCard) => {
    const target = candidateOverride || chaiTargetCandidate;
    if (!target) return;
    setChaiModalVisible(false);
    setChaiTargetCandidate(null);

    if (userProfile && userProfile.sparksBalance > 0) {
      setUserProfile((prev) => prev ? { ...prev, sparksBalance: Math.max(0, prev.sparksBalance - 1) } : null);
    }
    if (FEATURE_FLAGS.ENABLE_STORE) {
      await api.createUpiOrder('SUPER_SPARK_19');
    }
    handleAction(target, 'SUPER_SPARK');
  };

  // Filter candidates based on selected tag
  const filteredCandidates = candidates.filter((c) => {
    if (selectedCommunityFilter) {
      const commName = selectedCommunityFilter.name.toLowerCase();
      const commSlug = (selectedCommunityFilter.slug || '').toLowerCase();
      const commCity = (selectedCommunityFilter.city || '').toLowerCase();
      const candidateComm = (c.microCircle || '').toLowerCase();
      const candidateCity = (c.city || '').toLowerCase();

      // Micro-community matching: candidate matches explicit community filter if candidate's community or city matches
      const matchesCircle =
        (candidateComm && (
          candidateComm.includes(commName) ||
          commName.includes(candidateComm) ||
          (commSlug && (candidateComm.includes(commSlug) || commSlug.includes(candidateComm)))
        )) ||
        (candidateCity && commCity && (candidateCity.includes(commCity) || commCity.includes(candidateCity)));

      if (!matchesCircle) {
        return false;
      }
    }

    if (selectedFilter === 'ALL') return true;

    const rawDiet = (c.culturalBadges?.diet || (c as any).dietaryPref || '').toString().toUpperCase();

    if (selectedFilter === 'PURE_VEG') {
      // Pure Veg includes: standard pure veg, Strict Jain (100% vegetarian without root vegetables), and Vegan (plant-based vegetarian)
      return rawDiet === 'PURE_VEG' || rawDiet === 'STRICT_JAIN' || rawDiet === 'VEGAN' || !rawDiet;
    }
    if (selectedFilter === 'STRICT_JAIN') {
      return rawDiet === 'STRICT_JAIN';
    }
    if (selectedFilter === 'VEGAN') {
      return rawDiet === 'VEGAN';
    }
    if (selectedFilter === 'EGGETARIAN') {
      return rawDiet === 'EGGETARIAN';
    }
    if (selectedFilter === 'NON_VEG') {
      return rawDiet === 'NON_VEG';
    }

    const vac = (c.vacationPreference || '').toLowerCase();
    if (selectedFilter === 'MOUNTAINS') {
      return vac.includes('mountain') || vac.includes('both') || !vac;
    }
    if (selectedFilter === 'BEACHES') {
      return vac.includes('beach') || vac.includes('both');
    }

    const smoke = (c.smokingHabit || '').toLowerCase();
    if (selectedFilter === 'NON_SMOKER') {
      return smoke.includes('non') || smoke.includes('quit') || smoke.includes('never') || !smoke;
    }

    const drink = (c.drinkingHabit || '').toLowerCase();
    if (selectedFilter === 'NON_DRINKER') {
      return drink.includes('non') || drink.includes('sober') || drink.includes('teetotaler');
    }

    return true;
  }).sort((a, b) => {
    // Prioritize shared community members to top of deck
    const aShared = (a as any).isSharedCommunity ? 0 : 1;
    const bShared = (b as any).isSharedCommunity ? 0 : 1;
    if (aShared !== bShared) return aShared - bShared;

    const distA = typeof a.distanceKm === 'number' ? a.distanceKm : 999;
    const distB = typeof b.distanceKm === 'number' ? b.distanceKm : 999;
    return distA - distB;
  });

  // In-Deck Profile Booster Card & 1-Tap Vibe Quiz injection
  const feedDisplayCards = useMemo(() => {
    const list = [...filteredCandidates];
    const myPhotos = userProfile?.photos || [];
    const hasFivePhotos = myPhotos.length >= 5 || Boolean(userProfile?.photo5);
    const isProfileIncomplete = !hasFivePhotos;

    // Strict drop-off prevention rule:
    // Only ask after >20 swipes on Day 1, or after >5 swipes on Day 2+.
    // Never show immediately to new users to protect first-time retention.
    if (isEngagementEligible && !dismissedQuiz && list.length >= 2) {
      const vibeQuizCard: CandidateCard = {
        userId: '__blunderr_vibe_quiz__',
        displayName: '1-Tap Vibe Quiz',
        age: 24,
        isDigilockerVerified: false,
        isWhatsappVerified: false,
        livenessScore: 100,
        distanceKm: 0,
        fuzzyDistance: '+5% Reach Multiplier',
        culturalBadges: {
          diet: 'PURE_VEG' as any,
          living: 'INDEPENDENT_FLAT' as any,
          languages: [],
          zodiac: 'Leo',
        },
        compatibilityScore: 100,
        bio: 'Sync your lifestyle harmony in 1 tap',
        photos: [],
      };
      const insertIdx = Math.min(2, list.length);
      list.splice(insertIdx, 0, vibeQuizCard);

      if (isProfileIncomplete && list.length >= 5) {
        const boosterCard: CandidateCard = {
          userId: '__blunderr_profile_booster__',
          displayName: 'Profile Multiplier',
          age: 25,
          isDigilockerVerified: false,
          isWhatsappVerified: false,
          livenessScore: 100,
          distanceKm: 0,
          fuzzyDistance: '3.8x VIP Reach',
          culturalBadges: {
            diet: 'PURE_VEG' as any,
            living: 'INDEPENDENT_FLAT' as any,
            languages: [],
            zodiac: 'Aries',
          },
          compatibilityScore: 100,
          bio: 'Boost your reach to 3.8x',
          photos: [],
        };
        list.splice(5, 0, boosterCard);
      }
    }

    return list;
  }, [filteredCandidates, userProfile, dismissedQuiz, isEngagementEligible]);

  // Proactive pre-fetch top candidate photos into memory-disk cache for instantaneous 60/120fps swiping
  useEffect(() => {
    if (filteredCandidates.length > 0) {
      const urlsToPrefetch = filteredCandidates
        .slice(0, 8)
        .flatMap((c) => (c.photos && c.photos.length > 0 ? c.photos.slice(0, 2) : []))
        .filter((u): u is string => typeof u === 'string' && (u.startsWith('http') || u.startsWith('file')));
      if (urlsToPrefetch.length > 0) {
        ExpoImage.prefetch(urlsToPrefetch).catch(() => {});
      }
    }
  }, [filteredCandidates]);

interface SwipeableCardProps {
  item: CandidateCard;
  nextItem?: CandidateCard | null;
  feedDimensions: { width: number; height: number };
  onLike: (item: CandidateCard) => void;
  onPass: (item: CandidateCard) => void;
  onSendChai: (item: CandidateCard) => void;
  onSparkNote?: (item: CandidateCard) => void;
  onOpenDetails: (item: CandidateCard) => void;
  onRewind?: () => void;
  canRewind?: boolean;
  canLike?: boolean;
  hasFreeSparkNote?: boolean;
  userProfile?: UserProfile | null;
  onTagReflected?: (tagKey: string, tagValue: string) => void;
}

function SwipeableCandidateCard({
  item,
  nextItem,
  feedDimensions,
  onLike,
  onPass,
  onSendChai,
  onSparkNote,
  onOpenDetails,
  onRewind,
  canRewind,
  canLike = true,
  hasFreeSparkNote = true,
  userProfile,
  onTagReflected,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const entryPopAnim = useRef(new Animated.Value(1)).current;

  // Trigger tactile upward pop when a new card arrives at top
  useEffect(() => {
    entryPopAnim.setValue(0);
    Animated.spring(entryPopAnim, {
      toValue: 1,
      friction: 6,
      tension: 65,
      useNativeDriver: false,
    }).start();
  }, [item.userId]);

  const entryTranslateY = entryPopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const entryScale = entryPopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  // Animated values for the below card popping upwards as the active card is swiped
  const belowCardScale = pan.x.interpolate({
    inputRange: [-feedDimensions.width * 0.7, 0, feedDimensions.width * 0.7],
    outputRange: [1, 0.93, 1],
    extrapolate: 'clamp',
  });

  const belowCardTranslateY = pan.x.interpolate({
    inputRange: [-feedDimensions.width * 0.7, 0, feedDimensions.width * 0.7],
    outputRange: [0, 20, 0],
    extrapolate: 'clamp',
  });

  const belowCardOpacity = pan.x.interpolate({
    inputRange: [-feedDimensions.width * 0.7, 0, feedDimensions.width * 0.7],
    outputRange: [1, 0.55, 1],
    extrapolate: 'clamp',
  });

  const handleButtonLike = () => {
    if (!canLike) {
      onLike(item);
      return;
    }
    Animated.timing(pan, {
      toValue: { x: feedDimensions.width * 1.5, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      onLike(item);
    });
  };

  const handleButtonPass = () => {
    Animated.timing(pan, {
      toValue: { x: -feedDimensions.width * 1.5, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      onPass(item);
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Detect horizontal swipe intent (right for like, left for pass)
          return (
            Math.abs(gestureState.dx) > 14 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
          );
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          const SWIPE_THRESHOLD = 95;
          if (gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > 0.5) {
            // Check plan gating before animating like
            if (!canLike) {
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                friction: 5,
                tension: 40,
                useNativeDriver: false,
              }).start();
              onLike(item);
              return;
            }
            // Right swipe -> LIKE
            Animated.timing(pan, {
              toValue: { x: feedDimensions.width * 1.5, y: gestureState.dy },
              duration: 220,
              useNativeDriver: false,
            }).start(() => {
              onLike(item);
            });
          } else if (gestureState.dx < -SWIPE_THRESHOLD || gestureState.vx < -0.5) {
            // Left swipe -> PASS
            Animated.timing(pan, {
              toValue: { x: -feedDimensions.width * 1.5, y: gestureState.dy },
              duration: 220,
              useNativeDriver: false,
            }).start(() => {
              onPass(item);
            });
          } else {
            // Spring back to center
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              tension: 40,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [item, feedDimensions.width, onLike, onPass]
  );

  const rotate = pan.x.interpolate({
    inputRange: [-feedDimensions.width, 0, feedDimensions.width],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const likeStampOpacity = pan.x.interpolate({
    inputRange: [20, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passStampOpacity = pan.x.interpolate({
    inputRange: [-80, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={{
        width: feedDimensions.width,
        height: feedDimensions.height,
        maxWidth: 440,
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingBottom: 8,
        paddingTop: 4,
        position: 'relative',
      }}>
      {/* Below Card Preview in Stack (Pops upwards as top card is swiped) */}
      {nextItem && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cardContainer,
            styles.belowCardContainer,
            {
              transform: [
                { scale: belowCardScale },
                { translateY: belowCardTranslateY },
              ],
              opacity: belowCardOpacity,
            },
          ]}>
          <ExpoImage
            source={resolveImageSource(nextItem.photos?.[0], getModelAsset(nextItem.displayName))}
            style={styles.heroImage}
            contentFit="cover"
            contentPosition="top center"
            cachePolicy="memory-disk"
          />
          <View style={styles.photoTopRow}>
            {Boolean(nextItem.isFaceVerified ?? (nextItem.livenessScore && nextItem.livenessScore >= 85)) && (
              <View style={styles.datingVerifiedPill}>
                <Text style={styles.datingVerifiedPillText}>🛡️ 100% Biometric Verified</Text>
              </View>
            )}
            <View style={styles.photoCountPill}>
              <Text style={styles.photoCountPillText}>
                📷 {nextItem.photos?.length || 4} Photos
              </Text>
            </View>
          </View>
          <View style={styles.photoBottomScrim}>
            <View style={styles.scrimPillsRow}>
              <View style={styles.compatPill}>
                <Text style={styles.compatPillText}>
                  🔥 {nextItem.compatibilityScore || 95}% Chemistry Vibe
                </Text>
              </View>
              <View style={styles.locationPill}>
                <Text style={styles.locationPillText}>
                  📍 {nextItem.fuzzyDistance || '< 2 km'}
                </Text>
              </View>
              {Boolean(nextItem.microCircle) && (
                <View style={styles.communityPill}>
                  <Text style={styles.communityPillText} numberOfLines={1}>
                    🏙️ {nextItem.microCircle}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.nameWithShieldRow}>
              <Text style={styles.candidateNameText}>
                {nextItem.fullName || nextItem.displayName}, {nextItem.age}
              </Text>
              <View style={styles.verifiedCheckBadge}>
                <Text style={styles.verifiedCheckText}>✓</Text>
              </View>
            </View>
            <Text style={styles.jobText} numberOfLines={1}>
              💼 {nextItem.occupation || nextItem.job || 'Professional'}{nextItem.company ? ` @ ${nextItem.company}` : ''}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Top Active Card (Swiped with PanResponder) */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardContainer,
          {
            zIndex: 10,
            transform: [
              { translateX: pan.x },
              { translateY: Animated.add(pan.y, entryTranslateY) },
              { rotate: rotate },
              { scale: entryScale },
            ],
          },
        ]}>
        {/* Animated Visual LIKE Stamp on Right Swipe */}
        <Animated.View
          style={[
            styles.stampBadge,
            styles.likeBadge,
            { opacity: likeStampOpacity, pointerEvents: 'none' },
          ]}>
          <Text style={styles.likeBadgeText}>LIKE ❤️</Text>
        </Animated.View>

        {/* Animated Visual PASS Stamp on Left Swipe */}
        <Animated.View
          style={[
            styles.stampBadge,
            styles.passBadge,
            { opacity: passStampOpacity, pointerEvents: 'none' },
          ]}>
          <Text style={styles.passBadgeText}>PASS ✕</Text>
        </Animated.View>

        {/* Clickable Card Body Area (Photo + Overlaid Details) */}
        <TouchableOpacity
          activeOpacity={0.94}
          onPress={() => onOpenDetails(item)}
          style={styles.heroTouchWrap}>
          <ExpoImage
            source={resolveImageSource(item.photos?.[0], getModelAsset(item.displayName))}
            priority="high"
            style={styles.heroImage}
            contentFit="cover"
            contentPosition="top center"
            cachePolicy="memory-disk"
            transition={150}
            recyclingKey={item.userId}
          />

          {/* Top Badges Overlaid on Photo */}
          <View style={styles.photoTopRow}>
            {Boolean(item.isFaceVerified ?? (item.livenessScore && item.livenessScore >= 85)) && (
              <View style={styles.datingVerifiedPill}>
                <Text style={styles.datingVerifiedPillText}>🛡️ 100% Biometric Verified</Text>
              </View>
            )}

            <View style={styles.photoCountPill}>
              <Text style={styles.photoCountPillText}>
                📷 {item.photos?.length || 4} Photos
              </Text>
            </View>
          </View>

          {/* Bottom Card Scrim / Quick Profile Header */}
          <View style={styles.photoBottomScrim}>
            {/* Row 1: Badges */}
            <View style={styles.scrimPillsRow}>
              <View style={styles.compatPill}>
                <Text style={styles.compatPillText}>
                  🔥 {item.compatibilityScore || 95}% Chemistry Vibe
                </Text>
              </View>

              <View style={styles.locationPill}>
                <Text style={styles.locationPillText}>
                  📍 {item.fuzzyDistance ? item.fuzzyDistance : (item.distanceKm ? `${item.distanceKm < 2 ? '< 2 km' : `${Math.round(item.distanceKm)} km`}` : '< 2 km')}
                </Text>
              </View>

              {Boolean(item.microCircle) && (
                <View style={styles.communityPill}>
                  <Text style={styles.communityPillText} numberOfLines={1}>
                    🏙️ {item.microCircle}
                  </Text>
                </View>
              )}
            </View>

            {/* Row 2: Name & Age with Verified Blue Checkmark */}
            <View style={styles.nameWithShieldRow}>
              <Text style={styles.candidateNameText}>
                {item.fullName || item.displayName}, {item.age}
              </Text>
              <View style={styles.verifiedCheckBadge}>
                <Text style={styles.verifiedCheckText}>✓</Text>
              </View>
              <View style={styles.activeDot} />
            </View>

            {/* Row 3: Job & College */}
            <Text style={styles.jobText} numberOfLines={1}>
              💼 {item.occupation || item.job || 'Product Designer'}{item.company ? ` @ ${item.company}` : ''}
              {(item.education || item.institute) ? ` • 🎓 ${item.education || 'Graduate'}` : ''}
            </Text>

            {/* Row 4: Lifestyle Indicators Row with Contextual 1-Tap Reflection */}
            <View style={styles.lifestyleRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onTagReflected && onTagReflected('drinkingHabit', 'Social / Weekend Drinker 🍷')}
                style={[
                  styles.lifestyleChip,
                  Boolean(userProfile?.drinkingHabit && userProfile.drinkingHabit.toLowerCase().includes('social')) && {
                    borderColor: '#2ED573',
                    backgroundColor: 'rgba(46, 213, 115, 0.14)',
                  },
                ]}>
                <Text style={[styles.lifestyleChipText, Boolean(userProfile?.drinkingHabit && userProfile.drinkingHabit.toLowerCase().includes('social')) && { color: '#2ED573', fontWeight: '800' }]}>
                  {Boolean(userProfile?.drinkingHabit && userProfile.drinkingHabit.toLowerCase().includes('social')) ? '✓ ' : '+ '}
                  🍸 Cocktails
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onTagReflected && onTagReflected('smokingHabit', item.smokingHabit || 'Non-Smoker 🚭')}
                style={[
                  styles.lifestyleChip,
                  Boolean(item.smokingHabit && userProfile?.smokingHabit === item.smokingHabit) && {
                    borderColor: '#2ED573',
                    backgroundColor: 'rgba(46, 213, 115, 0.14)',
                  },
                ]}>
                <Text style={[styles.lifestyleChipText, Boolean(item.smokingHabit && userProfile?.smokingHabit === item.smokingHabit) && { color: '#2ED573', fontWeight: '800' }]}>
                  {Boolean(item.smokingHabit && userProfile?.smokingHabit === item.smokingHabit) ? '✓ ' : '+ '}
                  {item.smokingHabit || '🚭 Non-Smoker'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onTagReflected && onTagReflected('drinkingHabit', item.drinkingHabit || 'Social / Weekend Drinker 🍷')}
                style={[
                  styles.lifestyleChip,
                  Boolean(item.drinkingHabit && userProfile?.drinkingHabit === item.drinkingHabit) && {
                    borderColor: '#2ED573',
                    backgroundColor: 'rgba(46, 213, 115, 0.14)',
                  },
                ]}>
                <Text style={[styles.lifestyleChipText, Boolean(item.drinkingHabit && userProfile?.drinkingHabit === item.drinkingHabit) && { color: '#2ED573', fontWeight: '800' }]}>
                  {Boolean(item.drinkingHabit && userProfile?.drinkingHabit === item.drinkingHabit) ? '✓ ' : '+ '}
                  {item.drinkingHabit || '🍷 Social'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onTagReflected && onTagReflected('vacationPreference', item.vacationPreference || 'Majestic Mountains 🏔️')}
                style={[
                  styles.lifestyleChip,
                  Boolean(item.vacationPreference && userProfile?.vacationPreference === item.vacationPreference) && {
                    borderColor: '#2ED573',
                    backgroundColor: 'rgba(46, 213, 115, 0.14)',
                  },
                ]}>
                <Text style={[styles.lifestyleChipText, Boolean(item.vacationPreference && userProfile?.vacationPreference === item.vacationPreference) && { color: '#2ED573', fontWeight: '800' }]}>
                  {Boolean(item.vacationPreference && userProfile?.vacationPreference === item.vacationPreference) ? '✓ ' : '+ '}
                  {item.vacationPreference || '✈️ Solo Travel'}
                </Text>
              </TouchableOpacity>

              <View style={styles.lifestyleChip}>
                <Text style={styles.lifestyleChipText}>{getDietBadge(item.culturalBadges?.diet)}</Text>
              </View>
            </View>

            {/* Row 5: Interactive Audio Snippet with Real Waveform - ONLY if candidate uploaded recording */}
            {Boolean(
              (typeof item.voicePromptUrl === 'string' && item.voicePromptUrl.trim() !== '') ||
              (typeof item.voicePrompt?.audioUrl === 'string' && item.voicePrompt.audioUrl.trim() !== '')
            ) && (
              <DiscoveryVoiceSnippet
                audioUri={item.voicePromptUrl || item.voicePrompt?.audioUrl}
                durationSec={item.voicePromptDuration || item.voicePrompt?.durationSec || 15}
                promptText={item.voicePromptText || item.voicePrompt?.promptText || item.profilePromptAnswer}
                displayName={item.displayName}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Action Buttons Row - Iconic Floating Circular Dating Actions */}
        <View style={styles.actionButtonsRow}>
          {canRewind && onRewind ? (
            <TouchableOpacity
              style={styles.rewindBtn}
              activeOpacity={0.7}
              onPress={onRewind}
              accessibilityLabel="Rewind Last Profile">
              <Text style={styles.rewindBtnIcon}>↺</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.rewindBtn, { opacity: 0.35 }]}>
              <Text style={styles.rewindBtnIcon}>↺</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.passBtn}
            activeOpacity={0.7}
            onPress={handleButtonPass}
            accessibilityLabel="Pass Profile">
            <Text style={styles.passBtnIcon}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chaiBtn}
            activeOpacity={0.7}
            onPress={() => onSendChai(item)}
            accessibilityLabel="Super Spark">
            <Text style={styles.chaiBtnIcon}>★</Text>
          </TouchableOpacity>

          {onSparkNote && (
            <TouchableOpacity
              style={styles.sparkNoteBtn}
              activeOpacity={0.7}
              onPress={() => onSparkNote(item)}
              accessibilityLabel="Daily Free Spark Note">
              <Text style={styles.sparkNoteBtnIcon}>✨</Text>
              {hasFreeSparkNote && (
                <View style={styles.freePillDot}>
                  <Text style={styles.freePillText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.likeBtn}
            activeOpacity={0.7}
            onPress={handleButtonLike}
            accessibilityLabel="Like Profile">
            <Text style={styles.likeBtnIcon}>❤️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

  const renderCandidateCard = ({ item, index }: { item: CandidateCard; index: number }) => {
    if (item.userId === '__blunderr_vibe_quiz__') {
      return (
        <VibeQuizCard
          feedDimensions={feedDimensions}
          userProfile={userProfile}
          onAnswered={async (tagKey, tagValue) => {
            const updates: any = { [tagKey]: tagValue };
            setUserProfile((prev) => (prev ? { ...prev, ...updates } : prev));
            markInterstitialShownToday().catch(() => {});
            setIsEngagementEligible(false);
            try {
              await api.updateMyProfile(updates);
            } catch (e) {}
            setTimeout(() => {
              setDismissedQuiz(true);
            }, 700);
          }}
          onSkip={() => {
            markInterstitialShownToday().catch(() => {});
            setIsEngagementEligible(false);
            setDismissedQuiz(true);
          }}
        />
      );
    }

    if (item.userId === '__blunderr_profile_booster__') {
      return (
        <View style={{ width: feedDimensions.width, height: feedDimensions.height, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090B10' }}>
          <View style={styles.boosterDeckCard}>
            <View style={styles.boosterDeckHeader}>
              <View style={styles.boosterDeckPill}>
                <Text style={styles.boosterDeckPillText}>⚡ PROFILE MULTIPLIER</Text>
              </View>
              <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800' }}>3.8x Match Boost</Text>
            </View>
            <Text style={styles.boosterDeckTitle}>
              You’re 2 Photos away from 3.8x more daily dates 🔥
            </Text>
            <Text style={styles.boosterDeckSub}>
              Candidates with 5+ photos get 4x more replies, top discovery rank, and zero ghosting.
            </Text>
            <TouchableOpacity
              style={styles.boosterDeckActionBtn}
              activeOpacity={0.85}
              onPress={() => {
                markInterstitialShownToday().catch(() => {});
                setIsEngagementEligible(false);
                router.push('/(tabs)/profile?edit=true' as any);
              }}>
              <Text style={styles.boosterDeckActionBtnText}>📸 Complete Profile (Takes 20s) →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const isVip = Boolean(userProfile?.hasActivePass);
    const canLike = isVip || remainingSwipes > 0;
    const isFreeSparkAvailable = sparkNoteQuota ? sparkNoteQuota.canSendFree : true;
    const nextItem = feedDisplayCards[index + 1] || null;
    return (
      <SwipeableCandidateCard
        item={item}
        nextItem={nextItem}
        feedDimensions={feedDimensions}
        onLike={(cand) => handleAction(cand, 'LIKE')}
        onPass={(cand) => handleAction(cand, 'PASS')}
        onSendChai={(cand) => handleSendCuttingChai(cand)}
        onSparkNote={(cand) => handleOpenSparkNote(cand)}
        onOpenDetails={(cand) => handleOpenProfile(cand)}
        onRewind={handleRewind}
        canRewind={swipedHistory.length > 0}
        canLike={canLike}
        hasFreeSparkNote={isFreeSparkAvailable}
        userProfile={userProfile}
        onTagReflected={async (key, value) => {
          hapticFeedback.success();
          const updates: any = { [key]: value };
          setUserProfile((prev) => (prev ? { ...prev, ...updates } : prev));
          showReflectedToast(`✨ Added "${value}" to your profile! Shared wavelength unlocked ⚡`);
          try {
            await api.updateMyProfile(updates);
          } catch (e) {}
        }}
      />
    );
  };

  const renderFeedHeader = () => (
    <View style={[styles.feedHeaderContainer, isCompactScreen && { paddingHorizontal: 10 }]}>
      {/* Top App Bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandTitleWrap}>
          <BlunderRWordmark size={isCompactScreen ? 'sm' : 'md'} slant={true} />
        </View>

        <View style={[styles.brandActionsRow, { gap: isTinyScreen ? 3 : isCompactScreen ? 4 : 6 }]}>
          {/* My Desire Button */}
          <TouchableOpacity
            style={[styles.desireHeaderButton, isCompactScreen && styles.compactHeaderBtn]}
            onPress={() => setShowDesireModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="My Desire Preferences">
            <Text style={[styles.desireHeaderIcon, isCompactScreen && { fontSize: 10 }]}>🎯</Text>
            {!isTinyScreen && (
              <Text style={[styles.desireHeaderText, isCompactScreen && { fontSize: 10 }]}>
                Desire
              </Text>
            )}
          </TouchableOpacity>

          {/* Micro-Community Circles Button */}
          <TouchableOpacity
            style={[
              styles.communityHeaderButton,
              selectedCommunityFilter && styles.communityHeaderButtonActive,
              isCompactScreen && styles.compactCommunityBtn,
            ]}
            onPress={() => setShowCommunityModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Micro-Community Circles">
            <Text style={[styles.communityHeaderIcon, isCompactScreen && { fontSize: 10 }]}>
              {selectedCommunityFilter?.badgeIcon || '🏙️'}
            </Text>
            {!isTinyScreen && (
              <Text
                style={[
                  styles.communityHeaderText,
                  selectedCommunityFilter && styles.communityHeaderTextActive,
                  isCompactScreen && { fontSize: 10 },
                ]}
                numberOfLines={1}>
                {selectedCommunityFilter ? selectedCommunityFilter.name.split(' ')[0] : 'Circles'}
              </Text>
            )}
            {selectedCommunityFilter && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleSelectCommunityFilter(null);
                }}
                style={styles.clearCircleBtnHeader}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: '#08080E', fontSize: 9, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Boost Button (Gated by ENABLE_STORE feature flag for Google Play compliance) */}
          {FEATURE_FLAGS.ENABLE_STORE && (
            <TouchableOpacity
              style={[styles.boostButton, isCompactScreen && styles.compactHeaderBtn]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/store')}
              accessibilityLabel="Boost Profile">
              <Text style={[styles.boostButtonText, isCompactScreen && { fontSize: 10 }]}>
                {isTinyScreen ? '⚡' : '⚡ Boost'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Notification Bell Button */}
          <TouchableOpacity
            style={[styles.notificationBellButton, isCompactScreen && styles.compactBellBtn]}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.8}
            accessibilityLabel="Notifications">
            <Text style={[styles.bellIconText, isCompactScreen && { fontSize: 14 }]}>🔔</Text>
            {unreadNotificationCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Filter Bar with Full-Width ScrollView */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterScroll}>
          {FILTER_TAGS.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => handleSelectFilter(filter.id)}>
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Sticky Top Header */}
      {renderFeedHeader()}

      {/* Contextual Tag Reflection Floating Toast (Flow 4) */}
      {reflectedToast ? (
        <View style={styles.floatingReflectedToast}>
          <Text style={styles.floatingReflectedToastText}>{reflectedToast}</Text>
        </View>
      ) : null}

      {/* Main Profile Feed: Exactly 1 Profile per screen */}
      <View
        style={styles.feedWrapper}
        onLayout={(e) => {
          const { height: h, width: w } = e.nativeEvent.layout;
          if (h > 50 && w > 50) {
            setFeedDimensions({ height: h, width: w });
          }
        }}>
        <FlatList
          ref={feedFlatListRef}
          data={feedDisplayCards}
          keyExtractor={(item) => item.userId}
          renderItem={renderCandidateCard}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={
            feedDisplayCards.length > 0 && feedDimensions.height > 50
              ? (_, index) => ({
                  length: feedDimensions.height,
                  offset: feedDimensions.height * index,
                  index,
                })
              : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E94057"
              colors={['#E94057']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {hasActiveFilter ? (
                // SPECIFIC FILTER EMPTY STATE
                <View style={styles.emptyCardBox}>
                  {/* Glowing Radar Pulse Icon */}
                  <View style={styles.radarPulseRingOuter}>
                    <View style={styles.radarPulseRingInner}>
                      <Text style={styles.emptyCardIcon}>🔍</Text>
                    </View>
                  </View>

                  {/* Active Filter Pill */}
                  <View style={styles.activeFilterBadge}>
                    <View style={styles.activeFilterDot} />
                    <Text style={styles.activeFilterBadgeText}>
                      FILTER ACTIVE: {activeFilterLabel?.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.emptyCardTitle}>
                    No {activeFilterLabel} Profiles Found Nearby
                  </Text>
                  <Text style={styles.emptyCardSub}>
                    We scanned the database within {userProfile?.maxDistanceKm || 50}km, but found no verified singles matching this specific filter right now.
                  </Text>

                  {/* Action 1: Re-scan DB for this specific filter */}
                  <TouchableOpacity
                    style={styles.emptyPrimaryBtn}
                    activeOpacity={0.8}
                    onPress={() => handleSelectFilter(selectedFilter)}>
                    <Text style={styles.emptyPrimaryBtnText}>
                      🔄 Re-scan Database for {activeFilterLabel}
                    </Text>
                  </TouchableOpacity>

                  {/* Action 2: Show All Profiles */}
                  <TouchableOpacity
                    style={styles.emptySecondaryBtn}
                    activeOpacity={0.8}
                    onPress={handleClearFiltersAndShowAll}>
                    <Text style={styles.emptySecondaryBtnText}>
                      🌟 Clear Filter & Show All Profiles {candidates.length > 0 ? `(${candidates.length} in area)` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // DECK FINISHED / LAST PROFILE REACHED (REAL DATA REFRESH & FETCH)
                <View style={styles.emptyCardBox}>
                  {/* Live Proximity Radar Graphic */}
                  <View style={styles.deckFinishedRadarWrap}>
                    <View style={styles.radarWave3} />
                    <View style={styles.radarWave2} />
                    <View style={styles.radarWave1}>
                      <Text style={styles.emptyCardIcon}>📡</Text>
                    </View>
                  </View>

                  {/* Live Radar Status Pill */}
                  <View style={styles.liveProximityStatusPill}>
                    <View style={styles.liveBeaconDot} />
                    <Text style={styles.liveProximityStatusText}>
                      PROXIMITY SCANNER • {userProfile?.city || 'Bangalore'} ({userProfile?.maxDistanceKm || 50}km)
                    </Text>
                  </View>

                  <Text style={styles.emptyCardTitle}>
                    You've Seen Everyone Nearby!
                  </Text>
                  <Text style={styles.emptyCardSub}>
                    You've browsed through all active verified profiles in your area for now. New members join throughout the day. Tap below to query the database for fresh singles!
                  </Text>

                  {/* Action 1: Live DB Fetch */}
                  <TouchableOpacity
                    style={styles.emptyPrimaryBtn}
                    activeOpacity={0.8}
                    onPress={handleScanDatabaseMore}>
                    <Text style={styles.emptyPrimaryBtnText}>
                      📡 Scan Database for More Profiles
                    </Text>
                  </TouchableOpacity>

                  {/* Action 2: Rewind (if history exists) */}
                  {swipedHistory.length > 0 && (
                    <TouchableOpacity
                      style={styles.emptySecondaryBtn}
                      activeOpacity={0.8}
                      onPress={handleRewind}>
                      <Text style={styles.emptySecondaryBtnText}>
                        ↺ Rewind Last Profile ({swipedHistory[0]?.candidate?.displayName || 'Candidate'})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Action 3: Expand Search Radius */}
                  <TouchableOpacity
                    style={styles.emptyGhostBtn}
                    activeOpacity={0.8}
                    onPress={() => setShowDesireModal(true)}>
                    <Text style={styles.emptyGhostBtnText}>
                      📍 Expand Discovery Radius & Preferences →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
      </View>

      {/* HIGH-INTENT COMMENT MODAL */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Send High-Intent Note 💌</Text>
            <Text style={styles.modalTarget}>
              Replying to {selectedCandidate?.displayName}'s profile
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Write a thoughtful comment or conversation starter..."
              placeholderTextColor="#7C8294"
              multiline
              numberOfLines={3}
              value={commentText}
              onChangeText={setCommentText}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={() => {
                if (FEATURE_FLAGS.ENABLE_STORE) {
                  const isVip = Boolean(userProfile?.hasActivePass);
                  const dms = userProfile?.directDmsBalance || 0;
                  if (!isVip && dms <= 0) {
                    setCommentModalVisible(false);
                    hapticFeedback.warning();
                    setGatingFeature('DIRECT_DM');
                    setGatingModalVisible(true);
                    return;
                  }
                }
                if (userProfile && userProfile.directDmsBalance > 0) {
                  setUserProfile((prev) => prev ? { ...prev, directDmsBalance: Math.max(0, prev.directDmsBalance - 1) } : null);
                }
                if (selectedCandidate) {
                  handleAction(selectedCandidate, 'LIKE');
                }
              }}>
              <Text style={styles.modalSubmitBtnText}>Send Like & Note ❤️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setCommentModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CUTTING CHAI MODAL */}
      <Modal
        visible={chaiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChaiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>
              {FEATURE_FLAGS.ENABLE_STORE ? '⚡ Send Super Spark (₹19)' : '⚡ Send Super Spark'}
            </Text>
            <Text style={styles.modalTarget}>
              Highlight your profile to {chaiTargetCandidate?.displayName}
            </Text>
            <Text style={styles.modalDesc}>
              A Super Spark pins your profile at the top of their discovery deck with a 3x higher match & reply rate!
            </Text>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={() => confirmSendCuttingChai()}>
              <Text style={styles.modalSubmitBtnText}>
                {FEATURE_FLAGS.ENABLE_STORE ? 'Pay ₹19 via UPI & Send Spark ⚡' : 'Send Super Spark ⚡'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setChaiModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL CANDIDATE PROFILE DETAILS MODAL */}
      <ProfileDetailModal
        visible={showFullProfileModal}
        candidate={selectedCandidate}
        onClose={() => {
          setShowFullProfileModal(false);
          setSelectedCandidate(null);
        }}
        onRewind={() => {
          setShowFullProfileModal(false);
          setSelectedCandidate(null);
          handleRewind();
        }}
        canRewind={swipedHistory.length > 0}
        onPass={() => {
          if (selectedCandidate) handleAction(selectedCandidate, 'PASS');
          setShowFullProfileModal(false);
          setSelectedCandidate(null);
        }}
        onLike={() => {
          if (selectedCandidate) handleAction(selectedCandidate, 'LIKE');
          setShowFullProfileModal(false);
          setSelectedCandidate(null);
        }}
        onSendSuperSpark={() => {
          const target = selectedCandidate;
          setShowFullProfileModal(false);
          setSelectedCandidate(null);
          if (target) {
            handleSendCuttingChai(target);
          }
        }}
        onSparkNote={() => {
          const target = selectedCandidate;
          setShowFullProfileModal(false);
          if (target) {
            setTimeout(() => {
              handleOpenSparkNote(target);
            }, 120);
          }
        }}
        hasFreeSparkNote={sparkNoteQuota ? sparkNoteQuota.canSendFree : true}
        onComment={(contextType, contextTargetId, contextTitle, previewUrl) => {
          const target = selectedCandidate;
          setShowFullProfileModal(false);
          if (target) {
            setTimeout(() => {
              handleOpenSparkNote(
                target,
                contextType || 'PHOTO',
                contextTargetId,
                contextTitle,
                previewUrl
              );
            }, 120);
          }
        }}
      />

      {/* FREE DAILY SPARK NOTE MODAL */}
      <SparkNoteModal
        visible={sparkNoteModalVisible}
        candidate={sparkNoteCandidate}
        quota={sparkNoteQuota}
        contextType={sparkNoteContext.type}
        contextTargetId={sparkNoteContext.targetId}
        contextPreviewUrl={sparkNoteContext.previewUrl}
        contextPromptText={sparkNoteContext.promptText}
        onClose={() => {
          setSparkNoteModalVisible(false);
          setSparkNoteCandidate(null);
        }}
        onSubmit={(noteText, ctxType, ctxTargetId) => {
          const target = sparkNoteCandidate;
          setSparkNoteModalVisible(false);
          setSparkNoteCandidate(null);
          if (target) {
            if (ctxType) {
              setSelectedContext({
                type: ctxType,
                targetId: ctxTargetId || 'photo_0',
                title: sparkNoteContext.title || '',
              });
            }
            handleAction(target, 'LIKE', noteText);
          }
        }}
      />

      {/* FULL SCREEN CELEBRATION MODAL ON MATCH */}
      <MatchCelebrationModal
        visible={showCelebrationModal}
        candidate={matchedCandidate}
        myPhoto={userProfile?.photos?.[0] || userProfile?.photo1}
        matchId={celebrationMatchId}
        onPlayIcebreaker={(matchId) => {
          setShowCelebrationModal(false);
          router.push({
            pathname: '/matches/icebreaker',
            params: { matchId },
          });
        }}
        onOpenChat={(matchId, candidateName) => {
          setShowCelebrationModal(false);
          router.push({
            pathname: '/chat/[id]',
            params: { id: matchId, name: candidateName },
          });
        }}
        onKeepSwiping={() => {
          setShowCelebrationModal(false);
          setMatchedCandidate(null);
        }}
      />

      {/* COSMIC KUNDALI & VIBE HARMONY MODAL */}
      <CosmicKundaliModal
        visible={!!kundaliCandidate}
        candidate={kundaliCandidate}
        onClose={() => setKundaliCandidate(null)}
      />

      {/* DESIRE PROFILE MODAL (QUICK EDIT FROM FEED) */}
      <DesireProfileModal
        visible={showDesireModal}
        onClose={() => setShowDesireModal(false)}
        onSaved={() => loadFeed()}
      />

      {/* SMART LIFESTYLE & LIVING SYNC MODAL (FLOW 3) */}
      <LifestyleSyncModal
        visible={showLifestyleSyncModal}
        onClose={() => setShowLifestyleSyncModal(false)}
        userProfile={userProfile}
        onSave={async (updates) => {
          setUserProfile((prev) => (prev ? { ...prev, ...updates } : prev));
          try {
            await api.updateMyProfile(updates);
          } catch (e) {}
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

      {/* MICRO-COMMUNITY CIRCLES FILTER MODAL */}
      {showCommunityModal && (
        <MicroCommunityModal
          visible={true}
          onClose={() => setShowCommunityModal(false)}
          onSelect={handleSelectCommunityFilter}
          selectedName={selectedCommunityFilter?.name}
          title="Filter by Community Circle 🏙️"
          subtitle="Discover matches in specific neighborhood tribes & scenes"
          initialCity={selectedCommunityFilter?.city || userProfile?.city || userProfile?.location || undefined}
        />
      )}

      {/* 3D LIVENESS RETAKE RECOVERY MODAL (Single-Flag System) */}
      <LivenessRetakeModal
        visible={showLivenessRetakeModal}
        onClose={() => setShowLivenessRetakeModal(false)}
        referrer="Discovery Feed"
        onSuccess={() => {
          loadFeed();
        }}
      />
      {/* DOPAMINE CURIOSITY PROXIMITY RADAR OVERLAY (Smooth zero-latency reveal) */}
      {isCuriosityLoopActive && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 9999,
              backgroundColor: '#08080E',
              opacity: radarFadeAnim,
            },
          ]}
          pointerEvents={isRadarDismissing ? 'none' : 'auto'}>
          <DopamineCuriosityLoop
            key={`radar_cycle_${radarCycleKey}`}
            city={userProfile?.city || userProfile?.location || 'Bangalore'}
            minDurationMs={1200}
            isLoading={loading}
            candidates={candidates}
            userProfile={userProfile}
            filterLabel={activeFilterLabel}
            onComplete={handleLoopComplete}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  floatingReflectedToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(15, 18, 26, 0.94)',
    borderColor: '#2ED573',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#2ED573',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingReflectedToastText: {
    color: '#2ED573',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0E0F14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#8E94A5',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
  feedListContent: {
    paddingBottom: 40,
  },
  feedHeaderContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1C24',
    marginBottom: 8,
  },
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 6,
  },
  brandLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E94057',
    letterSpacing: -0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 5,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '700',
  },
  brandActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  headerRewindBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerRewindText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '800',
  },
  notificationBellButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: '#262936',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  bellIconText: {
    fontSize: 15,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E94057',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0E0F13',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  boostButton: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingHorizontal: 9,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    flexShrink: 0,
  },
  boostButtonText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
  },
  feedTagline: {
    color: '#8E94A5',
    fontSize: 12,
    marginBottom: 12,
    marginTop: 2,
  },
  filterBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desireFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1.5,
    borderColor: '#FF385C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 6,
  },
  desireHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.4)',
    paddingHorizontal: 8,
    height: 32,
    borderRadius: 16,
    gap: 3.5,
    flexShrink: 0,
  },
  desireHeaderIcon: {
    fontSize: 11,
  },
  desireHeaderText: {
    color: '#FF385C',
    fontSize: 11,
    fontWeight: '800',
  },
  communityHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    paddingHorizontal: 7,
    height: 32,
    borderRadius: 16,
    gap: 3.5,
    maxWidth: 82,
    flexShrink: 0,
  },
  communityHeaderButtonActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  compactHeaderBtn: {
    paddingHorizontal: 6,
    height: 30,
    borderRadius: 15,
  },
  compactCommunityBtn: {
    paddingHorizontal: 6,
    height: 30,
    borderRadius: 15,
    maxWidth: 68,
  },
  compactBellBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  communityHeaderIcon: {
    fontSize: 11,
  },
  communityHeaderText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  communityHeaderTextActive: {
    color: '#08080E',
  },
  clearCircleBtnHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  filterScrollView: {
    flex: 1,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: '#181A22',
    borderWidth: 1,
    borderColor: '#262935',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  filterChipActive: {
    backgroundColor: '#E94057',
    borderColor: '#E94057',
  },
  filterChipText: {
    color: '#A0A5B8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  feedWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#161821',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262836',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.45)',
      },
      default: {
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.45,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
    }),
    justifyContent: 'space-between',
  },
  belowCardContainer: {
    position: 'absolute',
    top: 4,
    left: 12,
    right: 12,
    bottom: 8,
    zIndex: 0,
    backgroundColor: '#0F1117',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroTouchWrap: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1E202B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  photoTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  goldVerifiedPill: {
    backgroundColor: 'rgba(255, 193, 7, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  goldVerifiedPillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  photoCountPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  photoCountPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  photoBottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(10, 12, 18, 0.88)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrimPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compatPill: {
    backgroundColor: 'rgba(233, 64, 87, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  compatPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  desireMatchPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  desireMatchPillText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
  },
  locationPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  locationPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  communityPill: {
    backgroundColor: 'rgba(255, 184, 0, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 160,
  },
  communityPillText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
  },
  boosterDeckCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121522',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  boosterDeckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  boosterDeckPill: {
    backgroundColor: 'rgba(255, 56, 92, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.4)',
  },
  boosterDeckPillText: {
    color: '#FF385C',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  boosterDeckTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 10,
  },
  boosterDeckSub: {
    color: '#A0AEC0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  boosterDeckActionBtn: {
    backgroundColor: '#FF385C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  boosterDeckActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  nameWithShieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  candidateNameText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  jobText: {
    color: '#F27121',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  lifestyleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  lifestyleChip: {
    backgroundColor: '#202330',
    borderWidth: 1,
    borderColor: '#2F3346',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  lifestyleChipText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  promptTeaserText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    marginTop: 5,
  },
  tapForMoreHint: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },
  storyDashesRow: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 12,
  },
  storyDash: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
  },
  storyDashActive: {
    backgroundColor: '#FFFFFF',
  },
  datingVerifiedPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: '#00F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  datingVerifiedPillText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
  },
  verifiedCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  voicePromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    gap: 6,
  },
  voicePromptPlay: {
    color: '#FF2B66',
    fontSize: 10,
    fontWeight: '900',
  },
  voicePromptDuration: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  voicePromptLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    flex: 1,
  },
  actionButtonsRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: 'rgba(10, 11, 16, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rewindBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#161822',
    borderWidth: 1.5,
    borderColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(234, 179, 8, 0.35)' },
      default: {
        shadowColor: '#EAB308',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  rewindBtnIcon: {
    color: '#EAB308',
    fontSize: 20,
    fontWeight: '900',
  },
  passBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1A1116',
    borderWidth: 2,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(255, 59, 48, 0.4)' },
      default: {
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  passBtnIcon: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: '900',
  },
  passBtnText: {
    display: 'none',
  },
  chaiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F1A28',
    borderWidth: 1.5,
    borderColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 10px rgba(0, 242, 254, 0.35)' },
      default: {
        shadowColor: '#00F2FE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  chaiBtnIcon: {
    color: '#00F2FE',
    fontSize: 20,
    fontWeight: '900',
  },
  chaiBtnText: {
    display: 'none',
  },
  sparkNoteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E1B10',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0px 2px 10px rgba(245, 158, 11, 0.4)' },
      default: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  sparkNoteBtnIcon: {
    fontSize: 20,
  },
  freePillDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#000000',
  },
  freePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  likeBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FF2B66',
    borderWidth: 2,
    borderColor: '#FF5A7E',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(255, 43, 102, 0.6)' },
      default: {
        shadowColor: '#FF2B66',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  likeBtnIcon: {
    fontSize: 24,
  },
  likeBtnText: {
    display: 'none',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  emptyCardBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: '#262A38',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.45)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  emptyCardIcon: {
    fontSize: 30,
  },
  radarPulseRingOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(233, 64, 87, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  radarPulseRingInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(233, 64, 87, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  activeFilterBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyCardSub: {
    color: '#8E94A5',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyPrimaryBtn: {
    width: '100%',
    backgroundColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0px 4px 14px rgba(233, 64, 87, 0.4)' },
      default: {
        shadowColor: '#E94057',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptySecondaryBtn: {
    width: '100%',
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#323648',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptySecondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyGhostBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGhostBtnText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  deckFinishedRadarWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  radarWave3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  radarWave2: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.35)',
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
  },
  radarWave1: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveProximityStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
  },
  liveBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveProximityStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1A1C24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2F3242',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalTarget: {
    color: '#F27121',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  modalDesc: {
    color: '#A0A4B4',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#222532',
    borderRadius: 14,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 90,
    marginBottom: 14,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCloseBtnText: {
    color: '#8E94A5',
    fontSize: 13,
    fontWeight: '600',
  },
  toastBanner: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: '#1E202B',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.5)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  stampBadge: {
    position: 'absolute',
    top: 36,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 3,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
      },
      default: {
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  likeBadge: {
    left: 20,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(20, 45, 25, 0.94)',
    transform: [{ rotate: '-14deg' }],
  },
  likeBadgeText: {
    color: '#4CAF50',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  passBadge: {
    right: 20,
    borderColor: '#E94057',
    backgroundColor: 'rgba(45, 20, 25, 0.94)',
    transform: [{ rotate: '14deg' }],
  },
  passBadgeText: {
    color: '#E94057',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  discoveryLivenessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  discoveryLivenessIcon: {
    fontSize: 16,
  },
  discoveryLivenessTextWrap: {
    flex: 1,
  },
  discoveryLivenessTitle: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '800',
  },
  discoveryLivenessSub: {
    color: '#FDE68A',
    fontSize: 10,
    marginTop: 1,
  },
  discoveryLivenessActionBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  discoveryLivenessActionText: {
    color: '#08080E',
    fontSize: 11,
    fontWeight: '800',
  },
});
