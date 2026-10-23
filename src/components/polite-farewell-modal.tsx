import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemedStyles } from '@/context/theme-context';
import { hapticFeedback } from '@/utils/haptics';

export interface PoliteFarewellModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (farewellMessage: string) => Promise<void> | void;
  partnerName?: string;
  isSubmitting?: boolean;
}

const FAREWELL_TEMPLATES = [
  {
    id: 'timing',
    emoji: '✨',
    title: 'Timing Didn’t Align',
    text: "Hey! Really enjoyed chatting with you, but looks like our timing didn't align. Wishing you the absolute best on here!",
  },
  {
    id: 'different_paths',
    emoji: '🥂',
    title: 'Different Directions',
    text: 'Thank you for the warm conversation! We might be heading in different directions, but take care and stay safe!',
  },
  {
    id: 'warm_wishes',
    emoji: '🌸',
    title: 'Warm Wishes',
    text: 'Loved connecting with you! Wishing you all the genuine happiness on your dating journey. Bye for now!',
  },
];

export default function PoliteFarewellModal({
  visible,
  onClose,
  onConfirm,
  partnerName = 'your match',
  isSubmitting = false,
}: PoliteFarewellModalProps) {
  const styles = useThemedStyles(baseStyles);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customText, setCustomText] = useState(FAREWELL_TEMPLATES[0].text);

  const handleSelectTemplate = (index: number) => {
    hapticFeedback.light();
    setSelectedTemplateIndex(index);
    setCustomText(FAREWELL_TEMPLATES[index].text);
  };

  const handleConfirm = () => {
    hapticFeedback.warning();
    onConfirm(customText.trim() || FAREWELL_TEMPLATES[0].text);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.containerCard}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.doveBadge}>
              <Text style={styles.doveBadgeIcon}>🕊️</Text>
              <Text style={styles.doveBadgeText}>ZERO-GHOSTING POLITE FAREWELL</Text>
            </View>
          </View>

          <Text style={styles.titleText}>Part Ways with Respect</Text>
          <Text style={styles.subtitleText}>
            Send a graceful final note to {partnerName}. This cleanly archives the chat and{' '}
            <Text style={styles.highlightText}>instantly frees your active slot under the Rule of 5</Text>.
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Quick Templates */}
            <Text style={styles.sectionLabel}>CHOOSE A RESPECTFUL NOTE</Text>
            {FAREWELL_TEMPLATES.map((tmpl, idx) => {
              const isSelected = selectedTemplateIndex === idx;
              return (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[styles.templateCard, isSelected && styles.templateCardSelected]}
                  onPress={() => handleSelectTemplate(idx)}
                  activeOpacity={0.8}>
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateEmoji}>{tmpl.emoji}</Text>
                    <Text style={[styles.templateTitle, isSelected && styles.templateTitleSelected]}>
                      {tmpl.title}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <Text style={[styles.templateText, isSelected && styles.templateTextSelected]}>
                    "{tmpl.text}"
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Editable Message Box */}
            <Text style={styles.sectionLabel}>CUSTOMIZE NOTE (OPTIONAL)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={customText}
                onChangeText={setCustomText}
                placeholder="Personalize your farewell note..."
                placeholderTextColor="#6B7280"
                multiline
                maxLength={300}
              />
            </View>

            {/* Rule of 5 Benefit Card */}
            <View style={styles.ruleOfFivePill}>
              <Text style={styles.ruleOfFiveIcon}>⚡</Text>
              <Text style={styles.ruleOfFiveText}>
                Frees 1 active match slot immediately. Your karma is 100% protected.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionFooter}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={isSubmitting}
              activeOpacity={0.85}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Send Farewell & Free Slot 🕊️</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Keep Inactive</Text>
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
    maxWidth: 420,
    maxHeight: '90%',
    flexShrink: 1,
    backgroundColor: '#12141C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  doveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  doveBadgeIcon: {
    fontSize: 12,
  },
  doveBadgeText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitleText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  highlightText: {
    color: '#34D399',
    fontWeight: '700',
  },
  scrollArea: {
    maxHeight: 340,
    flexShrink: 1,
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  templateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  templateCardSelected: {
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
    borderColor: '#FF385C',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  templateTitle: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  templateTitleSelected: {
    color: '#FF385C',
  },
  checkIcon: {
    color: '#FF385C',
    fontSize: 14,
    fontWeight: '800',
  },
  templateText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  templateTextSelected: {
    color: '#E5E7EB',
  },
  inputWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    minHeight: 54,
    textAlignVertical: 'top',
  },
  ruleOfFivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 8,
  },
  ruleOfFiveIcon: {
    fontSize: 14,
  },
  ruleOfFiveText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  actionFooter: {
    gap: 8,
    flexShrink: 0,
  },
  confirmBtn: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});
