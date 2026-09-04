import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { MicroCircle } from '@/types';

const { width } = Dimensions.get('window');

const DAILY_MEMES = [
  {
    id: 'm1',
    title: 'Silk Board Peak Hour vs Saturday 2 AM',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=700',
    tag: 'Bangalore Struggles',
  },
  {
    id: 'm2',
    title: 'Auto Driver saying "Double Meter Lagega"',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700',
    tag: 'Auto Logic',
  },
  {
    id: 'm3',
    title: 'Saying "I am leaving now" while still in bed',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700',
    tag: 'Relatable',
  },
  {
    id: 'm4',
    title: 'Trying to find charging points in Indiranagar cafes',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=700',
    tag: 'Techie Life',
  },
  {
    id: 'm5',
    title: 'Ordering biryani at midnight after a long week',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700',
    tag: 'Weekend Vibe',
  },
];

export default function ExploreScreen() {
  const [circles, setCircles] = useState<MicroCircle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [memeIndex, setMemeIndex] = useState(0);
  const [memeDnaScore, setMemeDnaScore] = useState(88);
  const [memeDone, setMemeDone] = useState(false);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    const list = await api.getMicroCircles();
    setCircles(list);
  };

  const handleMemeSwipe = (liked: boolean) => {
    if (memeIndex + 1 >= DAILY_MEMES.length) {
      setMemeDone(true);
      Alert.alert(
        '🎉 Meme DNA Calibrated!',
        `Your humor style is 92% aligned with Koramangala Tech & Design clusters. Candidates with matching meme taste are prioritized in your feed!`
      );
    } else {
      setMemeIndex((prev) => prev + 1);
    }
  };

  const currentMeme = DAILY_MEMES[memeIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Micro-Circles & Meme DNA</Text>
          <Text style={styles.subtitle}>Hyper-local lifestyle tribes & Indian meme compatibility</Text>
        </View>

        {/* SECTION 1: Daily Meme DNA Mini-Game */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.sectionHeading}>🤣 Daily Meme DNA (5 Memes/Day)</Text>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>{memeDone ? 'Calibrated ⚡' : `${memeIndex + 1}/5`}</Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>
            Swipe on relatable memes. Our AI clusters your humor style to eliminate dry conversational matches.
          </Text>

          {!memeDone ? (
            <View style={styles.memeContainer}>
              <Image source={{ uri: currentMeme.url }} style={styles.memeImage} resizeMode="cover" />
              <View style={styles.memeMeta}>
                <Text style={styles.memeTag}>{currentMeme.tag}</Text>
                <Text style={styles.memeTitle}>{currentMeme.title}</Text>
              </View>

              <View style={styles.memeActionRow}>
                <TouchableOpacity style={styles.memePassBtn} onPress={() => handleMemeSwipe(false)}>
                  <Text style={styles.memeBtnText}>😐 Meh / Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.memeLikeBtn} onPress={() => handleMemeSwipe(true)}>
                  <Text style={styles.memeBtnText}>😂 Pure Gold ❤️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.memeSuccessBox}>
              <Text style={styles.memeSuccessEmoji}>🧬</Text>
              <Text style={styles.memeSuccessTitle}>Humor DNA: Witty Tech & Sarcasm</Text>
              <Text style={styles.memeSuccessSub}>
                Your matches now feature a live Meme Compatibility index (e.g. 88% Silk Board Meme Match).
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setMemeIndex(0);
                  setMemeDone(false);
                }}>
                <Text style={styles.retryBtnText}>Re-Calibrate Memes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION 2: Micro-Community Circles */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>📍 Micro-Community Circles</Text>
          <Text style={styles.sectionDesc}>
            Join verified neighborhood and lifestyle bubbles for hyper-relevant matches.
          </Text>

          <View style={styles.circlesList}>
            {circles.map((circle) => {
              const isSelected = selectedCircle === circle.id;
              return (
                <TouchableOpacity
                  key={circle.id}
                  style={[styles.circleCard, isSelected && styles.circleCardActive]}
                  onPress={() => {
                    const next = isSelected ? null : circle.id;
                    setSelectedCircle(next);
                    Alert.alert(
                      next ? `Joined Circle: ${circle.name}` : 'Showing Pan-City Feed',
                      next ? `Your discovery feed is now filtered to members of ${circle.name}.` : 'Filter reset.'
                    );
                  }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.circleName, isSelected && styles.circleNameActive]}>
                      {circle.name}
                    </Text>
                    <Text style={styles.circleDesc}>{circle.description}</Text>
                    <Text style={styles.circleMembers}>👥 {circle.activeMembers.toLocaleString()} active singles</Text>
                  </View>
                  <View style={[styles.joinBtn, isSelected && styles.joinBtnActive]}>
                    <Text style={[styles.joinBtnText, isSelected && styles.joinBtnTextActive]}>
                      {isSelected ? 'Active ✓' : 'Filter'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: Cosmic Chemistry 2.0 */}
        <View style={styles.cosmicCard}>
          <View style={styles.cosmicHeader}>
            <Text style={styles.cosmicTitle}>✨ Cosmic Chemistry 2.0</Text>
            <Text style={styles.cosmicTag}>Shareable Story Card</Text>
          </View>
          <Text style={styles.cosmicQuote}>
            "Your Sun in Leo + Their Moon in Scorpio = 89% Weekend Vibe Match"
          </Text>
          <Text style={styles.cosmicSub}>
            Playful, modern synastry based on mutual elements and conversational rhythm.
          </Text>
          <TouchableOpacity
            style={styles.cosmicShareBtn}
            onPress={() => Alert.alert('Story Card Generated 📸', 'Saved Instagram Story card to clipboard!')}>
            <Text style={styles.cosmicShareBtnText}>Generate Instagram Vibe Card 📲</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    color: '#8A8D98',
    fontSize: 13,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#181920',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262934',
    marginVertical: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  pillBadge: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionDesc: {
    color: '#9E9EA7',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  memeContainer: {
    backgroundColor: '#20222B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  memeImage: {
    width: '100%',
    height: 200,
  },
  memeMeta: {
    padding: 12,
  },
  memeTag: {
    color: '#F27121',
    fontSize: 11,
    fontWeight: '700',
  },
  memeTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  memeActionRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  memePassBtn: {
    flex: 1,
    backgroundColor: '#2C2F3C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  memeLikeBtn: {
    flex: 1,
    backgroundColor: '#E94057',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  memeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  memeSuccessBox: {
    backgroundColor: '#20222B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  memeSuccessEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  memeSuccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  memeSuccessSub: {
    color: '#8E94A5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#2C2F3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  circlesList: {
    gap: 10,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20222B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D303E',
  },
  circleCardActive: {
    borderColor: '#E94057',
    backgroundColor: 'rgba(233, 64, 87, 0.1)',
  },
  circleName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  circleNameActive: {
    color: '#E94057',
  },
  circleDesc: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 2,
  },
  circleMembers: {
    color: '#6B7082',
    fontSize: 11,
    marginTop: 4,
  },
  joinBtn: {
    backgroundColor: '#2C2F3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinBtnActive: {
    backgroundColor: '#E94057',
  },
  joinBtnText: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '700',
  },
  joinBtnTextActive: {
    color: '#ffffff',
  },
  cosmicCard: {
    backgroundColor: '#231828',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4A2A5A',
    marginVertical: 10,
  },
  cosmicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cosmicTitle: {
    color: '#FF70A6',
    fontSize: 16,
    fontWeight: '800',
  },
  cosmicTag: {
    color: '#E0AAFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cosmicQuote: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    marginVertical: 10,
    lineHeight: 20,
  },
  cosmicSub: {
    color: '#B8A4C9',
    fontSize: 12,
    lineHeight: 18,
  },
  cosmicShareBtn: {
    backgroundColor: '#E94057',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  cosmicShareBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
