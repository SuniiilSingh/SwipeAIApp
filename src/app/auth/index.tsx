import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { DatingIntent } from '@/types';
import LivenessCameraModal from '@/components/liveness-camera-modal';
import { FEATURE_FLAGS } from '@/config/features';
import { BlunderRWordmark } from '@/components/blunderr-wordmark';

const ONBOARDING_LANGUAGES = [
  'English 🇬🇧', 'Hindi 🇮🇳', 'Punjabi 🌾', 'Bengali 🎨', 'Tamil 🛕', 'Telugu 🏛️',
  'Kannada 🌿', 'Malayalam 🌴', 'Marathi 🚩', 'Gujarati 💎', 'Marwari 🏜️', 'Urdu 📜',
  'French 🥐', 'Spanish 💃', 'German 🥨'
];

// First-screen teaser deck (Option A · Glass). Kiara is the flagship AI model.
const TEASER_PROFILES = [
  {
    name: 'Kiara',
    age: 25,
    meta: '800m away · Architect @ Indiranagar',
    chip: '⚖️ Tula · 96% Match',
    photo: 'https://blunderr.in/downloads/blunderr-model-pink-offshoulder.jpg',
    localImage: require('@/assets/images/teaser-kiara-pink.jpg'),
  },
  {
    name: 'Aanya',
    age: 25,
    meta: '1.2 km away · Product Designer',
    chip: '🦁 Simha · 92% Match',
    photo: 'https://blunderr.in/downloads/blunderr-model-e-studio.jpg',
    localImage: require('@/assets/images/teaser-aanya-studio.jpg'),
  },
  {
    name: 'Rhea',
    age: 24,
    meta: '1.8 km away · Creative Producer',
    chip: '🏹 Dhanu · 94% Match',
    photo: 'https://blunderr.in/downloads/blunderr-model-a.jpg',
    localImage: require('@/assets/images/teaser-rhea-model.jpg'),
  },
];

const handleDirectDownload = (url: string) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    Linking.openURL(url).catch(() => {});
  }
};

