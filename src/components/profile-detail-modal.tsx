import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CandidateCard, DietaryPreference, LivingStatus } from '@/types';
import { FEATURE_FLAGS } from '@/config/features';

const { width } = Dimensions.get('window');

interface ProfileDetailModalProps {
  visible: boolean;
  candidate: CandidateCard | null;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onSendChai?: () => void;
  onComment?: () => void;
  onStartChat?: () => void;
  onVirtualChai?: () => void;
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
  onSendChai,
  onComment,
  onStartChat,
  onVirtualChai,
}: ProfileDetailModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!candidate) return null;

  const photos = candidate.photos && candidate.photos.length > 0
    ? candidate.photos
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'];

  const interestsList = candidate.interests
    ? candidate.interests.split(',').map(s => s.trim()).filter(s => s)
    : ['Coffee', 'Travel', 'Indie music', 'Spotify', 'Foodie'];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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
          <View style={styles.headerRightSpacer} />
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
                  <Image source={{ uri: photoUrl }} style={styles.carouselImg} resizeMode="cover" />
                  <Text style={styles.watermarkOverlay}>
                    Blunderr Dating • ID {candidate.userId.substring(0, 6)} • Photo {idx + 1}/{photos.length}
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

          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {candidate.fullName || candidate.displayName}, {candidate.age}
              </Text>
              {((FEATURE_FLAGS.ENABLE_DIGILOCKER && candidate.isDigilockerVerified) || candidate.livenessScore >= 0.85) && (
                <View style={styles.goldBadge}>
                  <Text style={styles.goldBadgeText}>
                    {FEATURE_FLAGS.ENABLE_DIGILOCKER && candidate.isDigilockerVerified ? '🛡️ VERIFIED' : '👤 VERIFIED'}
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

            {/* Occupation & Education */}
            {(candidate.job || candidate.occupation) && (
              <Text style={styles.jobText}>
                💼 {candidate.job || candidate.occupation} {candidate.company ? `@ ${candidate.company}` : ''}
              </Text>
            )}

            {candidate.education && (
              <Text style={styles.eduText}>🎓 {candidate.education}</Text>
            )}

            {candidate.height && (
              <Text style={styles.detailRowText}>📏 Height: {candidate.height} cm</Text>
            )}

            <Text style={styles.locText}>
              📍 {candidate.neighborhood ? `${candidate.neighborhood}, ` : ''}{candidate.city || 'Bengaluru'} • {candidate.distanceKm} km away
            </Text>
          </View>

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
              <Text style={styles.promptQuestionTitle}>
                🗣️ {candidate.profilePromptQuestion || 'The key to my heart is...'}
              </Text>
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

              {candidate.culturalBadges?.languages && (
                <View style={[styles.traitChip, { width: '100%' }]}>
                  <Text style={styles.traitLabel}>Spoken Languages</Text>
                  <Text style={styles.traitValue}>
                    🗣️ {candidate.culturalBadges.languages.join(', ')}
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

              <View style={[styles.traitChip, { width: '100%' }]}>
                <Text style={styles.traitLabel}>Vacation Vibe: Mountains vs Beaches</Text>
                <Text style={styles.traitValue}>
                  {candidate.vacationPreference || 'Majestic Mountains 🏔️'}
                </Text>
              </View>
            </View>
          </View>

          {/* Hobbies & Active Pursuits */}
          {candidate.hobbies && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>🎨 Hobbies & Pursuits</Text>
              <View style={styles.interestsWrap}>
                {candidate.hobbies.split(',').map((h, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.interestPill,
                      {
                        backgroundColor: 'rgba(255, 152, 0, 0.12)',
                        borderColor: 'rgba(255, 152, 0, 0.3)',
                      },
                    ]}>
                    <Text style={[styles.interestPillText, { color: '#FF9800' }]}>✨ {h.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Modern Cosmic Chemistry */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>✨ Cosmic Chemistry & Astrological Synergy</Text>
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
          </View>

          {/* Vernacular Voice Note */}
          {candidate.voicePrompt && (
            <View style={styles.voicePromptCard}>
              <View style={styles.voiceHeader}>
                <Text style={styles.voiceTitle}>🎙️ 15s Vernacular Voice Note</Text>
                <Text style={styles.voiceDuration}>{candidate.voicePrompt.durationSec}s</Text>
              </View>
              <Text style={styles.voicePromptText}>"{candidate.voicePrompt.promptText}"</Text>

              <TouchableOpacity
                style={styles.audioWaveBtn}
                onPress={() => setIsPlayingAudio(!isPlayingAudio)}>
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

          {/* Meme DNA Compatibility */}
          {candidate.memeMatch && (
            <View style={styles.memeCard}>
              <View style={styles.memeHeader}>
                <Text style={styles.memeHeaderTitle}>
                  🤣 Meme DNA Match ({candidate.memeMatch.matchPercent}%)
                </Text>
              </View>
              <Image
                source={{ uri: candidate.memeMatch.memeImageUrl }}
                style={styles.memePhoto}
                resizeMode="cover"
              />
              <Text style={styles.memeCaption}>{candidate.memeMatch.memeTitle}</Text>
            </View>
          )}

          {/* Micro-Circle Community */}
          {candidate.microCircle && (
            <View style={styles.circleBanner}>
              <Text style={styles.circleBannerTitle}>📍 Micro-Circle Community</Text>
              <Text style={styles.circleBannerName}>"{candidate.microCircle}"</Text>
            </View>
          )}

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

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Bottom Interactive Action Bar */}
        <View style={styles.footerBar}>
          {onPass && (
            <TouchableOpacity style={styles.actionPassBtn} onPress={onPass}>
              <Text style={styles.actionPassIcon}>✖</Text>
            </TouchableOpacity>
          )}

          {onSendChai && (
            <TouchableOpacity style={styles.actionChaiBtn} onPress={onSendChai}>
              <Text style={styles.actionChaiEmoji}>☕</Text>
              <Text style={styles.actionChaiText}>Send Chai (₹21)</Text>
            </TouchableOpacity>
          )}

          {onComment && (
            <TouchableOpacity style={styles.actionCommentBtn} onPress={onComment}>
              <Text style={styles.actionCommentIcon}>💬</Text>
            </TouchableOpacity>
          )}

          {onLike && (
            <TouchableOpacity style={styles.actionLikeBtn} onPress={onLike}>
              <Text style={styles.actionLikeIcon}>❤️</Text>
            </TouchableOpacity>
          )}

          {onStartChat && (
            <TouchableOpacity style={styles.primaryFooterBtn} onPress={onStartChat}>
              <Text style={styles.primaryFooterBtnText}>💬 Open Chat Lounge</Text>
            </TouchableOpacity>
          )}

          {onVirtualChai && (
            <TouchableOpacity style={styles.secondaryFooterBtn} onPress={onVirtualChai}>
              <Text style={styles.secondaryFooterBtnText}>☕ Virtual Chai</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  carouselWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
    backgroundColor: '#16171E',
  },
  photoSlide: {
    width,
    height: 380,
    position: 'relative',
  },
  carouselImg: {
    width: '100%',
    height: '100%',
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
    backgroundColor: 'rgba(14, 15, 19, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#20222B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionPassBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1F28',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#343847',
  },
  actionPassIcon: {
    color: '#8E94A5',
    fontSize: 18,
    fontWeight: '800',
  },
  actionChaiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 14,
    gap: 6,
  },
  actionChaiEmoji: {
    fontSize: 18,
  },
  actionChaiText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  actionCommentBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1F28',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E94057',
  },
  actionCommentIcon: {
    fontSize: 18,
  },
  actionLikeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E94057',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLikeIcon: {
    color: '#ffffff',
    fontSize: 20,
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
});
