import React from 'react';
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

  const getActionTitle = () => {
    switch (actionType) {
      case 'PROPOSE':
        return `Before Proposing Date with ${partnerName}`;
      case 'ACCEPT':
        return `Before Accepting Date with ${partnerName}`;
      case 'POSTPONE':
      case 'RESCHEDULE':
        return `Before Rescheduling Date with ${partnerName}`;
      default:
        return 'SafeDate Venue & Safety Advisory';
    }
  };

  const getButtonText = () => {
    switch (actionType) {
      case 'PROPOSE':
        return 'Got It, Send Date Proposal 🚀';
      case 'ACCEPT':
        return 'Got It, Accept Date Safely 🥂';
      case 'POSTPONE':
      case 'RESCHEDULE':
        return 'Got It, Send New Plan ⏳';
      default:
        return 'I Understand, Proceed 🛡️';
    }
  };

  const handleConfirm = () => {
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
          {/* Top Amber Shield Badge */}
          <View style={styles.topBadgeRow}>
            <View style={styles.amberBadge}>
              <Text style={styles.amberBadgeIcon}>🛡️</Text>
              <Text style={styles.amberBadgeText}>SAFEDATE VENUE & SAFETY ADVISORY</Text>
            </View>
          </View>

          {/* Title & Context */}
          <Text style={styles.titleText}>{getActionTitle()}</Text>
          <Text style={styles.subtitleText}>
            Please review these 5 essential safety rules before booking or confirming an offline meetup.
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

          {/* 5 Core Safety Pillars */}
          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            
            {/* 1. Independent Venue */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🏛️</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Independent Venue • Zero Promotion</Text>
                <Text style={styles.ruleDesc}>
                  The meeting location is chosen independently by you and is not owned, inspected, or promoted by BlunderR.
                </Text>
              </View>
            </View>

            {/* 2. Public Places Only */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>👥</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Public Places Only • No Secret Spots</Text>
                <Text style={styles.ruleDesc}>
                  Always meet in busy, well-lit cafes or restaurants with people around. Never agree to private residences or secluded spots.
                </Text>
              </View>
            </View>

            {/* 3. Search & Verify First */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🔍</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Search Venue First on Maps</Text>
                <Text style={styles.ruleDesc}>
                  Look up the venue ratings, photos, and crowd vibe on Google Maps before stepping out.
                </Text>
              </View>
            </View>

            {/* 4. Keep Emergency Contact Informed */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🆘</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Inform Emergency Contact</Text>
                <Text style={styles.ruleDesc}>
                  Share your date venue, time, and live GPS location with a trusted friend via SafeDate Shield™.
                </Text>
              </View>
            </View>

            {/* 5. Bad Vibe = Don't Go / Leave */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Text style={styles.ruleIcon}>🚪</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Bad Vibe? Don't Go / Leave Anytime</Text>
                <Text style={styles.ruleDesc}>
                  If the place or vibe feels off or uncomfortable at any moment, leave or cancel immediately without hesitation.
                </Text>
              </View>
            </View>

            {/* Legal Liability Disclaimer Box */}
            <View style={styles.legalDisclaimerBox}>
              <Text style={styles.legalDisclaimerText}>
                ⚖️ <Text style={{ fontWeight: '800' }}>Legal Notice:</Text> Offline meetups are arranged at your own discretion. BlunderR assumes no liability for independent third-party venues or personal offline interactions.
              </Text>
            </View>
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
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>{getButtonText()}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  containerCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '86%',
    backgroundColor: '#0E111A',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  topBadgeRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  amberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  amberBadgeIcon: {
    fontSize: 12,
  },
  amberBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  venueHighlightBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
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
    maxHeight: 280,
    marginVertical: 4,
  },
  scrollContent: {
    paddingBottom: 4,
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
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
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  ruleDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  legalDisclaimerBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  legalDisclaimerText: {
    color: '#FDE68A',
    fontSize: 10.5,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#FF385C',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
