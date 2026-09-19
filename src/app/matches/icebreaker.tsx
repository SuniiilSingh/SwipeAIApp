import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services/api';
import { IcebreakerQuiz, MatchItem } from '@/types';

export default function IcebreakerScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchItem | null>(null);
  const [quiz, setQuiz] = useState<IcebreakerQuiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wingmanSparks, setWingmanSparks] = useState<string[]>([]);

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  const loadMatchData = async () => {
    if (!matchId) return;
    setLoading(true);
    const m = await api.getMatchDetails(matchId);
    setMatch(m);
    if (m) {
      setQuiz(m.icebreakerQuiz || null);

      if (m.icebreakerQuiz?.isCompleted) {
        setIsAnswered(true);
        setSelectedOption(m.icebreakerQuiz.userAAnswer ?? 0);
        const sparksRes = await api.getWingmanSparks(matchId);
        setWingmanSparks(sparksRes.sparks || []);
      }
    }
    setLoading(false);
  };

  const handleSelectOption = async (index: number) => {
    if (isAnswered || !matchId) return;
    setSelectedOption(index);
    setLoading(true);
    const res = await api.answerIcebreaker(matchId, index);
    setIsAnswered(true);
    setWingmanSparks(res.wingmanSparks || []);
    setLoading(false);
  };

  const handleStartChat = (initialSpark?: string) => {
    if (!match) return;
    router.replace({
      pathname: '/chat/[id]',
      params: {
        id: match.id,
        name: match.otherUserName,
        ...(initialSpark ? { initialText: initialSpark } : {}),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E94057" />
        <Text style={styles.loadingText}>Syncing 10s Icebreaker Quiz...</Text>
      </SafeAreaView>
    );
  }

  if (!match || !quiz) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Match or quiz not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.matchHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.timerChip}>
            <Text style={styles.timerChipText}>⏳ {match.remainingHours}h remaining</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.heroBox}>
          <Text style={styles.vibeEmoji}>⚡</Text>
          <Text style={styles.heroTitle}>Match Icebreaker Lounge</Text>
          <Text style={styles.heroSubtitle}>
            Unlock text chat with {match.otherUserName} by answering this 10-second rapid-fire quiz.
          </Text>
        </View>

        {/* Quiz Card */}
        <View style={styles.quizCard}>
          <View style={styles.quizBadgeRow}>
            <Text style={styles.quizBadge}>{quiz.title.toUpperCase()}</Text>
          </View>
          <Text style={styles.questionText}>"{quiz.question}"</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {quiz.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => handleSelectOption(idx)}
                  disabled={isAnswered}>
                  <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                    <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Mutual Agreement Reveal */}
          {isAnswered && (
            <View style={styles.revealBanner}>
              <Text style={styles.revealTitle}>🎉 Both of you answered!</Text>
              <Text style={styles.revealDesc}>
                {quiz.wingmanRecommendation || 'Great common ground! Chat lounge is now unlocked.'}
              </Text>
            </View>
          )}
        </View>

        {/* =========================================================================
            AI WINGMAN CONVERSATIONAL SPARKS (COMMENTED OUT AS OF NOW)
            Replaced by Alternative 1: Mutual Chemistry Sparks Engine
           =========================================================================
        {isAnswered && wingmanSparks.length > 0 && (
          <View style={styles.wingmanCard}>
            <View style={styles.wingmanHeader}>
              <Text style={styles.wingmanTitle}>🤖 AI Wingman Conversational Sparks</Text>
              <Text style={styles.wingmanTag}>Hinglish & English</Text>
            </View>
            <Text style={styles.wingmanSubtitle}>
              Tap any non-creepy spark to automatically copy into chat:
            </Text>

            <View style={styles.sparksList}>
              {wingmanSparks.map((spark, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sparkItem}
                  onPress={() => {
                    Alert.alert('Spark Selected ✨', `"${spark}"\n\nOpening chat lounge with this message!`, [
                      { text: 'Start Chat', onPress: handleStartChat },
                    ]);
                  }}>
                  <Text style={styles.sparkText}>"{spark}"</Text>
                  <Text style={styles.sparkUseLabel}>Use this →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        */}

        {/* Alternative 1: Mutual Chemistry Sparks */}
        {isAnswered && wingmanSparks.length > 0 && (
          <View style={styles.mutualSparksCard}>
            <View style={styles.mutualSparksHeader}>
              <View style={styles.mutualSparksTitleRow}>
                <Text style={styles.mutualSparksTitle}>✨ Mutual Chemistry Sparks</Text>
                <View style={styles.matchGroundBadge}>
                  <Text style={styles.matchGroundBadgeText}>100% Real Match Ground</Text>
                </View>
              </View>
              <Text style={styles.mutualSparksSubtitle}>
                Personalized conversation starters based on your real overlapping lifestyle, diet & interests:
              </Text>
            </View>

            <View style={styles.sparksList}>
              {wingmanSparks.map((spark, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.mutualSparkItem}
                  onPress={() => {
                    handleStartChat(spark);
                  }}>
                  <Text style={styles.sparkText}>"{spark}"</Text>
                  <View style={styles.sparkBottomRow}>
                    <Text style={styles.sparkCategoryHint}>
                      {spark.startsWith('⚡') ? 'Quiz Consensus' : (spark.startsWith('☕') || spark.startsWith('🚴') || spark.startsWith('🎨') || spark.startsWith('📚') || spark.startsWith('🎯') ? 'Shared Interest' : (spark.startsWith('🥗') || spark.startsWith('🍗') || spark.startsWith('🍳') || spark.startsWith('🏠') || spark.startsWith('🏖️') ? 'Lifestyle Fit' : 'Mutual Spark'))}
                    </Text>
                    <View style={styles.useThisBtn}>
                      <Text style={styles.useThisBtnText}>Send in Chat 💬</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Button */}
        {isAnswered && (
          <TouchableOpacity style={styles.startChatBtn} onPress={() => handleStartChat()}>
            <Text style={styles.startChatBtnText}>Start Chat with {match.otherUserName} 💬</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  center: {
    flex: 1,
    backgroundColor: '#0E0F13',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#9E9EA7',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#242734',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#CACDD8',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backArrow: {
    color: '#E94057',
    fontSize: 14,
    fontWeight: '700',
  },
  timerChip: {
    backgroundColor: 'rgba(242, 113, 33, 0.15)',
    borderWidth: 1,
    borderColor: '#F27121',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timerChipText: {
    color: '#F27121',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  vibeEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#8E94A5',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  quizCard: {
    backgroundColor: '#181920',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#262934',
    marginTop: 16,
  },
  quizBadgeRow: {
    marginBottom: 8,
  },
  quizBadge: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222530',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#303444',
  },
  optionBtnSelected: {
    borderColor: '#E94057',
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
  },
  optionRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2F3342',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionRadioSelected: {
    backgroundColor: '#E94057',
  },
  optionLetter: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    color: '#CACDD8',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  revealBanner: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  revealTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '800',
  },
  revealDesc: {
    color: '#D0EBD2',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  wingmanCard: {
    backgroundColor: '#1E1928',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D2D52',
    marginTop: 16,
  },
  wingmanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wingmanTitle: {
    color: '#FF70A6',
    fontSize: 14,
    fontWeight: '800',
  },
  wingmanTag: {
    color: '#E0AAFF',
    fontSize: 10,
    fontWeight: '700',
  },
  wingmanSubtitle: {
    color: '#B8A4C9',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  sparksList: {
    gap: 10,
  },
  sparkItem: {
    backgroundColor: '#2A2038',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#423059',
  },
  sparkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sparkUseLabel: {
    color: '#FF70A6',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
  startChatBtn: {
    backgroundColor: '#E94057',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  startChatBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  mutualSparksCard: {
    backgroundColor: '#161922',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#2D344B',
    marginTop: 18,
  },
  mutualSparksHeader: {
    marginBottom: 14,
  },
  mutualSparksTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  mutualSparksTitle: {
    color: '#FFB703',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  matchGroundBadge: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    borderWidth: 1,
    borderColor: '#FFB703',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchGroundBadgeText: {
    color: '#FFB703',
    fontSize: 10,
    fontWeight: '800',
  },
  mutualSparksSubtitle: {
    color: '#A0A7BC',
    fontSize: 12,
    lineHeight: 16,
  },
  mutualSparkItem: {
    backgroundColor: '#1E2230',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E354B',
  },
  sparkBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#282E42',
  },
  sparkCategoryHint: {
    color: '#8E96AF',
    fontSize: 11,
    fontWeight: '700',
  },
  useThisBtn: {
    backgroundColor: '#E94057',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  useThisBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
