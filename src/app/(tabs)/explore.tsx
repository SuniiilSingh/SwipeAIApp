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

interface KundaliVibeFact {
  id: string;
  badge: string;
  headline: string;
  factText: string;
  compatibilityNote: string;
  gunaScore: string;
}

export default function ExploreScreen() {
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
    setShowInstaVibeModal(true);
  };

  const handleNextFact = () => {
    hapticFeedback.light();
    setActiveFactIdx((prev) => (prev + 1) % kundaliVibeFacts.length);
  };

  const handleShareInstaStory = async () => {
    hapticFeedback.success();
    const shareMessage =
      `✨ My BlunderR Cosmic Kundali Vibe Card ✨\n\n` +
      `👤 ${userName} • 📍 ${userTribe}\n` +
      `🌙 Moon (Rashi): ${chandraRashi}\n` +
      `⭐ Nakshatra: ${nakshatraName} (Pada ${nakshatraPada})\n` +
      `☀️ Sun Sign: ${sunSign} | 🪐 Lord: ${rashiLord}\n\n` +
      `${currentFact.badge}\n` +
      `"${currentFact.factText}"\n\n` +
      `💫 ${currentFact.gunaScore}\n` +
      `🔥 Check our 36-Guna Kundali & Neighborhood Vibe on BlunderR: https://blunderr.in`;

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: 'My BlunderR Cosmic Kundali Vibe Card',
            text: shareMessage,
            url: 'https://blunderr.in',
          });
          return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert(
            'Copied for Instagram Story! 📸',
            'Your BlunderR Kundali Vibe Card caption & cosmic fact have been copied. Screenshot this card and post it to your Instagram Story!'
          );
          return;
        }
      }
      await Share.share({
        title: 'My BlunderR Cosmic Kundali Vibe Card',
        message: shareMessage,
      });
    } catch {
      Alert.alert(
        'Ready for Instagram! 📸',
        'Take a screenshot of this BlunderR Kundali Vibe Card and share it directly to your Instagram Story!'
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
                source={{ uri: currentMeme.url }}
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
              {/* Modal Top Controls */}
              <View style={styles.vibeModalTopRow}>
                <View>
                  <Text style={styles.vibeModalTopTitle}>📲 Instagram Vibe Card</Text>
                  <Text style={styles.vibeModalTopSub}>
                    Screenshot or share directly to your Instagram Story
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.vibeModalCloseBtn}
                  onPress={() => setShowInstaVibeModal(false)}>
                  <Text style={styles.vibeModalCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={{ paddingBottom: 12 }}
                showsVerticalScrollIndicator={false}>
                {/* THE SHAREABLE INSTAGRAM STORY CARD */}
                <View style={styles.instaStoryCard}>
                  {/* Decorative Cosmic Glow Orbs */}
                  <View style={styles.instaGlowOrbTop} />
                  <View style={styles.instaGlowOrbBottom} />

                  {/* 1. BLUNDERR BRAND HEADER (Logo + Name) */}
                  <View style={styles.instaBrandHeader}>
                    <View style={styles.instaBrandLeft}>
                      <View style={styles.instaLogoWrap}>
                        <ExpoImage
                          source={require('../../../assets/images/icon.png')}
                          style={styles.instaLogoImg}
                          contentFit="cover"
                        />
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={styles.instaBrandName}>BlunderR</Text>
                          <View style={styles.instaVerifiedDot}>
                            <Text style={styles.instaVerifiedDotText}>✓</Text>
                          </View>
                        </View>
                        <Text style={styles.instaBrandTagline}>
                          VEDIC KUNDALI × COSMIC VIBE CHECK
                        </Text>
                      </View>
                    </View>
                    <View style={styles.instaStoryPill}>
                      <Text style={styles.instaStoryPillText}>🪐 36-GUNA AI</Text>
                    </View>
                  </View>

                  {/* 2. USER IDENTITY & TRIBE BANNER */}
                  <View style={styles.instaUserBanner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.instaUserName}>{userName}</Text>
                      <Text style={styles.instaUserTribe}>📍 {userTribe}</Text>
                    </View>
                    <View style={styles.instaGunaBadge}>
                      <Text style={styles.instaGunaBadgeNum}>
                        {currentFact.gunaScore.split(' ')[0]}
                      </Text>
                      <Text style={styles.instaGunaBadgeSub}>/ 36 GUNAS</Text>
                    </View>
                  </View>

                  {/* 3. KUNDALI PLANETARY PILLS GRID */}
                  <View style={styles.instaKundaliGrid}>
                    <View style={styles.instaKundaliCell}>
                      <Text style={styles.instaKundaliCellLabel}>🌙 CHANDRA RASHI</Text>
                      <Text style={styles.instaKundaliCellValue}>{chandraRashi}</Text>
                    </View>
                    <View style={styles.instaKundaliCell}>
                      <Text style={styles.instaKundaliCellLabel}>⭐ NAKSHATRA</Text>
                      <Text style={styles.instaKundaliCellValue}>
                        {nakshatraName} (Pada {nakshatraPada})
                      </Text>
                    </View>
                    <View style={styles.instaKundaliCell}>
                      <Text style={styles.instaKundaliCellLabel}>☀️ SUN SIGN</Text>
                      <Text style={styles.instaKundaliCellValue}>{sunSign}</Text>
                    </View>
                    <View style={styles.instaKundaliCell}>
                      <Text style={styles.instaKundaliCellLabel}>🪐 RASHI LORD</Text>
                      <Text style={styles.instaKundaliCellValue}>{rashiLord}</Text>
                    </View>
                  </View>

                  {/* 4. INTERESTING KUNDALI FACT SPOTLIGHT BOX */}
                  <View style={styles.instaFactBox}>
                    <View style={styles.instaFactBadgeRow}>
                      <Text style={styles.instaFactBadgeText}>{currentFact.badge}</Text>
                      <Text style={styles.instaFactCounter}>
                        #{activeFactIdx + 1}/{kundaliVibeFacts.length}
                      </Text>
                    </View>
                    <Text style={styles.instaFactHeadline}>{currentFact.headline}</Text>
                    <Text style={styles.instaFactBody}>&ldquo;{currentFact.factText}&rdquo;</Text>
                    <View style={styles.instaFactMatchBar}>
                      <Text style={styles.instaFactMatchText}>
                        💫 {currentFact.compatibilityNote}
                      </Text>
                    </View>
                  </View>

                  {/* 5. COMPACT VEDIC KUNDALI CHART DIAMOND */}
                  <View style={styles.instaChartContainer}>
                    <KundaliChartDiamond
                      lagnaSign={astrology?.lagnaSign || chandraRashi}
                      chandraRashi={chandraRashi}
                      sunSign={sunSign}
                      nakshatraName={nakshatraName}
                      isManglik={isManglik}
                    />
                  </View>

                  {/* 6. BLUNDERR BRAND FOOTER WATERMARK */}
                  <View style={styles.instaBrandFooter}>
                    <View style={styles.instaFooterLeft}>
                      <ExpoImage
                        source={require('../../../assets/images/icon.png')}
                        style={styles.instaFooterLogo}
                        contentFit="cover"
                      />
                      <View>
                        <Text style={styles.instaFooterBrand}>
                          BlunderR • Verified Cosmic Dating
                        </Text>
                        <Text style={styles.instaFooterUrl}>
                          Check our 36-Guna Kundali match at blunderr.in ✨
                        </Text>
                      </View>
                    </View>
                    <View style={styles.instaFooterTag}>
                      <Text style={styles.instaFooterTagText}>@BlunderR.in</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Action Buttons */}
              <View style={styles.vibeModalActionRow}>
                <TouchableOpacity
                  style={styles.vibeRerollFactBtn}
                  activeOpacity={0.85}
                  onPress={handleNextFact}>
                  <Text style={styles.vibeRerollFactBtnText}>🎲 Another Kundali Fact</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.vibeShareInstaBtn}
                  activeOpacity={0.85}
                  onPress={handleShareInstaStory}>
                  <Text style={styles.vibeShareInstaBtnText}>📤 Share to Instagram</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    gap: 10,
    marginTop: 10,
  },
  vibeRerollFactBtn: {
    flex: 1,
    backgroundColor: '#1E1B36',
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  vibeRerollFactBtnText: {
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '800',
  },
  vibeShareInstaBtn: {
    flex: 1,
    backgroundColor: '#FF385C',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  vibeShareInstaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
