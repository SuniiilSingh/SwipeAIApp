import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { api, normalizeImageUrl } from '@/services/api';
import { BlockedUserItem } from '@/types';
import { MODEL_ASSETS, resolveImageSource } from '@/constants/assets';
import { hapticFeedback } from '@/utils/haptics';

type FilterTab = 'ALL' | 'BLOCKED' | 'REPORTED';

export default function BlockedProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [items, setItems] = useState<BlockedUserItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getBlockedAndReportedUsers();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.warn('Failed to load blocked profiles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUnblock = (item: BlockedUserItem) => {
    hapticFeedback.warning();
    Alert.alert(
      `Unblock ${item.displayName}?`,
      `If you blocked or reported ${item.displayName} by mistake, unblocking will allow this profile to reappear in discovery and allow interactions again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Unblock',
          style: 'destructive',
          onPress: async () => {
            setUnblockingId(item.targetUserId);
            hapticFeedback.medium();
            const success = await api.unblockUser(item.targetUserId);
            setUnblockingId(null);
            if (success) {
              hapticFeedback.success();
              setItems((prev) => prev.filter((u) => u.targetUserId !== item.targetUserId));
              Alert.alert('Profile Unblocked', `${item.displayName} has been unblocked.`);
            } else {
              Alert.alert('Error', 'Could not unblock user. Please check your connection and try again.');
            }
          },
        },
      ]
    );
  };

  const blockedList = items.filter((i) => i.type === 'BLOCKED' || i.type === 'REPORTED_AND_BLOCKED');
  const reportedList = items.filter((i) => i.type === 'REPORTED' || i.type === 'REPORTED_AND_BLOCKED');

  const filteredItems =
    activeTab === 'BLOCKED'
      ? blockedList
      : activeTab === 'REPORTED'
      ? reportedList
      : items;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            hapticFeedback.light();
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Blocked & Reported Profiles</Text>
          <Text style={styles.headerSub}>Dedicated Safety & Moderation Hub</Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('ALL');
          }}>
          <Text style={[styles.tabBtnText, activeTab === 'ALL' && styles.tabBtnTextActive]}>
            All ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'BLOCKED' && styles.tabBtnActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('BLOCKED');
          }}>
          <Text style={[styles.tabBtnText, activeTab === 'BLOCKED' && styles.tabBtnTextActive]}>
            🚫 Blocked ({blockedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'REPORTED' && styles.tabBtnActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('REPORTED');
          }}>
          <Text style={[styles.tabBtnText, activeTab === 'REPORTED' && styles.tabBtnTextActive]}>
            🚨 Reported ({reportedList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Safety Notice Strip */}
      <View style={styles.safetyNoticeBar}>
        <Text style={styles.safetyNoticeIcon}>🛡️</Text>
        <Text style={styles.safetyNoticeText}>
          Profiles you block or report are permanently removed from your feed. You can review admin actions taken below, or unblock anytime if action was taken by mistake.
        </Text>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
          <Text style={styles.loadingText}>Loading your blocked & reported records...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF385C"
              colors={['#FF385C']}
            />
          }>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIconEmoji}>🛡️</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'BLOCKED'
                  ? 'Zero Blocked Profiles'
                  : activeTab === 'REPORTED'
                  ? 'Zero Reported Profiles'
                  : 'Zero Blocked or Reported Accounts'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'BLOCKED'
                  ? 'You have not blocked any profiles. If you block someone, they will appear here.'
                  : activeTab === 'REPORTED'
                  ? 'You have not reported any profiles to Trust & Safety moderation.'
                  : 'Your discovery deck and chat lounge are 100% clean and active!'}
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const isReported = item.type === 'REPORTED' || item.type === 'REPORTED_AND_BLOCKED';
              const isBlocked = item.type === 'BLOCKED' || item.type === 'REPORTED_AND_BLOCKED';
              const isThisUnblocking = unblockingId === item.targetUserId;

              return (
                <View key={item.targetUserId} style={styles.profileCard}>
                  {/* Top Profile Summary */}
                  <View style={styles.cardHeaderRow}>
                    <ExpoImage
                      source={resolveImageSource(normalizeImageUrl(item.photoUrl), MODEL_ASSETS.defaultAvatar)}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                    <View style={styles.profileInfoBox}>
                      <View style={styles.nameRow}>
                        <Text style={styles.displayName}>
                          {item.displayName}, {item.age || 25}
                        </Text>
                        <View style={styles.verifiedCheckBadge}>
                          <Text style={styles.verifiedCheckText}>✓</Text>
                        </View>
                      </View>
                      <Text style={styles.cityText}>📍 {item.city || 'Bangalore, India'}</Text>

                      {/* Type Badge */}
                      <View style={styles.badgeRow}>
                        {isReported && (
                          <View style={styles.reportedBadge}>
                            <Text style={styles.reportedBadgeText}>🚨 REPORTED</Text>
                          </View>
                        )}
                        {isBlocked && (
                          <View style={styles.blockedBadge}>
                            <Text style={styles.blockedBadgeText}>🚫 BLOCKED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Reason & Remarks Section */}
                  <View style={styles.detailsBox}>
                    <View style={styles.reasonRow}>
                      <Text style={styles.detailLabel}>PRIMARY REASON:</Text>
                      <Text style={styles.detailValue}>
                        {item.reason || 'Safety & Community Guidelines'}
                      </Text>
                    </View>

                    {item.remarks ? (
                      <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>YOUR REMARKS TO ADMIN:</Text>
                        <Text style={styles.remarksText}>"{item.remarks}"</Text>
                      </View>
                    ) : null}

                    {item.createdAt ? (
                      <Text style={styles.timestampText}>
                        Logged on: {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    ) : null}
                  </View>

                  {/* Admin Action Taken & Review Status */}
                  {isReported ? (
                    <View style={styles.adminActionCard}>
                      <View style={styles.adminActionHeader}>
                        <Text style={styles.adminActionIcon}>🛡️</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.adminActionTitle}>
                            {item.adminActionStatus === 'UNDER_REVIEW'
                              ? 'Investigation Underway'
                              : 'Admin Action Taken & Resolved'}
                          </Text>
                          <Text style={styles.adminActionSub}>BlunderR Trust & Safety Moderation</Text>
                        </View>
                        <View
                          style={[
                            styles.adminStatusPill,
                            item.adminActionStatus === 'UNDER_REVIEW'
                              ? styles.adminStatusPillReview
                              : styles.adminStatusPillResolved,
                          ]}>
                          <Text
                            style={[
                              styles.adminStatusPillText,
                              item.adminActionStatus === 'UNDER_REVIEW'
                                ? styles.adminStatusPillTextReview
                                : styles.adminStatusPillTextResolved,
                            ]}>
                            {item.adminActionStatus === 'UNDER_REVIEW' ? 'Under Review' : 'Action Taken ✓'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.adminMessageBox}>
                        <Text style={styles.adminMessageText}>
                          {item.adminActionMessage ||
                            'Our moderation team reviewed your report. The reported profile was evaluated against community standards and appropriate restrictions were applied.'}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Action Controls */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[styles.unblockBtn, isThisUnblocking && { opacity: 0.6 }]}
                      onPress={() => handleUnblock(item)}
                      disabled={isThisUnblocking}
                      activeOpacity={0.85}>
                      {isThisUnblocking ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.unblockBtnIcon}>🔓</Text>
                          <Text style={styles.unblockBtnText}>
                            Unblock Profile (Restore to Feed)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1D27',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    color: '#FF385C',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  headerRightSpacer: {
    width: 38,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161922',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#141721',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderColor: '#FF385C',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FF758F',
    fontWeight: '800',
  },
  safetyNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 10,
  },
  safetyNoticeIcon: {
    fontSize: 16,
  },
  safetyNoticeText: {
    flex: 1,
    color: '#A7F3D0',
    fontSize: 11,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyIconEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  profileCard: {
    backgroundColor: '#12151F',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E2230',
  },
  profileInfoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  verifiedCheckBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckText: {
    color: '#08080E',
    fontSize: 10,
    fontWeight: '900',
  },
  cityText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  reportedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  reportedBadgeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  blockedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  blockedBadgeText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsBox: {
    backgroundColor: '#181C28',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  remarksBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  remarksLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  remarksText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontStyle: 'italic',
  },
  timestampText: {
    color: '#64748B',
    fontSize: 11,
  },
  adminActionCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 8,
  },
  adminActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminActionIcon: {
    fontSize: 16,
  },
  adminActionTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '800',
  },
  adminActionSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  adminStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminStatusPillResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  adminStatusPillReview: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  adminStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adminStatusPillTextResolved: {
    color: '#34D399',
  },
  adminStatusPillTextReview: {
    color: '#FCD34D',
  },
  adminMessageBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
  },
  adminMessageText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  unblockBtnIcon: {
    fontSize: 14,
  },
  unblockBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
