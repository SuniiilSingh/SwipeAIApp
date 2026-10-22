import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemedStyles } from '@/context/theme-context';

export interface DateProposalData {
  date: string;
  time: string;
  timeVibe?: string;
  venue: string;
  note?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'RESCHEDULED';
  reason?: string;
  newDate?: string;
  newTime?: string;
  newVenue?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

function sanitizeDateText(d?: string): string {
  if (!d) return 'Upcoming Date';
  const trimmed = String(d).trim();
  if (trimmed.toLowerCase().includes('invalid')) return 'Upcoming Date';
  return trimmed;
}

function sanitizeTimeText(t?: string): string {
  if (!t) return '7:30 PM';
  const trimmed = String(t).trim();
  if (trimmed.toLowerCase().includes('invalid')) return '7:30 PM';
  return trimmed;
}

export function parseDateProposal(content?: string): {
  type: 'PROPOSAL' | 'ACCEPTED' | 'RESCHEDULE' | 'DECLINED' | 'POSTPONE' | 'CANCELLED' | 'NONE';
  data: DateProposalData | null;
} {
  if (!content) return { type: 'NONE', data: null };

  if (content.startsWith('[BLUNDERR_DATE_PROPOSAL]')) {
    try {
      const jsonStr = content.replace('[BLUNDERR_DATE_PROPOSAL]', '').trim();
      return { type: 'PROPOSAL', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'NONE', data: null };
    }
  }

  if (content.startsWith('[BLUNDERR_DATE_ACCEPTED]')) {
    try {
      const jsonStr = content.replace('[BLUNDERR_DATE_ACCEPTED]', '').trim();
      return { type: 'ACCEPTED', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'NONE', data: null };
    }
  }

  if (content.startsWith('[BLUNDERR_DATE_POSTPONE]')) {
    try {
      const jsonStr = content.replace('[BLUNDERR_DATE_POSTPONE]', '').trim();
      return { type: 'POSTPONE', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'NONE', data: null };
    }
  }

  if (content.startsWith('[BLUNDERR_DATE_CANCELLED]')) {
    try {
      const jsonStr = content.replace('[BLUNDERR_DATE_CANCELLED]', '').trim();
      return { type: 'CANCELLED', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'NONE', data: null };
    }
  }

  if (content.startsWith('[BLUNDERR_DATE_RESCHEDULE]')) {
    try {
      const jsonStr = content.replace('[BLUNDERR_DATE_RESCHEDULE]', '').trim();
      return { type: 'RESCHEDULE', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'NONE', data: null };
    }
  }

  if (content.startsWith('[BLUNDERR_DATE_DECLINED]')) {
    try {
      const jsonStr = content.replace('[BLUNDERR_DATE_DECLINED]', '').trim();
      return { type: 'DECLINED', data: JSON.parse(jsonStr) };
    } catch {
      return { type: 'NONE', data: null };
    }
  }

  return { type: 'NONE', data: null };
}

interface DateProposalBubbleProps {
  type: 'PROPOSAL' | 'ACCEPTED' | 'RESCHEDULE' | 'DECLINED' | 'POSTPONE' | 'CANCELLED';
  data: DateProposalData;
  isFromMe: boolean;
  onAccept?: () => void;
  onReschedule?: () => void;
  onDecline?: () => void;
  onAcceptCounter?: () => void;
  onProposeNew?: () => void;
  onAcceptPostpone?: () => void;
  onProposePostponeOther?: () => void;
  partnerName?: string;
  isDateConfirmed?: boolean;
}

export default function DateProposalBubble({
  type,
  data,
  isFromMe,
  onAccept,
  onReschedule,
  onDecline,
  onAcceptCounter,
  onProposeNew,
  onAcceptPostpone,
  onProposePostponeOther,
  partnerName = 'your match',
  isDateConfirmed = false,
}: DateProposalBubbleProps) {
  const styles = useThemedStyles(baseStyles);
  // 1. ORIGINAL DATE PROPOSAL
  if (type === 'PROPOSAL') {
    return (
      <View style={styles.proposalCard}>
        {/* Top Header Ribbon */}
        <View style={styles.topRibbon}>
          <View style={styles.ribbonLeft}>
            <Text style={styles.ribbonIcon}>💌</Text>
            <View>
              <Text style={styles.ribbonTitle}>
                {isFromMe ? 'You Proposed a Real Date!' : 'Real Date Invitation!'}
              </Text>
              <Text style={styles.ribbonSub}>
                {isFromMe
                  ? `Sent to ${partnerName} with Flower Shower`
                  : `${partnerName} invited you out!`}
              </Text>
            </View>
          </View>
          <View style={styles.liveTag}>
            <Text style={styles.liveTagText}>SafeDate</Text>
          </View>
        </View>

        {/* Date Details Box */}
        <View style={styles.detailsBox}>
          <View style={styles.rowBetween}>
            <View style={styles.rowItem}>
              <Text style={styles.itemIcon}>📅</Text>
              <Text style={styles.itemBold}>{sanitizeDateText(data.date)}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.itemIcon}>⏰</Text>
              <Text style={[styles.itemBold, { color: '#FCD34D' }]}>
                {sanitizeTimeText(data.time)}
              </Text>
            </View>
          </View>

          <View style={styles.venueRow}>
            <Text style={styles.venueIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.venueName}>{data.venue || 'Confirmed SafeDate Venue'}</Text>
              <Text style={styles.venueSub}>Verified SafeDate Partner Hub</Text>
            </View>
          </View>

          {data.note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>"{data.note}"</Text>
            </View>
          ) : null}
        </View>

        {/* Action Controls */}
        {isDateConfirmed ? (
          <View style={styles.confirmedBadgeBar}>
            <Text style={styles.confirmedBadgeIcon}>🥂</Text>
            <Text style={styles.confirmedBadgeText}>
              Date Confirmed & Scheduled! Check Scheduled Date Card
            </Text>
          </View>
        ) : isFromMe ? (
          <View style={styles.pendingBar}>
            <Text style={styles.pendingDot}>⏳</Text>
            <Text style={styles.pendingText}>
              Waiting for {partnerName} to accept or reschedule...
            </Text>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.85}
              onPress={onAccept}>
              <Text style={styles.acceptBtnIcon}>💖</Text>
              <Text style={styles.acceptBtnText}>Accept Date Proposal</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rescheduleBtn}
                activeOpacity={0.8}
                onPress={onReschedule}>
                <Text style={styles.rescheduleBtnText}>
                  💬 Reschedule / Reason
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                activeOpacity={0.8}
                onPress={onDecline}>
                <Text style={styles.declineBtnText}>✖️ Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // 2. ACCEPTED CONFIRMATION
  if (type === 'ACCEPTED') {
    return (
      <View style={styles.confirmedCard}>
        <View style={styles.confirmedHeader}>
          <Text style={styles.confirmedIcon}>🥂</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.confirmedTag}>DATE OFFICIALLY CONFIRMED! ✨</Text>
            <Text style={styles.confirmedTitle}>
              {isFromMe ? `You accepted ${partnerName}'s date!` : `${partnerName} accepted your date!`}
            </Text>
          </View>
        </View>

        <View style={styles.confirmedDetails}>
          <Text style={styles.confirmedSummary}>
            📅 {sanitizeDateText(data.date)} • ⏰ {sanitizeTimeText(data.time)}
          </Text>
          <Text style={styles.confirmedVenue}>
            📍 {data.venue || 'Confirmed SafeDate Hub'}
          </Text>
        </View>

        <View style={styles.shieldNoteBox}>
          <Text style={styles.shieldNoteTitle}>🛡️ SafeDate Shield™ Activated</Text>
          <Text style={styles.shieldNoteSub}>
            Private Safe-Pin will be shared 2 hours before the date. Active Rule of 5 slot freed!
          </Text>
        </View>
      </View>
    );
  }

