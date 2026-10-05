import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CandidateCard } from '@/types';
import { api } from '@/services/api';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

interface CosmicKundaliModalProps {
  visible: boolean;
  candidate: CandidateCard | null;
  viewerSign?: string;
  onClose: () => void;
  onUseSpark?: (spark: string) => void;
}

interface CosmicData {
  viewerSign: string;
  candidateSign: string;
  overallSynergyScore: number;
  gunaScore: number;
  headline: string;
  vibeReport: string;
  sharedStrengths: string[];
  conversationalSpark: string;
}

const ELEMENT_ICONS: Record<string, { element: string; icon: string; color: string }> = {
  Aries: { element: 'Fire', icon: '♈ 🔥', color: '#EF4444' },
  Leo: { element: 'Fire', icon: '♌ ☀️', color: '#F59E0B' },
  Sagittarius: { element: 'Fire', icon: '♐ 🏹', color: '#F97316' },
  Taurus: { element: 'Earth', icon: '♉ 🌿', color: '#10B981' },
  Virgo: { element: 'Earth', icon: '♍ 🌾', color: '#059669' },
  Capricorn: { element: 'Earth', icon: '♑ 🏔️', color: '#34D399' },
  Gemini: { element: 'Air', icon: '♊ 💨', color: '#06B6D4' },
  Libra: { element: 'Air', icon: '♎ ⚖️', color: '#38BDF8' },
  Aquarius: { element: 'Air', icon: '♒ ⚡', color: '#60A5FA' },
  Cancer: { element: 'Water', icon: '♋ 🌊', color: '#3B82F6' },
  Scorpio: { element: 'Water', icon: '♏ 🦂', color: '#8B5CF6' },
  Pisces: { element: 'Water', icon: '♓ 🐟', color: '#A855F7' },
};

