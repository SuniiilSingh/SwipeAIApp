import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
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

export type CallStatus = 'RINGING' | 'INCOMING' | 'CONNECTED' | 'DECLINED' | 'ENDED';

interface VirtualChaiModalProps {
  visible: boolean;
  session: VirtualChaiSession | null;
  recipientName: string;
  recipientPhoto?: string;
  initialVideo?: boolean;
  callStatus?: CallStatus;
  onAccept?: () => void;
  onDecline?: () => void;
  onEndCall: () => void;
}

export default function VirtualChaiModal({
  visible,
  session,
  recipientName,
  recipientPhoto,
  initialVideo = false,
  callStatus = 'CONNECTED',
  onAccept,
  onDecline,
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
    if (initialVideo && (!permission || !permission.granted)) {
      requestPermission().catch(() => {});
    }
  }, [initialVideo]);

  // Call duration timer (only when CONNECTED)
  useEffect(() => {
    if (!visible || callStatus !== 'CONNECTED') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, callStatus]);

  // Pulsing animation for audio waves / ringing
  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1100,
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

  if (!visible || (!session && callStatus !== 'RINGING')) return null;

  const isRinging = callStatus === 'RINGING';
  const isIncoming = callStatus === 'INCOMING';
  const isDeclined = callStatus === 'DECLINED';
  const isConnected = callStatus === 'CONNECTED';

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
            <View style={[styles.liveIndicatorDot, (isRinging || isIncoming) && styles.ringingIndicatorDot]} />
            <Text style={[styles.badgeText, (isRinging || isIncoming) && styles.ringingBadgeText]}>
              {isIncoming ? 'INCOMING CALL' : isRinging ? 'RINGING...' : session?.isSimulated ? 'LOCAL SFU ACTIVE' : 'LIVEKIT ENCRYPTED SFU'}
            </Text>
          </View>

          <Text style={styles.timerText}>
            {isConnected ? formatDuration(callDuration) : isIncoming ? 'Incoming...' : isRinging ? 'Calling...' : isDeclined ? 'Declined' : ''}
          </Text>

          <View style={styles.securityPill}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>Phone Masked</Text>
          </View>
        </View>

        {/* Center Calling Body */}
        <View style={styles.callBody}>
          {isVideo && (permission?.granted || Platform.OS === 'web') && isConnected ? (
            // VIDEO CALL VIEW (Single camera view to prevent Android Camera2 hardware collisions)
            <View style={styles.videoStage}>
              {/* Main Remote Video Container */}
              <View style={styles.remoteVideoBox}>
                {recipientPhoto ? (
                  <Image source={{ uri: recipientPhoto }} style={styles.remotePhoto} resizeMode="cover" />
                ) : (
                  <View style={styles.remotePlaceholder}>
                    <Text style={styles.remoteInitial}>{recipientName[0]?.toUpperCase() || 'M'}</Text>
                  </View>
                )}
                <View style={styles.remoteVideoOverlay} />
                <View style={styles.remoteVideoGradient}>
                  <Text style={styles.remoteVideoName}>{recipientName}</Text>
                  <Text style={styles.remoteVideoStatus}>☕ Live Virtual Chai Stream • Encrypted</Text>
                </View>
              </View>

              {/* Picture-in-Picture Local Self Camera Preview */}
              <View style={styles.pipBox}>
                <CameraView style={styles.pipCamera} facing={cameraFacing} />
                <View style={styles.pipBadge}>
                  <Text style={styles.pipBadgeText}>You ({cameraFacing})</Text>
                </View>
              </View>
            </View>
          ) : (
            // AUDIO / RINGING / INCOMING VIEW
            <View style={styles.audioStage}>
              {/* Pulsing Audio Halos */}
              <Animated.View style={[styles.haloRingOuter, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.haloRingInner} />

              {/* Masked Avatar */}
              <View style={styles.avatarCircle}>
                {recipientPhoto ? (
                  <Image source={{ uri: recipientPhoto }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarInitial}>{recipientName[0]?.toUpperCase() || 'M'}</Text>
                )}
              </View>

              {/* Recipient Details */}
              <Text style={styles.recipientTitle}>{recipientName}</Text>
              <Text style={styles.maskedSubtitle}>
                {isIncoming
                  ? '☕ Incoming Virtual Chai Date... Tap Accept to connect!'
                  : isRinging
                  ? 'Ringing partner phone... 100% masked audio'
                  : isDeclined
                  ? 'Call was declined by partner'
                  : '☕ Virtual Chai • Audio Date'}
              </Text>

              {/* Sound Wave Equalizer Bars */}
              {(isConnected || isRinging || isIncoming) && (
                <View style={styles.soundWaveRow}>
                  <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim1 }] }]} />
                  <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim2 }] }]} />
                  <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim3 }] }]} />
                  <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim1 }] }]} />
                  <Animated.View style={[styles.soundBar, { transform: [{ scaleY: waveAnim2 }] }]} />
                </View>
              )}

              {/* Security Pill */}
              <View style={styles.serverInfoPill}>
                <Text style={styles.serverInfoText}>
                  Zero Number Exchange • Room: {session?.roomName || 'Connecting SFU...'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Control Actions Dock */}
        <View style={styles.controlsDock}>
          {isIncoming ? (
            // Incoming Call: Decline and Accept Buttons
            <View style={styles.incomingActionRow}>
              <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
                <Text style={styles.declineIcon}>✕</Text>
                <Text style={styles.declineLabel}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
                <Text style={styles.acceptIcon}>📞</Text>
                <Text style={styles.acceptLabel}>Accept</Text>
              </TouchableOpacity>
            </View>
          ) : isRinging ? (
            // Outgoing Ringing: Cancel Button
            <View style={styles.ringingActionRow}>
              <TouchableOpacity style={styles.endCallBtn} onPress={onEndCall} activeOpacity={0.8}>
                <Text style={styles.endCallIcon}>✕</Text>
                <Text style={styles.endCallLabel}>Cancel Call</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Active Call Controls
            <>
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
              <TouchableOpacity style={styles.endCallBtn} onPress={onEndCall} activeOpacity={0.8}>
                <Text style={styles.endCallIcon}>📞</Text>
                <Text style={styles.endCallLabel}>End Call</Text>
              </TouchableOpacity>
            </>
          )}
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
  ringingIndicatorDot: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ringingBadgeText: {
    color: '#F59E0B',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    textAlign: 'center',
    paddingHorizontal: 30,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  remotePhoto: {
    width: '100%',
    height: '100%',
  },
  remotePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#7928CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteInitial: {
    color: '#FFFFFF',
    fontSize: 60,
    fontWeight: '900',
  },
  remoteVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
  incomingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  ringingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 22,
    shadowColor: '#DC2626',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  declineIcon: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '900',
  },
  declineLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 22,
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  acceptLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
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
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#E11D48',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  endCallIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  endCallLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
});
