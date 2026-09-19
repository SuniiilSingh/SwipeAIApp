import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { DatingIntent } from '@/types';
import LivenessCameraModal from '@/components/liveness-camera-modal';
import { FEATURE_FLAGS } from '@/config/features';

const ONBOARDING_LANGUAGES = [
  'English 🇬🇧', 'Hindi 🇮🇳', 'Punjabi 🌾', 'Bengali 🎨', 'Tamil 🛕', 'Telugu 🏛️',
  'Kannada 🌿', 'Malayalam 🌴', 'Marathi 🚩', 'Gujarati 💎', 'Marwari 🏜️', 'Urdu 📜',
  'French 🥐', 'Spanish 💃', 'German 🥨'
];

export default function AuthScreen() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [expectedOtpLength, setExpectedOtpLength] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [authChannel, setAuthChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  // WhatsApp Detection State
  const [isWhatsAppDetected, setIsWhatsAppDetected] = useState<boolean | null>(null);
  const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(true);

  // OTP Auto-Detect State
  const [otpSent, setOtpSent] = useState(false);
  const [isAutoDetectingOtp, setIsAutoDetectingOtp] = useState(false);
  const [autoDetectedSuccess, setAutoDetectedSuccess] = useState(false);
  const [otpFeedbackMsg, setOtpFeedbackMsg] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isCompact = windowHeight < 750;
  const isUltraCompact = windowHeight < 680;
  const stackHeight = isUltraCompact ? 250 : isCompact ? 290 : 330;
  const cardWidth = isUltraCompact ? 220 : isCompact ? 245 : 260;
  const cardHeight = isUltraCompact ? 245 : isCompact ? 285 : 320;
  const photoHeight = isUltraCompact ? 170 : isCompact ? 198 : 225;
  const [resendTimer, setResendTimer] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const otpInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orbAnim1 = useRef(new Animated.Value(0.22)).current;
  const orbAnim2 = useRef(new Animated.Value(0.18)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const orbDriftAnim = useRef(new Animated.Value(0)).current;
  const [isPlayingVoice, setIsPlayingVoice] = useState(true);
  const soundWaveAnim = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  const animStackHeight = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [stackHeight, isUltraCompact ? 90 : isCompact ? 105 : 125],
  });
  const animStackScale = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isUltraCompact ? 0.40 : isCompact ? 0.44 : 0.48],
  });
  const animStackMarginVertical = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 0],
  });

  // KYC state
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [livenessDone, setLivenessDone] = useState(false);
  const [livenessScore, setLivenessScore] = useState(0.99);

  // Ghost Shield state
  const [blockContacts, setBlockContacts] = useState(true);
  const [corpDomain, setCorpDomain] = useState('');
  const [hideMutuals, setHideMutuals] = useState(true);

  // Intent
  const [intent, setIntent] = useState<DatingIntent>('SERIOUS_DATING');

  // Languages state for onboarding
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English', 'Hindi']);
  const [customLangInput, setCustomLangInput] = useState('');

  const toggleLanguage = (lang: string) => {
    const cleanLang = lang.split(' ')[0];
    if (selectedLanguages.includes(cleanLang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== cleanLang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, cleanLang]);
    }
  };

  const handleAddCustomLanguage = () => {
    const trimmed = customLangInput.trim();
    if (!trimmed) return;
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!selectedLanguages.includes(capitalized)) {
      setSelectedLanguages([...selectedLanguages, capitalized]);
    }
    setCustomLangInput('');
  };

  // Modals & Permissions
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [showLivenessModal, setShowLivenessModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Phone validation: user must fill exactly 10 digits before OTP dispatch buttons are enabled
  const cleanedPhoneDigits = phone.replace(/[^0-9]/g, '').slice(0, 10);
  const isPhoneFilled = cleanedPhoneDigits.length === 10;

  // Check WhatsApp App Availability and Existing Onboarding Status
  useEffect(() => {
    checkWhatsAppInstalled();
    checkExistingStatus();
  }, []);

  const navigateBasedOnCompleteness = (prof: any) => {
    const hasName = Boolean(prof?.displayName?.trim() || prof?.fullName?.trim());
    const hasGender = Boolean(prof?.gender || prof?.genderDisplay);
    const hasOrientation = Boolean(prof?.sexualOrientation);
    const completionPct = prof?.completionPercentage || 0;
    if (!hasName || !hasGender || !hasOrientation || completionPct < 30) {
      router.replace({ pathname: '/(tabs)/profile', params: { edit: 'true', reason: 'incomplete' } });
    } else {
      router.replace('/(tabs)');
    }
  };

  const checkExistingStatus = async () => {
    try {
      await api.initAuth();
      const token = api.getAuthToken();
      if (!token) {
        setPhone('');
        return;
      }

      const profile = await api.getMyProfile();
      const isCompleted = await api.isOnboardingCompleted();
      if (isCompleted) {
        navigateBasedOnCompleteness(profile);
        return;
      }

      const isPhoneOrWa = Boolean(profile.whatsappVerified || profile.phoneE164);
      const isLiveness = Boolean((profile.livenessScore && profile.livenessScore >= 0.85) || profile.digilockerVerified);
      const hasIntent = Boolean(profile.intent || profile.relationshipIntent);

      // If user already verified or completed onboarding, redirect to Discover (or Edit Profile if incomplete):
      if (isPhoneOrWa && (isLiveness || hasIntent || (profile.photos && profile.photos.length > 0) || (profile.displayName && profile.displayName.trim()))) {
        await api.setOnboardingCompleted(true);
        navigateBasedOnCompleteness(profile);
        return;
      }

      if (profile.whatsappVerified) {
        setWhatsappVerified(true);
      }
      if (profile.digilockerVerified) {
        setDigilockerVerified(true);
      }
      if (profile.livenessScore && profile.livenessScore >= 0.85) {
        setLivenessDone(true);
        setLivenessScore(profile.livenessScore);
      }
      if (profile.intent) {
        setIntent(profile.intent);
      }
      if (profile.languagesSpoken && profile.languagesSpoken.length > 0) {
        setSelectedLanguages(profile.languagesSpoken);
      }

      // Automatically advance to only the incomplete step
      if (!isLiveness) {
        setStep(2);
      } else if (!hasIntent) {
        setStep(4);
      } else {
        await api.setOnboardingCompleted(true);
        navigateBasedOnCompleteness(profile);
      }
    } catch (e) {}
  };

  const checkWhatsAppInstalled = async () => {
    setIsCheckingWhatsApp(true);
    try {
      if (Platform.OS === 'web') {
        // On web / desktop browsers, WhatsApp Web / desktop is generally accessible
        setIsWhatsAppDetected(true);
      } else {
        const canOpen = await Linking.canOpenURL('whatsapp://send');
        setIsWhatsAppDetected(canOpen);
      }
    } catch (e) {
      // Fallback: enabled for testing
      setIsWhatsAppDetected(true);
    } finally {
      setIsCheckingWhatsApp(false);
    }
  };

  // Resend Countdown Timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Pulse animation during Auto-Detecting SMS
  useEffect(() => {
    if (isAutoDetectingOtp) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAutoDetectingOtp]);

  // Ambient 3D Breathing Glow & Levitating Animations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim1, {
          toValue: 0.38,
          duration: 3800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(orbAnim1, {
          toValue: 0.18,
          duration: 3800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim2, {
          toValue: 0.36,
          duration: 4800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(orbAnim2, {
          toValue: 0.16,
          duration: 4800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Smooth 3D Floating / Levitating Animation for Brand Emblem & Elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 2600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // 3D Ambient Horizontal Drift
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbDriftAnim, {
          toValue: 16,
          duration: 4000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(orbDriftAnim, {
          toValue: -16,
          duration: 4000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Sound waveform pulsing animation for Concept 2 Voice Note
    Animated.loop(
      Animated.sequence([
        Animated.timing(soundWaveAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(soundWaveAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Keyboard visibility listener to dynamically prevent keypad override & smoothly scale photo deck
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        if (e?.endCoordinates?.height) {
          setKeyboardHeight(e.endCoordinates.height);
        }
        Animated.timing(keyboardAnim, {
          toValue: 1,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 200,
          useNativeDriver: false,
        }).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 200,
          useNativeDriver: false,
        }).start();
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);



  // Real-time Clipboard Auto-Detection Effect:
  // When an SMS arrives on Android or iOS, tapping "Copy code" in the notification shade
  // or copying the SMS automatically triggers instant detection and auto-fill!
  useEffect(() => {
    let timer: any;
    if (isAutoDetectingOtp) {
      const checkClipboardForOtp = async () => {
        try {
          const content = await Clipboard.getStringAsync();
          if (content) {
            const regex = expectedOtpLength === 6 ? /\b\d{6}\b/ : /\b\d{4}\b/;
            const match = content.match(regex);
            if (match && match[0] && match[0] !== otp && match[0].length === expectedOtpLength) {
              const detected = match[0];
              setOtp(detected);
              setIsAutoDetectingOtp(false);
              setAutoDetectedSuccess(true);
              setTimeout(() => {
                handleVerifyOtp(detected);
              }, 400);
            }
          }
        } catch (e) {}
      };

      checkClipboardForOtp();
      timer = setInterval(checkClipboardForOtp, 800);

      const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          checkClipboardForOtp();
        }
      });

      return () => {
        if (timer) clearInterval(timer);
        subscription.remove();
      };
    }
  }, [isAutoDetectingOtp, expectedOtpLength, otp]);

  const handleOpenWhatsApp = async () => {
    try {
      const url = 'whatsapp://';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://web.whatsapp.com');
      }
    } catch (e) {
      Alert.alert('Open WhatsApp', 'Please switch to WhatsApp to view your verification code.');
    }
  };

  // Send OTP via live API (WhatsApp or SMS channel)
  const handleSendOtp = async (channel: 'whatsapp' | 'sms' = authChannel) => {
    if (!isPhoneFilled) {
      Alert.alert('Mobile Number Required', 'Please enter a valid 10-digit mobile number first.');
      return;
    }
    setLoading(true);
    setAuthChannel(channel);
    setAutoDetectedSuccess(false);
    setOtpFeedbackMsg(null);
    setOtp('');
    try {
      const res = await api.sendOtp(phone, channel);
      setLoading(false);
      setOtpSent(true);
      setResendTimer(30);
      const codeLen = (res && (res.otpLength === 4 || res.otpLength === 6)) ? res.otpLength : 6;
      setExpectedOtpLength(codeLen);
      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';

      const isMock = FEATURE_FLAGS.USE_MOCK_OTP || res?.isMockOtp;
      if (isMock) {
        const mockCode = res?.mockOtp || '123456';
        setOtp(mockCode);
        setIsAutoDetectingOtp(false);
        setAutoDetectedSuccess(true);
        setOtpFeedbackMsg(res?.message || '⚡ Test Mode Active: Verification Code 123456');
      } else {
        setIsAutoDetectingOtp(true);
        setOtpFeedbackMsg(res?.message || `OTP sent via ${channelLabel}`);
      }

      setTimeout(() => {
        otpInputRef.current?.focus();
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 250);
    } catch (e: any) {
      setLoading(false);
      setIsAutoDetectingOtp(false);
      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
      Alert.alert(`${channelLabel} Error`, e.message || `Could not send OTP.`);
    }
  };

  const promptLocationIfPending = async (onProceed: () => void) => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc?.coords) {
            let cityName: string | undefined;
            try {
              const geo = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
              if (geo && geo.length > 0) {
                cityName = (geo[0].city || geo[0].subregion || geo[0].district || geo[0].region) ?? undefined;
              }
            } catch (e) {}
            await api.updateLocation(loc.coords.latitude, loc.coords.longitude, cityName);
          }
        } catch (e) {}
        onProceed();
        return;
      }
    } catch (e) {}

    // Permission not yet granted: ask user via Location Access Modal
    setPendingNavigation(() => onProceed);
    setShowLocationModal(true);
  };

  const requestLocationAndProceed = async () => {
    setIsRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc?.coords) {
          let cityName: string | undefined;
          try {
            const geo = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (geo && geo.length > 0) {
              cityName = (geo[0].city || geo[0].subregion || geo[0].district || geo[0].region) ?? undefined;
            }
          } catch (e) {}
          await api.updateLocation(loc.coords.latitude, loc.coords.longitude, cityName);
        }
      }
    } catch (err) {
      console.warn('Location permission / acquisition error:', err);
    } finally {
      setIsRequestingLocation(false);
      setShowLocationModal(false);
      if (pendingNavigation) {
        const next = pendingNavigation;
        setPendingNavigation(null);
        next();
      }
    }
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    if (pendingNavigation) {
      const next = pendingNavigation;
      setPendingNavigation(null);
      next();
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalOtp = (codeToVerify || otp).trim();
    if (!finalOtp || finalOtp.length < expectedOtpLength) {
      Alert.alert('Enter Code', `Enter the ${expectedOtpLength}-digit code.`);
      return;
    }
    setLoading(true);

    // Auto-acquire device GPS location and reverse-geocoded city immediately
    let userLat: number | undefined;
    let userLon: number | undefined;
    let userCity: string | undefined;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc?.coords) {
          userLat = loc.coords.latitude;
          userLon = loc.coords.longitude;
          try {
            const geo = await Location.reverseGeocodeAsync({
              latitude: userLat,
              longitude: userLon,
            });
            if (geo && geo.length > 0) {
              userCity = (geo[0].city || geo[0].subregion || geo[0].district || geo[0].region) ?? undefined;
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Location capture during OTP verify:', e);
    }

    try {
      const res = await api.verifyOtp(phone, finalOtp, authChannel, userLat, userLon, userCity);
      setLoading(false);
      if (res?.whatsappVerified || authChannel === 'whatsapp') {
        setWhatsappVerified(true);
      }

      // Persist location immediately to profile and DB
      if (userLat != null && userLon != null) {
        api.updateLocation(userLat, userLon, userCity).catch(() => {});
      }

      const proceedWithLocation = (action: 'navigate' | 'step2' | 'step4', targetProfile?: any) => {
        promptLocationIfPending(async () => {
          if (action === 'navigate') {
            await api.setOnboardingCompleted(true);
            navigateBasedOnCompleteness(targetProfile);
          } else if (action === 'step2') {
            setStep(2);
          } else if (action === 'step4') {
            setStep(4);
          }
        });
      };

      // Check existing user profile and verifications so returning users bypass redundant steps:
      try {
        const profile = await api.getMyProfile();
        const isLivenessDone = Boolean((profile.livenessScore && profile.livenessScore >= 0.85) || profile.digilockerVerified);
        const hasIntent = Boolean(profile.intent || profile.relationshipIntent);

        // If returning user or user already completed liveness/intent, or has an active profile/photos:
        if (!res?.isNewUser && (isLivenessDone || hasIntent || (profile.photos && profile.photos.length > 0) || (profile.displayName && profile.displayName.trim()))) {
          proceedWithLocation('navigate', profile);
          return;
        }

        // For new or partially onboarded users, only navigate to the missing step:
        if (!isLivenessDone) {
          proceedWithLocation('step2');
        } else if (!hasIntent) {
          proceedWithLocation('step4');
        } else {
          proceedWithLocation('navigate', profile);
        }
      } catch (err) {
        if (!res?.isNewUser) {
          proceedWithLocation('navigate', null);
        } else {
          proceedWithLocation('step2');
        }
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Verification Failed', e.message || 'Invalid or expired OTP.');
    }
  };

  const handleWhatsAppAuth = () => {
    handleSendOtp('whatsapp');
  };

  const handleDigiLockerConfirm = async () => {
    setLoading(true);
    const res = await api.verifyDigiLocker();
    setLoading(false);
    setDigilockerVerified(true);
    setShowDigiLockerModal(false);
    Alert.alert('Gold Shield Awarded! 🛡️', res.message);
  };

  const handleLivenessSuccess = (score: number) => {
    setLivenessScore(score);
    setLivenessDone(true);
    setShowLivenessModal(false);
    // Smoothly and automatically proceed to Step 3 (Safety Shield) so user is not stuck on Step 2
    setTimeout(() => {
      setStep(3);
    }, 400);
  };

  const handleSaveShieldAndIntent = async () => {
    setLoading(true);
    try {
      if (corpDomain) {
        await api.setCorporateDomain(corpDomain);
      }
      if (blockContacts) {
        await api.syncContacts(['+919876500001', '+919876500002']);
      }
      await api.updateMyProfile({ intent, digilockerVerified, languagesSpoken: selectedLanguages });
      await api.setOnboardingCompleted(true);
      const updatedProfile = await api.getMyProfile().catch(() => null);
      setLoading(false);
      navigateBasedOnCompleteness(updatedProfile);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to save settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 3D Multi-Plane Ambient Velvet & Plum Glow Orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.ambientOrbTop,
            { opacity: orbAnim1, transform: [{ translateY: floatAnim }] },
          ]}
        />
        <Animated.View
          style={[
            styles.ambientOrbRight,
            { opacity: orbAnim2, transform: [{ translateX: orbDriftAnim }] },
          ]}
        />
        <View style={styles.ambientOrbBottom} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            step === 1 && (isKeyboardVisible ? [styles.scrollContentStep1Keyboard, { paddingTop: isUltraCompact ? 36 : 68 }] : styles.scrollContentStep1),
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={step > 1}
          bounces={step > 1}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}>
          {/* Header above steps 2, 3, 4 */}
          {step > 1 && (
            <View style={styles.headerStepAbove}>
              <View style={styles.brandLogoRow}>
                <Text style={styles.brandTitleWhite}>Blunderr </Text>
                <Text style={styles.brandTitleAccent}>Dating</Text>
              </View>
              <View style={styles.stepIndicatorPill}>
                <Text style={styles.stepIndicatorText}>Step {step} of 4</Text>
              </View>
            </View>
          )}

          {/* STEP 1: Concept 2 — The Kinetic Card Stack Aesthetic */}
          {step === 1 && (
            <View style={[styles.kineticPageContainer, isKeyboardVisible && styles.kineticPageContainerKeyboard]}>
              {/* Top Wordmark Header */}
              <View style={[styles.kineticBrandHeader, isKeyboardVisible && styles.kineticBrandHeaderCompact]}>
                <View style={styles.brandLogoRow}>
                  <View style={[styles.brandLogoIconGlow, isKeyboardVisible && styles.brandLogoIconGlowCompact]}>
                    <Text style={[styles.brandLogoIconText, isKeyboardVisible && { fontSize: 13 }]}>🔥</Text>
                  </View>
                  <Text style={[styles.brandTitleWhite, isKeyboardVisible && { fontSize: 20 }]}>Blunderr </Text>
                  <Text style={[styles.brandTitleAccent, isKeyboardVisible && { fontSize: 20 }]}>Dating</Text>
                </View>
                {!isKeyboardVisible && (
                  <View style={styles.kineticVipTagPill}>
                    <Text style={styles.kineticVipTagSparkle}>✦</Text>
                    <Text style={styles.kineticVipTagText}>100% VERIFIED HIGH-INTENT STACK</Text>
                    <Text style={styles.kineticVipTagSparkle}>✦</Text>
                  </View>
                )}
              </View>

              {/* 3D Kinetic Card Stack Centerpiece */}
              <Animated.View
                style={[
                  styles.kineticStackContainer,
                  {
                    height: animStackHeight,
                    transform: [{ scale: animStackScale }],
                    marginTop: isKeyboardVisible ? 12 : animStackMarginVertical,
                    marginBottom: animStackMarginVertical,
                  },
                ]}>
                {/* Background Card 4 (Deepest Shadow Card - Tilted -27 deg) */}
                <View
                  style={[styles.kineticCard4, { width: cardWidth, height: cardHeight }]}
                  pointerEvents="none"
                />

                {/* Background Card 3 (Tilted -20 deg with Dark Photo Layer) */}
                <View
                  style={[styles.kineticCard3, { width: cardWidth, height: cardHeight }]}
                  pointerEvents="none">
                  <View style={[styles.cardPhotoFrame, { height: photoHeight }]}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
                      }}
                      style={styles.cardInnerPhotoDimmed}
                      resizeMode="cover"
                    />
                    <View style={styles.cardDimmerOverlay} />
                  </View>
                </View>

                {/* Background Card 2 (Tilted -13 deg with Cyan/Mint Glow & Photo Preview) */}
                <View
                  style={[styles.kineticCard2, { width: cardWidth, height: cardHeight }]}
                  pointerEvents="none">
                  <View style={[styles.cardPhotoFrame, { height: photoHeight }]}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
                      }}
                      style={styles.cardInnerPhotoDimmed}
                      resizeMode="cover"
                    />
                    <View style={styles.cardDimmerOverlaySoft} />
                  </View>
                </View>

                {/* Foreground Hero Card 1 (Tilted -6 deg with Levitating Float Physics) */}
                <Animated.View
                  style={[
                    styles.kineticCardHero,
                    {
                      width: cardWidth,
                      height: cardHeight,
                      transform: [{ translateY: floatAnim }, { rotate: '-6deg' }],
                    },
                  ]}>
                  {/* Outer Frame with Inner Photo Container */}
                  <View style={[styles.cardPhotoFrame, { height: photoHeight }]}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
                      }}
                      style={styles.cardInnerPhoto}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Floating 3D Verified Checkmark Badge on Card Right Edge */}
                  <View style={styles.floatingVerifiedBadgeRight}>
                    <Text style={styles.floatingVerifiedText}>✓</Text>
                  </View>

                  {/* Card Lower-Right Heart Accent */}
                  <View style={styles.cardHeartAccent}>
                    <Text style={styles.cardHeartIcon}>❤️</Text>
                  </View>

                  {/* Tilted Glass Candidate Info & Voice Waveform Overlay (Tilted Right) */}
                  <View style={styles.candidateGlassOverlay}>
                    {/* Left Verified Badge mounted directly on Name Card */}
                    <View style={styles.nameCardVerifiedBadge}>
                      <Text style={styles.floatingVerifiedText}>✓</Text>
                    </View>

                    {/* Name, Age, Profession */}
                    <View style={styles.candidateIdentityRow}>
                      <Text style={styles.candidateName}>Aanya, 25</Text>
                      <View style={styles.candidateDot} />
                      <Text style={styles.candidateProfession}>Product Designer @ Swiggy</Text>
                    </View>

                    {/* Interactive Voice Note Player Bar */}
                    <TouchableOpacity
                      style={styles.voiceNoteBar}
                      activeOpacity={0.8}
                      onPress={() => setIsPlayingVoice(!isPlayingVoice)}>
                      <View style={styles.voicePlayBtn}>
                        <Text style={styles.voicePlayIcon}>{isPlayingVoice ? '⏸' : '▶'}</Text>
                      </View>

                      {/* Dynamic Pulsing Sound Waveform Bars */}
                      <View style={styles.waveformContainer}>
                        {[10, 20, 14, 26, 18, 28, 22, 16, 24, 19, 26, 15, 21, 12].map((baseHeight, idx) => {
                          const barHeight = isPlayingVoice
                            ? soundWaveAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [
                                  baseHeight * (0.4 + ((idx % 3) * 0.2)),
                                  baseHeight * (0.9 + ((idx % 2) * 0.3)),
                                  baseHeight * (0.5 + (((idx + 1) % 3) * 0.2)),
                                ],
                              })
                            : baseHeight * 0.5;

                          return (
                            <Animated.View
                              key={idx}
                              style={[
                                styles.waveformBar,
                                { height: barHeight },
                                idx < 6 && styles.waveformBarActive,
                              ]}
                            />
                          );
                        })}
                      </View>

                      <Text style={styles.voiceDurationText}>15s Voice Note</Text>
                    </TouchableOpacity>

                    {/* Vedic Astrology Match Pill */}
                    <View style={styles.vedicMatchPill}>
                      <Text style={styles.vedicEmoji}>🦁</Text>
                      <Text style={styles.vedicMatchText}>Simha (Leo) • 92% Match</Text>
                    </View>
                  </View>
                </Animated.View>
              </Animated.View>

              {/* Bottom Sheet Auth Drawer */}
              <View style={[styles.kineticAuthDrawer, isKeyboardVisible && styles.kineticAuthDrawerKeyboard]}>
                {/* Drawer Top Handle Indicator */}
                {!isKeyboardVisible && <View style={styles.drawerHandleBar} />}

                {/* Social Proof Hook */}
                {!isKeyboardVisible && (
                  <View style={styles.socialProofRow}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.socialProofText}>Someone 3.2 km away is listening right now</Text>
                  </View>
                )}

                {!otpSent ? (
                  <>
                    {/* WhatsApp 1-Tap Hero Button with Neon Glow Rim */}
                    <TouchableOpacity
                      style={[
                        styles.waKineticBtn,
                        !isPhoneFilled && styles.waKineticBtnDisabled,
                        isWhatsAppDetected && isPhoneFilled && styles.waKineticBtnGlow,
                      ]}
                      onPress={() => handleSendOtp('whatsapp')}
                      disabled={!isPhoneFilled || loading || (resendTimer > 0 && authChannel === 'whatsapp')}
                      activeOpacity={0.85}>
                      {loading && authChannel === 'whatsapp' ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={styles.waKineticBtnInner}>
                          <Text style={styles.waKineticIcon}>💬</Text>
                          <Text style={[styles.waKineticText, !isPhoneFilled && styles.waKineticTextDisabled]}>
                            WhatsApp
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Sunken Dark Pill Phone Input */}
                    <View style={[styles.kineticPhoneBox, isPhoneFilled && styles.kineticPhoneBoxActive]}>
                      <View style={styles.kineticFlagContainer}>
                        <Text style={styles.kineticFlagIcon}>🇮🇳</Text>
                        <Text style={styles.kineticCountryCode}>+91</Text>
                      </View>
                      <View style={styles.kineticPhoneDivider} />
                      <TextInput
                        style={styles.kineticPhoneInput}
                        value={phone}
                        onChangeText={(text) => {
                          const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
                          setPhone(digitsOnly);
                          if (otpSent) {
                            setOtpSent(false);
                            setOtp('');
                            setResendTimer(0);
                            setIsAutoDetectingOtp(false);
                            setOtpFeedbackMsg(null);
                          }
                        }}
                        placeholder="Phone number"
                        placeholderTextColor="#687285"
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                    </View>

                    {/* Mobile Number Validation Status Hint */}
                    <View style={styles.kineticPhoneStatusRow}>
                      <Text
                        style={[
                          styles.kineticPhoneStatusText,
                          isPhoneFilled ? styles.kineticPhoneStatusSuccess : styles.kineticPhoneStatusHint,
                        ]}>
                        {isPhoneFilled
                          ? '✓ 10-digit number ready • Tap WhatsApp or Next'
                          : cleanedPhoneDigits.length > 0
                          ? `Enter 10-digit mobile number (${cleanedPhoneDigits.length}/10 digits)`
                          : 'Enter your 10-digit mobile number above'}
                      </Text>
                    </View>

                    {/* Velvet Rose Action Button ("Next" / SMS OTP) */}
                    <TouchableOpacity
                      style={[
                        styles.kineticNextBtn,
                        !isPhoneFilled && styles.kineticNextBtnDisabled,
                      ]}
                      onPress={() => handleSendOtp('sms')}
                      disabled={!isPhoneFilled || loading || (resendTimer > 0 && authChannel === 'sms')}
                      activeOpacity={0.85}>
                      {loading && authChannel === 'sms' ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={styles.kineticNextBtnInner}>
                          <Text style={[styles.kineticNextBtnText, !isPhoneFilled && styles.kineticNextBtnTextDisabled]}>
                            Next
                          </Text>
                          <Text style={styles.kineticNextArrow}>→</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* WhatsApp Detection Indicator Badge */}
                    <View style={styles.detectionRow}>
                      <View style={[styles.statusDot, isWhatsAppDetected ? styles.dotGreen : styles.dotGray]} />
                      <Text style={styles.detectionText}>
                        {isCheckingWhatsApp
                          ? 'Detecting WhatsApp on this device...'
                          : isWhatsAppDetected
                          ? '⚡ WhatsApp Detected • 1-Tap OTP Enabled'
                          : 'SMS OTP Fallback Ready'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* OTP Sent State Inside Bottom Sheet */}
                    <View style={styles.otpHeaderBox}>
                      <Text style={styles.otpHeaderTitle}>Verification Code</Text>
                      <Text style={styles.otpHeaderSub}>
                        Code dispatched to +91 {cleanedPhoneDigits.slice(-4).padStart(10, '•')} via {authChannel === 'whatsapp' ? 'WhatsApp 💬' : 'SMS 📱'}
                      </Text>
                    </View>

                    {/* Mock OTP Badge */}
                    {FEATURE_FLAGS.USE_MOCK_OTP && (
                      <View style={styles.mockOtpBanner}>
                        <Text style={styles.mockOtpText}>⚡ Test Mode Active: Code 123456 Auto-Filled!</Text>
                      </View>
                    )}

                    {autoDetectedSuccess && !FEATURE_FLAGS.USE_MOCK_OTP && (
                      <View style={styles.autoDetectSuccessBanner}>
                        <Text style={styles.autoDetectSuccessText}>
                          {authChannel === 'whatsapp'
                            ? '✓ WhatsApp OTP Auto-detected!'
                            : '✓ SMS OTP Auto-detected!'}
                        </Text>
                      </View>
                    )}

                    {/* Dynamic OTP Boxes UI */}
                    <Text style={styles.otpBoxesLabel}>Enter {expectedOtpLength}-Digit Verification Code</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => otpInputRef.current?.focus()}
                      style={styles.otpBoxesContainer}>
                      <View style={styles.otpBoxesRow} pointerEvents="none">
                        {Array.from({ length: expectedOtpLength }).map((_, idx) => {
                          const digit = otp[idx] || '';
                          const isFocused = otp.length === idx;
                          const isSuccess = autoDetectedSuccess && otp.length === expectedOtpLength;
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.liquidOtpBox,
                                isFocused && styles.liquidOtpBoxFocused,
                                isSuccess && styles.liquidOtpBoxSuccess,
                              ]}>
                              <Text style={[styles.otpDigit, isSuccess && styles.otpDigitSuccess]}>{digit}</Text>
                            </View>
                          );
                        })}
                      </View>

                      <TextInput
                        ref={otpInputRef}
                        value={otp}
                        onChangeText={(val) => {
                          const digitsOnly = val.replace(/[^0-9]/g, '').slice(0, expectedOtpLength);
                          setOtp(digitsOnly);
                          if (digitsOnly.length === expectedOtpLength) {
                            handleVerifyOtp(digitsOnly);
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={expectedOtpLength}
                        style={styles.hiddenOtpInput}
                        autoFocus
                        textContentType="oneTimeCode"
                        autoComplete="one-time-code"
                      />
                    </TouchableOpacity>

                    {/* Velvet Rose Action Button ("Verify & Proceed") */}
                    <TouchableOpacity
                      style={[
                        styles.kineticNextBtn,
                        styles.kineticVerifyBtn,
                        (otp.length !== expectedOtpLength || loading) && styles.kineticNextBtnDisabled,
                      ]}
                      onPress={() => handleVerifyOtp(otp)}
                      disabled={otp.length !== expectedOtpLength || loading}
                      activeOpacity={0.85}>
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={styles.kineticNextBtnInner}>
                          <Text
                            style={[
                              styles.kineticNextBtnText,
                              otp.length !== expectedOtpLength && styles.kineticNextBtnTextDisabled,
                            ]}>
                            Verify & Proceed
                          </Text>
                          <Text style={styles.kineticNextArrow}>→</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Resend Actions & Change Number */}
                    <View style={styles.otpResendWrapper}>
                      {resendTimer > 0 ? (
                        <Text style={styles.resendTimerText}>
                          Resend code in {resendTimer}s
                        </Text>
                      ) : (
                        <View style={styles.resendLinksRow}>
                          <TouchableOpacity
                            onPress={() => handleSendOtp('whatsapp')}
                            disabled={loading}>
                            <Text style={styles.resendLinkText}>Resend WhatsApp Code</Text>
                          </TouchableOpacity>
                          <Text style={styles.resendDot}>•</Text>
                          <TouchableOpacity
                            onPress={() => handleSendOtp('sms')}
                            disabled={loading}>
                            <Text style={styles.resendLinkText}>Send via SMS</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.editNumberBtn}
                        onPress={() => {
                          setOtpSent(false);
                          setOtp('');
                          setResendTimer(0);
                          setIsAutoDetectingOtp(false);
                          setOtpFeedbackMsg(null);
                        }}>
                        <Text style={styles.editNumberText}>← Change Mobile Number</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Bottom: 3D Holographic Trust Pass Badge (Feature Flag Controlled) */}
                {FEATURE_FLAGS.ENABLE_DIGILOCKER && !isKeyboardVisible && (
                  <View style={styles.trustBadgeContainer}>
                    <View style={styles.trustBadgePill}>
                      <Text style={styles.trustBadgeIcon}>🛡️</Text>
                      <Text style={styles.trustBadgeBrand}>DigiLocker</Text>
                      <View style={styles.trustBadgeDivider} />
                      <Text style={styles.trustBadgeText}>100% Verified Singles</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

        {/* STEP 2: Zero-Knowledge Trust Pass (DigiLocker & 3D Liveness) */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>2. Zero-Knowledge Trust Pass</Text>
            <Text style={styles.cardDesc}>
              {FEATURE_FLAGS.ENABLE_DIGILOCKER
                ? 'Indian singles swipe 2.4x more on verified profiles. We verify Age 18+ and Gender without saving your Aadhaar number.'
                : 'Indian singles swipe 2.4x more on verified profiles. Complete 3D Biometric Liveness check to eliminate catfish and deepfakes.'}
            </Text>

            {/* WhatsApp Verification Status */}
            {whatsappVerified && (
              <View style={styles.verificationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vTitle}>WhatsApp Real Identity</Text>
                  <Text style={styles.vSubtitle}>✓ WhatsApp Verified 💬 Badge Active</Text>
                </View>
                <View style={[styles.kycActionBtn, styles.kycActionBtnSuccess]}>
                  <Text style={styles.kycActionBtnText}>Verified 💬</Text>
                </View>
              </View>
            )}

            {/* DigiLocker Section (Feature Flag Controlled) */}
            {FEATURE_FLAGS.ENABLE_DIGILOCKER && (
              <View style={styles.verificationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vTitle}>DigiLocker ZK-KYC</Text>
                  <Text style={styles.vSubtitle}>
                    {digilockerVerified ? '✓ Gold Shield Badge Earned' : 'Zero-Knowledge Cryptographic Proof'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.kycActionBtn, digilockerVerified && styles.kycActionBtnSuccess]}
                  onPress={() => (digilockerVerified ? null : setShowDigiLockerModal(true))}>
                  <Text style={styles.kycActionBtnText}>
                    {digilockerVerified ? 'Verified 🛡️' : 'Verify Age 18+'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 3D Liveness Section */}
            <View style={styles.verificationRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vTitle}>3D Biometric Liveness</Text>
                <Text style={styles.vSubtitle}>
                  {livenessDone ? '✓ 0% Deepfake Detected' : '3-Sec Head Turn Video Check'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.kycActionBtn, livenessDone && styles.kycActionBtnSuccess]}
                onPress={() => (livenessDone ? null : setShowLivenessModal(true))}>
                <Text style={styles.kycActionBtnText}>
                  {livenessDone ? 'Verified 👤' : 'Start 3D Scan'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setStep(3)}>
              <Text style={styles.primaryButtonText}>Continue to Safety Shield →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Relative & Boss Auto-Shield */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>3. Relative & Boss Auto-Shield</Text>
            <Text style={styles.cardDesc}>
              Zero awkward encounters. Hashed locally before leaving your phone.
            </Text>

            {/* Contact Hashing */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setBlockContacts(!blockContacts)}>
              <View style={[styles.checkbox, blockContacts && styles.checkboxActive]}>
                {blockContacts && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Auto-Block Phone Contacts</Text>
                <Text style={styles.checkSub}>SHA-256 salted hash blocks relatives without storing names</Text>
              </View>
            </TouchableOpacity>

            {/* Corporate Domain Blocker */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Block Work Colleagues (@company.com)</Text>
            <TextInput
              style={styles.input}
              value={corpDomain}
              onChangeText={setCorpDomain}
              placeholder="e.g. swiggy.in or infosys.com"
              placeholderTextColor="#888"
            />

            {/* Mutual Friends Privacy */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setHideMutuals(!hideMutuals)}>
              <View style={[styles.checkbox, hideMutuals && styles.checkboxActive]}>
                {hideMutuals && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Hide from Mutual LinkedIn / Instas</Text>
                <Text style={styles.checkSub}>Isolate your dating life from social graph</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(4)}>
              <Text style={styles.primaryButtonText}>Continue to Intent →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: Relationship Intent */}
        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>4. What are you looking for?</Text>
            <Text style={styles.cardDesc}>
              We isolate algorithmic feeds. Marriage seekers will not be matched with casual daters.
            </Text>

            <View style={styles.intentGrid}>
              {[
                { key: 'MARRIAGE_MINDED', icon: '💍', title: 'Marriage Minded', sub: 'Serious matrimony track' },
                { key: 'SERIOUS_DATING', icon: '❤️', title: 'Serious Dating', sub: 'Long-term partnership' },
                { key: 'CASUAL_DATES', icon: '☕', title: 'Casual & Fun', sub: 'Dates, coffee, no rush' },
                { key: 'FIGURING_IT_OUT', icon: '✨', title: 'Exploring', sub: 'Open to connection' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.intentCard, intent === item.key && styles.intentCardSelected]}
                  onPress={() => setIntent(item.key as DatingIntent)}>
                  <Text style={styles.intentIcon}>{item.icon}</Text>
                  <Text style={[styles.intentTitle, intent === item.key && styles.intentTitleSelected]}>
                    {item.title}
                  </Text>
                  <Text style={styles.intentSub}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Languages Known Section */}
            <View style={styles.languageSectionWrap}>
              <View style={styles.langHeaderRow}>
                <Text style={styles.langSectionTitle}>🗣️ Languages Known</Text>
                <Text style={styles.langCountBadge}>{selectedLanguages.length} selected</Text>
              </View>
              <Text style={styles.langSectionSub}>
                Select languages you speak or add your mother tongue to connect on authentic cultural vibes.
              </Text>

              {/* Active Selected Chips */}
              <View style={styles.selectedLangRow}>
                {selectedLanguages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={styles.selectedLangChip}
                    onPress={() => toggleLanguage(lang)}
                    activeOpacity={0.7}>
                    <Text style={styles.selectedLangChipText}>✓ {lang}</Text>
                    <Text style={styles.selectedLangRemoveText}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preset Language Options */}
              <View style={styles.presetLangRow}>
                {ONBOARDING_LANGUAGES.map((item) => {
                  const clean = item.split(' ')[0];
                  const isSel = selectedLanguages.includes(clean);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.presetLangPill, isSel && styles.presetLangPillSelected]}
                      onPress={() => toggleLanguage(item)}
                      activeOpacity={0.75}>
                      <Text style={[styles.presetLangPillText, isSel && styles.presetLangPillTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Add Custom Language */}
              <View style={styles.customLangRow}>
                <TextInput
                  style={styles.customLangInput}
                  value={customLangInput}
                  onChangeText={setCustomLangInput}
                  placeholder="Add custom language (e.g. Italian, Konkani)..."
                  placeholderTextColor="#6B7280"
                  returnKeyType="done"
                  onSubmitEditing={handleAddCustomLanguage}
                />
                <TouchableOpacity
                  style={styles.customLangAddBtn}
                  onPress={handleAddCustomLanguage}
                  activeOpacity={0.8}>
                  <Text style={styles.customLangAddBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveShieldAndIntent} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Enter Match Lounge 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>

      {/* DigiLocker ZK Modal (Feature Flag Controlled) */}
      {FEATURE_FLAGS.ENABLE_DIGILOCKER && (
        <Modal visible={showDigiLockerModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Zero-Knowledge DigiLocker</Text>
              <Text style={styles.modalDesc}>
                We request an encrypted government assertion: Is user age $\ge$ 18 and Gender verified?
              </Text>
              <View style={styles.zkBadgeBox}>
                <Text style={styles.zkBadgeText}>🛡️ ZERO DATA RETAINED</Text>
                <Text style={styles.zkBadgeSub}>
                  Aadhaar number is never stored, logged, or visible to matches.
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleDigiLockerConfirm} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirm & Issue Gold Shield</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowDigiLockerModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Location Access Permission Modal */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.locIconCircle}>
              <Text style={styles.locIconEmoji}>📍</Text>
            </View>
            <Text style={styles.modalTitle}>Enable Location Access</Text>
            <Text style={styles.modalDesc}>
              Blunderr Dating uses your location to show verified singles nearby and calculate real-time distance.
            </Text>

            <View style={styles.locFeatureList}>
              <View style={styles.locFeatureItem}>
                <Text style={styles.locFeatureBullet}>✨</Text>
                <View style={styles.locFeatureTextCol}>
                  <Text style={styles.locFeatureHead}>Verified Nearby Matches</Text>
                  <Text style={styles.locFeatureSub}>Discover singles who live or work in your neighborhood.</Text>
                </View>
              </View>
              <View style={styles.locFeatureItem}>
                <Text style={styles.locFeatureBullet}>📏</Text>
                <View style={styles.locFeatureTextCol}>
                  <Text style={styles.locFeatureHead}>Accurate Distance</Text>
                  <Text style={styles.locFeatureSub}>See real-time km distance to potential dates.</Text>
                </View>
              </View>
              <View style={styles.locFeatureItem}>
                <Text style={styles.locFeatureBullet}>🛡️</Text>
                <View style={styles.locFeatureTextCol}>
                  <Text style={styles.locFeatureHead}>Total Privacy</Text>
                  <Text style={styles.locFeatureSub}>Your exact coordinates and address are never shared.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 14 }]}
              onPress={requestLocationAndProceed}
              disabled={isRequestingLocation}>
              {isRequestingLocation ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.primaryButtonText}>Detecting Location...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Allow Location Access 📍</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10 }]}
              onPress={handleSkipLocation}
              disabled={isRequestingLocation}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3D Liveness Camera & Movement Recording Modal */}
      <LivenessCameraModal
        visible={showLivenessModal}
        onClose={() => setShowLivenessModal(false)}
        onSuccess={handleLivenessSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080E',
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E94057',
    ...Platform.select({
      web: {
        filter: 'blur(85px)',
      },
      default: {
        shadowColor: '#E94057',
        shadowOpacity: 0.8,
        shadowRadius: 100,
        elevation: 20,
      },
    }),
  },
  ambientOrbRight: {
    position: 'absolute',
    top: 220,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#7928CA',
    ...Platform.select({
      web: {
        filter: 'blur(95px)',
      },
      default: {
        shadowColor: '#7928CA',
        shadowOpacity: 0.8,
        shadowRadius: 110,
        elevation: 20,
      },
    }),
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: -60,
    left: 20,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FF3B70',
    opacity: 0.16,
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      },
      default: {
        shadowColor: '#FF3B70',
        shadowOpacity: 0.6,
        shadowRadius: 90,
        elevation: 15,
      },
    }),
  },
  keyboardView: {
    flex: 1,
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  scrollContentStep1: {
    flexGrow: 1,
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  scrollContentStep1Keyboard: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 68,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  headerStepAbove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
    marginTop: 4,
  },
  stepIndicatorPill: {
    backgroundColor: 'rgba(233, 64, 87, 0.18)',
    borderWidth: 1,
    borderColor: '#E94057',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  stepIndicatorText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
  },
  // Concept 2: The Kinetic Card Stack Styles
  kineticPageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kineticPageContainerKeyboard: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  kineticBrandHeader: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
    zIndex: 25,
  },
  kineticBrandHeaderCompact: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 14,
    zIndex: 25,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  brandLogoIconGlow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 56, 92, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.6)',
  },
  brandLogoIconGlowCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  brandLogoIconText: {
    fontSize: 17,
  },
  brandTitleWhite: {
    fontSize: 27,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.65)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  brandTitleAccent: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FF385C',
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        textShadow: '0 0 20px rgba(255, 56, 92, 0.75), 0 2px 6px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(255, 56, 92, 0.75)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
      },
    }),
  },
  kineticVipTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.28)',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 242, 254, 0.2)',
      },
      default: {
        shadowColor: '#00F2FE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  kineticVipTagSparkle: {
    color: '#00F2FE',
    fontSize: 9,
  },
  kineticVipTagText: {
    color: '#D2F8FE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  kineticStackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
    width: '100%',
  },
  kineticCard4: {
    position: 'absolute',
    borderRadius: 22,
    backgroundColor: '#0F1219',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '-27deg' }, { translateX: -36 }, { translateY: 12 }],
    opacity: 0.5,
    elevation: 2,
  },
  kineticCard3: {
    position: 'absolute',
    borderRadius: 22,
    backgroundColor: '#131722',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '-20deg' }, { translateX: -24 }, { translateY: 8 }],
    padding: 8,
    paddingBottom: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  kineticCard2: {
    position: 'absolute',
    borderRadius: 22,
    backgroundColor: '#161B26',
    borderWidth: 2,
    borderColor: '#38E8C6',
    transform: [{ rotate: '-13deg' }, { translateX: -12 }, { translateY: 4 }],
    padding: 8,
    paddingBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 26px rgba(56, 232, 198, 0.35)',
      },
      default: {
        shadowColor: '#38E8C6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 7,
      },
    }),
  },
  kineticCardHero: {
    borderRadius: 22,
    backgroundColor: '#171D2A',
    borderWidth: 2,
    borderColor: '#4EE1BE',
    padding: 8,
    paddingBottom: 28,
    overflow: 'visible',
    position: 'relative',
    transform: [{ rotate: '-6deg' }],
    ...Platform.select({
      web: {
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 232, 198, 0.3)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.75,
        shadowRadius: 28,
        elevation: 14,
      },
    }),
  },
  cardPhotoFrame: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0C0F15',
  },
  cardInnerPhoto: {
    width: '100%',
    height: '100%',
  },
  cardInnerPhotoDimmed: {
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
  cardDimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 22, 0.65)',
  },
  cardDimmerOverlaySoft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 17, 26, 0.45)',
  },
  nameCardVerifiedBadge: {
    position: 'absolute',
    top: -12,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0088FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#171D2A',
    zIndex: 25,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 136, 255, 0.7)',
      },
      default: {
        shadowColor: '#0088FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 12,
      },
    }),
  },
  floatingVerifiedBadgeRight: {
    position: 'absolute',
    top: '42%',
    right: -12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0088FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#171D2A',
    zIndex: 15,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 136, 255, 0.6)',
      },
      default: {
        shadowColor: '#0088FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  floatingVerifiedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  cardHeartAccent: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    zIndex: 9,
  },
  cardHeartIcon: {
    fontSize: 16,
    color: '#FF3366',
  },
  candidateGlassOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 22,
    backgroundColor: 'rgba(14, 18, 28, 0.94)',
    borderRadius: 14,
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    transform: [{ rotate: '5deg' }],
    overflow: 'visible',
    zIndex: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
        elevation: 10,
      },
    }),
  },
  candidateIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  candidateName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  candidateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8E99AF',
    marginHorizontal: 6,
  },
  candidateProfession: {
    color: '#C7D0E0',
    fontSize: 12,
    fontWeight: '600',
  },
  voiceNoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  voicePlayBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  voicePlayIcon: {
    fontSize: 10,
    color: '#121620',
    fontWeight: '900',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: 2.5,
    marginRight: 8,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  waveformBarActive: {
    backgroundColor: '#00F2FE',
  },
  voiceDurationText: {
    color: '#A0ADC2',
    fontSize: 10,
    fontWeight: '700',
  },
  vedicMatchPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 171, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 171, 0, 0.35)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  vedicEmoji: {
    fontSize: 11,
  },
  vedicMatchText: {
    color: '#FFD56B',
    fontSize: 11,
    fontWeight: '800',
  },
  kineticAuthDrawer: {
    width: '100%',
    backgroundColor: 'rgba(16, 20, 30, 0.94)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  kineticAuthDrawerKeyboard: {
    marginTop: 2,
    marginBottom: 2,
    paddingVertical: 8,
  },
  drawerHandleBar: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#4A556B',
    alignSelf: 'center',
    marginBottom: 6,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E676',
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px #00E676',
      },
      default: {
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  socialProofText: {
    color: '#BAC4D6',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  waKineticBtn: {
    backgroundColor: '#1E9E5A',
    borderRadius: 14,
    paddingVertical: 10.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomWidth: 3,
    borderBottomColor: '#0E5C35',
    marginBottom: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 18px rgba(30, 158, 90, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
      },
      default: {
        shadowColor: '#1E9E5A',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  waKineticBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#1A3326',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: '#102219',
    borderBottomWidth: 2.5,
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
  waKineticBtnGlow: {
    backgroundColor: '#22B867',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: '#126A3B',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(37, 211, 102, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
      },
      default: {
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  waKineticBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waKineticIcon: {
    fontSize: 17,
  },
  waKineticText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  waKineticTextDisabled: {
    color: '#8BA598',
  },
  kineticPhoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 12, 18, 0.88)',
    borderRadius: 14,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.85)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.16)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 3,
  },
  kineticPhoneBoxActive: {
    borderColor: '#00F2FE',
    borderTopColor: 'rgba(0, 242, 254, 0.7)',
    borderBottomColor: 'rgba(0, 242, 254, 0.9)',
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
      },
      default: {
        shadowColor: '#00F2FE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  kineticFlagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.6)',
  },
  kineticFlagIcon: {
    fontSize: 16,
  },
  kineticCountryCode: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  kineticPhoneDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 10,
  },
  kineticPhoneInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingVertical: 0,
  },
  kineticPhoneStatusRow: {
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  kineticPhoneStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  kineticPhoneStatusHint: {
    color: '#768297',
  },
  kineticPhoneStatusSuccess: {
    color: '#00F2FE',
  },
  kineticNextBtn: {
    backgroundColor: '#FF385C',
    borderRadius: 14,
    paddingVertical: 10.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 170, 185, 0.7)',
    borderBottomWidth: 3,
    borderBottomColor: '#901224',
    marginBottom: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(255, 56, 92, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
      },
      default: {
        shadowColor: '#FF385C',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 7,
      },
    }),
  },
  kineticNextBtnDisabled: {
    opacity: 0.42,
    backgroundColor: '#351B24',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: '#1A0C11',
    borderBottomWidth: 2.5,
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
  kineticVerifyBtn: {
    marginTop: 10,
    marginBottom: 6,
  },
  kineticNextBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  kineticNextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  kineticNextBtnTextDisabled: {
    color: '#8A7A80',
  },
  kineticNextArrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  otpHeaderBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  otpHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  otpHeaderSub: {
    fontSize: 12,
    color: '#9E97B2',
    textAlign: 'center',
    lineHeight: 16,
  },
  otpBoxesLabel: {
    color: '#A099B5',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'center',
  },
  liquidOtpBox: {
    flex: 1,
    marginHorizontal: 3,
    aspectRatio: 1,
    backgroundColor: 'rgba(11, 7, 20, 0.82)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.12)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomWidth: 2.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  liquidOtpBoxFocused: {
    borderColor: '#E94057',
    borderTopColor: 'rgba(255, 120, 150, 0.9)',
    borderBottomColor: 'rgba(140, 15, 40, 0.9)',
    backgroundColor: 'rgba(233, 64, 87, 0.18)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 14px rgba(233, 64, 87, 0.4)',
      },
      default: {
        shadowColor: '#E94057',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  liquidOtpBoxSuccess: {
    borderColor: '#25D366',
    borderTopColor: 'rgba(120, 255, 170, 0.9)',
    borderBottomColor: 'rgba(10, 80, 40, 0.9)',
    backgroundColor: 'rgba(37, 211, 102, 0.16)',
  },
  mockOtpBanner: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  mockOtpText: {
    color: '#FF6584',
    fontSize: 11,
    fontWeight: '800',
  },
  otpResendWrapper: {
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  resendTimerText: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '600',
  },
  resendLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendLinkText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  resendDot: {
    color: '#555A6B',
    fontSize: 11,
  },
  editNumberBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editNumberText: {
    color: '#CACDD8',
    fontSize: 11,
    fontWeight: '600',
  },
  trustBadgeContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  trustBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.12)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 5,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  trustBadgeIcon: {
    fontSize: 12,
  },
  trustBadgeBrand: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trustBadgeDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  trustBadgeText: {
    color: '#CACDD8',
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    marginVertical: 20,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  sparkBadge: {
    backgroundColor: 'rgba(233, 64, 87, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E94057',
  },
  sparkBadgeText: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '700',
  },
  subHeadline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CACDD8',
    marginTop: 6,
  },
  subText: {
    fontSize: 12,
    color: '#7F8496',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(20, 13, 32, 0.74)',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 20px 50px rgba(233, 64, 87, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
      },
      default: {
        shadowColor: '#E94057',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 26,
        elevation: 6,
      },
    }),
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 13,
    color: '#8E94A5',
    lineHeight: 18,
    marginBottom: 16,
  },
  waContainer: {
    marginBottom: 16,
  },
  detectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#25D366',
  },
  dotGray: {
    backgroundColor: '#6B7082',
  },
  detectionText: {
    color: '#CACDD8',
    fontSize: 11,
    fontWeight: '700',
  },
  channelButtonsContainer: {
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  channelButtonCompact: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  channelButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#15161E',
    borderColor: '#262835',
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
  channelButtonDisabledText: {
    color: '#6B7082',
  },
  channelButtonDisabledSub: {
    color: '#525565',
  },
  phoneStatusRow: {
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  phoneStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  phoneStatusTextHint: {
    color: '#7F8496',
  },
  phoneStatusTextSuccess: {
    color: '#25D366',
  },
  waButton: {
    backgroundColor: '#128C7E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#25D366',
  },
  waButtonActive: {
    borderColor: '#25D366',
    backgroundColor: '#075E54',
  },
  waButtonDetected: {
    backgroundColor: '#075E54',
    borderColor: '#25D366',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(37, 211, 102, 0.3)',
      },
      default: {
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  waButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waButtonEmoji: {
    fontSize: 20,
  },
  waButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  instantPill: {
    backgroundColor: '#25D366',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  instantPillText: {
    color: '#075E54',
    fontSize: 9,
    fontWeight: '900',
  },
  waSubText: {
    color: '#E0F2F1',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  smsButton: {
    backgroundColor: '#1E1F28',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E303E',
  },
  smsButtonActive: {
    borderColor: '#E94057',
    backgroundColor: '#2A1820',
  },
  smsButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  smsButtonEmoji: {
    fontSize: 16,
  },
  smsButtonText: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '700',
  },
  openWhatsAppBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#075E54',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  openWhatsAppText: {
    color: '#25D366',
    fontSize: 11,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#262833',
  },
  orText: {
    color: '#6B7082',
    fontSize: 10,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  inputLabel: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1E1F28',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E303E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 10,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1E1F28',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E303E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  sendOtpBtn: {
    backgroundColor: '#262833',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D4150',
  },
  sendOtpBtnDisabled: {
    opacity: 0.6,
  },
  sendOtpBtnText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  otpInfoBanner: {
    backgroundColor: '#1E2333',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2D354E',
  },
  otpInfoText: {
    color: '#70A6FF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  autoDetectWrapper: {
    marginBottom: 12,
  },
  autoDetectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    padding: 10,
    borderRadius: 12,
  },
  autoDetectButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  autoDetectText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  autoDetectSuccessBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  autoDetectSuccessText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '800',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  otpBox: {
    flex: 1,
    marginHorizontal: 3,
    aspectRatio: 1,
    backgroundColor: '#1E1F28',
    borderWidth: 1.5,
    borderColor: '#2E303E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: '#E94057',
    backgroundColor: '#2D151B',
  },
  otpBoxSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  otpDigit: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  otpDigitSuccess: {
    color: '#4CAF50',
  },
  otpBoxesContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  hiddenOtpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  primaryButton: {
    backgroundColor: '#E94057',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#1E1F28',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '600',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1F28',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#2E303E',
  },
  vTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  vSubtitle: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  kycActionBtn: {
    backgroundColor: '#8A2387',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  kycActionBtnSuccess: {
    backgroundColor: '#2E7D32',
  },
  kycActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1F28',
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#54596B',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#E94057',
    borderColor: '#E94057',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  checkSub: {
    color: '#7F8496',
    fontSize: 11,
    marginTop: 2,
  },
  intentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  intentCard: {
    width: '48%',
    backgroundColor: '#1E1F28',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E303E',
    alignItems: 'center',
  },
  intentCardSelected: {
    borderColor: '#E94057',
    backgroundColor: '#2D151B',
  },
  intentIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  intentTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  intentTitleSelected: {
    color: '#E94057',
  },
  intentSub: {
    color: '#7C8193',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#16171E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262833',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#A0A4B4',
    lineHeight: 18,
    marginBottom: 16,
  },
  zkBadgeBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: '#FFC107',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  zkBadgeText: {
    color: '#FFC107',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },
  zkBadgeSub: {
    color: '#CACDD8',
    fontSize: 12,
    lineHeight: 18,
  },
  cameraScanBox: {
    height: 180,
    backgroundColor: '#14151B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3D4150',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanPlaceholder: {
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  scanReadyText: {
    color: '#7F8496',
    fontSize: 12,
  },
  scanningAnim: {
    alignItems: 'center',
    gap: 8,
  },
  scanText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scanSub: {
    color: '#E94057',
    fontSize: 12,
  },
  locIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1.5,
    borderColor: '#E94057',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },
  locIconEmoji: {
    fontSize: 28,
  },
  locFeatureList: {
    backgroundColor: '#1E202B',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#2D3040',
    gap: 12,
  },
  locFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locFeatureBullet: {
    fontSize: 16,
    marginTop: 1,
  },
  locFeatureTextCol: {
    flex: 1,
  },
  locFeatureHead: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  locFeatureSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  languageSectionWrap: {
    marginTop: 18,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#262836',
  },
  langHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  langSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  langCountBadge: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  langSectionSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  selectedLangRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  selectedLangChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: '#FF385C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  selectedLangChipText: {
    color: '#FF385C',
    fontSize: 12,
    fontWeight: '800',
  },
  selectedLangRemoveText: {
    color: '#FF385C',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  presetLangRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetLangPill: {
    backgroundColor: '#1A1C28',
    borderWidth: 1,
    borderColor: '#2E3245',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  presetLangPillSelected: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  presetLangPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  presetLangPillTextSelected: {
    color: '#00E5FF',
    fontWeight: '800',
  },
  customLangRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  customLangInput: {
    flex: 1,
    backgroundColor: '#13141E',
    borderWidth: 1,
    borderColor: '#2E3245',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
  },
  customLangAddBtn: {
    backgroundColor: '#7928CA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customLangAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