  // 3. COUNTER-PROPOSAL / RESCHEDULE
  if (type === 'RESCHEDULE') {
    return (
      <View style={styles.rescheduleCard}>
        <View style={styles.rescheduleHeader}>
          <Text style={styles.rescheduleIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rescheduleTitle}>
              {isFromMe
                ? 'You Suggested an Alternate Plan'
                : `${partnerName} Proposed a New Plan!`}
            </Text>
            <Text style={styles.rescheduleSub}>
              {isFromMe
                ? 'Counter-offer sent to partner'
                : `Couldn't make the initial time, but sent an alternative!`}
            </Text>
          </View>
        </View>

        {data.reason ? (
          <View style={styles.reasonDisplayBox}>
            <Text style={styles.reasonLabel}>REASON GIVEN:</Text>
            <Text style={styles.reasonContent}>
              "{data.reason}{data.note ? ` - ${data.note}` : ''}"
            </Text>
          </View>
        ) : null}

        <View style={styles.counterDetailsBox}>
          <Text style={styles.counterLabel}>SUGGESTED ALTERNATIVE:</Text>
          <Text style={styles.counterDetailsText}>
            📅 {sanitizeDateText(data.newDate || data.date)} • ⏰ {sanitizeTimeText(data.newTime || data.time)}
          </Text>
          <Text style={styles.counterVenueText}>
            📍 {data.newVenue || data.venue || 'Confirmed SafeDate Hub'}
          </Text>
        </View>

        {!isFromMe ? (
          isDateConfirmed ? (
            <View style={styles.confirmedBadgeBar}>
              <Text style={styles.confirmedBadgeIcon}>🥂</Text>
              <Text style={styles.confirmedBadgeText}>
                Date Confirmed & Scheduled! Check Scheduled Date Card
              </Text>
            </View>
          ) : (
            <View style={styles.counterActionRow}>
              <TouchableOpacity
                style={styles.acceptCounterBtn}
                activeOpacity={0.85}
                onPress={onAcceptCounter}>
                <Text style={styles.acceptCounterBtnText}>
                  ✓ Accept New Time
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.proposeNewBtn}
                activeOpacity={0.8}
                onPress={onProposeNew}>
                <Text style={styles.proposeNewBtnText}>
                  Propose Different
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : null}
      </View>
    );
  }

  // 4. DECLINED
  if (type === 'DECLINED') {
    return (
      <View style={styles.declinedCard}>
        <Text style={styles.declinedIcon}>🕊️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.declinedTitle}>
            {isFromMe ? 'You declined this date' : `${partnerName} couldn't make this date`}
          </Text>
          {data.reason ? (
            <Text style={styles.declinedReason}>Reason: "{data.reason}"</Text>
          ) : null}
          <Text style={styles.declinedSub}>
            You can continue chatting or propose another date anytime.
          </Text>
        </View>
      </View>
    );
  }

