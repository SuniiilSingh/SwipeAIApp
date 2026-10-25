import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CandidateCard, ContextType, DietaryPreference, LivingStatus } from '@/types';
import { FEATURE_FLAGS } from '@/config/features';
import { playAudibleVoiceNote, stopAudibleVoiceNote } from '@/utils/audioPlayer';
import CosmicKundaliModal from '@/components/cosmic-kundali-modal';
import ScheduledDateCardModal from '@/components/scheduled-date-card-modal';
import { DateProposalData } from '@/components/date-proposal-bubble';
import { hapticFeedback } from '@/utils/haptics';
import { api, normalizeImageUrl } from '@/services/api';
import { formatHeight } from '@/utils/height';
import { MODEL_ASSETS, MEME_ASSETS, getModelAsset, resolveImageSource } from '@/constants/assets';
import { useThemedStyles } from '@/context/theme-context';
import { getCommunityColor } from '@/utils/metro-colors';

const { width } = Dimensions.get('window');
const PHOTO_HEIGHT = Math.min(Math.round(width * 1.25), 480);

interface ProfileDetailModalProps {
  visible: boolean;
  candidate: CandidateCard | null;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onSendSuperSpark?: () => void;
  onComment?: (contextType?: ContextType, contextTargetId?: string, contextTitle?: string, previewUrl?: string) => void;
  onSparkNote?: () => void;
  onRewind?: () => void;
  canRewind?: boolean;
  hasFreeSparkNote?: boolean;
  onStartChat?: () => void;
  onVirtualChai?: () => void;
  scheduledDate?: DateProposalData | null;
}

const getDietLabel = (diet?: DietaryPreference | string) => {
  switch (diet) {
    case 'STRICT_JAIN':
      return '🪷 Strict Jain (No Root Veg)';
    case 'PURE_VEG':
      return '🥦 Pure Veg';
    case 'VEGAN':
      return '🌱 Vegan (Plant-Based)';
    case 'EGGETARIAN':
      return '🍳 Eggetarian';
    case 'NON_VEG':
      return '🍗 Non-Veg';
    default:
      return diet ? `🥗 ${diet.replace('_', ' ')}` : '🥗 Pure Veg';
  }
};

const getLivingLabel = (living?: LivingStatus | string) => {
  switch (living) {
    case 'WITH_PARENTS':
      return '👨‍👩‍👧 Living with Parents';
    case 'INDEPENDENT_FLAT':
      return '🏙️ Independent Flat';
    case 'PG':
      return '🏠 PG / Co-Living';
    default:
      return living ? `🏠 ${living.replace('_', ' ')}` : '🏙️ Independent Flat';
  }
};

