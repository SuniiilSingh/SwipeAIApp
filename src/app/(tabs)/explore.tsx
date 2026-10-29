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
import { getCommunityColor } from '@/utils/metro-colors';

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
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
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
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('user-0');

  // Fully Dynamic Instagram Card Data (Synced with profile & fully editable)
  const [cardName, setCardName] = useState<string>('');
  const [cardRole, setCardRole] = useState<string>('');
  const [cardTribe, setCardTribe] = useState<string>('');
  const [cardNakshatra, setCardNakshatra] = useState<string>('');
  const [cardMoon, setCardMoon] = useState<string>('');
  const [cardGunaScore, setCardGunaScore] = useState<string>('34.5');
  const [cardQuote, setCardQuote] = useState<string>('');
  const [card3DVerifiedText, setCard3DVerifiedText] = useState<string>('✓ 100% 3D BIOMETRIC VERIFIED');

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
      if (myProf) {
        setProfile(myProf);
        const myComms: string[] = Array.isArray(myProf.microCircles) && myProf.microCircles.length > 0
          ? myProf.microCircles
          : (myProf.microCircle ? [myProf.microCircle] : []);
        setSelectedCircles(myComms);
        setCardName((prev) => prev || myProf.fullName || myProf.displayName || 'Tara Sen');
        const agePart = myProf.age ? `${myProf.age} • ` : '25 • ';
        const occPart = myProf.occupation || (myProf.company ? `At ${myProf.company}` : 'Founder & Angel Investor');
        setCardRole((prev) => prev || `${agePart}${occPart}`);
        const tribeLoc = myComms.length > 0
          ? myComms.slice(0, 2).join(' • ')
          : (myProf.neighborhood ? `${myProf.neighborhood} • ${myProf.city || 'Bengaluru'}` : 'Indiranagar Founders Club • Bengaluru');
        setCardTribe((prev) => prev || tribeLoc);
        if (myProf.profilePromptAnswer) {
          setCardQuote((prev) => prev || myProf.profilePromptAnswer || '');
        }
        if (myProf.livenessScore) {
          setCard3DVerifiedText(`✓ ${Math.round(myProf.livenessScore)}% 3D BIOMETRIC VERIFIED`);
        }
      }
      if (myAstro) {
        setAstrology(myAstro);
        if (myAstro.nakshatraName) {
          setCardNakshatra((prev) => prev || `${myAstro.nakshatraName} (P${myAstro.nakshatraPada || 2})`);
        }
        if (myAstro.chandraRashi) {
          setCardMoon((prev) => prev || myAstro.chandraRashi);
        }
      }
    } catch {
      // Fallback cosmic defaults handled below
    }
  };

  const handleCitySelect = (city: string) => {
    hapticFeedback.light();
    setCityFilter(city);
    loadCircles(city);
  };

  const handleToggleCircle = (circleName: string) => {
    hapticFeedback.light();
    const isJoined = selectedCircles.includes(circleName);
    let updated: string[];
    if (isJoined) {
      updated = selectedCircles.filter((c) => c !== circleName);
    } else {
      if (selectedCircles.length >= 5) {
        Alert.alert(
          'Maximum 5 Communities',
          'You can join up to 5 communities. Deselect one first to add this community.'
        );
        return;
      }
      updated = [...selectedCircles, circleName];
    }
    setSelectedCircles(updated);
    api.updateMyProfile({
      microCircles: updated,
      microCircle: updated[0] || '',
    }).catch((err) => console.warn('Failed to persist community selection:', err));
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
  const userTribe = (selectedCircles.length > 0 ? selectedCircles[0] : profile?.microCircle) || profile?.neighborhood || 'Indiranagar Cafe Hoppers';
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

  // Dynamic User Photos List (User's real profile photos + curated editorial looks)
  const userPhotosList = useMemo(() => {
    const list: string[] = [];
    if (profile?.photos && Array.isArray(profile.photos)) {
      list.push(...profile.photos.filter(Boolean));
    }
    if (profile?.photo1 && !list.includes(profile.photo1)) list.push(profile.photo1);
    if (profile?.selfieUrl && !list.includes(profile.selfieUrl)) list.push(profile.selfieUrl);
    return list;
  }, [profile]);

  const CURATED_PHOTO_OPTIONS = useMemo(() => {
    const options: { id: string; label: string; isUser: boolean; source: any }[] = [];
    if (userPhotosList.length > 0) {
      userPhotosList.forEach((uri, idx) => {
        options.push({
          id: `user-${idx}`,
          label: idx === 0 ? 'My Main Photo' : `My Photo ${idx + 1}`,
          isUser: true,
          source: { uri },
        });
      });
    } else {
      options.push({
        id: 'user-0',
        label: 'My Photo',
        isUser: true,
        source: MODEL_ASSETS.tara,
      });
    }
    options.push(
      { id: 'ivory', label: 'Ivory Blazer', isUser: false, source: MODEL_ASSETS.tara },
      { id: 'rose', label: 'Rose Silk', isUser: false, source: MODEL_ASSETS.ananya },
      { id: 'vogue', label: 'Vogue Red', isUser: false, source: MODEL_ASSETS.meera },
      { id: 'exec', label: 'Executive', isUser: false, source: MODEL_ASSETS.kabir }
    );
    return options;
  }, [userPhotosList]);

  const activeCardPhotoSource = useMemo(() => {
    const match = CURATED_PHOTO_OPTIONS.find((c) => c.id === selectedPhotoId);
    return match?.source || (userPhotosList[0] ? { uri: userPhotosList[0] } : MODEL_ASSETS.tara);
  }, [CURATED_PHOTO_OPTIONS, selectedPhotoId, userPhotosList]);

  // Dynamic Fallbacks for all card fields
  const activeName = cardName || userName;
  const activeRole = cardRole || (profile?.age ? `${profile.age} • ${profile.occupation || 'Founder & Investor'}` : '25 • Founder & Angel Investor');
  const activeTribe = cardTribe || userTribe;
  const activeNakshatra = cardNakshatra || `${nakshatraName} (P${nakshatraPada})`;
  const activeMoon = cardMoon || chandraRashi;
  const activeGuna = cardGunaScore || '34.5';

  // Strict Word Limit Configuration for 9:16 Instagram Story Card
  const MAX_PROMPT_WORDS = 18;

  const countWords = (text: string): number => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const clampToWordLimit = (text: string, maxWords: number = MAX_PROMPT_WORDS): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text.trim();
    return words.slice(0, maxWords).join(' ');
  };

  // Personalized Interesting Kundali & Cosmic Facts for Instagram Story Card (Strictly <= 18 Words)
  const kundaliVibeFacts: KundaliVibeFact[] = useMemo(
    () => [
      {
        id: 'f1',
        badge: '🔮 NAKSHATRA MAGNETISM FACT',
        headline: `${nakshatraName} Nakshatra (Pada ${nakshatraPada}) × ${chandraRashi} Moon`,
        factText: `Magnetic Kalatra energy: skips surface small talk for 2 AM deep talks & spontaneous weekend foodie runs.`,
        compatibilityNote: `Top 36-Guna Match Vibes: Scorpio, Capricorn & Pisces Moons`,
        gunaScore: '32.5 / 36 Gunas (91% Cosmic Match)',
      },
      {
        id: 'f2',
        badge: '🪐 7TH HOUSE (KALATRA BHAVA) SECRET',
        headline: `Sun in ${sunSign} + Moon in ${chandraRashi} = Rare Dual Spark`,
        factText: `Golden Retriever warmth meets CEO ambition: fiercely independent, but craves filter-coffee dates & zero-ego loyalty.`,
        compatibilityNote: `Best Neighborhood Date: ${userTribe}`,
        gunaScore: '31.0 / 36 Gunas (89% Weekend Vibe)',
      },
      {
        id: 'f3',
        badge: '⚡ GANA & NADI GREEN-FLAG RADAR',
        headline: `${gana} Gana • ${nadi} Nadi Alignment`,
        factText: `Vedic Green-Flag radar: senses real intentions in 90 seconds with absolute zero patience for dry texters.`,
        compatibilityNote: `Zero Nadi Dosha with Earth & Water Signs`,
        gunaScore: '33.0 / 36 Gunas (94% Soul Synastry)',
      },
      {
        id: 'f4',
        badge: '🌙 CHANDRA RASHI LORD SUPERPOWER',
        headline: `Ruled by ${rashiLord} • ${isManglik ? 'High-Voltage Manglik Spark 🔥' : 'Shuddha Non-Manglik Harmony ✨'}`,
        factText: `Ruled by ${rashiLord}: 60% curated playlists & banter, 40% showing up unannounced with midnight snacks.`,
        compatibilityNote: `Ideal First Date: Rooftop sunset or late-night drive`,
        gunaScore: '30.5 / 36 Gunas (88% Chemistry)',
      },
      {
        id: 'f5',
        badge: '🧬 VEDIC YONI & MEME DNA SYNCHRONICITY',
        headline: `${nakshatraName} Star × ${yoniAnimal} Yoni Instinct`,
        factText: `Highest 'Slow-Burn to Obsessed' ratio in the zodiac. Pass the humor vibe check and you're locked in.`,
        compatibilityNote: `Tribe Vibe: ${userTribe}`,
        gunaScore: '34.0 / 36 Gunas (96% Rare Alignment)',
      },
    ],
    [chandraRashi, nakshatraName, nakshatraPada, sunSign, rashiLord, gana, yoniAnimal, nadi, isManglik, userTribe]
  );

  const currentFact = kundaliVibeFacts[activeFactIdx % kundaliVibeFacts.length];

  // Guaranteed word-capped dynamic editorial quote for the Instagram Story Card
  const activeQuote = useMemo(() => {
    if (cardQuote && cardQuote.trim().length > 0) {
      return clampToWordLimit(cardQuote, MAX_PROMPT_WORDS);
    }
    return clampToWordLimit(currentFact.factText, MAX_PROMPT_WORDS);
  }, [cardQuote, currentFact.factText]);

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
    const nextIdx = (activeFactIdx + 1) % kundaliVibeFacts.length;
    setActiveFactIdx(nextIdx);
    setCardQuote(kundaliVibeFacts[nextIdx].factText);
    setCardGunaScore(kundaliVibeFacts[nextIdx].gunaScore.split(' ')[0]);
  };

  const handlePromptChange = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length > MAX_PROMPT_WORDS) {
      setCardQuote(clampToWordLimit(text, MAX_PROMPT_WORDS));
    } else {
      setCardQuote(text);
    }
  };

  const handleShareInstaStory = async () => {
    hapticFeedback.success();
    const shareMessage =
      `✨ BLUNDERR ULTRA-RICH VEDIC VIBE CARD ✨\n\n` +
      `👤 ${activeName} (${activeRole})\n` +
      `📍 ${activeTribe}\n` +
      `💫 Cosmic Synastry: ${activeGuna} / 36 Gunas\n` +
      `🌙 Moon: ${activeMoon} • ⭐ Nakshatra: ${activeNakshatra}\n\n` +
      `${currentFact.badge}\n` +
      `"${activeQuote}"\n\n` +
      `🛡️ ${card3DVerifiedText}\n` +
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.sectionHeading}>
                📍 Micro-Communities ({selectedCircles.length}/5)
              </Text>
              <Text style={{ fontSize: 11, color: '#A0A5B5', marginTop: 2 }}>
                Join up to 5 verified tribes to discover and match across all of them
              </Text>
            </View>
            <TouchableOpacity
              style={styles.browseAllPenBtn}
              onPress={() => setShowCircleDirectoryModal(true)}>
              <Text style={styles.browseAllPenBtnText}>✏️ Full Directory</Text>
            </TouchableOpacity>
          </View>

          {/* Active Joined Communities Bar */}
          {selectedCircles.length > 0 && (
            <View style={styles.activeJoinedBar}>
              <Text style={styles.activeJoinedBarTitle}>YOUR ACTIVE TRIBES ({selectedCircles.length}/5):</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeJoinedScroll}>
                {selectedCircles.map((name) => {
                  const colorConfig = getCommunityColor(name);
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[
                        styles.activeJoinedChip,
                        {
                          backgroundColor: colorConfig.tagBg,
                          borderColor: colorConfig.tagBorder,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => handleToggleCircle(name)}>
                      <Text style={[styles.activeJoinedChipText, { color: colorConfig.textColor }]} numberOfLines={1}>
                        {colorConfig.emoji} {name}
                      </Text>
                      <Text style={[styles.activeJoinedChipRemove, { color: colorConfig.textColor }]}>✕</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Search Input */}
          <View style={styles.searchBarBox}>
            <Text style={styles.searchBarIcon}>🔍</Text>
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search marathon, solo travel, tech, gigs..."
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
              {filteredCircles.slice(0, 10).map((circle) => {
                const isSelected = selectedCircles.includes(circle.name) || (circle.id && selectedCircles.includes(circle.id));
                const colorConfig = getCommunityColor(circle.slug || circle.name, circle.vibeCategory);
                return (
                  <TouchableOpacity
                    key={circle.id}
                    style={[
                      styles.circleCard,
                      {
                        borderLeftWidth: 4,
                        borderLeftColor: colorConfig.primary,
                        backgroundColor: isSelected ? colorConfig.cardBg : '#20222B',
                        borderColor: isSelected ? colorConfig.primary : '#2D303E',
                      },
                    ]}
                    onPress={() => handleToggleCircle(circle.name)}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text
                          style={[
                            styles.circleName,
                            { color: isSelected ? colorConfig.textColor : '#ffffff' },
                          ]}>
                          {colorConfig.emoji} {circle.name}
                        </Text>
                        {!!circle.city && (
                          <View
                            style={[
                              styles.circleCityBadge,
                              {
                                backgroundColor: colorConfig.tagBg,
                                borderColor: colorConfig.tagBorder,
                              },
                            ]}>
                            <Text style={[styles.circleCityBadgeText, { color: colorConfig.textColor }]}>
                              {circle.city}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.circleDesc}>{circle.description}</Text>
                      <Text style={styles.circleMembers}>
                        👥 {(circle.activeMembers || 150).toLocaleString()} active singles
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.joinBtn,
                        isSelected
                          ? { backgroundColor: colorConfig.primary }
                          : { backgroundColor: '#2C2F3C' },
                      ]}>
                      <Text
                        style={[
                          styles.joinBtnText,
                          isSelected ? { color: '#FFFFFF', fontWeight: '800' } : { color: '#CACDD8' },
                        ]}>
                        {isSelected ? '✓ Joined' : '+ Join'}
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
          selectedName={selectedCircles[0]}
          selectedNames={selectedCircles}
          maxSelections={5}
          initialCity={cityFilter !== 'All Cities' ? cityFilter : undefined}
          onSelectMultiple={(chosen) => {
            const names = chosen.map((c) => c.name);
            setSelectedCircles(names);
            api.updateMyProfile({
              microCircles: names,
              microCircle: names[0] || '',
            }).catch((err) => console.warn('Failed to persist community selection:', err));
          }}
          onSelect={(circle) => {
            if (circle) {
              handleToggleCircle(circle.name);
              if (circle.city) setCityFilter(circle.city);
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
                  activeOpacity={0.8}
                  accessibilityLabel="Close Instagram Story Card"
                  onPress={() => setShowInstaVibeModal(false)}>
                  <View style={styles.crossIconContainer}>
                    <View style={[styles.crossLine, { transform: [{ rotate: '45deg' }] }]} />
                    <View style={[styles.crossLine, { transform: [{ rotate: '-45deg' }] }]} />
                  </View>
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

                  {/* OPTION 3: Dynamic Card Information & Vedic Customizer */}
                  <View style={styles.optionSectionBox}>
                    <View style={styles.optionSectionHeader}>
                      <View style={styles.optionStepBadge}>
                        <Text style={styles.optionStepBadgeText}>3</Text>
                      </View>
                      <Text style={styles.optionSectionTitle}>Dynamic Card Data & Vibe Prompt</Text>
                    </View>
                    <Text style={styles.optionSectionSub}>Edit any value in real time — synced from profile & live on your card</Text>

                    <View style={styles.optionInfoCard}>
                      {/* Name & Guna Score Row */}
                      <View style={styles.optionFormRow}>
                        <View style={{ flex: 3 }}>
                          <Text style={styles.optionFieldLabel}>DISPLAY NAME</Text>
                          <TextInput
                            style={styles.optionFieldInput}
                            value={cardName}
                            onChangeText={setCardName}
                            placeholder={userName}
                            placeholderTextColor="#64748B"
                          />
                        </View>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.optionFieldLabel}>36-GUNA SCORE</Text>
                          <TextInput
                            style={[styles.optionFieldInput, { color: activeTheme.accentColor, fontWeight: '800' }]}
                            value={cardGunaScore}
                            onChangeText={setCardGunaScore}
                            placeholder="34.5"
                            placeholderTextColor="#64748B"
                          />
                        </View>
                      </View>

                      {/* Age & Role (One-Liner) */}
                      <View style={{ marginBottom: 9 }}>
                        <Text style={styles.optionFieldLabel}>AGE & ROLE (ONE-LINER)</Text>
                        <TextInput
                          style={styles.optionFieldInput}
                          value={cardRole}
                          onChangeText={setCardRole}
                          placeholder={activeRole}
                          placeholderTextColor="#64748B"
                        />
                      </View>

                      {/* Micro-Tribe / Community (One-Liner) */}
                      <View style={{ marginBottom: 9 }}>
                        <Text style={styles.optionFieldLabel}>MICRO-TRIBE / COMMUNITY (ONE-LINER)</Text>
                        <TextInput
                          style={styles.optionFieldInput}
                          value={cardTribe}
                          onChangeText={setCardTribe}
                          placeholder={activeTribe}
                          placeholderTextColor="#64748B"
                        />
                      </View>

                      {/* Vedic Kundali: Moon & Nakshatra */}
                      <View style={styles.optionFormRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionFieldLabel}>🌙 MOON SIGN</Text>
                          <TextInput
                            style={styles.optionFieldInput}
                            value={cardMoon}
                            onChangeText={setCardMoon}
                            placeholder={activeMoon}
                            placeholderTextColor="#64748B"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionFieldLabel}>⭐ NAKSHATRA & PADA</Text>
                          <TextInput
                            style={styles.optionFieldInput}
                            value={cardNakshatra}
                            onChangeText={setCardNakshatra}
                            placeholder={activeNakshatra}
                            placeholderTextColor="#64748B"
                          />
                        </View>
                      </View>

                      {/* 3D Biometric Badge text */}
                      <View style={{ marginBottom: 9 }}>
                        <Text style={styles.optionFieldLabel}>3D BIOMETRIC BADGE</Text>
                        <TextInput
                          style={[styles.optionFieldInput, { color: '#34D399', fontWeight: '700' }]}
                          value={card3DVerifiedText}
                          onChangeText={setCard3DVerifiedText}
                          placeholder="✓ 100% 3D BIOMETRIC VERIFIED"
                          placeholderTextColor="#64748B"
                        />
                      </View>

                      {/* Editorial Vibe Prompt with Word Limit & Reroll */}
                      <View style={styles.optionPromptBox}>
                        <View style={styles.optionPromptHeader}>
                          <Text style={styles.optionPromptTag}>✦ EDITORIAL VIBE PROMPT</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View
                              style={[
                                styles.optionWordLimitPill,
                                countWords(activeQuote) >= MAX_PROMPT_WORDS && styles.optionWordLimitPillMax,
                              ]}>
                              <Text
                                style={[
                                  styles.optionWordLimitText,
                                  countWords(activeQuote) >= MAX_PROMPT_WORDS && styles.optionWordLimitTextMax,
                                ]}>
                                {countWords(activeQuote)}/{MAX_PROMPT_WORDS} words
                              </Text>
                            </View>
                            <TouchableOpacity onPress={handleNextFact} style={styles.optionRerollBtn}>
                              <Text style={styles.optionRerollBtnText}>🎲 Reroll</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <TextInput
                          style={styles.optionPromptInput}
                          value={cardQuote || currentFact.factText}
                          onChangeText={handlePromptChange}
                          multiline
                          numberOfLines={2}
                          maxLength={120}
                          placeholder="Type a punchy 1-2 line vibe prompt..."
                          placeholderTextColor="#64748B"
                        />
                        <Text style={styles.optionPromptSubtext}>
                          ⚡ Strictly capped at {MAX_PROMPT_WORDS} words so it fits cleanly in 2 lines on your 9:16 Story card.
                        </Text>
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

                    {/* Soft Cinematic Vignette: strictly on the bottom 1/3 for high text contrast; top 2/3 is 100% clean photo */}
                    <View style={styles.instaVignetteBottom} />

                    {/* Bottom Luxury Tray: All content strictly fitted within bottom 1/3 with zero overlapping */}
                    <View style={styles.instaBottomTrayMobile}>
                      {/* Row 1: Name + 36-Guna Synastry Badge */}
                      <View style={styles.instaCompactHeaderRow}>
                        <Text style={styles.instaUserNameMobile} numberOfLines={1} ellipsizeMode="tail">
                          {activeName}
                        </Text>
                        <View
                          style={[
                            styles.instaGunaPill,
                            { borderColor: activeTheme.borderColor, backgroundColor: activeTheme.badgeBg },
                          ]}>
                          <Text style={[styles.instaGunaPillScore, { color: activeTheme.accentColor }]}>
                            ✨ {activeGuna} / 36
                          </Text>
                        </View>
                      </View>

                      {/* Row 2: 3D Biometric Badge (One-liner) */}
                      <View style={styles.insta3DVerifiedBadge}>
                        <Text style={styles.insta3DVerifiedBadgeText} numberOfLines={1} ellipsizeMode="tail">
                          {card3DVerifiedText}
                        </Text>
                      </View>

                      {/* Row 3: Age & Role (One-liner) */}
                      <Text style={styles.instaUserRoleMobile} numberOfLines={1} ellipsizeMode="tail">
                        {activeRole}
                      </Text>

                      {/* Row 4: Micro-Tribe / Community (One-liner in category colors) */}
                      {(() => {
                        const tribeColor = getCommunityColor(activeTribe);
                        return (
                          <View
                            style={[
                              styles.instaTribePill,
                              {
                                backgroundColor: tribeColor.tagBg,
                                borderColor: tribeColor.tagBorder,
                              },
                            ]}>
                            <Text style={{ fontSize: 9 }}>{tribeColor.emoji}</Text>
                            <Text
                              style={[styles.instaUserTribeMobile, { color: tribeColor.textColor }]}
                              numberOfLines={1}
                              ellipsizeMode="tail">
                              {activeTribe}
                            </Text>
                          </View>
                        );
                      })()}

                      {/* Row 5: Cosmic Pills (Moon & Nakshatra inline) */}
                      <View style={styles.instaKundaliInlineRow}>
                        <View style={styles.instaKundaliTag}>
                          <Text style={styles.instaKundaliTagText} numberOfLines={1} ellipsizeMode="tail">
                            🌙 {activeMoon}
                          </Text>
                        </View>
                        <View style={styles.instaKundaliTag}>
                          <Text style={styles.instaKundaliTagText} numberOfLines={1} ellipsizeMode="tail">
                            ⭐ {activeNakshatra}
                          </Text>
                        </View>
                      </View>

                      {/* Row 6: Vibe Quote (1-2 lines, strictly clamped) */}
                      <Text style={styles.instaPromptTrayQuote} numberOfLines={2} ellipsizeMode="tail">
                        &ldquo;{activeQuote}&rdquo;
                      </Text>

                      {/* Row 7: Watermark */}
                      <View style={styles.instaWatermarkMobile}>
                        <Text style={styles.instaWatermarkText}>BlunderR • High-Intent Dating</Text>
                        <Text style={styles.instaWatermarkHandle}>@blunderr.in</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Action Controls */}
                  <View style={styles.vibeModalActionRow}>
                    <TouchableOpacity
                      style={styles.vibeModalCloseCircleActionBtn}
                      activeOpacity={0.8}
                      accessibilityLabel="Close Instagram Story Card"
                      onPress={() => setShowInstaVibeModal(false)}>
                      <View style={styles.crossIconContainerSmall}>
                        <View style={[styles.crossLineSmall, { transform: [{ rotate: '45deg' }] }]} />
                        <View style={[styles.crossLineSmall, { transform: [{ rotate: '-45deg' }] }]} />
                      </View>
                    </TouchableOpacity>

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
  activeJoinedBar: {
    marginBottom: 12,
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.25)',
  },
  activeJoinedBarTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E94057',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  activeJoinedScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeJoinedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E94057',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  activeJoinedChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 160,
  },
  activeJoinedChipRemove: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '800',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF385C',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
    marginLeft: 10,
  },
  crossIconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossLine: {
    position: 'absolute',
    width: 16,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  vibeModalCloseCircleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF385C',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 6,
    marginRight: 4,
  },
  crossIconContainerSmall: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossLineSmall: {
    position: 'absolute',
    width: 15,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
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
  optionFormRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 9,
  },
  optionFieldLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  optionFieldInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  optionWordLimitPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(252, 211, 77, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.3)',
  },
  optionWordLimitPillMax: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  optionWordLimitText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FCD34D',
  },
  optionWordLimitTextMax: {
    color: '#FB7185',
  },
  optionPromptInput: {
    color: '#F1F5F9',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 4,
    minHeight: 46,
  },
  optionPromptSubtext: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
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
    justifyContent: 'flex-end',
    padding: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#070912',
  },
  instaVignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 185,
    backgroundColor: 'rgba(6, 8, 16, 0.88)',
  },
  instaBottomTrayMobile: {
    position: 'relative',
    zIndex: 20,
    flexDirection: 'column',
    gap: 4,
    backgroundColor: 'rgba(10, 13, 24, 0.86)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
  },
  instaCompactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  instaUserNameMobile: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
    marginRight: 6,
  },
  instaGunaPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instaGunaPillScore: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  insta3DVerifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  insta3DVerifiedBadgeText: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  instaUserRoleMobile: {
    color: '#FDA4AF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  instaTribePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  instaUserTribeMobile: {
    fontSize: 9.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  instaKundaliInlineRow: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
  },
  instaKundaliTag: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instaKundaliTagText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '700',
  },
  instaPromptTrayQuote: {
    color: '#F1F5F9',
    fontSize: 9.5,
    lineHeight: 13,
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
    fontSize: 8,
    fontWeight: '600',
  },
  instaWatermarkHandle: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
});