export default function AuthScreen() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [expectedOtpLength, setExpectedOtpLength] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [authChannel, setAuthChannel] = useState<'whatsapp' | 'sms'>(
    FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH ? 'whatsapp' : 'sms'
  );
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  // WhatsApp Detection State
  const [isWhatsAppDetected, setIsWhatsAppDetected] = useState<boolean | null>(
    FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH ? null : false
  );
  const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH);

  // OTP Auto-Detect State
  const [otpSent, setOtpSent] = useState(false);
  const [isAutoDetectingOtp, setIsAutoDetectingOtp] = useState(false);
  const [autoDetectedSuccess, setAutoDetectedSuccess] = useState(false);
  const [otpFeedbackMsg, setOtpFeedbackMsg] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
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
  const [tempSelectedLanguages, setTempSelectedLanguages] = useState<string[]>(['English', 'Hindi']);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [customLangInput, setCustomLangInput] = useState('');

  const toggleLanguage = (lang: string) => {
    const cleanLang = lang.split(' ')[0];
    if (tempSelectedLanguages.includes(cleanLang)) {
      if (tempSelectedLanguages.length > 1) {
        setTempSelectedLanguages(tempSelectedLanguages.filter((l) => l !== cleanLang));
      }
    } else {
      setTempSelectedLanguages([...tempSelectedLanguages, cleanLang]);
    }
  };

  const handleAddCustomLanguage = () => {
    const trimmed = customLangInput.trim();
    if (!trimmed) return;
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!tempSelectedLanguages.includes(capitalized)) {
      setTempSelectedLanguages([...tempSelectedLanguages, capitalized]);
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
  const isOtpFilled = otp.length === expectedOtpLength && expectedOtpLength > 0;

  // ── Option A · Glass: swipe deck + morphing mobile-number button ──
  const useNativeAnim = Platform.OS !== 'web';
  const [teaserIndex, setTeaserIndex] = useState(0);
  const teaserIndexRef = useRef(0);
  teaserIndexRef.current = teaserIndex;
  const [phoneMode, setPhoneMode] = useState(false);
  const [likedName, setLikedName] = useState<string | null>(null);
  const swipeAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const morphAnim = useRef(new Animated.Value(0)).current;
  const goAnim = useRef(new Animated.Value(0)).current;
  const otpGoAnim = useRef(new Animated.Value(0)).current;
  const phoneInputRef = useRef<TextInput>(null);

  const currentTeaser = TEASER_PROFILES[teaserIndex % TEASER_PROFILES.length];
  const nextTeaser = TEASER_PROFILES[(teaserIndex + 1) % TEASER_PROFILES.length];

  // Stable physical screen dimensions: immune to keyboard toggle resizes & SSR 0-width collapse
  const screenDimensions = Dimensions.get('screen');
  const windowDimensions = Dimensions.get('window');
  const clientWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const clientHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const effectiveWidth = Math.max(
    windowWidth || 0,
    windowDimensions.width || 0,
    screenDimensions.width || 0,
    clientWidth || 0,
    320
  );
  const effectiveHeight = Math.max(
    windowHeight || 0,
    windowDimensions.height || 0,
    screenDimensions.height || 0,
    clientHeight || 0,
    480
  );

  const isUltraCompactScreen = effectiveHeight < 640;
  const isCompactScreen = effectiveHeight < 760;

  // Responsive deck sizing: Option 2 (Dynamic Flex Budgeting)
  // In resting state (keypad closed), card expands fluidly to fill the available screen budget with zero dead void.
  // When typing (keypad open), card compresses fluidly to provide generous clearance for keypad + input.
  const deckWidth = Math.max(280, Math.min(effectiveWidth - 24, 384));
  const safeHeight = effectiveHeight - (insets.top || 0) - (insets.bottom || 0);
  const nonDeckFootprint = isUltraCompactScreen ? 134 : isCompactScreen ? 146 : 158;
  const availableForDeck = Math.max(280, safeHeight - nonDeckFootprint);
  const restingDeckHeight = Math.max(290, Math.min(availableForDeck, 640));
  const proportionalDeck = isUltraCompactScreen
    ? Math.floor(safeHeight * 0.52)
    : isCompactScreen
    ? Math.floor(safeHeight * 0.54)
    : Math.floor(safeHeight * 0.55);
  const typingDeckHeight = Math.max(220, Math.min(proportionalDeck, 290));
  const deckHeight = isKeyboardVisible ? typingDeckHeight : restingDeckHeight;

  const otpElevateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (otpSent) {
      Animated.spring(otpElevateAnim, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: useNativeAnim,
      }).start();
    } else {
      Animated.timing(otpElevateAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: useNativeAnim,
      }).start();
    }
  }, [otpSent]);

  // The model photo card deck stays stably positioned under the top bar with a subtle micro-lift
  const deckElevateY = Animated.add(
    morphAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    }),
    otpElevateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -4],
    })
  );

  // Profile Info glides up inside the card so Kiara's name, age and match badge stay proudly above the text box
  const cardInfoElevateY = Animated.add(
    morphAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, isUltraCompactScreen ? -36 : isCompactScreen ? -42 : -48],
    }),
    otpElevateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, isUltraCompactScreen ? -20 : isCompactScreen ? -24 : -28],
    })
  );

  // Text box pops up significantly higher over the lower part of the model card to stay completely above keypad
  const phoneLift = isUltraCompactScreen ? 88 : isCompactScreen ? 102 : 112;
  const otpLift = isUltraCompactScreen ? 134 : isCompactScreen ? 148 : 158;
  const loginElevateY = Animated.add(
    morphAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -phoneLift],
    }),
    otpElevateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(otpLift - phoneLift)],
    })
  );

  const cardRotate = swipeAnim.x.interpolate({
    inputRange: [-220, 0, 220],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });
  const likeStampOpacity = swipeAnim.x.interpolate({ inputRange: [0, 90], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeStampOpacity = swipeAnim.x.interpolate({ inputRange: [-90, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const openPhoneMode = (focus: boolean) => {
    setPhoneMode(true);
    Animated.timing(morphAnim, { toValue: 1, duration: 240, useNativeDriver: useNativeAnim }).start();
    if (focus) {
      setTimeout(() => phoneInputRef.current?.focus(), 260);
    }
  };

  const closePhoneMode = () => {
    Keyboard.dismiss();
    Animated.timing(morphAnim, { toValue: 0, duration: 220, useNativeDriver: useNativeAnim }).start(() => {
      setPhoneMode(false);
    });
  };

  // Arrow pops in only once all 10 digits are entered
  useEffect(() => {
    Animated.spring(goAnim, {
      toValue: isPhoneFilled ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: useNativeAnim,
    }).start();
  }, [isPhoneFilled]);

  // Arrow pops in only once all OTP digits are entered
  useEffect(() => {
    Animated.spring(otpGoAnim, {
      toValue: isOtpFilled ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: useNativeAnim,
    }).start();
  }, [isOtpFilled]);

  // swipeAnim is driven by Animated.event (JS), so all its animations stay on the JS driver
  const flyCard = (dir: 'left' | 'right' | 'up') => {
    const target =
      dir === 'up' ? { x: 0, y: -900 } : { x: dir === 'right' ? 520 : -520, y: 40 };
    const swipedName = TEASER_PROFILES[teaserIndexRef.current % TEASER_PROFILES.length].name;
    Animated.timing(swipeAnim, { toValue: target, duration: 260, useNativeDriver: false }).start(() => {
      swipeAnim.setValue({ x: 0, y: 0 });
      setTeaserIndex((i) => i + 1);
      if (dir !== 'left' && !otpSent) {
        setLikedName(swipedName);
        openPhoneMode(false);
      }
    });
  };
  const flyCardRef = useRef(flyCard);
  flyCardRef.current = flyCard;

  const deckPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
      onPanResponderMove: Animated.event([null, { dx: swipeAnim.x, dy: swipeAnim.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 110) flyCardRef.current('right');
        else if (g.dx < -110) flyCardRef.current('left');
        else if (g.dy < -120) flyCardRef.current('up');
        else Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      },
    })
  ).current;

  const submitPhone = () => {
    if (!isPhoneFilled || loading) return;
    handleSendOtp(FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH && isWhatsAppDetected ? 'whatsapp' : 'sms');
  };

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
      router.replace('/auth/onboarding-decks' as any);
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
    if (!FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH) {
      setIsWhatsAppDetected(false);
      setIsCheckingWhatsApp(false);
      return;
    }
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

  // Keyboard visibility listener to dynamically prevent keypad override & smoothly scale photo deck (Option A)
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (Platform.OS !== 'web') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setIsKeyboardVisible(true);
        if (e?.endCoordinates?.height) {
          setKeyboardHeight(e.endCoordinates.height);
        }
        Animated.timing(keyboardAnim, {
          toValue: 1,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 200,
          useNativeDriver: false,
        }).start();
        Animated.timing(morphAnim, {
          toValue: 1,
          duration: Platform.OS === 'ios' ? (e?.duration || 240) : 220,
          useNativeDriver: useNativeAnim,
        }).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        if (Platform.OS !== 'web') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 200,
          useNativeDriver: false,
        }).start();
        Animated.timing(morphAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? (e?.duration || 220) : 200,
          useNativeDriver: useNativeAnim,
        }).start();
        // If user dismissed keyboard without entering any digits and OTP not sent, return to CTA button
        setPhone((currentPhone) => {
          if (!currentPhone || currentPhone.trim().length === 0) {
            setPhoneMode(false);
          }
          return currentPhone;
        });
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
    const targetChannel = FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH ? channel : 'sms';
    setLoading(true);
    setAuthChannel(targetChannel);
    setAutoDetectedSuccess(false);
    setOtpFeedbackMsg(null);
    setOtp('');
    try {
      const res = await api.sendOtp(phone, targetChannel);
      setLoading(false);
      setOtpSent(true);
      setResendTimer(30);
      const codeLen = (res && (res.otpLength === 4 || res.otpLength === 6)) ? res.otpLength : 6;
      setExpectedOtpLength(codeLen);
      const channelLabel = targetChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';

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
      const channelLabel = targetChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';
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
    if (FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH) {
      handleSendOtp('whatsapp');
    } else {
      handleSendOtp('sms');
    }
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
        behavior={step === 1 ? undefined : (Platform.OS === 'ios' ? 'padding' : undefined)}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            step === 1 ? styles.scrollContentStep1 : undefined,
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={step !== 1}
          bounces={step !== 1}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}>
          {/* Header above steps 2, 3, 4 */}
          {step > 1 && (
            <View style={styles.headerStepAbove}>
              <View style={styles.brandLogoRow}>
                <BlunderRWordmark size="sm" slant={true} />
              </View>
              <View style={styles.stepIndicatorPill}>
                <Text style={styles.stepIndicatorText}>Step {step} of 4</Text>
              </View>
            </View>
          )}

          {/* STEP 1: Option A · Glass Teaser Deck + Morphing Mobile Login */}
          {step === 1 && (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.optAPageContainer}>
              {/* Top Wordmark & Online Badge Header */}
              <View style={[styles.optATopBar, { width: deckWidth }]}>
                <View style={styles.brandLogoRow}>
                  <View style={styles.brandLogoIconGlow}>
                    <Text style={styles.brandLogoIconText}>🔥</Text>
                  </View>
                  <BlunderRWordmark size="md" slant={true} />
                </View>
                <View style={styles.optAOnlinePill}>
                  <View style={styles.optALiveDot} />
                  <Text style={styles.optAOnlineText}>1,240 online</Text>
                </View>
              </View>

              {/* Center Main Content: Deck + Login Area directly anchored */}
              <View
                style={[
                  styles.optAMainContent,
                  {
                    paddingTop: isUltraCompactScreen ? 6 : isCompactScreen ? 10 : 14,
                    paddingBottom: Math.max(insets.bottom || 0, 10),
                  },
                ]}>
                {/* Interactive Card Deck */}
                <Animated.View
                  style={[
                    styles.optADeckContainer,
                    {
                      width: deckWidth,
                      height: deckHeight,
                      transform: [{ translateY: deckElevateY }],
                    },
                  ]}>
                  {/* Background Card (Preview of next profile) */}
                  <View style={[styles.optACardBack, { width: deckWidth, height: deckHeight }]} pointerEvents="none">
                    <Image
                      source={nextTeaser.localImage || { uri: nextTeaser.photo }}
                      style={styles.optACardImage}
                      resizeMode="cover"
                      fadeDuration={0}
                    />
                    <View style={styles.optACardShade} />
                    <View style={styles.optACardTopBadges}>
                      <View style={styles.optABadge}>
                        <Text style={styles.optABadgeText}>✦ LIVE PREVIEW</Text>
                      </View>
                      <View style={styles.optABadge}>
                        <Text style={styles.optABadgeText}>🛡️ 3D Verified</Text>
                      </View>
                    </View>
                    <Animated.View
                      style={[
                        styles.optACardInfo,
                        { transform: [{ translateY: cardInfoElevateY }] },
                      ]}>
                      <Text style={styles.optACardName}>
                        {nextTeaser.name}, {nextTeaser.age} <Text style={styles.optACardVerified}>✓</Text>
                      </Text>
                      <Text style={styles.optACardMeta}>📍 {nextTeaser.meta}</Text>
                      <View style={styles.optAChip}>
                        <Text style={styles.optAChipText}>{nextTeaser.chip}</Text>
                      </View>
                    </Animated.View>
                  </View>

                  {/* Foreground Card (Interactive swipe with PanResponder) */}
                  <Animated.View
                    {...deckPanResponder.panHandlers}
                    style={[
                      styles.optACardFront,
                      {
                        width: deckWidth,
                        height: deckHeight,
                        transform: [
                          { translateX: swipeAnim.x },
                          { translateY: swipeAnim.y },
                          { rotate: cardRotate },
                        ],
                      },
                    ]}>
                    <Image
                      source={currentTeaser.localImage || { uri: currentTeaser.photo }}
                      style={styles.optACardImage}
                      resizeMode="cover"
                      fadeDuration={0}
                    />
                    <View style={styles.optACardShade} />

                  {/* Stamp Badges on Drag */}
                  <Animated.View style={[styles.optAStampLike, { opacity: likeStampOpacity }]} pointerEvents="none">
                    <Text style={styles.optAStampLikeText}>LIKE</Text>
                  </Animated.View>
                  <Animated.View style={[styles.optAStampNope, { opacity: nopeStampOpacity }]} pointerEvents="none">
                    <Text style={styles.optAStampNopeText}>NOPE</Text>
                  </Animated.View>

                  {/* Top Badges */}
                  <View style={styles.optACardTopBadges} pointerEvents="none">
                    <View style={styles.optABadge}>
                      <Text style={styles.optABadgeText}>✦ LIVE PREVIEW</Text>
                    </View>
                    <View style={styles.optABadge}>
                      <Text style={styles.optABadgeText}>🛡️ 3D Verified</Text>
                    </View>
                  </View>

                  {/* Profile Info */}
                  <Animated.View
                    style={[
                      styles.optACardInfo,
                      { transform: [{ translateY: cardInfoElevateY }] },
                    ]}
                    pointerEvents="none">
                    <Text style={styles.optACardName}>
                      {currentTeaser.name}, {currentTeaser.age} <Text style={styles.optACardVerified}>✓</Text>
                    </Text>
                    <Text style={styles.optACardMeta}>📍 {currentTeaser.meta}</Text>
                    <View style={styles.optAChip}>
                      <Text style={styles.optAChipText}>{currentTeaser.chip}</Text>
                    </View>
                  </Animated.View>

                  {/* Option A Glass Action Buttons inside the card bottom */}
                  <Animated.View
                    style={[
                      styles.optACardActions,
                      {
                        opacity: morphAnim.interpolate({
                          inputRange: [0, 0.4],
                          outputRange: [1, 0],
                        }),
                      },
                    ]}
                    pointerEvents={phoneMode || otpSent ? 'none' : 'auto'}>
                    {/* Pass Button */}
                    <TouchableOpacity
                      style={styles.optAActPass}
                      activeOpacity={0.8}
                      onPress={() => flyCard('left')}>
                      <Text style={styles.optAActPassIcon}>✕</Text>
                    </TouchableOpacity>

                    {/* Star / Super Like Button */}
                    <TouchableOpacity
                      style={styles.optAActStar}
                      activeOpacity={0.8}
                      onPress={() => flyCard('up')}>
                      <Text style={styles.optAActStarIcon}>★</Text>
                    </TouchableOpacity>

                    {/* Like Button (Prominent) */}
                    <TouchableOpacity
                      style={styles.optAActLike}
                      activeOpacity={0.85}
                      onPress={() => flyCard('right')}>
                      <Text style={styles.optAActLikeIcon}>❤️</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </Animated.View>

              {/* Login Area (Option A: Morphing CTA -> Phone Input + Arrow / OTP) */}
              <Animated.View
                style={[
                  styles.optALoginArea,
                  {
                    width: deckWidth,
                    transform: [{ translateY: loginElevateY }],
                  },
                ]}>
                {!otpSent ? (
                  <View style={[styles.optAMorphBox, phoneMode && styles.optAMorphBoxActive]}>
                    {!phoneMode ? (
                      <TouchableOpacity
                        style={styles.optACtaBtn}
                        activeOpacity={0.88}
                        onPress={() => openPhoneMode(true)}>
                        <Text style={styles.optACtaIcon}>📱</Text>
                        <Text style={styles.optACtaText}>Continue with Mobile Number</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={1}
                        style={styles.optAFieldRow}
                        onPress={() => phoneInputRef.current?.focus()}>
                        <View style={styles.optACountryCodeBox}>
                          <Text style={styles.optACountryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <TextInput
                          ref={phoneInputRef}
                          style={styles.optAPhoneInput}
                          value={phone}
                          onChangeText={(text) => {
                            const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
                            setPhone(digits);
                          }}
                          onFocus={() => {
                            setIsKeyboardVisible(true);
                            Animated.timing(morphAnim, {
                              toValue: 1,
                              duration: 240,
                              useNativeDriver: useNativeAnim,
                            }).start();
                          }}
                          onBlur={() => {
                            setIsKeyboardVisible(false);
                            Animated.timing(morphAnim, {
                              toValue: 0,
                              duration: 220,
                              useNativeDriver: useNativeAnim,
                            }).start();
                            if (!phone || phone.trim().length === 0) {
                              setPhoneMode(false);
                            }
                          }}
                          placeholder="Mobile number"
                          placeholderTextColor="#5D6679"
                          keyboardType="number-pad"
                          maxLength={10}
                          returnKeyType="done"
                          onSubmitEditing={submitPhone}
                        />

                        {/* Arrow Button pops in on 10 digits */}
                        {isPhoneFilled && (
                          <Animated.View style={{ transform: [{ scale: goAnim }] }}>
                            <TouchableOpacity
                              style={styles.optAGoBtn}
                              activeOpacity={0.85}
                              accessibilityRole="button"
                              disabled={loading}
                              onPress={submitPhone}>
                              {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text style={styles.optAGoArrow}>→</Text>
                              )}
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  /* OTP Verification inline in the same spot */
                  <View style={styles.optAOtpBox}>
                    <Text style={styles.optAOtpTitle}>
                      Code sent to <Text style={styles.optAOtpNumber}>+91 ••••• •{cleanedPhoneDigits.slice(-4)}</Text>
                    </Text>

                    {/* Liquid OTP Boxes with same arrow button on completion */}
                    <View style={styles.optAOtpRowWithButton}>
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => otpInputRef.current?.focus()}
                        style={styles.optAOtpBoxesTouchable}>
                        <View style={styles.optAOtpBoxesRow} pointerEvents="none">
                          {Array.from({ length: expectedOtpLength }).map((_, idx) => {
                            const digit = otp[idx] || '';
                            const isFocused = otp.length === idx;
                            return (
                              <View
                                key={idx}
                                style={[
                                  styles.liquidOtpBox,
                                  isFocused && styles.liquidOtpBoxFocused,
                                  otp.length === expectedOtpLength && styles.liquidOtpBoxSuccess,
                                ]}>
                                <Text style={styles.otpDigit}>{digit}</Text>
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
                          }}
                          onFocus={() => setIsKeyboardVisible(true)}
                          onBlur={() => setIsKeyboardVisible(false)}
                          keyboardType="number-pad"
                          maxLength={expectedOtpLength}
                          style={styles.hiddenOtpInput}
                          autoFocus
                          textContentType="oneTimeCode"
                          autoComplete="one-time-code"
                          returnKeyType="done"
                          onSubmitEditing={() => {
                            if (isOtpFilled) {
                              handleVerifyOtp(otp);
                            }
                          }}
                        />
                      </TouchableOpacity>

                      {/* Arrow Button pops in on OTP completion (same as mobile number) */}
                      {isOtpFilled && (
                        <Animated.View style={{ transform: [{ scale: otpGoAnim }], marginLeft: 8 }}>
                          <TouchableOpacity
                            style={styles.optAGoBtn}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            disabled={loading}
                            onPress={() => handleVerifyOtp(otp)}>
                            {loading ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <Text style={styles.optAGoArrow}>→</Text>
                            )}
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </View>

                    {/* Resend & Change Number Row */}
                    <View style={styles.optAOtpActionsRow}>
                      {resendTimer > 0 ? (
                        <Text style={styles.optAResendTimer}>Resend in {resendTimer}s</Text>
                      ) : (
                        <TouchableOpacity onPress={() => handleSendOtp('sms')} disabled={loading}>
                          <Text style={styles.optAResendLink}>Resend code</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.optADot}>•</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtp('');
                          setResendTimer(0);
                          openPhoneMode(true);
                        }}>
                        <Text style={styles.optAChangeLink}>Change number</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Subtext Trust Line (Fades out when in phone mode or OTP mode so it doesn't clutter the card) */}
                <Animated.View
                  style={{
                    opacity: morphAnim.interpolate({
                      inputRange: [0, 0.4],
                      outputRange: [1, 0],
                    }),
                  }}
                  pointerEvents={phoneMode ? 'none' : 'auto'}>
                  <Text style={styles.optATrustText}>
                    100% verified profiles • By continuing you agree to{' '}
                    <Text
                      style={styles.optALink}
                      onPress={() => Linking.openURL('https://api.blunderr.in/terms').catch(() => {})}>
                      Terms
                    </Text>
                    {' '}&amp;{' '}
                    <Text
                      style={styles.optALink}
                      onPress={() => Linking.openURL('https://api.blunderr.in/privacy').catch(() => {})}>
                      Privacy
                    </Text>
                  </Text>
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
            {FEATURE_FLAGS.ENABLE_WHATSAPP_AUTH && whatsappVerified && (
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
                  {livenessDone ? '✓ 3D Movement Verified (0% Deepfake)' : '3D Head Turn Check (Center, Right, Left)'}
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
              maxLength={100}
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

            {/* Languages Known Section (Clickable Text Box with Pen Edit -> Opens Pop-up Modal) */}
            <View style={styles.languageSectionWrap}>
              <View style={styles.langHeaderRow}>
                <Text style={styles.langSectionTitle}>🗣️ Languages Known</Text>
                <TouchableOpacity
                  style={styles.langCountBadge}
                  activeOpacity={0.75}
                  onPress={() => {
                    setTempSelectedLanguages([...selectedLanguages]);
                    setCustomLangInput('');
                    setShowLanguageModal(true);
                  }}>
                  <Text style={styles.langCountBadgeText}>
                    ✏️ {selectedLanguages.length} selected
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.langSectionSub}>
                Tap the text box or pen icon below to edit languages you speak or add your mother tongue.
              </Text>

              <TouchableOpacity
                style={styles.langTextBoxTrigger}
                activeOpacity={0.8}
                onPress={() => {
                  setTempSelectedLanguages([...selectedLanguages]);
                  setCustomLangInput('');
                  setShowLanguageModal(true);
                }}>
                <Text
                  style={[
                    styles.langTextBoxValue,
                    selectedLanguages.length === 0 && { color: '#6B7280' },
                  ]}
                  numberOfLines={2}>
                  {selectedLanguages.length > 0
                    ? selectedLanguages.join(', ')
                    : 'Tap to edit languages known...'}
                </Text>
                <View style={styles.langTextBoxRightBadge}>
                  <Text style={styles.langTextBoxRightText}>✏️ Edit</Text>
                </View>
              </TouchableOpacity>
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

      {/* Languages Known Pop-up Modal (Cancel Top-Right, Done at Bottom) */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.langModalContent}>
            <View style={styles.langModalTopHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.langModalTitle}>🗣️ Languages Known</Text>
                <Text style={styles.langModalSub}>
                  {tempSelectedLanguages.length} language{tempSelectedLanguages.length === 1 ? '' : 's'} selected
                </Text>
              </View>
              <TouchableOpacity
                style={styles.langModalCancelTopBtn}
                activeOpacity={0.8}
                onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.langModalCancelTopText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 340, width: '100%' }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Active Selected Chips */}
              <View style={styles.selectedLangRow}>
                {tempSelectedLanguages.map((lang) => (
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
                  const isSel = tempSelectedLanguages.includes(clean);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.presetLangPill, isSel && styles.presetLangPillSelected]}
                      onPress={() => toggleLanguage(item)}
                      activeOpacity={0.75}>
                      <Text style={[styles.presetLangPillText, isSel && styles.presetLangPillTextSelected]}>
                        {item} {isSel ? '✓' : ''}
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
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 16, width: '100%' }]}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedLanguages([...tempSelectedLanguages]);
                setShowLanguageModal(false);
              }}>
              <Text style={styles.primaryButtonText}>✓ Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              BlunderR uses your location to show verified singles nearby and calculate real-time distance.
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContentStep1: {
    flexGrow: 1,
    paddingVertical: 2,
    paddingHorizontal: 10,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
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
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineStyle: 'none',
        boxShadow: 'none',
      } as any,
    }),
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  langCountBadgeText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
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
  langTextBoxTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13141E',
    borderWidth: 1.5,
    borderColor: '#2E3245',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  langTextBoxValue: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  langTextBoxRightBadge: {
    backgroundColor: 'rgba(233, 64, 87, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  langTextBoxRightText: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '800',
  },
  langModalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#151621',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(233, 64, 87, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  langModalTopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  langModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  langModalSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  langModalCancelTopBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  langModalCancelTopText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '800',
  },
  authLegalBox: {
    marginTop: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  authLegalText: {
    color: '#8A8D98',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  authLegalLink: {
    color: '#E94057',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  webAuthDownloadContainer: {
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 8,
  },
  webAuthDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  webAuthDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  webAuthDividerText: {
    color: '#8A8D98',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
  },
  webAuthBtnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  webAuthApkBtn: {
    flex: 1,
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webAuthIosBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Option A · Glass Teaser Deck & Morphing Login Styles
  optAPageContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    overflow: 'hidden',
  },
  optAMainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optATopBar: {
    width: '100%',
    maxWidth: 390,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 4,
    zIndex: 10,
  },
  optAOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  optALiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E676',
    ...Platform.select({
      web: { boxShadow: '0 0 8px #00E676' },
      default: { shadowColor: '#00E676', shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
    }),
  },
  optAOnlineText: {
    color: '#B8F5D0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  optADeckContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  optACardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F1219',
    transform: [{ scale: 0.95 }, { translateY: 6 }],
    opacity: 0.55,
  },
  optACardFront: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#12151F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: { boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 10 },
    }),
  },
  optACardImage: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        objectFit: 'cover' as any,
        objectPosition: 'center 15%' as any,
      },
    }),
  },
  optACardShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 52%, rgba(5,6,10,0.9) 100%)',
      },
      default: {
        backgroundColor: 'rgba(0,0,0,0.14)',
      },
    }),
  },
  optACardTopBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  optABadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' },
    }),
  },
  optABadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optACardInfo: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 68,
    zIndex: 5,
  },
  optACardName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  optACardVerified: {
    color: '#0088FF',
    fontSize: 16,
    fontWeight: '900',
  },
  optACardMeta: {
    color: '#D4DBE8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  optAChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: 'rgba(255, 171, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 171, 0, 0.45)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optAChipText: {
    color: '#FFD56B',
    fontSize: 11,
    fontWeight: '800',
  },
  optAStampLike: {
    position: 'absolute',
    top: 40,
    left: 16,
    borderWidth: 3,
    borderColor: '#00E676',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    transform: [{ rotate: '-14deg' }],
    zIndex: 20,
  },
  optAStampLikeText: {
    color: '#00E676',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  optAStampNope: {
    position: 'absolute',
    top: 40,
    right: 16,
    borderWidth: 3,
    borderColor: '#FF4D6D',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    transform: [{ rotate: '14deg' }],
    zIndex: 20,
  },
  optAStampNopeText: {
    color: '#FF4D6D',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  optACardActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 15,
  },
  optAActPass: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(12, 14, 22, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 109, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', boxShadow: '0 4px 14px rgba(0,0,0,0.45)' },
      default: { shadowColor: '#FF4D6D', shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
    }),
  },
  optAActPassIcon: {
    color: '#FF6B8B',
    fontSize: 18,
    fontWeight: '900',
  },
  optAActStar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(12, 14, 22, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', boxShadow: '0 4px 14px rgba(0,0,0,0.45)' },
      default: { shadowColor: '#FFB300', shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
    }),
  },
  optAActStarIcon: {
    color: '#FFB300',
    fontSize: 16,
  },
  optAActLike: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(12, 14, 22, 0.7)',
    borderWidth: 1.8,
    borderColor: 'rgba(0, 230, 118, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', boxShadow: '0 6px 18px rgba(0, 230, 118, 0.35)' },
      default: { shadowColor: '#00E676', shadowOpacity: 0.45, shadowRadius: 10, elevation: 6 },
    }),
  },
  optAActLikeIcon: {
    fontSize: 22,
  },
  optALoginArea: {
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 4,
    marginTop: 8,
    alignItems: 'center',
    zIndex: 35,
    ...Platform.select({
      web: {
        zIndex: 35,
      },
      default: {
        elevation: 20,
      },
    }),
  },
  optAMorphBox: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FF2E63',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, #FF2E63 0%, #FF655B 55%, #FF8A00 100%)',
        boxShadow: '0 6px 20px rgba(255, 46, 99, 0.4)',
      },
      default: { shadowColor: '#FF2E63', shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
    }),
  },
  optAMorphBoxActive: {
    backgroundColor: '#12151F',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 46, 99, 0.7)',
    ...Platform.select({
      web: {
        background: '#12151F',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), 0 0 0 3px rgba(255, 46, 99, 0.2)',
        backdropFilter: 'blur(16px)',
      },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 14, elevation: 12 },
    }),
  },
  optACtaBtn: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optACtaIcon: {
    fontSize: 16,
  },
  optACtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  optAFieldRow: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
  },
  optACountryCodeBox: {
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#2E3446',
  },
  optACountryCodeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  optAPhoneInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineStyle: 'none',
        boxShadow: 'none',
      } as any,
    }),
  },
  optACountText: {
    color: '#6B7488',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
  },
  optAClosePhoneBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  optAClosePhoneIcon: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  optAGoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF2E63',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #FF2E63, #FF8A00)',
        boxShadow: '0 4px 12px rgba(255, 46, 99, 0.45)',
        cursor: 'pointer',
      },
      default: { shadowColor: '#FF2E63', shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    }),
  },
  optAGoArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  optAOtpBox: {
    width: '100%',
    backgroundColor: '#12151F',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 46, 99, 0.45)',
    alignItems: 'center',
  },
  optAOtpTitle: {
    color: '#B5BFD0',
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  optAOtpNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  optAOtpRowWithButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  optAOtpBoxesTouchable: {
    flex: 1,
    position: 'relative',
  },
  optAOtpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optAOtpActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  optAResendTimer: {
    color: '#7E8B9F',
    fontSize: 12,
    fontWeight: '600',
  },
  optAResendLink: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '800',
  },
  optADot: {
    color: '#4B5565',
    fontSize: 12,
  },
  optAChangeLink: {
    color: '#A0ADC2',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  optATrustText: {
    color: '#6B7488',
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
    letterSpacing: 0.2,
  },
  optALink: {
    color: '#8A96AA',
    textDecorationLine: 'underline',
  },
});
