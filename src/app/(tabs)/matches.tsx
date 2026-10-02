import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { CandidateCard, MatchItem, UserProfile } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import SubscriptionGatingModal, { GatingFeatureType } from '@/components/subscription-gating-modal';
import { hapticFeedback } from '@/utils/haptics';

export type MatchFilterType = 'ALL' | 'QUIZ' | 'EXPIRING' | 'ACTIVE';

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MatchFilterType>('ALL');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gatingModalVisible, setGatingModalVisible] = useState(false);
  const [gatingFeature, setGatingFeature] = useState<GatingFeatureType>('REVIVE');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    const [list, profile] = await Promise.all([
      api.getMatches(),
      api.getMyProfile().catch(() => null),
    ]);
    setMatches(list);
    if (profile) setUserProfile(profile);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const [list, profile] = await Promise.all([
      api.getMatches(),
      api.getMyProfile().catch(() => null),
    ]);
    setMatches(list);
    if (profile) setUserProfile(profile);
    setIsRefreshing(false);
  };

  const counts = useMemo(() => ({
    all: matches.length,
    quiz: matches.filter((m) => m.status === 'PENDING_ICEBREAKER' && !m.icebreakerQuiz?.hasAnswered && !m.icebreakerQuiz?.isCompleted).length,
    expiring: matches.filter((m) => m.remainingHours <= 24).length,
    active: matches.filter((m) => m.status === 'ACTIVE_CHAT' || m.icebreakerQuiz?.hasAnswered || m.icebreakerQuiz?.isCompleted).length,
  }), [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || (item.otherUserName && item.otherUserName.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      const isQuizPending = item.status === 'PENDING_ICEBREAKER' && !item.icebreakerQuiz?.hasAnswered && !item.icebreakerQuiz?.isCompleted;

      if (filterType === 'QUIZ') return isQuizPending;
      if (filterType === 'EXPIRING') return item.remainingHours <= 24;
      if (filterType === 'ACTIVE') return !isQuizPending;
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
      bio: 'High-intent match on Blunderr Dating. Unlocked 48h ephemeral chat lounge.',
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
          if (item.remainingHours <= 0 && !userProfile?.hasActivePass) {
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
            <View
              style={[
                styles.timerBadge,
                item.remainingHours <= 12
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
                  item.remainingHours <= 12
                    ? styles.timerTextUrgent
                    : item.remainingHours <= 24
                    ? styles.timerTextWarning
                    : isPending
                    ? styles.timerTextPending
                    : styles.timerTextNormal,
                ]}>
                ⏳ {item.remainingHours === 0 ? 'Expired' : `${item.remainingHours}h left`}
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
            onPress={() => setSelectedMatch(item)}>
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
            style={[styles.filterChip, filterType === 'ACTIVE' && styles.filterChipActive]}
            onPress={() => handleSelectFilter('ACTIVE')}
            activeOpacity={0.8}>
            <Text style={[styles.filterChipText, filterType === 'ACTIVE' && styles.filterChipTextActive]}>
              💬 Active Lounge ({counts.active})
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
        onStartChat={() => {
          if (!selectedMatch) return;
          const target = selectedMatch;
          setSelectedMatch(null);
          if (target.remainingHours <= 0 && !userProfile?.hasActivePass) {
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
});
