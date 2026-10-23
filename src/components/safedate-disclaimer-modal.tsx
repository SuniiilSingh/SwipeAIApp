import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemedStyles } from '@/context/theme-context';
import { hapticFeedback } from '@/utils/haptics';

export interface SafeDateDisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: 'PROPOSE' | 'ACCEPT' | 'POSTPONE' | 'RESCHEDULE';
  venueName?: string;
  partnerName?: string;
  dateTimeText?: string;
}

export default function SafeDateDisclaimerModal({
  visible,
  onClose,
  onConfirm,
  actionType,
  venueName,
  partnerName = 'your match',
  dateTimeText,
}: SafeDateDisclaimerModalProps) {
  const styles = useThemedStyles(baseStyles);
  const [hasAgreed, setHasAgreed] = useState(false);

  const getActionTitle = () => {
    switch (actionType) {
      case 'PROPOSE':
        return `⚠️ MANDATORY WARNING BEFORE PROPOSING`;
      case 'ACCEPT':
        return `⚠️ CRITICAL WARNING BEFORE ACCEPTING`;
      case 'POSTPONE':
      case 'RESCHEDULE':
        return `⚠️ MANDATORY WARNING BEFORE RESCHEDULING`;
      default:
        return '⚠️ CRITICAL SAFETY WARNING & VENUE DISCLAIMER';
    }
  };

  const getButtonText = () => {
    if (!hasAgreed) {
      return '🔒 Check the box above to continue';
    }
    switch (actionType) {
      case 'PROPOSE':
        return 'Send Proposal';
      case 'ACCEPT':
        return 'Confirm Date';
      case 'POSTPONE':
      case 'RESCHEDULE':
        return 'Send New Plan';
      default:
        return 'Confirm & Proceed';
    }
  };

  const handleConfirm = () => {
    if (!hasAgreed) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.success();
    onConfirm();
  };

  const handleCancel = () => {
    hapticFeedback.light();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.containerCard}>
          {/* Top Warning Amber Badge */}
          <View style={styles.topBadgeRow}>
            <View style={styles.amberBadge}>
              <Text style={styles.amberBadgeIcon}>⚠️</Text>
              <Text style={styles.amberBadgeText}>CRITICAL SAFETY WARNING & ZERO LIABILITY</Text>
            </View>
          </View>

          {/* Title & Warning Subtitle */}
          <Text style={styles.titleText}>{getActionTitle()}</Text>
          <Text style={styles.subtitleText}>
            Read these mandatory safety instructions carefully before meeting {partnerName} in person. Offline safety is 100% your responsibility.
          </Text>

          {/* Venue & Date Highlight Pill (if available) */}
          {(venueName || dateTimeText) && (
            <View style={styles.venueHighlightBox}>
              {venueName ? (
                <View style={styles.venueHighlightRow}>
                  <Text style={styles.highlightIcon}>📍</Text>
                  <Text style={styles.venueHighlightText} numberOfLines={1}>
                    {venueName}
                  </Text>
                </View>
              ) : null}
              {dateTimeText ? (
                <View style={styles.venueHighlightRow}>
                  <Text style={styles.highlightIcon}>⏰</Text>
                  <Text style={styles.dateHighlightText}>{dateTimeText}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* 5 Core Warning Pillars */}
          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            
            {/* 1. Independent Uncontrolled Venue */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🏛️</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>1. UNCONTROLLED THIRD-PARTY VENUE</Text>
                <Text style={styles.ruleDesc}>
                  This location is <Text style={styles.boldDesc}>NOT owned, inspected, monitored, or endorsed by BlunderR</Text>. We run zero promotions for third-party spots. You meet strictly at your own choice and risk.
                </Text>
              </View>
            </View>

            {/* 2. Public Places Only */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🚫</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>2. NEVER MEET IN PRIVATE OR HIDDEN SPOTS</Text>
                <Text style={styles.ruleDesc}>
                  Always meet in <Text style={styles.boldDesc}>busy, brightly lit public venues</Text> (cafes, open diners). <Text style={styles.boldDesc}>NEVER</Text> agree to private apartments, hotel rooms, deserted parking lots, or secluded places.
                </Text>
              </View>
            </View>

            {/* 3. Search & Verify First */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🔍</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>3. SEARCH & VERIFY ON GOOGLE MAPS FIRST</Text>
                <Text style={styles.ruleDesc}>
                  Check the venue on Google Maps, street view, and customer reviews before traveling. If a place looks shady, unknown, or lacks public reviews, <Text style={styles.boldDesc}>DO NOT GO</Text>.
                </Text>
              </View>
            </View>

            {/* 4. Keep Emergency Contact Informed */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🆘</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>4. INFORM EMERGENCY CONTACT (MANDATORY)</Text>
                <Text style={styles.ruleDesc}>
                  Always tell a close friend or family member where you are going, who you are meeting, and keep your <Text style={styles.boldDesc}>Live WhatsApp/Google GPS location sharing on</Text> for the date.
                </Text>
              </View>
            </View>

            {/* 5. Bad Vibe = Walk Away Immediately */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🛑</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>5. BAD VIBE? DO NOT GO — WALK AWAY IMMEDIATELY</Text>
                <Text style={styles.ruleDesc}>
                  If at <Text style={styles.boldDesc}>ANY second</Text> before or during the date you feel uncomfortable, pressured, or the vibe feels off, <Text style={styles.boldDesc}>CANCEL OR WALK OUT IMMEDIATELY</Text>. You owe no one an explanation.
                </Text>
              </View>
            </View>

            {/* Legal Liability Disclaimer Box */}
            <View style={styles.legalDisclaimerBox}>
              <Text style={styles.legalDisclaimerHeader}>⚖️ LEGAL DISCLAIMER & ZERO LIABILITY:</Text>
              <Text style={styles.legalDisclaimerText}>
                BlunderR assumes <Text style={styles.boldDesc}>NO responsibility or legal liability</Text> for any disputes, physical occurrences, safety incidents, or losses at third-party premises. Offline meetups are arranged strictly at your own personal risk.
              </Text>
            </View>

            {/* Style 3 Mandatory Checkbox */}
            <TouchableOpacity
              style={[styles.checkboxRow, hasAgreed && styles.checkboxRowActive]}
              activeOpacity={0.8}
              onPress={() => {
                hapticFeedback.light();
                setHasAgreed(!hasAgreed);
              }}>
              <View style={[styles.checkboxBox, hasAgreed && styles.checkboxBoxActive]}>
                {hasAgreed ? <Text style={styles.checkboxCheckmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabelText}>
                I confirm that I have read this safety warning, understand that BlunderR does not control or endorse this venue, and I accept personal responsibility.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !hasAgreed && styles.confirmBtnDisabled]}
              activeOpacity={0.85}
              disabled={!hasAgreed}
              onPress={handleConfirm}>
              <Text style={[styles.confirmBtnText, !hasAgreed && styles.confirmBtnTextDisabled]}>
                {getButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  containerCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    flexShrink: 1,
    backgroundColor: '#0E111A',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  topBadgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  amberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  amberBadgeIcon: {
    fontSize: 12,
  },
  amberBadgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitleText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  venueHighlightBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 4,
  },
  venueHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightIcon: {
    fontSize: 13,
  },
  venueHighlightText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  dateHighlightText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollArea: {
    maxHeight: 340,
    flexShrink: 1,
    marginVertical: 4,
  },
  scrollContent: {
    paddingBottom: 6,
    gap: 8,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 10,
  },
  ruleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleIcon: {
    fontSize: 14,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  ruleDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
  },
  boldDesc: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  legalDisclaimerBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
  },
  legalDisclaimerHeader: {
    color: '#FCA5A5',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  legalDisclaimerText: {
    color: '#FECACA',
    fontSize: 10,
    lineHeight: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  checkboxRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#F59E0B',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxBoxActive: {
    backgroundColor: '#F59E0B',
  },
  checkboxCheckmark: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxLabelText: {
    color: '#FDE68A',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(75, 85, 99, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.4)',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  confirmBtnTextDisabled: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
});