export default function ProfileDetailModal({
  visible,
  candidate,
  onClose,
  onLike,
  onPass,
  onSendSuperSpark,
  onComment,
  onSparkNote,
  onRewind,
  canRewind = true,
  hasFreeSparkNote = true,
  onStartChat,
  onVirtualChai,
  scheduledDate,
}: ProfileDetailModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(baseStyles);
  const bottomInset = Math.max(insets.bottom, 16);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showKundaliModal, setShowKundaliModal] = useState(false);
  const [showScheduledDateModal, setShowScheduledDateModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [reportRemarks, setReportRemarks] = useState('');
  const [reporting, setReporting] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('Not interested / No chemistry');
  const [blockRemarks, setBlockRemarks] = useState('');
  const [blocking, setBlocking] = useState(false);

  // Contextual Tag Reflection (Flow 4)
  const [reflectionToast, setReflectionToast] = useState<string | null>(null);
  const [myHobbies, setMyHobbies] = useState<string>(() => api.getCachedProfile()?.hobbies || '');
  const [myVacation, setMyVacation] = useState<string>(() => api.getCachedProfile()?.vacationPreference || '');

  const showReflectionToast = (msg: string) => {
    setReflectionToast(msg);
    setTimeout(() => {
      setReflectionToast((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const CANDIDATE_REPORT_REASONS = [
    { key: 'CATFISH', emoji: '🎭', label: 'Fake Profile / Catfishing', desc: 'Stolen photos, fake bio, or someone impersonating another person.' },
    { key: 'INAPPROPRIATE', emoji: '🔞', label: 'Inappropriate Photos or Bio', desc: 'Nudity, sexual solicitation, or vulgar content.' },
    { key: 'HARASSMENT', emoji: '🚫', label: 'Harassment & Abusive Behavior', desc: 'Hate speech, threatening text, or offensive messages.' },
    { key: 'SCAM', emoji: '💸', label: 'Commercial Spam or Financial Scam', desc: 'Asking for money, selling services, or spamming links.' },
    { key: 'UNDERAGE', emoji: '🚸', label: 'Suspected Minor (Under 18)', desc: 'Blunderr strictly forbids anyone under 18 years of age.' },
  ];

  const BLOCK_REASONS = [
    { key: 'NOT_INTERESTED', emoji: '🙅', label: 'Not interested / No chemistry' },
    { key: 'UNCOMFORTABLE', emoji: '😬', label: 'Made me uncomfortable' },
    { key: 'INAPPROPRIATE', emoji: '🚫', label: 'Inappropriate or offensive behavior' },
    { key: 'SPAM_BOT', emoji: '🤖', label: 'Spam, bot, or commercial account' },
    { key: 'OTHER', emoji: '💬', label: 'Other personal reason' },
  ];

  if (!candidate) return null;

  const rawCandidatePhotos = Array.isArray(candidate.photos) && candidate.photos.length > 0
    ? candidate.photos
    : [];

  const photos = rawCandidatePhotos
    .map((url) => normalizeImageUrl(url, true))
    .filter((url): url is string => !!url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('file:') && !url.startsWith('content:'));

  if (photos.length === 0 && (candidate as any).photo1) {
    const p1 = normalizeImageUrl((candidate as any).photo1, true);
    if (p1 && !p1.startsWith('file:') && !p1.startsWith('content:')) {
      photos.push(p1);
    }
  }

  if (photos.length === 0) {
    photos.push(getModelAsset(candidate.displayName) as any);
  }

  const interestsList = candidate.interests
    ? candidate.interests.split(',').map(s => s.trim()).filter(s => s)
    : ['Coffee', 'Travel', 'Indie music', 'Spotify', 'Foodie'];

  const handleClose = () => {
    stopAudibleVoiceNote();
    setIsPlayingAudio(false);
    setShowActionSheet(false);
    setShowReportModal(false);
    setShowBlockModal(false);
    setSelectedReportReason(null);
    setReportRemarks('');
    setBlockRemarks('');
    onClose();
  };

  const handleOpenBlockModal = () => {
    setShowActionSheet(false);
    setBlockReason('Not interested / No chemistry');
    setBlockRemarks('');
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    setBlocking(true);
    hapticFeedback.medium();
    await api.blockUser(candidate.userId, blockReason, blockRemarks);
    setBlocking(false);
    setShowBlockModal(false);
    hapticFeedback.success();
    Alert.alert(
      'User Blocked',
      `${candidate.displayName} has been blocked and removed from your feed. Your remarks have been submitted to Trust & Safety for review.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onPass) onPass();
            handleClose();
          },
        },
      ]
    );
  };

  const handleOpenReportModal = () => {
    setShowActionSheet(false);
    setSelectedReportReason(null);
    setReportRemarks('');
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    if (!selectedReportReason) return;
    setReporting(true);
    hapticFeedback.medium();
    const ok = await api.reportProfile(candidate.userId, selectedReportReason, reportRemarks);
    setReporting(false);
    setShowReportModal(false);
    hapticFeedback.success();
    Alert.alert(
      'Report Submitted',
      `Thank you for helping keep Blunderr safe. We received your report for "${selectedReportReason}". Our Trust & Safety team will review your remarks within 24 hours. This user has been blocked and removed from your feed.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onPass) onPass();
            handleClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{candidate.displayName}'s Profile</Text>
            <Text style={styles.headerSub}>
              {FEATURE_FLAGS.ENABLE_DIGILOCKER && candidate.isDigilockerVerified
                ? '🛡️ DigiLocker Verified'
                : candidate.livenessScore >= 0.85
                ? '👤 3D Liveness Verified'
                : 'VibeCheck Pass'}
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            {scheduledDate && (
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowScheduledDateModal(true);
                }}
                style={styles.headerDateBtn}
                activeOpacity={0.8}
                accessibilityLabel="View Scheduled Date Card">
                <Text style={{ fontSize: 16 }}>🥂</Text>
                <View style={styles.headerDateBadgeDot} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                setShowActionSheet(true);
              }}
              style={styles.moreOptionsBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.moreOptionsText}>•••</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Photo Carousel */}
          <View style={styles.carouselWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
                setActivePhotoIdx(newIdx);
              }}>
              {photos.map((photoUrl, idx) => (
                <View key={idx} style={styles.photoSlide}>
                  <Image
                    source={resolveImageSource(photoUrl, getModelAsset(candidate.displayName, idx))}
                    style={styles.carouselImg}
                    contentFit="cover"
                    contentPosition="top center"
                    transition={200}
                    cachePolicy="memory-disk"
                    priority="high"
                  />
                  <Text style={styles.watermarkOverlay}>
                    BlunderR • ID {candidate.userId.substring(0, 6)} • Photo {idx + 1}/{photos.length}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {photos.length > 1 && (
              <View style={styles.paginationDotsRow}>
                {photos.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.dot, activePhotoIdx === idx && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Contextual Tag Reflection Toast */}
          {reflectionToast ? (
            <View style={{
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: 'rgba(46, 213, 115, 0.16)',
              borderColor: '#2ED573',
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 14,
              alignItems: 'center',
            }}>
              <Text style={{ color: '#2ED573', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                {reflectionToast}
              </Text>
            </View>
          ) : null}

          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {candidate.fullName || candidate.displayName}, {candidate.age}
              </Text>
              {((FEATURE_FLAGS.ENABLE_DIGILOCKER && candidate.isDigilockerVerified) || candidate.livenessScore >= 0.85) && (
                <View style={styles.livenessBadgeName}>
                  <View style={styles.livenessDot} />
                  <Text style={styles.livenessBadgeNameText}>
                    {FEATURE_FLAGS.ENABLE_DIGILOCKER && candidate.isDigilockerVerified ? '🛡️ DIGILOCKER VERIFIED' : '🛡️ 3D LIVENESS VERIFIED'}
                  </Text>
                </View>
              )}
            </View>

            {/* Compatibility Vibe Score */}
            <View style={styles.vibeRow}>
              <View style={styles.vibeScoreBadge}>
                <Text style={styles.vibeScoreText}>✨ {candidate.compatibilityScore}% Compatibility Match</Text>
              </View>
              {candidate.karmaScore ? (
                <View style={styles.karmaBadge}>
                  <Text style={styles.karmaText}>⚡ Karma {candidate.karmaScore}/200</Text>
                </View>
              ) : null}
            </View>

            {/* Real Scheduled Date Card in Profile */}
            {scheduledDate && (
              <TouchableOpacity
                style={styles.profileScheduledDateCard}
                onPress={() => {
                  hapticFeedback.light();
                  setShowScheduledDateModal(true);
                }}
                activeOpacity={0.85}>
                <View style={styles.profileScheduledDateTop}>
                  <View style={styles.profileScheduledDateBadge}>
                    <Text style={styles.profileScheduledDateBadgeText}>🥂 REAL DATE SCHEDULED</Text>
                  </View>
                  <Text style={styles.profileScheduledDateViewPill}>View Date Card ›</Text>
                </View>
                <View style={styles.profileScheduledDateDetails}>
                  <Text style={styles.profileScheduledDateText}>
                    📅 {scheduledDate.date} • ⏰ {scheduledDate.time}
                  </Text>
                  <Text style={styles.profileScheduledDateVenue} numberOfLines={1}>
                    📍 {scheduledDate.venue}
                  </Text>
                </View>
                <View style={styles.profileScheduledDateShieldPill}>
                  <Text style={styles.profileScheduledDateShieldText}>
                    🛡️ SafeDate Shield™ Active • Rule of 5 Slot Freed
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <Text style={styles.locText}>
              📍 {candidate.neighborhood ? `${candidate.neighborhood}, ` : ''}{candidate.city ? candidate.city : ''} • {typeof candidate.distanceKm === 'number' && candidate.distanceKm >= 0 ? (candidate.distanceKm < 1 ? '< 1 km away' : `${candidate.distanceKm.toFixed(1)} km away`) : 'Nearby'}
            </Text>
          </View>

          {/* 💼 1ST POSITION: Dedicated Career & Education Pedigree Card */}
          <View style={styles.careerCard}>
            <View style={styles.careerHeaderRow}>
              <View style={styles.careerHeaderTitleWrap}>
                <Text style={styles.careerHeaderTitle}>💼 PROFESSIONAL & ACADEMIC PEDIGREE</Text>
              </View>
              <View style={styles.careerVerifiedBadge}>
                <Text style={styles.careerVerifiedBadgeText}>✓ VERIFIED</Text>
              </View>
            </View>

            {/* Job / Occupation */}
            {(candidate.job || candidate.occupation || candidate.company) ? (
              <View style={styles.pedigreeRow}>
                <View style={styles.pedigreeIconBox}>
                  <Text style={styles.pedigreeIcon}>💼</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedigreePrimaryText}>
                    {candidate.job || candidate.occupation || 'Professional'}
                  </Text>
                  <Text style={styles.pedigreeSubText}>
                    {candidate.company ? `${candidate.company} • ` : ''}Professional Career Track
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Education / Institute */}
            {(candidate.education || candidate.institute) ? (
              <View style={styles.pedigreeRow}>
                <View style={styles.pedigreeIconBox}>
                  <Text style={styles.pedigreeIcon}>🎓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedigreePrimaryText}>
                    {candidate.education || 'Graduate Degree'}
                  </Text>
                  <Text style={styles.pedigreeSubText}>
                    {candidate.institute || 'University / Higher Education'}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Height & Fitness */}
            {candidate.height ? (
              <View style={styles.pedigreeRow}>
                <View style={styles.pedigreeIconBox}>
                  <Text style={styles.pedigreeIcon}>📏</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedigreePrimaryText}>
                    Height: {formatHeight(candidate.height)}
                  </Text>
                  <Text style={styles.pedigreeSubText}>
                    Athletic • Active & Healthy Lifestyle
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* 🎙️ 2ND POSITION: Vernacular Voice Note (if candidate has audio) */}
          {Boolean(
            (typeof candidate.voicePrompt?.audioUrl === 'string' && candidate.voicePrompt.audioUrl.trim() !== '') ||
            (typeof candidate.voicePromptUrl === 'string' && candidate.voicePromptUrl.trim() !== '')
          ) && (
            <View style={styles.voicePromptCard}>
              <View style={styles.voiceHeader}>
                <Text style={styles.voiceTitle}>🎙️ 15s Vernacular Voice Note</Text>
                <Text style={styles.voiceDuration}>{candidate.voicePrompt?.durationSec || candidate.voicePromptDuration || 15}s</Text>
              </View>
              <Text style={styles.voicePromptText}>"{candidate.voicePrompt?.promptText || candidate.voicePromptText || 'Vernacular voice intro'}"</Text>

              <TouchableOpacity
                style={styles.audioWaveBtn}
                onPress={() => {
                  const targetAudio = (candidate.voicePrompt?.audioUrl && candidate.voicePrompt.audioUrl.trim()) ||
                                      (candidate.voicePromptUrl && candidate.voicePromptUrl.trim());
                  if (!targetAudio) return;

                  if (isPlayingAudio) {
                    stopAudibleVoiceNote();
                    setIsPlayingAudio(false);
                  } else {
                    playAudibleVoiceNote({
                      audioUrl: targetAudio,
                      promptText: candidate.voicePrompt?.promptText || candidate.voicePromptText,
                      durationSec: candidate.voicePrompt?.durationSec || candidate.voicePromptDuration || 15,
                      onStart: () => setIsPlayingAudio(true),
                      onEnd: () => setIsPlayingAudio(false),
                    });
                  }
                }}>
                <Text style={styles.playIcon}>
                  {isPlayingAudio ? '⏸️ Playing Voice Note...' : '▶ Listen (Authentic Voice Note)'}
                </Text>
                <View style={styles.fakeWaveform}>
                  {[12, 26, 38, 18, 32, 10, 36, 22, 42, 16, 28].map((h, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.waveBar,
                        { height: isPlayingAudio ? (h * 1.2) % 32 + 6 : h },
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 🔮 3RD POSITION: Cosmic Chemistry & 36-Point Kundali Synergy (Swapped into Career's former slot) */}
          <TouchableOpacity
            style={styles.cosmicCard}
            onPress={() => {
              hapticFeedback.light();
              setShowKundaliModal(true);
            }}
            activeOpacity={0.85}>
            <View style={styles.cosmicHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={{ fontSize: 18 }}>🔮</Text>
                <View>
                  <Text style={styles.cosmicSectionTitle} numberOfLines={1}>
                    33/36 Guna Milan & Cosmic Vibe
                  </Text>
                  <Text style={styles.cosmicSubTitle}>
                    Nadi & Bhakoot Auspicious • High Energy Match
                  </Text>
                </View>
              </View>
              <View style={styles.viewKundaliBadge}>
                <Text style={styles.viewKundaliBadgeText}>View Kundali ↗</Text>
              </View>
            </View>

            <View style={styles.astroRow}>
              <View style={styles.astroPill}>
                <Text style={styles.astroLabel}>Sun Sign</Text>
                <Text style={styles.astroValue}>{candidate.sunSign || candidate.culturalBadges?.zodiac || 'Aries'}</Text>
              </View>
              <View style={styles.astroPill}>
                <Text style={styles.astroLabel}>Moon Sign</Text>
                <Text style={styles.astroValue}>{candidate.moonSign || 'Scorpio'}</Text>
              </View>
              <View style={styles.astroPill}>
                <Text style={styles.astroLabel}>Cosmic Synergy</Text>
                <Text style={styles.astroValue}>
                  {candidate.cosmicChemistry?.synergyTag || '89% High Vibe'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Dating Goal & Orientation */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>🎯 Dating Goal & Orientation</Text>
            <View style={styles.traitsWrap}>
              <View style={styles.traitChip}>
                <Text style={styles.traitLabel}>Looking For</Text>
                <Text style={styles.traitValue}>
                  {candidate.relationshipIntent || 'Long-term partner'}
                </Text>
              </View>

              {candidate.sexualOrientation && (
                <View style={styles.traitChip}>
                  <Text style={styles.traitLabel}>Orientation</Text>
                  <Text style={styles.traitValue}>🏳️‍🌈 {candidate.sexualOrientation}</Text>
                </View>
              )}

              {candidate.genderDisplay && (
                <View style={styles.traitChip}>
                  <Text style={styles.traitLabel}>Gender</Text>
                  <Text style={styles.traitValue}>👤 {candidate.genderDisplay}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Prompt / Icebreaker */}
          {candidate.profilePromptAnswer && (
            <View style={styles.promptQuoteCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={[styles.promptQuestionTitle, { flex: 1, marginRight: 8 }]}>
                  🗣️ {candidate.profilePromptQuestion || 'The key to my heart is...'}
                </Text>
                {onComment && (
                  <TouchableOpacity
                    style={styles.promptCommentChip}
                    onPress={() =>
                      onComment(
                        'PROMPT',
                        'profile_prompt',
                        candidate.profilePromptQuestion || 'Profile Prompt',
                        undefined
                      )
                    }>
                    <Text style={styles.promptCommentChipText}>✨ Spark</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.promptAnswerText}>"{candidate.profilePromptAnswer}"</Text>
            </View>
          )}

          {/* Bio Description */}
          {candidate.bio && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>✍️ Bio Description</Text>
              <Text style={styles.bioText}>{candidate.bio}</Text>
            </View>
          )}

          {/* Interests Tags */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>🏷️ What I'm Into</Text>
            <View style={styles.interestsWrap}>
              {interestsList.map((item, idx) => (
                <View key={idx} style={styles.interestPill}>
                  <Text style={styles.interestPillText}>#{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cultural & Lifestyle Markers */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>🥗 Cultural & Lifestyle Indicators</Text>
            <View style={styles.traitsWrap}>
              <View style={[styles.traitChip, { minWidth: '48%' }]}>
                <Text style={styles.traitLabel}>Dietary Preference</Text>
                <Text style={styles.traitValue}>
                  {getDietLabel(candidate.culturalBadges?.diet)}
                </Text>
              </View>

              <View style={[styles.traitChip, { minWidth: '48%' }]}>
                <Text style={styles.traitLabel}>Living Situation</Text>
                <Text style={styles.traitValue}>
                  {getLivingLabel(candidate.culturalBadges?.living)}
                </Text>
              </View>

              {((candidate.culturalBadges?.languages && candidate.culturalBadges.languages.length > 0) || (candidate.languagesSpoken && candidate.languagesSpoken.length > 0)) && (
                <View style={[styles.traitChip, { width: '100%' }]}>
                  <Text style={styles.traitLabel}>Spoken Languages</Text>
                  <Text style={styles.traitValue}>
                    🗣️ {(candidate.culturalBadges?.languages && candidate.culturalBadges.languages.length > 0 ? candidate.culturalBadges.languages : candidate.languagesSpoken)?.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Lifestyle Habits & Vacation Vibe (Smoking, Drinking, Mountains or Beaches) */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>🌿 Habits & Vacation Vibe</Text>
            <View style={styles.traitsWrap}>
              <View style={[styles.traitChip, { minWidth: '48%' }]}>
                <Text style={styles.traitLabel}>Smoking Habit</Text>
                <Text style={styles.traitValue}>
                  {candidate.smokingHabit || 'Non-Smoker 🚭'}
                </Text>
              </View>

              <View style={[styles.traitChip, { minWidth: '48%' }]}>
                <Text style={styles.traitLabel}>Alcohol / Drinking</Text>
                <Text style={styles.traitValue}>
                  {candidate.drinkingHabit || 'Social / Weekend Drinker 🍷'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.traitChip,
                  { width: '100%' },
                  Boolean(candidate.vacationPreference && myVacation.includes(candidate.vacationPreference.slice(0, 5))) && {
                    borderColor: 'rgba(46, 213, 115, 0.4)',
                    backgroundColor: 'rgba(46, 213, 115, 0.08)',
                  },
                ]}
                activeOpacity={0.75}
                onPress={async () => {
                  const vac = candidate.vacationPreference || 'Majestic Mountains 🏔️';
                  if (myVacation.includes(vac.slice(0, 5))) return;
                  hapticFeedback.success();
                  setMyVacation(vac);
                  showReflectionToast(`✈️ Added "${vac}" to your profile! Shared vacation wavelength unlocked.`);
                  try {
                    await api.updateMyProfile({ vacationPreference: vac });
                  } catch (e) {}
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.traitLabel}>Vacation Vibe: Mountains vs Beaches</Text>
                  {Boolean(candidate.vacationPreference && myVacation.includes(candidate.vacationPreference.slice(0, 5))) ? (
                    <Text style={{ color: '#2ED573', fontSize: 10, fontWeight: '800' }}>✓ MUTUAL VIBE</Text>
                  ) : (
                    <Text style={{ color: '#FF385C', fontSize: 10, fontWeight: '700' }}>+ Tap to Sync</Text>
                  )}
                </View>
                <Text style={styles.traitValue}>
                  {candidate.vacationPreference || 'Majestic Mountains 🏔️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hobbies & Active Pursuits with Contextual 1-Tap Reflection */}
          {candidate.hobbies && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.cardSectionTitle}>🎨 Hobbies & Pursuits</Text>
                <Text style={{ color: '#8E94A5', fontSize: 11 }}>Tap any tag to add to profile</Text>
              </View>
              <View style={styles.interestsWrap}>
                {candidate.hobbies.split(',').map((h, idx) => {
                  const tag = h.trim();
                  if (!tag) return null;
                  const isMutual = myHobbies.toLowerCase().includes(tag.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={async () => {
                        if (isMutual) return;
                        hapticFeedback.success();
                        const updated = myHobbies ? `${myHobbies}, ${tag}` : tag;
                        setMyHobbies(updated);
                        showReflectionToast(`✨ Added "${tag}" to your profile! You now match on this pursuit.`);
                        try {
                          await api.updateMyProfile({ hobbies: updated });
                        } catch (e) {}
                      }}
                      style={[
                        styles.interestPill,
                        isMutual ? {
                          backgroundColor: 'rgba(46, 213, 115, 0.15)',
                          borderColor: '#2ED573',
                        } : {
                          backgroundColor: 'rgba(255, 152, 0, 0.12)',
                          borderColor: 'rgba(255, 152, 0, 0.3)',
                        },
                      ]}>
                      <Text style={[styles.interestPillText, { color: isMutual ? '#2ED573' : '#FF9800' }]}>
                        {isMutual ? '✓ ' : '+ '}✨ {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Profile Meme DNA */}
          {(candidate.memeMatch || candidate.selectedMemeUrl) && (
            <View style={styles.memeCard}>
              <View style={styles.memeHeader}>
                <Text style={styles.memeHeaderTitle}>
                  🤣 Profile Meme DNA {candidate.memeMatch?.matchPercent ? `(${candidate.memeMatch.matchPercent}% Match)` : ''}
                </Text>
              </View>
              <Image
                source={resolveImageSource(candidate.selectedMemeUrl || candidate.memeMatch?.memeImageUrl, MEME_ASSETS[0])}
                style={styles.memePhoto}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
              <Text style={styles.memeCaption}>
                {candidate.selectedMemeTitle || candidate.memeMatch?.memeTitle || 'Profile Meme DNA'}
              </Text>
            </View>
          )}

          {/* Micro-Circle Community */}
          {candidate.microCircle && (() => {
            const colorConfig = getCommunityColor(candidate.microCircle);
            return (
              <View
                style={[
                  styles.circleBanner,
                  {
                    borderColor: colorConfig.cardBorder,
                    backgroundColor: colorConfig.cardBg,
                    borderLeftWidth: 4,
                    borderLeftColor: colorConfig.primary,
                  },
                ]}>
                <Text style={styles.circleBannerTitle}>
                  {colorConfig.emoji} {colorConfig.name.toUpperCase()} TRIBE
                </Text>
                <Text
                  style={[
                    styles.circleBannerName,
                    { color: colorConfig.textColor },
                  ]}>
                  "{candidate.microCircle}"
                </Text>
              </View>
            );
          })()}

          {/* Trust Pass & Liveness Badge */}
          <View style={styles.trustBadgeCard}>
            <Text style={styles.trustIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle}>100% Zero-Knowledge Authenticated</Text>
              <Text style={styles.trustSub}>
                {FEATURE_FLAGS.ENABLE_DIGILOCKER
                  ? `DigiLocker Age 18+ verified • 3D Biometric Liveness score: ${Math.round(candidate.livenessScore * 100)}%`
                  : `3D Biometric Liveness score: ${Math.round(candidate.livenessScore * 100)}% • Real Human Verified`}
              </Text>
            </View>
          </View>

          <View style={{ height: 100 + bottomInset }} />
        </ScrollView>

        {/* Bottom Interactive Action Bar */}
        {(onStartChat || onVirtualChai || onPass || onLike || onSendSuperSpark || onSparkNote || onRewind) && (
          <View style={[styles.footerBar, { paddingBottom: bottomInset, paddingTop: 12 }]}>
            {onStartChat ? (
              <>
                <TouchableOpacity
                  style={styles.primaryFooterBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    hapticFeedback.medium();
                    onStartChat();
                  }}>
                  <Text style={styles.primaryFooterBtnText}>💬 Open Chat Lounge</Text>
                </TouchableOpacity>

                {FEATURE_FLAGS.ENABLE_CALLING && onVirtualChai && (
                  <TouchableOpacity
                    style={styles.secondaryFooterBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticFeedback.light();
                      onVirtualChai();
                    }}>
                    <Text style={styles.secondaryFooterBtnText}>☕ Virtual Chai</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* 1. Rewind Button */}
                {onRewind ? (
                  canRewind ? (
                    <TouchableOpacity
                      style={styles.cardRewindBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        hapticFeedback.light();
                        onRewind();
                      }}
                      accessibilityLabel="Rewind Last Profile">
                      <Text style={styles.cardRewindBtnIcon}>↺</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.cardRewindBtn, { opacity: 0.35 }]}>
                      <Text style={styles.cardRewindBtnIcon}>↺</Text>
                    </View>
                  )
                ) : null}

                {/* 2. Pass Button */}
                {onPass && (
                  <TouchableOpacity
                    style={styles.cardPassBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticFeedback.medium();
                      onPass();
                    }}
                    accessibilityLabel="Pass Profile">
                    <Text style={styles.cardPassBtnIcon}>✕</Text>
                  </TouchableOpacity>
                )}

                {/* 3. Super Spark / Star Button */}
                {onSendSuperSpark && (
                  <TouchableOpacity
                    style={styles.cardChaiBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticFeedback.heavy();
                      onSendSuperSpark();
                    }}
                    accessibilityLabel="Super Spark">
                    <Text style={styles.cardChaiBtnIcon}>★</Text>
                  </TouchableOpacity>
                )}

                {/* 4. Spark Note / Comment Button */}
                {(onSparkNote || onComment) && (
                  <TouchableOpacity
                    style={styles.cardSparkNoteBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticFeedback.medium();
                      if (onSparkNote) {
                        onSparkNote();
                      } else if (onComment) {
                        onComment(
                          'PHOTO',
                          `photo_${activePhotoIdx}`,
                          `${candidate.displayName}'s Photo #${activePhotoIdx + 1}`,
                          photos[activePhotoIdx]
                        );
                      }
                    }}
                    accessibilityLabel="Daily Free Spark Note">
                    <Text style={styles.cardSparkNoteBtnIcon}>✨</Text>
                    {hasFreeSparkNote && (
                      <View style={styles.cardFreePillDot}>
                        <Text style={styles.cardFreePillText}>1</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* 5. Like / Swipe Button */}
                {onLike && (
                  <TouchableOpacity
                    style={styles.cardLikeBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticFeedback.heavy();
                      onLike();
                    }}
                    accessibilityLabel="Like Profile">
                    <Text style={styles.cardLikeBtnIcon}>❤️</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* Cosmic Kundali & Vibe Harmony Breakdown Modal */}
      <CosmicKundaliModal
        visible={showKundaliModal}
        candidate={candidate}
        onClose={() => setShowKundaliModal(false)}
      />

      {/* UGC Safety Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}>
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetIndicator} />
            <Text style={styles.sheetTitle}>Safety & Trust Options</Text>
            <Text style={styles.sheetSub}>
              Take safety action regarding {candidate.displayName}'s profile
            </Text>

            <TouchableOpacity
              style={styles.sheetOptionDestructive}
              onPress={handleOpenReportModal}>
              <Text style={styles.sheetOptionEmoji}>🚩</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptionTextDestructive}>Report Profile</Text>
                <Text style={styles.sheetOptionDesc}>
                  Flag objectionable photos, fake bio, or abusive behavior with admin remarks
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleOpenBlockModal}
              disabled={blocking}>
              <Text style={styles.sheetOptionEmoji}>🚫</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptionText}>Block User</Text>
                <Text style={styles.sheetOptionDesc}>
                  Hide this profile permanently and submit optional feedback to admin
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setShowActionSheet(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* UGC Report Reason & Remarks Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportHeaderTitle}>Report to Trust & Safety</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.reportCloseBtn}>
                <Text style={styles.reportCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reportHeaderSub}>
              Help keep Blunderr safe. Our moderation team reviews every report within 24 hours.
            </Text>

            {reporting ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E94057" />
                <Text style={{ color: '#CACDD8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
                  Submitting report and shielding profile...
                </Text>
              </View>
            ) : !selectedReportReason ? (
              <>
                <Text style={styles.stepTitle}>Select a Reason</Text>
                <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                  {CANDIDATE_REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.key}
                      style={styles.reasonCard}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedReportReason(reason.label);
                      }}>
                      <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reasonLabel}>{reason.label}</Text>
                        <Text style={styles.reasonDesc}>{reason.desc}</Text>
                      </View>
                      <Text style={styles.reasonArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.selectedReasonBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text style={{ fontSize: 14 }}>🚩</Text>
                    <Text style={styles.selectedReasonText} numberOfLines={1}>{selectedReportReason}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReportReason(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.changeReasonText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.remarksLabel}>Remarks for Admin Review (Optional)</Text>
                <TextInput
                  style={styles.remarksInput}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  placeholder="Provide context or specific details to help our Trust & Safety admin team review this profile and take appropriate action..."
                  placeholderTextColor="#6B7280"
                  value={reportRemarks}
                  onChangeText={setReportRemarks}
                  textAlignVertical="top"
                />
                <View style={styles.remarksMetaRow}>
                  <Text style={styles.remarksHint}>Your report is strictly confidential.</Text>
                  <Text style={styles.remarksCounter}>{reportRemarks.length}/500</Text>
                </View>

                <View style={styles.shieldNoticeBox}>
                  <Text style={styles.shieldNoticeText}>
                    🛡️ <Text style={{ fontWeight: '700', color: '#FDA4AF' }}>SafeDate Shield™:</Text> Submitting this report will immediately sever all interactions and block {candidate.displayName} from your feed.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.submitReportBtn}
                  onPress={handleConfirmReport}
                  activeOpacity={0.85}>
                  <Text style={styles.submitReportBtnText}>🚨 Submit Report & Block Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backReasonBtn}
                  onPress={() => setSelectedReportReason(null)}>
                  <Text style={styles.backReasonBtnText}>← Choose Another Reason</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* UGC Block Profile & Remarks Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportHeaderTitle}>Block {candidate.displayName} 🚫</Text>
              <TouchableOpacity onPress={() => setShowBlockModal(false)} style={styles.reportCloseBtn}>
                <Text style={styles.reportCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reportHeaderSub}>
              You will no longer see each other anywhere on Blunderr. All past and future interactions will be severed.
            </Text>

            {blocking ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={{ color: '#CACDD8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
                  Blocking user and recording feedback...
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.remarksLabel}>Select Primary Reason</Text>
                <View style={styles.blockReasonChipsWrap}>
                  {BLOCK_REASONS.map((item) => {
                    const isSelected = blockReason === item.label;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.blockReasonChip, isSelected && styles.blockReasonChipActive]}
                        onPress={() => {
                          hapticFeedback.selection();
                          setBlockReason(item.label);
                        }}>
                        <Text style={styles.blockReasonEmoji}>{item.emoji}</Text>
                        <Text style={[styles.blockReasonChipText, isSelected && styles.blockReasonChipTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.remarksLabel}>Remarks for Admin Review (Optional)</Text>
                <TextInput
                  style={styles.remarksInput}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  placeholder="Optional: Tell our team why you are blocking this profile (helps admins detect spam patterns or suspicious activity)..."
                  placeholderTextColor="#6B7280"
                  value={blockRemarks}
                  onChangeText={setBlockRemarks}
                  textAlignVertical="top"
                />
                <View style={styles.remarksMetaRow}>
                  <Text style={styles.remarksHint}>Shared confidentially with admin moderation.</Text>
                  <Text style={styles.remarksCounter}>{blockRemarks.length}/500</Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmBlockBtn}
                  onPress={handleConfirmBlock}
                  activeOpacity={0.85}>
                  <Text style={styles.confirmBlockBtnText}>🚫 Confirm & Block Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBlockBtn}
                  onPress={() => setShowBlockModal(false)}>
                  <Text style={styles.cancelBlockBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Scheduled Date Card Modal */}
      <ScheduledDateCardModal
        visible={showScheduledDateModal}
        onClose={() => setShowScheduledDateModal(false)}
        candidateName={candidate.displayName}
        candidatePhoto={candidate.photos?.[0]}
        dateData={scheduledDate || null}
      />
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#20222B',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1F28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#CACDD8',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerDateBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0E0F13',
  },
  profileScheduledDateCard: {
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
  },
  profileScheduledDateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileScheduledDateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  profileScheduledDateBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileScheduledDateViewPill: {
    color: '#FF758F',
    fontSize: 12,
    fontWeight: '700',
  },
  profileScheduledDateDetails: {
    gap: 3,
  },
  profileScheduledDateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  profileScheduledDateVenue: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  profileScheduledDateShieldPill: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileScheduledDateShieldText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  moreOptionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1F28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOptionsText: {
    color: '#CACDD8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  carouselWrapper: {
    width: '100%',
    height: PHOTO_HEIGHT,
    position: 'relative',
    backgroundColor: '#16171E',
  },
  photoSlide: {
    width,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  carouselImg: {
    width,
    height: PHOTO_HEIGHT,
    backgroundColor: '#16171E',
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paginationDotsRow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#E94057',
  },
  card: {
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: '#262833',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  goldBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  goldBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  livenessBadgeName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(255, 184, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  livenessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ED573',
  },
  livenessBadgeNameText: {
    color: '#FFD700',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  careerCard: {
    backgroundColor: '#101426',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  careerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  careerHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  careerHeaderTitle: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  careerVerifiedBadge: {
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  careerVerifiedBadgeText: {
    color: '#2ED573',
    fontSize: 9.5,
    fontWeight: '800',
  },
  pedigreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  pedigreeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedigreeIcon: {
    fontSize: 16,
  },
  pedigreePrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pedigreeSubText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  cosmicCard: {
    backgroundColor: '#161224',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  cosmicSubTitle: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vibeScoreBadge: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.4)',
  },
  vibeScoreText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
  },
  karmaBadge: {
    backgroundColor: '#2A1F1D',
    borderWidth: 1,
    borderColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  karmaText: {
    color: '#FF9800',
    fontSize: 10,
    fontWeight: '700',
  },
  jobText: {
    color: '#E94057',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  eduText: {
    color: '#CACDD8',
    fontSize: 13,
    marginTop: 2,
  },
  detailRowText: {
    color: '#CACDD8',
    fontSize: 13,
    marginTop: 2,
  },
  locText: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 4,
  },
  cardSectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  cosmicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    width: '100%',
  },
  cosmicSectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  viewKundaliBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  viewKundaliBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  traitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitChip: {
    backgroundColor: '#1E1F28',
    borderWidth: 1,
    borderColor: '#2E303E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  traitLabel: {
    color: '#8E94A5',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  traitValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  promptQuoteCard: {
    backgroundColor: '#201A24',
    borderLeftWidth: 4,
    borderLeftColor: '#E94057',
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  promptQuestionTitle: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  promptAnswerText: {
    color: '#ffffff',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  bioText: {
    color: '#CACDD8',
    fontSize: 13,
    lineHeight: 20,
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestPill: {
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  interestPillText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '700',
  },
  astroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  astroPill: {
    flex: 1,
    backgroundColor: '#1E1F28',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  astroLabel: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '700',
  },
  astroValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  voicePromptCard: {
    backgroundColor: '#191C24',
    borderWidth: 1,
    borderColor: '#2E303E',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  voiceTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  voiceDuration: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  voicePromptText: {
    color: '#CACDD8',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  audioWaveBtn: {
    backgroundColor: '#1E1F28',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  playIcon: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  fakeWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#E94057',
    borderRadius: 2,
  },
  memeCard: {
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: '#262833',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  memeHeader: {
    marginBottom: 8,
  },
  memeHeaderTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  memePhoto: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 8,
  },
  memeCaption: {
    color: '#CACDD8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  circleBanner: {
    backgroundColor: '#1F1B2A',
    borderWidth: 1,
    borderColor: '#3D2F54',
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  circleBannerTitle: {
    color: '#9C27B0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  circleBannerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  trustBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#142019',
    borderWidth: 1,
    borderColor: '#264230',
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  trustIcon: {
    fontSize: 22,
  },
  trustTitle: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  trustSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },

  // Action Footer
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 11, 15, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)', boxShadow: '0px -6px 24px rgba(0, 0, 0, 0.6)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  cardRewindBtn: {
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
  cardRewindBtnIcon: {
    color: '#EAB308',
    fontSize: 20,
    fontWeight: '900',
  },
  cardPassBtn: {
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
  cardPassBtnIcon: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: '900',
  },
  cardChaiBtn: {
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
  cardChaiBtnIcon: {
    color: '#00F2FE',
    fontSize: 20,
    fontWeight: '900',
  },
  cardSparkNoteBtn: {
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
  cardSparkNoteBtnIcon: {
    fontSize: 20,
  },
  cardFreePillDot: {
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
  cardFreePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cardLikeBtn: {
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
  cardLikeBtnIcon: {
    fontSize: 24,
  },
  primaryFooterBtn: {
    flex: 1,
    backgroundColor: '#E94057',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryFooterBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryFooterBtn: {
    backgroundColor: '#1E1F28',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  secondaryFooterBtnText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '700',
  },

  // UGC Action Sheet & Report Styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#161822',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#262A38',
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#373A4A',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheetSub: {
    color: '#8E94A5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  sheetOptionDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  sheetOptionEmoji: {
    fontSize: 22,
  },
  sheetOptionTextDestructive: {
    color: '#E94057',
    fontSize: 15,
    fontWeight: '800',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2E3242',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sheetOptionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  sheetOptionDesc: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  sheetCancelBtn: {
    backgroundColor: '#262A38',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: '#CACDD8',
    fontSize: 14,
    fontWeight: '700',
  },

  // Report Modal Container
  reportModalContainer: {
    backgroundColor: '#161822',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#262A38',
    maxHeight: '85%',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  reportCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCloseText: {
    color: '#8E94A5',
    fontSize: 14,
    fontWeight: '700',
  },
  reportHeaderSub: {
    color: '#8E94A5',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2A2E3D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  reasonEmoji: {
    fontSize: 22,
  },
  reasonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reasonDesc: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  reasonArrow: {
    color: '#E94057',
    fontSize: 16,
    fontWeight: '800',
  },
  promptCommentChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  promptCommentChipText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  stepTitle: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedReasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  selectedReasonText: {
    color: '#FF758F',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  changeReasonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  remarksLabel: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  remarksInput: {
    backgroundColor: '#0E0F14',
    borderWidth: 1,
    borderColor: '#262A38',
    borderRadius: 14,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  remarksMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  remarksHint: {
    color: '#6B7280',
    fontSize: 11,
  },
  remarksCounter: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  shieldNoticeBox: {
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.22)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  shieldNoticeText: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 17,
  },
  submitReportBtn: {
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
  submitReportBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backReasonBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  backReasonBtnText: {
    color: '#8E94A5',
    fontSize: 13,
    fontWeight: '600',
  },
  blockReasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  blockReasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2A2E3D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  blockReasonChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
  },
  blockReasonEmoji: {
    fontSize: 14,
  },
  blockReasonChipText: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '600',
  },
  blockReasonChipTextActive: {
    color: '#F87171',
    fontWeight: '700',
  },
  confirmBlockBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  confirmBlockBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBlockBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBlockBtnText: {
    color: '#8E94A5',
    fontSize: 13,
    fontWeight: '600',
  },
});
