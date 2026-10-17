import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hapticFeedback } from '@/utils/haptics';
import { livenessRecovery } from '@/services/liveness-recovery';
import LivenessCameraModal from '@/components/liveness-camera-modal';
import { api } from '@/services/api';

interface LivenessRetakeModalProps {
  visible: boolean;
  onClose: () => void;
  referrer?: string;
  onSuccess?: () => void;
}

export default function LivenessRetakeModal({
  visible,
  onClose,
  referrer,
  onSuccess,
}: LivenessRetakeModalProps) {
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const handleStartScan = () => {
    hapticFeedback.medium();
    setShowCameraScanner(true);
  };

  const handleCameraSuccess = async (score: number, centerPhotoUri?: string) => {
    setShowCameraScanner(false);
    onClose();

    // Mark single global flag as resolved
    livenessRecovery.markResolved();
    hapticFeedback.success();

    if (centerPhotoUri) {
      api.submitSelfieAsync(centerPhotoUri).catch(() => {});
    }

    if (onSuccess) {
      onSuccess();
    }

    Alert.alert(
      '🎉 3D Liveness Verified!',
      'Awesome! Your authentic 3D biometric presence is confirmed and your Verified Shield is now active.',
      [{ text: 'Great! ✨' }]
    );
  };

  return (
    <>
      <Modal
        visible={visible && !showCameraScanner}
        transparent
        animationType="slide"
        onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}>
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 24 }}>📸</Text>
              </View>
              <Text style={styles.title}>3D Liveness Retake</Text>
              <Text style={styles.subtitle}>
                {referrer
                  ? `Prompted from ${referrer}. Let's get you into bright lighting to confirm your authentic 3D depth.`
                  : 'Lighting was a bit dim on your previous attempt. Snap a quick 3-second selfie facing the light.'}
              </Text>
            </View>

            {/* 3 Friendly Tips Card */}
            <View style={styles.tipsBox}>
              <Text style={styles.tipsBoxTitle}>TIPS FOR QUICK VERIFICATION</Text>
              <View style={styles.tipRow}>
                <Text style={styles.tipIcon}>☀️</Text>
                <Text style={styles.tipText}>Face a bright window or room light</Text>
              </View>
              <View style={styles.tipRow}>
                <Text style={styles.tipIcon}>🕶️</Text>
                <Text style={styles.tipText}>Remove sunglasses, caps, or heavy filters</Text>
              </View>
              <View style={styles.tipRow}>
                <Text style={styles.tipIcon}>📱</Text>
                <Text style={styles.tipText}>Hold your phone steady at eye level</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.startScanBtn}
              onPress={handleStartScan}
              activeOpacity={0.85}>
              <Text style={styles.startScanBtnText}>Start 3-Second Check 📸</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>I'll do this later</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Embedded Real Camera Scanner */}
      <LivenessCameraModal
        visible={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onSuccess={handleCameraSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#141722',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    borderWidth: 1,
    borderColor: '#25293A',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 56, 92, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  tipsBox: {
    backgroundColor: '#0C0E16',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222638',
    marginBottom: 20,
    gap: 10,
  },
  tipsBoxTitle: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  startScanBtn: {
    backgroundColor: '#FF385C',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  startScanBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