  // 5. POSTPONE / RESCHEDULE
  if (type === 'POSTPONE') {
    return (
      <View style={styles.postponeCard}>
        <View style={styles.postponeHeader}>
          <Text style={styles.postponeIcon}>🔄</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.postponeTopRow}>
              <Text style={styles.postponeTitle}>
                {isFromMe ? 'Reschedule Request Sent' : `${partnerName} Requested Reschedule`}
              </Text>
              <View style={styles.postponeTag}>
                <Text style={styles.postponeTagText}>
                  {isFromMe ? 'Pending' : 'Action Required'}
                </Text>
              </View>
            </View>
            <Text style={styles.postponeSub}>
              {isFromMe
                ? `Waiting for ${partnerName} to confirm or propose other`
                : `Suggested an alternative time for your planned date`}
            </Text>
          </View>
        </View>

        <View style={styles.postponeDetailsBox}>
          <Text style={styles.postponeDetailsLabel}>NEW PROPOSED TIME:</Text>
          <Text style={styles.postponeDetailsValue}>
            📅 {sanitizeDateText(data.newDate || data.date)} • ⏰ {sanitizeTimeText(data.newTime || data.time)}
          </Text>
          {data.venue ? (
            <Text style={styles.postponeVenueValue}>📍 {data.venue}</Text>
          ) : null}
        </View>

        {data.reason || data.note ? (
          <View style={styles.postponeNoteBox}>
            <Text style={styles.postponeNoteText}>
              {data.reason ? `Reason: ${data.reason}` : ''}
              {data.reason && data.note ? ' • ' : ''}
              {data.note ? `"${data.note}"` : ''}
            </Text>
          </View>
        ) : null}

        {!isFromMe ? (
          <View style={styles.postponeActionRow}>
            <TouchableOpacity
              style={styles.postponeAcceptBtn}
              activeOpacity={0.85}
              onPress={onAcceptPostpone}>
              <Text style={styles.postponeAcceptBtnText}>
                ✓ Accept New Time
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postponeOtherBtn}
              activeOpacity={0.8}
              onPress={onProposePostponeOther}>
              <Text style={styles.postponeOtherBtnText}>
                Propose Other
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  // 6. CANCELLED
  if (type === 'CANCELLED') {
    return (
      <View style={styles.cancelledCard}>
        <View style={styles.cancelledHeader}>
          <Text style={styles.cancelledIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.postponeTopRow}>
              <Text style={styles.cancelledTitle}>Date Gracefully Cancelled</Text>
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledBadgeText}>Closed</Text>
              </View>
            </View>
            <Text style={styles.cancelledSub}>
              {isFromMe
                ? 'You cancelled the upcoming date'
                : `${partnerName} had to cancel the upcoming date`}
            </Text>
          </View>
        </View>

        {data.reason || data.note ? (
          <View style={styles.cancelledReasonBox}>
            <Text style={styles.cancelledReasonText}>
              {data.reason ? `Reason: ${data.reason}` : ''}
              {data.reason && data.note ? ' • ' : ''}
              {data.note ? `"${data.note}"` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.cancelledShieldFooter}>
          <Text style={styles.cancelledShieldText}>
            🛡️ Active Rule-of-5 Slot Freed Up • Karma Preserved
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const baseStyles = StyleSheet.create({
  proposalCard: {
    backgroundColor: 'rgba(14, 18, 32, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    borderRadius: 24,
    padding: 14,
    marginVertical: 6,
    width: '92%',
    alignSelf: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  topRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ribbonIcon: {
    fontSize: 20,
  },
  ribbonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ribbonSub: {
    fontSize: 10,
    color: '#FDA4AF',
    marginTop: 1,
  },
  liveTag: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF385C',
    letterSpacing: 0.6,
  },
  detailsBox: {
    backgroundColor: '#0A0D18',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemIcon: {
    fontSize: 13,
  },
  itemBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  venueIcon: {
    fontSize: 13,
  },
  venueName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  venueSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  noteBox: {
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.18)',
  },
  noteText: {
    fontSize: 11,
    color: '#FFE4E6',
    fontStyle: 'italic',
  },
  pendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  confirmedBadgeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  confirmedBadgeIcon: {
    fontSize: 16,
  },
  confirmedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
    flex: 1,
  },
  pendingDot: {
    fontSize: 14,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCD34D',
    flex: 1,
  },
  actionContainer: {
    marginTop: 10,
    gap: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptBtnIcon: {
    fontSize: 15,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rescheduleBtn: {
    flex: 1.3,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rescheduleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  declineBtn: {
    flex: 0.9,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  declineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F87171',
  },

  // Confirmed Styles
  confirmedCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.35)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 24,
    padding: 14,
    marginVertical: 6,
    width: '92%',
    alignSelf: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  confirmedIcon: {
    fontSize: 24,
  },
  confirmedTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.6,
  },
  confirmedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  confirmedDetails: {
    backgroundColor: '#0A0D18',
    borderRadius: 14,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  confirmedSummary: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmedVenue: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  shieldNoteBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  shieldNoteTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  shieldNoteSub: {
    fontSize: 9,
    color: '#E2E8F0',
    marginTop: 2,
  },

  // Reschedule Card Styles
  rescheduleCard: {
    backgroundColor: 'rgba(45, 26, 10, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: 24,
    padding: 14,
    marginVertical: 6,
    width: '92%',
    alignSelf: 'center',
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rescheduleIcon: {
    fontSize: 20,
  },
  rescheduleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rescheduleSub: {
    fontSize: 10,
    color: '#FCD34D',
    marginTop: 1,
  },
  reasonDisplayBox: {
    backgroundColor: '#0A0D18',
    borderRadius: 12,
    padding: 9,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  reasonContent: {
    fontSize: 11,
    color: '#FCD34D',
    fontStyle: 'italic',
    marginTop: 2,
  },
  counterDetailsBox: {
    backgroundColor: '#0A0D18',
    borderRadius: 12,
    padding: 9,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  counterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  counterDetailsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  counterVenueText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  counterActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  acceptCounterBtn: {
    flex: 1.3,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptCounterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proposeNewBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proposeNewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },

  // Declined Styles
  declinedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 12,
    marginVertical: 4,
    width: '92%',
    alignSelf: 'center',
  },
  declinedIcon: {
    fontSize: 20,
  },
  declinedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  declinedReason: {
    fontSize: 11,
    color: '#F87171',
    marginTop: 1,
    fontStyle: 'italic',
  },
  declinedSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Postpone Card Styles
  postponeCard: {
    backgroundColor: 'rgba(18, 22, 34, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: 22,
    padding: 14,
    marginVertical: 6,
    width: '92%',
    alignSelf: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  postponeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  postponeIcon: {
    fontSize: 22,
  },
  postponeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postponeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FCD34D',
    flex: 1,
  },
  postponeTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  postponeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
  },
  postponeSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  postponeDetailsBox: {
    backgroundColor: '#0F1322',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  postponeDetailsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  postponeDetailsValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  postponeVenueValue: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
    marginTop: 2,
  },
  postponeNoteBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  postponeNoteText: {
    fontSize: 11,
    color: '#FDE68A',
    fontStyle: 'italic',
  },
  postponeActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  postponeAcceptBtn: {
    flex: 1.4,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postponeAcceptBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  postponeOtherBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postponeOtherBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },

  // Cancelled Card Styles
  cancelledCard: {
    backgroundColor: 'rgba(28, 16, 24, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.45)',
    borderRadius: 20,
    padding: 12,
    marginVertical: 6,
    width: '92%',
    alignSelf: 'center',
  },
  cancelledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cancelledIcon: {
    fontSize: 22,
  },
  cancelledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDA4AF',
    flex: 1,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  cancelledBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FECDD3',
  },
  cancelledSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  cancelledReasonBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 10,
    padding: 8,
    marginVertical: 6,
  },
  cancelledReasonText: {
    fontSize: 11,
    color: '#FECDD3',
  },
  cancelledShieldFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  cancelledShieldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
});
