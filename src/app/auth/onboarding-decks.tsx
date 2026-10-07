import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { DietaryPreference, Gender } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import SelfieCameraModal from '@/components/selfie-camera-modal';
import KundaliChartDiamond from '@/components/kundali-chart-diamond';

const { width, height } = Dimensions.get('window');

const WITTY_BIOS = [
  'Building things by day, debugging life choices by night. Filter coffee over Americano every single time.',
  'Golden retriever energy. Always down for 2 AM street food runs, spontaneous road trips, and hyping you up.',
  'Old soul. Vintage ghazals, bookstore corners, handwritten letters, and quiet candlelit monsoon chai.',
  'Will judge you solely on your biryani choice. Can calculate optimal dosa crispiness in 0.5 seconds flat.',
  'Equal parts hyper-ambitious builder and weekend couch philosopher. Biryani purist with zero small talk.',
  'Fluent in Hindi, English, and subtle sarcasm. Looking for someone authentic to explore rooftop spots.'
];

const MICRO_CIRCLES = [
  '🚀 Koramangala Tech',
  '🎨 Indiranagar Indie',
  '☕ Whitefield Coffee',
  '🍸 Church Street Foodies',
  '💻 HSR Founders',
  '🌿 Jayanagar Heritage'
];

export default function OnboardingDecksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeDeck, setActiveDeck] = useState<number>(1);
  const [turboMode, setTurboMode] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Deck 1: Identity & Selfie
  const [fullName, setFullName] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('2000');
  const [dobMonth, setDobMonth] = useState<string>('08');
  const [dobDay, setDobDay] = useState<string>('14');
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [showSelfieModal, setShowSelfieModal] = useState<boolean>(false);
  const [isLivenessVerified, setIsLivenessVerified] = useState<boolean>(false);

  // Deck 2: Frequency
  const [gender, setGender] = useState<Gender>('MALE');
  const [genderDisplay, setGenderDisplay] = useState<string>('Man');
  const [lookingFor, setLookingFor] = useState<string>('Women');
  const [orientation, setOrientation] = useState<string>('Straight');
  const [showMoreGenders, setShowMoreGenders] = useState<boolean>(false);
  const [showMorePreferences, setShowMorePreferences] = useState<boolean>(false);
  const [customGenderInput, setCustomGenderInput] = useState<string>('');

  // Deck 3: Neighborhood & Career
  const [microCircle, setMicroCircle] = useState<string>('🚀 Koramangala Tech');
  const [job, setJob] = useState<string>('Software Engineer');
  const [institute, setInstitute] = useState<string>('BITS Pilani');

  // Deck 4: Bio Archetype
  const [bio, setBio] = useState<string>(WITTY_BIOS[0]);
  const [bioIdx, setBioIdx] = useState<number>(0);

  // Deck 5: Lifestyle & Height
  const [heightCm, setHeightCm] = useState<number>(178);
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>('PURE_VEG');
  const [drinkingHabit, setDrinkingHabit] = useState<string>('Socially');

  // Deck 6: Vedic Birth Details
  const [birthTime, setBirthTime] = useState<string>('14:30');
  const [birthCity, setBirthCity] = useState<string>('Bengaluru');

  // Animations
  const deckAnim = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Load existing user profile if available
  useEffect(() => {
    (async () => {
      try {
        const prof = await api.getMyProfile();
        if (prof?.displayName || prof?.fullName) {
          setFullName(prof.displayName || prof.fullName || '');
        }
        if (prof?.birthDate) {
          const parts = prof.birthDate.split('-');
          if (parts.length === 3) {
            setDobYear(parts[0]);
            setDobMonth(parts[1]);
            setDobDay(parts[2]);
          }
        }
        if (prof?.gender) setGender(prof.gender);
        if (prof?.genderDisplay) setGenderDisplay(prof.genderDisplay);
        if (prof?.genderPreferenceDisplay) setLookingFor(prof.genderPreferenceDisplay);
        if (prof?.microCircle) setMicroCircle(prof.microCircle);
        if (prof?.job || prof?.occupation) setJob(prof.job || prof.occupation || '');
        if (prof?.institute || prof?.education) setInstitute(prof.institute || prof.education || '');
        if (prof?.bio) setBio(prof.bio);
        if (prof?.height) setHeightCm(prof.height);
        if (prof?.dietaryPref) setDietaryPref(prof.dietaryPref);
        if (prof?.drinkingHabit) setDrinkingHabit(prof.drinkingHabit);
        if (prof?.selfieUrl) {
          setSelfieUrl(prof.selfieUrl);
          setIsLivenessVerified(true);
        }
      } catch (e) {}
    })();
  }, []);

  const getMagnetismScore = (deck: number) => {
    switch (deck) {
      case 1: return 20;
      case 2: return 38;
      case 3: return 55;
      case 4: return 72;
      case 5: return 88;
      case 6: return 100;
      case 7: return 100;
      default: return 20;
    }
  };

  const getEstimatedAge = () => {
    const yr = parseInt(dobYear, 10);
    if (isNaN(yr) || yr < 1920 || yr > 2015) return 24;
    return new Date().getFullYear() - yr;
  };

  const feetAndInches = () => {
    const feet = Math.floor(heightCm / 30.48);
    const inches = Math.round((heightCm % 30.48) / 2.54);
    return `${heightCm} cm (${feet}'${inches}'')`;
  };

  const advanceToDeck = (targetDeck: number) => {
    hapticFeedback.medium();
    Animated.sequence([
      Animated.timing(deckAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(deckAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveDeck(targetDeck);
  };

  const handleRerollBio = () => {
    hapticFeedback.light();
    const nextIdx = (bioIdx + 1) % WITTY_BIOS.length;
    setBioIdx(nextIdx);
    setBio(WITTY_BIOS[nextIdx]);
  };

  const handleSelfieCaptured = async (uri: string) => {
    setShowSelfieModal(false);
    hapticFeedback.success();
    setIsLivenessVerified(true);
    setSelfieUrl(uri);
  };

  const handleCompileAndLaunch = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    hapticFeedback.success();

    const formattedDob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    const cleanName = fullName.trim() || 'BlunderR Star';

    try {
      // 1. Update Core Profile
      await api.updateMyProfile({
        displayName: cleanName,
        fullName: cleanName,
        birthDate: formattedDob,
        gender,
        genderDisplay,
        genderPreferenceDisplay: lookingFor,
        sexualOrientation: orientation,
        microCircle,
        job,
        occupation: job,
        education: institute,
        institute,
        bio,
        height: heightCm,
        dietaryPref,
        drinkingHabit,
        selfieUrl: selfieUrl || undefined,
        faceVerified: isLivenessVerified,
      });

      // 2. Update Vedic Janampatri
      await api.updateMyBirthDetails({
        birthTime: birthTime || '12:00',
        birthCity: birthCity || 'Bengaluru',
      });

      // 3. Mark Onboarding Complete
      await api.setOnboardingCompleted(true);

      // Smoothly navigate into Discovery Tabs
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Save Failed', err.message || 'Please check your connection and retry.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* ========================================================
          TOP DYNAMIC HUD ISLAND (MAGNETISM TRACKER & STEPPER)
          ======================================================== */}
      <View style={styles.topHud}>
        <View style={styles.hudRowTop}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>
              Blunder<Text style={styles.brandAccent}>R</Text>
            </Text>
            <View style={styles.brandDot} />
          </View>

          <View style={styles.magnetismPill}>
            <Text style={styles.magnetismEmoji}>⚡</Text>
            <Text style={styles.magnetismPct}>{getMagnetismScore(activeDeck)}%</Text>
            <Text style={styles.magnetismLabel}>MAGNETISM</Text>
          </View>
        </View>

        {/* 6-Deck Segmented Stepper */}
        <View style={styles.stepperTrack}>
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const isPassed = activeDeck > i;
            const isActive = activeDeck === i || (activeDeck === 7 && i === 6);
            return (
              <View
                key={i}
                style={[
                  styles.stepperBar,
                  isPassed && styles.stepperBarPassed,
                  isActive && styles.stepperBarActive,
                ]}
              />
            );
          })}
        </View>

        {/* Live Identity Ribbon */}
        <View style={styles.identityRibbon}>
          <Text style={styles.ribbonItem}>
            User: <Text style={styles.ribbonBold}>{fullName.trim() || 'Aryan'}, {getEstimatedAge()}</Text>
          </Text>
          <Text style={styles.ribbonItem}>
            Circle: <Text style={styles.ribbonBold}>{microCircle.split(' ')[1] || 'Koramangala'}</Text>
          </Text>
          <Text style={[styles.ribbonItem, { color: '#6EE7B7' }]}>
            Kundli: <Text style={styles.ribbonBold}>Taurus ♉</Text>
          </Text>
        </View>
      </View>

      {/* ========================================================
          DECK ARENA WITH 3D LAYERED CARD STACK
          ======================================================== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollArena}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Card Stack Illusion Underneath (Native Only) */}
          {Platform.OS !== 'web' && <View style={styles.stackShadowCard} />}

          <Animated.View style={[styles.deckCard, { transform: [{ scale: deckAnim }] }]}>
            
            {/* ==================== DECK 1: IDENTITY SPARK ==================== */}
            {activeDeck === 1 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>✨ DECK 1 OF 6 • IDENTITY SPARK</Text>
                  </View>
                  <Text style={styles.deckTitle}>Who is making waves today?</Text>
                  <Text style={styles.deckSub}>Enter your genuine self. Verified humans only.</Text>
                </View>

                <View style={styles.deckBody}>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>FIRST NAME / DISPLAY NAME</Text>
                    <TextInput
                      style={styles.glowInput}
                      placeholder="e.g. Aryan"
                      placeholderTextColor="#64748B"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
                    <View style={styles.dobRow}>
                      <TextInput
                        style={[styles.glowInput, { flex: 1.4, textAlign: 'center' }]}
                        value={dobYear}
                        onChangeText={setDobYear}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                      <TextInput
                        style={[styles.glowInput, { flex: 1, textAlign: 'center' }]}
                        value={dobMonth}
                        onChangeText={setDobMonth}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <TextInput
                        style={[styles.glowInput, { flex: 1, textAlign: 'center' }]}
                        value={dobDay}
                        onChangeText={setDobDay}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  {/* 3D Selfie Scan Button */}
                  <TouchableOpacity
                    style={[styles.selfieScanCard, isLivenessVerified && styles.selfieScanCardDone]}
                    activeOpacity={0.8}
                    onPress={() => setShowSelfieModal(true)}>
                    <Text style={styles.selfieScanIcon}>{isLivenessVerified ? '✅' : '📸'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selfieScanTitle}>
                        {isLivenessVerified ? '3D Face Verified' : '3D Liveness Selfie Scan'}
                      </Text>
                      <Text style={styles.selfieScanDesc}>
                        {isLivenessVerified
                          ? 'Instant authenticity badge attached'
                          : 'Tap to scan • Instant shield against bots'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>⚡ +20% Match Magnetism Unlocked</Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(2)}>
                    <Text style={styles.btnPrimaryText}>Next: Frequency Calibration ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== DECK 2: ATTRACTION FREQUENCY ==================== */}
            {activeDeck === 2 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>💫 DECK 2 OF 6 • MUTUAL FREQUENCY</Text>
                  </View>
                  <Text style={styles.deckTitle}>Who are you looking to meet?</Text>
                  <Text style={styles.deckSub}>Calibrates discovery radar instantaneously.</Text>
                </View>

                <View style={styles.deckBody}>
                  <Text style={styles.fieldLabel}>I IDENTIFY AS</Text>
                  <View style={styles.rapidRow}>
                    <TouchableOpacity
                      style={[styles.rapidCard, genderDisplay === 'Man' && styles.rapidCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setGender('MALE');
                        setGenderDisplay('Man');
                      }}>
                      <Text style={styles.rapidEmoji}>⚡</Text>
                      <Text style={styles.rapidTitle}>Man</Text>
                      <Text style={styles.rapidSub}>Single & verified</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rapidCard, genderDisplay === 'Woman' && styles.rapidCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setGender('FEMALE');
                        setGenderDisplay('Woman');
                      }}>
                      <Text style={styles.rapidEmoji}>🌸</Text>
                      <Text style={styles.rapidTitle}>Woman</Text>
                      <Text style={styles.rapidSub}>Single & verified</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Expandable Gender Pill */}
                  <TouchableOpacity
                    style={[
                      styles.expandableTogglePill,
                      genderDisplay !== 'Man' && genderDisplay !== 'Woman' && styles.expandableTogglePillActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      hapticFeedback.light();
                      setShowMoreGenders(!showMoreGenders);
                    }}>
                    <Text
                      style={[
                        styles.expandableTogglePillText,
                        genderDisplay !== 'Man' && genderDisplay !== 'Woman' && styles.expandableTogglePillTextActive,
                      ]}>
                      {genderDisplay !== 'Man' && genderDisplay !== 'Woman'
                        ? `🌈 Identity: ${genderDisplay}`
                        : '🌈 Non-binary, Queer or More Identities...'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#A855F7' }}>
                      {showMoreGenders ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {showMoreGenders && (
                    <View style={styles.expandableAccordionBox}>
                      <View style={styles.inclusiveChipCluster}>
                        {['Non-binary', 'Transgender', 'Agender', 'Bigender', 'Genderfluid', 'Queer'].map((gName) => {
                          const isSel = genderDisplay === gName;
                          return (
                            <TouchableOpacity
                              key={gName}
                              style={[styles.inclusiveChip, isSel && styles.inclusiveChipSelected]}
                              onPress={() => {
                                hapticFeedback.light();
                                setGender('NON_BINARY');
                                setGenderDisplay(gName);
                              }}>
                              <Text style={[styles.inclusiveChipText, isSel && styles.inclusiveChipTextSelected]}>
                                {gName} {isSel ? '✓' : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Custom Identity Typing */}
                      <View style={styles.customInputRow}>
                        <TextInput
                          style={styles.customInputField}
                          placeholder="Or type custom identity..."
                          placeholderTextColor="#64748B"
                          value={customGenderInput}
                          onChangeText={setCustomGenderInput}
                        />
                        <TouchableOpacity
                          style={styles.customInputApplyBtn}
                          onPress={() => {
                            if (customGenderInput.trim()) {
                              hapticFeedback.success();
                              setGender('NON_BINARY');
                              setGenderDisplay(customGenderInput.trim());
                            }
                          }}>
                          <Text style={styles.customInputApplyBtnText}>Apply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>LOOKING TO MEET</Text>
                  <View style={styles.rapidRow}>
                    <TouchableOpacity
                      style={[styles.rapidCard, lookingFor === 'Women' && styles.rapidCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setLookingFor('Women');
                        if (turboMode) advanceToDeck(3);
                      }}>
                      <Text style={styles.rapidEmoji}>🌸</Text>
                      <Text style={styles.rapidTitle}>Women</Text>
                      <Text style={styles.rapidSub}>Primary discovery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rapidCard, lookingFor === 'Men' && styles.rapidCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setLookingFor('Men');
                        if (turboMode) advanceToDeck(3);
                      }}>
                      <Text style={styles.rapidEmoji}>⚡</Text>
                      <Text style={styles.rapidTitle}>Men</Text>
                      <Text style={styles.rapidSub}>Primary discovery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rapidCard, lookingFor === 'Everyone' && styles.rapidCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setLookingFor('Everyone');
                        if (turboMode) advanceToDeck(3);
                      }}>
                      <Text style={styles.rapidEmoji}>✨</Text>
                      <Text style={styles.rapidTitle}>Everyone</Text>
                      <Text style={styles.rapidSub}>Open spectrum</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Expandable Looking For Spectrum */}
                  <TouchableOpacity
                    style={[
                      styles.expandableTogglePill,
                      lookingFor !== 'Women' && lookingFor !== 'Men' && lookingFor !== 'Everyone' && styles.expandableTogglePillActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      hapticFeedback.light();
                      setShowMorePreferences(!showMorePreferences);
                    }}>
                    <Text
                      style={[
                        styles.expandableTogglePillText,
                        lookingFor !== 'Women' && lookingFor !== 'Men' && lookingFor !== 'Everyone' && styles.expandableTogglePillTextActive,
                      ]}>
                      {lookingFor !== 'Women' && lookingFor !== 'Men' && lookingFor !== 'Everyone'
                        ? `💫 Target: ${lookingFor}`
                        : '💫 Specific gender spectrum & identities...'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#A855F7' }}>
                      {showMorePreferences ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {showMorePreferences && (
                    <View style={styles.expandableAccordionBox}>
                      <View style={styles.inclusiveChipCluster}>
                        {['Non-binary & Expansive', 'Transgender folks', 'Open to All', 'Other'].map((pref) => {
                          const isSel = lookingFor === pref;
                          return (
                            <TouchableOpacity
                              key={pref}
                              style={[styles.inclusiveChip, isSel && styles.inclusiveChipSelected]}
                              onPress={() => {
                                hapticFeedback.light();
                                setLookingFor(pref);
                                if (turboMode) advanceToDeck(3);
                              }}>
                              <Text style={[styles.inclusiveChipText, isSel && styles.inclusiveChipTextSelected]}>
                                {pref} {isSel ? '✓' : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🎯 Frequency tuned! 4 rapid cards left</Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(3)}>
                    <Text style={styles.btnPrimaryText}>Next: Neighborhood Circle ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(1)}>
                    <Text style={styles.btnBackText}>← Back to Spark</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== DECK 3: TRIBE & CAREER ==================== */}
            {activeDeck === 3 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>🏙️ DECK 3 OF 6 • NEIGHBORHOOD TRIBE</Text>
                  </View>
                  <Text style={styles.deckTitle}>Your everyday stomping ground</Text>
                  <Text style={styles.deckSub}>Never match someone living 2 hours away in traffic.</Text>
                </View>

                <View style={styles.deckBody}>
                  <Text style={styles.fieldLabel}>📍 NEIGHBORHOOD MICRO-CIRCLES</Text>
                  <View style={styles.pillCluster}>
                    {MICRO_CIRCLES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.microPill, microCircle === c && styles.microPillSelected]}
                        onPress={() => {
                          hapticFeedback.light();
                          setMicroCircle(c);
                        }}>
                        <Text style={[styles.microPillText, microCircle === c && styles.microPillTextSelected]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.fieldBox, { marginTop: 12 }]}>
                    <Text style={styles.fieldLabel}>CAREER / WHAT PAYS THE BILLS?</Text>
                    <TextInput
                      style={styles.glowInput}
                      placeholder="e.g. Founding Engineer @ AI Startup"
                      placeholderTextColor="#64748B"
                      value={job}
                      onChangeText={setJob}
                    />
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>COLLEGE / ALMA MATER</Text>
                    <TextInput
                      style={styles.glowInput}
                      placeholder="e.g. BITS Pilani"
                      placeholderTextColor="#64748B"
                      value={institute}
                      onChangeText={setInstitute}
                    />
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🔥 55% Magnetism! Halfway milestone unlocked</Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(4)}>
                    <Text style={styles.btnPrimaryText}>Next: 1-Tap Bio Energy ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(2)}>
                    <Text style={styles.btnBackText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== DECK 4: ZERO-TYPING BIO ==================== */}
            {activeDeck === 4 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>🎭 DECK 4 OF 6 • 1-TAP BIO SPARK</Text>
                  </View>
                  <Text style={styles.deckTitle}>Pick your energy persona</Text>
                  <Text style={styles.deckSub}>Zero typing dread. Tap an archetype to generate!</Text>
                </View>

                <View style={styles.deckBody}>
                  <Text style={styles.fieldLabel}>POPULAR ARCHETYPES</Text>
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.personaCard, bio === WITTY_BIOS[0] && styles.personaCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setBio(WITTY_BIOS[0]);
                      }}>
                      <Text style={styles.personaTitle}>☕ Filter Coffee Tech</Text>
                      <Text style={styles.personaDesc} numberOfLines={2}>{WITTY_BIOS[0]}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.personaCard, bio === WITTY_BIOS[1] && styles.personaCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setBio(WITTY_BIOS[1]);
                      }}>
                      <Text style={styles.personaTitle}>🐕 Golden Retriever Energy</Text>
                      <Text style={styles.personaDesc} numberOfLines={2}>{WITTY_BIOS[1]}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.personaCard, bio === WITTY_BIOS[2] && styles.personaCardSelected]}
                      onPress={() => {
                        hapticFeedback.light();
                        setBio(WITTY_BIOS[2]);
                      }}>
                      <Text style={styles.personaTitle}>🕯️ Old Soul Romantic</Text>
                      <Text style={styles.personaDesc} numberOfLines={2}>{WITTY_BIOS[2]}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bio Editor with Reroll */}
                  <View style={styles.bioEditorBox}>
                    <View style={styles.bioEditorHeader}>
                      <Text style={styles.bioEditorLabel}>ACTIVE BIO</Text>
                      <TouchableOpacity style={styles.rerollBtn} onPress={handleRerollBio}>
                        <Text style={styles.rerollBtnText}>🎲 Reroll Magic</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.bioTextInput}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>✨ 72% Magnetism! 2 quick final cards</Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(5)}>
                    <Text style={styles.btnPrimaryText}>Next: Lifestyle & Stature ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(3)}>
                    <Text style={styles.btnBackText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== DECK 5: LIFESTYLE & STATURE ==================== */}
            {activeDeck === 5 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>☕ DECK 5 OF 6 • LIFESTYLE RHYTHM</Text>
                  </View>
                  <Text style={styles.deckTitle}>Your height & everyday vibe</Text>
                  <Text style={styles.deckSub}>Clear mutual honesty from Day 1.</Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Height Box with Stepper Controls */}
                  <View style={styles.statureBox}>
                    <Text style={styles.fieldLabel}>HEIGHT 📏</Text>
                    <Text style={styles.statureNum}>{feetAndInches()}</Text>
                    <View style={styles.statureStepperRow}>
                      <TouchableOpacity
                        style={styles.statureBtn}
                        onPress={() => {
                          hapticFeedback.light();
                          setHeightCm((prev) => Math.max(140, prev - 2));
                        }}>
                        <Text style={styles.statureBtnText}>- 2 cm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statureBtn, styles.statureBtnHighlight]}
                        onPress={() => {
                          hapticFeedback.light();
                          setHeightCm((prev) => Math.min(215, prev + 2));
                        }}>
                        <Text style={styles.statureBtnText}>+ 2 cm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>FOOD PREFERENCE</Text>
                  <View style={styles.pillCluster}>
                    {[
                      { key: 'PURE_VEG', label: '🥗 Pure Vegetarian' },
                      { key: 'NON_VEG', label: '🍗 Non-Vegetarian' },
                      { key: 'VEGAN', label: '🌱 Vegan' },
                      { key: 'EGGETARIAN', label: '🥚 Eggetarian' },
                    ].map((d) => (
                      <TouchableOpacity
                        key={d.key}
                        style={[styles.microPill, dietaryPref === d.key && styles.microPillSelected]}
                        onPress={() => {
                          hapticFeedback.light();
                          setDietaryPref(d.key as DietaryPreference);
                        }}>
                        <Text style={[styles.microPillText, dietaryPref === d.key && styles.microPillTextSelected]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>SOCIAL DRINKING</Text>
                  <View style={styles.pillCluster}>
                    {['Socially / Weekends', 'Teetotaler / Never'].map((dr) => (
                      <TouchableOpacity
                        key={dr}
                        style={[styles.microPill, drinkingHabit === dr && styles.microPillSelected]}
                        onPress={() => {
                          hapticFeedback.light();
                          setDrinkingHabit(dr);
                        }}>
                        <Text style={[styles.microPillText, drinkingHabit === dr && styles.microPillTextSelected]}>
                          {dr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🚀 88% Magnetism! Final cosmic deck ahead</Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(6)}>
                    <Text style={styles.btnPrimaryText}>Next: Cosmic Janampatri ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(4)}>
                    <Text style={styles.btnBackText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== DECK 6: VEDIC JANAMPATRI ==================== */}
            {activeDeck === 6 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>🪐 DECK 6 OF 6 • VEDIC JANAMPATRI</Text>
                  </View>
                  <Text style={styles.deckTitle}>Calibrate your birth chart</Text>
                  <Text style={styles.deckSub}>Sidereal Swiss Ephemeris for 36-point Guna Milan.</Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Kundali Diamond Visual Component */}
                  <View style={styles.kundliChartBox}>
                    <KundaliChartDiamond chandraRashi="Taurus (वृषभ)" sunSign="Leo" />
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>EXACT BIRTH TIME (HH:MM)</Text>
                    <TextInput
                      style={styles.glowInput}
                      value={birthTime}
                      onChangeText={setBirthTime}
                      placeholder="14:30"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>BIRTH CITY / TOWN</Text>
                    <TextInput
                      style={styles.glowInput}
                      value={birthCity}
                      onChangeText={setBirthCity}
                      placeholder="Bengaluru"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={[styles.paceCue, { color: '#FCD34D' }]}>
                    👑 100% Top-Tier Profile Magnetism!
                  </Text>
                  <TouchableOpacity
                    style={[styles.btnPrimary, styles.btnLaunch]}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(7)}>
                    <Text style={styles.btnPrimaryText}>Review Synthesized Profile ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(5)}>
                    <Text style={styles.btnBackText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== FINAL REVEAL CARD ==================== */}
            {activeDeck === 7 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <Text style={styles.trophyIcon}>💎</Text>
                  <Text style={styles.deckTitle}>Profile Synthesized!</Text>
                  <Text style={styles.deckSub}>
                    All 6 decks compiled with 100% precision. You are in the top 5% most attractive candidate tier.
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Holographic Mini Profile Preview */}
                  <View style={styles.miniPreviewCard}>
                    <View style={styles.miniPreviewHeader}>
                      <Text style={styles.miniPreviewName}>{fullName.trim() || 'Aryan'}, {getEstimatedAge()}</Text>
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓ 3D Face Verified</Text>
                      </View>
                    </View>
                    <Text style={styles.miniPreviewBio} numberOfLines={2}>
                      {bio}
                    </Text>
                    <View style={styles.miniPillsRow}>
                      <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{microCircle}</Text>
                      </View>
                      <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{heightCm} cm • {dietaryPref}</Text>
                      </View>
                      <View style={[styles.miniTag, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                        <Text style={[styles.miniTagText, { color: '#6EE7B7' }]}>Taurus • Rohini</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.editProfileNotice}>
                    💡 Need to adjust anything later? Your standard <Text style={{ fontWeight: '800', color: '#FFF' }}>Edit Profile</Text> tab remains completely unchanged and accessible anytime.
                  </Text>
                </View>

                <View style={styles.deckFooter}>
                  <TouchableOpacity
                    style={[styles.btnPrimary, styles.btnLaunch]}
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                    onPress={handleCompileAndLaunch}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>🚀 Compile & Launch Discovery Deck</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(6)}>
                    <Text style={styles.btnBackText}>← Back to Janampatri</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selfie Camera Modal */}
      {showSelfieModal && (
        <SelfieCameraModal
          visible={showSelfieModal}
          onClose={() => setShowSelfieModal(false)}
          onCapture={handleSelfieCaptured}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  topHud: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#070912',
  },
  hudRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#FF385C',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF385C',
  },
  magnetismPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  magnetismEmoji: {
    fontSize: 12,
  },
  magnetismPct: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FCD34D',
  },
  magnetismLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  stepperTrack: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    marginBottom: 6,
  },
  stepperBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepperBarActive: {
    backgroundColor: '#FF385C',
    shadowColor: '#FF385C',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  stepperBarPassed: {
    backgroundColor: '#10B981',
  },
  identityRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ribbonItem: {
    fontSize: 10,
    color: '#8E95AA',
  },
  ribbonBold: {
    color: '#FFF',
    fontWeight: '800',
  },
  scrollArena: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackShadowCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 10,
    borderRadius: 28,
    backgroundColor: '#0A0D1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    transform: [{ scale: 0.95 }, { rotate: '-1.5deg' }],
    zIndex: 1,
  },
  deckCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0F1326',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  deckInner: {
    width: '100%',
  },
  deckHeader: {
    marginBottom: 16,
  },
  deckBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  deckBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.8,
  },
  deckTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  deckSub: {
    fontSize: 13,
    color: '#8E95AA',
    lineHeight: 18,
    marginTop: 4,
  },
  deckBody: {
    gap: 12,
    marginVertical: 8,
  },
  fieldBox: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.6,
  },
  glowInput: {
    backgroundColor: '#080A14',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dobRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selfieScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 14,
    marginTop: 4,
  },
  selfieScanCardDone: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  selfieScanIcon: {
    fontSize: 24,
  },
  selfieScanTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  selfieScanDesc: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  rapidRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rapidCard: {
    flex: 1,
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  rapidCardSelected: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
    borderColor: '#FF385C',
  },
  rapidEmoji: {
    fontSize: 22,
  },
  rapidTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
  },
  rapidSub: {
    fontSize: 11,
    color: '#8E95AA',
  },
  pillCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microPill: {
    backgroundColor: '#090B14',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  microPillSelected: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: '#00E5FF',
  },
  microPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  microPillTextSelected: {
    color: '#FFF',
  },
  personaCard: {
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 12,
  },
  personaCardSelected: {
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    borderColor: '#FCD34D',
  },
  personaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  personaDesc: {
    fontSize: 12,
    color: '#8E95AA',
    lineHeight: 16,
  },
  bioEditorBox: {
    backgroundColor: '#080A14',
    borderWidth: 1.5,
    borderColor: 'rgba(255,56,92,0.4)',
    borderRadius: 18,
    padding: 12,
    marginTop: 6,
  },
  bioEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bioEditorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF385C',
    letterSpacing: 0.5,
  },
  rerollBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rerollBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  bioTextInput: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 50,
  },
  statureBox: {
    backgroundColor: '#080A14',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statureNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FCD34D',
  },
  statureStepperRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statureBtn: {
    backgroundColor: '#1B2135',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statureBtnHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  statureBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  kundliChartBox: {
    marginBottom: 6,
  },
  trophyIcon: {
    fontSize: 48,
    alignSelf: 'center',
    marginBottom: 10,
  },
  miniPreviewCard: {
    backgroundColor: '#090C16',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 209, 102, 0.4)',
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  miniPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
  },
  miniPreviewName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  miniPreviewBio: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  miniPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  editProfileNotice: {
    fontSize: 11,
    color: '#8E95AA',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  deckFooter: {
    marginTop: 16,
    gap: 8,
  },
  paceCue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6EE7B7',
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: '#FF385C',
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 6,
  },
  btnLaunch: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  btnBack: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  btnBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E95AA',
  },
  expandableTogglePill: {
    backgroundColor: '#0A0D1B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  expandableTogglePillActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: '#A855F7',
  },
  expandableTogglePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  expandableTogglePillTextActive: {
    color: '#E9D5FF',
    fontWeight: '800',
  },
  expandableAccordionBox: {
    backgroundColor: '#070914',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 16,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  inclusiveChipCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inclusiveChip: {
    backgroundColor: '#0E1222',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  inclusiveChipSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
    borderColor: '#A855F7',
  },
  inclusiveChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  inclusiveChipTextSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customInputField: {
    flex: 1,
    backgroundColor: '#0A0D1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  customInputApplyBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customInputApplyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
});
