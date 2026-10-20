import React, { useState } from 'react';
import {
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
import { Image as ExpoImage } from 'expo-image';
import { CandidateCard, ContextType, SparkNoteQuota } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

interface SparkNoteModalProps {
  visible: boolean;
  candidate: CandidateCard | null;
  quota: SparkNoteQuota | null;
  contextType?: ContextType | string;
  contextTargetId?: string;
  contextPreviewUrl?: string;
  contextPromptText?: string;
  onClose: () => void;
  onSubmit: (noteText: string, contextType?: ContextType, contextTargetId?: string) => void;
}

const QUICK_STARTERS = [
  'Loved your energy in this photo! ✨',
  'What is the story behind this? 📸',
  'We definitely need to discuss your music taste 🎵',
  'Best coffee spot in Bangalore hands down ☕',
  'Curious about your Sunday ritual! 🥐',
];

export default function SparkNoteModal({
  visible,
  candidate,
  quota,
  contextType = 'PHOTO',
  contextTargetId,
  contextPreviewUrl,
  contextPromptText,
  onClose,
  onSubmit,
}: SparkNoteModalProps) {
  const [noteText, setNoteText] = useState('');

  // Reset text when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setNoteText('');
    }
  }, [visible]);

  if (!candidate) return null;

  const candidateName = candidate.displayName || candidate.fullName || 'Candidate';
  const previewPhoto = contextPreviewUrl || candidate.photos?.[0] || candidate.photo1;
  const isFreeAvailable = quota ? quota.canSendFree : true;
  const charsRemaining = 140 - noteText.length;

  const handleSend = () => {
    const textToSend = noteText.trim() || QUICK_STARTERS[0];
    hapticFeedback.medium();
    onSubmit(textToSend, contextType as ContextType, contextTargetId);
    setNoteText('');
  };

  const handleSelectStarter = (starter: string) => {
    hapticFeedback.selection();
    setNoteText(starter);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContent}>
          {/* Top Grabber */}
          <View style={styles.grabber} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeIcon}>✨</Text>
              <Text style={styles.sparkBadgeText}>
                {isFreeAvailable ? '1/1 Free Daily Spark Note' : 'Spark Note'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Send a Spark Note to {candidateName}</Text>
          <Text style={styles.subtitle}>
            Profiles with a Spark Note receive a 3.5x higher reply rate. Pinned right to their feed.
          </Text>

          {/* Context Preview Anchor Box */}
          <View style={styles.contextAnchorBox}>
            {previewPhoto && (
              <ExpoImage
                source={{ uri: previewPhoto }}
                style={styles.anchorThumb}
                contentFit="cover"
              />
            )}
            <View style={styles.anchorDetails}>
              <Text style={styles.anchorTag}>
                {contextType === 'PROMPT' ? '💬 Pinned to Prompt' : '📸 Pinned to Photo'}
              </Text>
              <Text style={styles.anchorHeadline} numberOfLines={2}>
                {contextPromptText || `${candidateName}'s Profile Highlight`}
              </Text>
            </View>
          </View>

          {/* Quick Icebreakers Carousel */}
          <View style={styles.startersWrap}>
            <Text style={styles.startersLabel}>Quick Starters:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.startersScroll}>
              {QUICK_STARTERS.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.starterChip}
                  onPress={() => handleSelectStarter(s)}
                  activeOpacity={0.75}>
                  <Text style={styles.starterText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Text Input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder={`Write something charming to ${candidateName}...`}
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={140}
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            <View style={styles.charCountRow}>
              <Text
                style={[
                  styles.charCountText,
                  charsRemaining < 20 && { color: '#E11D48' },
                ]}>
                {charsRemaining} characters left
              </Text>
            </View>
          </View>

          {/* Send CTA */}
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            activeOpacity={0.85}>
            <Text style={styles.sendBtnText}>
              {noteText.trim()
                ? (isFreeAvailable ? 'Send Free Spark Note ✨' : 'Send Spark Note ✨')
                : 'Send Quick Spark ✨'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.quotaFooterNote}>
            {isFreeAvailable
              ? '✨ Today’s Free Spark Note (1 resets every 24h) • Zero subscription required'
              : '⚡ Weekend Pass or Direct DM balance active • Resets daily'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheetContent: {
    backgroundColor: '#161922',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  grabber: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sparkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  sparkBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  sparkBadgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 16,
  },
  contextAnchorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1117',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  anchorThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#1E2230',
  },
  anchorDetails: {
    flex: 1,
  },
  anchorTag: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  anchorHeadline: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  startersWrap: {
    marginBottom: 12,
  },
  startersLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  startersScroll: {
    gap: 8,
  },
  starterChip: {
    backgroundColor: '#1F2433',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  starterText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '500',
  },
  inputWrap: {
    backgroundColor: '#0F1117',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    marginBottom: 16,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 65,
    maxHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCountText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  sendBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  quotaFooterNote: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
});
