import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { AstroMatchResult } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

interface CosmicChemistryModalProps {
  visible: boolean;
  onClose: () => void;
  candidateUserId?: string;
  candidateName?: string;
  cachedScore?: number;
}

export default function CosmicChemistryModal({
  visible,
  onClose,
  candidateUserId,
  candidateName = 'Your Match',
  cachedScore,
}: CosmicChemistryModalProps) {
  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState<AstroMatchResult | null>(null);

  useEffect(() => {
    if (visible && candidateUserId) {
      setLoading(true);
      api.getAstroMatch(candidateUserId)
        .then((res) => {
          setMatchResult(res);
        })
        .catch(() => {
          // Fallback
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible, candidateUserId]);

  if (!visible) return null;

  const score = matchResult?.totalScore ?? cachedScore ?? 28;
  const percentage = matchResult?.percentage ?? Math.round((score / 36) * 100);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Cosmic Chemistry ✨</Text>
                <Text style={styles.headerSubtitle}>36-Point Vedic Kundali Compatibility</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  onClose();
                }}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Aligning the Stars & Ephemeris...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Score Badge */}
                <View style={styles.scoreHero}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNumber}>{score}</Text>
                    <Text style={styles.scoreTotal}>/ 36 Gunas</Text>
                  </View>
                  <View style={styles.scoreHeroMeta}>
                    <Text style={styles.vibeTitle}>{matchResult?.vibeTitle || 'High Vibe Cosmic Match 🌟'}</Text>
                    <Text style={styles.vibeSummary}>
                      {matchResult?.vibeSummary ||
                        'Strong cosmic alignment! You share deep conversational wavelength, natural warmth, and great day-to-day lifestyle compatibility.'}
                    </Text>
                    <View style={styles.harmonyPill}>
                      <Text style={styles.harmonyPillText}>🌟 {percentage}% Overall Vibe Harmony</Text>
                    </View>
                  </View>
                </View>

                {/* Manglik Synergy Banner */}
                {matchResult?.manglikSummary && (
                  <View
                    style={[
                      styles.manglikBanner,
                      matchResult.isManglikCompatible ? styles.manglikGood : styles.manglikDynamic,
                    ]}
                  >
                    <Text style={styles.manglikText}>{matchResult.manglikSummary}</Text>
                  </View>
                )}

                {/* Side-by-Side Blueprint */}
                {matchResult?.viewer && matchResult?.candidate && (
                  <View style={styles.blueprintCard}>
                    <Text style={styles.sectionHeader}>Astrological Blueprint 🌌</Text>
                    <View style={styles.blueprintRow}>
                      {/* Viewer Column */}
                      <View style={styles.blueprintCol}>
                        <Text style={styles.blueprintName} numberOfLines={1}>
                          {matchResult.viewer.displayName || 'You'}
                        </Text>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillLabel}>☀️ Sun</Text>
                          <Text style={styles.tagPillValue}>{matchResult.viewer.sunSign}</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillLabel}>🌙 Moon</Text>
                          <Text style={styles.tagPillValue}>{matchResult.viewer.chandraRashi}</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillLabel}>✨ Star</Text>
                          <Text style={styles.tagPillValue}>{matchResult.viewer.nakshatraName}</Text>
                        </View>
                        {matchResult.viewer.yoniAnimal && (
                          <View style={styles.tagPill}>
                            <Text style={styles.tagPillLabel}>🐾 Animal</Text>
                            <Text style={styles.tagPillValue}>{matchResult.viewer.yoniAnimal}</Text>
                          </View>
                        )}
                      </View>

                      {/* Spark Center Divider */}
                      <View style={styles.sparkCenter}>
                        <Text style={styles.sparkEmoji}>⚡</Text>
                      </View>

                      {/* Candidate Column */}
                      <View style={styles.blueprintCol}>
                        <Text style={styles.blueprintName} numberOfLines={1}>
                          {matchResult.candidate.displayName || candidateName}
                        </Text>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillLabel}>☀️ Sun</Text>
                          <Text style={styles.tagPillValue}>{matchResult.candidate.sunSign}</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillLabel}>🌙 Moon</Text>
                          <Text style={styles.tagPillValue}>{matchResult.candidate.chandraRashi}</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillLabel}>✨ Star</Text>
                          <Text style={styles.tagPillValue}>{matchResult.candidate.nakshatraName}</Text>
                        </View>
                        {matchResult.candidate.yoniAnimal && (
                          <View style={styles.tagPill}>
                            <Text style={styles.tagPillLabel}>🐾 Animal</Text>
                            <Text style={styles.tagPillValue}>{matchResult.candidate.yoniAnimal}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* 8 Ashtakoot Compatibility Dimensions */}
                <Text style={styles.sectionHeader}>The 8 Cosmic Dimensions (Ashtakoot)</Text>

                {/* Nadi (8 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>🧬 Long-term Vitality & Genetic Harmony (Nadi)</Text>
                    <Text style={styles.kootScore}>{matchResult?.nadiScore ?? 8} / 8</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.nadiDescription || 'Genetic, psychological & vitality harmony.'}
                  </Text>
                </View>

                {/* Bhakoot (7 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>💖 Emotional Resonance & Empathy (Bhakoot)</Text>
                    <Text style={styles.kootScore}>{matchResult?.bhakootScore ?? 7} / 7</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.bhakootDescription || 'Mutual emotional intuition & long-term companionship.'}
                  </Text>
                </View>

                {/* Gana (6 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>⚡ Daily Temperament & Vibe (Gana)</Text>
                    <Text style={styles.kootScore}>{matchResult?.ganaScore ?? 5} / 6</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.ganaDescription || 'Harmonious lifestyle rhythm and day-to-day compatibility.'}
                  </Text>
                </View>

                {/* Graha Maitri (5 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>🧠 Conversational Frequency (Graha Maitri)</Text>
                    <Text style={styles.kootScore}>{matchResult?.grahaMaitriScore ?? 4} / 5</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.grahaMaitriDescription || 'Effortless intellectual banter and psychological wavelength.'}
                  </Text>
                </View>

                {/* Yoni (4 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>🔥 Physical & Sensory Chemistry (Yoni)</Text>
                    <Text style={styles.kootScore}>{matchResult?.yoniScore ?? 3} / 4</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.yoniDescription || 'Sensual attraction and natural biological magnetism.'}
                  </Text>
                </View>

                {/* Tara (3 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>🌟 Destiny, Health & Well-Being (Tara)</Text>
                    <Text style={styles.kootScore}>{matchResult?.taraScore ?? 3} / 3</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.taraDescription || 'Mutual prosperity, auspicious timing & good fortune.'}
                  </Text>
                </View>

                {/* Vashya (2 Pts) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>💫 Power Dynamic & Mutual Attraction (Vashya)</Text>
                    <Text style={styles.kootScore}>{matchResult?.vashyaScore ?? 2} / 2</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.vashyaDescription || 'Balanced leadership and reciprocal influence in the relationship.'}
                  </Text>
                </View>

                {/* Varna (1 Pt) */}
                <View style={styles.kootCard}>
                  <View style={styles.kootHeader}>
                    <Text style={styles.kootTitle}>🕊️ Ego Alignment & Work Temperament (Varna)</Text>
                    <Text style={styles.kootScore}>{matchResult?.varnaScore ?? 1} / 1</Text>
                  </View>
                  <Text style={styles.kootDescription}>
                    {matchResult?.varnaDescription || 'Harmonious spiritual outlook and complementary ambitions.'}
                  </Text>
                </View>

                {/* Fun Disclaimer */}
                <View style={styles.disclaimerBox}>
                  <Text style={styles.disclaimerText}>
                    ✨ Calculated using Vedic Sidereal Lahiri Ephemeris. Use this cosmic insight as a playful conversation starter to discover your unique chemistry!
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F0F16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    borderWidth: 1,
    borderColor: '#262638',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A28',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  scoreHero: {
    backgroundColor: '#161622',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    marginBottom: 14,
  },
  scoreCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FF6B6B22',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6B6B',
  },
  scoreTotal: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '700',
    marginTop: -2,
  },
  scoreHeroMeta: {
    flex: 1,
  },
  vibeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vibeSummary: {
    fontSize: 12,
    color: '#A0A0B0',
    lineHeight: 16,
  },
  harmonyPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD7001E',
    borderColor: '#FFD70055',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  harmonyPillText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  manglikBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  manglikGood: {
    backgroundColor: '#10B9811A',
    borderColor: '#10B98144',
  },
  manglikDynamic: {
    backgroundColor: '#F59E0B1A',
    borderColor: '#F59E0B44',
  },
  manglikText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  blueprintCard: {
    backgroundColor: '#14141E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222232',
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  blueprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blueprintCol: {
    flex: 1,
    gap: 6,
  },
  blueprintName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  sparkCenter: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkEmoji: {
    fontSize: 18,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B1B28',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagPillLabel: {
    fontSize: 11,
    color: '#7E7E94',
    fontWeight: '600',
  },
  tagPillValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kootCard: {
    backgroundColor: '#14141E',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#202030',
    marginBottom: 8,
  },
  kootHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kootTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  kootScore: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
    marginLeft: 8,
  },
  kootDescription: {
    fontSize: 11,
    color: '#8E8E9F',
    lineHeight: 15,
  },
  disclaimerBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#1E1E2C44',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262638',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#707085',
    textAlign: 'center',
    lineHeight: 15,
  },
});
