import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { hapticFeedback } from '@/utils/haptics';

export interface CounterProposalPayload {
  reason: string;
  newDate?: string;
  newTime?: string;
  newVenue?: string;
  note?: string;
  isStrictDecline?: boolean;
}

interface RescheduleDateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CounterProposalPayload) => void;
  proposerName?: string;
}

const PRESET_REASONS = [
  'Busy at this date/time (prior commitment)',
  'Prefer a quieter daytime coffee spot',
  'Would love to chat a bit more before meeting',
  'Location is a bit far for me',
];

const COUNTER_TIME_SLOTS = [
  '5:30 PM (Sunset Coffee ☕)',
  '7:00 PM (Dinner 🍽️)',
  '4:00 PM (Afternoon Tea 🫖)',
  '12:30 PM (Weekend Brunch 🥑)',
];

const COUNTER_VENUES = [
  'Blue Tokai Coffee, Indiranagar',
  'Third Wave Coffee, Koramangala',
  'Smoke House Deli, Lavelle Road',
  'Araku Coffee, 12th Main',
];

export default function RescheduleDateModal({
  visible,
  onClose,
  onSubmit,
  proposerName = 'your match',
}: RescheduleDateModalProps) {
  // Generate next 4 alternate days
  const alternateDays = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 2; i <= 6; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      list.push(`${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`);
    }
    return list;
  }, []);

  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [selectedNewDay, setSelectedNewDay] = useState<string>(alternateDays[0] || 'Sunday');
  const [selectedNewTime, setSelectedNewTime] = useState<string>(COUNTER_TIME_SLOTS[0]);
  const [selectedNewVenue, setSelectedNewVenue] = useState<string>(COUNTER_VENUES[0]);
  const [customNote, setCustomNote] = useState<string>('');

  const handleSendCounter = () => {
    hapticFeedback.medium();
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    onSubmit({
      reason: finalReason,
      newDate: selectedNewDay,
      newTime: selectedNewTime,
      newVenue: selectedNewVenue,
      note: customNote.trim(),
      isStrictDecline: false,
    });
  };

  const handleStrictDecline = () => {
    hapticFeedback.warning();
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    onSubmit({
      reason: finalReason,
      isStrictDecline: true,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeIcon}>💬</Text>
              <Text style={styles.headerBadgeText}>POLITE RESCHEDULE & COUNTER-OFFER</Text>
            </View>
            <Text style={styles.title}>Reschedule or Decline</Text>
            <Text style={styles.subtitle}>
              Clear reasons prevent ghosting & protect mutual chemistry. You can suggest an alternate time or spot!
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* 1. SELECT REASON */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>1. SELECT REASON</Text>
              <View style={styles.reasonList}>
                {PRESET_REASONS.map((r, idx) => {
                  const isSelected = selectedReason === r;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.reasonCard,
                        isSelected && styles.reasonCardSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedReason(r);
                      }}>
                      <Text style={styles.radioIcon}>
                        {isSelected ? '🔘' : '⚪'}
                      </Text>
                      <Text
                        style={[
                          styles.reasonText,
                          isSelected && styles.reasonTextSelected,
                        ]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.customReasonInput}
                placeholder="Or type custom reason (optional)..."
                placeholderTextColor="#64748B"
                value={customReason}
                onChangeText={setCustomReason}
              />
            </View>

            {/* 2. SUGGEST ALTERNATE PLAN */}
            <View style={styles.counterBox}>
              <View style={styles.counterHeaderRow}>
                <Text style={styles.counterHeaderTitle}>
                  💡 SUGGEST ALTERNATE DATE / TIME
                </Text>
                <Text style={styles.counterHeaderBadge}>Keeps spark alive</Text>
              </View>

              <Text style={styles.counterSubLabel}>Alternate Day:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}>
                {alternateDays.map((day, idx) => {
                  const isSelected = selectedNewDay === day;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.altChip,
                        isSelected && styles.altChipSelected,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedNewDay(day);
                      }}>
                      <Text
                        style={[
                          styles.altChipText,
                          isSelected && styles.altChipTextSelected,
                        ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.counterSubLabel, { marginTop: 10 }]}>
                Preferred Time:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}>
                {COUNTER_TIME_SLOTS.map((slot, idx) => {
                  const isSelected = selectedNewTime === slot;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.altChip,
                        isSelected && styles.altChipSelected,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedNewTime(slot);
                      }}>
                      <Text
                        style={[
                          styles.altChipText,
                          isSelected && styles.altChipTextSelected,
                        ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.counterSubLabel, { marginTop: 10 }]}>
                Preferred Venue:
              </Text>
              <View style={styles.venueColumn}>
                {COUNTER_VENUES.map((v, idx) => {
                  const isSelected = selectedNewVenue === v;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.venueRow,
                        isSelected && styles.venueRowSelected,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedNewVenue(v);
                      }}>
                      <Text style={{ fontSize: 13 }}>
                        {isSelected ? '☕' : '📍'}
                      </Text>
                      <Text
                        style={[
                          styles.venueRowText,
                          isSelected && styles.venueRowTextSelected,
                        ]}>
                        {v}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={[styles.customReasonInput, { marginTop: 8 }]}
                placeholder={`Sweet note to ${proposerName} (optional)...`}
                placeholderTextColor="#64748B"
                value={customNote}
                onChangeText={setCustomNote}
              />
            </View>

            {/* BUTTONS */}
            <TouchableOpacity
              style={styles.proposeAltBtn}
              activeOpacity={0.85}
              onPress={handleSendCounter}>
              <Text style={styles.proposeAltBtnText}>
                Propose Alternate Plan to {proposerName} ➔
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.strictDeclineBtn}
              activeOpacity={0.8}
              onPress={handleStrictDecline}>
              <Text style={styles.strictDeclineBtnText}>
                Decline Without Rescheduling
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={onClose}>
              <Text style={styles.cancelLinkText}>Back to Chat</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A0D18',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    marginBottom: 14,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  headerBadgeIcon: {
    fontSize: 12,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  reasonList: {
    gap: 6,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reasonCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  radioIcon: {
    fontSize: 14,
  },
  reasonText: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#FCD34D',
    fontWeight: '700',
  },
  customReasonInput: {
    backgroundColor: '#111526',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
  },
  counterBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  counterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FCD34D',
    letterSpacing: 0.6,
  },
  counterHeaderBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  counterSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  chipsRow: {
    gap: 6,
    paddingBottom: 2,
  },
  altChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#0F1322',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  altChipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#FCD34D',
  },
  altChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  altChipTextSelected: {
    color: '#0A0D18',
  },
  venueColumn: {
    gap: 6,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 9,
    borderRadius: 12,
    backgroundColor: '#0F1322',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  venueRowSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  venueRowText: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
  },
  venueRowTextSelected: {
    color: '#FCD34D',
    fontWeight: '700',
  },
  proposeAltBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  proposeAltBtnText: {
    color: '#0A0D18',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  strictDeclineBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  strictDeclineBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelLink: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelLinkText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
