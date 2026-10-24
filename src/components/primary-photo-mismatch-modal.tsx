import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { hapticFeedback } from '@/utils/haptics';
import { api, normalizeImageUrl } from '@/services/api';
import LivenessCameraModal from '@/components/liveness-camera-modal';
import { livenessRecovery } from '@/services/liveness-recovery';

interface PrimaryPhotoMismatchModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoUploaded?: () => void;
  userSelfieUrl?: string | null;
  userPrimaryPhotoUrl?: string | null;
  matchScorePercent?: number;
}

export default function PrimaryPhotoMismatchModal({
  visible,
  onClose,
  onPhotoUploaded,
  userSelfieUrl,
  userPrimaryPhotoUrl,
  matchScorePercent = 38,
}: PrimaryPhotoMismatchModalProps) {
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickNewPrimaryPhoto = async () => {
    try {
      hapticFeedback.medium();
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Camera roll access is needed to upload your verified primary portrait.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const imagePayload = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

      setIsUploading(true);
      hapticFeedback.selection();

      // Upload image to server
      const uploadedUrl = await api.uploadImage(asset.uri, asset.base64);
      const finalUrl = uploadedUrl || imagePayload;

      // Update profile with new photo1
      await api.updateMyProfile({
        photos: [finalUrl],
      });

      setIsUploading(false);
      hapticFeedback.success();

      Alert.alert(
        '✅ Primary Photo Updated',
        'Your new primary portrait has been submitted for biometric verification. Checking against your live selfie...',
        [{
          text: 'Got it',
          onPress: () => {
            onClose();
            if (onPhotoUploaded) onPhotoUploaded();
          }
        }]
      );
    } catch (err: any) {
      setIsUploading(false);
      console.warn('Failed to upload primary photo:', err);
      Alert.alert(
        'Upload Failed',
        err?.message || 'Could not upload your photo. Please try again with a clear photo.'
      );
    }
  };

  const handleStartLivenessScan = () => {
    hapticFeedback.medium();
    setShowCameraScanner(true);
  };

  const handleCameraSuccess = async (score: number, centerPhotoUri?: string) => {
    setShowCameraScanner(false);
    onClose();
    livenessRecovery.markResolved();
    hapticFeedback.success();

    if (centerPhotoUri) {
      api.submitSelfieAsync(centerPhotoUri).catch(() => {});
    }

    if (onPhotoUploaded) {
      onPhotoUploaded();
    }

    Alert.alert(
      '🎉 3D Selfie Verified!',
      'Your live 3D selfie has been re-scanned. We are matching your profile photos now.',
      [{ text: 'Awesome! ✨' }]
    );
  };

  if (!visible && !showCameraScanner) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible && !showCameraScanner}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {/* Top Warning Icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>⚠️</Text>
            </View>

            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>BIOMETRIC MATCH &lt; 60% THRESHOLD</Text>
            </View>

            <Text style={styles.title}>Primary Photo Mismatch</Text>
            <Text style={styles.subtitle}>
              Your primary profile photo doesn't closely match your live 3D selfie verification.
              To guarantee 100% genuine humans on BlunderR, other singles will not see this photo.
            </Text>

            {/* Side-by-Side Comparison Frame */}
            <View style={styles.comparisonBox}>
              <View style={styles.compColumn}>
                <View style={[styles.imgFrame, styles.framePass]}>
                  {userSelfieUrl ? (
                    <ExpoImage
                      source={{ uri: normalizeImageUrl(userSelfieUrl) }}
                      style={styles.compImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.imgPlaceholder}>
                      <Text style={styles.placeholderEmoji}>🤳</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.compLabelPass}>✓ Live 3D Selfie</Text>
              </View>

              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.compColumn}>
                <View style={[styles.imgFrame, styles.frameFail]}>
                  {userPrimaryPhotoUrl ? (
                    <ExpoImage
                      source={{ uri: normalizeImageUrl(userPrimaryPhotoUrl) }}
                      style={styles.compImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.imgPlaceholder}>
                      <Text style={styles.placeholderEmoji}>📷</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.compLabelFail}>✕ Uploaded Photo</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={handlePickNewPrimaryPhoto}
              disabled={isUploading}
            >
              <Text style={styles.primaryBtnText}>
                {isUploading ? '⏳ Uploading Photo...' : '📸 Upload Real Primary Portrait'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.8}
              onPress={handleStartLivenessScan}
              disabled={isUploading}
            >
              <Text style={styles.secondaryBtnText}>🔄 Retake Live 3D Selfie Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissBtn}
              activeOpacity={0.7}
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={styles.dismissBtnText}>Dismiss for Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Liveness Camera Scanner Modal */}
      <LivenessCameraModal
        visible={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onSuccess={handleCameraSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#131724',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 26,
  },
  pillBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  pillBadgeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  comparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compColumn: {
    alignItems: 'center',
    flex: 1,
  },
  imgFrame: {
    width: 68,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 6,
    backgroundColor: '#0F121C',
  },
  framePass: {
    borderColor: '#10B981',
  },
  frameFail: {
    borderColor: '#EF4444',
  },
  compImg: {
    width: '100%',
    height: '100%',
  },
  imgPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  compLabelPass: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  compLabelFail: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  vsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#FF385C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingVertical: 8,
  },
  dismissBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
