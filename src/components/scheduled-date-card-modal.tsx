import React from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { hapticFeedback } from '@/utils/haptics';
import { normalizeImageUrl } from '@/services/api';
import { DateProposalData } from '@/components/date-proposal-bubble';

interface ScheduledDateCardModalProps {
  visible: boolean;
  onClose: () => void;
  candidateName: string;
  candidatePhoto?: string;
  dateData: DateProposalData | null;
  onOpenSafetyGuidelines?: () => void;
  onPostponePress?: () => void;
  onCancelPress?: () => void;
}

const { width } = Dimensions.get('window');

export default function ScheduledDateCardModal({
  visible,
  onClose,
  candidateName,
  candidatePhoto,
  dateData,
  onOpenSafetyGuidelines,
  onPostponePress,
  onCancelPress,
}: ScheduledDateCardModalProps) {
  if (!visible) return null;

  const rawDate = dateData?.date || '';
  const displayDate = (!rawDate || rawDate.toLowerCase().includes('invalid')) ? 'Tomorrow' : rawDate;
  const rawTime = dateData?.time || '';
  const displayTime = (!rawTime || rawTime.toLowerCase().includes('invalid')) ? '7:30 PM' : rawTime;
  const displayVenue = dateData?.venue || 'Verified SafeDate Partner Spot';

  const handleOpenMaps = () => {
    hapticFeedback.light();
    const query = encodeURIComponent(displayVenue);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
  };

  const handleAddToCalendar = () => {
    hapticFeedback.success();
    // Try opening google calendar web event creation or native prompt
    const title = encodeURIComponent(`Date with ${candidateName} ☕ BlunderR`);
    const details = encodeURIComponent(
      `Real date planned via BlunderR SafeDate Shield™.\nVenue: ${displayVenue}\nTime: ${displayDate} at ${displayTime}`
    );
    const location = encodeURIComponent(displayVenue);
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    Linking.openURL(calUrl).catch(() => {
      Alert.alert('Date Scheduled', `Date with ${candidateName} at ${displayVenue} on ${displayDate} at ${displayTime}`);
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Drag Indicator */}
          <View style={styles.dragPill} />

          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🥂 DATE CONFIRMED</Text>
              </View>
              <Text style={styles.headerTitle}>Scheduled Date Card</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                onClose();
              }}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Couple / Candidate Avatar Showcase */}
            <View style={styles.candidateRow}>
              {candidatePhoto ? (
                <ExpoImage
                  source={{ uri: normalizeImageUrl(candidatePhoto) }}
                  style={styles.candidateAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.candidateAvatar, styles.avatarPlaceholder]}>
                  <Text style={{ fontSize: 24 }}>✨</Text>
                </View>
              )}
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>Date with {candidateName}</Text>
                <Text style={styles.candidateSub}>100% 3D Biometric Verified Partner</Text>
              </View>
            </View>

            {/* Date & Time Highlights */}
            <View style={styles.sectionCard}>
              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Text style={styles.detailEmoji}>📅</Text>
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>DATE</Text>
                  <Text style={styles.detailValue}>{displayDate}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                  <Text style={styles.detailEmoji}>⏰</Text>
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>TIME & VIBE</Text>
                  <Text style={styles.detailValue}>
                    {displayTime} {dateData?.timeVibe ? `• ${dateData.timeVibe}` : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Venue Card */}
            <View style={styles.sectionCard}>
              <View style={styles.detailRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#FF385C22' }]}>
                  <Text style={styles.detailEmoji}>📍</Text>
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>CONFIRMED VENUE</Text>
                  <Text style={styles.detailValue}>{displayVenue}</Text>
                  <Text style={styles.venueTag}>Verified SafeDate Partner Spot</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={handleOpenMaps}
                activeOpacity={0.8}>
                <Text style={styles.directionsBtnText}>📍 Open in Maps / Directions ›</Text>
              </TouchableOpacity>
            </View>

            {/* Note / Plan Message if present */}
            {dateData?.note ? (
              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>DATE NOTE</Text>
                <Text style={styles.noteText}>"{dateData.note}"</Text>
              </View>
            ) : null}

            {/* SafeDate Shield Protocol Banner */}
            <View style={styles.shieldCard}>
              <View style={styles.shieldHeaderRow}>
                <Text style={styles.shieldIcon}>🛡️</Text>
                <Text style={styles.shieldTitle}>SafeDate Shield™ Protection Active</Text>
              </View>
              <View style={styles.shieldBullets}>
                <Text style={styles.shieldBullet}>
                  • <Text style={styles.boldWhite}>Rule of 5 Slot Freed:</Text> Your active chat slot is unlocked! You can continue exploring without ghosting limits.
                </Text>
                <Text style={styles.shieldBullet}>
                  • <Text style={styles.boldWhite}>Private SafePin:</Text> A 4-digit code will appear in chat 2 hours prior to meet-up for check-in verification.
                </Text>
                <Text style={styles.shieldBullet}>
                  • <Text style={styles.boldWhite}>Emergency SOS:</Text> 1-tap discrete assistance and trusted friend live location sharing available in Shield 360 menu.
                </Text>
              </View>
            </View>

            {/* Postpone & Cancel Date Management Row */}
            <View style={styles.manageDateSection}>
              <Text style={styles.manageDateLabel}>DATE MANAGEMENT</Text>
              <View style={styles.manageDateRow}>
                <TouchableOpacity
                  style={styles.postponeBtn}
                  onPress={() => {
                    hapticFeedback.light();
                    onPostponePress?.();
                  }}
                  activeOpacity={0.85}>
                  <Text style={styles.postponeBtnText}>🔄 Postpone Date</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelDateBtn}
                  onPress={() => {
                    hapticFeedback.light();
                    onCancelPress?.();
                  }}
                  activeOpacity={0.85}>
                  <Text style={styles.cancelDateBtnText}>⚠️ Cancel Date</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.calendarBtn}
                onPress={handleAddToCalendar}
                activeOpacity={0.85}>
                <Text style={styles.calendarBtnText}>📅 Add to Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  hapticFeedback.light();
                  onClose();
                }}
                activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Back to Chat</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    backgroundColor: '#12141A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
  },
  dragPill: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 14,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C24',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2D3A',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  candidateName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  candidateSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#181A22',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailEmoji: {
    fontSize: 19,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  venueTag: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  directionsBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.3)',
  },
  directionsBtnText: {
    color: '#FF758F',
    fontSize: 13,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: '#1E222D',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF385C',
  },
  noteLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  noteText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontStyle: 'italic',
  },
  shieldCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  shieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shieldIcon: {
    fontSize: 17,
    marginRight: 8,
  },
  shieldTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shieldBullets: {
    gap: 6,
  },
  shieldBullet: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  manageDateSection: {
    backgroundColor: '#181A22',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  manageDateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  manageDateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  postponeBtn: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postponeBtnText: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelDateBtn: {
    flex: 1,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.5)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDateBtnText: {
    color: '#FDA4AF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  calendarBtn: {
    flex: 1,
    backgroundColor: '#FF385C',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
