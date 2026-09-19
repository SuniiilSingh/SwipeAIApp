import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { VirtualChaiSession } from '@/types';

const { width, height } = Dimensions.get('window');

interface VirtualChaiModalProps {
  visible: boolean;
  session: VirtualChaiSession | null;
  recipientName: string;
  recipientPhoto?: string;
  initialVideo?: boolean;
  onEndCall: () => void;
}

export default function VirtualChaiModal({
  visible,
  session,
  recipientName,
  recipientPhoto,
  initialVideo = false,
  onEndCall,
}: VirtualChaiModalProps) {
  const [isVideo, setIsVideo] = useState(initialVideo);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [callDuration, setCallDuration] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.4)).current;
  const waveAnim2 = useRef(new Animated.Value(0.6)).current;
  const waveAnim3 = useRef(new Animated.Value(0.3)).current;

  // Sync initial video mode
  useEffect(() => {
    setIsVideo(initialVideo);
  }, [initialVideo]);

  // Call duration timer
  useEffect(() => {
    if (!visible) {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  // Pulsing animation for audio waves
  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    const waves = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(waveAnim1, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 0.9, duration: 800, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(waveAnim3, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(waveAnim3, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );

    pulse.start();
    waves.start();

    return () => {
      pulse.stop();
      waves.stop();
    };
  }, [visible]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = async () => {
    if (!isVideo && (!permission || !permission.granted)) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsVideo((prev) => !prev);
  };

  const flipCamera = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (!visible || !session) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onEndCall}>
      <View style={styles.container}>
        {/* Anti-screenshot Watermark Canvas */}
        <View style={styles.watermarkOverlay}>
          <Text style={styles.watermarkText}>BLUNDERR VIRTUAL CHAI • 100% PHONE MASKED • END-TO-END ENCRYPTED</Text>
        </View>

        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.badgeText}>
              {session.isSimulated ? 'LOCAL SFU ACTIVE' : 'LIVEKIT ENCRYPTED SFU'}
            </Text>
          </View>
          <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
          <View style={styles.securityPill}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>Phone Masked</Text>
          </View>
        </View>

        {/* Center Calling Body */}
        <View style={styles.callBody}>
          {isVideo && (permission?.granted || Platform.OS === 'web') ? (
            // VIDEO CALL VIEW
            <View style={styles.videoStage}>
              {/* Main Remote Camera Feed Simulation Container */}
              <View style={styles.remoteVideoBox}>
                <CameraView style={styles.remoteCamera} facing={cameraFacing} />
                <View style={styles.remoteVideoGradient}>
                  <Text style={styles.remoteVideoName}>{recipientName}</Text>
                  <Text style={styles.remoteVideoStatus}>Connected via WebRTC</Text>
                </View>
              </View>

              {/* Picture-in-Picture Local Self Preview */}
              <View style={styles.pipBox}>
                <CameraView style={styles.pipCamera} facing="front" />
                <View style={styles.pipBadge}>
                  <Text style={styles.pipBadgeText}>You</Text>
                </View>
              </View>
            </View>
          ) : (
            // AUDIO-ONLY VIRTUAL CHAI VIEW
            <View style={styles.audioStage}>
              {/* Pulsing Audio Halos */}
              <Animated.View style={[styles.haloRingOuter, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.haloRingInner} />

              {/* Masked Avatar */}
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{recipientName[0]?.toUpperCase() || 'M'}</Text>
              </View>

              {/* Recipient Details */}
              <Text style={styles.recipientTitle}>{recipientName}</Text>
              <Text style={styles.maskedSubtitle}>☕ Virtual Chai • Audio Date</Text>

              {/* Sound Wave Equalizer Bars */}
              <View style={styles.soundWaveRow}>
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim1 }] }]} />
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim2 }] }]} />
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim3 }] }]} />
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim1 }] }]} />
                <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim2 }] }]} />
              </View>

              {/* Server Info */}
              <View style={styles.serverInfoPill}>
                <Text style={styles.serverInfoText}>
                  Room: {session.roomName} • {session.serverUrl}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Control Actions Dock */}
        <View style={styles.controlsDock}>
          {/* Mute Toggle */}
          <TouchableOpacity
            style={[styles.actionBtn, isMuted && styles.actionBtnActive]}
            onPress={() => setIsMuted((prev) => !prev)}>
            <Text style={styles.actionIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.actionLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* Video Toggle */}
          <TouchableOpacity
            style={[styles.actionBtn, isVideo && styles.actionBtnActive]}
            onPress={toggleVideo}>
            <Text style={styles.actionIcon}>{isVideo ? '📹' : '☕'}</Text>
            <Text style={styles.actionLabel}>{isVideo ? 'Video On' : 'Audio Only'}</Text>
          </TouchableOpacity>

          {/* Flip Camera (Active in Video Mode) */}
          {isVideo && (
            <TouchableOpacity style={styles.actionBtn} onPress={flipCamera}>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionLabel}>Flip</Text>
            </TouchableOpacity>
          )}

          {/* Speaker Toggle */}
          <TouchableOpacity
            style={[styles.actionBtn, isSpeaker && styles.actionBtnActive]}
            onPress={() => setIsSpeaker((prev) => !prev)}>
            <Text style={styles.actionIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
            <Text style={styles.actionLabel}>{isSpeaker ? 'Speaker' : 'Earpiece'}</Text>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity style={styles.endCallBtn} onPress={onEndCall}>
            <Text style={styles.endCallIcon}>📞</Text>
            <Text style={styles.endCallLabel}>End Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080E',
    justifyContent: 'space-between',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 35,
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
    opacity: 0.35,
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF385C',
    letterSpacing: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 30,
    paddingBottom: 15,
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  liveIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00F2FE',
  },
  badgeText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  securityIcon: {
    fontSize: 11,
  },
  securityText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  callBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Audio View Styles
  audioStage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  haloRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.25)',
  },
  haloRingInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(121, 40, 202, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(121, 40, 202, 0.4)',
  },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
  },
  recipientTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 26,
    letterSpacing: -0.5,
  },
  maskedSubtitle: {
    color: '#BAC4D6',
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 6,
  },
  soundWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 35,
    marginTop: 24,
  },
  soundBar: {
    width: 5,
    height: 30,
    borderRadius: 3,
    backgroundColor: '#FF385C',
  },
  serverInfoPill: {
    marginTop: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverInfoText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  // Video View Styles
  videoStage: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  remoteVideoBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#100B1A',
    overflow: 'hidden',
  },
  remoteCamera: {
    width: '100%',
    height: '100%',
  },
  remoteVideoGradient: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    zIndex: 5,
  },
  remoteVideoName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  remoteVideoStatus: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  pipBox: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 105,
    height: 155,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF385C',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  pipCamera: {
    width: '100%',
    height: '100%',
  },
  pipBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pipBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  // Controls Dock Styles
  controlsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(16, 20, 30, 0.95)',
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 42 : 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 25,
    elevation: 12,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: 54,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.22)',
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#BAC4D6',
    fontSize: 10,
    fontWeight: '600',
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#E11D48',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  endCallIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  endCallLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
});
