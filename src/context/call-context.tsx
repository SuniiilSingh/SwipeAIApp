import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { VirtualChaiSession } from '@/types';
import VirtualChaiModal, { CallStatus } from '@/components/virtual-chai-modal';
import { playMessageReceivedSound } from '@/services/sound-service';

type WsMessageListener = (data: any) => void;

export type WsConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';

interface InAppMessageBanner {
  matchId: string;
  senderName: string;
  preview: string;
}

interface CallContextType {
  callStatus: CallStatus;
  isCallActive: boolean;
  connectionStatus: WsConnectionStatus;
  startCall: (
    matchId: string,
    partnerName: string,
    partnerPhoto?: string,
    videoMode?: boolean
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  subscribeToWebSocket: (listener: WsMessageListener) => () => void;
  sendWsMessage: (payload: any) => boolean;
  setActiveChatMatchId: (id: string | null) => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('ENDED');
  const [connectionStatus, setConnectionStatus] = useState<WsConnectionStatus>('CONNECTED');
  const [callingSession, setCallingSession] = useState<VirtualChaiSession | null>(null);
  const [callPartnerName, setCallPartnerName] = useState('Match Partner');
  const [callPartnerPhoto, setCallPartnerPhoto] = useState<string | undefined>(undefined);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [currentCallMatchId, setCurrentCallMatchId] = useState<string | null>(null);

  // In-app message notification banner state
  const [inAppBanner, setInAppBanner] = useState<InAppMessageBanner | null>(null);
  const bannerAnim = useRef(new Animated.Value(-120)).current;
  const bannerTimerRef = useRef<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<WsMessageListener>>(new Set());
  const reconnectTimerRef = useRef<any>(null);
  const activeChatMatchIdRef = useRef<string | null>(null);

  const setActiveChatMatchId = (id: string | null) => {
    activeChatMatchIdRef.current = id;
  };

  const showBanner = (banner: InAppMessageBanner) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setInAppBanner(banner);
    Animated.spring(bannerAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();

    bannerTimerRef.current = setTimeout(() => {
      dismissBanner();
    }, 4500);
  };

  const dismissBanner = () => {
    Animated.timing(bannerAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setInAppBanner(null);
    });
  };

