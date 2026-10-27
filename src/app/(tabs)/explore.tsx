import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { api } from '@/services/api';
import { MicroCircle, UserAstrology, UserProfile } from '@/types';
import KundaliChartDiamond from '@/components/kundali-chart-diamond';
import MicroCommunityModal from '@/components/micro-community-modal';
import { hapticFeedback } from '@/utils/haptics';
import { MEME_ASSETS, MODEL_ASSETS, resolveImageSource } from '@/constants/assets';
import { useThemedStyles } from '@/context/theme-context';

const { width } = Dimensions.get('window');

const CIRCLE_CITIES = [
  'All Cities',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Gurgaon',
  'Noida',
  'Pune',
  'Hyderabad',
  'Goa',
  'Kolkata',
  'Chennai',
];

const DAILY_MEMES = [
  {
    id: 'm1',
    title: 'Silk Board Peak Hour vs Saturday 2 AM',
    url: MEME_ASSETS[0],
    tag: 'Bangalore Struggles',
  },
  {
    id: 'm2',
    title: 'Auto Driver saying "Double Meter Lagega"',
    url: MEME_ASSETS[1],
    tag: 'Auto Logic',
  },
  {
    id: 'm3',
    title: 'Saying "I am leaving now" while still in bed',
    url: MEME_ASSETS[2],
    tag: 'Relatable',
  },
  {
    id: 'm4',
    title: 'Trying to find charging points in Indiranagar cafes',
    url: MEME_ASSETS[3],
    tag: 'Techie Life',
  },
  {
    id: 'm5',
    title: 'Ordering biryani at midnight after a long week',
    url: MEME_ASSETS[4],
    tag: 'Weekend Vibe',
  },
];

interface KundaliVibeFact {
  id: string;
  badge: string;
  headline: string;
  factText: string;
  compatibilityNote: string;
  gunaScore: string;
}

type LuxuryThemeKey = 'gold' | 'emerald' | 'rosegold' | 'aurora' | 'diamond';

interface LuxuryBorderConfig {
  name: string;
  borderColor: string;
  innerBorderColor: string;
  accentColor: string;
  glowColor: string;
  badgeEmoji: string;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  tagline: string;
}

const LUXURY_BORDER_THEMES: Record<LuxuryThemeKey, LuxuryBorderConfig> = {
  gold: {
    name: '24K Gold',
    borderColor: '#D4AF37',
    innerBorderColor: 'rgba(255, 229, 127, 0.45)',
    accentColor: '#FFE57F',
    glowColor: 'rgba(212, 175, 55, 0.45)',
    badgeEmoji: '👑',
    badgeText: '36-GUNA VEDIC AI',
    badgeBg: 'rgba(212, 175, 55, 0.18)',
    badgeBorder: '#D4AF37',
    tagline: 'ROYAL VEDIC PATRON • ULTRA RICH',
  },
  emerald: {
    name: 'Emerald',
    borderColor: '#10B981',
    innerBorderColor: 'rgba(110, 231, 183, 0.45)',
    accentColor: '#A7F3D0',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    badgeEmoji: '💎',
    badgeText: 'IMPERIAL VERIFIED',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
    badgeBorder: '#10B981',
    tagline: 'IMPERIAL ELITE MATCH • VERIFIED',
  },
  rosegold: {
    name: 'Rose Gold',
    borderColor: '#FB7185',
    innerBorderColor: 'rgba(255, 228, 230, 0.45)',
    accentColor: '#FDA4AF',
    glowColor: 'rgba(251, 113, 133, 0.45)',
    badgeEmoji: '✨',
    badgeText: 'HAUTE EDITORIAL',
    badgeBg: 'rgba(251, 113, 133, 0.18)',
    badgeBorder: '#FB7185',
    tagline: 'HAUTE HORLOGERIE • PRIVATE CLUB',
  },
  aurora: {
    name: 'Aurora',
    borderColor: '#00F5D4',
    innerBorderColor: 'rgba(168, 85, 247, 0.45)',
    accentColor: '#00F5D4',
    glowColor: 'rgba(0, 245, 212, 0.45)',
    badgeEmoji: '🪐',
    badgeText: 'CYBER SYNASTRY',
    badgeBg: 'rgba(0, 245, 212, 0.18)',
    badgeBorder: '#00F5D4',
    tagline: 'CYBERPUNK NEON • COSMIC RADAR',
  },
  diamond: {
    name: 'Diamond',
    borderColor: '#FFFFFF',
    innerBorderColor: 'rgba(226, 232, 240, 0.45)',
    accentColor: '#F8FAFC',
    glowColor: 'rgba(255, 255, 255, 0.35)',
    badgeEmoji: '⚡',
    badgeText: 'NOIR CAVIAR',
    badgeBg: 'rgba(255, 255, 255, 0.18)',
    badgeBorder: '#FFFFFF',
    tagline: 'HIGH-INTENT MONOCHROME • VIP',
  },
};

