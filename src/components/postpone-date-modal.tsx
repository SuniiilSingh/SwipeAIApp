import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

export interface PostponeDatePayload {
  reason: string;
  newDate: string;
  newTime: string;
  newTimeVibe: string;
  note: string;
}

interface PostponeDateModalProps {
  visible: boolean;
  onClose: () => void;
  candidateName: string;
  currentDate?: string;
  currentTime?: string;
  currentVenue?: string;
  onSubmitPostpone: (payload: PostponeDatePayload) => void;
  isSubmitting?: boolean;
}

const POSTPONE_REASONS = [
  { id: 'schedule', label: '🗓️ Schedule Conflict' },
  { id: 'work', label: '💼 Work Emergency' },
  { id: 'health', label: '🤒 Feeling Unwell' },
  { id: 'travel', label: '🚗 Travel / Urgent Commute' },
];

export default function PostponeDateModal({
  visible,
  onClose,
  candidateName,
  currentDate = 'Upcoming Date',
  currentTime = '7:30 PM',
  currentVenue = 'SafeDate Hub',
  onSubmitPostpone,
  isSubmitting = false,
}: PostponeDateModalProps) {
  // Generate smart daytime and evening reschedule presets
  const reschedulePresets = useMemo(() => {
    const presets: { dayLabel: string; time: string; vibe: string; isDaytime: boolean; fullDate: string }[] = [];
    const now = new Date();
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Find next Saturday and Sunday
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayOfWeek = d.getDay();
      const dateStr = `${dayNames[dayOfWeek]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;

      if (dayOfWeek === 6) {
        // Saturday
        presets.push({
          dayLabel: `SAT BRUNCH 🥐`,
          time: '11:30 AM',
          vibe: 'Brunch & Artisanal Coffee 🥐',
          isDaytime: true,
          fullDate: dateStr,
        });
        presets.push({
          dayLabel: `SAT DINNER 🍸`,
          time: '8:00 PM',
          vibe: 'Dinner & Cocktails 🍸',
          isDaytime: false,
          fullDate: dateStr,
        });
      } else if (dayOfWeek === 0) {
        // Sunday
        presets.push({
          dayLabel: `SUN LUNCH 🥗`,
          time: '12:30 PM',
          vibe: 'Weekend Lunch 🥗',
          isDaytime: true,
          fullDate: dateStr,
        });
        presets.push({
          dayLabel: `SUN SUNSET 🌇`,
          time: '5:30 PM',
          vibe: 'Sunset Rooftop Chai 🌇',
          isDaytime: false,
          fullDate: dateStr,
        });
      }
    }

    // Fallback if today is weekend
    if (presets.length === 0) {
      presets.push(
        { dayLabel: 'TOM BRUNCH 🥐', time: '11:30 AM', vibe: 'Brunch 🥐', isDaytime: true, fullDate: 'Tomorrow' },
        { dayLabel: 'TOM DINNER 🍸', time: '8:00 PM', vibe: 'Dinner 🍸', isDaytime: false, fullDate: 'Tomorrow' }
      );
    }
    return presets;
  }, []);

  const [selectedReason, setSelectedReason] = useState<string>(POSTPONE_REASONS[0].label);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [note, setNote] = useState<string>(
    'Really sorry for the short notice! Can we do Saturday Brunch at 11:30 AM? Coffee is on me 🥐'
  );

  const handleSubmit = () => {
    hapticFeedback.success();
    const preset = reschedulePresets[selectedPresetIdx] || reschedulePresets[0];
    onSubmitPostpone({
      reason: selectedReason,
      newDate: preset.fullDate,
      newTime: preset.time,
      newTimeVibe: preset.vibe,
      note: note.trim(),
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
        <View
          style={styles.sheet}
          onStartShouldSetResponder={() => true}>
          {/* Sheet Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔄 POSTPONE / RESCHEDULE</Text>
            </View>
            <Text style={styles.title}>Postpone Date with {candidateName}</Text>
            <Text style={styles.subtitle}>
              Life happens! Send a polite counter-offer to reschedule. Your Rule of 5 slot remains safe and active.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Current Planned Date Snapshot */}
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>CURRENT CONFIRMED DATE</Text>
              <Text style={styles.currentDetails}>
                📅 {currentDate} • ⏰ {currentTime}
              </Text>
              <Text style={styles.currentVenue}>📍 {currentVenue}</Text>
            </View>

            {/* Step 1: Reason Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>1. SELECT REASON</Text>
              <View style={styles.reasonGrid}>
                {POSTPONE_REASONS.map((r) => {
                  const isSelected = selectedReason === r.label;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reasonChip,
                        isSelected && styles.reasonChipSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedReason(r.label);
                      }}>
                      <Text
                        style={[
                          styles.reasonText,
                          isSelected && styles.reasonTextSelected,
                        ]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: New Proposed Day & Time */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>2. PROPOSE NEW DAY & TIME</Text>
                <Text style={styles.sectionPill}>
                  {reschedulePresets[selectedPresetIdx]?.time || '11:30 AM'}
                </Text>
              </View>
              <View style={styles.presetGrid}>
                {reschedulePresets.map((preset, idx) => {
                  const isSelected = selectedPresetIdx === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetCard,
                        isSelected && (preset.isDaytime ? styles.presetCardSelectedDay : styles.presetCardSelectedEve),
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedPresetIdx(idx);
                        if (preset.isDaytime) {
                          setNote(`Really sorry for the short notice! Can we do ${preset.dayLabel.includes('SUN') ? 'Sunday' : 'Saturday'} Brunch at ${preset.time}? Coffee is on me 🥐`);
                        } else {
                          setNote(`Really sorry for the short notice! Can we do ${preset.dayLabel.includes('SUN') ? 'Sunday' : 'Saturday'} Evening at ${preset.time}? Drinks are on me 🍸`);
                        }
                      }}>
                      <View style={styles.presetHeader}>
                        <Text
                          style={[
                            styles.presetTag,
                            preset.isDaytime ? styles.presetTagDay : styles.presetTagEve,
                          ]}>
                          {preset.dayLabel}
                        </Text>
                        {isSelected && <Text style={styles.presetCheck}>✓</Text>}
                      </View>
                      <Text style={styles.presetTime}>{preset.time}</Text>
                      <Text style={styles.presetVibe} numberOfLines={1}>
                        {preset.vibe}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 3: Polite Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>3. POLITE NOTE TO {candidateName.toUpperCase()}</Text>
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={3}
                placeholder="Write a polite note explaining the reschedule..."
                placeholderTextColor="#64748B"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}>
              {isSubmitting ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.submitBtnText}>
                  Send Reschedule Request ➔
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Keep Current Planned Date</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A0D18',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
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
  currentCard: {
    backgroundColor: '#111526',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  currentDetails: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  currentVenue: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    width: '48%',
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reasonChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#F59E0B',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  reasonTextSelected: {
    color: '#FCD34D',
    fontWeight: '800',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 10,
  },
  presetCardSelectedDay: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#F59E0B',
  },
  presetCardSelectedEve: {
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderColor: '#FF385C',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  presetTagDay: {
    color: '#F59E0B',
  },
  presetTagEve: {
    color: '#FDA4AF',
  },
  presetCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  presetTime: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  presetVibe: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  noteInput: {
    backgroundColor: '#111526',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
