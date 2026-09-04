import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { CandidateCard, MatchItem } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<CandidateCard | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    const list = await api.getMatches();
    setMatches(list);
    setLoading(false);
  };

  const getCandidateProfile = (item: MatchItem): CandidateCard => {
    if (item.otherProfile) return item.otherProfile;
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
      bio: 'High-intent match on SwipeAI. Unlocked 48h ephemeral chat lounge.',
      occupation: 'Professional',
      company: 'Bengaluru Tech',
      education: 'Bachelors Degree',
      height: 175,
      relationshipIntent: 'Long-term partner',
      interests: 'Coffee, Music, Reading, Travel, Foodie',
      photos: [item.otherUserPhoto],
    };
  };

  const renderMatchItem = ({ item }: { item: MatchItem }) => {
    const isPending = item.status === 'PENDING_ICEBREAKER';

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => {
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
          onPress={() => setSelectedCandidateForProfile(getCandidateProfile(item))}>
          <Image source={{ uri: item.otherUserPhoto }} style={styles.avatar} />
          {item.isDigilockerVerified && (
            <View style={styles.goldBadgeDot}>
              <Text style={styles.goldBadgeDotText}>🛡️</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.matchName}>{item.otherUserName}, {item.otherUserAge}</Text>
            <View style={[styles.timerBadge, isPending && styles.timerBadgePending]}>
              <Text style={[styles.timerText, isPending && styles.timerTextPending]}>
                ⏳ {item.remainingHours}h remaining
              </Text>
            </View>
          </View>

          {isPending ? (
            <View style={styles.quizUnlockRow}>
              <Text style={styles.quizPrompt}>⚡ 10s Rapid-Fire Quiz Required</Text>
              <Text style={styles.quizSub}>Answer 1 quick question to unlock chat lounge</Text>
            </View>
          ) : (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'Chat lounge unlocked! Say hi 👋'}
            </Text>
          )}

          <TouchableOpacity
            style={styles.viewProfileChip}
            onPress={() => setSelectedCandidateForProfile(getCandidateProfile(item))}>
            <Text style={styles.viewProfileChipText}>👤 View Full Profile & Details →</Text>
          </TouchableOpacity>
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
        <View>
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
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Full Profile Viewer Modal */}
      <ProfileDetailModal
        visible={!!selectedCandidateForProfile}
        candidate={selectedCandidateForProfile}
        onClose={() => setSelectedCandidateForProfile(null)}
        onStartChat={() => {
          const current = selectedCandidateForProfile;
          setSelectedCandidateForProfile(null);
          const m = matches.find(x => x.otherUserId === current?.userId);
          if (m) {
            if (m.status === 'PENDING_ICEBREAKER') {
              router.push({
                pathname: '/matches/icebreaker',
                params: { matchId: m.id },
              });
            } else {
              router.push({
                pathname: '/chat/[id]',
                params: { id: m.id, name: m.otherUserName },
              });
            }
          }
        }}
        onVirtualChai={() => {
          const current = selectedCandidateForProfile;
          setSelectedCandidateForProfile(null);
          const m = matches.find(x => x.otherUserId === current?.userId);
          if (m) {
            router.push({
              pathname: '/chat/[id]',
              params: { id: m.id, name: m.otherUserName },
            });
          }
        }}
      />
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
    backgroundColor: '#242734',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timerBadgePending: {
    backgroundColor: 'rgba(242, 113, 33, 0.15)',
    borderWidth: 1,
    borderColor: '#F27121',
  },
  timerText: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '600',
  },
  timerTextPending: {
    color: '#F27121',
    fontWeight: '700',
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
});
