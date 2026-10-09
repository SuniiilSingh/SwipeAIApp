import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { DietaryPreference, Gender } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import SelfieCameraModal from '@/components/selfie-camera-modal';
import KundaliChartDiamond from '@/components/kundali-chart-diamond';
import {
  GENDER_PRESETS,
  GENDER_PREFERENCE_PRESETS,
} from '@/constants/profile-presets';

const { width, height } = Dimensions.get('window');

export interface BioArchetype {
  id: string;
  category: string;
  emoji: string;
  title: string;
  tagline: string;
  bioText: string;
}

const WITTY_BIOS: BioArchetype[] = [
  {
    id: 'filter-coffee-tech',
    category: 'Work & Ambition',
    emoji: '☕',
    title: 'Filter Coffee Tech',
    tagline: 'Founders & late night debugging',
    bioText: 'Building things by day, debugging life choices by night. Filter coffee over Americano every single time.',
  },
  {
    id: 'golden-retriever',
    category: 'Wholesome & Chaos',
    emoji: '🐕',
    title: 'Golden Retriever Energy',
    tagline: 'Spontaneous food runs & hyping you up',
    bioText: 'Golden retriever energy. Always down for 2 AM street food runs, spontaneous road trips, and hyping you up.',
  },
  {
    id: 'old-soul',
    category: 'Art & Deep Talks',
    emoji: '🕯️',
    title: 'Old Soul Romantic',
    tagline: 'Vintage ghazals & monsoon chai',
    bioText: 'Old soul. Vintage ghazals, bookstore corners, handwritten letters, and quiet candlelit monsoon chai.',
  },
  {
    id: 'biryani-purist',
    category: 'Foodie Purist',
    emoji: '🍛',
    title: 'Biryani Purist',
    tagline: 'Zero small talk, maximum flavor',
    bioText: 'Will judge you solely on your biryani choice. Can calculate optimal dosa crispiness in 0.5 seconds flat.',
  },
  {
    id: 'couch-philosopher',
    category: 'Work & Ambition',
    emoji: '⚡',
    title: 'Ambitious Yet Chill',
    tagline: 'Work hard, weekend couch philosopher',
    bioText: 'Equal parts hyper-ambitious builder and weekend couch philosopher. Biryani purist with zero small talk.',
  },
  {
    id: 'sarcasm-connoisseur',
    category: 'Witty & Playful',
    emoji: '🍸',
    title: 'Fluent in Sarcasm',
    tagline: 'Rooftops, live indie & playful banter',
    bioText: 'Fluent in Hindi, English, and subtle sarcasm. Looking for someone authentic to explore rooftop spots.',
  },
  {
    id: 'mountain-escapist',
    category: 'Travel & Outdoors',
    emoji: '🏔️',
    title: 'Himachal Hiker',
    tagline: 'Pahadi cafes, pine air & stargazing',
    bioText: 'Mentally sitting at a riverside cafe in Kasol. Big on quiet hikes, spontaneous weekend getaways, and bonfire playlists.',
  },
  {
    id: 'standup-comedy-fan',
    category: 'Witty & Playful',
    emoji: '🎤',
    title: 'Open-Mic Addict',
    tagline: 'Dark humor & front row giggles',
    bioText: 'My therapist says I deflect emotional vulnerability with stand-up comedy and witty comebacks. Prove her right.',
  },
  {
    id: 'indie-music-audiophile',
    category: 'Art & Deep Talks',
    emoji: '🎧',
    title: 'Spotify Snob',
    tagline: 'Curated playlists & Vinyl hunting',
    bioText: 'Will share Spotify playlists instead of feelings. If you like Prateek Kuhad, Cigarettes After Sex, or classic RD Burman, say hi.',
  },
  {
    id: 'fitness-foodie-balance',
    category: 'Wholesome & Chaos',
    emoji: '🥑',
    title: 'Fit But Loves Chole Bhature',
    tagline: 'Deadlifts in the morning, dessert at night',
    bioText: 'Deadlifting my body weight by morning, shamelessly demolishing sweet lassi and hot street momos by sundown.',
  },
  {
    id: 'pet-parent',
    category: 'Wholesome & Chaos',
    emoji: '🐾',
    title: 'Full-Time Pet Parent',
    tagline: 'My dog has to approve of you first',
    bioText: 'I only swipe right on people my dog would enthusiastically wag its tail at. Prepare for unlimited puppy photos.',
  },
  {
    id: 'thoughtful-introvert',
    category: 'Art & Deep Talks',
    emoji: '📚',
    title: 'Quiet Observer',
    tagline: 'Board games, deep 1-on-1s & comfort food',
    bioText: 'Low social battery for loud clubs, unlimited energy for meaningful 1-on-1 conversations over steaming ramen.',
  },
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
  const [verificationStatus, setVerificationStatus] = useState<'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('UNVERIFIED');

  // Deck 2: Frequency
  const [gender, setGender] = useState<Gender>('MALE');
  const [genderDisplay, setGenderDisplay] = useState<string>('Man');
  const [tempGenderDisplay, setTempGenderDisplay] = useState<string>('Man');
  const [lookingFor, setLookingFor] = useState<string>('Women');
  const [tempLookingFor, setTempLookingFor] = useState<string>('Women');
  const [orientation, setOrientation] = useState<string>('Straight');
  const [showGenderModal, setShowGenderModal] = useState<boolean>(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState<boolean>(false);

  // Deck 3: Neighborhood & Career
  const [microCircle, setMicroCircle] = useState<string>('🚀 Koramangala Tech');
  const [job, setJob] = useState<string>('');
  const [institute, setInstitute] = useState<string>('');

  // Deck 4: Bio Archetype
  const [bio, setBio] = useState<string>(WITTY_BIOS[0].bioText);
  const [bioIdx, setBioIdx] = useState<number>(0);
  const [selectedBioCategory, setSelectedBioCategory] = useState<string>('All');

  // Deck 5: Lifestyle & Height
  const [heightCm, setHeightCm] = useState<number>(178);
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>('PURE_VEG');
  const [drinkingHabit, setDrinkingHabit] = useState<string>('Socially');

  // Deck 6: Vedic Birth Details
  const [birthTime, setBirthTime] = useState<string>('14:30');
  const [birthCity, setBirthCity] = useState<string>('Bengaluru');

  // Deck 7: 6-Slot Photo Showcase (Minimum 2 required, up to 6 optional)
  const [photoSlots, setPhotoSlots] = useState<string[]>(['', '', '', '', '', '']);
  const [uploadingSlotIdx, setUploadingSlotIdx] = useState<number | null>(null);
  const [activePhotoSlotModal, setActivePhotoSlotModal] = useState<number | null>(null);

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
        if (prof?.genderDisplay) {
          setGenderDisplay(prof.genderDisplay);
          setTempGenderDisplay(prof.genderDisplay);
        }
        if (prof?.genderPreferenceDisplay) {
          setLookingFor(prof.genderPreferenceDisplay);
          setTempLookingFor(prof.genderPreferenceDisplay);
        }
        if (prof?.microCircle) setMicroCircle(prof.microCircle);
        if (prof?.job || prof?.occupation) setJob(prof.job || prof.occupation || '');
        if (prof?.institute || prof?.education) setInstitute(prof.institute || prof.education || '');
        if (prof?.bio) setBio(prof.bio);
        if (prof?.height) setHeightCm(prof.height);
        if (prof?.dietaryPref) setDietaryPref(prof.dietaryPref);
        if (prof?.drinkingHabit) setDrinkingHabit(prof.drinkingHabit);

        const initialSlots = [
          prof?.photo1 || prof?.photos?.[0] || '',
          prof?.photo2 || prof?.photos?.[1] || '',
          prof?.photo3 || prof?.photos?.[2] || '',
          prof?.photo4 || prof?.photos?.[3] || '',
          prof?.photo5 || prof?.photos?.[4] || '',
          prof?.photo6 || prof?.photos?.[5] || '',
        ].map((u) => (u && !u.includes('unsplash.com/photo-1534528741775') ? u : ''));
        setPhotoSlots(initialSlots);

        if (prof?.selfieUrl) {
          setSelfieUrl(prof.selfieUrl);
        }
        if (prof?.verificationStatus === 'VERIFIED' || prof?.faceVerified) {
          setVerificationStatus('VERIFIED');
          setIsLivenessVerified(true);
        } else if (prof?.verificationStatus === 'PENDING' || prof?.selfieUrl) {
          setVerificationStatus('PENDING');
          setIsLivenessVerified(false);
        } else if (prof?.verificationStatus === 'REJECTED') {
          setVerificationStatus('REJECTED');
          setIsLivenessVerified(false);
        }
      } catch (e) {}
    })();
  }, []);

  // Poll backend verification status in background while PENDING
  useEffect(() => {
    if (verificationStatus !== 'PENDING') return;
    const interval = setInterval(async () => {
      try {
        const prof = await api.getMyProfile();
        if (prof?.verificationStatus === 'VERIFIED' || prof?.faceVerified) {
          setVerificationStatus('VERIFIED');
          setIsLivenessVerified(true);
          hapticFeedback.success();
        } else if (prof?.verificationStatus === 'REJECTED') {
          setVerificationStatus('REJECTED');
          setIsLivenessVerified(false);
        }
      } catch (e) {}
    }, 2500);
    return () => clearInterval(interval);
  }, [verificationStatus]);

  const getMagnetismScore = (deck: number) => {
    switch (deck) {
      case 1: return 16;
      case 2: return 32;
      case 3: return 48;
      case 4: return 64;
      case 5: return 78;
      case 6: return 90;
      case 7: return 100;
      case 8: return 100;
      default: return 16;
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
    const candidatePool = selectedBioCategory === 'All'
      ? WITTY_BIOS
      : WITTY_BIOS.filter((b) => b.category === selectedBioCategory);
    const pool = candidatePool.length > 0 ? candidatePool : WITTY_BIOS;
    const nextIdx = (bioIdx + 1) % pool.length;
    setBioIdx(nextIdx);
    setBio(pool[nextIdx].bioText);
  };

  const handleSelfieCaptured = async (capturedUri: string, capturedBase64?: string) => {
    setShowSelfieModal(false);
    hapticFeedback.success();
    // Immediately mark verification as PENDING while backend verifies in background
    setVerificationStatus('PENDING');
    setIsLivenessVerified(false);
    if (capturedUri) {
      setSelfieUrl(capturedUri);
      // Upload & submit asynchronously in background without blocking user
      (async () => {
        try {
          const uploadedUrl = await api.uploadImage(capturedUri, capturedBase64);
          const finalSelfie = uploadedUrl || capturedUri;
          if (uploadedUrl) {
            setSelfieUrl(uploadedUrl);
          }
          await api.submitSelfieAsync(finalSelfie);
        } catch (e) {
          console.warn('Async selfie background upload warning:', e);
        }
      })();
    }
  };

  const uploadedPhotosList = photoSlots.filter((u) => u && u.trim().length > 0);

  const handlePickPhotoSlot = async (slotIndex: number, source: 'gallery' | 'camera' = 'gallery') => {
    try {
      setActivePhotoSlotModal(null);
      hapticFeedback.light();

      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Needed', 'Please allow camera access to take a profile photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.75,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Needed', 'Please allow photo library access to upload your profile photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.75,
          base64: true,
        });
      }

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      const localUri = asset.uri;
      const directBase64 = asset.base64;

      setUploadingSlotIdx(slotIndex);
      // Optimistically show selected photo in slot
      const optimisticSlots = [...photoSlots];
      optimisticSlots[slotIndex] = localUri;
      setPhotoSlots(optimisticSlots);

      const remoteUrl = await api.uploadImage(localUri, directBase64);
      const finalUrl = remoteUrl || localUri;

      setPhotoSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = finalUrl;
        const cleanList = next.filter((p) => p && p.trim().length > 0 && !p.startsWith('file:') && !p.startsWith('content:'));
        // Persist in background & trigger async selfie verification if selfie already uploaded
        if (selfieUrl) {
          setVerificationStatus('PENDING');
        }
        api.updateMyProfile({
          photo1: next[0] || '',
          photo2: next[1] || '',
          photo3: next[2] || '',
          photo4: next[3] || '',
          photo5: next[4] || '',
          photo6: next[5] || '',
          photos: cleanList,
        }).catch(() => {});
        return next;
      });
      hapticFeedback.success();
    } catch (err) {
      console.warn('Photo slot upload error:', err);
      Alert.alert('Upload Error', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingSlotIdx(null);
    }
  };

  const handleRemovePhotoSlot = (slotIndex: number) => {
    hapticFeedback.light();
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = '';
      const cleanList = next.filter((p) => p && p.trim().length > 0 && !p.startsWith('file:') && !p.startsWith('content:'));
      api.updateMyProfile({
        photo1: next[0] || '',
        photo2: next[1] || '',
        photo3: next[2] || '',
        photo4: next[3] || '',
        photo5: next[4] || '',
        photo6: next[5] || '',
        photos: cleanList,
      }).catch(() => {});
      return next;
    });
  };

  const handleCompileAndLaunch = async () => {
    if (uploadedPhotosList.length < 2) {
      hapticFeedback.warning();
      Alert.alert(
        'Upload At Least 2 Photos 📸',
        'Please upload at least 2 profile photos on Deck 7 before launching your profile. You can also upload all 6 photos!'
      );
      advanceToDeck(7);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    hapticFeedback.success();

    const formattedDob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    const cleanName = fullName.trim() || 'BlunderR Star';
    const remotePhotos = photoSlots.filter((p) => p && p.trim().length > 0 && !p.startsWith('file:') && !p.startsWith('content:'));

    try {
      // 1. Update Core Profile (triggers backend async selfie verification against uploaded photos)
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
        photo1: photoSlots[0] || undefined,
        photo2: photoSlots[1] || undefined,
        photo3: photoSlots[2] || undefined,
        photo4: photoSlots[3] || undefined,
        photo5: photoSlots[4] || undefined,
        photo6: photoSlots[5] || undefined,
        photos: remotePhotos,
        selfieUrl: selfieUrl && !selfieUrl.startsWith('file:') ? selfieUrl : undefined,
        verificationStatus: selfieUrl ? (verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING') : undefined,
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

        {/* 7-Deck Segmented Stepper */}
        <View style={styles.stepperTrack}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => {
            const isPassed = activeDeck > i;
            const isActive = activeDeck === i || (activeDeck === 8 && i === 7);
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
            Photos: <Text style={styles.ribbonBold}>{uploadedPhotosList.length}/6</Text>
          </Text>
          <Text
            style={[
              styles.ribbonItem,
              {
                color:
                  verificationStatus === 'VERIFIED'
                    ? '#6EE7B7'
                    : verificationStatus === 'PENDING'
                    ? '#FCD34D'
                    : verificationStatus === 'REJECTED'
                    ? '#FCA5A5'
                    : '#94A3B8',
              },
            ]}>
            KYC:{' '}
            <Text style={styles.ribbonBold}>
              {verificationStatus === 'VERIFIED'
                ? 'Verified ✓'
                : verificationStatus === 'PENDING'
                ? 'Pending ⏳'
                : verificationStatus === 'REJECTED'
                ? 'Retake ⚠️'
                : 'Unverified'}
            </Text>
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
                    <Text style={styles.deckBadgeText}>✨ DECK 1 OF 7 • IDENTITY SPARK</Text>
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

                  {/* Selfie Upload / Capture Button with Async Pending Status */}
                  <TouchableOpacity
                    style={[
                      styles.selfieScanCard,
                      verificationStatus === 'VERIFIED' && styles.selfieScanCardDone,
                      verificationStatus === 'PENDING' && styles.selfieScanCardPending,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setShowSelfieModal(true)}>
                    <Text style={styles.selfieScanIcon}>
                      {verificationStatus === 'VERIFIED'
                        ? '✅'
                        : verificationStatus === 'PENDING'
                        ? '⏳'
                        : verificationStatus === 'REJECTED'
                        ? '⚠️'
                        : '📸'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.selfieScanTitle,
                          verificationStatus === 'PENDING' && { color: '#FCD34D' },
                          verificationStatus === 'REJECTED' && { color: '#FCA5A5' },
                        ]}>
                        {verificationStatus === 'VERIFIED'
                          ? 'Selfie Verified'
                          : verificationStatus === 'PENDING'
                          ? 'Selfie Verification Pending'
                          : verificationStatus === 'REJECTED'
                          ? 'Verification Failed • Tap to Retake'
                          : 'Take / Upload Your Selfie'}
                      </Text>
                      <Text
                        style={[
                          styles.selfieScanDesc,
                          verificationStatus === 'PENDING' && { color: '#FDE68A' },
                          verificationStatus === 'REJECTED' && { color: '#FECACA' },
                        ]}>
                        {verificationStatus === 'VERIFIED'
                          ? 'Verified by backend AI • Authenticity badge active'
                          : verificationStatus === 'PENDING'
                          ? 'Selfie uploaded! Backend AI is verifying in the background...'
                          : verificationStatus === 'REJECTED'
                          ? 'Face did not match or was unclear. Tap to take selfie again.'
                          : 'Tap to take or upload selfie • Verified in background'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>⚡ +16% Match Magnetism Unlocked</Text>
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
                    <Text style={styles.deckBadgeText}>💫 DECK 2 OF 7 • MUTUAL FREQUENCY</Text>
                  </View>
                  <Text style={styles.deckTitle}>Who are you looking to meet?</Text>
                  <Text style={styles.deckSub}>Calibrates discovery radar instantaneously.</Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Field 1: I IDENTIFY AS with Edit Pen */}
                  <View style={styles.fieldHeaderWithEdit}>
                    <Text style={styles.fieldLabel}>I IDENTIFY AS</Text>
                    <TouchableOpacity
                      style={styles.fieldEditPenBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempGenderDisplay(genderDisplay);
                        setShowGenderModal(true);
                      }}>
                      <Text style={styles.fieldEditPenIcon}>✏️</Text>
                      <Text style={styles.fieldEditPenLabel}>
                        {genderDisplay !== 'Man' && genderDisplay !== 'Woman' ? genderDisplay : 'More Options'}
                      </Text>
                    </TouchableOpacity>
                  </View>

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

                  {/* If custom or non-binary gender selected via modal, show quick active badge */}
                  {genderDisplay !== 'Man' && genderDisplay !== 'Woman' && (
                    <TouchableOpacity
                      style={styles.activeCustomIdentityPill}
                      onPress={() => {
                        setTempGenderDisplay(genderDisplay);
                        setShowGenderModal(true);
                      }}>
                      <Text style={styles.activeCustomIdentityText}>
                        🌈 Selected: <Text style={{ fontWeight: '900', color: '#FFF' }}>{genderDisplay}</Text> (Tap to change)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Field 2: LOOKING TO MEET with Edit Pen */}
                  <View style={[styles.fieldHeaderWithEdit, { marginTop: 14 }]}>
                    <Text style={styles.fieldLabel}>LOOKING TO MEET</Text>
                    <TouchableOpacity
                      style={styles.fieldEditPenBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempLookingFor(lookingFor);
                        setShowPreferenceModal(true);
                      }}>
                      <Text style={styles.fieldEditPenIcon}>✏️</Text>
                      <Text style={styles.fieldEditPenLabel}>
                        {lookingFor !== 'Women' && lookingFor !== 'Men' && lookingFor !== 'Everyone' ? lookingFor : 'All Choices'}
                      </Text>
                    </TouchableOpacity>
                  </View>

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

                  {/* If custom preference selected via modal, show quick active badge */}
                  {lookingFor !== 'Women' && lookingFor !== 'Men' && lookingFor !== 'Everyone' && (
                    <TouchableOpacity
                      style={styles.activeCustomIdentityPill}
                      onPress={() => {
                        setTempLookingFor(lookingFor);
                        setShowPreferenceModal(true);
                      }}>
                      <Text style={styles.activeCustomIdentityText}>
                        💫 Target: <Text style={{ fontWeight: '900', color: '#FFF' }}>{lookingFor}</Text> (Tap to change)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🎯 Frequency tuned! 5 rapid cards left</Text>
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
                    <Text style={styles.deckBadgeText}>🏙️ DECK 3 OF 7 • NEIGHBORHOOD TRIBE</Text>
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
                  <Text style={styles.paceCue}>🔥 48% Magnetism! Halfway milestone unlocked</Text>
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
                    <Text style={styles.deckBadgeText}>🎭 DECK 4 OF 7 • 1-TAP BIO SPARK</Text>
                  </View>
                  <Text style={styles.deckTitle}>Pick your energy persona</Text>
                  <Text style={styles.deckSub}>Zero typing dread. Tap an archetype to generate!</Text>
                </View>

                <View style={styles.deckBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.fieldLabel}>CURATED ARCHETYPES (TAP TO SELECT)</Text>
                    <Text style={{ fontSize: 10, color: '#FCD34D', fontWeight: '800' }}>
                      {WITTY_BIOS.length} ENERGIES
                    </Text>
                  </View>

                  {/* Category Filter Pills */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryFilterScroll}
                    contentContainerStyle={styles.categoryFilterRow}>
                    {['All', 'Work & Ambition', 'Wholesome & Chaos', 'Art & Deep Talks', 'Witty & Playful', 'Foodie Purist', 'Travel & Outdoors'].map((cat) => {
                      const isCatSel = selectedBioCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryFilterPill, isCatSel && styles.categoryFilterPillActive]}
                          onPress={() => {
                            hapticFeedback.light();
                            setSelectedBioCategory(cat);
                          }}>
                          <Text style={[styles.categoryFilterText, isCatSel && styles.categoryFilterTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Scrollable Archetypes Card Deck */}
                  <ScrollView
                    style={styles.bioArchetypeScroller}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}>
                    {WITTY_BIOS
                      .filter((item) => selectedBioCategory === 'All' || item.category === selectedBioCategory)
                      .map((item) => {
                        const isSelected = bio === item.bioText;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.personaCard, isSelected && styles.personaCardSelected]}
                            activeOpacity={0.8}
                            onPress={() => {
                              hapticFeedback.light();
                              setBio(item.bioText);
                            }}>
                            <View style={styles.personaHeaderRow}>
                              <Text style={styles.personaTitle}>
                                {item.emoji} {item.title}
                              </Text>
                              <View style={styles.personaTagBadge}>
                                <Text style={styles.personaTagBadgeText}>{item.category}</Text>
                              </View>
                            </View>
                            <Text style={styles.personaDesc} numberOfLines={2}>
                              {item.bioText}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>

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
                  <Text style={styles.paceCue}>✨ 64% Magnetism! 3 quick final cards</Text>
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
                    <Text style={styles.deckBadgeText}>☕ DECK 5 OF 7 • LIFESTYLE RHYTHM</Text>
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
                  <Text style={styles.paceCue}>🚀 78% Magnetism! Cosmic & Photo decks ahead</Text>
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
                    <Text style={styles.deckBadgeText}>🪐 DECK 6 OF 7 • VEDIC JANAMPATRI</Text>
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
                    🌟 90% Magnetism! Final Photo Showcase deck ahead
                  </Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.85}
                    onPress={() => advanceToDeck(7)}>
                    <Text style={styles.btnPrimaryText}>Next: Photo Showcase (Min 2) ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(5)}>
                    <Text style={styles.btnBackText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== DECK 7: 6-SLOT PHOTO SHOWCASE ==================== */}
            {activeDeck === 7 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>📸 DECK 7 OF 7 • PHOTO SHOWCASE</Text>
                  </View>
                  <Text style={styles.deckTitle}>Upload at least 2 photos</Text>
                  <Text style={styles.deckSub}>
                    Please upload at least 2 photos to continue — or upload all 6 photos for 3x more matches!
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Photo Counter & Requirement Banner */}
                  <View style={styles.photoCounterBanner}>
                    <View>
                      <Text style={styles.photoCounterTitle}>
                        {uploadedPhotosList.length >= 2
                          ? `✅ ${uploadedPhotosList.length} of 6 Photos Ready`
                          : `📸 ${uploadedPhotosList.length} of 2 Required Photos Uploaded`}
                      </Text>
                      <Text style={styles.photoCounterSub}>
                        {uploadedPhotosList.length < 2
                          ? `Upload ${2 - uploadedPhotosList.length} more photo${2 - uploadedPhotosList.length === 1 ? '' : 's'} (or fill all 6 slots)`
                          : 'Minimum 2 met! Add up to 6 photos anytime'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.photoCountBadge,
                        uploadedPhotosList.length >= 2 && styles.photoCountBadgeSuccess,
                      ]}>
                      <Text style={styles.photoCountBadgeText}>{uploadedPhotosList.length} / 6</Text>
                    </View>
                  </View>

                  {/* 6-Slot Interactive Grid (2 Required + 4 Optional) */}
                  <View style={styles.photoGrid6}>
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const uri = photoSlots[idx];
                      const isRequired = idx < 2;
                      const isUploadingThis = uploadingSlotIdx === idx;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.photoSlotCard,
                            isRequired && !uri && styles.photoSlotCardRequired,
                            !!uri && styles.photoSlotCardFilled,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => {
                            hapticFeedback.light();
                            setActivePhotoSlotModal(idx);
                          }}>
                          {uri ? (
                            <>
                              <Image
                                source={{ uri }}
                                style={styles.photoSlotImage}
                                contentFit="cover"
                              />
                              <View style={styles.photoSlotTopTag}>
                                <Text style={styles.photoSlotTopTagText}>
                                  {idx === 0 ? '★ MAIN' : `#${idx + 1}`}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.photoSlotRemoveBtn}
                                onPress={() => handleRemovePhotoSlot(idx)}>
                                <Text style={styles.photoSlotRemoveText}>✕</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <View style={styles.photoSlotEmptyInner}>
                              <Text style={styles.photoSlotPlusIcon}>{isRequired ? '📸' : '＋'}</Text>
                              <Text
                                style={[
                                  styles.photoSlotLabel,
                                  isRequired && { color: '#FF6B8B', fontWeight: '900' },
                                ]}>
                                {isRequired ? `Photo ${idx + 1} *` : `Photo ${idx + 1}`}
                              </Text>
                              <Text style={styles.photoSlotReqSub}>
                                {isRequired ? 'REQUIRED' : 'OPTIONAL'}
                              </Text>
                            </View>
                          )}

                          {isUploadingThis && (
                            <View style={styles.photoSlotLoadingOverlay}>
                              <ActivityIndicator color="#FF385C" size="small" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Live Background Selfie Verification Status Pill */}
                  <TouchableOpacity
                    style={[
                      styles.asyncVerifyBanner,
                      verificationStatus === 'VERIFIED' && styles.asyncVerifyBannerDone,
                      verificationStatus === 'PENDING' && styles.asyncVerifyBannerPending,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setShowSelfieModal(true)}>
                    <Text style={{ fontSize: 18 }}>
                      {verificationStatus === 'VERIFIED'
                        ? '✅'
                        : verificationStatus === 'PENDING'
                        ? '⏳'
                        : verificationStatus === 'REJECTED'
                        ? '⚠️'
                        : '📸'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.asyncVerifyTitle}>
                        {verificationStatus === 'VERIFIED'
                          ? 'Selfie Verified by Backend AI'
                          : verificationStatus === 'PENDING'
                          ? 'Selfie Verification Pending (Backend AI Verifying...)'
                          : verificationStatus === 'REJECTED'
                          ? 'Selfie Verification Needs Retake • Tap Here'
                          : 'Haven’t uploaded your selfie yet? Tap to take selfie'}
                      </Text>
                      <Text style={styles.asyncVerifySub}>
                        {verificationStatus === 'PENDING'
                          ? 'We automatically verify your selfie against your uploaded photos in the background.'
                          : verificationStatus === 'VERIFIED'
                          ? 'Your selfie and profile photos are verified!'
                          : 'As soon as you upload a selfie, we mark it pending & verify in the backend.'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={[styles.paceCue, { color: '#FCD34D' }]}>
                    👑 {uploadedPhotosList.length >= 2 ? '100% Top-Tier Profile Magnetism!' : 'Upload at least 2 photos to unlock final launch'}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.btnPrimary,
                      uploadedPhotosList.length >= 2 ? styles.btnLaunch : { opacity: 0.65 },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (uploadedPhotosList.length < 2) {
                        hapticFeedback.warning();
                        Alert.alert(
                          'Please Upload At Least 2 Photos 📸',
                          'Please upload at least 2 photos in the required slots (you can also upload all 6 photos) before continuing.'
                        );
                        return;
                      }
                      advanceToDeck(8);
                    }}>
                    <Text style={styles.btnPrimaryText}>
                      {uploadedPhotosList.length >= 2
                        ? 'Review Synthesized Profile ➔'
                        : `Upload ${2 - uploadedPhotosList.length} More Photo${2 - uploadedPhotosList.length === 1 ? '' : 's'} to Continue`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(6)}>
                    <Text style={styles.btnBackText}>← Back to Janampatri</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================== FINAL REVEAL CARD (DECK 8) ==================== */}
            {activeDeck === 8 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <Text style={styles.trophyIcon}>💎</Text>
                  <Text style={styles.deckTitle}>Profile Synthesized!</Text>
                  <Text style={styles.deckSub}>
                    All 7 decks compiled with {uploadedPhotosList.length} photo{uploadedPhotosList.length === 1 ? '' : 's'}. You are ready for Discovery!
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Holographic Mini Profile Preview */}
                  <View style={styles.miniPreviewCard}>
                    <View style={styles.miniPreviewHeader}>
                      <Text style={styles.miniPreviewName}>{fullName.trim() || 'Aryan'}, {getEstimatedAge()}</Text>
                      <View
                        style={[
                          styles.verifiedBadge,
                          verificationStatus === 'PENDING' && {
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            borderColor: 'rgba(245, 158, 11, 0.5)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.verifiedBadgeText,
                            verificationStatus === 'PENDING' && { color: '#FCD34D' },
                          ]}>
                          {verificationStatus === 'VERIFIED'
                            ? '✓ Selfie Verified'
                            : verificationStatus === 'PENDING'
                            ? '⏳ Verification Pending'
                            : '📸 Unverified'}
                        </Text>
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
                      <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>📸 {uploadedPhotosList.length}/6 Photos</Text>
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
                  <TouchableOpacity style={styles.btnBack} onPress={() => advanceToDeck(7)}>
                    <Text style={styles.btnBackText}>← Back to Photo Showcase</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selfie Camera / Upload Modal (Standard Selfie, NOT 3D Biometric) */}
      {showSelfieModal && (
        <SelfieCameraModal
          visible={showSelfieModal}
          onClose={() => setShowSelfieModal(false)}
          onCapture={handleSelfieCaptured}
        />
      )}

      {/* Gender Selection Modal (Cancel on Top-Right, Done at Bottom) */}
      {showGenderModal && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setShowGenderModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitleLeft}>👤 Select Gender</Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    All authentic identities and spectrums are welcome.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalTopRightCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowGenderModal(false)}>
                  <Text style={styles.modalTopRightCancelText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320, width: '100%', marginVertical: 8 }}>
                {GENDER_PRESETS.map((item) => {
                  const isSel = tempGenderDisplay === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pickerOptionItem, isSel && styles.pickerOptionActive]}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempGenderDisplay(item);
                      }}>
                      <Text style={[styles.pickerOptionText, isSel && styles.pickerOptionTextActive]}>
                        {item} {isSel ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDoneBottomBtn}
                activeOpacity={0.85}
                onPress={() => {
                  hapticFeedback.success();
                  if (tempGenderDisplay === 'Man') {
                    setGender('MALE');
                  } else if (tempGenderDisplay === 'Woman') {
                    setGender('FEMALE');
                  } else {
                    setGender('NON_BINARY');
                  }
                  setGenderDisplay(tempGenderDisplay);
                  setShowGenderModal(false);
                }}>
                <Text style={styles.modalDoneBottomBtnText}>✓ Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Looking To Meet Modal (Cancel on Top-Right, Done at Bottom) */}
      {showPreferenceModal && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setShowPreferenceModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitleLeft}>👥 Looking To Meet</Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    Calibrate who you want to discover in your deck.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalTopRightCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowPreferenceModal(false)}>
                  <Text style={styles.modalTopRightCancelText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320, width: '100%', marginVertical: 8 }}>
                {[...GENDER_PREFERENCE_PRESETS, 'Non-binary & Expansive', 'Transgender folks'].map((item) => {
                  const isSel = tempLookingFor === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pickerOptionItem, isSel && styles.pickerOptionActive]}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempLookingFor(item);
                      }}>
                      <Text style={[styles.pickerOptionText, isSel && styles.pickerOptionTextActive]}>
                        {item} {isSel ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDoneBottomBtn}
                activeOpacity={0.85}
                onPress={() => {
                  hapticFeedback.success();
                  setLookingFor(tempLookingFor);
                  setShowPreferenceModal(false);
                }}>
                <Text style={styles.modalDoneBottomBtnText}>✓ Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Upload Photo Slot Modal (with Cancel button on Top-Right and Bottom) */}
      {activePhotoSlotModal !== null && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePhotoSlotModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitleLeft}>
                    📸 Upload Photo #{activePhotoSlotModal + 1}
                  </Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    {activePhotoSlotModal < 2
                      ? 'Required profile photo (at least 2 photos needed)'
                      : 'Optional showcase photo'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalTopRightCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setActivePhotoSlotModal(null)}>
                  <Text style={styles.modalTopRightCancelText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '100%', gap: 10, marginVertical: 10 }}>
                <TouchableOpacity
                  style={styles.photoPickerActionBtnPrimary}
                  activeOpacity={0.85}
                  onPress={() => handlePickPhotoSlot(activePhotoSlotModal, 'gallery')}>
                  <Text style={styles.photoPickerActionBtnPrimaryText}>
                    🖼️ Choose from Photo Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoPickerActionBtnSecondary}
                  activeOpacity={0.85}
                  onPress={() => handlePickPhotoSlot(activePhotoSlotModal, 'camera')}>
                  <Text style={styles.photoPickerActionBtnSecondaryText}>
                    📷 Take Photo with Camera
                  </Text>
                </TouchableOpacity>

                {!!photoSlots[activePhotoSlotModal] && (
                  <TouchableOpacity
                    style={styles.photoPickerActionBtnDanger}
                    activeOpacity={0.85}
                    onPress={() => {
                      const idxToRemove = activePhotoSlotModal;
                      setActivePhotoSlotModal(null);
                      handleRemovePhotoSlot(idxToRemove);
                    }}>
                    <Text style={styles.photoPickerActionBtnDangerText}>
                      🗑️ Remove Current Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.85}
                onPress={() => setActivePhotoSlotModal(null)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
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
  categoryFilterScroll: {
    marginVertical: 4,
    maxHeight: 36,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  categoryFilterPill: {
    backgroundColor: '#0A0D1B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  categoryFilterPillActive: {
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
    borderColor: '#FCD34D',
  },
  categoryFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  categoryFilterTextActive: {
    color: '#FCD34D',
    fontWeight: '800',
  },
  bioArchetypeScroller: {
    maxHeight: 215,
    marginVertical: 4,
  },
  personaCard: {
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  personaCardSelected: {
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    borderColor: '#FCD34D',
  },
  personaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personaTagBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  personaTagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.3,
  },
  personaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  personaDesc: {
    fontSize: 12,
    color: '#94A3B8',
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
  fieldHeaderWithEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldEditPenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fieldEditPenIcon: {
    fontSize: 11,
  },
  fieldEditPenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B8B',
    letterSpacing: 0.3,
  },
  activeCustomIdentityPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#A855F7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 6,
    alignItems: 'center',
  },
  activeCustomIdentityText: {
    fontSize: 12,
    color: '#D8B4FE',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F1326',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.4)',
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  modalHeaderTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalHeaderSub: {
    color: '#8E95AA',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  pickerOptionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginVertical: 2,
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
  },
  pickerOptionText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOptionTextActive: {
    color: '#FF385C',
    fontWeight: '900',
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
    gap: 10,
  },
  modalHeaderTitleLeft: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  },
  modalHeaderSubLeft: {
    color: '#8E95AA',
    fontSize: 11,
    marginTop: 3,
  },
  modalTopRightCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalTopRightCancelText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  modalDoneBottomBtn: {
    backgroundColor: '#FF385C',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  modalDoneBottomBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  photoPickerActionBtnPrimary: {
    backgroundColor: '#FF385C',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  photoPickerActionBtnPrimaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  photoPickerActionBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  photoPickerActionBtnSecondaryText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
  },
  photoPickerActionBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  photoPickerActionBtnDangerText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800',
  },
  selfieScanCardPending: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: '#F59E0B',
  },
  photoCounterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#080B17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  photoCounterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  photoCounterSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  photoCountBadge: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
    borderWidth: 1,
    borderColor: '#FF385C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoCountBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  photoCountBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
  },
  photoGrid6: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 4,
  },
  photoSlotCard: {
    width: '31.5%',
    aspectRatio: 0.78,
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoSlotCardRequired: {
    borderColor: 'rgba(255, 56, 92, 0.55)',
    backgroundColor: 'rgba(255, 56, 92, 0.06)',
  },
  photoSlotCardFilled: {
    borderStyle: 'solid',
    borderColor: '#10B981',
  },
  photoSlotImage: {
    width: '100%',
    height: '100%',
  },
  photoSlotTopTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(5, 6, 10, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  photoSlotTopTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
  },
  photoSlotRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotRemoveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  photoSlotEmptyInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 3,
  },
  photoSlotPlusIcon: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  photoSlotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  photoSlotReqSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  photoSlotLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5, 6, 10, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  asyncVerifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  asyncVerifyBannerDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#10B981',
  },
  asyncVerifyBannerPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: '#F59E0B',
  },
  asyncVerifyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  asyncVerifySub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
    lineHeight: 14,
  },
});