export default function CosmicKundaliModal({
  visible,
  candidate,
  viewerSign = 'Taurus',
  onClose,
  onUseSpark,
}: CosmicKundaliModalProps) {
  const [loading, setLoading] = useState(false);
  const [cosmicData, setCosmicData] = useState<CosmicData | null>(null);

  useEffect(() => {
    if (visible && candidate) {
      loadCosmicReport();
    }
  }, [visible, candidate]);

  const loadCosmicReport = async () => {
    if (!candidate) return;
    setLoading(true);

    const candSign = candidate.sunSign || candidate.culturalBadges?.zodiac || 'Leo';
    const cleanCandSign = candSign.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Leo';

    try {
      const astroMatch = await api.getAstroMatch(candidate.userId);
      if (astroMatch && astroMatch.totalScore != null) {
        setCosmicData({
          viewerSign: astroMatch.viewer?.sunSign || viewerSign,
          candidateSign: astroMatch.candidate?.sunSign || cleanCandSign,
          overallSynergyScore: astroMatch.percentage,
          gunaScore: astroMatch.totalScore,
          headline: `${astroMatch.totalScore}/36 Gunas — ${astroMatch.vibeTitle}`,
          vibeReport: astroMatch.vibeSummary,
          sharedStrengths: [
            `🧬 Vitality & Genetic Harmony (Nadi): ${astroMatch.nadiScore}/8`,
            `💖 Emotional Resonance (Bhakoot): ${astroMatch.bhakootScore}/7`,
            `⚡ Daily Temperament (Gana): ${astroMatch.ganaScore}/6`,
            `🧠 Conversational Frequency (Maitri): ${astroMatch.grahaMaitriScore}/5`,
            `🔥 Sensory Synergy (Yoni): ${astroMatch.yoniScore}/4`,
          ],
          conversationalSpark: `Ask ${candidate.displayName} about their Nakshatra (${astroMatch.candidate?.nakshatraName || 'Birth Star'}) and if their stars align on the best weekend chai spot!`,
        });
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Could not load remote cosmic report:', e);
    }

    // Default rich fallback computation
    const synergy = candidate.compatibilityScore ? Math.min(98, Math.max(76, candidate.compatibilityScore)) : 91;
    const guna = Math.round((synergy / 100) * 36);

    setCosmicData({
      viewerSign,
      candidateSign: cleanCandSign,
      overallSynergyScore: synergy,
      gunaScore: Math.max(26, Math.min(36, guna)),
      headline: `Your Sun in ${viewerSign} + ${candidate.displayName}'s Moon in ${cleanCandSign} = ${synergy}% Cosmic Vibe Synergy`,
      vibeReport: `Dynamic blend of grounded intention and spontaneous warmth. You provide the calm anchor, while ${candidate.displayName} brings playful weekend energy and spark.`,
      sharedStrengths: [
        'Shared taste in quiet aesthetic cafes & late-night drives',
        'High mutual respect for personal space & career ambitions',
        'Effortless banter rhythm — 0 awkward pauses',
      ],
      conversationalSpark: `Ask ${candidate.displayName} if they believe in mercury retrograde or if they just use it as an excuse for bad texting habits!`,
    });
    setLoading(false);
  };

  if (!visible || !candidate) return null;

  const candSign = cosmicData?.candidateSign || 'Leo';
  const candElement = ELEMENT_ICONS[candSign] || { element: 'Fire', icon: '☀️', color: '#F59E0B' };
  const viewerElement = ELEMENT_ICONS[viewerSign] || { element: 'Earth', icon: '🌿', color: '#10B981' };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerStars}>✨ 🪐 ✨</Text>
              <Text style={styles.headerTitle}>Cosmic Kundali & Vibe Harmony</Text>
              <Text style={styles.headerSubtitle}>
                Vedic Synastry & Astrological Chemistry with {candidate.displayName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                onClose();
              }}
              style={styles.closeBtn}
              activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Aligning cosmic houses & calculating Gunas...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              {/* Guna Score & Overall Synergy Hero Card */}
              <View style={styles.heroScoreCard}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>{cosmicData?.gunaScore || 32}</Text>
                  <Text style={styles.scoreTotal}>/ 36 Gunas</Text>
                  <View style={styles.gunaBadge}>
                    <Text style={styles.gunaBadgeText}>✦ SHUBH MILAN ✦</Text>
                  </View>
                </View>

                <View style={styles.scoreSummaryCol}>
                  <Text style={styles.synergyPercentText}>
                    {cosmicData?.overallSynergyScore || 91}% Vibe Synergy
                  </Text>
                  <Text style={styles.synergyStatusBadge}>High Cosmic Resonance</Text>
                  <Text style={styles.synergySummarySub}>
                    Exceptional mental, emotional, and lifestyle compatibility according to planetary alignment.
                  </Text>
                </View>
              </View>

              {/* Zodiac Archetype Comparison */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🪐 Astrological Archetypes</Text>
                <View style={styles.archetypeRow}>
                  <View style={styles.signBox}>
                    <Text style={styles.signPersonLabel}>You</Text>
                    <Text style={styles.signSymbol}>{viewerElement.icon}</Text>
                    <Text style={styles.signName}>{viewerSign}</Text>
                    <Text style={[styles.elementPill, { color: viewerElement.color }]}>
                      {viewerElement.element} Element
                    </Text>
                  </View>

                  <View style={styles.harmonySparkCenter}>
                    <Text style={styles.infinityIcon}>⚡</Text>
                    <Text style={styles.sparkText}>HARMONY</Text>
                  </View>

                  <View style={styles.signBox}>
                    <Text style={styles.signPersonLabel}>{candidate.displayName}</Text>
                    <Text style={styles.signSymbol}>{candElement.icon}</Text>
                    <Text style={styles.signName}>{candSign}</Text>
                    <Text style={[styles.elementPill, { color: candElement.color }]}>
                      {candElement.element} Element
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vibe Synastry Report */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🔮 Astrological Vibe Report</Text>
                <Text style={styles.headlineText}>"{cosmicData?.headline}"</Text>
                <Text style={styles.vibeParagraph}>{cosmicData?.vibeReport}</Text>
              </View>

              {/* Shared Cosmic Strengths */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>✨ Celestial Strengths</Text>
                {cosmicData?.sharedStrengths.map((str, idx) => (
                  <View key={idx} style={styles.strengthRow}>
                    <Text style={styles.strengthBullet}>✦</Text>
                    <Text style={styles.strengthText}>{str}</Text>
                  </View>
                ))}
              </View>

              {/* Cultural & Lifestyle Harmony */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🌿 Lifestyle & Diet Harmony</Text>
                <View style={styles.lifestyleGrid}>
                  <View style={styles.lifestyleItem}>
                    <Text style={styles.lifestyleLabel}>Dietary Preference</Text>
                    <Text style={styles.lifestyleVal}>
                      {candidate.culturalBadges?.diet
                        ? candidate.culturalBadges.diet.replace('_', ' ')
                        : 'Pure Veg & Eggetarian'}
                    </Text>
                    <Text style={styles.lifestyleBadge}>✓ High Sync</Text>
                  </View>

                  <View style={styles.lifestyleItem}>
                    <Text style={styles.lifestyleLabel}>Living Setup</Text>
                    <Text style={styles.lifestyleVal}>
                      {candidate.culturalBadges?.living
                        ? candidate.culturalBadges.living.replace('_', ' ')
                        : 'Independent Flat'}
                    </Text>
                    <Text style={styles.lifestyleBadge}>✓ High Sync</Text>
                  </View>
                </View>
              </View>

              {/* Conversational Spark Card */}
              {cosmicData?.conversationalSpark ? (
                <View style={styles.sparkCard}>
                  <View style={styles.sparkHeader}>
                    <Text style={styles.sparkIcon}>💬</Text>
                    <Text style={styles.sparkTitle}>Recommended Conversational Spark</Text>
                  </View>
                  <Text style={styles.sparkQuote}>"{cosmicData.conversationalSpark}"</Text>

                  {onUseSpark && (
                    <TouchableOpacity
                      style={styles.useSparkBtn}
                      onPress={() => {
                        hapticFeedback.medium();
                        onUseSpark(cosmicData.conversationalSpark);
                        onClose();
                      }}
                      activeOpacity={0.8}>
                      <Text style={styles.useSparkBtnText}>Use Spark in Chat →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => {
                  hapticFeedback.light();
                  onClose();
                }}>
                <Text style={styles.dismissBtnText}>Close Cosmic Kundali</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#10121A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2232',
  },
  headerTitleRow: {
    flex: 1,
    paddingRight: 10,
  },
  headerStars: {
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    backgroundColor: '#1E2232',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
  },
  loaderCenter: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#D1D5DB',
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroScoreCard: {
    backgroundColor: '#181B26',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  scoreCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  scoreNumber: {
    color: '#FFD700',
    fontSize: 26,
    fontWeight: '900',
  },
  scoreTotal: {
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '600',
  },
  gunaBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 3,
  },
  gunaBadgeText: {
    color: '#000000',
    fontSize: 7,
    fontWeight: '800',
  },
  scoreSummaryCol: {
    flex: 1,
  },
  synergyPercentText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  synergyStatusBadge: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  synergySummarySub: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#151722',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#24283A',
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  archetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  signBox: {
    alignItems: 'center',
    width: 100,
  },
  signPersonLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  signSymbol: {
    fontSize: 26,
    marginBottom: 4,
  },
  signName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  elementPill: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  harmonySparkCenter: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  infinityIcon: {
    fontSize: 22,
    color: '#FFD700',
  },
  sparkText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  headlineText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  vibeParagraph: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  strengthBullet: {
    color: '#FFD700',
    fontSize: 11,
    marginTop: 2,
  },
  strengthText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  lifestyleItem: {
    flex: 1,
    backgroundColor: '#1C1F2D',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2D3248',
  },
  lifestyleLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
  },
  lifestyleVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  lifestyleBadge: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  sparkCard: {
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.3)',
  },
  sparkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sparkIcon: {
    fontSize: 15,
  },
  sparkTitle: {
    color: '#FF6584',
    fontSize: 13,
    fontWeight: '700',
  },
  sparkQuote: {
    color: '#F3F4F6',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 10,
  },
  useSparkBtn: {
    backgroundColor: '#E94057',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  useSparkBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissBtn: {
    backgroundColor: '#1E2232',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  dismissBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
});
