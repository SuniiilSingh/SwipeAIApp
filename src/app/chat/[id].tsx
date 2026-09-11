import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services/api';
import { CandidateCard, ChatMessage } from '@/types';
import ProfileDetailModal from '@/components/profile-detail-modal';
import { FEATURE_FLAGS } from '@/config/features';

export default function ChatScreen() {
  const router = useRouter();
  const { id: matchId, name: candidateName } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [matchProfile, setMatchProfile] = useState<CandidateCard | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Calling & Safe Date Modals
  const [callActive, setCallActive] = useState(false);
  const [unblurredImages, setUnblurredImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadChat();
  }, [matchId]);

  const loadChat = async () => {
    if (!matchId) return;
    setLoading(true);
    const msgs = await api.getMessages(matchId);
    setMessages(msgs);

    // Load full profile details for this match
    const match = await api.getMatchDetails(matchId);
    if (match?.otherProfile) {
      setMatchProfile(match.otherProfile);
    } else if (match) {
      setMatchProfile({
        userId: match.otherUserId,
        displayName: candidateName || match.otherUserName || 'Match',
        fullName: candidateName || match.otherUserName || 'Match',
        age: match.otherUserAge || 25,
        isDigilockerVerified: Boolean(match.isDigilockerVerified),
        isWhatsappVerified: true,
        livenessScore: 0.98,
        distanceKm: 3.5,
        culturalBadges: {
          diet: 'PURE_VEG',
          living: 'INDEPENDENT_FLAT',
          languages: ['English', 'Hindi'],
          zodiac: 'Aries',
        },
        compatibilityScore: 90,
        bio: 'High-intent match on Blunderr Dating.',
        occupation: 'Professional',
        company: 'Bengaluru Tech',
        education: 'Graduate',
        height: 175,
        relationshipIntent: 'Long-term partner',
        moonSign: 'Leo',
        karmaScore: 182,
        city: 'Bengaluru',
        neighborhood: 'Indiranagar',
        microCircle: 'Koramangala Tech Founders',
        photos: match.otherUserPhoto ? [match.otherUserPhoto] : [],
      });
    }
    setLoading(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() || !matchId) return;

    setInputText('');
    const newMsg = await api.sendMessage(matchId, content.trim());
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleVirtualChaiCall = async () => {
    if (!matchId) return;
    const session = await api.createVirtualChaiSession(matchId);
    setCallActive(true);
    Alert.alert(
      '☕ Virtual Chai Connected (Phone Masked)',
      `Encrypted WebRTC Audio Call active with ${candidateName || 'Match'}.\nYour phone number is completely hidden.`,
      [{ text: 'End Call', onPress: () => setCallActive(false) }]
    );
  };

  const handleSendTestSensitiveImage = async () => {
    if (!matchId) return;
    const newMsg = await api.sendMessage(
      matchId,
      'Here is an image',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&nsfw=true',
      'IMAGE'
    );
    setMessages((prev) => [...prev, newMsg]);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isBlurred = item.isBlurred && !unblurredImages[item.id];

    return (
      <View style={[styles.messageBubbleRow, item.isFromMe ? styles.myMessageRow : styles.theirMessageRow]}>
        <View style={[styles.messageBubble, item.isFromMe ? styles.myMessageBubble : styles.theirMessageBubble]}>
          {item.mediaType === 'IMAGE' && item.mediaUrl && (
            <View style={styles.imageContainer}>
              {isBlurred ? (
                <View style={styles.blurredBox}>
                  <Text style={styles.shieldIcon}>🛡️</Text>
                  <Text style={styles.shieldTitle}>Sensitive Content Warning</Text>
                  <Text style={styles.shieldSub}>Auto-blurred by Shield 360 AI Detector.</Text>
                  <TouchableOpacity
                    style={styles.revealBtn}
                    onPress={() => setUnblurredImages((prev) => ({ ...prev, [item.id]: true }))}>
                    <Text style={styles.revealBtnText}>Tap to View</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image source={{ uri: item.mediaUrl }} style={styles.chatImage} resizeMode="cover" />
              )}
            </View>
          )}

          <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic User Watermark Overlay (Anti-Screenshot Protection) */}
      <View style={styles.watermarkCanvas}>
        <Text style={styles.watermarkText}>PROTECTED BY SHIELD 360 • CONFIDENTIAL</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowProfileModal(true)} style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{candidateName || matchProfile?.displayName || 'Match'} 👤</Text>
          <Text style={styles.headerSubtitle}>
            {FEATURE_FLAGS.ENABLE_DIGILOCKER ? '🛡️ DigiLocker Verified • Tap to view profile' : '👤 3D Liveness Verified • Tap to view profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.virtualChaiBtn} onPress={handleVirtualChaiCall}>
          <Text style={styles.virtualChaiIcon}>☕</Text>
          <Text style={styles.virtualChaiText}>Virtual Chai</Text>
        </TouchableOpacity>
      </View>

      {/* Safe Date Spot Recommendation Banner */}
      <TouchableOpacity
        style={styles.safeSpotBanner}
        onPress={() => router.push('/safe-date')}>
        <Text style={styles.safeSpotIcon}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.safeSpotTitle}>Plan a Safe Spot Date</Text>
          <Text style={styles.safeSpotDesc}>Blue Tokai Indiranagar (15% Off + SOS Friend Sharing)</Text>
        </View>
        <Text style={styles.safeSpotArrow}>→</Text>
      </TouchableOpacity>

      {/* Pre-Chat Icebreaker Recap Card */}
      <View style={styles.icebreakerRecapCard}>
        <Text style={styles.recapHeading}>✦ YOU BOTH ANSWERED THE ICEBREAKER QUIZ:</Text>
        <Text style={styles.recapQuestion}>"Perfect Sunday: Filter Coffee in Indiranagar or Sleeping till 2 PM?"</Text>
        <Text style={styles.recapAnswer}>✓ Both picked: Filter Coffee & Dosa Crawl!</Text>
      </View>

      {/* Chat Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#E94057" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
        />
      )}

      {/* Bottom Message Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.sensitiveMediaBtn}
          onPress={handleSendTestSensitiveImage}>
          <Text style={styles.sensitiveMediaIcon}>📷</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.inputField}
          placeholder="Type message or use AI Spark..."
          placeholderTextColor="#7F8496"
          value={inputText}
          onChangeText={setInputText}
        />

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => handleSendMessage()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Full Profile Viewer Modal */}
      <ProfileDetailModal
        visible={showProfileModal}
        candidate={matchProfile}
        onClose={() => setShowProfileModal(false)}
        onVirtualChai={() => {
          setShowProfileModal(false);
          handleVirtualChaiCall();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  watermarkCanvas: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.04,
    zIndex: 10,
    pointerEvents: 'none',
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    transform: [{ rotate: '-30deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2028',
  },
  headerBackBtn: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 8,
  },
  backBtn: {
    color: '#E94057',
    fontSize: 22,
    fontWeight: '700',
    paddingRight: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  virtualChaiBtn: {
    backgroundColor: 'rgba(242, 113, 33, 0.15)',
    borderWidth: 1,
    borderColor: '#F27121',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  virtualChaiIcon: {
    fontSize: 14,
  },
  virtualChaiText: {
    color: '#F27121',
    fontSize: 11,
    fontWeight: '800',
  },
  safeSpotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181B26',
    borderBottomWidth: 1,
    borderBottomColor: '#262A3C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  safeSpotIcon: {
    fontSize: 18,
  },
  safeSpotTitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '800',
  },
  safeSpotDesc: {
    color: '#CACDD8',
    fontSize: 11,
    marginTop: 1,
  },
  safeSpotArrow: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '800',
  },
  icebreakerRecapCard: {
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.25)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
  },
  recapHeading: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '800',
  },
  recapQuestion: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  recapAnswer: {
    color: '#F27121',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  messageList: {
    padding: 16,
  },
  messageBubbleRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#E94057',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#20222C',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2E3242',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#CACDD8',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chatImage: {
    width: 200,
    height: 150,
  },
  blurredBox: {
    width: 200,
    height: 140,
    backgroundColor: '#15161C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  shieldIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  shieldTitle: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  shieldSub: {
    color: '#8E94A5',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  revealBtn: {
    backgroundColor: '#2A2C38',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  revealBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#14151B',
    borderTopWidth: 1,
    borderTopColor: '#20222C',
    gap: 8,
  },
  sensitiveMediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#20222C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensitiveMediaIcon: {
    fontSize: 18,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#20222C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2D303E',
  },
  sendBtn: {
    backgroundColor: '#E94057',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
