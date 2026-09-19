import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(width - 40, 380);

export interface SelfieCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string, base64?: string) => void;
}

export default function SelfieCameraModal({
  visible,
  onClose,
  onCapture,
}: SelfieCameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  // Strictly defaults to 'front' camera to fix the rear camera issue
  const [facing, setFacing] = useState<CameraType>('front');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // When modal becomes visible, reset state and ensure front camera is selected
  useEffect(() => {
    if (visible) {
      setFacing('front');
      setPreviewUri(null);
      setPreviewBase64(null);
      setIsCapturing(false);

      // Automatically request camera permission if not yet granted
      if (!permission?.granted) {
        requestPermission().catch(() => {});
      }
    }
  }, [visible]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setPreviewUri(photo.uri);
        setPreviewBase64(photo.base64 || null);
      }
    } catch (err) {
      console.warn('Failed to take selfie photo:', err);
      Alert.alert('Camera Error', 'Could not capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    setPreviewBase64(null);
  };

  const handleConfirm = () => {
    if (previewUri) {
      onCapture(previewUri, previewBase64 || undefined);
      onClose();
    }
  };

  const handleToggleFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setPreviewBase64(asset.base64 || null);
      }
    } catch (err) {
      console.warn('Error selecting image from gallery:', err);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>🛡️ GOLD SHIELD</Text>
            </View>
            <Text style={styles.title}>Biometric Selfie</Text>
            <Text style={styles.subtitle}>
              {previewUri
                ? 'Review your selfie before uploading'
                : 'Front camera verification for real human badge'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Viewfinder or Permission Container */}
        <View style={styles.body}>
          {!permission?.granted ? (
            <View style={styles.permissionCard}>
              <View style={styles.permissionIconCircle}>
                <Text style={styles.permissionIconText}>🤳</Text>
              </View>
              <Text style={styles.permissionTitle}>Front Camera Permission Needed</Text>
              <Text style={styles.permissionMessage}>
                To earn the Gold Trust Shield badge and guarantee a safe community, Blunderr Dating
                needs access to your front-facing camera.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => requestPermission()}>
                <Text style={styles.primaryButtonText}>Enable Front Camera 📷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={handlePickFromGallery}>
                <Text style={styles.secondaryButtonText}>Choose from Photos 🖼️</Text>
              </TouchableOpacity>
            </View>
          ) : previewUri ? (
            /* PREVIEW CONFIRMATION MODE */
            <View style={styles.viewfinderContainer}>
              <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.ovalGuideOverlay}>
                <View style={styles.ovalBorderSuccess} />
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>✓ Photo Captured</Text>
              </View>
            </View>
          ) : (
            /* LIVE FRONT CAMERA MODE */
            <View style={styles.viewfinderContainer}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode="picture"
                mirror={facing === 'front'}
                onCameraReady={() => setIsCameraReady(true)}
              />

              {/* Biometric Oval Face Guide */}
              <View style={styles.ovalGuideOverlay} pointerEvents="none">
                <View style={styles.ovalBorder}>
                  <View style={styles.guideCornerTL} />
                  <View style={styles.guideCornerTR} />
                  <View style={styles.guideCornerBL} />
                  <View style={styles.guideCornerBR} />
                </View>
                <Text style={styles.ovalInstruction}>Center your face in the oval</Text>
              </View>

              {/* Lens indicator tag */}
              <View style={styles.lensIndicator}>
                <Text style={styles.lensIndicatorText}>
                  {facing === 'front' ? '🤳 Front Camera' : '📷 Rear Camera'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer Controls */}
        <View style={styles.footer}>
          {permission?.granted && (
            previewUri ? (
              /* Review Actions */
              <View style={styles.reviewActionsRow}>
                <TouchableOpacity
                  style={styles.retakeButton}
                  activeOpacity={0.8}
                  onPress={handleRetake}>
                  <Text style={styles.retakeButtonText}>🔄 Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  activeOpacity={0.85}
                  onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>Use This Selfie ✨</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Live Camera Shutter & Tools */
              <View style={styles.controlsRow}>
                {/* Flip Camera */}
                <TouchableOpacity
                  style={styles.controlCircleButton}
                  activeOpacity={0.7}
                  onPress={handleToggleFacing}
                  accessibilityLabel="Switch Camera">
                  <Text style={styles.controlCircleIcon}>🔄</Text>
                  <Text style={styles.controlLabel}>{facing === 'front' ? 'Flip' : 'Front'}</Text>
                </TouchableOpacity>

                {/* Shutter Button */}
                <TouchableOpacity
                  style={[styles.shutterOuterRing, isCapturing && styles.shutterDisabled]}
                  activeOpacity={0.75}
                  disabled={isCapturing}
                  onPress={handleCapture}>
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#FF385C" />
                  ) : (
                    <View style={styles.shutterInnerCircle} />
                  )}
                </TouchableOpacity>

                {/* Pick from Gallery */}
                <TouchableOpacity
                  style={styles.controlCircleButton}
                  activeOpacity={0.7}
                  onPress={handlePickFromGallery}
                  accessibilityLabel="Choose from Gallery">
                  <Text style={styles.controlCircleIcon}>🖼️</Text>
                  <Text style={styles.controlLabel}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {/* Privacy Footnote */}
          <Text style={styles.footerNote}>
            🔒 Verified selfies are encrypted and used solely to earn your trust badge.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080E',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  headerBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  viewfinderContainer: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE * 1.25,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  ovalGuideOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  ovalBorder: {
    width: VIEWFINDER_SIZE * 0.72,
    height: VIEWFINDER_SIZE * 0.96,
    borderRadius: VIEWFINDER_SIZE * 0.48,
    borderWidth: 2,
    borderColor: '#00E5FF',
    borderStyle: 'dashed',
    position: 'relative',
  },
  ovalBorderSuccess: {
    width: VIEWFINDER_SIZE * 0.72,
    height: VIEWFINDER_SIZE * 0.96,
    borderRadius: VIEWFINDER_SIZE * 0.48,
    borderWidth: 2.5,
    borderColor: '#10B981',
  },
  guideCornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00E5FF',
  },
  guideCornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00E5FF',
  },
  guideCornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00E5FF',
  },
  guideCornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00E5FF',
  },
  ovalInstruction: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  lensIndicator: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 10, 20, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lensIndicatorText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  previewTag: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  previewTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  permissionCard: {
    width: VIEWFINDER_SIZE,
    backgroundColor: '#12121A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionIconText: {
    fontSize: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 13,
    color: '#A0A0B0',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#FF385C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    paddingTop: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  controlCircleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  controlCircleIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#A0A0B0',
    fontSize: 11,
    fontWeight: '600',
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF385C',
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1.5,
    backgroundColor: '#FF385C',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footerNote: {
    color: '#6E6E7E',
    fontSize: 11,
    textAlign: 'center',
  },
});