export default function ExploreScreen() {
  const styles = useThemedStyles(baseStyles);
  const [circles, setCircles] = useState<MicroCircle[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCircleDirectoryModal, setShowCircleDirectoryModal] = useState(false);

  const [memeIndex, setMemeIndex] = useState(0);
  const [memeDone, setMemeDone] = useState(false);

  // User Profile & Vedic Kundali state for Instagram Vibe Card
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [astrology, setAstrology] = useState<UserAstrology | null>(null);
  const [showInstaVibeModal, setShowInstaVibeModal] = useState(false);
  const [activeFactIdx, setActiveFactIdx] = useState(0);
  const [cardBorderTheme, setCardBorderTheme] = useState<'gold' | 'emerald' | 'rosegold' | 'aurora' | 'diamond'>('gold');
  const [instaCardStep, setInstaCardStep] = useState<'options' | 'preview'>('options');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('user');

  useEffect(() => {
    loadCircles();
    loadUserCosmicData();
  }, []);

  const loadCircles = async (city?: string) => {
    setLoadingCircles(true);
    try {
      const targetCity = city && city !== 'All Cities' ? city : undefined;
      const list = await api.getMicroCircles(targetCity);
      setCircles(list);
    } finally {
      setLoadingCircles(false);
    }
  };

  const loadUserCosmicData = async () => {
    try {
      const [myProf, myAstro] = await Promise.all([
        api.getMyProfile().catch(() => null),
        api.getMyAstrology().catch(() => null),
      ]);
      if (myProf) setProfile(myProf);
      if (myAstro) setAstrology(myAstro);
    } catch {
      // Fallback cosmic defaults handled below
    }
  };

  const handleCitySelect = (city: string) => {
    hapticFeedback.light();
    setCityFilter(city);
    loadCircles(city);
  };

  const filteredCircles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return circles.filter((c) => {
      const matchesCity =
        cityFilter === 'All Cities' ||
        !c.city ||
        c.city.toLowerCase().includes(cityFilter.toLowerCase()) ||
        c.name.toLowerCase().includes(cityFilter.toLowerCase());
      if (!matchesCity) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.vibeCategory && c.vibeCategory.toLowerCase().includes(q))
      );
    });
  }, [circles, cityFilter, searchQuery]);

  // Derived Kundali attributes (with authentic Vedic defaults if not yet calibrated)
  const userName = profile?.fullName || profile?.displayName || 'Cosmic Explorer';
  const userTribe = profile?.microCircle || profile?.neighborhood || 'Indiranagar Cafe Hoppers';
  const chandraRashi = astrology?.chandraRashi || profile?.moonSign || profile?.zodiacSign || 'Taurus (वृषभ)';
  const nakshatraName = astrology?.nakshatraName || 'Rohini';
  const nakshatraPada = astrology?.nakshatraPada || 2;
  const sunSign = astrology?.sunSign || 'Leo';
  const rashiLord = astrology?.chandraRashiLord || 'Venus (Shukra)';
  const gana = astrology?.gana || 'Manushya (Human)';
  const yoniAnimal = astrology?.yoniAnimal || 'Serpent';
  const nadi = astrology?.nadi || 'Antya (Kapha)';
  const isManglik = Boolean(astrology?.isManglik);

  const activeTheme = LUXURY_BORDER_THEMES[cardBorderTheme];
  const userPhoto = profile?.photos?.[0] || profile?.photo1 || profile?.selfieUrl;
  const userRole = profile?.occupation || profile?.company
    ? `${profile?.occupation || 'Member'}${profile?.company ? ` at ${profile.company}` : ''}`
    : '25 • High-Intent Member';

  const CURATED_PHOTO_OPTIONS = useMemo(
    () => [
      { id: 'user', label: 'My Photo', isUser: true, source: userPhoto ? { uri: userPhoto } : MODEL_ASSETS.tara },
      { id: 'ivory', label: 'Ivory Blazer', isUser: false, source: MODEL_ASSETS.tara },
      { id: 'rose', label: 'Rose Silk', isUser: false, source: MODEL_ASSETS.ananya },
      { id: 'vogue', label: 'Vogue Red', isUser: false, source: MODEL_ASSETS.meera },
      { id: 'exec', label: 'Executive', isUser: false, source: MODEL_ASSETS.kabir },
    ],
    [userPhoto]
  );

  const activeCardPhotoSource = useMemo(() => {
    const match = CURATED_PHOTO_OPTIONS.find((c) => c.id === selectedPhotoId);
    return match?.source || (userPhoto ? { uri: userPhoto } : MODEL_ASSETS.tara);
  }, [CURATED_PHOTO_OPTIONS, selectedPhotoId, userPhoto]);

  // Personalized Interesting Kundali & Cosmic Facts for Instagram Story Card
  const kundaliVibeFacts: KundaliVibeFact[] = useMemo(
    () => [
      {
        id: 'f1',
        badge: '🔮 NAKSHATRA MAGNETISM FACT',
        headline: `${nakshatraName} Nakshatra (Pada ${nakshatraPada}) × ${chandraRashi} Moon`,
        factText: `According to Vedic Sidereal Janampatri, people born under ${nakshatraName} Nakshatra with ${rashiLord} as their Rashi Lord possess "Magnetic Kalatra Energy" — they skip surface-level small talk and subconsciously attract partners who match both their 2 AM deep-talk frequency and weekend foodie spontaneity.`,
        compatibilityNote: `Top 36-Guna Match Vibes: Scorpio, Capricorn & Pisces Moons`,
        gunaScore: '32.5 / 36 Gunas (91% Cosmic Match)',
      },
      {
        id: 'f2',
        badge: '🪐 7TH HOUSE (KALATRA BHAVA) SECRET',
        headline: `Sun in ${sunSign} + Moon in ${chandraRashi} = Rare Dual Spark`,
        factText: `In Vedic Ashta-Koota synastry, combining a ${sunSign} outer fire with a ${chandraRashi} emotional core creates an 89% "Golden Retriever + CEO Ambition" paradox. You act fiercely independent all week, but secretly crave effortless filter-coffee dates and zero-ego loyalty.`,
        compatibilityNote: `Best Neighborhood Date: ${userTribe}`,
        gunaScore: '31.0 / 36 Gunas (89% Weekend Vibe)',
      },
      {
        id: 'f3',
        badge: '⚡ GANA & NADI GREEN-FLAG RADAR',
        headline: `${gana} Gana • ${nadi} Nadi Alignment`,
        factText: `Kundali Fact: Your ${gana} temperament paired with ${nadi} Nadi gives you an8-point Nadi Koota immunity against dry texters! Vedic texts say ${nakshatraName} natives sense someone's real intentions within the first 90 seconds of meeting.`,
        compatibilityNote: `Zero Nadi Dosha with Earth & Water Signs`,
        gunaScore: '33.0 / 36 Gunas (94% Soul Synastry)',
      },
      {
        id: 'f4',
        badge: '🌙 CHANDRA RASHI LORD SUPERPOWER',
        headline: `Ruled by ${rashiLord} • ${isManglik ? 'High-Voltage Manglik Spark 🔥' : 'Shuddha Non-Manglik Harmony ✨'}`,
        factText: `With ${rashiLord} governing your Chandra Lagna, your love language is 60% playlists & memes, 40% showing up unannounced with midnight biryani. ${
          isManglik
            ? 'Your Mars (Mangal) placement adds unstoppable passion and fierce protectiveness in relationships.'
            : 'Your balanced 7th house brings calm, drama-free emotional security to chaotic city dating.'
        }`,
        compatibilityNote: `Ideal First Date: Rooftop sunset or late-night drive`,
        gunaScore: '30.5 / 36 Gunas (88% Chemistry)',
      },
      {
        id: 'f5',
        badge: '🧬 VEDIC YONI & MEME DNA SYNCHRONICITY',
        headline: `${nakshatraName} Star × ${yoniAnimal} Yoni Instinct`,
        factText: `Ancient Brihat Parashara Hora Shastra meets 2026 dating: ${nakshatraName} natives have the highest "Slow-Burn to Obsessed" ratio in the zodiac. Once someone passes your humor & vibe check, your Bhakoot Koota locks in at 7/7 points.`,
        compatibilityNote: `Tribe Vibe: ${userTribe}`,
        gunaScore: '34.0 / 36 Gunas (96% Rare Alignment)',
      },
    ],
    [chandraRashi, nakshatraName, nakshatraPada, sunSign, rashiLord, gana, yoniAnimal, nadi, isManglik, userTribe]
  );

  const currentFact = kundaliVibeFacts[activeFactIdx % kundaliVibeFacts.length];

  const handleOpenInstaVibeCard = () => {
    hapticFeedback.medium();
    setInstaCardStep('options');
    setShowInstaVibeModal(true);
  };

  const handleGeneratePreview = () => {
    hapticFeedback.success();
    setInstaCardStep('preview');
  };

  const handleNextFact = () => {
    hapticFeedback.light();
    setActiveFactIdx((prev) => (prev + 1) % kundaliVibeFacts.length);
  };

  const handleShareInstaStory = async () => {
    hapticFeedback.success();
    const shareMessage =
      `✨ BLUNDERR ULTRA-RICH VEDIC VIBE CARD ✨\n\n` +
      `👤 ${userName} (${userRole})\n` +
      `📍 ${userTribe}\n` +
      `💫 Cosmic Synastry: ${currentFact.gunaScore}\n` +
      `🌙 Moon: ${chandraRashi} • ⭐ Nakshatra: ${nakshatraName} (Pada ${nakshatraPada})\n\n` +
      `${currentFact.badge}\n` +
      `"${currentFact.factText}"\n\n` +
      `🛡️ 100% 3D Biometric Verified • Zero Catfishes\n` +
      `⚡ 72-Hour Real Date Rule\n` +
      `📲 Join high-intent dating at: https://blunderr.in`;

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: 'My BlunderR Ultra-Rich Vibe Card',
            text: shareMessage,
            url: 'https://blunderr.in',
          });
          return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert(
            'Copied for Instagram Story! 📸',
            'Your BlunderR Ultra-Rich Vibe Card caption & stats have been copied. Screenshot this 9:16 card and share directly to your Instagram Story!'
          );
          return;
        }
      }
      await Share.share({
        title: 'My BlunderR Ultra-Rich Vibe Card',
        message: shareMessage,
        url: 'https://blunderr.in',
      });
    } catch {
      Alert.alert(
        'Ready for Instagram! 📸',
        'Take a screenshot of this BlunderR Story Card and share it directly to your Instagram Story!'
      );
    }
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
              <ExpoImage
                source={resolveImageSource(currentMeme.url, MEME_ASSETS[0])}
                style={styles.memeImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
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

        {/* SECTION 2: Micro-Community Circles (with Search & City-Wise Filter) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.sectionHeading}>📍 Micro-Community Circles</Text>
            <TouchableOpacity
              style={styles.browseAllPenBtn}
              onPress={() => setShowCircleDirectoryModal(true)}>
              <Text style={styles.browseAllPenBtnText}>✏️ Full Directory</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDesc}>
            Search & filter verified neighborhood and lifestyle tribes city-wise for hyper-relevant matches.
          </Text>

          {/* Search Input */}
          <View style={styles.searchBarBox}>
            <Text style={styles.searchBarIcon}>🔍</Text>
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search circle, neighborhood, tech hub..."
              placeholderTextColor="#6B7082"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                <Text style={styles.searchClearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* City-Wise Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cityFilterScroll}
            contentContainerStyle={styles.cityFilterRow}>
            {CIRCLE_CITIES.map((city) => {
              const isAct = cityFilter === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityFilterPill, isAct && styles.cityFilterPillActive]}
                  onPress={() => handleCitySelect(city)}>
                  <Text style={[styles.cityFilterText, isAct && styles.cityFilterTextActive]}>
                    {city === 'All Cities' ? '🇮🇳 All Cities' : `🏙️ ${city}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loadingCircles ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#E94057" />
            </View>
          ) : (
            <View style={styles.circlesList}>
              {filteredCircles.slice(0, 8).map((circle) => {
                const isSelected = selectedCircle === circle.id || selectedCircle === circle.name;
                return (
                  <TouchableOpacity
                    key={circle.id}
                    style={[styles.circleCard, isSelected && styles.circleCardActive]}
                    onPress={() => {
                      const next = isSelected ? null : circle.name;
                      setSelectedCircle(next);
                      Alert.alert(
                        next ? `Joined Circle: ${circle.name}` : 'Showing Pan-City Feed',
                        next
                          ? `Your discovery feed is now prioritized for members of ${circle.name}.`
                          : 'Filter reset.'
                      );
                    }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.circleName, isSelected && styles.circleNameActive]}>
                          {circle.name}
                        </Text>
                        {!!circle.city && (
                          <View style={styles.circleCityBadge}>
                            <Text style={styles.circleCityBadgeText}>{circle.city}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.circleDesc}>{circle.description}</Text>
                      <Text style={styles.circleMembers}>
                        👥 {(circle.activeMembers || 150).toLocaleString()} active singles
                      </Text>
                    </View>
                    <View style={[styles.joinBtn, isSelected && styles.joinBtnActive]}>
                      <Text style={[styles.joinBtnText, isSelected && styles.joinBtnTextActive]}>
                        {isSelected ? 'Active ✓' : 'Join'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* SECTION 3: Cosmic Chemistry 2.0 & Instagram Kundali Vibe Card */}
        <View style={styles.cosmicCard}>
          <View style={styles.cosmicHeader}>
            <Text style={styles.cosmicTitle}>✨ Cosmic Chemistry 2.0</Text>
            <View style={styles.cosmicTagBadge}>
              <Text style={styles.cosmicTag}>🪐 Kundali Story Card</Text>
            </View>
          </View>
          <Text style={styles.cosmicQuote}>
            &ldquo;{currentFact.headline} — {currentFact.gunaScore}&rdquo;
          </Text>
          <Text style={styles.cosmicSub}>
            Generate a personalized Instagram Story Vibe Card with interesting Vedic Kundali facts, your North-Indian Janampatri chart, and BlunderR branding!
          </Text>
          <TouchableOpacity
            style={styles.cosmicShareBtn}
            activeOpacity={0.85}
            onPress={handleOpenInstaVibeCard}>
            <Text style={styles.cosmicShareBtnText}>Generate Instagram Vibe Card 📲</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full Micro-Community Modal */}
      {showCircleDirectoryModal && (
        <MicroCommunityModal
          visible={showCircleDirectoryModal}
          onClose={() => setShowCircleDirectoryModal(false)}
          selectedName={selectedCircle || undefined}
          initialCity={cityFilter !== 'All Cities' ? cityFilter : undefined}
          onSelect={(circle) => {
            if (circle) {
              setSelectedCircle(circle.name);
              if (circle.city) setCityFilter(circle.city);
            } else {
              setSelectedCircle(null);
            }
          }}
        />
      )}

      {/* ==================== INSTAGRAM KUNDALI VIBE CARD MODAL ==================== */}
      {showInstaVibeModal && (
        <Modal
          visible={showInstaVibeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInstaVibeModal(false)}>
          <View style={styles.vibeModalOverlay}>
            <View style={styles.vibeModalContainer}>
              {/* Modal Top Header */}
              <View style={styles.vibeModalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vibeModalTopTitle}>
                    {instaCardStep === 'options' ? '✨ Generate Instagram Story Card' : '📲 Your Instagram Story Card'}
                  </Text>
                  <Text style={styles.vibeModalTopSub}>
                    {instaCardStep === 'options'
                      ? 'Configure options 1, 2 & 3 to generate your 9:16 card'
                      : 'Preview ready • Tap Share to export to external apps'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.vibeModalCloseBtn}
                  onPress={() => setShowInstaVibeModal(false)}>
                  <Text style={styles.vibeModalCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              {instaCardStep === 'options' ? (
                /* ================= STAGE 1: OPTIONS 1, 2, 3 ================= */
                <ScrollView
                  style={{ width: '100%' }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}>
                  
                  {/* OPTION 1: Choose Luxury Border Style */}
                  <View style={styles.optionSectionBox}>
                    <View style={styles.optionSectionHeader}>
                      <View style={styles.optionStepBadge}>
                        <Text style={styles.optionStepBadgeText}>1</Text>
                      </View>
                      <Text style={styles.optionSectionTitle}>Choose Luxury Border Style</Text>
                    </View>
                    <Text style={styles.optionSectionSub}>24K Gold, Imperial Emerald, Rose Titanium & Neon Auroras</Text>
                    
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.luxuryThemeScroll}>
                      {(Object.keys(LUXURY_BORDER_THEMES) as LuxuryThemeKey[]).map((key) => {
                        const th = LUXURY_BORDER_THEMES[key];
                        const isSelected = cardBorderTheme === key;
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[
                              styles.luxuryThemePill,
                              isSelected && {
                                borderColor: th.borderColor,
                                backgroundColor: th.badgeBg,
                                borderWidth: 2,
                              },
                            ]}
                            onPress={() => {
                              hapticFeedback.light();
                              setCardBorderTheme(key);
                            }}>
                            <View style={[styles.luxuryThemeSwatch, { backgroundColor: th.borderColor }]} />
                            <Text
                              style={[
                                styles.luxuryThemePillText,
                                isSelected && { color: th.accentColor, fontWeight: '900' },
                              ]}>
                              {th.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* OPTION 2: Choose Photo / Editorial Style */}
                  <View style={styles.optionSectionBox}>
                    <View style={styles.optionSectionHeader}>
                      <View style={styles.optionStepBadge}>
                        <Text style={styles.optionStepBadgeText}>2</Text>
                      </View>
                      <Text style={styles.optionSectionTitle}>Choose Photo / Editorial Style</Text>
                    </View>
                    <Text style={styles.optionSectionSub}>Use your profile selfie or select high-fashion editorial portraits</Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photoOptionsScroll}>
                      {CURATED_PHOTO_OPTIONS.map((item) => {
                        const isSelected = selectedPhotoId === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.photoOptionThumbWrap,
                              isSelected && { borderColor: activeTheme.borderColor, borderWidth: 2.5 },
                            ]}
                            onPress={() => {
                              hapticFeedback.light();
                              setSelectedPhotoId(item.id);
                            }}>
                            <ExpoImage source={item.source} style={styles.photoOptionThumbImg} contentFit="cover" />
                            <View style={styles.photoOptionThumbLabelBox}>
                              <Text style={styles.photoOptionThumbLabelText} numberOfLines={1}>
                                {item.label}
                              </Text>
                            </View>
                            {isSelected && (
                              <View style={[styles.photoOptionActiveCheck, { backgroundColor: activeTheme.borderColor }]}>
                                <Text style={styles.photoOptionActiveCheckText}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* OPTION 3: Card Information & Vibe Prompt */}
                  <View style={styles.optionSectionBox}>
                    <View style={styles.optionSectionHeader}>
                      <View style={styles.optionStepBadge}>
                        <Text style={styles.optionStepBadgeText}>3</Text>
                      </View>
                      <Text style={styles.optionSectionTitle}>Card Information & Vibe Prompt</Text>
                    </View>
                    <Text style={styles.optionSectionSub}>Identity details & Vedic compatibility synced from profile</Text>

                    <View style={styles.optionInfoCard}>
                      <View style={styles.optionInfoRow}>
                        <Text style={styles.optionInfoName}>{userName}</Text>
                        <View style={[styles.optionInfoGunaBadge, { borderColor: activeTheme.borderColor, backgroundColor: activeTheme.badgeBg }]}>
                          <Text style={[styles.optionInfoGunaText, { color: activeTheme.accentColor }]}>
                            💫 {currentFact.gunaScore.split(' ')[0]} / 36
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.optionInfoRole}>{userRole}</Text>
                      <Text style={styles.optionInfoTribe}>📍 {userTribe}</Text>

                      <View style={styles.optionPromptBox}>
                        <View style={styles.optionPromptHeader}>
                          <Text style={styles.optionPromptTag}>✦ VEDIC VIBE PROMPT</Text>
                          <TouchableOpacity onPress={handleNextFact} style={styles.optionRerollBtn}>
                            <Text style={styles.optionRerollBtnText}>🎲 Reroll</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.optionPromptQuote}>&ldquo;{currentFact.factText}&rdquo;</Text>
                      </View>
                    </View>
                  </View>

                  {/* Big Action Button to Generate */}
                  <TouchableOpacity
                    style={[styles.generateCardActionBtn, { backgroundColor: activeTheme.borderColor }]}
                    activeOpacity={0.88}
                    onPress={handleGeneratePreview}>
                    <Text style={styles.generateCardActionBtnText}>✨ Generate 9:16 Story Card ➔</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                /* ================= STAGE 2: 9:16 MOBILE STORY CARD PREVIEW ================= */
                <ScrollView
                  style={{ width: '100%' }}
                  contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}>

                  {/* 9:16 STORY CARD */}
                  <View
                    style={[
                      styles.instaStoryCardMobileView,
                      {
                        borderColor: activeTheme.borderColor,
                        shadowColor: activeTheme.glowColor,
                      },
                    ]}>
                    {/* Fine Inner Bezel */}
                    <View
                      style={[
                        styles.instaInnerBezel,
                        { borderColor: activeTheme.innerBorderColor },
                      ]}
                    />

                    {/* Background Photo (Centered on face, zero overlays on face) */}
                    <ExpoImage
                      source={activeCardPhotoSource}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />

                    {/* Soft Cinematic Vignette: Clear in center for face, dark at bottom for text */}
                    <View style={styles.instaVignetteTop} />
                    <View style={styles.instaVignetteBottom} />

                    {/* Top Minimal Brand Header (Above the Head — Never touches the face) */}
                    <View style={styles.instaBrandHeaderMobile}>
                      <View style={styles.instaBrandLeft}>
                        <View style={[styles.instaLogoWrap, { borderColor: activeTheme.borderColor }]}>
                          <ExpoImage
                            source={require('../../../assets/images/icon.png')}
                            style={styles.instaLogoImg}
                            contentFit="cover"
                          />
                        </View>
                        <Text style={styles.instaBrandNameMobile}>BlunderR</Text>
                      </View>
                      <View
                        style={[
                          styles.instaStoryPill,
                          { borderColor: activeTheme.badgeBorder, backgroundColor: activeTheme.badgeBg },
                        ]}>
                        <Text style={[styles.instaStoryPillText, { color: activeTheme.accentColor }]}>
                          {activeTheme.badgeEmoji} {activeTheme.badgeText}
                        </Text>
                      </View>
                    </View>

                    {/* 100% CLEAR FACE WINDOW */}
                    <View style={{ flex: 1 }} />

                    {/* Bottom Luxury Frosted Tray (All info docked safely below the face) */}
                    <View style={styles.instaBottomTrayMobile}>
                      <View style={styles.instaUserBannerMobile}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.instaUserNameMobile}>{userName}</Text>
                            <View style={styles.insta3DVerifiedBadge}>
                              <Text style={styles.insta3DVerifiedBadgeText}>✓ 3D BIOMETRIC</Text>
                            </View>
                          </View>
                          <Text style={styles.instaUserRoleMobile}>{userRole}</Text>
                          <Text style={styles.instaUserTribeMobile}>📍 {userTribe}</Text>
                        </View>
                        <View
                          style={[
                            styles.instaGunaBadge,
                            { borderColor: activeTheme.borderColor, backgroundColor: activeTheme.badgeBg },
                          ]}>
                          <Text style={[styles.instaGunaBadgeNum, { color: activeTheme.accentColor }]}>
                            {currentFact.gunaScore.split(' ')[0]}
                          </Text>
                          <Text style={styles.instaGunaBadgeSub}>/ 36 GUNAS</Text>
                        </View>
                      </View>

                      {/* Cosmic Pills */}
                      <View style={styles.instaKundaliGridMobile}>
                        <View style={styles.instaKundaliCellMobile}>
                          <Text style={styles.instaKundaliCellLabel}>🌙 MOON</Text>
                          <Text style={styles.instaKundaliCellValue}>{chandraRashi}</Text>
                        </View>
                        <View style={styles.instaKundaliCellMobile}>
                          <Text style={styles.instaKundaliCellLabel}>⭐ NAKSHATRA</Text>
                          <Text style={styles.instaKundaliCellValue}>{nakshatraName} (P{nakshatraPada})</Text>
                        </View>
                      </View>

                      {/* Vibe Quote */}
                      <View style={styles.instaPromptTrayMobile}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={styles.instaPromptTrayTag}>✦ VEDIC VIBE CHECK</Text>
                          <Text style={styles.instaPromptTrayRule}>⚡ 72h Date Rule</Text>
                        </View>
                        <Text style={styles.instaPromptTrayQuote} numberOfLines={2}>
                          &ldquo;{currentFact.factText}&rdquo;
                        </Text>
                      </View>

                      {/* Watermark */}
                      <View style={styles.instaWatermarkMobile}>
                        <Text style={styles.instaWatermarkText}>blunderr.in • High-Intent Dating</Text>
                        <Text style={styles.instaWatermarkHandle}>@blunderr.in</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Action Controls */}
                  <View style={styles.vibeModalActionRow}>
                    <TouchableOpacity
                      style={styles.vibeChangeOptionsBtn}
                      activeOpacity={0.85}
                      onPress={() => setInstaCardStep('options')}>
                      <Text style={styles.vibeChangeOptionsBtnText}>⚙️ Options</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.vibeRerollFactBtn}
                      activeOpacity={0.85}
                      onPress={handleNextFact}>
                      <Text style={styles.vibeRerollFactBtnText}>🎲 Reroll</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.vibeShareInstaBtn, { flex: 2, backgroundColor: activeTheme.borderColor }]}
                      activeOpacity={0.85}
                      onPress={handleShareInstaStory}>
                      <Text style={styles.vibeShareInstaBtnText}>📤 Share to External</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
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
  browseAllPenBtn: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  browseAllPenBtnText: {
    color: '#FF6B8B',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionDesc: {
    color: '#9E9EA7',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20222B',
    borderWidth: 1,
    borderColor: '#2D303E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchBarIcon: {
    fontSize: 14,
  },
  searchBarInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2C2F3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },
  cityFilterScroll: {
    marginBottom: 12,
  },
  cityFilterRow: {
    gap: 8,
    paddingRight: 8,
  },
  cityFilterPill: {
    backgroundColor: '#20222B',
    borderWidth: 1,
    borderColor: '#2D303E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  cityFilterPillActive: {
    backgroundColor: 'rgba(233, 64, 87, 0.18)',
    borderColor: '#E94057',
  },
  cityFilterText: {
    color: '#9E9EA7',
    fontSize: 12,
    fontWeight: '700',
  },
  cityFilterTextActive: {
    color: '#FFF',
  },
  circleCityBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  circleCityBadgeText: {
    color: '#C4B5FD',
    fontSize: 9,
    fontWeight: '800',
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
  cosmicTagBadge: {
    backgroundColor: 'rgba(224, 170, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 170, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cosmicTag: {
    color: '#E0AAFF',
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '800',
  },
  // ==================== INSTAGRAM VIBE CARD MODAL STYLES ====================
  vibeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 5, 10, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  vibeModalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '94%',
    backgroundColor: '#0B0D17',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 14,
  },
  vibeModalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vibeModalTopTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  vibeModalTopSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  vibeModalCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vibeModalCloseText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  luxuryThemeSelectorRow: {
    marginBottom: 12,
  },
  luxuryThemeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  luxuryThemeScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  luxuryThemePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  luxuryThemeSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  luxuryThemePillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  instaInnerBezel: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    right: 3,
    borderRadius: 19,
    borderWidth: 1,
    pointerEvents: 'none',
    zIndex: 1,
  },
  instaUserPhotoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    position: 'relative',
    marginRight: 10,
    overflow: 'visible',
  },
  instaUserPhotoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  instaAvatarVerifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  instaAvatarVerifiedText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  instaStoryCard: {
    backgroundColor: '#090714',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FF385C',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  instaGlowOrbTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
  },
  instaGlowOrbBottom: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
  },
  instaBrandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  instaBrandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  instaLogoWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF385C',
    overflow: 'hidden',
    backgroundColor: '#131629',
  },
  instaLogoImg: {
    width: '100%',
    height: '100%',
  },
  instaBrandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  instaVerifiedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instaVerifiedDotText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  instaBrandTagline: {
    color: '#FDA4AF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  instaStoryPill: {
    backgroundColor: 'rgba(252, 211, 77, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  instaStoryPillText: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '900',
  },
  instaUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instaUserName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  instaUserTribe: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  instaGunaBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  instaGunaBadgeNum: {
    color: '#6EE7B7',
    fontSize: 14,
    fontWeight: '900',
  },
  instaGunaBadgeSub: {
    color: '#A7F3D0',
    fontSize: 8,
    fontWeight: '800',
  },
  instaKundaliGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginTop: 10,
  },
  instaKundaliCell: {
    width: '48.5%',
    backgroundColor: '#121024',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  instaKundaliCellLabel: {
    color: '#A78BFA',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  instaKundaliCellValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  instaFactBox: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 56, 92, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    borderRadius: 16,
    padding: 12,
  },
  instaFactBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  instaFactBadgeText: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  instaFactCounter: {
    color: '#FDA4AF',
    fontSize: 9,
    fontWeight: '800',
  },
  instaFactHeadline: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  instaFactBody: {
    color: '#F1F5F9',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  instaFactMatchBar: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  instaFactMatchText: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '800',
  },
  instaChartContainer: {
    marginTop: 12,
    marginBottom: -8,
  },
  instaBrandFooter: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instaFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  instaFooterLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  instaFooterBrand: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  instaFooterUrl: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  instaFooterTag: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  instaFooterTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  vibeModalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    width: '100%',
    maxWidth: 360,
  },
  vibeChangeOptionsBtn: {
    backgroundColor: '#1E1B36',
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  vibeChangeOptionsBtnText: {
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '800',
  },
  vibeRerollFactBtn: {
    backgroundColor: '#181A26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  vibeRerollFactBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  vibeShareInstaBtn: {
    flex: 2,
    backgroundColor: '#FF385C',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibeShareInstaBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // Option Sections (Stage 1)
  optionSectionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  optionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionStepBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  optionSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  optionSectionSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 10,
  },
  photoOptionsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  photoOptionThumbWrap: {
    width: 76,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    backgroundColor: '#1E202B',
  },
  photoOptionThumbImg: {
    width: '100%',
    height: '100%',
  },
  photoOptionThumbLabelBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  photoOptionThumbLabelText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
  },
  photoOptionActiveCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  photoOptionActiveCheckText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  optionInfoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfoName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  optionInfoGunaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionInfoGunaText: {
    fontSize: 11,
    fontWeight: '900',
  },
  optionInfoRole: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  optionInfoTribe: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  optionPromptBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionPromptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionPromptTag: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  optionRerollBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionRerollBtnText: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '800',
  },
  optionPromptQuote: {
    color: '#F1F5F9',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  generateCardActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  generateCardActionBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // 9:16 Mobile View Story Card (Stage 2)
  instaStoryCardMobileView: {
    width: '100%',
    maxWidth: 360,
    height: 540,
    borderRadius: 24,
    borderWidth: 2.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 14,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#070912',
  },
  instaVignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  instaVignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'rgba(6, 8, 16, 0.94)',
  },
  instaBrandHeaderMobile: {
    position: 'relative',
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instaBrandNameMobile: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  instaBottomTrayMobile: {
    position: 'relative',
    zIndex: 20,
    flexDirection: 'column',
    gap: 7,
    backgroundColor: 'rgba(10, 13, 24, 0.78)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 11,
  },
  instaUserBannerMobile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  instaUserNameMobile: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  insta3DVerifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  insta3DVerifiedBadgeText: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  instaUserRoleMobile: {
    color: '#FDA4AF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  instaUserTribeMobile: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  instaKundaliGridMobile: {
    flexDirection: 'row',
    gap: 6,
  },
  instaKundaliCellMobile: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instaPromptTrayMobile: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 7,
  },
  instaPromptTrayTag: {
    color: '#FCD34D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  instaPromptTrayRule: {
    color: '#FB7185',
    fontSize: 8,
    fontWeight: '800',
  },
  instaPromptTrayQuote: {
    color: '#F1F5F9',
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  instaWatermarkMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  instaWatermarkText: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '600',
  },
  instaWatermarkHandle: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
});
