import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { VirtualChaiSession } from '@/types';
import VirtualChaiModal, { CallStatus } from '@/components/virtual-chai-modal';

type WsMessageListener = (data: any) => void;

export type WsConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';

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
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('ENDED');
  const [connectionStatus, setConnectionStatus] = useState<WsConnectionStatus>('CONNECTED');
  const [callingSession, setCallingSession] = useState<VirtualChaiSession | null>(null);
  const [callPartnerName, setCallPartnerName] = useState('Match Partner');
  const [callPartnerPhoto, setCallPartnerPhoto] = useState<string | undefined>(undefined);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [currentCallMatchId, setCurrentCallMatchId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<WsMessageListener>>(new Set());
  const reconnectTimerRef = useRef<any>(null);

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
      }}>
      {children}

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