  // Maintain persistent app-level WebSocket connection
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = async () => {
      try {
        let uid = api.getCurrentUserId();
        if (!uid) {
          try {
            uid = (await AsyncStorage.getItem('@swipeai_user_id')) || '';
          } catch (e) {}
        }
        if (!uid) {
          if (isMounted) {
            reconnectTimerRef.current = setTimeout(connectWebSocket, 1500);
          }
          return;
        }

        const base = api.getBaseUrl().replace('http://', 'ws://').replace('https://', 'wss://');
        const ws = new WebSocket(`${base}/ws/chat?userId=${uid}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            if (!isMounted) return;
            const data = JSON.parse(e.data);
            const currentUid = api.getCurrentUserId();
            const isFromCurrentMe = data.senderId ? data.senderId === currentUid : Boolean(data.isFromMe);

            // Handle Global Call Signaling
            if (data.type === 'CALL_INCOMING' && !isFromCurrentMe) {
              setCallPartnerName(data.callerName || 'Match Partner');
              setCallPartnerPhoto(data.callerPhoto);
              setIsVideoCall(Boolean(data.isVideo));
              setCallingSession(data.session);
              setCurrentCallMatchId(data.matchId);
              setCallStatus('INCOMING');
              setCallModalVisible(true);
            } else if (data.type === 'CALL_ACCEPTED') {
              setCallStatus('CONNECTED');
            } else if (data.type === 'CALL_DECLINED') {
              setCallStatus('DECLINED');
              setTimeout(() => {
                setCallModalVisible(false);
                setCallingSession(null);
                setCallStatus('ENDED');
                setCurrentCallMatchId(null);
              }, 2000);
            } else if (data.type === 'CALL_ENDED') {
              setCallStatus('ENDED');
              setCallModalVisible(false);
              setCallingSession(null);
              setCurrentCallMatchId(null);
            }

            // Handle In-App Incoming Message Sound & Banner when user is outside that chat room
            if (
              data.matchId &&
              !isFromCurrentMe &&
              data.type !== 'TYPING' &&
              !data.type?.startsWith('CALL_')
            ) {
              const currentActive = activeChatMatchIdRef.current;
              const isLookingAtSameChat =
                currentActive && String(currentActive).toLowerCase() === String(data.matchId).toLowerCase();

              if (!isLookingAtSameChat) {
                // Audible chime on received device + tactile haptics
                playMessageReceivedSound().catch(() => {});
                showBanner({
                  matchId: data.matchId,
                  senderName: data.senderName || 'New Message',
                  preview: data.mediaType === 'IMAGE' ? '📷 Sent a photo' : '💬 Sent a message',
                });
              }
            }

            // Dispatch message to all active screen subscribers (e.g. ChatScreen)
            listenersRef.current.forEach((listener) => {
              try {
                listener(data);
              } catch (err) {
                console.warn('[CallContext] Listener error:', err);
              }
            });
          } catch (err) {
            console.warn('[CallContext] WS message parse error:', err);
          }
        };

        ws.onopen = () => {
          if (isMounted) {
            setConnectionStatus('CONNECTED');
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setConnectionStatus('RECONNECTING');
            reconnectTimerRef.current = setTimeout(connectWebSocket, 4000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[CallContext] WS error:', err);
          if (isMounted) {
            setConnectionStatus('OFFLINE');
          }
        };
      } catch (e) {
        console.warn('[CallContext] Failed to open WS:', e);
        if (isMounted) {
          setConnectionStatus('OFFLINE');
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimerRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const subscribeToWebSocket = (listener: WsMessageListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  };

  const sendWsMessage = (payload: any): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.warn('[CallContext] Failed to send WS message:', err);
      }
    }
    return false;
  };

  const startCall = async (
    matchId: string,
    partnerName: string,
    partnerPhoto?: string,
    videoMode: boolean = false
  ) => {
    setCurrentCallMatchId(matchId);
    setCallPartnerName(partnerName);
    setCallPartnerPhoto(partnerPhoto);
    setIsVideoCall(videoMode);
    setCallStatus('RINGING');
    setCallModalVisible(true);

    try {
      const session = await api.createVirtualChaiSession(matchId, videoMode);
      setCallingSession(session);
    } catch (e) {
      Alert.alert('Call Failed', 'Could not connect to the calling server. Please check your connection.');
      setCallModalVisible(false);
      setCallStatus('ENDED');
      setCurrentCallMatchId(null);
    }
  };

  const acceptCall = async () => {
    if (!currentCallMatchId) return;
    setCallStatus('CONNECTED');
    try {
      await api.sendCallSignal(currentCallMatchId, 'CALL_ACCEPTED');
    } catch (e) {
      console.warn('Failed to send call accept signal:', e);
    }
  };

  const declineCall = async () => {
    if (!currentCallMatchId) return;
    const matchIdToSignal = currentCallMatchId;
    setCallModalVisible(false);
    setCallingSession(null);
    setCallStatus('ENDED');
    setCurrentCallMatchId(null);

    try {
      await api.sendCallSignal(matchIdToSignal, 'CALL_DECLINED');
    } catch (e) {
      console.warn('Failed to send call decline signal:', e);
    }
  };

  const endCall = async () => {
    if (currentCallMatchId) {
      api.sendCallSignal(currentCallMatchId, 'CALL_ENDED').catch(() => {});
    }
    setCallModalVisible(false);
    setCallingSession(null);
    setCallStatus('ENDED');
    setCurrentCallMatchId(null);
  };

  return (
    <CallContext.Provider
      value={{
        callStatus,
        isCallActive: callModalVisible,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        subscribeToWebSocket,
        sendWsMessage,
        connectionStatus,
        setActiveChatMatchId,
      }}>
      {children}

      {/* Floating In-App Message Notification Toast */}
      {inAppBanner && (
        <Animated.View
          style={[
            styles.bannerContainer,
            {
              transform: [{ translateY: bannerAnim }],
            },
          ]}>
          <TouchableOpacity
            style={styles.bannerTouchable}
            activeOpacity={0.88}
            onPress={() => {
              const targetMatch = inAppBanner.matchId;
              dismissBanner();
              router.push(`/chat/${targetMatch}`);
            }}>
            <View style={styles.bannerIconBox}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {inAppBanner.senderName}
              </Text>
              <Text style={styles.bannerPreview} numberOfLines={1}>
                {inAppBanner.preview}
              </Text>
            </View>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>Reply</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Global In-App Virtual Chai Masked Call Modal (Mounts over any screen) */}
      <VirtualChaiModal
        visible={callModalVisible}
        session={callingSession}
        recipientName={callPartnerName}
        recipientPhoto={callPartnerPhoto}
        initialVideo={isVideoCall}
        callStatus={callStatus}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEndCall={endCall}
      />
    </CallContext.Provider>
  );
}

export function useCall(): CallContextType {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  bannerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2029',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E94057',
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerPreview: {
    color: '#A0A5B5',
    fontSize: 12,
    marginTop: 2,
  },
  bannerBadge: {
    backgroundColor: '#E94057',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
