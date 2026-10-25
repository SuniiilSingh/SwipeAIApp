import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { DietaryPreference, Gender, MicroCircle } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import SelfieCameraModal from '@/components/selfie-camera-modal';
import KundaliChartDiamond from '@/components/kundali-chart-diamond';
import MicroCommunityModal from '@/components/micro-community-modal';
import { BlunderRWordmark } from '@/components/blunderr-wordmark';
import { getMetroLineColor } from '@/utils/metro-colors';
import {
  GENDER_PRESETS,
  GENDER_PREFERENCE_PRESETS,
  SEXUAL_ORIENTATION_PRESETS,
} from '@/constants/profile-presets';

const TRIBE_CITIES = [
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

import { CITY_ASSETS, resolveImageSource } from '@/constants/assets';

interface MetroHub {
  id: string;
  city: string;
  hubs: string;
  vibe: string;
  photo: any;
  lat: number;
  lng: number;
}

const METRO_HUBS: MetroHub[] = [
  {
    id: 'bengaluru',
    city: 'Bengaluru',
    hubs: 'Indiranagar • Koramangala • HSR',
    vibe: '☕ Tech & Rooftops',
    photo: CITY_ASSETS.bengaluru,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    hubs: 'Bandra West • Lower Parel • Juhu',
    vibe: '🌊 Sunset & Cinema',
    photo: CITY_ASSETS.mumbai,
    lat: 19.076,
    lng: 72.8777,
  },
  {
    id: 'delhi-ncr',
    city: 'Delhi NCR',
    hubs: 'Hauz Khas • CyberHub • Khan Market',
    vibe: '🍸 Heritage & Nightlife',
    photo: CITY_ASSETS.delhi,
    lat: 28.6139,
    lng: 77.209,
  },
  {
    id: 'pune',
    city: 'Pune',
    hubs: 'Koregaon Park • Baner • Kalyani Nagar',
    vibe: '🌿 Cafes & Indie Music',
    photo: CITY_ASSETS.pune,
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    id: 'hyderabad',
    city: 'Hyderabad',
    hubs: 'Jubilee Hills • Banjara Hills • Gachibowli',
    vibe: '👑 Royal & High-Tech',
    photo: CITY_ASSETS.hyderabad,
    lat: 17.385,
    lng: 78.4867,
  },
  {
    id: 'goa',
    city: 'Goa',
    hubs: 'Assagao • Anjuna • Panjim',
    vibe: '🏖️ Slow Life & Creators',
    photo: CITY_ASSETS.goa,
    lat: 15.2993,
    lng: 74.124,
  },
  {
    id: 'chennai',
    city: 'Chennai',
    hubs: 'ECR • Besant Nagar • Alwarpet',
    vibe: '🌊 Coast & Culture',
    photo: CITY_ASSETS.chennai,
    lat: 13.0827,
    lng: 80.2707,
  },
  {
    id: 'kolkata',
    city: 'Kolkata',
    hubs: 'Park Street • Salt Lake • Ballygunge',
    vibe: '🎭 Art & Old Charm',
    photo: CITY_ASSETS.kolkata,
    lat: 22.5726,
    lng: 88.3639,
  },
];

const ALL_INDIAN_CITIES: { city: string; area: string; lat: number; lng: number }[] = [
  { city: 'Bengaluru', area: 'Indiranagar,Bengaluru', lat: 12.9784, lng: 77.6408 },
  { city: 'Bengaluru', area: 'Koramangala,Bengaluru', lat: 12.9352, lng: 77.6245 },
  { city: 'Bengaluru', area: 'HSR Layout,Bengaluru', lat: 12.9121, lng: 77.6446 },
  { city: 'Bengaluru', area: 'Whitefield,Bengaluru', lat: 12.9698, lng: 77.75 },
  { city: 'Mumbai', area: 'Bandra West,Mumbai', lat: 19.0596, lng: 72.8295 },
  { city: 'Mumbai', area: 'Andheri West,Mumbai', lat: 19.1363, lng: 72.8277 },
  { city: 'Mumbai', area: 'Lower Parel,Mumbai', lat: 18.9953, lng: 72.83 },
  { city: 'Mumbai', area: 'Powai,Mumbai', lat: 19.1176, lng: 72.906 },
  { city: 'Delhi NCR', area: 'Hauz Khas,New Delhi', lat: 28.5494, lng: 77.2001 },
  { city: 'Delhi NCR', area: 'South Extension,New Delhi', lat: 28.5684, lng: 77.2207 },
  { city: 'Gurgaon', area: 'DLF CyberHub,Gurgaon', lat: 28.495, lng: 77.0895 },
  { city: 'Gurgaon', area: 'Golf Course Road,Gurgaon', lat: 28.4595, lng: 77.0988 },
  { city: 'Noida', area: 'Sector 62,Noida', lat: 28.6279, lng: 77.3649 },
  { city: 'Pune', area: 'Koregaon Park,Pune', lat: 18.5362, lng: 73.894 },
  { city: 'Pune', area: 'Baner,Pune', lat: 18.559, lng: 73.7868 },
  { city: 'Hyderabad', area: 'Jubilee Hills,Hyderabad', lat: 17.4326, lng: 78.4071 },
  { city: 'Hyderabad', area: 'Gachibowli,Hyderabad', lat: 17.4401, lng: 78.3489 },
  { city: 'Goa', area: 'Assagao,North Goa', lat: 15.6001, lng: 73.7848 },
  { city: 'Chennai', area: 'Besant Nagar,Chennai', lat: 13.0002, lng: 80.2668 },
  { city: 'Kolkata', area: 'Park Street,Kolkata', lat: 22.5551, lng: 88.3524 },
  { city: 'Jaipur', area: 'C-Scheme,Jaipur', lat: 26.9124, lng: 75.7873 },
  { city: 'Chandigarh', area: 'Sector 17,Chandigarh', lat: 30.7398, lng: 76.7827 },
  { city: 'Ahmedabad', area: 'SG Highway,Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { city: 'Kochi', area: 'Fort Kochi,Kochi', lat: 9.9658, lng: 76.2421 },
  { city: 'Indore', area: 'Vijay Nagar,Indore', lat: 22.7533, lng: 75.8937 },
  { city: 'Lucknow', area: 'Gomti Nagar,Lucknow', lat: 26.8467, lng: 80.9462 },
];

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

const DECK_STRIP_ITEMS = [
  { id: 1, label: '01 • Spark' },
  { id: 2, label: '02 • Vibe' },
  { id: 3, label: '03 • Tribe' },
  { id: 4, label: '04 • Bio' },
  { id: 5, label: '05 • Rhythm' },
  { id: 6, label: '06 • Photos' },
  { id: 7, label: '07 • Vedic' },
];

const ONBOARDING_DRAFT_STORAGE_KEY = '@blunderr_onboarding_draft_v1';

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const QUICK_YEAR_PRESETS = [2006, 2005, 2004, 2003, 2002, 2001, 2000, 1998, 1996, 1994, 1992, 1990];

const CAREER_PRESET_CHIPS = [
  { label: '🚀 Tech Founder', value: 'Founder / Tech' },
  { label: '💻 Software Eng', value: 'Software Engineer' },
  { label: '🎨 Product Designer', value: 'Product Designer' },
  { label: '📈 VC / Finance', value: 'Finance & Investment' },
  { label: '🩺 Doctor / Healthcare', value: 'Doctor / Healthcare' },
  { label: '⚖️ Lawyer / Legal', value: 'Lawyer / Legal' },
  { label: '✍️ Creative / Media', value: 'Creative & Media' },
  { label: '📊 Product / Strategy', value: 'Product Manager' },
  { label: '🎓 Student / Scholar', value: 'Student' },
];

const COLLEGE_PRESET_CHIPS = [
  'IIT',
  'BITS Pilani',
  'IIM',
  'Delhi Univ',
  'St. Xavier\'s',
  'NID / NIFT',
  'Ashoka Univ',
  'Abroad / Ivy',
];

export default function OnboardingDecksScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompactPhone = screenWidth < 370 || screenHeight < 710;

  const [activeDeck, setActiveDeck] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resumedBannerText, setResumedBannerText] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const isHydratedRef = useRef<boolean>(false);
  const mainScrollRef = useRef<ScrollView>(null);

  // Deck 1: Identity, Liveness Selfie & Primary Residence (Option A: Frictionless Timeline & Chips)
  const [fullName, setFullName] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('2002');
  const [dobMonth, setDobMonth] = useState<string>('10');
  const [dobDay, setDobDay] = useState<string>('15');

  // Unified Form Data Ref to eliminate closure staleness and ensure instant crash-proof saving
  const formDataRef = useRef({
    fullName: '',
    dobYear: '2002',
    dobMonth: '10',
    dobDay: '15',
    selfieUrl: '',
    isLivenessVerified: false,
    verificationStatus: 'UNVERIFIED' as 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED',
    primaryCity: '',
    primaryLocation: '',
    coords: null as { lat: number; lng: number } | null,
    gender: 'MALE' as Gender,
    genderDisplay: '',
    lookingFor: '',
    orientation: '',
    microCircle: '',
    job: '',
    institute: '',
    bio: '',
    heightCm: 175,
    dietaryPref: '' as DietaryPreference | '',
    drinkingHabit: '',
    photoSlots: ['', '', '', '', '', ''],
    birthTime: '',
    birthCity: '',
  });

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    formDataRef.current.fullName = text;
  };

  const clampDayForMonth = (currentDay: string, monthStr: string, yearStr?: string) => {
    if (!currentDay) return;
    const dy = parseInt(currentDay, 10);
    const mo = parseInt(monthStr, 10);
    const yr = parseInt(yearStr || dobYear, 10);
    if (isNaN(dy) || isNaN(mo)) return;

    let maxDays = 31;
    if (mo === 2) {
      maxDays = (!isNaN(yr) && ((yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0)) ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(mo)) {
      maxDays = 30;
    }

    if (dy > maxDays) {
      const adjusted = String(maxDays).padStart(2, '0');
      setDobDay(adjusted);
      formDataRef.current.dobDay = adjusted;
    }
  };

  const handleSelectYear = (yrNum: number) => {
    const currentYr = new Date().getFullYear();
    const clampedYr = Math.max(1940, Math.min(currentYr - 18, yrNum));
    const str = String(clampedYr);
    setDobYear(str);
    formDataRef.current.dobYear = str;
    clampDayForMonth(formDataRef.current.dobDay, formDataRef.current.dobMonth, str);
    hapticFeedback.selection();
  };

  const handleStepYear = (delta: number) => {
    const current = parseInt(dobYear, 10) || 2002;
    handleSelectYear(current + delta);
  };

  const handleSelectMonth = (monthIndex1to12: number) => {
    const str = String(monthIndex1to12).padStart(2, '0');
    setDobMonth(str);
    formDataRef.current.dobMonth = str;
    clampDayForMonth(formDataRef.current.dobDay, str);
    hapticFeedback.selection();
  };

  const handleSelectDay = (dayNum: number) => {
    const str = String(dayNum).padStart(2, '0');
    setDobDay(str);
    formDataRef.current.dobDay = str;
    hapticFeedback.selection();
  };

  const maxDaysInSelectedMonth = useMemo(() => {
    const mo = parseInt(dobMonth, 10);
    const yr = parseInt(dobYear, 10);
    if (isNaN(mo)) return 31;
    if (mo === 2) {
      if (!isNaN(yr) && ((yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0)) {
        return 29;
      }
      return 28;
    }
    if ([4, 6, 9, 11].includes(mo)) return 30;
    return 31;
  }, [dobMonth, dobYear]);

  const handleJobChange = (text: string) => {
    setJob(text);
    formDataRef.current.job = text;
  };

  const handleCareerChipPress = (val: string) => {
    hapticFeedback.selection();
    const nextVal = job === val ? '' : val;
    setJob(nextVal);
    formDataRef.current.job = nextVal;
  };

  const handleInstituteChange = (text: string) => {
    setInstitute(text);
    formDataRef.current.institute = text;
  };

  const handleCollegeChipPress = (val: string) => {
    hapticFeedback.selection();
    const nextVal = institute === val ? '' : val;
    setInstitute(nextVal);
    formDataRef.current.institute = nextVal;
  };

  const handleBioChange = (text: string) => {
    setBio(text);
    formDataRef.current.bio = text;
  };

  const handleBirthCityChange = (text: string) => {
    setBirthCity(text);
    formDataRef.current.birthCity = text;
  };


  const calculatedAge = useMemo(() => {
    const yr = parseInt(dobYear, 10);
    const mo = parseInt(dobMonth, 10);
    const dy = parseInt(dobDay, 10);
    const currentYr = new Date().getFullYear();
    if (isNaN(yr) || yr < 1920 || yr > currentYr) return null;
    let age = currentYr - yr;
    if (!isNaN(mo) && mo >= 1 && mo <= 12 && !isNaN(dy) && dy >= 1 && dy <= 31) {
      const today = new Date();
      const m = today.getMonth() - (mo - 1);
      if (m < 0 || (m === 0 && today.getDate() < dy)) {
        age--;
      }
    }
    return age;
  }, [dobYear, dobMonth, dobDay]);

  const activeZodiac = useMemo(() => {
    const dy = parseInt(dobDay, 10);
    const mo = parseInt(dobMonth, 10);
    if (isNaN(dy) || isNaN(mo) || dy < 1 || mo < 1 || mo > 12) return '';
    const dates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
    const signs = [
      '♑ Capricorn', '♒ Aquarius', '♓ Pisces', '♈ Aries',
      '♉ Taurus', '♊ Gemini', '♋ Cancer', '♌ Leo',
      '♍ Virgo', '♎ Libra', '♏ Scorpio', '♐ Sagittarius'
    ];
    let signIndex = mo - 1;
    if (dy >= dates[mo - 1]) {
      signIndex = (signIndex + 1) % 12;
    }
    return signs[signIndex];
  }, [dobDay, dobMonth]);

  const handleBirthTimeChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (!digits) {
      setBirthTime('');
      formDataRef.current.birthTime = '';
      return;
    }
    const cleanDigits = digits.slice(0, 4);
    if (cleanDigits.length <= 2) {
      if (text.endsWith(':') || text.length === 3) {
        setBirthTime(cleanDigits);
        formDataRef.current.birthTime = cleanDigits;
      } else if (cleanDigits.length === 2 && !birthTime.includes(':')) {
        setBirthTime(`${cleanDigits}:`);
        formDataRef.current.birthTime = `${cleanDigits}:`;
      } else {
        setBirthTime(cleanDigits);
        formDataRef.current.birthTime = cleanDigits;
      }
    } else {
      const hh = cleanDigits.slice(0, 2);
      const mm = cleanDigits.slice(2, 4);
      setBirthTime(`${hh}:${mm}`);
      formDataRef.current.birthTime = `${hh}:${mm}`;
    }
  };
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [showSelfieModal, setShowSelfieModal] = useState<boolean>(false);
  const [isLivenessVerified, setIsLivenessVerified] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('UNVERIFIED');

  // Primary Residence (Live GPS + Universal Search + Metro Hub Cards)
  const [primaryCity, setPrimaryCity] = useState<string>('');
  const [primaryLocation, setPrimaryLocation] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsStatusText, setGpsStatusText] = useState<string>('');

  // Deck 2: Mutual Frequency (Zero Prefill + Inline 3rd/4th Custom Selector Card)
  const [gender, setGender] = useState<Gender>('MALE');
  const [genderDisplay, setGenderDisplay] = useState<string>('');
  const [tempGenderDisplay, setTempGenderDisplay] = useState<string>('');
  const [customGenderInput, setCustomGenderInput] = useState<string>('');
  const [lookingFor, setLookingFor] = useState<string>('');
  const [tempLookingFor, setTempLookingFor] = useState<string>('');
  const [customLookingForInput, setCustomLookingForInput] = useState<string>('');
  const [orientation, setOrientation] = useState<string>('');
  const [tempOrientation, setTempOrientation] = useState<string>('');
  const [customOrientationInput, setCustomOrientationInput] = useState<string>('');
  const [showGenderModal, setShowGenderModal] = useState<boolean>(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState<boolean>(false);
  const [showOrientationModal, setShowOrientationModal] = useState<boolean>(false);

  // Deck 3: Neighborhood Tribe & Career (Zero Prefill)
  const [microCircle, setMicroCircle] = useState<string>('');
  const [tribeCircles, setTribeCircles] = useState<MicroCircle[]>([]);
  const [tribeCityFilter, setTribeCityFilter] = useState<string>('All Cities');
  const [tribeSearchQuery, setTribeSearchQuery] = useState<string>('');
  const [loadingTribes, setLoadingTribes] = useState<boolean>(false);
  const [showTribeModal, setShowTribeModal] = useState<boolean>(false);
  const [job, setJob] = useState<string>('');
  const [institute, setInstitute] = useState<string>('');

  // Deck 4: Bio Archetype (Zero Prefill)
  const [bio, setBio] = useState<string>('');
  const [bioIdx, setBioIdx] = useState<number>(0);
  const [selectedBioCategory, setSelectedBioCategory] = useState<string>('All');

  // Deck 5: Lifestyle & Stature (Zero Prefill for pills, 175cm stepper baseline)
  const [heightCm, setHeightCm] = useState<number>(175);
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference | ''>('');
  const [drinkingHabit, setDrinkingHabit] = useState<string>('');

  // Deck 6: Asymmetric Editorial 6-Slot Photo Showcase (Minimum 2 required, up to 6 optional)
  const [photoSlots, setPhotoSlots] = useState<string[]>(['', '', '', '', '', '']);
  const photoSlotsRef = useRef<string[]>(['', '', '', '', '', '']);
  const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
  const [activePhotoSlotModal, setActivePhotoSlotModal] = useState<number | null>(null);

  // Deck 7 (Final Step): Vedic Janampatri (Zero Prefill)
  const [birthTime, setBirthTime] = useState<string>('');
  const [birthCity, setBirthCity] = useState<string>('');

  // Animations
  const deckAnim = useRef(new Animated.Value(1)).current;

  const loadTribeCircles = async (city?: string) => {
    setLoadingTribes(true);
    try {
      const list = await api.getMicroCircles(city && city !== 'All Cities' ? city : undefined);
      setTribeCircles(list);
    } catch (e) {
      console.warn('Failed to load tribe circles:', e);
    } finally {
      setLoadingTribes(false);
    }
  };

  const handleTribeCityChange = (city: string) => {
    hapticFeedback.light();
    setTribeCityFilter(city);
    loadTribeCircles(city);
  };

  const handleSelectPrimaryCity = (city: string, locationLabel?: string, lat?: number, lng?: number) => {
    hapticFeedback.light();
    const cleanCity = city.trim();
    const cleanLoc = (locationLabel || cleanCity).trim();
    setPrimaryCity(cleanCity);
    setPrimaryLocation(cleanLoc);
    formDataRef.current.primaryCity = cleanCity;
    formDataRef.current.primaryLocation = cleanLoc;
    setCitySearchQuery('');
    if (typeof lat === 'number' && typeof lng === 'number') {
      const c = { lat, lng };
      setCoords(c);
      formDataRef.current.coords = c;
      api.updateLocation(lat, lng, cleanCity, cleanLoc).catch(() => {});
    }
    // Automatically sync Deck 3 Neighborhood Tribe city filter if it matches one of our tribe cities
    const matchedTribeCity = TRIBE_CITIES.find(
      (tc) =>
        tc.toLowerCase() === cleanCity.toLowerCase() ||
        (cleanCity.toLowerCase().includes('delhi') && tc === 'Delhi NCR') ||
        (cleanCity.toLowerCase().includes('gurugram') && tc === 'Gurgaon') ||
        (cleanCity.toLowerCase().includes('bangalore') && tc === 'Bengaluru')
    );
    if (matchedTribeCity) {
      setTribeCityFilter(matchedTribeCity);
      loadTribeCircles(matchedTribeCity);
    }
  };

  const handleDetectLiveGps = async () => {
    hapticFeedback.medium();
    setIsDetectingGps(true);
    setGpsStatusText('Requesting satellite lock...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsDetectingGps(false);
        setGpsStatusText('Permission denied — select city below');
        Alert.alert(
          'Location Permission',
          'Please enable location access or pick your city using the search bar or Metro Hub cards below.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      let resolvedCity = '';
      let resolvedArea = '';

      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo && geo.length > 0) {
          const place = geo[0];
          resolvedCity = place.city || place.subregion || place.region || '';
          const district = place.district || place.name || place.street || '';
          resolvedArea = district && resolvedCity && district !== resolvedCity
            ? `${district}, ${resolvedCity}`
            : resolvedCity;
        }
      } catch (geoErr) {
        // Fallback for web or if native reverseGeocode fails
      }

      if (!resolvedCity && Platform.OS === 'web') {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await resp.json();
          const addr = data?.address || {};
          resolvedCity = addr.city || addr.town || addr.state_district || addr.state || 'Bengaluru';
          const suburb = addr.suburb || addr.neighbourhood || '';
          resolvedArea = suburb ? `${suburb}, ${resolvedCity}` : resolvedCity;
        } catch (e) {}
      }

      const finalCity = resolvedCity || 'Bengaluru';
      const finalArea = resolvedArea || finalCity;

      handleSelectPrimaryCity(finalCity, finalArea, latitude, longitude);
      setGpsStatusText(`Locked: ${finalArea}`);
      hapticFeedback.success();
    } catch (err) {
      setGpsStatusText('Could not auto-detect — pick city below');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const citySuggestions = citySearchQuery.trim().length > 0
    ? ALL_INDIAN_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(citySearchQuery.trim().toLowerCase()) ||
          c.area.toLowerCase().includes(citySearchQuery.trim().toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredTribeCircles = tribeCircles.filter((item) => {
    const matchesCity = (() => {
      if (tribeCityFilter === 'All Cities') return true;
      if (!item.city) return true;
      const c1 = item.city.trim().toLowerCase();
      const c2 = tribeCityFilter.trim().toLowerCase();
      return (
        c1 === c2 ||
        (c2 === 'gurgaon' && (c1.includes('gurgaon') || c1.includes('gurugram'))) ||
        (c2 === 'delhi ncr' && (c1.includes('delhi') || c1.includes('ncr'))) ||
        (c2 === 'noida' && (c1.includes('noida') || c1.includes('greater noida')))
      );
    })();
    if (!matchesCity) return false;

    if (!tribeSearchQuery.trim()) return true;
    const q = tribeSearchQuery.trim().toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      Boolean(item.tagline?.toLowerCase().includes(q)) ||
      Boolean(item.description?.toLowerCase().includes(q)) ||
      Boolean(item.city?.toLowerCase().includes(q)) ||
      Boolean(item.vibeCategory?.toLowerCase().includes(q))
    );
  });

  // Helper to get up-to-the-millisecond merged form data without closure staleness
  const getMergedFormData = () => ({
    fullName: (formDataRef.current.fullName || fullName).trim(),
    dobYear: (formDataRef.current.dobYear || dobYear).trim(),
    dobMonth: (formDataRef.current.dobMonth || dobMonth).trim(),
    dobDay: (formDataRef.current.dobDay || dobDay).trim(),
    selfieUrl: (formDataRef.current.selfieUrl || selfieUrl).trim(),
    isLivenessVerified: formDataRef.current.isLivenessVerified ?? isLivenessVerified,
    verificationStatus: formDataRef.current.verificationStatus || verificationStatus,
    primaryCity: (formDataRef.current.primaryCity || primaryCity).trim(),
    primaryLocation: (formDataRef.current.primaryLocation || primaryLocation).trim(),
    coords: formDataRef.current.coords || coords,
    gender: formDataRef.current.gender || gender,
    genderDisplay: (formDataRef.current.genderDisplay || genderDisplay).trim(),
    lookingFor: (formDataRef.current.lookingFor || lookingFor).trim(),
    orientation: (formDataRef.current.orientation || orientation).trim(),
    microCircle: (formDataRef.current.microCircle || microCircle).trim(),
    job: (formDataRef.current.job || job).trim(),
    institute: (formDataRef.current.institute || institute).trim(),
    bio: (formDataRef.current.bio || bio).trim(),
    heightCm: typeof formDataRef.current.heightCm === 'number' ? formDataRef.current.heightCm : heightCm,
    dietaryPref: formDataRef.current.dietaryPref || dietaryPref,
    drinkingHabit: (formDataRef.current.drinkingHabit || drinkingHabit).trim(),
    photoSlots: photoSlotsRef.current,
    birthTime: (formDataRef.current.birthTime || birthTime).trim(),
    birthCity: (formDataRef.current.birthCity || birthCity).trim(),
  });

  // Deck validation function that merges latest state and synchronous formDataRef
  const validateDeck = (deck: number): { valid: boolean; message?: string } => {
    const data = getMergedFormData();

    switch (deck) {
      case 1: {
        const cleanName = (data.fullName || '').trim();
        if (!cleanName || cleanName.length < 2) {
          return { valid: false, message: 'Please enter your first name (at least 2 characters) to continue.' };
        }
        const dy = parseInt(data.dobDay || '', 10);
        const mo = parseInt(data.dobMonth || '', 10);
        const yr = parseInt(data.dobYear || '', 10);
        const currentYr = new Date().getFullYear();
        if (isNaN(dy) || dy < 1 || dy > 31) {
          return { valid: false, message: 'Please enter a valid birth day (01 to 31).' };
        }
        if (isNaN(mo) || mo < 1 || mo > 12) {
          return { valid: false, message: 'Please enter a valid birth month (01 to 12).' };
        }
        let maxDays = 31;
        if (mo === 2) {
          maxDays = 29;
        } else if ([4, 6, 9, 11].includes(mo)) {
          maxDays = 30;
        }
        if (dy > maxDays) {
          return { valid: false, message: `The selected month only has ${maxDays} days. Please enter a valid day.` };
        }
        if (isNaN(yr) || yr < 1920 || yr > currentYr) {
          return { valid: false, message: 'Please enter a valid birth year (YYYY, e.g. 1999).' };
        }
        const today = new Date();
        let age = today.getFullYear() - yr;
        const m = today.getMonth() - (mo - 1);
        if (m < 0 || (m === 0 && today.getDate() < dy)) {
          age--;
        }
        if (age < 18) {
          return { valid: false, message: `You are currently ${age} years old. You must be at least 18 years old to join BlunderR.` };
        }
        const cleanSelfie = (data.selfieUrl || '').trim();
        if (!cleanSelfie || cleanSelfie.length === 0) {
          return { valid: false, message: 'Please take or upload your verification selfie to continue.' };
        }
        const cleanCity = (data.primaryCity || '').trim();
        if (!cleanCity) {
          return { valid: false, message: 'Please select or auto-detect your primary residence city for local matching.' };
        }
        return { valid: true };
      }
      case 2: {
        const gDisplay = (data.genderDisplay || '').trim();
        if (!gDisplay) {
          return { valid: false, message: 'Please select how you identify.' };
        }
        const lookFor = (data.lookingFor || '').trim();
        if (!lookFor) {
          return { valid: false, message: 'Please select who you are looking to meet.' };
        }
        const orient = (data.orientation || '').trim();
        if (!orient) {
          return { valid: false, message: 'Please select your sexual orientation.' };
        }
        return { valid: true };
      }
      case 3: {
        const j = (data.job || '').trim();
        if (!j) {
          return { valid: false, message: 'Please enter your career / profession to continue.' };
        }
        return { valid: true };
      }
      case 4: {
        const b = (data.bio || '').trim();
        if (!b || b.length < 10) {
          return { valid: false, message: 'Please select an archetype or write a bio (at least 10 characters).' };
        }
        return { valid: true };
      }
      case 5: {
        const h = typeof data.heightCm === 'number' ? data.heightCm : 175;
        if (!h || h < 100) {
          return { valid: false, message: 'Please set your height to continue.' };
        }
        if (!data.dietaryPref) {
          return { valid: false, message: 'Please select your food preference.' };
        }
        const habit = (data.drinkingHabit || '').trim();
        if (!habit) {
          return { valid: false, message: 'Please select your social drinking preference.' };
        }
        return { valid: true };
      }
      case 6: {
        const currentSlots = photoSlotsRef.current || data.photoSlots || [];
        const validPhotos = currentSlots.filter((u) => u && u.trim().length > 0);
        if (validPhotos.length < 2) {
          return {
            valid: false,
            message: `Please upload at least 2 photos (${validPhotos.length}/2 uploaded). You can upload up to 6 photos!`,
          };
        }
        return { valid: true };
      }
      case 7: {
        const cleanTime = (data.birthTime || '').trim();
        if (cleanTime.length > 0) {
          const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(cleanTime)) {
            return {
              valid: false,
              message: 'Birth time format should be HH:MM in 24-hr format (e.g. 14:30), or leave blank to skip.',
            };
          }
        }
        return { valid: true };
      }
      default:
        return { valid: true };
    }
  };

  // Immediate synchronous draft persistence function
  const saveDraftLocally = async (targetDeck?: number) => {
    try {
      const data = getMergedFormData();
      const draft = {
        activeDeck: targetDeck ?? activeDeck,
        ...data,
        updatedAt: Date.now(),
      };
      await AsyncStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('[onboarding] Failed to save draft locally:', e);
    }
  };

  // Option 3: Hybrid Hydration (Local Draft First for 0ms recovery, then Cloud Profile Sync)
  useEffect(() => {
    loadTribeCircles();
    (async () => {
      let candidateDeck = 1;
      try {
        // 1. Read instant local draft from AsyncStorage (crash recovery)
        const rawDraft = await AsyncStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
        if (rawDraft) {
          try {
            const draft = JSON.parse(rawDraft);
            if (draft.fullName) {
              setFullName(draft.fullName);
              formDataRef.current.fullName = draft.fullName;
            }
            if (draft.dobYear) {
              setDobYear(draft.dobYear);
              formDataRef.current.dobYear = draft.dobYear;
            }
            if (draft.dobMonth) {
              setDobMonth(draft.dobMonth);
              formDataRef.current.dobMonth = draft.dobMonth;
            }
            if (draft.dobDay) {
              setDobDay(draft.dobDay);
              formDataRef.current.dobDay = draft.dobDay;
            }
            if (draft.primaryCity) {
              setPrimaryCity(draft.primaryCity);
              formDataRef.current.primaryCity = draft.primaryCity;
            }
            if (draft.primaryLocation) {
              setPrimaryLocation(draft.primaryLocation);
              formDataRef.current.primaryLocation = draft.primaryLocation;
            }
            if (draft.coords) {
              setCoords(draft.coords);
              formDataRef.current.coords = draft.coords;
            }
            if (draft.gender) {
              setGender(draft.gender);
              formDataRef.current.gender = draft.gender;
            }
            if (draft.genderDisplay) {
              setGenderDisplay(draft.genderDisplay);
              setTempGenderDisplay(draft.genderDisplay);
              formDataRef.current.genderDisplay = draft.genderDisplay;
            }
            if (draft.lookingFor) {
              setLookingFor(draft.lookingFor);
              setTempLookingFor(draft.lookingFor);
              formDataRef.current.lookingFor = draft.lookingFor;
            }
            if (draft.orientation) {
              setOrientation(draft.orientation);
              setTempOrientation(draft.orientation);
              formDataRef.current.orientation = draft.orientation;
            }
            if (draft.microCircle) {
              setMicroCircle(draft.microCircle);
              formDataRef.current.microCircle = draft.microCircle;
            }
            if (draft.job) {
              setJob(draft.job);
              formDataRef.current.job = draft.job;
            }
            if (draft.institute) {
              setInstitute(draft.institute);
              formDataRef.current.institute = draft.institute;
            }
            if (draft.bio) {
              setBio(draft.bio);
              formDataRef.current.bio = draft.bio;
            }
            if (typeof draft.heightCm === 'number') {
              setHeightCm(draft.heightCm);
              formDataRef.current.heightCm = draft.heightCm;
            }
            if (draft.dietaryPref) {
              setDietaryPref(draft.dietaryPref);
              formDataRef.current.dietaryPref = draft.dietaryPref;
            }
            if (draft.drinkingHabit) {
              setDrinkingHabit(draft.drinkingHabit);
              formDataRef.current.drinkingHabit = draft.drinkingHabit;
            }
            if (Array.isArray(draft.photoSlots)) {
              photoSlotsRef.current = draft.photoSlots;
              formDataRef.current.photoSlots = draft.photoSlots;
              setPhotoSlots(draft.photoSlots);
            }
            if (draft.selfieUrl) {
              setSelfieUrl(draft.selfieUrl);
              formDataRef.current.selfieUrl = draft.selfieUrl;
            }
            if (draft.verificationStatus) {
              setVerificationStatus(draft.verificationStatus);
              formDataRef.current.verificationStatus = draft.verificationStatus;
            }
            if (draft.isLivenessVerified) {
              setIsLivenessVerified(draft.isLivenessVerified);
              formDataRef.current.isLivenessVerified = draft.isLivenessVerified;
            }
            if (draft.birthTime) {
              setBirthTime(draft.birthTime);
              formDataRef.current.birthTime = draft.birthTime;
            }
            if (draft.birthCity) {
              setBirthCity(draft.birthCity);
              formDataRef.current.birthCity = draft.birthCity;
            }

            if (typeof draft.activeDeck === 'number' && draft.activeDeck >= 1 && draft.activeDeck <= 7) {
              candidateDeck = Math.max(candidateDeck, draft.activeDeck);
            }
          } catch (e) {
            console.warn('[onboarding] Failed to parse local draft:', e);
          }
        }

        // 2. Fetch server profile to merge cloud state (NEVER overwrite existing local inputs)
        const prof = await api.getMyProfile();

        if (prof?.displayName || prof?.fullName) {
          const existingName = (prof.displayName || prof.fullName || '').trim();
          if (existingName && existingName !== 'New User' && existingName !== 'BlunderR Star') {
            if (!formDataRef.current.fullName) {
              setFullName(existingName);
              formDataRef.current.fullName = existingName;
            }
          }
        }
        if (prof?.birthDate) {
          const parts = prof.birthDate.split('-');
          if (parts.length === 3) {
            if (!formDataRef.current.dobYear) {
              setDobYear(parts[0]);
              formDataRef.current.dobYear = parts[0];
            }
            if (!formDataRef.current.dobMonth) {
              setDobMonth(parts[1]);
              formDataRef.current.dobMonth = parts[1];
            }
            if (!formDataRef.current.dobDay) {
              setDobDay(parts[2]);
              formDataRef.current.dobDay = parts[2];
            }
          }
        }
        if (prof?.city || prof?.location) {
          const c = (prof.city || prof.location || '').trim();
          if (c && !formDataRef.current.primaryCity) {
            setPrimaryCity(c);
            formDataRef.current.primaryCity = c;
            setPrimaryLocation(prof.location || c);
            formDataRef.current.primaryLocation = prof.location || c;
          }
        }
        if (typeof prof?.latitude === 'number' && typeof prof?.longitude === 'number') {
          if (!formDataRef.current.coords) {
            const newCoords = { lat: prof.latitude!, lng: prof.longitude! };
            setCoords(newCoords);
            formDataRef.current.coords = newCoords;
          }
        }
        if (prof?.gender && !formDataRef.current.gender) {
          setGender(prof.gender);
          formDataRef.current.gender = prof.gender;
        }
        if (prof?.genderDisplay && !formDataRef.current.genderDisplay) {
          setGenderDisplay(prof.genderDisplay);
          setTempGenderDisplay(prof.genderDisplay);
          formDataRef.current.genderDisplay = prof.genderDisplay;
        }
        if (prof?.genderPreferenceDisplay && !formDataRef.current.lookingFor) {
          setLookingFor(prof.genderPreferenceDisplay);
          setTempLookingFor(prof.genderPreferenceDisplay);
          formDataRef.current.lookingFor = prof.genderPreferenceDisplay;
        }
        if (prof?.sexualOrientation && !formDataRef.current.orientation) {
          setOrientation(prof.sexualOrientation);
          setTempOrientation(prof.sexualOrientation);
          formDataRef.current.orientation = prof.sexualOrientation;
        }
        if (prof?.microCircle && !formDataRef.current.microCircle) {
          setMicroCircle(prof.microCircle);
          formDataRef.current.microCircle = prof.microCircle;
        }
        if ((prof?.job || prof?.occupation) && !formDataRef.current.job) {
          const j = (prof.job || prof.occupation || '').trim();
          setJob(j);
          formDataRef.current.job = j;
        }
        if ((prof?.institute || prof?.education) && !formDataRef.current.institute) {
          const inst = (prof.institute || prof.education || '').trim();
          setInstitute(inst);
          formDataRef.current.institute = inst;
        }
        if (prof?.bio && !formDataRef.current.bio) {
          setBio(prof.bio);
          formDataRef.current.bio = prof.bio;
        }
        if (prof?.height && formDataRef.current.heightCm === 175) {
          setHeightCm(prof.height);
          formDataRef.current.heightCm = prof.height;
        }
        if (prof?.dietaryPref && !formDataRef.current.dietaryPref) {
          setDietaryPref(prof.dietaryPref);
          formDataRef.current.dietaryPref = prof.dietaryPref;
        }
        if (prof?.drinkingHabit && !formDataRef.current.drinkingHabit) {
          setDrinkingHabit(prof.drinkingHabit);
          formDataRef.current.drinkingHabit = prof.drinkingHabit;
        }

        const serverPhotos = [
          prof?.photo1 || prof?.photos?.[0] || '',
          prof?.photo2 || prof?.photos?.[1] || '',
          prof?.photo3 || prof?.photos?.[2] || '',
          prof?.photo4 || prof?.photos?.[3] || '',
          prof?.photo5 || prof?.photos?.[4] || '',
          prof?.photo6 || prof?.photos?.[5] || '',
        ].map((u) => (u && !u.includes('unsplash.com/photo-1534528741775') ? u : ''));

        const validServerPhotos = serverPhotos.filter(Boolean);
        if (validServerPhotos.length > 0) {
          setPhotoSlots((currentSlots) => {
            const merged = [...currentSlots];
            serverPhotos.forEach((p, idx) => {
              if (p && !merged[idx]) merged[idx] = p;
            });
            photoSlotsRef.current = merged;
            formDataRef.current.photoSlots = merged;
            return merged;
          });
        }

        if (prof?.selfieUrl && !formDataRef.current.selfieUrl) {
          setSelfieUrl(prof.selfieUrl);
          formDataRef.current.selfieUrl = prof.selfieUrl;
        }
        if (prof?.verificationStatus === 'VERIFIED' || prof?.faceVerified) {
          setVerificationStatus('VERIFIED');
          setIsLivenessVerified(true);
          formDataRef.current.verificationStatus = 'VERIFIED';
          formDataRef.current.isLivenessVerified = true;
        } else if (prof?.verificationStatus === 'PENDING' || prof?.selfieUrl) {
          setVerificationStatus('PENDING');
          setIsLivenessVerified(false);
          formDataRef.current.verificationStatus = 'PENDING';
          formDataRef.current.isLivenessVerified = false;
        } else if (prof?.verificationStatus === 'REJECTED') {
          setVerificationStatus('REJECTED');
          setIsLivenessVerified(false);
          formDataRef.current.verificationStatus = 'REJECTED';
          formDataRef.current.isLivenessVerified = false;
        }

        // CRITICAL: Determine the actual furthest SAFE deck to resume.
        // A user can ONLY resume at Deck N if ALL prior decks (1 .. N-1) are strictly valid!
        let safeDeckToResume = 1;
        for (let d = 1; d <= 6; d++) {
          const check = validateDeck(d);
          if (check.valid) {
            safeDeckToResume = d + 1;
          } else {
            break;
          }
        }

        // The furthest safe deck to resume: if candidateDeck (from local draft) was saved, resume there,
        // but NEVER higher than safeDeckToResume! If no local draft was saved, resume at safeDeckToResume.
        const finalDeckToResume = candidateDeck > 1
          ? Math.min(candidateDeck, safeDeckToResume)
          : safeDeckToResume;

        if (finalDeckToResume > 1 && finalDeckToResume <= 7) {
          setActiveDeck(finalDeckToResume);
          const deckLabels: Record<number, string> = {
            2: 'Vibe & Frequency',
            3: 'Neighborhood Tribe',
            4: '1-Tap Bio Spark',
            5: 'Lifestyle Rhythm',
            6: 'Editorial Portfolio',
            7: 'Cosmic Chemistry',
          };
          setResumedBannerText(`⚡ Resumed at Deck ${finalDeckToResume}: ${deckLabels[finalDeckToResume] || 'Progress Restored'}`);
          setTimeout(() => setResumedBannerText(''), 4500);
        } else {
          setActiveDeck(1);
        }
      } catch (e) {
        console.warn('[onboarding] Hydration warning:', e);
      } finally {
        isHydratedRef.current = true;
        setIsHydrated(true);
      }
    })();
  }, []);

  // Continuous sync between React state and formDataRef
  useEffect(() => {
    formDataRef.current = {
      fullName,
      dobYear,
      dobMonth,
      dobDay,
      selfieUrl,
      isLivenessVerified,
      verificationStatus,
      primaryCity,
      primaryLocation,
      coords,
      gender,
      genderDisplay,
      lookingFor,
      orientation,
      microCircle,
      job,
      institute,
      bio,
      heightCm,
      dietaryPref,
      drinkingHabit,
      photoSlots,
      birthTime,
      birthCity,
    };
  }, [
    fullName,
    dobYear,
    dobMonth,
    dobDay,
    selfieUrl,
    isLivenessVerified,
    verificationStatus,
    primaryCity,
    primaryLocation,
    coords,
    gender,
    genderDisplay,
    lookingFor,
    orientation,
    microCircle,
    job,
    institute,
    bio,
    heightCm,
    dietaryPref,
    drinkingHabit,
    photoSlots,
    birthTime,
    birthCity,
  ]);

  // Continuous Local Auto-Draft Debounce
  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      saveDraftLocally(activeDeck);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isHydrated,
    activeDeck,
    fullName,
    dobYear,
    dobMonth,
    dobDay,
    selfieUrl,
    isLivenessVerified,
    verificationStatus,
    primaryCity,
    primaryLocation,
    coords,
    gender,
    genderDisplay,
    lookingFor,
    orientation,
    microCircle,
    job,
    institute,
    bio,
    heightCm,
    dietaryPref,
    drinkingHabit,
    photoSlots,
    birthTime,
    birthCity,
  ]);

  // Non-blocking cumulative step checkpoint sync to PostgreSQL backend
  const syncDeckCheckpointToCloud = (currentOrTargetDeck: number) => {
    try {
      const data = getMergedFormData();

      const cleanName = data.fullName;
      const dy = data.dobDay;
      const mo = data.dobMonth;
      const yr = data.dobYear;
      const isDobComplete = Boolean(dy && mo && yr && yr.length === 4);
      const formattedDob = isDobComplete ? `${yr}-${mo.padStart(2, '0')}-${dy.padStart(2, '0')}` : undefined;

      const cleanPhotos = (photoSlotsRef.current || data.photoSlots || []).filter(
        (p) => p && !p.startsWith('file:') && !p.startsWith('content:') && !p.startsWith('data:') && !p.startsWith('blob:')
      );

      const payload: Record<string, any> = {};

      if (cleanName) {
        payload.displayName = cleanName;
        payload.fullName = cleanName;
      }
      if (formattedDob) {
        payload.birthDate = formattedDob;
      }
      if (data.primaryCity?.trim()) {
        payload.city = data.primaryCity.trim();
        payload.location = (data.primaryLocation || data.primaryCity).trim();
      }
      if (data.coords) {
        payload.latitude = data.coords.lat;
        payload.longitude = data.coords.lng;
        api.updateLocation(
          data.coords.lat,
          data.coords.lng,
          data.primaryCity.trim(),
          (data.primaryLocation || data.primaryCity).trim()
        ).catch(() => {});
      }
      if (data.gender) payload.gender = data.gender;
      if (data.genderDisplay) payload.genderDisplay = data.genderDisplay;
      if (data.lookingFor) payload.genderPreferenceDisplay = data.lookingFor;
      if (data.orientation) payload.sexualOrientation = data.orientation;
      if (data.microCircle) payload.microCircle = data.microCircle;
      if (data.job?.trim()) {
        payload.job = data.job.trim();
        payload.occupation = data.job.trim();
      }
      if (data.institute?.trim()) {
        payload.institute = data.institute.trim();
        payload.education = data.institute.trim();
      }
      if (data.bio?.trim()) payload.bio = data.bio.trim();
      if (typeof data.heightCm === 'number' && data.heightCm >= 100) {
        payload.height = data.heightCm;
      }
      if (data.dietaryPref) payload.dietaryPref = data.dietaryPref;
      if (data.drinkingHabit) payload.drinkingHabit = data.drinkingHabit;

      if (data.selfieUrl && !data.selfieUrl.startsWith('file:') && !data.selfieUrl.startsWith('content:')) {
        payload.selfieUrl = data.selfieUrl;
        payload.verificationStatus = data.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING';
      }

      if (cleanPhotos.length > 0) {
        payload.photos = cleanPhotos;
        cleanPhotos.forEach((p, idx) => {
          if (idx < 6) payload[`photo${idx + 1}`] = p;
        });
      }

      if (Object.keys(payload).length > 0) {
        api.updateMyProfile(payload as any).catch((err) => {
          console.warn('[onboarding] Cumulative cloud checkpoint warning:', err);
        });
      }

      if (currentOrTargetDeck >= 7 && (data.birthTime?.trim() || data.birthCity?.trim())) {
        api.updateMyBirthDetails({
          birthTime: data.birthTime.trim(),
          birthCity: data.birthCity.trim(),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[onboarding] Cumulative sync exception:', e);
    }
  };

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
      case 6: return 92;
      case 7: return 100;
      default: return 16;
    }
  };

  const getEstimatedAge = () => {
    return calculatedAge;
  };

  const formatFeetAndInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    if (inches === 12) return `${feet + 1}'0"`;
    return `${feet}'${inches}"`;
  };

  const feetAndInches = () => {
    return `${formatFeetAndInches(heightCm)} (${heightCm} cm)`;
  };

  const getStatureArchetype = (cm: number) => {
    if (cm >= 185) return '👑 Runway & Athletic';
    if (cm >= 178) return '🔥 Statuesque Aura';
    if (cm >= 170) return '✨ Everyday Magnetism';
    if (cm >= 160) return '🌿 Chic & Graceful';
    return '🌸 Petite Charm';
  };

  const sliderTrackWidthRef = useRef<number>(200);

  const updateHeightFromGestureX = (locationX: number) => {
    const width = sliderTrackWidthRef.current || 200;
    const pct = Math.max(0, Math.min(1, locationX / width));
    const newCm = Math.round(140 + pct * (215 - 140));
    setHeightCm((prev) => {
      if (prev !== newCm) {
        hapticFeedback.selection();
        return newCm;
      }
      return prev;
    });
  };

  const sliderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          updateHeightFromGestureX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          updateHeightFromGestureX(evt.nativeEvent.locationX);
        },
      }),
    []
  );

  // Whenever the active deck changes (Next, Previous, or Quick-Jump Strip), instantly scroll to the top
  useEffect(() => {
    try {
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      }
      const timer = setTimeout(() => {
        mainScrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 40);
      return () => clearTimeout(timer);
    } catch (e) {}
  }, [activeDeck]);

  const advanceToDeck = async (targetDeck: number) => {
    if (targetDeck < 1 || targetDeck > 7) return;

    if (targetDeck > activeDeck) {
      for (let d = 1; d < targetDeck; d++) {
        const validation = validateDeck(d);
        if (!validation.valid) {
          hapticFeedback.warning();
          Alert.alert('Incomplete Step ⚠️', validation.message);
          if (d !== activeDeck) {
            setActiveDeck(d);
            await saveDraftLocally(d);
          }
          return;
        }
      }

      // Sync cumulative completed profile to cloud backend in background
      syncDeckCheckpointToCloud(targetDeck);
    }

    // Reset scroll position to top immediately so user starts from the top of the next deck
    try {
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      }
    } catch (e) {}

    hapticFeedback.medium();
    Animated.sequence([
      Animated.timing(deckAnim, {
        toValue: 0.96,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(deckAnim, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveDeck(targetDeck);
    await saveDraftLocally(targetDeck);
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
    setVerificationStatus('PENDING');
    setIsLivenessVerified(false);
    formDataRef.current.verificationStatus = 'PENDING';
    formDataRef.current.isLivenessVerified = false;
    if (capturedUri) {
      setSelfieUrl(capturedUri);
      formDataRef.current.selfieUrl = capturedUri;
      saveDraftLocally(1);
      (async () => {
        try {
          const uploadedUrl = await api.uploadImage(capturedUri, capturedBase64);
          const finalSelfie = uploadedUrl || capturedUri;
          if (uploadedUrl) {
            setSelfieUrl(uploadedUrl);
            formDataRef.current.selfieUrl = uploadedUrl;
            saveDraftLocally(1);
          }
          await api.submitSelfieAsync(finalSelfie);
        } catch (e) {
          console.warn('Async selfie background upload warning:', e);
        }
      })();
    }
  };

  const uploadedPhotosList = photoSlots.filter((u) => u && u.trim().length > 0);

  const uploadSingleAssetToSlot = async (slotIndex: number, localUri: string, directBase64?: string | null) => {
    setUploadingSlots((prev) => ({ ...prev, [slotIndex]: true }));
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = localUri;
      photoSlotsRef.current = next;
      formDataRef.current.photoSlots = next;
      saveDraftLocally(6);
      return next;
    });

    try {
      const remoteUrl = await api.uploadImage(localUri, directBase64);
      const finalUrl = remoteUrl || localUri;

      setPhotoSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = finalUrl;
        photoSlotsRef.current = next;
        formDataRef.current.photoSlots = next;
        saveDraftLocally(6);
        const cleanList = next.filter(
          (p) => p && p.trim().length > 0 && !p.startsWith('file:') && !p.startsWith('content:') && !p.startsWith('data:') && !p.startsWith('blob:')
        );
        if (selfieUrl) {
          setVerificationStatus('PENDING');
        }
        if (remoteUrl) {
          api.updateMyProfile({
            [`photo${slotIndex + 1}`]: remoteUrl,
            photos: cleanList,
          } as any).catch(() => {});
        }
        return next;
      });
    } catch (err: any) {
      if (err?.message?.includes('EXPLICIT_CONTENT_REJECTED')) {
        Alert.alert(
          '🛡️ SafeDate Shield Alert',
          'This photo was flagged by Shield 360 AI for explicit or sensitive content.\n\nBlunderR strictly prohibits nude or explicit imagery on public profiles to maintain community safety. Please select a different photo.'
        );
        setPhotoSlots((prev) => {
          const next = [...prev];
          next[slotIndex] = '';
          photoSlotsRef.current = next;
          formDataRef.current.photoSlots = next;
          saveDraftLocally(6);
          return next;
        });
      }
    } finally {
      setUploadingSlots((prev) => {
        const copy = { ...prev };
        delete copy[slotIndex];
        return copy;
      });
    }
  };

  const handlePickPhotoSlot = async (slotIndex: number, source: 'gallery' | 'camera' | 'multi' = 'gallery') => {
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
      } else if (source === 'multi') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Needed', 'Please allow photo library access to upload your profile photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: 6,
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

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      if (result.assets.length > 1) {
        const currentSlots = [...photoSlotsRef.current];
        const tasks: Promise<void>[] = [];
        let cursor = slotIndex;

        for (const asset of result.assets) {
          if (!asset?.uri) continue;
          let targetSlot = cursor;
          if (targetSlot >= 6) {
            const emptyIdx = currentSlots.findIndex((s) => !s || !s.trim());
            if (emptyIdx === -1) break;
            targetSlot = emptyIdx;
          }
          currentSlots[targetSlot] = asset.uri;
          tasks.push(uploadSingleAssetToSlot(targetSlot, asset.uri, asset.base64));
          const nextEmpty = currentSlots.findIndex((s, i) => i > targetSlot && (!s || !s.trim()));
          cursor = nextEmpty !== -1 ? nextEmpty : targetSlot + 1;
        }
        await Promise.all(tasks);
        hapticFeedback.success();
        return;
      }

      const asset = result.assets[0];
      await uploadSingleAssetToSlot(slotIndex, asset.uri, asset.base64);
      hapticFeedback.success();
    } catch (err) {
      console.warn('Photo slot upload error:', err);
      Alert.alert('Upload Error', 'Could not upload photo. Please try again.');
    }
  };

  const handleRemovePhotoSlot = (slotIndex: number) => {
    hapticFeedback.light();
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = '';
      photoSlotsRef.current = next;
      formDataRef.current.photoSlots = next;
      saveDraftLocally(6);
      const cleanList = next.filter(
        (p) => p && p.trim().length > 0 && !p.startsWith('file:') && !p.startsWith('content:') && !p.startsWith('data:') && !p.startsWith('blob:')
      );
      api.updateMyProfile({
        [`photo${slotIndex + 1}`]: '',
        photos: cleanList,
      } as any).catch(() => {});
      return next;
    });
  };

  const handleCompileAndLaunch = async () => {
    // Validate all 7 decks before launching Discovery
    for (let d = 1; d <= 7; d++) {
      const check = validateDeck(d);
      if (!check.valid) {
        hapticFeedback.warning();
        Alert.alert('Incomplete Step ⚠️', check.message);
        setActiveDeck(d);
        await saveDraftLocally(d);
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    hapticFeedback.success();

    const data = getMergedFormData();

    const formattedDob = `${data.dobYear}-${data.dobMonth.padStart(2, '0')}-${data.dobDay.padStart(2, '0')}`;
    const cleanName = data.fullName;

    try {
      const resolvedSlots = [...(photoSlotsRef.current || data.photoSlots)];
      for (let i = 0; i < 6; i++) {
        const uri = resolvedSlots[i];
        if (uri && (uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('data:') || uri.startsWith('blob:'))) {
          const uploaded = await api.uploadImage(uri);
          if (uploaded) {
            resolvedSlots[i] = uploaded;
          }
        }
      }
      photoSlotsRef.current = resolvedSlots;
      formDataRef.current.photoSlots = resolvedSlots;
      setPhotoSlots(resolvedSlots);

      const remotePhotos = resolvedSlots.filter(
        (p) => p && p.trim().length > 0 && !p.startsWith('file:') && !p.startsWith('content:') && !p.startsWith('data:') && !p.startsWith('blob:')
      );

      // 1. Persist GPS / Primary Residence Location for Discovery Matching Engine
      if (data.coords) {
        await api.updateLocation(
          data.coords.lat,
          data.coords.lng,
          data.primaryCity.trim(),
          (data.primaryLocation || data.primaryCity).trim()
        ).catch(() => {});
      }

      // 2. Update Core Profile (including city, location, gender, preference, orientation, tribe, career, bio, lifestyle & photos)
      await api.updateMyProfile({
        displayName: cleanName,
        fullName: cleanName,
        birthDate: formattedDob,
        city: data.primaryCity.trim(),
        location: (data.primaryLocation || data.primaryCity).trim(),
        latitude: data.coords?.lat,
        longitude: data.coords?.lng,
        gender: data.gender,
        genderDisplay: data.genderDisplay,
        genderPreferenceDisplay: data.lookingFor,
        sexualOrientation: data.orientation,
        microCircle: data.microCircle,
        job: data.job.trim(),
        occupation: data.job.trim(),
        education: data.institute.trim(),
        institute: data.institute.trim(),
        bio: data.bio.trim(),
        height: data.heightCm,
        dietaryPref: (data.dietaryPref || 'PURE_VEG') as DietaryPreference,
        drinkingHabit: data.drinkingHabit,
        photo1: resolvedSlots[0] || '',
        photo2: resolvedSlots[1] || '',
        photo3: resolvedSlots[2] || '',
        photo4: resolvedSlots[3] || '',
        photo5: resolvedSlots[4] || '',
        photo6: resolvedSlots[5] || '',
        photos: remotePhotos,
        selfieUrl: data.selfieUrl && !data.selfieUrl.startsWith('file:') && !data.selfieUrl.startsWith('content:') ? data.selfieUrl : undefined,
        verificationStatus: data.selfieUrl ? (data.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING') : undefined,
      });

      // 3. Update Vedic Janampatri (optional)
      if (data.birthTime.trim() || data.birthCity.trim()) {
        try {
          await api.updateMyBirthDetails({
            birthTime: data.birthTime.trim(),
            birthCity: data.birthCity.trim(),
          });
        } catch (e) {
          console.warn('[onboarding] Optional Vedic birth details update skipped/failed:', e);
        }
      }

      // 4. Mark Onboarding Complete & Purge Draft
      await api.setOnboardingCompleted(true);
      await AsyncStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY).catch(() => {});
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Save Failed', err.message || 'Please check your connection and retry.');
    }
  };

  const renderPhotoSlotBox = (idx: number, customStyle?: any, isHeroCover?: boolean) => {
    const uri = photoSlots[idx];
    const isRequired = idx < 2;
    const isUploadingThis = Boolean(uploadingSlots[idx]);
    return (
      <TouchableOpacity
        key={idx}
        style={[
          styles.photoSlotCard,
          customStyle,
          isHeroCover && styles.photoSlotHeroCover,
          isRequired && !uri && !isHeroCover && styles.photoSlotCardRequired,
          !!uri && styles.photoSlotCardFilled,
        ]}
        activeOpacity={0.85}
        onPress={() => {
          hapticFeedback.light();
          setActivePhotoSlotModal(idx);
        }}>
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.photoSlotImage} contentFit="cover" />
            <View style={[styles.photoSlotTopTag, isHeroCover && styles.photoSlotHeroBadge]}>
              <Text style={[styles.photoSlotTopTagText, isHeroCover && { color: '#05060A', fontWeight: '900' }]}>
                {idx === 0 ? '★ 1 COVER SHOT' : idx === 1 ? '★ 2 REQUIRED' : `#${idx + 1}`}
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
            {isHeroCover && (
              <View style={styles.heroCoverTopPill}>
                <Text style={styles.heroCoverTopPillText}>★ 1 COVER SHOT</Text>
              </View>
            )}
            <Text style={[styles.photoSlotPlusIcon, isHeroCover && { fontSize: 28, color: '#FCD34D' }]}>
              {isHeroCover ? '👑' : isRequired ? '📸' : '＋'}
            </Text>
            <Text
              style={[
                styles.photoSlotLabel,
                isHeroCover && { color: '#FDE68A', fontWeight: '900', fontSize: 13 },
                isRequired && !isHeroCover && { color: '#FF6B8B', fontWeight: '900' },
              ]}>
              {isHeroCover ? 'Main Portrait *' : isRequired ? `Photo ${idx + 1} *` : `Photo ${idx + 1}`}
            </Text>
            <Text style={[styles.photoSlotReqSub, isHeroCover && { color: '#FCD34D' }]}>
              {isHeroCover ? 'GOLDEN FRAME • REQUIRED' : isRequired ? 'REQUIRED' : 'OPTIONAL'}
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
  };

  const isCustomGenderSelected = Boolean(
    genderDisplay && genderDisplay !== 'Man' && genderDisplay !== 'Woman'
  );
  const isCustomLookingForSelected = Boolean(
    lookingFor && lookingFor !== 'Women' && lookingFor !== 'Men' && lookingFor !== 'Everyone'
  );
  const isCustomOrientationSelected = Boolean(
    orientation && orientation !== 'Straight' && orientation !== 'Bisexual' && orientation !== 'Queer'
  );

  const estimatedAge = getEstimatedAge();

  return (
    <SafeAreaView style={styles.container}>
      {/* ========================================================
          TOP DYNAMIC HUD ISLAND (MAGNETISM TRACKER & DECK STRIP)
          ======================================================== */}
      <View style={[styles.topHud, isCompactPhone && { paddingHorizontal: 12, paddingVertical: 6 }]}>
        <View style={styles.hudRowTop}>
          <View style={styles.brandRow}>
            <BlunderRWordmark size="sm" lightMode={false} />
          </View>

          <View style={styles.magnetismPill}>
            <Text style={styles.magnetismEmoji}>⚡</Text>
            <Text style={styles.magnetismPct}>{getMagnetismScore(activeDeck)}%</Text>
            <Text style={styles.magnetismLabel}>MAGNETISM</Text>
          </View>
        </View>

        {/* 7-Deck Interactive Segmented Progress Bar */}
        <View style={styles.stepperTrack}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => {
            const isPassed = activeDeck > i;
            const isActive = activeDeck === i;
            return (
              <TouchableOpacity
                key={i}
                style={{ flex: 1, paddingVertical: 3 }}
                activeOpacity={0.8}
                onPress={() => advanceToDeck(i)}>
                <View
                  style={[
                    styles.stepperBar,
                    isPassed && styles.stepperBarPassed,
                    isActive && styles.stepperBarActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Interactive 7-Deck Quick-Jump Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.deckStripScroll}
          contentContainerStyle={styles.deckStripContent}>
          {DECK_STRIP_ITEMS.map((item) => {
            const isCurr = activeDeck === item.id;
            const isDone = activeDeck > item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.deckStripPill,
                  isCurr && styles.deckStripPillActive,
                  isDone && styles.deckStripPillDone,
                ]}
                activeOpacity={0.8}
                onPress={() => advanceToDeck(item.id)}>
                <Text
                  style={[
                    styles.deckStripPillText,
                    isCurr && styles.deckStripPillTextActive,
                    isDone && styles.deckStripPillTextDone,
                  ]}>
                  {isDone ? `✓ ${item.label}` : item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Live Identity Status Ribbon */}
        <View style={styles.identityRibbon}>
          <Text style={styles.ribbonItem} numberOfLines={1}>
            Name:{' '}
            <Text style={styles.ribbonBold}>
              {fullName.trim() ? `${fullName.trim()}${estimatedAge ? `, ${estimatedAge}` : ''}` : 'Not set'}
            </Text>
          </Text>
          <Text style={styles.ribbonItem} numberOfLines={1}>
            City: <Text style={styles.ribbonBold}>{primaryCity || 'Not set'}</Text>
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

        {/* Dynamic Resumed Progress Banner */}
        {!!resumedBannerText && (
          <View style={styles.resumedBanner}>
            <Text style={styles.resumedBannerText}>{resumedBannerText}</Text>
          </View>
        )}
      </View>

      {/* ========================================================
          DECK ARENA WITH 3D LAYERED CARD STACK
          ======================================================== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}>
        <ScrollView
          ref={mainScrollRef}
          contentContainerStyle={[
            styles.scrollArena,
            isCompactPhone && { paddingHorizontal: 8, paddingVertical: 6 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {Platform.OS !== 'web' && <View style={styles.stackShadowCard} />}

          <Animated.View
            style={[
              styles.deckCard,
              isCompactPhone && { padding: 13, borderRadius: 22 },
              { transform: [{ scale: deckAnim }] },
            ]}>
            {/* ==================== DECK 1: ORIGIN & LIVENESS ==================== */}
            {activeDeck === 1 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>✨ DECK 1 OF 7 • ORIGIN & LIVENESS</Text>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Who is making waves today?
                  </Text>
                  <Text style={styles.deckSub}>
                    Enter your real identity, selfie, and primary residence city.
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>FIRST NAME / DISPLAY NAME</Text>
                    <TextInput
                      style={styles.glowInput}
                      placeholder="Enter your first name..."
                      placeholderTextColor="#64748B"
                      value={fullName}
                      onChangeText={handleFullNameChange}
                    />
                  </View>

                  {/* OPTION A: Haptic Year Timeline, Month & Day Chips */}
                  <View style={styles.dobContainerCard}>
                    {/* Hero Age & Identity Header Card */}
                    <View style={styles.dobHeroCard}>
                      <View style={styles.dobHeroTopRow}>
                        <Text style={styles.dobHeroLabel}>YOUR DATE OF BIRTH & AGE</Text>
                        {calculatedAge !== null && (
                          <View style={[styles.agePill, calculatedAge >= 18 ? styles.agePillValid : styles.agePillInvalid]}>
                            <Text style={[styles.agePillText, calculatedAge >= 18 ? styles.agePillTextValid : styles.agePillTextInvalid]}>
                              {calculatedAge >= 18 ? `✓ ${calculatedAge} yrs (18+)` : `⚠️ Under 18 (${calculatedAge})`}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.dobHeroCenter}>
                        <View style={styles.dobHeroAgeRow}>
                          <Text style={styles.dobHeroAgeNumber}>{calculatedAge ?? 24}</Text>
                          <Text style={styles.dobHeroAgeUnit}>years old</Text>
                        </View>
                        <Text style={styles.dobHeroDateString}>
                          Born on {parseInt(dobDay, 10) || 15} {MONTH_NAMES_FULL[(parseInt(dobMonth, 10) || 10) - 1]} {dobYear || '2002'}
                        </Text>
                        {activeZodiac ? (
                          <View style={styles.dobZodiacPill}>
                            <Text style={styles.dobZodiacPillText}>Zodiac: {activeZodiac}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* 1. Year Selector */}
                    <View style={styles.dobSectionBlock}>
                      <View style={styles.dobSectionHeader}>
                        <Text style={styles.dobSectionTitle}>1. BIRTH YEAR</Text>
                        <Text style={styles.dobSectionSubtitle}>
                          {dobYear || '2002'} ({calculatedAge ?? 24} yrs old)
                        </Text>
                      </View>
                      <View style={styles.dobYearStepperRow}>
                        <TouchableOpacity
                          style={styles.dobStepperBtn}
                          onPress={() => handleStepYear(-1)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dobStepperBtnText}>−</Text>
                        </TouchableOpacity>

                        <View style={styles.dobYearCenterDisplay}>
                          <Text style={styles.dobYearBigText}>{dobYear || '2002'}</Text>
                          <Text style={styles.dobYearAgeSub}>Tap + / − or select below</Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.dobStepperBtn,
                            (parseInt(dobYear, 10) || 2002) >= new Date().getFullYear() - 18 && styles.dobStepperBtnDisabled,
                          ]}
                          onPress={() => handleStepYear(1)}
                          disabled={(parseInt(dobYear, 10) || 2002) >= new Date().getFullYear() - 18}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dobStepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Quick Year Horizontal Chips */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dobQuickYearsContainer}
                      >
                        {QUICK_YEAR_PRESETS.map((yr) => {
                          const isSelected = dobYear === String(yr);
                          return (
                            <TouchableOpacity
                              key={yr}
                              style={[styles.dobQuickYearChip, isSelected && styles.dobQuickYearChipActive]}
                              onPress={() => handleSelectYear(yr)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.dobQuickYearChipText, isSelected && styles.dobQuickYearChipTextActive]}>
                                {yr}
                              </Text>
                              <Text style={[styles.dobQuickYearChipSub, isSelected && styles.dobQuickYearChipSubActive]}>
                                {new Date().getFullYear() - yr} yrs
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* 2. Month Selector */}
                    <View style={styles.dobSectionBlock}>
                      <View style={styles.dobSectionHeader}>
                        <Text style={styles.dobSectionTitle}>2. BIRTH MONTH</Text>
                        <Text style={styles.dobSectionSubtitle}>
                          {MONTH_NAMES_FULL[(parseInt(dobMonth, 10) || 10) - 1]}
                        </Text>
                      </View>
                      <View style={styles.dobMonthGrid}>
                        {MONTH_NAMES_SHORT.map((mName, idx) => {
                          const mNum = idx + 1;
                          const isSelected = (parseInt(dobMonth, 10) || 10) === mNum;
                          return (
                            <TouchableOpacity
                              key={mName}
                              style={[styles.dobMonthChip, isSelected && styles.dobMonthChipActive]}
                              onPress={() => handleSelectMonth(mNum)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.dobMonthChipText, isSelected && styles.dobMonthChipTextActive]}>
                                {mName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* 3. Day Selector */}
                    <View style={[styles.dobSectionBlock, { marginBottom: 4 }]}>
                      <View style={styles.dobSectionHeader}>
                        <Text style={styles.dobSectionTitle}>3. BIRTH DAY</Text>
                        <Text style={styles.dobSectionSubtitle}>
                          Day {parseInt(dobDay, 10) || 15} of {maxDaysInSelectedMonth}
                        </Text>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dobDayScrollContainer}
                      >
                        {Array.from({ length: maxDaysInSelectedMonth }, (_, i) => i + 1).map((dNum) => {
                          const isSelected = (parseInt(dobDay, 10) || 15) === dNum;
                          return (
                            <TouchableOpacity
                              key={dNum}
                              style={[styles.dobDayCircle, isSelected && styles.dobDayCircleActive]}
                              onPress={() => handleSelectDay(dNum)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.dobDayCircleText, isSelected && styles.dobDayCircleTextActive]}>
                                {dNum}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  {/* Selfie Upload / Capture - Option 1: Face ID Hologram */}
                  {!selfieUrl ? (
                    <TouchableOpacity
                      style={styles.selfieHoloEmptyCard}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.medium();
                        setShowSelfieModal(true);
                      }}>
                      <View style={styles.selfieHoloIconContainer}>
                        <View style={styles.selfieHoloRingOuter} />
                        <View style={styles.selfieHoloRingInner}>
                          <Text style={styles.selfieHoloCameraEmoji}>📸</Text>
                        </View>
                        <View style={styles.selfieHoloPlusBadge}>
                          <Text style={styles.selfieHoloPlusText}>+</Text>
                        </View>
                      </View>
                      <Text style={styles.selfieHoloEmptyTitle}>
                        Tap to Calibrate 3D Liveness Selfie
                      </Text>
                      <Text style={styles.selfieHoloEmptyDesc}>
                        Required for the <Text style={styles.selfieHoloEmeraldHighlight}>🛡️ 100% Verified Human</Text> badge. AI matches this against all your profile photos.
                      </Text>
                      <View style={styles.selfieHoloPill}>
                        <Text style={styles.selfieHoloPillText}>⚡ Takes 5 Seconds</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={[
                      styles.selfieHoloUploadedCard,
                      verificationStatus === 'VERIFIED' && styles.selfieHoloCardVerified,
                      verificationStatus === 'PENDING' && styles.selfieHoloCardPending,
                      verificationStatus === 'REJECTED' && styles.selfieHoloCardRejected,
                    ]}>
                      <View style={styles.selfieHoloTopRow}>
                        {/* Live Photo Thumbnail with Verification Halo Ring */}
                        <View style={styles.selfieThumbnailWrapper}>
                          <Image
                            source={{ uri: selfieUrl }}
                            style={[
                              styles.selfieThumbnailImage,
                              verificationStatus === 'VERIFIED' && styles.selfieThumbBorderVerified,
                              verificationStatus === 'PENDING' && styles.selfieThumbBorderPending,
                              verificationStatus === 'REJECTED' && styles.selfieThumbBorderRejected,
                            ]}
                            contentFit="cover"
                            transition={200}
                          />
                          <View style={[
                            styles.selfieStatusMiniBadge,
                            verificationStatus === 'VERIFIED' && { backgroundColor: '#10B981' },
                            verificationStatus === 'PENDING' && { backgroundColor: '#F59E0B' },
                            verificationStatus === 'REJECTED' && { backgroundColor: '#EF4444' },
                          ]}>
                            <Text style={styles.selfieStatusMiniBadgeText}>
                              {verificationStatus === 'VERIFIED' ? '✓' : verificationStatus === 'PENDING' ? '⏳' : '!'}
                            </Text>
                          </View>
                        </View>

                        {/* Status Details */}
                        <View style={{ flex: 1 }}>
                          <View style={styles.selfieHoloStatusTagRow}>
                            <View style={[
                              styles.selfieLivePulseDot,
                              verificationStatus === 'VERIFIED' && { backgroundColor: '#34D399' },
                              verificationStatus === 'PENDING' && { backgroundColor: '#FCD34D' },
                              verificationStatus === 'REJECTED' && { backgroundColor: '#F87171' },
                            ]} />
                            <Text style={[
                              styles.selfieHoloStatusTagText,
                              verificationStatus === 'VERIFIED' && { color: '#6EE7B7' },
                              verificationStatus === 'PENDING' && { color: '#FCD34D' },
                              verificationStatus === 'REJECTED' && { color: '#FCA5A5' },
                            ]}>
                              {verificationStatus === 'VERIFIED'
                                ? '3D BIOMETRIC LOCKED'
                                : verificationStatus === 'PENDING'
                                ? 'AI VERIFYING IN BACKGROUND'
                                : 'VERIFICATION FAILED'}
                            </Text>
                          </View>
                          <Text style={styles.selfieHoloUploadedTitle}>
                            {verificationStatus === 'VERIFIED'
                              ? 'Selfie Calibrated & Verified ✓'
                              : verificationStatus === 'PENDING'
                              ? 'Selfie Uploaded • Verifying...'
                              : 'Face Not Clear • Retake'}
                          </Text>
                          <Text style={styles.selfieHoloUploadedDesc} numberOfLines={2}>
                            {verificationStatus === 'VERIFIED'
                              ? 'YuNet SFace 128D embedding active • Authenticity shield locked'
                              : verificationStatus === 'PENDING'
                              ? 'You can continue filling decks while AI verifies your selfie'
                              : 'Please ensure your face is well-lit and directly facing the camera'}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Action Strip with Retake button */}
                      <View style={styles.selfieHoloBottomStrip}>
                        <Text style={styles.selfieHoloShieldStatus}>
                          {verificationStatus === 'VERIFIED' ? '🛡️ Authenticity Shield Active' : '⚡ 3D Liveness Check'}
                        </Text>
                        <TouchableOpacity
                          style={styles.selfieRetakeBtn}
                          activeOpacity={0.75}
                          onPress={() => {
                            hapticFeedback.light();
                            setShowSelfieModal(true);
                          }}>
                          <Text style={styles.selfieRetakeBtnText}>🔄 Retake Selfie</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* 3-LAYER PRIMARY RESIDENCE SELECTOR */}
                  <View style={[styles.fieldBox, { marginTop: 4 }]}>
                    <View style={styles.residenceHeaderRow}>
                      <Text style={styles.fieldLabel}>📍 PRIMARY RESIDENCE (FOR MATCHING)</Text>
                      {!!primaryCity && (
                        <View style={styles.activeResidenceBadge}>
                          <Text style={styles.activeResidenceBadgeText}>
                            ✓ {primaryLocation || primaryCity}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Layer 1: Live GPS Auto-Detect Bar */}
                    <TouchableOpacity
                      style={[
                        styles.gpsDetectBar,
                        !!coords && styles.gpsDetectBarActive,
                      ]}
                      activeOpacity={0.85}
                      disabled={isDetectingGps}
                      onPress={handleDetectLiveGps}>
                      <View style={styles.gpsPulseCircle}>
                        {isDetectingGps ? (
                          <ActivityIndicator size="small" color="#00E5FF" />
                        ) : (
                          <Text style={{ fontSize: 16 }}>🛰️</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gpsDetectTitle}>
                          {isDetectingGps
                            ? 'Triangulating GPS Coordinates...'
                            : coords && primaryCity
                            ? `Live GPS Locked: ${primaryLocation || primaryCity}`
                            : 'Auto-Detect My Live Location (GPS)'}
                        </Text>
                        <Text style={styles.gpsDetectSub}>
                          {gpsStatusText || '1-tap reverse geocoding for hyper-local discovery'}
                        </Text>
                      </View>
                      <View style={styles.gpsDetectActionPill}>
                        <Text style={styles.gpsDetectActionText}>
                          {coords ? 'Refresh' : 'Detect'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Layer 2: Universal City / Neighborhood Search */}
                    <View style={styles.citySearchInputWrap}>
                      <Text style={{ fontSize: 14 }}>🔍</Text>
                      <TextInput
                        style={styles.citySearchInput}
                        placeholder="Or type any city / area (e.g. Jaipur, Bandra, HSR)..."
                        placeholderTextColor="#64748B"
                        value={citySearchQuery}
                        onChangeText={setCitySearchQuery}
                        onSubmitEditing={() => {
                          if (citySearchQuery.trim().length >= 2) {
                            handleSelectPrimaryCity(citySearchQuery.trim(), citySearchQuery.trim());
                          }
                        }}
                      />
                      {citySearchQuery.trim().length >= 2 && (
                        <TouchableOpacity
                          style={styles.citySearchUseBtn}
                          onPress={() =>
                            handleSelectPrimaryCity(citySearchQuery.trim(), citySearchQuery.trim())
                          }>
                          <Text style={styles.citySearchUseBtnText}>Set ✓</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Instant Search Autocomplete Suggestions */}
                    {citySuggestions.length > 0 && (
                      <View style={styles.citySuggestionDropdown}>
                        {citySuggestions.map((sug, idx) => (
                          <TouchableOpacity
                            key={`${sug.area}-${idx}`}
                            style={styles.citySuggestionRow}
                            onPress={() =>
                              handleSelectPrimaryCity(sug.city, sug.area, sug.lat, sug.lng)
                            }>
                            <Text style={styles.citySuggestionTitle}>📍 {sug.area}</Text>
                            <Text style={styles.citySuggestionTag}>{sug.city}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Layer 3: Photographic Metro Hub Carousel */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.metroCarouselScroll}
                      contentContainerStyle={styles.metroCarouselContent}>
                      {METRO_HUBS.map((hub) => {
                        const isHubSelected =
                          primaryCity.toLowerCase() === hub.city.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={hub.id}
                            style={[
                              styles.metroHubCard,
                              isHubSelected && styles.metroHubCardSelected,
                            ]}
                            activeOpacity={0.85}
                            onPress={() =>
                              handleSelectPrimaryCity(hub.city, hub.city, hub.lat, hub.lng)
                            }>
                            <Image
                              source={resolveImageSource(hub.photo, CITY_ASSETS.bengaluru)}
                              style={styles.metroHubImage}
                              contentFit="cover"
                            />
                            <View style={styles.metroHubOverlay} />
                            {isHubSelected && (
                              <View style={styles.metroHubCheckBadge}>
                                <Text style={styles.metroHubCheckBadgeText}>✓ ACTIVE</Text>
                              </View>
                            )}
                            <View style={styles.metroHubTextWrap}>
                              <Text style={styles.metroHubVibeTag}>{hub.vibe}</Text>
                              <Text style={styles.metroHubCityTitle}>{hub.city}</Text>
                              <Text style={styles.metroHubSubText} numberOfLines={1}>
                                {hub.hubs}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
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

            {/* ==================== DECK 2: MUTUAL FREQUENCY ==================== */}
            {activeDeck === 2 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderTopBar}>
                    <View style={styles.deckBadge}>
                      <Text style={styles.deckBadgeText}>💫 DECK 2 OF 7 • MUTUAL FREQUENCY</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.headerPrevPill}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(1)}>
                      <Text style={styles.headerPrevPillText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Who are you looking to meet?
                  </Text>
                  <Text style={styles.deckSub}>
                    Calibrates your discovery radar instantaneously.
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Row 1: I IDENTIFY AS (3 Inline Selector Cards — 3rd Card opens Spectrum/Custom Modal & highlights directly) */}
                  <Text style={styles.fieldLabel}>I IDENTIFY AS</Text>
                  <View style={styles.rapidRow}>
                    <TouchableOpacity
                      style={[styles.rapidCard, genderDisplay === 'Man' && styles.rapidCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setGender('MALE');
                        setGenderDisplay('Man');
                        formDataRef.current.gender = 'MALE';
                        formDataRef.current.genderDisplay = 'Man';
                        saveDraftLocally(2);
                      }}>
                      {genderDisplay === 'Man' && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>⚡</Text>
                      <Text style={styles.rapidTitle}>Man</Text>
                      <Text style={styles.rapidSub}>He / Him</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rapidCard, genderDisplay === 'Woman' && styles.rapidCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setGender('FEMALE');
                        setGenderDisplay('Woman');
                        formDataRef.current.gender = 'FEMALE';
                        formDataRef.current.genderDisplay = 'Woman';
                        saveDraftLocally(2);
                      }}>
                      {genderDisplay === 'Woman' && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>🌸</Text>
                      <Text style={styles.rapidTitle}>Woman</Text>
                      <Text style={styles.rapidSub}>She / Her</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.rapidCard,
                        isCustomGenderSelected && styles.rapidCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempGenderDisplay(isCustomGenderSelected ? genderDisplay : 'Non-binary');
                        setCustomGenderInput(isCustomGenderSelected ? genderDisplay : '');
                        setShowGenderModal(true);
                      }}>
                      {isCustomGenderSelected && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>🌈</Text>
                      <Text style={styles.rapidTitle} numberOfLines={1}>
                        {isCustomGenderSelected ? genderDisplay : 'More'}
                      </Text>
                      <Text style={styles.rapidSub} numberOfLines={1}>
                        {isCustomGenderSelected ? 'Selected • Edit' : 'Custom / +'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 2: LOOKING TO MEET (4 Inline Selector Cards — 4th Card opens Specific/Custom Modal & highlights directly) */}
                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>LOOKING TO MEET</Text>
                  <View style={styles.rapidRowWrap}>
                    <TouchableOpacity
                      style={[styles.rapidCardCompact, lookingFor === 'Women' && styles.rapidCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setLookingFor('Women');
                        formDataRef.current.lookingFor = 'Women';
                        saveDraftLocally(2);
                      }}>
                      {lookingFor === 'Women' && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>🌸</Text>
                      <Text style={styles.rapidTitle}>Women</Text>
                      <Text style={styles.rapidSub}>Discovery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rapidCardCompact, lookingFor === 'Men' && styles.rapidCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setLookingFor('Men');
                        formDataRef.current.lookingFor = 'Men';
                        saveDraftLocally(2);
                      }}>
                      {lookingFor === 'Men' && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>⚡</Text>
                      <Text style={styles.rapidTitle}>Men</Text>
                      <Text style={styles.rapidSub}>Discovery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rapidCardCompact, lookingFor === 'Everyone' && styles.rapidCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setLookingFor('Everyone');
                        formDataRef.current.lookingFor = 'Everyone';
                        saveDraftLocally(2);
                      }}>
                      {lookingFor === 'Everyone' && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>✨</Text>
                      <Text style={styles.rapidTitle}>Everyone</Text>
                      <Text style={styles.rapidSub}>All vibes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.rapidCardCompact,
                        isCustomLookingForSelected && styles.rapidCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempLookingFor(isCustomLookingForSelected ? lookingFor : 'Non-binary');
                        setCustomLookingForInput(isCustomLookingForSelected ? lookingFor : '');
                        setShowPreferenceModal(true);
                      }}>
                      {isCustomLookingForSelected && (
                        <View style={styles.rapidCheckDot}>
                          <Text style={styles.rapidCheckDotText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.rapidEmoji}>💫</Text>
                      <Text style={styles.rapidTitle} numberOfLines={1}>
                        {isCustomLookingForSelected ? lookingFor : 'Specific'}
                      </Text>
                      <Text style={styles.rapidSub} numberOfLines={1}>
                        {isCustomLookingForSelected ? 'Selected • Edit' : 'Custom / +'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 3: SEXUAL ORIENTATION (Inline Pills + 4th Custom Selector Pill) */}
                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>SEXUAL ORIENTATION</Text>
                  <View style={styles.pillCluster}>
                    {['Straight', 'Bisexual', 'Queer'].map((ori) => {
                      const isSel = orientation === ori;
                      return (
                        <TouchableOpacity
                          key={ori}
                          style={[styles.microPill, isSel && styles.rapidCardSelected]}
                          activeOpacity={0.85}
                          onPress={() => {
                            hapticFeedback.light();
                            setOrientation(ori);
                            formDataRef.current.orientation = ori;
                            saveDraftLocally(2);
                          }}>
                          <Text style={[styles.microPillText, isSel && styles.microPillTextSelected]}>
                            {ori} {isSel ? '✓' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      style={[
                        styles.microPill,
                        isCustomOrientationSelected && styles.rapidCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempOrientation(isCustomOrientationSelected ? orientation : 'Pansexual');
                        setCustomOrientationInput(isCustomOrientationSelected ? orientation : '');
                        setShowOrientationModal(true);
                      }}>
                      <Text
                        style={[
                          styles.microPillText,
                          isCustomOrientationSelected && styles.microPillTextSelected,
                        ]}>
                        {isCustomOrientationSelected ? `✨ ${orientation} ✓` : '＋ More / Custom'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🎯 +32% Magnetism! 5 rapid decks left</Text>
                  <View style={styles.footerActionRow}>
                    <TouchableOpacity
                      style={styles.btnPreviousFooter}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(1)}>
                      <Text style={styles.btnPreviousFooterText}>‹ Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { flex: 1 }]}
                      activeOpacity={0.85}
                      onPress={() => advanceToDeck(3)}>
                      <Text style={styles.btnPrimaryText}>Next: Neighborhood Tribe ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== DECK 3: TRIBE & CAREER ==================== */}
            {activeDeck === 3 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderTopBar}>
                    <View style={styles.deckBadge}>
                      <Text style={styles.deckBadgeText}>🏙️ DECK 3 OF 7 • NEIGHBORHOOD TRIBE</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.headerPrevPill}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(2)}>
                      <Text style={styles.headerPrevPillText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Your everyday stomping ground
                  </Text>
                  <Text style={styles.deckSub}>
                    Join a hyper-local micro-circle & share what you build.
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  <View style={styles.tribeHeaderRow}>
                    <Text style={styles.fieldLabel}>📍 NEIGHBORHOOD MICRO-CIRCLES (OPTIONAL)</Text>
                    <TouchableOpacity
                      style={styles.tribeBrowseModalBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        hapticFeedback.light();
                        setShowTribeModal(true);
                      }}>
                      <Text style={styles.tribeBrowseModalBtnText}>🔍 Full Directory</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Selected Tribe Pill Box */}
                  <TouchableOpacity
                    style={[
                      styles.selectedTribeBanner,
                      !microCircle && {
                        borderColor: 'rgba(255,255,255,0.16)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      hapticFeedback.light();
                      setShowTribeModal(true);
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedTribeLabel}>ACTIVE TRIBE / CIRCLE (OPTIONAL)</Text>
                      <Text style={styles.selectedTribeValue} numberOfLines={1}>
                        {microCircle ? `📍 ${microCircle}` : 'Tap a circle below, or skip for now...'}
                      </Text>
                    </View>
                    {microCircle ? (
                      <TouchableOpacity
                        style={styles.selectedTribeEditBadge}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          hapticFeedback.light();
                          setMicroCircle('');
                        }}>
                        <Text style={[styles.selectedTribeEditText, { color: '#FF385C' }]}>✕ Clear</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.selectedTribeEditBadge}>
                        <Text style={styles.selectedTribeEditText}>Select</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Search Input for Tribes */}
                  <View style={styles.tribeSearchRow}>
                    <Text style={styles.tribeSearchIcon}>🔍</Text>
                    <TextInput
                      style={styles.tribeSearchInput}
                      placeholder="Search tribe, area, tech hub, or vibe..."
                      placeholderTextColor="#64748B"
                      value={tribeSearchQuery}
                      onChangeText={setTribeSearchQuery}
                    />
                    {tribeSearchQuery.length > 0 && (
                      <TouchableOpacity
                        style={styles.tribeSearchClearBtn}
                        onPress={() => setTribeSearchQuery('')}>
                        <Text style={styles.tribeSearchClearText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* City-Wise Filter Pills */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryFilterScroll}
                    contentContainerStyle={styles.categoryFilterRow}>
                    {TRIBE_CITIES.map((city) => {
                      const isCityActive = tribeCityFilter === city;
                      return (
                        <TouchableOpacity
                          key={city}
                          style={[
                            styles.categoryFilterPill,
                            isCityActive && styles.categoryFilterPillActive,
                          ]}
                          onPress={() => handleTribeCityChange(city)}>
                          <Text
                            style={[
                              styles.categoryFilterText,
                              isCityActive && styles.categoryFilterTextActive,
                            ]}>
                            {city === 'All Cities' ? '🇮🇳 All Cities' : `🏙️ ${city}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Filtered City-Wise Tribe Cards List */}
                  {loadingTribes ? (
                    <View style={styles.tribeLoadingBox}>
                      <ActivityIndicator size="small" color="#FF385C" />
                      <Text style={styles.tribeLoadingText}>Loading city micro-circles...</Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.tribeListScroller}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}>
                      {filteredTribeCircles.length === 0 ? (
                        <View style={styles.tribeEmptyBox}>
                          <Text style={styles.tribeEmptyText}>
                            No circles matched &quot;{tribeSearchQuery}&quot; in {tribeCityFilter}.
                          </Text>
                          <TouchableOpacity
                            style={styles.tribeResetFilterBtn}
                            onPress={() => {
                              setTribeSearchQuery('');
                              handleTribeCityChange('All Cities');
                            }}>
                            <Text style={styles.tribeResetFilterText}>Reset City & Search</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        filteredTribeCircles.map((circle) => {
                          const isSel = microCircle === circle.name;
                          const metro = getMetroLineColor(circle.slug || circle.name);
                          return (
                            <TouchableOpacity
                              key={circle.id}
                              style={[
                                styles.tribeCardItem,
                                metro && {
                                  borderColor: metro.cardBorder,
                                  backgroundColor: isSel ? styles.tribeCardItemSelected.backgroundColor : metro.cardBg,
                                  borderLeftWidth: 4,
                                  borderLeftColor: metro.primary,
                                },
                                isSel && styles.tribeCardItemSelected,
                              ]}
                              activeOpacity={0.85}
                              onPress={() => {
                                hapticFeedback.light();
                                setMicroCircle((prev) => (prev === circle.name ? '' : circle.name));
                              }}>
                              <View style={{ flex: 1 }}>
                                <View style={styles.tribeCardTitleRow}>
                                  <Text
                                    style={[
                                      styles.tribeCardName,
                                      metro && { color: metro.textColor },
                                      isSel && styles.tribeCardNameSelected,
                                    ]}
                                    numberOfLines={1}>
                                    {circle.name}
                                  </Text>
                                  {metro && (
                                    <View
                                      style={[
                                        styles.tribeCityTag,
                                        {
                                          backgroundColor: metro.tagBg,
                                          borderColor: metro.tagBorder,
                                          borderWidth: 1,
                                        },
                                      ]}>
                                      <Text style={[styles.tribeCityTagText, { color: metro.tagText, fontWeight: '800' }]}>
                                        🚇 {metro.name.toUpperCase()}
                                      </Text>
                                    </View>
                                  )}
                                  {!!circle.city && (
                                    <View style={styles.tribeCityTag}>
                                      <Text style={styles.tribeCityTagText}>{circle.city}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.tribeCardDesc} numberOfLines={1}>
                                  {circle.description}
                                </Text>
                                <Text style={styles.tribeCardMembers}>
                                  👥 {(circle.activeMembers || 120).toLocaleString()} active members
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.tribeSelectIndicator,
                                  isSel && styles.tribeSelectIndicatorActive,
                                ]}>
                                <Text
                                  style={[
                                    styles.tribeSelectIndicatorText,
                                    isSel && styles.tribeSelectIndicatorTextActive,
                                  ]}>
                                  {isSel ? '✓ Joined' : 'Join'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>
                  )}

                  {/* CAREER / WHAT PAYS THE BILLS? */}
                  <View style={[styles.fieldBox, { marginTop: 10 }]}>
                    <View style={styles.dobSectionHeader}>
                      <Text style={styles.fieldLabel}>CAREER / WHAT PAYS THE BILLS?</Text>
                      {job ? (
                        <Text style={styles.dobSectionSubtitle}>✓ Selected</Text>
                      ) : (
                        <Text style={[styles.dobSectionSubtitle, { color: '#94A3B8' }]}>Required</Text>
                      )}
                    </View>

                    {/* Quick 1-Tap Career Chips Grid */}
                    <View style={styles.smartChipsGrid}>
                      {CAREER_PRESET_CHIPS.map((chip) => {
                        const isSelected = job === chip.value || job === chip.label;
                        return (
                          <TouchableOpacity
                            key={chip.label}
                            style={[styles.smartCareerChip, isSelected && styles.smartCareerChipActive]}
                            onPress={() => handleCareerChipPress(chip.value)}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.smartCareerChipText, isSelected && styles.smartCareerChipTextActive]} numberOfLines={1}>
                              {chip.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Custom Text Input with Auto-Scroll on Focus */}
                    <TextInput
                      style={[styles.glowInput, { marginTop: 8 }]}
                      placeholder="Or type custom career title..."
                      placeholderTextColor="#64748B"
                      value={job}
                      onChangeText={handleJobChange}
                      onFocus={() => {
                        setTimeout(() => {
                          mainScrollRef.current?.scrollToEnd({ animated: true });
                        }, 150);
                      }}
                    />
                  </View>

                  {/* COLLEGE / ALMA MATER */}
                  <View style={styles.fieldBox}>
                    <View style={styles.dobSectionHeader}>
                      <Text style={styles.fieldLabel}>COLLEGE / ALMA MATER (OPTIONAL)</Text>
                      {institute ? (
                        <Text style={styles.dobSectionSubtitle}>✓ Added</Text>
                      ) : null}
                    </View>

                    {/* Quick 1-Tap College Chips Row */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.smartCollegeScrollContainer}
                    >
                      {COLLEGE_PRESET_CHIPS.map((college) => {
                        const isSelected = institute === college;
                        return (
                          <TouchableOpacity
                            key={college}
                            style={[styles.smartCollegeChip, isSelected && styles.smartCollegeChipActive]}
                            onPress={() => handleCollegeChipPress(college)}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.smartCollegeChipText, isSelected && styles.smartCollegeChipTextActive]}>
                              {college}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Custom Text Input with Auto-Scroll on Focus */}
                    <TextInput
                      style={[styles.glowInput, { marginTop: 8 }]}
                      placeholder="Or type custom college / university..."
                      placeholderTextColor="#64748B"
                      value={institute}
                      onChangeText={handleInstituteChange}
                      onFocus={() => {
                        setTimeout(() => {
                          mainScrollRef.current?.scrollToEnd({ animated: true });
                        }, 150);
                      }}
                    />
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🔥 48% Magnetism! Halfway milestone unlocked</Text>
                  <View style={styles.footerActionRow}>
                    <TouchableOpacity
                      style={styles.btnPreviousFooter}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(2)}>
                      <Text style={styles.btnPreviousFooterText}>‹ Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { flex: 1 }]}
                      activeOpacity={0.85}
                      onPress={() => advanceToDeck(4)}>
                      <Text style={styles.btnPrimaryText}>Next: 1-Tap Bio Energy ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== DECK 4: ZERO-TYPING BIO ==================== */}
            {activeDeck === 4 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderTopBar}>
                    <View style={styles.deckBadge}>
                      <Text style={styles.deckBadgeText}>🎭 DECK 4 OF 7 • 1-TAP BIO SPARK</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.headerPrevPill}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(3)}>
                      <Text style={styles.headerPrevPillText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Pick your energy persona
                  </Text>
                  <Text style={styles.deckSub}>
                    Tap an archetype to populate your bio or customize it below.
                  </Text>
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
                    {[
                      'All',
                      'Work & Ambition',
                      'Wholesome & Chaos',
                      'Art & Deep Talks',
                      'Witty & Playful',
                      'Foodie Purist',
                      'Travel & Outdoors',
                    ].map((cat) => {
                      const isCatSel = selectedBioCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryFilterPill,
                            isCatSel && styles.categoryFilterPillActive,
                          ]}
                          onPress={() => {
                            hapticFeedback.light();
                            setSelectedBioCategory(cat);
                          }}>
                          <Text
                            style={[
                              styles.categoryFilterText,
                              isCatSel && styles.categoryFilterTextActive,
                            ]}>
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
                    {WITTY_BIOS.filter(
                      (item) => selectedBioCategory === 'All' || item.category === selectedBioCategory
                    ).map((item) => {
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
                      <Text style={styles.bioEditorLabel}>YOUR BIO</Text>
                      <TouchableOpacity style={styles.rerollBtn} onPress={handleRerollBio}>
                        <Text style={styles.rerollBtnText}>🎲 Reroll Magic</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.bioTextInput}
                      placeholder="Tap an archetype card above or type your own witty bio here..."
                      placeholderTextColor="#64748B"
                      value={bio}
                      onChangeText={handleBioChange}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>✨ 64% Magnetism! 3 quick decks left</Text>
                  <View style={styles.footerActionRow}>
                    <TouchableOpacity
                      style={styles.btnPreviousFooter}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(3)}>
                      <Text style={styles.btnPreviousFooterText}>‹ Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { flex: 1 }]}
                      activeOpacity={0.85}
                      onPress={() => advanceToDeck(5)}>
                      <Text style={styles.btnPrimaryText}>Next: Lifestyle & Stature ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== DECK 5: LIFESTYLE & STATURE ==================== */}
            {activeDeck === 5 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderTopBar}>
                    <View style={styles.deckBadge}>
                      <Text style={styles.deckBadgeText}>☕ DECK 5 OF 7 • LIFESTYLE RHYTHM</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.headerPrevPill}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(4)}>
                      <Text style={styles.headerPrevPillText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Your height & everyday vibe
                  </Text>
                  <Text style={styles.deckSub}>Clear mutual compatibility from Day 1.</Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Height Box with Smooth Continuous Slider & 1-cm Nudge Buttons */}
                  <View style={styles.statureBox}>
                    <View style={styles.statureHeaderRow}>
                      <Text style={styles.fieldLabel}>HEIGHT 📏</Text>
                      <View style={styles.statureArchetypeBadge}>
                        <Text style={styles.statureArchetypeText}>{getStatureArchetype(heightCm)}</Text>
                      </View>
                    </View>

                    <View style={styles.statureDisplayCenter}>
                      <Text style={styles.statureImperialText}>{formatFeetAndInches(heightCm)}</Text>
                      <View style={styles.statureMetricPill}>
                        <Text style={styles.statureMetricText}>{heightCm} cm</Text>
                      </View>
                    </View>

                    {/* Interactive Slider Row with Nudge [-] & [+] */}
                    <View style={styles.sliderControlRow}>
                      <TouchableOpacity
                        style={styles.nudgeBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          hapticFeedback.light();
                          setHeightCm((prev) => Math.max(140, prev - 1));
                        }}>
                        <Text style={styles.nudgeBtnText}>– 1</Text>
                      </TouchableOpacity>

                      <View
                        style={styles.sliderTrackContainer}
                        onLayout={(e) => {
                          sliderTrackWidthRef.current = e.nativeEvent.layout.width;
                        }}
                        {...sliderPanResponder.panHandlers}>
                        <View style={styles.sliderTrackBackground}>
                          <View
                            style={[
                              styles.sliderTrackFill,
                              { width: `${Math.max(0, Math.min(100, ((heightCm - 140) / (215 - 140)) * 100))}%` },
                            ]}
                          />
                        </View>
                        <View
                          style={[
                            styles.sliderThumb,
                            {
                              left: `${Math.max(0, Math.min(100, ((heightCm - 140) / (215 - 140)) * 100))}%`,
                            },
                          ]}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.nudgeBtn, styles.nudgeBtnHighlight]}
                        activeOpacity={0.7}
                        onPress={() => {
                          hapticFeedback.light();
                          setHeightCm((prev) => Math.min(215, prev + 1));
                        }}>
                        <Text style={styles.nudgeBtnText}>+ 1</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Range Boundary Labels */}
                    <View style={styles.sliderBoundLabels}>
                      <Text style={styles.sliderBoundText}>140 cm (4'7")</Text>
                      <Text style={styles.sliderBoundText}>215 cm (7'1")</Text>
                    </View>

                    {/* Quick Jump Preset Chips */}
                    <View style={styles.statureQuickJumpRow}>
                      {[
                        { cm: 160, label: "5'3\"" },
                        { cm: 168, label: "5'6\"" },
                        { cm: 175, label: "5'9\"" },
                        { cm: 183, label: "6'0\"" },
                        { cm: 188, label: "6'2\"" },
                      ].map((chip) => {
                        const isSelected = heightCm === chip.cm;
                        return (
                          <TouchableOpacity
                            key={chip.cm}
                            style={[styles.statureQuickChip, isSelected && styles.statureQuickChipActive]}
                            activeOpacity={0.75}
                            onPress={() => {
                              hapticFeedback.medium();
                              setHeightCm(chip.cm);
                              formDataRef.current.heightCm = chip.cm;
                              saveDraftLocally(5);
                            }}>
                            <Text style={[styles.statureQuickChipText, isSelected && styles.statureQuickChipTextActive]}>
                              {chip.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>FOOD PREFERENCE</Text>
                  <View style={styles.pillCluster}>
                    {[
                      { key: 'PURE_VEG', label: '🥗 Pure Vegetarian' },
                      { key: 'NON_VEG', label: '🍗 Non-Vegetarian' },
                      { key: 'VEGAN', label: '🌱 Vegan' },
                      { key: 'EGGETARIAN', label: '🥚 Eggetarian' },
                      { key: 'STRICT_JAIN', label: '🪷 Strict Jain' },
                    ].map((d) => (
                      <TouchableOpacity
                        key={d.key}
                        style={[
                          styles.microPill,
                          dietaryPref === d.key && styles.microPillSelected,
                        ]}
                        onPress={() => {
                          hapticFeedback.light();
                          setDietaryPref(d.key as DietaryPreference);
                          formDataRef.current.dietaryPref = d.key as DietaryPreference;
                          saveDraftLocally(5);
                        }}>
                        <Text
                          style={[
                            styles.microPillText,
                            dietaryPref === d.key && styles.microPillTextSelected,
                          ]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>SOCIAL DRINKING</Text>
                  <View style={styles.pillCluster}>
                    {['Socially / Weekends', 'Teetotaler / Never', 'Sober / Mindful'].map((dr) => (
                      <TouchableOpacity
                        key={dr}
                        style={[
                          styles.microPill,
                          drinkingHabit === dr && styles.microPillSelected,
                        ]}
                        onPress={() => {
                          hapticFeedback.light();
                          setDrinkingHabit(dr);
                          formDataRef.current.drinkingHabit = dr;
                          saveDraftLocally(5);
                        }}>
                        <Text
                          style={[
                            styles.microPillText,
                            drinkingHabit === dr && styles.microPillTextSelected,
                          ]}>
                          {dr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={styles.paceCue}>🚀 78% Magnetism! Editorial Photo Deck ahead</Text>
                  <View style={styles.footerActionRow}>
                    <TouchableOpacity
                      style={styles.btnPreviousFooter}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(4)}>
                      <Text style={styles.btnPreviousFooterText}>‹ Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { flex: 1 }]}
                      activeOpacity={0.85}
                      onPress={() => advanceToDeck(6)}>
                      <Text style={styles.btnPrimaryText}>Next: Editorial Portfolio ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== DECK 6: ASYMMETRIC EDITORIAL PORTFOLIO ==================== */}
            {activeDeck === 6 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderTopBar}>
                    <View style={styles.deckBadge}>
                      <Text style={styles.deckBadgeText}>📸 DECK 6 OF 7 • THE VISUAL STORY</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.headerPrevPill}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(5)}>
                      <Text style={styles.headerPrevPillText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Curate your editorial portfolio
                  </Text>
                  <Text style={styles.deckSub}>
                    Upload at least 2 photos (Cover Shot + 1 more) — or fill all 6 for 3x matches.
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Photo Counter & Requirement Banner */}
                  <View style={styles.photoCounterBanner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.photoCounterTitle}>
                        {uploadedPhotosList.length >= 2
                          ? `✅ ${uploadedPhotosList.length} of 6 Editorial Photos Ready`
                          : `📸 ${uploadedPhotosList.length} of 2 Required Photos Uploaded`}
                      </Text>
                      <Text style={styles.photoCounterSub}>
                        {uploadedPhotosList.length < 2
                          ? `Upload ${2 - uploadedPhotosList.length} more photo${
                              2 - uploadedPhotosList.length === 1 ? '' : 's'
                            } to unlock the final Vedic step`
                          : 'Minimum 2 met! Tap any frame to add or replace photos'}
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

                  {/* Quick Multi-Photo Upload Button */}
                  <TouchableOpacity
                    style={styles.multiPhotoQuickBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      const firstEmpty = photoSlots.findIndex((s) => !s || !s.trim());
                      handlePickPhotoSlot(firstEmpty >= 0 ? firstEmpty : 0, 'multi');
                    }}>
                    <Text style={styles.multiPhotoQuickBtnText}>
                      📚 Select Multiple Photos at Once (2–6 Photos)
                    </Text>
                  </TouchableOpacity>

                  {/* ASYMMETRIC EDITORIAL PORTFOLIO GRID:
                      Top Row: Slot 0 (2x2 Hero Cover Shot) on Left + Slots 1 & 2 stacked on Right
                      Bottom Row: Slots 3, 4, 5 in 3 equal columns */}
                  <View style={styles.editorialPortfolioContainer}>
                    <View style={styles.editorialTopRow}>
                      {/* Left 2x2 Hero Cover Shot (Slot 0) */}
                      <View style={styles.editorialHeroCol}>
                        {renderPhotoSlotBox(0, styles.editorialHeroSlot, true)}
                      </View>
                      {/* Right Stacked Slots 1 & 2 */}
                      <View style={styles.editorialRightStackCol}>
                        {renderPhotoSlotBox(1, styles.editorialStackedSlot, false)}
                        {renderPhotoSlotBox(2, styles.editorialStackedSlot, false)}
                      </View>
                    </View>

                    {/* Bottom Row: Slots 3, 4, 5 */}
                    <View style={styles.editorialBottomRow}>
                      {renderPhotoSlotBox(3, styles.editorialBottomSlot, false)}
                      {renderPhotoSlotBox(4, styles.editorialBottomSlot, false)}
                      {renderPhotoSlotBox(5, styles.editorialBottomSlot, false)}
                    </View>
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
                    🌟{' '}
                    {uploadedPhotosList.length >= 2
                      ? '92% Magnetism! Final Vedic Kundali deck ahead'
                      : 'Upload at least 2 photos to unlock the final deck'}
                  </Text>
                  <View style={styles.footerActionRow}>
                    <TouchableOpacity
                      style={styles.btnPreviousFooter}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(5)}>
                      <Text style={styles.btnPreviousFooterText}>‹ Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btnPrimary,
                        { flex: 1 },
                        uploadedPhotosList.length < 2 && { opacity: 0.65 },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => advanceToDeck(7)}>
                      <Text style={styles.btnPrimaryText}>
                        {uploadedPhotosList.length >= 2
                          ? 'Next: Vedic Janampatri ➔'
                          : `Upload ${2 - uploadedPhotosList.length} More Photo${
                              2 - uploadedPhotosList.length === 1 ? '' : 's'
                            }`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== DECK 7 (FINAL STEP): VEDIC JANAMPATRI -> LAUNCH DISCOVERY ==================== */}
            {activeDeck === 7 && (
              <View style={styles.deckInner}>
                <View style={styles.deckHeader}>
                  <View style={styles.deckHeaderTopBar}>
                    <View style={styles.deckBadge}>
                      <Text style={styles.deckBadgeText}>🪐 DECK 7 OF 7 • COSMIC CHEMISTRY</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.headerPrevPill}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(6)}>
                      <Text style={styles.headerPrevPillText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deckTitle, isCompactPhone && { fontSize: 20 }]}>
                    Calibrate your birth chart
                  </Text>
                  <Text style={styles.deckSub}>
                    Sidereal Swiss Ephemeris for 36-point Ashta-Koota Guna Milan. (Optional — can be added later)
                  </Text>
                </View>

                <View style={styles.deckBody}>
                  {/* Kundali Diamond Visual Component */}
                  <View style={styles.kundliChartBox}>
                    <KundaliChartDiamond chandraRashi="Taurus (वृषभ)" sunSign="Leo" />
                  </View>

                  <View style={styles.fieldBox}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>EXACT BIRTH TIME (HH:MM)</Text>
                      <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                    </View>
                    <TextInput
                      style={styles.glowInput}
                      value={birthTime}
                      onChangeText={handleBirthTimeChange}
                      placeholder="HH:MM (e.g. 14:30 or 08:15)"
                      placeholderTextColor="#64748B"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>

                  <View style={styles.fieldBox}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>BIRTH CITY / TOWN</Text>
                      <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                    </View>
                    <TextInput
                      style={styles.glowInput}
                      value={birthCity}
                      onChangeText={handleBirthCityChange}
                      placeholder="e.g. New Delhi, Mumbai, Jaipur..."
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.deckFooter}>
                  <Text style={[styles.paceCue, { color: '#FCD34D' }]}>
                    👑 100% Profile Magnetism! Ready to enter Discovery
                  </Text>
                  <View style={styles.footerActionRow}>
                    <TouchableOpacity
                      style={styles.btnPreviousFooter}
                      activeOpacity={0.8}
                      onPress={() => advanceToDeck(6)}>
                      <Text style={styles.btnPreviousFooterText}>‹ Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnPrimary, styles.btnLaunch, { flex: 1 }]}
                      activeOpacity={0.85}
                      disabled={isSubmitting}
                      onPress={handleCompileAndLaunch}>
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>🚀 Launch Discovery Deck</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.skipDeck7Btn}
                    activeOpacity={0.75}
                    disabled={isSubmitting}
                    onPress={handleCompileAndLaunch}>
                    <Text style={styles.skipDeck7BtnText}>Skip Vedic Chart for Now ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selfie Camera / Upload Modal */}
      {showSelfieModal && (
        <SelfieCameraModal
          visible={showSelfieModal}
          onClose={() => setShowSelfieModal(false)}
          onCapture={handleSelfieCaptured}
        />
      )}

      {/* Full-Screen Micro-Community Directory Modal */}
      {showTribeModal && (
        <MicroCommunityModal
          visible={showTribeModal}
          onClose={() => setShowTribeModal(false)}
          selectedName={microCircle}
          initialCity={tribeCityFilter !== 'All Cities' ? tribeCityFilter : undefined}
          title="Select Your Neighborhood Tribe"
          subtitle="Search & filter hyper-local micro-communities across Indian cities"
          onSelect={(circle) => {
            if (circle) {
              hapticFeedback.success();
              setMicroCircle(circle.name);
              if (circle.city) {
                setTribeCityFilter(circle.city);
              }
            } else {
              hapticFeedback.light();
              setMicroCircle('');
            }
          }}
        />
      )}

      {/* Identity Spectrum & Custom Input Modal (Triggered by 3rd Card on Deck 2) */}
      {showGenderModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGenderModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitleLeft}>🌈 Identity Spectrum</Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    Pick an identity below or type your exact identity.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalTopRightCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowGenderModal(false)}>
                  <Text style={styles.modalTopRightCancelText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customModalInputBox}>
                <TextInput
                  style={styles.customModalTextInput}
                  placeholder="Or type custom identity (e.g. Non-binary, Trans Man)..."
                  placeholderTextColor="#64748B"
                  value={customGenderInput}
                  onChangeText={(txt) => {
                    setCustomGenderInput(txt);
                    if (txt.trim()) setTempGenderDisplay(txt.trim());
                  }}
                />
              </View>

              <ScrollView style={{ maxHeight: 260, width: '100%', marginVertical: 6 }}>
                {GENDER_PRESETS.filter((g) => g !== 'Other').map((item) => {
                  const isSel = tempGenderDisplay === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pickerOptionItem, isSel && styles.pickerOptionActive]}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempGenderDisplay(item);
                        setCustomGenderInput(item);
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
                  const chosen = (customGenderInput.trim() || tempGenderDisplay || 'Non-binary').trim();
                  hapticFeedback.success();
                  let g: Gender = 'NON_BINARY';
                  if (chosen === 'Man') {
                    g = 'MALE';
                  } else if (chosen === 'Woman') {
                    g = 'FEMALE';
                  }
                  setGender(g);
                  setGenderDisplay(chosen);
                  formDataRef.current.gender = g;
                  formDataRef.current.genderDisplay = chosen;
                  saveDraftLocally(2);
                  setShowGenderModal(false);
                }}>
                <Text style={styles.modalDoneBottomBtnText}>
                  ✓ Select & Highlight &quot;{customGenderInput.trim() || tempGenderDisplay || 'Identity'}&quot;
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Looking To Meet Specific / Custom Modal (Triggered by 4th Card on Deck 2) */}
      {showPreferenceModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPreferenceModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitleLeft}>💫 Specific Desire / Preference</Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    Choose or type exactly who you want to discover.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalTopRightCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowPreferenceModal(false)}>
                  <Text style={styles.modalTopRightCancelText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customModalInputBox}>
                <TextInput
                  style={styles.customModalTextInput}
                  placeholder="Or type specific preference (e.g. Non-binary, Trans Women)..."
                  placeholderTextColor="#64748B"
                  value={customLookingForInput}
                  onChangeText={(txt) => {
                    setCustomLookingForInput(txt);
                    if (txt.trim()) setTempLookingFor(txt.trim());
                  }}
                />
              </View>

              <ScrollView style={{ maxHeight: 260, width: '100%', marginVertical: 6 }}>
                {[
                  ...GENDER_PREFERENCE_PRESETS.filter((p) => p !== 'Other'),
                  'Non-binary',
                  'Transgender Women',
                  'Transgender Men',
                  'Queer & Expansive',
                ].map((item) => {
                  const isSel = tempLookingFor === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pickerOptionItem, isSel && styles.pickerOptionActive]}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempLookingFor(item);
                        setCustomLookingForInput(item);
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
                  const chosen = (customLookingForInput.trim() || tempLookingFor || 'Everyone').trim();
                  hapticFeedback.success();
                  setLookingFor(chosen);
                  formDataRef.current.lookingFor = chosen;
                  saveDraftLocally(2);
                  setShowPreferenceModal(false);
                }}>
                <Text style={styles.modalDoneBottomBtnText}>
                  ✓ Select & Highlight &quot;{customLookingForInput.trim() || tempLookingFor || 'Preference'}&quot;
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Sexual Orientation Modal (Triggered by 4th Pill on Deck 2) */}
      {showOrientationModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowOrientationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitleLeft}>✨ Sexual Orientation</Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    Select or write your sexual orientation.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalTopRightCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowOrientationModal(false)}>
                  <Text style={styles.modalTopRightCancelText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customModalInputBox}>
                <TextInput
                  style={styles.customModalTextInput}
                  placeholder="Or type custom orientation (e.g. Demisexual, Pansexual)..."
                  placeholderTextColor="#64748B"
                  value={customOrientationInput}
                  onChangeText={(txt) => {
                    setCustomOrientationInput(txt);
                    if (txt.trim()) setTempOrientation(txt.trim());
                  }}
                />
              </View>

              <ScrollView style={{ maxHeight: 260, width: '100%', marginVertical: 6 }}>
                {SEXUAL_ORIENTATION_PRESETS.filter((o) => o !== 'Other').map((item) => {
                  const isSel = tempOrientation === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pickerOptionItem, isSel && styles.pickerOptionActive]}
                      onPress={() => {
                        hapticFeedback.light();
                        setTempOrientation(item);
                        setCustomOrientationInput(item);
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
                  const chosen = (customOrientationInput.trim() || tempOrientation || 'Straight').trim();
                  hapticFeedback.success();
                  setOrientation(chosen);
                  formDataRef.current.orientation = chosen;
                  saveDraftLocally(2);
                  setShowOrientationModal(false);
                }}>
                <Text style={styles.modalDoneBottomBtnText}>
                  ✓ Select & Highlight &quot;{customOrientationInput.trim() || tempOrientation || 'Orientation'}&quot;
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Upload Photo Slot Modal */}
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
                    📸 {activePhotoSlotModal === 0 ? 'Hero Cover Shot (#1)' : `Portfolio Slot #${activePhotoSlotModal + 1}`}
                  </Text>
                  <Text style={styles.modalHeaderSubLeft}>
                    {activePhotoSlotModal < 2
                      ? 'Required profile photo (minimum 2 photos required)'
                      : 'Optional editorial showcase photo'}
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
                    🖼️ Choose Photo for Slot #{activePhotoSlotModal + 1}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoPickerActionBtnMulti}
                  activeOpacity={0.85}
                  onPress={() => handlePickPhotoSlot(activePhotoSlotModal, 'multi')}>
                  <Text style={styles.photoPickerActionBtnMultiText}>
                    📚 Select Multiple Photos (Fill Slots #{activePhotoSlotModal + 1}–6)
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
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
    marginBottom: 6,
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
    marginBottom: 4,
  },
  stepperBar: {
    width: '100%',
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
  deckStripScroll: {
    maxHeight: 30,
    marginBottom: 6,
  },
  deckStripContent: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  deckStripPill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  deckStripPillActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
    borderColor: '#FF385C',
  },
  deckStripPillDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  deckStripPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  deckStripPillTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  deckStripPillTextDone: {
    color: '#6EE7B7',
    fontWeight: '800',
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
    gap: 6,
  },
  ribbonItem: {
    fontSize: 10,
    color: '#8E95AA',
    flexShrink: 1,
  },
  ribbonBold: {
    color: '#FFF',
    fontWeight: '800',
  },
  resumedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 56, 92, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  resumedBannerText: {
    color: '#FF6B8B',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollArena: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    maxWidth: 460,
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
    marginBottom: 14,
  },
  deckHeaderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  deckBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deckBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.8,
  },
  headerPrevPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerPrevPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  deckTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginTop: 4,
  },
  deckSub: {
    fontSize: 13,
    color: '#8E95AA',
    lineHeight: 18,
    marginTop: 3,
  },
  deckBody: {
    gap: 11,
    marginVertical: 6,
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dobRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  agePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  agePillValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  agePillInvalid: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  agePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  agePillTextValid: {
    color: '#34D399',
  },
  agePillTextInvalid: {
    color: '#F87171',
  },
  dobContainerCard: {
    backgroundColor: 'rgba(20, 23, 34, 0.6)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 20,
  },
  dobHeroCard: {
    backgroundColor: 'rgba(10, 12, 18, 0.85)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    padding: 14,
    marginBottom: 16,
  },
  dobHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dobHeroLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  dobHeroCenter: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  dobHeroAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  dobHeroAgeNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  dobHeroAgeUnit: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF385C',
  },
  dobHeroDateString: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 2,
  },
  dobZodiacPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
  },
  dobZodiacPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B8B',
  },
  dobSectionBlock: {
    marginBottom: 14,
  },
  dobSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dobSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  dobSectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF385C',
  },
  dobYearStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0C12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 6,
    marginBottom: 8,
  },
  dobStepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobStepperBtnDisabled: {
    opacity: 0.3,
  },
  dobStepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dobYearCenterDisplay: {
    alignItems: 'center',
  },
  dobYearBigText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dobYearAgeSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dobQuickYearsContainer: {
    paddingVertical: 2,
    gap: 6,
  },
  dobQuickYearChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  dobQuickYearChipActive: {
    backgroundColor: '#FF385C',
    borderColor: '#FF385C',
  },
  dobQuickYearChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  dobQuickYearChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dobQuickYearChipSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  dobQuickYearChipSubActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dobMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dobMonthChip: {
    width: '23%',
    flexGrow: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobMonthChipActive: {
    backgroundColor: '#FF385C',
    borderColor: '#FF385C',
  },
  dobMonthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  dobMonthChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dobDayScrollContainer: {
    paddingVertical: 2,
    gap: 6,
  },
  dobDayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobDayCircleActive: {
    backgroundColor: '#FF385C',
    borderColor: '#FF385C',
  },
  dobDayCircleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  dobDayCircleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  smartChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  smartCareerChip: {
    width: '48.5%',
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
  },
  smartCareerChipActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.2)',
    borderColor: '#FF385C',
  },
  smartCareerChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  smartCareerChipTextActive: {
    color: '#FF6B8B',
    fontWeight: '800',
  },
  smartCollegeScrollContainer: {
    paddingVertical: 2,
    gap: 6,
    marginBottom: 4,
  },
  smartCollegeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartCollegeChipActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.2)',
    borderColor: '#FF385C',
  },
  smartCollegeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  smartCollegeChipTextActive: {
    color: '#FF6B8B',
    fontWeight: '800',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionalBadgeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipDeck7Btn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipDeck7BtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  selfieScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 12,
  },
  selfieScanCardDone: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  selfieScanCardPending: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: '#F59E0B',
  },
  selfieScanIcon: {
    fontSize: 24,
  },
  selfieScanTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  selfieScanDesc: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  /* Option 1: Face ID Hologram Selfie Styles */
  selfieHoloEmptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 56, 92, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    borderStyle: 'dashed',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  selfieHoloIconContainer: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  selfieHoloRingOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 56, 92, 0.14)',
  },
  selfieHoloRingInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieHoloCameraEmoji: {
    fontSize: 26,
  },
  selfieHoloPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#05060A',
    shadowColor: '#FF385C',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  selfieHoloPlusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  selfieHoloEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  selfieHoloEmptyDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290,
  },
  selfieHoloEmeraldHighlight: {
    color: '#34D399',
    fontWeight: '700',
  },
  selfieHoloPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.3)',
  },
  selfieHoloPillText: {
    color: '#FF6B8B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selfieHoloUploadedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: 20,
    padding: 14,
    marginVertical: 4,
  },
  selfieHoloCardVerified: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  selfieHoloCardPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderColor: '#F59E0B',
  },
  selfieHoloCardRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: '#EF4444',
  },
  selfieHoloTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selfieThumbnailWrapper: {
    position: 'relative',
    width: 66,
    height: 66,
  },
  selfieThumbnailImage: {
    width: 66,
    height: 66,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#0A0E1A',
  },
  selfieThumbBorderVerified: {
    borderColor: '#10B981',
  },
  selfieThumbBorderPending: {
    borderColor: '#F59E0B',
  },
  selfieThumbBorderRejected: {
    borderColor: '#EF4444',
  },
  selfieStatusMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#05060A',
  },
  selfieStatusMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  selfieHoloStatusTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  selfieLivePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  selfieHoloStatusTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selfieHoloUploadedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  selfieHoloUploadedDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  selfieHoloBottomStrip: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selfieHoloShieldStatus: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
  },
  selfieRetakeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  selfieRetakeBtnText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
  /* Primary Residence 3-Layer Styles */
  residenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeResidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeResidenceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  gpsDetectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gpsDetectBarActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#10B981',
  },
  gpsPulseCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsDetectTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  gpsDetectSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  gpsDetectActionPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  gpsDetectActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00E5FF',
  },
  citySearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080B17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  citySearchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
  },
  citySearchUseBtn: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  citySearchUseBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  citySuggestionDropdown: {
    backgroundColor: '#0B0F20',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  citySuggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  citySuggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  citySuggestionTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
  },
  metroCarouselScroll: {
    marginTop: 2,
  },
  metroCarouselContent: {
    gap: 10,
    paddingRight: 4,
  },
  metroHubCard: {
    width: 132,
    height: 114,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: '#080B17',
  },
  metroHubCardSelected: {
    borderColor: '#FF385C',
    borderWidth: 2,
  },
  metroHubImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  metroHubOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5, 6, 12, 0.52)',
  },
  metroHubCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF385C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metroHubCheckBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
  },
  metroHubTextWrap: {
    padding: 8,
  },
  metroHubVibeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
  },
  metroHubCityTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 1,
  },
  metroHubSubText: {
    fontSize: 9,
    color: '#CBD5E1',
    marginTop: 1,
  },
  /* Deck 2 Inline Selector Cards */
  rapidRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rapidRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rapidCard: {
    flex: 1,
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 12,
    gap: 3,
    position: 'relative',
  },
  rapidCardCompact: {
    width: '48.2%',
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 12,
    gap: 3,
    position: 'relative',
  },
  rapidCardSelected: {
    backgroundColor: 'rgba(255, 56, 92, 0.2)',
    borderColor: '#FF385C',
  },
  rapidCheckDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidCheckDotText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  rapidEmoji: {
    fontSize: 20,
  },
  rapidTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  rapidSub: {
    fontSize: 10,
    color: '#8E95AA',
  },
  pillCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microPill: {
    backgroundColor: '#090B14',
    borderWidth: 1.5,
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
    fontWeight: '800',
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
    maxHeight: 205,
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
    marginTop: 4,
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
    minHeight: 48,
  },
  statureBox: {
    backgroundColor: '#080A14',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.3)',
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  statureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statureArchetypeBadge: {
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statureArchetypeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B8B',
  },
  statureDisplayCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  statureImperialText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statureMetricPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statureMetricText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  nudgeBtn: {
    width: 44,
    height: 40,
    backgroundColor: '#151A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeBtnHighlight: {
    borderColor: 'rgba(255, 56, 92, 0.4)',
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
  },
  nudgeBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sliderTrackContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#FF385C',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF385C',
    marginLeft: -12,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  sliderBoundLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 54,
    marginTop: -4,
  },
  sliderBoundText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  statureQuickJumpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    gap: 4,
  },
  statureQuickChip: {
    flex: 1,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  statureQuickChipActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.2)',
    borderColor: '#FF385C',
  },
  statureQuickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statureQuickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  statureNum: {
    fontSize: 24,
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
    marginBottom: 4,
  },
  deckFooter: {
    marginTop: 14,
    gap: 8,
  },
  footerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnPreviousFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPreviousFooterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  paceCue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: '#FF385C',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  /* Modals */
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
  customModalInputBox: {
    width: '100%',
    marginBottom: 6,
  },
  customModalTextInput: {
    width: '100%',
    backgroundColor: '#080A14',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOptionItem: {
    paddingVertical: 11,
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
    fontSize: 13,
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
  /* Asymmetric Editorial Portfolio Grid (Deck 6) */
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
  editorialPortfolioContainer: {
    gap: 10,
    marginTop: 4,
  },
  editorialTopRow: {
    flexDirection: 'row',
    gap: 10,
    height: 236,
  },
  editorialHeroCol: {
    flex: 2,
    height: '100%',
  },
  editorialRightStackCol: {
    flex: 1,
    gap: 10,
    height: '100%',
  },
  editorialHeroSlot: {
    width: '100%',
    height: '100%',
  },
  editorialStackedSlot: {
    width: '100%',
    flex: 1,
  },
  editorialBottomRow: {
    flexDirection: 'row',
    gap: 10,
    height: 112,
  },
  editorialBottomSlot: {
    flex: 1,
    height: '100%',
  },
  photoSlotCard: {
    backgroundColor: '#080B17',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderStyle: 'dashed',
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoSlotHeroCover: {
    borderColor: 'rgba(245, 158, 11, 0.75)',
    backgroundColor: 'rgba(245, 158, 11, 0.07)',
    borderWidth: 2,
  },
  photoSlotCardRequired: {
    borderColor: 'rgba(255, 56, 92, 0.55)',
    backgroundColor: 'rgba(255, 56, 92, 0.06)',
  },
  photoSlotCardFilled: {
    borderStyle: 'solid',
    borderColor: '#10B981',
  },
  heroCoverTopPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroCoverTopPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 0.4,
  },
  photoSlotImage: {
    width: '100%',
    height: '100%',
  },
  photoSlotTopTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(5, 6, 10, 0.8)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoSlotHeroBadge: {
    backgroundColor: '#FCD34D',
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
    width: '100%',
    height: '100%',
  },
  photoSlotPlusIcon: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  photoSlotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  photoSlotReqSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    textAlign: 'center',
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
  tribeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tribeBrowseModalBtn: {
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tribeBrowseModalBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B8B',
  },
  selectedTribeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1.5,
    borderColor: '#FF385C',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  selectedTribeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDA4AF',
    letterSpacing: 0.8,
  },
  selectedTribeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
  },
  selectedTribeEditBadge: {
    backgroundColor: 'rgba(5, 6, 10, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  selectedTribeEditText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCD34D',
  },
  tribeSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080B17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tribeSearchIcon: {
    fontSize: 14,
  },
  tribeSearchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
  },
  tribeSearchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tribeSearchClearText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },
  tribeLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  tribeLoadingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tribeListScroller: {
    maxHeight: 175,
  },
  tribeEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tribeEmptyText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  tribeResetFilterBtn: {
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: '#FF385C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tribeResetFilterText: {
    color: '#FF6B8B',
    fontSize: 11,
    fontWeight: '800',
  },
  tribeCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080B17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 10,
  },
  tribeCardItemSelected: {
    backgroundColor: 'rgba(255, 56, 92, 0.14)',
    borderColor: '#FF385C',
  },
  tribeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tribeCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F1F5F9',
    flexShrink: 1,
  },
  tribeCardNameSelected: {
    color: '#FF6B8B',
  },
  tribeCityTag: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tribeCityTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  tribeCardDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  tribeCardMembers: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 3,
  },
  tribeSelectIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tribeSelectIndicatorActive: {
    backgroundColor: '#FF385C',
  },
  tribeSelectIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  tribeSelectIndicatorTextActive: {
    color: '#FFF',
  },
  multiPhotoQuickBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  multiPhotoQuickBtnText: {
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '800',
  },
  photoPickerActionBtnMulti: {
    width: '100%',
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  photoPickerActionBtnMultiText: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '800',
  },
});
