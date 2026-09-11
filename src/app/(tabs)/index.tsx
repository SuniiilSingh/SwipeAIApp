import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { ActionType, CandidateCard, ContextType } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import { FEATURE_FLAGS } from '@/config/features';

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
  { id: 'EGGETARIAN', label: '🍳 Eggetarian' },
  { id: 'NON_VEG', label: '🍗 Non-Veg' },
  { id: 'MOUNTAINS', label: '🏔️ Mountains' },
  { id: 'BEACHES', label: '🏖️ Beaches' },
  { id: 'NON_SMOKER', label: '🚭 Non-Smoker' },
];

export default function DiscoveryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [remainingSwipes, setRemainingSwipes] = useState(25);

  // Exact 1-screen viewport dimensions
  const [feedDimensions, setFeedDimensions] = useState<{ width: number; height: number }>({
    width,
    height: Math.max(450, height - 160),
  });

  // Selected Candidate for Full Profile Inspection Sheet
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCard | null>(null);
  const [showFullProfileModal, setShowFullProfileModal] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2000);
  };

  // Comment Modal state
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

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const feed = await api.getFeed();
      const list = feed?.candidates && Array.isArray(feed.candidates) ? feed.candidates : [];
      setCandidates(list);
      setRemainingSwipes(feed?.remainingDailySwipes || 25);
    } catch (e) {
      setCandidates([]);
      setRemainingSwipes(25);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleOpenProfile = (candidate: CandidateCard) => {
    setSelectedCandidate(candidate);
    setShowFullProfileModal(true);
  };

  const handleAction = async (
    targetCandidate: CandidateCard,
    actionType: ActionType,
    noteText?: string
  ) => {
    if (!targetCandidate) return;

    const targetId = targetCandidate.userId;
    const targetName = targetCandidate.displayName || 'Candidate';

    // 1. Immediately remove the profile from candidates so it GOES AWAY and the next loads
    setCandidates((prev) => prev.filter((c) => c.userId !== targetId));

    // 2. If the full detail sheet is viewing this candidate, dismiss it
    if (selectedCandidate?.userId === targetId) {
      setShowFullProfileModal(false);
      setSelectedCandidate(null);
    }

    // 3. Show instant tactile feedback toast
    if (actionType === 'PASS') {
      showToast(`✕ Passed on ${targetName}`);
    } else if (actionType === 'LIKE') {
      showToast(`❤️ Liked ${targetName}`);
    } else if (actionType === 'SUPER_CHAI') {
      showToast(`☕ Sent Chai to ${targetName}!`);
    }

    // 4. Record interaction in backend
    try {
      const res = await api.interact(
        targetId,
        actionType,
        selectedContext.type,
        selectedContext.targetId,
        noteText || ''
      );

      if (res.isMatch) {
        Alert.alert(
          '✨ It’s a Vibe Match!',
          `You matched with ${targetName}! Unlock the chat lounge via the 10s Icebreaker Quiz.`,
          [
            { text: 'Keep Exploring', style: 'cancel' },
            {
              text: 'Play Icebreaker ⚡',
              onPress: () => router.push('/(tabs)/matches'),
            },
          ]
        );
      }

      setRemainingSwipes(res.remainingDailySwipes);
    } catch (e) {}

    setCommentText('');
    setCommentModalVisible(false);
  };

  const handleSendCuttingChai = (candidate: CandidateCard) => {
    setChaiTargetCandidate(candidate);
    setChaiModalVisible(true);
  };

  const confirmSendCuttingChai = async () => {
    if (!chaiTargetCandidate) return;
    const target = chaiTargetCandidate;
    setChaiModalVisible(false);
    setChaiTargetCandidate(null);

    await api.createUpiOrder('CUTTING_CHAI_21');
    handleAction(target, 'SUPER_CHAI');
  };

  // Filter candidates based on selected tag
  const filteredCandidates = candidates.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PURE_VEG') return c.culturalBadges?.diet === 'PURE_VEG';
    if (selectedFilter === 'STRICT_JAIN') return c.culturalBadges?.diet === 'STRICT_JAIN';
    if (selectedFilter === 'EGGETARIAN') return c.culturalBadges?.diet === 'EGGETARIAN';
    if (selectedFilter === 'NON_VEG') return c.culturalBadges?.diet === 'NON_VEG';
    if (selectedFilter === 'MOUNTAINS') return c.vacationPreference?.includes('Mountain');
    if (selectedFilter === 'BEACHES') return c.vacationPreference?.includes('Beach');
    if (selectedFilter === 'NON_SMOKER') return c.smokingHabit?.includes('Non-Smoker');
    return true;
  });

