import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

interface CancelDateModalProps {
  visible: boolean;
  onClose: () => void;
  candidateName: string;
  currentDate?: string;
  currentTime?: string;
  currentVenue?: string;
  onConfirmCancel: (reason: string, note: string) => void;
  isSubmitting?: boolean;
}

const CANCEL_REASONS = [
  { id: 'emergency', label: '🚨 Sudden Personal Emergency' },
  { id: 'illness', label: '🤒 Health / Illness' },
  { id: 'work', label: '💼 Unavoidable Work / Urgent Travel' },
  { id: 'respectful', label: '🕊️ Personal Decision / Respectful Exit' },
];

export default function CancelDateModal({
  visible,
  onClose,
  candidateName,
  currentDate = 'Upcoming Date',
  currentTime = '7:30 PM',
  currentVenue = 'SafeDate Hub',
  onConfirmCancel,
  isSubmitting = false,
}: CancelDateModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0].label);
  const [note, setNote] = useState<string>(
    'I sincerely apologize, but I will not be able to make it to our date due to an emergency. Wishing you all the best.'
  );

  const handleConfirm = () => {
    hapticFeedback.warning();
    onConfirmCancel(selectedReason, note.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
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
                <Text style={styles.badgeText}>⚠️ CANCEL DATE</Text>
              </View>
              <Text style={styles.title}>Cancel Date with {candidateName}</Text>
              <Text style={styles.subtitle}>
                Cancelling is handled with respect. Your partner will be notified gracefully, and your Rule of 5 slot will be safely freed up.
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
            {/* Current Planned Date Snapshot */}
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>CURRENT PLANNED DATE</Text>
              <Text style={styles.currentDetails}>
                📅 {currentDate} • ⏰ {currentTime}
              </Text>
              <Text style={styles.currentVenue}>📍 {currentVenue}</Text>
            </View>

            {/* Step 1: Select Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SELECT CANCELLATION REASON</Text>
              <View style={styles.reasonList}>
                {CANCEL_REASONS.map((r) => {
                  const isSelected = selectedReason === r.label;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reasonItem,
                        isSelected && styles.reasonItemSelected,
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
                      {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Polite Note to Partner */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>POLITE NOTE TO {candidateName.toUpperCase()}</Text>
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={3}
                placeholder="A polite note preserves karma and respect..."
                placeholderTextColor="#64748B"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* SafeDate Policy Highlight */}
            <View style={styles.policyCard}>
              <Text style={styles.policyIcon}>🛡️</Text>
              <Text style={styles.policyText}>
                Active Rule-of-5 Slot Freed: Because this is handled respectfully in advance, neither user is penalized for ghosting.
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.cancelBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={isSubmitting}
              activeOpacity={0.85}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.cancelBtnText}>
                  Confirm Date Cancellation
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepBtn}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.keepBtnText}>Keep Planned Date</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A0D18',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
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
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F43F5E',
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
    color: '#FDA4AF',
    fontWeight: '600',
    marginTop: 2,
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
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reasonItemSelected: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: '#F43F5E',
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  reasonTextSelected: {
    color: '#FECDD3',
    fontWeight: '800',
  },
  checkIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F43F5E',
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
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  policyIcon: {
    fontSize: 18,
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: '#6EE7B7',
    lineHeight: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  keepBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  keepBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
