import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { AppNotification } from '@/types';
import {
  dismissNotificationsForMatch,
  dismissAllSystemNotifications,
} from '@/services/notifications';
import { BackArrowIcon } from '@/components/chat-icons';
import { hapticFeedback } from '@/utils/haptics';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReportAction, setSelectedReportAction] = useState<{
    title: string;
    body: string;
    action?: string;
    adminMessage?: string;
    reportedUserName?: string;
    resolvedAt?: string;
  } | null>(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [list, count] = await Promise.all([
        api.getNotifications(unreadOnly, 0, 50),
        api.getUnreadNotificationCount(),
      ]);
      // Never show chat message history in notification feed once read
      const cleanList = (list || []).filter((n) => n.type !== 'CHAT' || !n.isRead);
      setNotifications(cleanList);
      setUnreadCount(count);
    } catch (err) {
      console.warn('[NotificationsScreen] Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      await dismissAllSystemNotifications();
      // All notifications vanish
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleNotificationPress = async (item: AppNotification) => {
    const data = item.data;

    // Vanish from system tray
    if (data?.matchId) {
      dismissNotificationsForMatch(String(data.matchId)).catch(() => {});
      api.markMatchNotificationsAsRead(String(data.matchId)).catch(() => {});
    }

    // Vanish from notification list
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    if (!item.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
      api.markNotificationAsRead(item.id).catch(() => {});
    }

    // Deep link routing
    if (data?.url) {
      router.push(data.url as any);
      return;
    }

    if (item.type === 'REPORT_ACTION' || data?.type === 'REPORT_ACTION' || data?.action) {
      let parsedData: any = data;
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch {}
      }
      setSelectedReportAction({
        title: item.title,
        body: item.body,
        action: parsedData?.action || 'RESOLVED',
        adminMessage: parsedData?.adminMessage || item.body,
        reportedUserName: parsedData?.reportedUserName || 'Reported Member',
        resolvedAt: parsedData?.resolvedAt || item.createdAt,
      });
      return;
    }

    if (item.type === 'MATCH' || data?.type === 'MATCH') {
      router.push('/(tabs)/matches');
    } else if (item.type === 'LIKE' || data?.type === 'LIKE') {
      router.push('/(tabs)/matches');
    } else if (
      item.type === 'CHAT' ||
      item.type === 'CHAT_UNLOCKED' ||
      data?.type === 'CHAT' ||
      data?.type === 'CHAT_UNLOCKED'
    ) {
      if (data?.matchId) {
        router.push(`/chat/${data.matchId}` as any);
      } else {
        router.push('/(tabs)/matches');
      }
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  const formatTimestamp = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MATCH':
        return { icon: '❤️', bg: 'rgba(233, 64, 87, 0.15)', border: '#E94057' };
      case 'LIKE':
        return { icon: '💖', bg: 'rgba(244, 63, 94, 0.15)', border: '#F43F5E' };
      case 'CHAT':
        return { icon: '💬', bg: 'rgba(124, 58, 237, 0.15)', border: '#7C3AED' };
      case 'CHAT_UNLOCKED':
        return { icon: '⚡', bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' };
      case 'REPORT_ACTION':
        return { icon: '🛡️', bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981' };
      case 'OFFER':
        return { icon: '🎁', bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' };
      default:
        return { icon: '🔔', bg: 'rgba(13, 148, 136, 0.15)', border: '#0D9488' };
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const styling = getTypeIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}>
        {/* Left icon badge */}
        <View
          style={[
            styles.typeIconBox,
            { backgroundColor: styling.bg, borderColor: styling.border },
          ]}>
          <Text style={styles.typeIconText}>{styling.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, !item.isRead && styles.titleTextUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.headerRightWrap}>
              <Text style={styles.timeText}>{formatTimestamp(item.createdAt)}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
          </View>

          <Text style={styles.bodyText} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        {/* Delete action */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            hapticFeedback.light();
            router.back();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back">
          <BackArrowIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.markAllBtn, unreadCount === 0 && styles.markAllBtnDisabled]}
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0}>
          <Text style={[styles.markAllBtnText, unreadCount === 0 && styles.markAllBtnTextDisabled]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterPill, unreadOnly && styles.filterPillActive]}
          onPress={() => setUnreadOnly(true)}>
          <Text style={[styles.filterPillText, unreadOnly && styles.filterPillTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, !unreadOnly && styles.filterPillActive]}
          onPress={() => setUnreadOnly(false)}>
          <Text style={[styles.filterPillText, !unreadOnly && styles.filterPillTextActive]}>
            All History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E94057" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyListContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor="#E94057"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySubtitle}>
                {unreadOnly
                  ? 'No unread notifications right now.'
                  : 'Matches, icebreaker unlocks, and messages will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Safety Report Action Modal */}
      <Modal
        visible={!!selectedReportAction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReportAction(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalShieldIcon}>
                <Text style={{ fontSize: 24 }}>🛡️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Trust & Safety Update</Text>
                <Text style={styles.modalSubtitle}>Report Enforcement Notice</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedReportAction(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBadgeRow}>
              <View style={styles.modalActionPill}>
                <Text style={styles.modalActionPillText}>
                  {selectedReportAction?.action?.replace('_', ' ') || 'ACTION TAKEN'}
                </Text>
              </View>
              {selectedReportAction?.reportedUserName ? (
                <Text style={styles.modalTargetName}>
                  Profile: <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{selectedReportAction.reportedUserName}</Text>
                </Text>
              ) : null}
            </View>

            <View style={styles.modalMessageBox}>
              <Text style={styles.modalMessageLabel}>MESSAGE FROM TRUST & SAFETY TEAM:</Text>
              <Text style={styles.modalMessageText}>
                {selectedReportAction?.adminMessage || selectedReportAction?.body}
              </Text>
            </View>

            <View style={styles.modalFooterNote}>
              <Text style={styles.modalFooterNoteText}>
                BlunderR is committed to 100% human-verified and safe connections. Thank you for helping keep our community respectful and secure.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              activeOpacity={0.8}
              onPress={() => setSelectedReportAction(null)}>
              <Text style={styles.modalDoneBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#20222B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181A24',
    borderWidth: 1,
    borderColor: '#282C3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  unreadBadge: {
    backgroundColor: '#E94057',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(233, 64, 87, 0.1)',
  },
  markAllBtnDisabled: {
    backgroundColor: 'transparent',
  },
  markAllBtnText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllBtnTextDisabled: {
    color: '#555A6E',
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1C24',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: '#252936',
  },
  filterPillActive: {
    backgroundColor: '#E94057',
    borderColor: '#E94057',
  },
  filterPillText: {
    color: '#8A90A2',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14161F',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222533',
  },
  unreadCard: {
    backgroundColor: '#191C29',
    borderColor: 'rgba(233, 64, 87, 0.4)',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIconText: {
    fontSize: 20,
  },
  contentWrap: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleText: {
    color: '#D8DCE8',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  titleTextUnread: {
    color: '#FFF',
    fontWeight: '800',
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#6F7487',
    fontSize: 11,
    fontWeight: '500',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E94057',
  },
  bodyText: {
    color: '#9096AA',
    fontSize: 12.5,
    lineHeight: 17,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#555A6E',
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8A90A2',
    fontSize: 13,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#767C92',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161822',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalShieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#8E94A8',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseX: {
    color: '#8E94A8',
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  modalActionPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalActionPillText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modalTargetName: {
    color: '#A0A6BE',
    fontSize: 12,
  },
  modalMessageBox: {
    backgroundColor: '#0E1018',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF385C',
    padding: 14,
    marginBottom: 14,
  },
  modalMessageLabel: {
    color: '#FF6B8B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalMessageText: {
    color: '#F1F5F9',
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalFooterNote: {
    marginBottom: 18,
  },
  modalFooterNoteText: {
    color: '#6F7487',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  modalDoneBtn: {
    backgroundColor: '#FF385C',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
