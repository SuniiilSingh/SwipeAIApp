import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { hapticFeedback } from '@/utils/haptics';
import { LIVING_OPTIONS, SMOKING_OPTIONS, DRINKING_OPTIONS, VACATION_OPTIONS } from '@/constants/profile-presets';
import { LivingStatus, UserProfile } from '@/types';
import { useThemedStyles } from '@/context/theme-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LifestyleSyncModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  onSave: (updates: {
    livingStatus?: LivingStatus;
    drinkingHabit?: string;
    smokingHabit?: string;
    vacationPreference?: string;
  }) => Promise<void> | void;
}

export const LifestyleSyncModal: React.FC<LifestyleSyncModalProps> = ({
  visible,
  onClose,
  userProfile,
  onSave,
}) => {
  const styles = useThemedStyles(baseStyles);
  const [selectedLiving, setSelectedLiving] = useState<LivingStatus | undefined>(userProfile?.livingStatus);
  const [selectedDrinking, setSelectedDrinking] = useState<string>(userProfile?.drinkingHabit || '');
  const [selectedSmoking, setSelectedSmoking] = useState<string>(userProfile?.smokingHabit || '');
  const [selectedVacation, setSelectedVacation] = useState<string>(userProfile?.vacationPreference || '');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userProfile) {
      setSelectedLiving(userProfile.livingStatus);
      setSelectedDrinking(userProfile.drinkingHabit || '');
      setSelectedSmoking(userProfile.smokingHabit || '');
      setSelectedVacation(userProfile.vacationPreference || '');
    }
  }, [visible, userProfile]);

  const showToast = (text: string) => {
    setSavedNotification(text);
    setTimeout(() => {
      setSavedNotification((current) => (current === text ? null : current));
    }, 2200);
  };

  const handleSelectLiving = (key: LivingStatus) => {
    hapticFeedback.selection();
    setSelectedLiving(key);
    onSave({ livingStatus: key });
    showToast('🏡 Living situation updated!');
  };

  const handleSelectDrinking = (label: string) => {
    hapticFeedback.selection();
    setSelectedDrinking(label);
    onSave({ drinkingHabit: label });
    showToast('🍷 Drinking habit saved!');
  };

  const handleSelectSmoking = (label: string) => {
    hapticFeedback.selection();
    setSelectedSmoking(label);
    onSave({ smokingHabit: label });
    showToast('🚭 Smoking habit saved!');
  };

  const handleSelectVacation = (label: string) => {
    hapticFeedback.selection();
    setSelectedVacation(label);
    onSave({ vacationPreference: label });
    showToast('✈️ Vacation vibe saved!');
  };

  // Calculate live filled traits
  const filledCount =
    (selectedLiving ? 1 : 0) +
    (selectedDrinking ? 1 : 0) +
    (selectedSmoking ? 1 : 0) +
    (selectedVacation ? 1 : 0);

  const reachMultiplier =
    filledCount === 4 ? '3.8x VIP Spotlight' : filledCount >= 2 ? '2.4x High Intent' : '1.5x Multiplier';

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>⚡ PROFILE REACH: {reachMultiplier}</Text>
              </View>
              <Text style={styles.headerTitle}>🌿 Smart Lifestyle & Living Sync</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubtitle}>
            1-tap your lifestyle harmony. Instant compatibility matching with verified candidates.
          </Text>

          {/* Quick Toast Feedback */}
          {savedNotification ? (
            <View style={styles.toastBanner}>
              <Text style={styles.toastText}>{savedNotification} 🔥</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Section 1: Living Situation */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🏡 Living Situation</Text>
                {selectedLiving ? <Text style={styles.syncedCheck}>✓ Synced</Text> : null}
              </View>
              <View style={styles.chipsWrap}>
                {LIVING_OPTIONS.map((opt) => {
                  const isSelected = selectedLiving === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      activeOpacity={0.75}
                      onPress={() => handleSelectLiving(opt.key)}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {opt.emoji} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Vacation Vibe */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>✈️ Vacation Vibe</Text>
                {selectedVacation ? <Text style={styles.syncedCheck}>✓ Synced</Text> : null}
              </View>
              <View style={styles.chipsWrap}>
                {VACATION_OPTIONS.map((opt) => {
                  const isSelected =
                    selectedVacation === opt.label ||
                    (opt.key === 'MOUNTAINS' && selectedVacation.includes('Mountains')) ||
                    (opt.key === 'BEACHES' && selectedVacation.includes('Beaches')) ||
                    (opt.key === 'BOTH' && selectedVacation.includes('Both'));
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      activeOpacity={0.75}
                      onPress={() => handleSelectVacation(opt.label)}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {opt.emoji} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Social Drinking */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🍷 Drinking Habit</Text>
                {selectedDrinking ? <Text style={styles.syncedCheck}>✓ Synced</Text> : null}
              </View>
              <View style={styles.chipsWrap}>
                {DRINKING_OPTIONS.map((opt) => {
                  const isSelected =
                    selectedDrinking === opt.label ||
                    selectedDrinking.toLowerCase().includes(opt.key.toLowerCase().replace('_', ' '));
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      activeOpacity={0.75}
                      onPress={() => handleSelectDrinking(opt.label)}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {opt.emoji} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Smoking Habit */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🚭 Smoking Habit</Text>
                {selectedSmoking ? <Text style={styles.syncedCheck}>✓ Synced</Text> : null}
              </View>
              <View style={styles.chipsWrap}>
                {SMOKING_OPTIONS.map((opt) => {
                  const isSelected =
                    selectedSmoking === opt.label ||
                    selectedSmoking.toLowerCase().includes(opt.key.toLowerCase().replace('_', ' '));
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      activeOpacity={0.75}
                      onPress={() => handleSelectSmoking(opt.label)}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {opt.emoji} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            activeOpacity={0.85}
            onPress={() => {
              hapticFeedback.success();
              onClose();
            }}>
            <Text style={styles.doneBtnText}>Done & Save Lifestyle Profile ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const baseStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F121A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgePillText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8E94A5',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toastBanner: {
    backgroundColor: 'rgba(46, 213, 115, 0.18)',
    borderColor: '#2ED573',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  toastText: {
    color: '#2ED573',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    maxHeight: SCREEN_HEIGHT * 0.56,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 16,
  },
  sectionBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  syncedCheck: {
    color: '#2ED573',
    fontSize: 11,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipPillActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
    borderColor: '#FF385C',
  },
  chipText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FF385C',
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#FF385C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