interface SwipeableCardProps {
  item: CandidateCard;
  feedDimensions: { width: number; height: number };
  onLike: (item: CandidateCard) => void;
  onPass: (item: CandidateCard) => void;
  onSendChai: (item: CandidateCard) => void;
  onOpenDetails: (item: CandidateCard) => void;
}

function SwipeableCandidateCard({
  item,
  feedDimensions,
  onLike,
  onPass,
  onSendChai,
  onOpenDetails,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;

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
        paddingHorizontal: 14,
        paddingBottom: 8,
        paddingTop: 4,
      }}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate: rotate },
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
          <Image
            source={{
              uri: item.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Top Badges Overlaid on Photo */}
          <View style={styles.photoTopRow}>
            {FEATURE_FLAGS.ENABLE_DIGILOCKER && item.isDigilockerVerified ? (
              <View style={styles.goldVerifiedPill}>
                <Text style={styles.goldVerifiedPillText}>✓ DigiLocker Verified</Text>
              </View>
            ) : item.livenessScore >= 0.85 ? (
              <View style={[styles.goldVerifiedPill, { borderColor: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                <Text style={[styles.goldVerifiedPillText, { color: '#00E5FF' }]}>✓ 3D Liveness Verified</Text>
              </View>
            ) : (
              <View style={styles.photoCountPill}>
                <Text style={styles.photoCountPillText}>Blunderr Safe</Text>
              </View>
            )}

            <View style={styles.photoCountPill}>
              <Text style={styles.photoCountPillText}>
                📷 {item.photos?.length || 4} Photos • Tap Details
              </Text>
            </View>
          </View>

          {/* Bottom Overlaid Details Scrim */}
          <View style={styles.photoBottomScrim}>
            {/* Row 1: Compatibility Pill & Location */}
            <View style={styles.scrimPillsRow}>
              <View style={styles.compatPill}>
                <Text style={styles.compatPillText}>
                  ⚡ {item.compatibilityScore}% Match • {item.culturalBadges?.zodiac || 'Aries'} ♈
                </Text>
              </View>

              <View style={styles.locationPill}>
                <Text style={styles.locationPillText}>
                  📍 {item.neighborhood || item.city || 'Bengaluru'} • {item.distanceKm || 3.8} km
                </Text>
              </View>
            </View>

            {/* Row 2: Name & Age */}
            <View style={styles.nameWithShieldRow}>
              <Text style={styles.candidateNameText}>
                {item.fullName || item.displayName}, {item.age}
              </Text>
              <View style={styles.activeDot} />
            </View>

            {/* Row 3: Job & College */}
            <Text style={styles.jobText} numberOfLines={1}>
              💼 {item.occupation || item.job || 'Professional'}{item.company ? ` @ ${item.company}` : ''}
              {item.education ? ` • 🎓 ${item.education}` : ''}
            </Text>

            {/* Row 4: Lifestyle Indicators Row */}
            <View style={styles.lifestyleRow}>
              <View style={styles.lifestyleChip}>
                <Text style={styles.lifestyleChipText}>{item.smokingHabit || '🚭 Non-Smoker'}</Text>
              </View>
              <View style={styles.lifestyleChip}>
                <Text style={styles.lifestyleChipText}>{item.drinkingHabit || '🍷 Social'}</Text>
              </View>
              <View style={styles.lifestyleChip}>
                <Text style={styles.lifestyleChipText}>
                  {item.vacationPreference || '🏔️ Mountains'}
                </Text>
              </View>
              <View style={styles.lifestyleChip}>
                <Text style={styles.lifestyleChipText}>{getDietBadge(item.culturalBadges?.diet)}</Text>
              </View>
            </View>

            {/* Row 5: Prompt Quote Teaser */}
            {item.profilePromptAnswer ? (
              <Text style={styles.promptTeaserText} numberOfLines={1}>
                💬 "{item.profilePromptAnswer}"
              </Text>
            ) : item.bio ? (
              <Text style={styles.promptTeaserText} numberOfLines={1}>
                "{item.bio}"
              </Text>
            ) : null}

            {/* Row 6: Tap to View Details hint */}
            <Text style={styles.tapForMoreHint}>
              🔍 Tap card for full photos, audio note & details →
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons Row - ALWAYS 100% VISIBLE WITHIN THE SCREEN */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.passBtn}
            activeOpacity={0.8}
            onPress={() => onPass(item)}>
            <Text style={styles.passBtnIcon}>✕</Text>
            <Text style={styles.passBtnText}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chaiBtn}
            activeOpacity={0.8}
            onPress={() => onSendChai(item)}>
            <Text style={styles.chaiBtnIcon}>☕</Text>
            <Text style={styles.chaiBtnText}>Send Chai (₹21)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeBtn}
            activeOpacity={0.8}
            onPress={() => onLike(item)}>
            <Text style={styles.likeBtnIcon}>❤️</Text>
            <Text style={styles.likeBtnText}>Like</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

  const renderCandidateCard = ({ item }: { item: CandidateCard }) => {
    return (
      <SwipeableCandidateCard
        item={item}
        feedDimensions={feedDimensions}
        onLike={(cand) => handleAction(cand, 'LIKE')}
        onPass={(cand) => handleAction(cand, 'PASS')}
        onSendChai={(cand) => handleSendCuttingChai(cand)}
        onOpenDetails={(cand) => handleOpenProfile(cand)}
      />
    );
  };

  const renderFeedHeader = () => (
    <View style={styles.feedHeaderContainer}>
      {/* Top App Bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandTitleWrap}>
          <Text style={styles.brandLogo}>Blunderr Dating</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.liveText}>
              {filteredCandidates.length} Singles in Deck
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.boostButton}
          onPress={() => router.push('/(tabs)/store')}>
          <Text style={styles.boostButtonText}>⚡ Boost</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}>
        {FILTER_TAGS.map((filter) => {
          const isSelected = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}>
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
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E94057" />
        <Text style={styles.loadingText}>Curating verified profiles in Bengaluru...</Text>
      </SafeAreaView>
    );
  }

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
          data={filteredCandidates}
          keyExtractor={(item) => item.userId}
          renderItem={renderCandidateCard}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: feedDimensions.height,
            offset: feedDimensions.height * index,
            index,
          })}
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
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>
                {candidates.length === 0 ? "You're All Caught Up!" : 'No Profiles in this Category'}
              </Text>
              <Text style={styles.emptySub}>
                {candidates.length === 0
                  ? 'Check back soon for new verified singles in your area, or adjust your match distance and filters.'
                  : 'Try selecting "All Profiles" to explore the remaining verified singles.'}
              </Text>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSelectedFilter('ALL');
                  if (candidates.length === 0) {
                    loadFeed();
                  }
                }}>
                <Text style={styles.resetFilterBtnText}>
                  {candidates.length === 0 ? '🔄 Check for New Profiles' : 'Show All Profiles'}
                </Text>
              </TouchableOpacity>
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
            <Text style={styles.modalHeading}>☕ Virtual Cutting Chai (₹21)</Text>
            <Text style={styles.modalTarget}>
              Invite {chaiTargetCandidate?.displayName} for a conversation
            </Text>
            <Text style={styles.modalDesc}>
              A micro-invite with high response rate. If accepted, you both get a 15% discount coupon at Blue Tokai Indiranagar!
            </Text>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={confirmSendCuttingChai}>
              <Text style={styles.modalSubmitBtnText}>Pay ₹21 via UPI & Send Chai ☕</Text>
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
        onSendChai={() => {
          const target = selectedCandidate;
          setShowFullProfileModal(false);
          setSelectedCandidate(null);
          if (target) handleSendCuttingChai(target);
        }}
        onComment={() => {
          setShowFullProfileModal(false);
          if (selectedCandidate) {
            setSelectedContext({
              type: 'PROMPT',
              targetId: 'bio_prompt',
              title: `${selectedCandidate.displayName}'s Profile`,
            });
            setCommentModalVisible(true);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1C24',
    marginBottom: 16,
  },
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E94057',
    letterSpacing: -0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
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
  boostButton: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
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
  actionButtonsRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#161821',
    borderTopWidth: 1,
    borderTopColor: '#242736',
    gap: 8,
  },
  passBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#202330',
    borderWidth: 1,
    borderColor: '#34384B',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  passBtnIcon: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  passBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  chaiBtn: {
    flex: 1.35,
    height: 42,
    backgroundColor: '#F27121',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  chaiBtnIcon: {
    fontSize: 13,
  },
  chaiBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  likeBtn: {
    flex: 1.15,
    height: 42,
    backgroundColor: '#E94057',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  likeBtnIcon: {
    fontSize: 13,
  },
  likeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    color: '#8E94A5',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: '#E94057',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetFilterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
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
});
