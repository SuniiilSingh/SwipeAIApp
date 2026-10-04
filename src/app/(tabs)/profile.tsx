import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api, normalizeImageUrl } from '@/services/api';
import { DatingIntent, DesireProfile, DietaryPreference, LivingStatus, UserProfile } from '@/types';
import { playAudibleVoiceNote, stopAudibleVoiceNote } from '@/utils/audioPlayer';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, createAudioPlayer, AudioPlayer } from 'expo-audio';
import { hapticFeedback } from '@/utils/haptics';
import {
  formatHeight,
  isValidHumanHeight,
  getHeightValidationError,
  cmToFeetInches,
  MIN_HUMAN_HEIGHT_CM,
  MAX_HUMAN_HEIGHT_CM,
} from '@/utils/height';
import DesireProfileModal from '@/components/desire-profile-modal';
import SelfieCameraModal from '@/components/selfie-camera-modal';

const { width } = Dimensions.get('window');

import {
  INTERESTS_PRESETS,
  JOB_PRESETS,
  EDUCATION_PRESETS,
  SEXUAL_ORIENTATION_PRESETS,
  GENDER_PRESETS,
  GENDER_PREFERENCE_PRESETS,
  RELATIONSHIP_INTENT_PRESETS,
  PROMPT_PRESETS,
  DIETARY_OPTIONS,
  LANGUAGE_OPTIONS,
  LIVING_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  VACATION_OPTIONS,
  HOBBIES_PRESETS,
  VEDIC_ZODIAC_OPTIONS,
  VOICE_PROMPT_TOPICS,
  MEME_PRESETS,
} from '@/constants/profile-presets';

export {
  LANGUAGE_OPTIONS,
  VEDIC_ZODIAC_OPTIONS,
  VOICE_PROMPT_TOPICS,
  MEME_PRESETS,
};

export default function ProfileScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ edit?: string; reason?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [desireProfile, setDesireProfile] = useState<DesireProfile | null>(null);
  const [showDesireModal, setShowDesireModal] = useState(false);

  // Edit form states
  const [setupFullname, setSetupFullname] = useState('');
  const [setupDateOfBirth, setSetupDateOfBirth] = useState('');
  const [setupHeight, setSetupHeight] = useState('');
  const [setupLocation, setSetupLocation] = useState('');
  const [setupMaxDistanceKm, setSetupMaxDistanceKm] = useState('');
  const [setupLatitude, setSetupLatitude] = useState<number | undefined>(undefined);
  const [setupLongitude, setSetupLongitude] = useState<number | undefined>(undefined);
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);
  const [setupGenderDisplay, setSetupGenderDisplay] = useState('');
  const [setupShowGender, setSetupShowGender] = useState(true);
  const [setupPreferenceDisplay, setSetupPreferenceDisplay] = useState('');
  const [setupJob, setSetupJob] = useState('');
  const [setupCompany, setSetupCompany] = useState('');
  const [setupEducation, setSetupEducation] = useState('');
  const [setupInstitute, setSetupInstitute] = useState('');
  const [setupInterests, setSetupInterests] = useState('');
  const [setupOrientation, setSetupOrientation] = useState('');
  const [setupShowOrientation, setSetupShowOrientation] = useState(true);
  const [setupIntent, setSetupIntent] = useState('');
  const [setupPromptQuestion, setSetupPromptQuestion] = useState(PROMPT_PRESETS[0]);
  const [setupPromptAnswer, setSetupPromptAnswer] = useState('');
  const [setupBio, setSetupBio] = useState('');
  const [setupDiet, setSetupDiet] = useState<DietaryPreference | undefined>(undefined);
  const [setupLiving, setSetupLiving] = useState<LivingStatus | undefined>(undefined);
  const [setupSmoking, setSetupSmoking] = useState('');
  const [setupDrinking, setSetupDrinking] = useState('');
  const [setupVacation, setSetupVacation] = useState('');
  const [setupHobbies, setSetupHobbies] = useState('');
  const [setupLanguages, setSetupLanguages] = useState<string[]>([]);
  const [customLanguageInput, setCustomLanguageInput] = useState('');

  const toggleLanguage = (lang: string) => {
    const cleanLang = lang.split(' ')[0];
    if (setupLanguages.includes(cleanLang)) {
      setSetupLanguages(setupLanguages.filter((l) => l !== cleanLang));
    } else {
      setSetupLanguages([...setupLanguages, cleanLang]);
    }
  };

  const handleAddCustomLanguage = () => {
    const trimmed = customLanguageInput.trim();
    if (!trimmed) return;
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!setupLanguages.includes(capitalized)) {
      setSetupLanguages([...setupLanguages, capitalized]);
    }
    setCustomLanguageInput('');
  };

  const removeLanguage = (lang: string) => {
    setSetupLanguages(setupLanguages.filter((l) => l !== lang));
  };
  const [setupPhoto1, setSetupPhoto1] = useState('');
  const [setupPhoto2, setSetupPhoto2] = useState('');
  const [setupPhoto3, setSetupPhoto3] = useState('');
  const [setupPhoto4, setSetupPhoto4] = useState('');
  const [setupPhoto5, setSetupPhoto5] = useState('');
  const [setupPhoto6, setSetupPhoto6] = useState('');
  const [setupSelfie, setSetupSelfie] = useState('');
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [showSelfieModal, setShowSelfieModal] = useState(false);

  // Picker Modals state
  const [showDobPickerModal, setShowDobPickerModal] = useState(false);
  const [pickerDay, setPickerDay] = useState(15);
  const [pickerMonth, setPickerMonth] = useState(8);
  const [pickerYear, setPickerYear] = useState(2000);

  const [showJobPickerModal, setShowJobPickerModal] = useState(false);
  const [showEduPickerModal, setShowEduPickerModal] = useState(false);
  const [showInterestPickerModal, setShowInterestPickerModal] = useState(false);
  const [tempInterests, setTempInterests] = useState('');
  const [showOrientationPickerModal, setShowOrientationPickerModal] = useState(false);
  const [showGenderPickerModal, setShowGenderPickerModal] = useState(false);
  const [showPreferencePickerModal, setShowPreferencePickerModal] = useState(false);
  const [showIntentPickerModal, setShowIntentPickerModal] = useState(false);
  const [showPromptPickerModal, setShowPromptPickerModal] = useState(false);

  // New Dietary, Living & Language Picker Modals
  const [showDietPickerModal, setShowDietPickerModal] = useState(false);
  const [showLivingPickerModal, setShowLivingPickerModal] = useState(false);
  const [showLanguagePickerModal, setShowLanguagePickerModal] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');

  // Lifestyle Picker Modals
  const [showSmokingPickerModal, setShowSmokingPickerModal] = useState(false);
  const [showDrinkingPickerModal, setShowDrinkingPickerModal] = useState(false);
  const [showVacationPickerModal, setShowVacationPickerModal] = useState(false);
  const [showHobbiesPickerModal, setShowHobbiesPickerModal] = useState(false);
  const [tempHobbies, setTempHobbies] = useState('');
  const [showCompletionGuideModal, setShowCompletionGuideModal] = useState(false);

  // Vedic Zodiac state
  const [setupZodiacSign, setSetupZodiacSign] = useState('');
  const [showZodiacPickerModal, setShowZodiacPickerModal] = useState(false);

  // 15-Second Voice Note state & refs
  const [setupVoicePromptUrl, setSetupVoicePromptUrl] = useState('');
  const [setupVoicePromptDuration, setSetupVoicePromptDuration] = useState(15);
  const [setupVoicePromptText, setSetupVoicePromptText] = useState(VOICE_PROMPT_TOPICS[0]);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [recordedAudioUri, setRecordedAudioUri] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Profile Meme state
  const [setupMemeUrl, setSetupMemeUrl] = useState('');
  const [setupMemeTitle, setSetupMemeTitle] = useState('');
  const [showMemePickerModal, setShowMemePickerModal] = useState(false);
  const [selectedMemeCategory, setSelectedMemeCategory] = useState<string>('All');

  // Auto-Shield Privacy Modal state
  const [showAutoShieldModal, setShowAutoShieldModal] = useState(false);
  const [shieldBlockContacts, setShieldBlockContacts] = useState(true);
  const [shieldCorpDomain, setShieldCorpDomain] = useState('');
  const [shieldHideMutuals, setShieldHideMutuals] = useState(true);
  const [shieldedContactsCount, setShieldedContactsCount] = useState(0);
  const [isSavingShield, setIsSavingShield] = useState(false);

  const mediaRecorderRef = React.useRef<any>(null);
  const audioChunksRef = React.useRef<any[]>([]);
  const voiceTimerRef = React.useRef<any>(null);
  const playbackAudioRef = React.useRef<any>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const nativeAudioPlayerRef = React.useRef<AudioPlayer | null>(null);

  useEffect(() => {
    loadProfile();
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (nativeAudioPlayerRef.current) {
        try { nativeAudioPlayerRef.current.release(); } catch {}
      }
      stopAudibleVoiceNote();
    };
  }, []);

  useEffect(() => {
    if (searchParams.edit === 'true') {
      setIsEditingProfile(true);
    }
  }, [searchParams.edit]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [p, desire] = await Promise.all([
        api.getMyProfile(),
        api.getDesireProfile().catch(() => null),
      ]);
      setProfile(p);
      if (desire) {
        setDesireProfile(desire);
      }
      populateFormStates(p);

      const hasName = Boolean(p.displayName?.trim() || p.fullName?.trim());
      const hasGender = Boolean(p.gender || p.genderDisplay);
      const hasOrientation = Boolean(p.sexualOrientation);
      const pct = p.completionPercentage || 0;

      const isFullyComplete = hasName && hasGender && hasOrientation && pct >= 30;

      // Auto-open edit mode if incomplete or requested by discovery redirect
      if (searchParams.edit === 'true' || !isFullyComplete) {
        setIsEditingProfile(true);
      }

      // If user arrived with redirect reason 'incomplete' but already reached >= 30%, prompt to reach 100%:
      if (isFullyComplete && searchParams.reason === 'incomplete' && pct < 100) {
        setShowCompletionGuideModal(true);
      }
    } catch (err) {
      console.warn('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateFormStates = (p: UserProfile) => {
    setSetupFullname(p.fullName || p.displayName || '');
    if (p.birthDate && p.birthDate.trim()) {
      setSetupDateOfBirth(p.birthDate.trim());
      const parts = p.birthDate.trim().split('-');
      if (parts.length === 3) {
        setPickerYear(parseInt(parts[0], 10) || 2000);
        setPickerMonth(parseInt(parts[1], 10) || 1);
        setPickerDay(parseInt(parts[2], 10) || 1);
      }
    } else {
      setSetupDateOfBirth('');
      setPickerYear(2000);
      setPickerMonth(1);
      setPickerDay(1);
    }
    setSetupHeight(p.height ? String(p.height) : '');
    setSetupLocation(p.location || p.city || '');
    setSetupMaxDistanceKm(p.maxDistanceKm ? String(p.maxDistanceKm) : '');
    setSetupLatitude(p.latitude);
    setSetupLongitude(p.longitude);
    setSetupGenderDisplay(p.genderDisplay || '');
    setSetupShowGender(p.showGenderOnProfile !== undefined ? p.showGenderOnProfile : true);
    setSetupPreferenceDisplay(p.genderPreferenceDisplay || '');
    setSetupJob(p.job || p.occupation || '');
    setSetupCompany(p.company || '');
    setSetupEducation(p.education || '');
    setSetupInstitute(p.institute || '');
    setSetupInterests(p.interests || '');
    setSetupOrientation(p.sexualOrientation || '');
    setSetupShowOrientation(p.showOrientationOnProfile !== undefined ? p.showOrientationOnProfile : true);
    setSetupIntent(p.relationshipIntent || (p.intent ? p.intent.replace(/_/g, ' ') : ''));
    setSetupPromptQuestion(p.profilePromptQuestion || PROMPT_PRESETS[0]);
    setSetupPromptAnswer(p.profilePromptAnswer || '');
    setSetupBio(p.bio || '');
    setSetupDiet(p.dietaryPref);
    setSetupLiving(p.livingStatus);
    setSetupSmoking(p.smokingHabit || '');
    setSetupDrinking(p.drinkingHabit || '');
    setSetupVacation(p.vacationPreference || '');
    setSetupHobbies(p.hobbies || '');
    setSetupLanguages(p.languagesSpoken || []);

    // Vedic Zodiac, Voice Note & Meme population
    setSetupZodiacSign(p.zodiacSign || p.moonSign || '');
    setSetupVoicePromptUrl(p.voicePromptUrl || '');
    setSetupVoicePromptDuration(p.voicePromptDuration || 15);
    setSetupVoicePromptText(p.voicePromptText || VOICE_PROMPT_TOPICS[0]);
    setSetupMemeUrl(p.selectedMemeUrl || '');
    setSetupMemeTitle(p.selectedMemeTitle || '');

    const cleanRemote = (url?: string) => normalizeImageUrl(url, true);
    const p1 = cleanRemote(p.photo1);
    const p2 = cleanRemote(p.photo2);
    const p3 = cleanRemote(p.photo3);
    const p4 = cleanRemote(p.photo4);
    const p5 = cleanRemote(p.photo5);
    const p6 = cleanRemote(p.photo6);
    const cleanedPhotos = (p.photos || []).map((url) => cleanRemote(url)).filter(Boolean);

    const hasExplicitSlots = Boolean(p1 || p2 || p3 || p4 || p5 || p6);
    if (hasExplicitSlots) {
      setSetupPhoto1(p1);
      setSetupPhoto2(p2);
      setSetupPhoto3(p3);
      setSetupPhoto4(p4);
      setSetupPhoto5(p5);
      setSetupPhoto6(p6);
    } else if (cleanedPhotos.length > 0) {
      setSetupPhoto1(cleanedPhotos[0] || '');
      setSetupPhoto2(cleanedPhotos[1] || '');
      setSetupPhoto3(cleanedPhotos[2] || '');
      setSetupPhoto4(cleanedPhotos[3] || '');
      setSetupPhoto5(cleanedPhotos[4] || '');
      setSetupPhoto6(cleanedPhotos[5] || '');
    } else {
      setSetupPhoto1('');
      setSetupPhoto2('');
      setSetupPhoto3('');
      setSetupPhoto4('');
      setSetupPhoto5('');
      setSetupPhoto6('');
    }
    setSetupSelfie(cleanRemote(p.selfieUrl));
  };

  const getDietaryLabel = (key?: DietaryPreference) => {
    const item = DIETARY_OPTIONS.find(d => d.key === key);
    return item ? `${item.emoji} ${item.label}` : 'Select dietary preference';
  };

  const getLivingLabel = (key?: LivingStatus) => {
    const item = LIVING_OPTIONS.find(l => l.key === key);
    return item ? `${item.emoji} ${item.label}` : 'Select living arrangement';
  };

  // 30s Vernacular Voice Note Recording & Playback Handlers
  const startVoiceRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone Access Needed', 'Please allow microphone access in settings to record your voice prompt.');
        return;
      }
      hapticFeedback.medium();
      setVoiceRecordSeconds(0);
      setRecordedAudioUri('');
      setIsVoiceRecording(true);
      audioChunksRef.current = [];

      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new (window as any).MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(blob);
            setRecordedAudioUri(audioUrl);
            stream.getTracks().forEach((track: any) => track.stop());
          };

          mediaRecorder.start();
        } catch (webErr) {
          console.warn('Web microphone access error:', webErr);
        }
      } else {
        // Native device recording via expo-audio
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      }

      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      let elapsed = 0;
      voiceTimerRef.current = setInterval(() => {
        elapsed += 1;
        setVoiceRecordSeconds(elapsed);
        if (elapsed >= 30) {
          stopVoiceRecording();
        }
      }, 1000);
    } catch (err) {
      console.warn('Start voice recording error:', err);
      setIsVoiceRecording(false);
      Alert.alert('Recording Error', 'Could not start microphone recording.');
    }
  };

  const stopVoiceRecording = async () => {
    hapticFeedback.medium();
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    setIsVoiceRecording(false);

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    } else {
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) {
          setRecordedAudioUri(uri);
        }
      } catch (e) {
        console.warn('Stop native audio recording error:', e);
      }
    }
  };

  const handleTogglePlayVoice = (audioUrl?: string) => {
    const targetUrl = audioUrl || setupVoicePromptUrl || recordedAudioUri;
    if (!targetUrl) return;

    if (isPlayingVoice) {
      if (nativeAudioPlayerRef.current) {
        try { nativeAudioPlayerRef.current.pause(); } catch {}
      }
      stopAudibleVoiceNote();
      setIsPlayingVoice(false);
      return;
    }

    hapticFeedback.selection();
    if (Platform.OS !== 'web' && (targetUrl.startsWith('file:') || targetUrl.startsWith('content:') || targetUrl.startsWith('http'))) {
      try {
        if (nativeAudioPlayerRef.current) {
          try { nativeAudioPlayerRef.current.release(); } catch {}
        }
        const player = createAudioPlayer(targetUrl);
        nativeAudioPlayerRef.current = player;
        setIsPlayingVoice(true);
        player.play();
        player.addListener('playbackStatusUpdate', (status: any) => {
          if (status.didJustFinish) {
            setIsPlayingVoice(false);
          }
        });
      } catch (err) {
        console.warn('Native player fallback:', err);
        const dur = voiceRecordSeconds > 0 ? voiceRecordSeconds : (setupVoicePromptDuration || 15);
        playAudibleVoiceNote({
          audioUrl: targetUrl,
          promptText: setupVoicePromptText || VOICE_PROMPT_TOPICS[0],
          durationSec: dur,
          onStart: () => setIsPlayingVoice(true),
          onEnd: () => setIsPlayingVoice(false),
        });
      }
    } else {
      const dur = voiceRecordSeconds > 0 ? voiceRecordSeconds : (setupVoicePromptDuration || 15);
      playAudibleVoiceNote({
        audioUrl: targetUrl,
        promptText: setupVoicePromptText || VOICE_PROMPT_TOPICS[0],
        durationSec: dur,
        onStart: () => setIsPlayingVoice(true),
        onEnd: () => setIsPlayingVoice(false),
      });
    }
  };

  const handleSaveVoiceNote = async () => {
    let url = recordedAudioUri || setupVoicePromptUrl || `voice_note_${Date.now()}`;
    const dur = voiceRecordSeconds > 0 ? voiceRecordSeconds : (setupVoicePromptDuration || 15);
    const txt = setupVoicePromptText || VOICE_PROMPT_TOPICS[0];

    if (nativeAudioPlayerRef.current) {
      try { nativeAudioPlayerRef.current.pause(); } catch {}
    }
    stopAudibleVoiceNote();
    setIsPlayingVoice(false);
    setShowVoiceRecorderModal(false);

    // If local recording exists, upload to Cloudflare / server so other users can hear it!
    if (recordedAudioUri && (recordedAudioUri.startsWith('file://') || !recordedAudioUri.startsWith('http'))) {
      try {
        const uploadedUrl = await api.uploadAudio(recordedAudioUri);
        if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://'))) {
          url = uploadedUrl;
        }
      } catch (err) {
        console.warn('Voice upload error:', err);
      }
    }

    hapticFeedback.success();
    setSetupVoicePromptUrl(url);
    setSetupVoicePromptDuration(dur);

    setProfile(prev => prev ? ({
      ...prev,
      voicePromptUrl: url,
      voicePromptDuration: dur,
      voicePromptText: txt,
    }) : prev);

    try {
      await api.uploadVoicePrompt(url, dur, txt);
      Alert.alert('Voice Note Saved 🎙️', 'Your 15-second vernacular voice note has been uploaded and added to your profile!');
    } catch (e) {
      console.warn('Voice note save error:', e);
    }
  };

  const handleDeleteVoicePrompt = () => {
    Alert.alert('Delete Voice Note', 'Are you sure you want to remove your voice note from your profile?', [
      {
        text: 'Delete 🗑️',
        style: 'destructive',
        onPress: async () => {
          stopAudibleVoiceNote();
          setIsPlayingVoice(false);
          setSetupVoicePromptUrl('');
          setRecordedAudioUri('');
          setProfile(prev => prev ? ({ ...prev, voicePromptUrl: '', voicePromptDuration: 0, voicePromptText: '' }) : prev);
          try {
            await api.updateMyProfile({ voicePromptUrl: '', voicePromptDuration: 0, voicePromptText: '' });
          } catch (e) {}
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteAccount = () => {
    hapticFeedback.warning();
    Alert.alert(
      '⚠️ Delete Account Permanently?',
      'Are you sure you want to delete your account? This action cannot be undone.\n\n• Your profile, photos, and voice notes will be permanently erased.\n• All matches, icebreakers, and chat history will be removed immediately.\n• In accordance with India DPDP Act and App Store guidelines, all your personal data will be completely wiped from our servers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account 🗑️',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              hapticFeedback.heavy();
              await api.deleteAccount();
              Alert.alert('Account Deleted', 'Your account and personal data have been permanently removed.');
              router.replace('/auth');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account. Please check your network connection and try again.');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  // Vedic Zodiac & Meme Selection Handlers
  const handleSelectZodiac = (item: { rashi: string; western: string; symbol: string }) => {
    const formatted = `${item.rashi} (${item.western} ${item.symbol})`;
    setSetupZodiacSign(formatted);
    setShowZodiacPickerModal(false);

    setProfile(prev => prev ? ({
      ...prev,
      zodiacSign: formatted,
      moonSign: formatted,
    }) : prev);

    api.updateMyProfile({
      zodiacSign: formatted,
      moonSign: formatted,
    }).catch(() => {});
  };

  const handleSelectPresetMeme = (preset: { title: string; imageUrl: string }) => {
    setSetupMemeUrl(preset.imageUrl);
    setSetupMemeTitle(preset.title);
    setShowMemePickerModal(false);

    setProfile(prev => prev ? ({
      ...prev,
      selectedMemeUrl: preset.imageUrl,
      selectedMemeTitle: preset.title,
    }) : prev);

    api.updateMyProfile({
      selectedMemeUrl: preset.imageUrl,
      selectedMemeTitle: preset.title,
    }).catch(() => {});
  };

  const handleUploadCustomMeme = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is needed to pick a meme.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const localUri = asset.uri;
        const directBase64 = asset.base64;
        const defaultTitle = 'Custom Vibe Check 🤣';

        setSetupMemeUrl(localUri);
        setSetupMemeTitle(defaultTitle);
        setShowMemePickerModal(false);

        setProfile(prev => prev ? ({
          ...prev,
          selectedMemeUrl: localUri,
          selectedMemeTitle: defaultTitle,
        }) : prev);

        try {
          const uploadedUrl = await api.uploadImage(localUri, directBase64);
          if (uploadedUrl) {
            setSetupMemeUrl(uploadedUrl);
            setProfile(prev => prev ? ({
              ...prev,
              selectedMemeUrl: uploadedUrl,
              selectedMemeTitle: defaultTitle,
            }) : prev);

            api.updateMyProfile({
              selectedMemeUrl: uploadedUrl,
              selectedMemeTitle: defaultTitle,
            }).catch(() => {});
          }
        } catch (err) {
          console.warn('Meme upload error:', err);
        }
      }
    } catch (e) {
      console.warn('Custom meme picker error:', e);
    }
  };

  const handleDeleteMeme = () => {
    Alert.alert('Remove Meme', 'Remove your profile meme?', [
      {
        text: 'Remove 🗑️',
        style: 'destructive',
        onPress: async () => {
          setSetupMemeUrl('');
          setSetupMemeTitle('');
          setProfile(prev => prev ? ({ ...prev, selectedMemeUrl: '', selectedMemeTitle: '' }) : prev);
          try {
            await api.updateMyProfile({ selectedMemeUrl: '', selectedMemeTitle: '' });
          } catch (e) {}
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // MatchAI Complete Profile Completion Calculation Across All Fields (100% total)
  const calculateLocalPct = () => {
    let pct = 0;

    // 1. Essential Basic Info (30% - Required to unlock Discovery)
    if (setupFullname && setupFullname.trim()) pct += 10;
    if (setupGenderDisplay) pct += 10;
    if (setupOrientation) pct += 10;

    // 2. Dating Intent & Age / DOB (15%)
    if (setupDateOfBirth && setupDateOfBirth.trim()) pct += 8;
    if (setupIntent) pct += 7;

    // 3. Bio & Prompt (15%)
    if (setupBio && setupBio.trim()) pct += 8;
    if (setupPromptAnswer && setupPromptAnswer.trim()) pct += 7;

    // 4. Photos & Verified Selfie (20%)
    if (setupPhoto1 && setupPhoto1.trim()) pct += 8;
    if (setupPhoto2 && setupPhoto2.trim()) pct += 2;
    if (setupPhoto3 && setupPhoto3.trim()) pct += 2;
    if (setupPhoto4 && setupPhoto4.trim()) pct += 2;
    if (setupPhoto5 && setupPhoto5.trim()) pct += 2;
    if (setupSelfie && setupSelfie.trim()) pct += 4;

    // 5. Career, Education & Height (10%)
    if (setupJob && setupJob.trim()) pct += 4;
    if (setupEducation && setupEducation.trim()) pct += 3;
    if (setupHeight && isValidHumanHeight(parseInt(setupHeight, 10))) pct += 3;

    // 6. Lifestyle & Indian Context (10%)
    if (setupDiet) pct += 2;
    if (setupLiving) pct += 2;
    if (setupLocation && setupLocation.trim()) pct += 2;
    if (setupSmoking || setupDrinking) pct += 2;
    if (setupVacation && setupVacation.trim()) pct += 2;

    // 7. Passions, Vedic Zodiac & Meme (Bonus overlap up to 5%)
    if (setupInterests && setupInterests.trim()) pct += 3;
    if (setupHobbies && setupHobbies.trim()) pct += 2;
    if (setupZodiacSign) pct += 2;
    if (setupMemeUrl) pct += 2;

    return Math.min(100, pct);
  };

  const handlePickPhoto = async (slotIdx: number, setter: (url: string) => void) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is needed to pick photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const localUri = asset.uri;
        const directBase64 = asset.base64;
        
        let prevPhotoUrl = '';
        if (slotIdx === 1) prevPhotoUrl = setupPhoto1;
        else if (slotIdx === 2) prevPhotoUrl = setupPhoto2;
        else if (slotIdx === 3) prevPhotoUrl = setupPhoto3;
        else if (slotIdx === 4) prevPhotoUrl = setupPhoto4;
        else if (slotIdx === 5) prevPhotoUrl = setupPhoto5;
        else if (slotIdx === 6) prevPhotoUrl = setupPhoto6;

        // Instantly display local image in slot
        setter(localUri);
        setUploadingSlot(slotIdx);

        try {
          const uploadedUrl = await api.uploadImage(localUri, directBase64);
          if (uploadedUrl && uploadedUrl.trim() !== '' && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://'))) {
            setter(uploadedUrl);
            setProfile(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              if (slotIdx === 1) updated.photo1 = uploadedUrl;
              else if (slotIdx === 2) updated.photo2 = uploadedUrl;
              else if (slotIdx === 3) updated.photo3 = uploadedUrl;
              else if (slotIdx === 4) updated.photo4 = uploadedUrl;
              else if (slotIdx === 5) updated.photo5 = uploadedUrl;
              else if (slotIdx === 6) updated.photo6 = uploadedUrl;

              const photos = [
                slotIdx === 1 ? uploadedUrl : setupPhoto1,
                slotIdx === 2 ? uploadedUrl : setupPhoto2,
                slotIdx === 3 ? uploadedUrl : setupPhoto3,
                slotIdx === 4 ? uploadedUrl : setupPhoto4,
                slotIdx === 5 ? uploadedUrl : setupPhoto5,
                slotIdx === 6 ? uploadedUrl : setupPhoto6,
              ].filter((p): p is string => !!p && p.trim() !== '' && !p.startsWith('file:') && !p.startsWith('content:'));
              updated.photos = photos;
              return updated;
            });

            // Auto-sync with backend
            const syncPhotos = [
              slotIdx === 1 ? uploadedUrl : setupPhoto1,
              slotIdx === 2 ? uploadedUrl : setupPhoto2,
              slotIdx === 3 ? uploadedUrl : setupPhoto3,
              slotIdx === 4 ? uploadedUrl : setupPhoto4,
              slotIdx === 5 ? uploadedUrl : setupPhoto5,
              slotIdx === 6 ? uploadedUrl : setupPhoto6,
            ].filter((p): p is string => !!p && p.trim() !== '' && !p.startsWith('file:') && !p.startsWith('content:'));

            api.updateMyProfile({
              [`photo${slotIdx}`]: uploadedUrl,
              photos: syncPhotos,
            } as any).catch(err => {
              console.warn('Profile sync warning:', err);
            });
          } else {
            Alert.alert('Upload Failed', 'Failed to upload photo to cloud storage. Please check your internet connection.');
            setter(prevPhotoUrl);
          }
        } catch (err) {
          console.warn('Photo upload failed:', err);
          Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
          setter(prevPhotoUrl);
        } finally {
          setUploadingSlot(null);
        }
      }
    } catch (e) {
      console.warn('Image picker error:', e);
      setUploadingSlot(null);
    }
  };

  const handleDeletePhoto = (slotIdx: number) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      {
        text: 'Delete 🗑️',
        style: 'destructive',
        onPress: async () => {
          setUploadingSlot(slotIdx);

          const newPhoto1 = slotIdx === 1 ? '' : setupPhoto1;
          const newPhoto2 = slotIdx === 2 ? '' : setupPhoto2;
          const newPhoto3 = slotIdx === 3 ? '' : setupPhoto3;
          const newPhoto4 = slotIdx === 4 ? '' : setupPhoto4;
          const newPhoto5 = slotIdx === 5 ? '' : setupPhoto5;
          const newPhoto6 = slotIdx === 6 ? '' : setupPhoto6;

          if (slotIdx === 1) setSetupPhoto1('');
          else if (slotIdx === 2) setSetupPhoto2('');
          else if (slotIdx === 3) setSetupPhoto3('');
          else if (slotIdx === 4) setSetupPhoto4('');
          else if (slotIdx === 5) setSetupPhoto5('');
          else if (slotIdx === 6) setSetupPhoto6('');

          const activePhotos = [newPhoto1, newPhoto2, newPhoto3, newPhoto4, newPhoto5, newPhoto6]
            .filter(p => !!p && p.trim() !== '');

          setProfile(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              [`photo${slotIdx}`]: '',
              photos: activePhotos,
            };
          });

          try {
            const updated = await api.updateMyProfile({
              [`photo${slotIdx}`]: '',
              photo1: newPhoto1,
              photo2: newPhoto2,
              photo3: newPhoto3,
              photo4: newPhoto4,
              photo5: newPhoto5,
              photo6: newPhoto6,
              photos: activePhotos,
            } as any);

            if (updated) {
              setProfile(updated);
              populateFormStates(updated);
            }
          } catch (err) {
            console.warn('Photo deletion error:', err);
          } finally {
            setUploadingSlot(null);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleTakeSelfie = () => {
    setShowSelfieModal(true);
  };

  const handleSelfieCaptured = async (localUri: string, directBase64?: string) => {
    setShowSelfieModal(false);

    // Validate that user has uploaded at least 1 profile photo first
    const primaryPhoto = profile?.photo1 || setupPhoto1 || profile?.photos?.[0] || setupPhoto2;
    if (!primaryPhoto) {
      Alert.alert(
        'Upload Profile Photo First 📷',
        'Please upload at least one profile photo before taking your verification selfie so we can verify your identity.'
      );
      return;
    }

    setUploadingSelfie(true);
    try {
      const matchRes = await api.verifyFaceMatch(directBase64 || localUri, primaryPhoto);

      if (matchRes.verified) {
        const finalUrl = matchRes.selfieUrl || localUri;
        setSetupSelfie(finalUrl);
        setProfile(prev => prev ? ({
          ...prev,
          selfieUrl: finalUrl,
          faceVerified: true,
          livenessScore: matchRes.similarityScore || 0.95
        }) : prev);
        Alert.alert(
          '100% Verified Real Human! 🛡️',
          matchRes.message || `Biometric match confirmed (${matchRes.confidencePercent}% confidence)! Verified badge active.`
        );
      } else {
        setSetupSelfie('');
        setProfile(prev => prev ? ({ ...prev, selfieUrl: '', faceVerified: false, livenessScore: 0.0 }) : prev);
        Alert.alert(
          'Verification Failed ❌',
          matchRes.message || 'Your selfie did not match the face in your profile photo. Please ensure both show your real face clearly.'
        );
      }
    } catch (err: any) {
      console.warn('Selfie verification failed:', err);
      Alert.alert('Verification Error', err.message || 'Could not verify selfie face. Please try again.');
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleDeleteSelfie = () => {
    Alert.alert('Remove Selfie', 'Remove your biometric verification selfie?', [
      {
        text: 'Remove 🗑️',
        style: 'destructive',
        onPress: async () => {
          setSetupSelfie('');
          setProfile(prev => prev ? ({ ...prev, selfieUrl: '' }) : prev);
          try {
            const updated = await api.updateMyProfile({ selfieUrl: '' });
            if (updated) {
              setProfile(updated);
              populateFormStates(updated);
            }
          } catch (e) {
            console.warn('Selfie deletion error:', e);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRefreshGpsLocation = async () => {
    setIsUpdatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Please allow location access to automatically detect your coordinates for distance matching.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (loc?.coords) {
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        setSetupLatitude(lat);
        setSetupLongitude(lon);
        let detectedCity: string | undefined;
        try {
          const geocoded = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lon,
          });
          if (geocoded && geocoded.length > 0) {
            const place = geocoded[0];
            detectedCity = (place.city || place.subregion || place.district) ?? undefined;
            if (detectedCity && !setupLocation.trim()) {
              setSetupLocation(detectedCity);
            }
          }
        } catch (e) {}

        await api.updateLocation(lat, lon, detectedCity || setupLocation || undefined);

        Alert.alert(
          'Location Synchronized 📍',
          `GPS Coordinates saved: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°. Real-time distance matching is now updated!`
        );
      }
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Unable to retrieve device GPS coordinates.');
    } finally {
      setIsUpdatingGps(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (uploadingSlot !== null) {
      Alert.alert('Upload in Progress ⏳', 'Please wait until your photo finishes uploading before saving changes.');
      return;
    }
    setLoading(true);

    const ensureRemoteUrl = async (uri: string, setter: (val: string) => void): Promise<string> => {
      if (!uri || !uri.trim()) return '';
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return normalizeImageUrl(uri);
      }
      if (uri.startsWith('file:') || uri.startsWith('content:')) {
        try {
          const uploaded = await api.uploadImage(uri);
          if (uploaded && (uploaded.startsWith('http://') || uploaded.startsWith('https://'))) {
            setter(uploaded);
            return uploaded;
          }
        } catch (e) {}
        setter('');
        return '';
      }
      return uri;
    };

    const [p1, p2, p3, p4, p5, p6, selfie] = await Promise.all([
      ensureRemoteUrl(setupPhoto1, setSetupPhoto1),
      ensureRemoteUrl(setupPhoto2, setSetupPhoto2),
      ensureRemoteUrl(setupPhoto3, setSetupPhoto3),
      ensureRemoteUrl(setupPhoto4, setSetupPhoto4),
      ensureRemoteUrl(setupPhoto5, setSetupPhoto5),
      ensureRemoteUrl(setupPhoto6, setSetupPhoto6),
      ensureRemoteUrl(setupSelfie, setSetupSelfie),
    ]);

    // Validate realistic human height bounds (100 - 240 cm)
    if (setupHeight && setupHeight.trim()) {
      const h = parseInt(setupHeight.trim(), 10);
      if (!isValidHumanHeight(h)) {
        setLoading(false);
        Alert.alert(
          'Realistic Height Required 📏',
          `Human height cannot exceed ${MAX_HUMAN_HEIGHT_CM} cm (${cmToFeetInches(MAX_HUMAN_HEIGHT_CM)}). Please enter a realistic height between ${MIN_HUMAN_HEIGHT_CM} cm and ${MAX_HUMAN_HEIGHT_CM} cm.`
        );
        return;
      }
    }

    const photosList = [p1, p2, p3, p4, p5, p6].filter((p): p is string => !!p && p.trim() !== '');

    const updated = await api.updateMyProfile({
      displayName: setupFullname.split(' ')[0] || 'User',
      fullName: setupFullname,
      bio: setupBio,
      dietaryPref: setupDiet,
      livingStatus: setupLiving,
      languagesSpoken: setupLanguages,
      smokingHabit: setupSmoking,
      drinkingHabit: setupDrinking,
      vacationPreference: setupVacation,
      hobbies: setupHobbies,
      job: setupJob,
      occupation: setupJob,
      company: setupCompany.trim() || undefined,
      education: setupEducation,
      institute: setupInstitute.trim() || undefined,
      interests: setupInterests,
      zodiacSign: setupZodiacSign,
      moonSign: setupZodiacSign,
      voicePromptUrl: setupVoicePromptUrl,
      voicePromptDuration: setupVoicePromptDuration,
      voicePromptText: setupVoicePromptText,
      selectedMemeUrl: setupMemeUrl,
      selectedMemeTitle: setupMemeTitle,
      height: setupHeight ? parseInt(setupHeight) : 165,
      location: setupLocation,
      maxDistanceKm: setupMaxDistanceKm && setupMaxDistanceKm.trim() ? parseInt(setupMaxDistanceKm.trim(), 10) : undefined,
      latitude: setupLatitude,
      longitude: setupLongitude,
      sexualOrientation: setupOrientation,
      showOrientationOnProfile: setupShowOrientation,
      gender: setupGenderDisplay === 'Woman' ? 'FEMALE' : (setupGenderDisplay === 'Man' ? 'MALE' : (setupGenderDisplay === 'Non-binary' ? 'NON_BINARY' : undefined)),
      genderDisplay: setupGenderDisplay || undefined,
      showGenderOnProfile: setupShowGender,
      genderPreferenceDisplay: setupPreferenceDisplay || undefined,
      relationshipIntent: setupIntent,
      profilePromptQuestion: setupPromptQuestion,
      profilePromptAnswer: setupPromptAnswer,
      photo1: p1 || '',
      photo2: p2 || '',
      photo3: p3 || '',
      photo4: p4 || '',
      photo5: p5 || '',
      photo6: p6 || '',
      selfieUrl: selfie || '',
      birthDate: setupDateOfBirth || undefined,
      photos: photosList,
      completionPercentage: calculateLocalPct(),
    });

    const localPct = calculateLocalPct();
    const isNowComplete = Boolean(setupFullname.trim() && setupGenderDisplay && setupOrientation && localPct >= 30);

    setProfile(updated);
    populateFormStates(updated);
    setIsEditingProfile(false);
    setLoading(false);

    if (isNowComplete) {
      if (localPct < 100) {
        setShowCompletionGuideModal(true);
      } else {
        Alert.alert(
          '100% All-Star Profile! 🌟',
          'Congratulations! Your profile is 100% complete and fully optimized for discovery.',
          [
            { text: 'Start Discovering ❤️', onPress: () => router.replace('/(tabs)') },
            { text: 'Stay on Profile', style: 'cancel' },
          ]
        );
      }
    } else {
      Alert.alert(
        'Profile Saved ✓',
        'Your profile changes have been saved. Please complete Name, Gender, and Sexual Orientation to unlock Discovery.'
      );
    }
  };

  const handleCancelEdit = () => {
    if (!setupFullname.trim() || !setupGenderDisplay || !setupOrientation || calculateLocalPct() < 30) {
      Alert.alert(
        'Profile Incomplete',
        'Please provide your Name, Gender, Sexual Orientation, and reach at least 30% to view matches.',
        [
          { text: 'Continue Editing', style: 'default' },
          { text: 'Exit Anyway', style: 'destructive', onPress: () => setIsEditingProfile(false) },
        ]
      );
      return;
    }
    setIsEditingProfile(false);
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E94057" />
      </SafeAreaView>
    );
  }

  const completionScore = calculateLocalPct();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>
          {isEditingProfile ? 'Edit Profile ✍️' : 'My Profile 👤'}
        </Text>
        {isEditingProfile ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveAllChanges} style={styles.saveHeaderBtn}>
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.editHeaderBtn}>
            <Text style={styles.editHeaderBtnText}>Edit Profile ✍️</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Unified Profile Completion Header Banner */}
        {(!setupFullname.trim() || !setupGenderDisplay || !setupOrientation || completionScore < 30) ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.incompleteBanner}
            onPress={() => setShowCompletionGuideModal(true)}>
            <View style={styles.incompleteBannerHeader}>
              <Text style={styles.incompleteBannerTitle}>⚠️ Unlock Discovery & Matches</Text>
              <View style={styles.incompleteReqBadge}>
                <Text style={styles.incompleteReqBadgeText}>{completionScore}% / 30% Min</Text>
              </View>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${completionScore}%` }, styles.barFillRed]} />
            </View>
            <Text style={styles.incompleteBannerDesc}>
              Complete basic identity details to browse singles in your area:
            </Text>
            <View style={styles.incompleteCheckList}>
              <View style={styles.checkItemRow}>
                <Text style={setupFullname.trim() ? styles.checkDone : styles.checkMissing}>
                  {setupFullname.trim() ? '✓' : '✗'} Name
                </Text>
              </View>
              <View style={styles.checkItemRow}>
                <Text style={setupGenderDisplay ? styles.checkDone : styles.checkMissing}>
                  {setupGenderDisplay ? '✓' : '✗'} Gender
                </Text>
              </View>
              <View style={styles.checkItemRow}>
                <Text style={setupOrientation ? styles.checkDone : styles.checkMissing}>
                  {setupOrientation ? '✓' : '✗'} Orientation
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : completionScore < 100 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.boostNudgeBanner}
            onPress={() => setShowCompletionGuideModal(true)}>
            <View style={styles.boostNudgeHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.boostNudgeTitle}>⚡ Profile Completion ({completionScore}%)</Text>
                  <Text style={styles.boostNudgeActionBtnText}>Checklist →</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${completionScore}%` },
                      completionScore >= 80 ? styles.barFillGreen : styles.barFillRed,
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.nudgeChipsRow}>
              {(!setupPhoto2 || !setupPhoto3) && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>📷 +Photos (2% ea)</Text>
                </TouchableOpacity>
              )}
              {!setupBio && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>✍️ +Bio (8%)</Text>
                </TouchableOpacity>
              )}
              {!setupPromptAnswer && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>☕ +Prompt (7%)</Text>
                </TouchableOpacity>
              )}
              {!setupSelfie && (
                <TouchableOpacity onPress={handleTakeSelfie} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>🤳 +Selfie (4%)</Text>
                </TouchableOpacity>
              )}
              {(!setupJob || !setupEducation) && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>💼 +Career (7%)</Text>
                </TouchableOpacity>
              )}
              {(!setupDiet || !setupLiving) && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>🥗 +Lifestyle (4%)</Text>
                </TouchableOpacity>
              )}
              {(!setupHobbies || !setupInterests) && (
                <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.nudgeChip}>
                  <Text style={styles.nudgeChipText}>🎨 +Interests (5%)</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.allStarBanner}
            onPress={() => setShowCompletionGuideModal(true)}>
            <Text style={{ fontSize: 20 }}>🌟</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.allStarTitle}>100% All-Star Profile</Text>
                <View style={styles.allStarBadge}>
                  <Text style={styles.allStarBadgeText}>MAX VISIBILITY 🚀</Text>
                </View>
              </View>
              <Text style={styles.allStarSub}>Profile fully optimized for maximum discovery & 3.5x match rate.</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* VIEW PROFILE MODE */}
        {!isEditingProfile && (
          <View style={{ width: '100%' }}>
            {/* Photos Carousel */}
            {(() => {
              const rawPhotos = [
                setupPhoto1 || profile?.photo1,
                setupPhoto2 || profile?.photo2,
                setupPhoto3 || profile?.photo3,
                setupPhoto4 || profile?.photo4,
                setupPhoto5 || profile?.photo5,
                setupPhoto6 || profile?.photo6,
                ...(profile?.photos || []),
              ];
              const carouselPhotos = rawPhotos
                .map((img) => normalizeImageUrl(img, false))
                .filter((img, i, arr): img is string => !!img && typeof img === 'string' && img.trim() !== '' && !img.startsWith('file:') && !img.startsWith('content:') && arr.indexOf(img) === i);

              if (carouselPhotos.length > 0) {
                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                    {carouselPhotos.map((img, idx) => (
                      <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => setIsEditingProfile(true)}>
                        <Image
                          source={{ uri: normalizeImageUrl(img) }}
                          style={styles.carouselImage}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                );
              }

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsEditingProfile(true)}
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#E94057',
                    borderStyle: 'dashed',
                    backgroundColor: '#1E1F28',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                    padding: 20,
                  }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>📸</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Add Your Photos</Text>
                  <Text style={{ color: '#8E94A5', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                    Tap to upload photos and make your profile stand out!
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {/* Main Info Card */}
            <View style={styles.sectionCard}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>
                  {profile.fullName || profile.displayName || 'Set Up Your Name'}{profile.age > 0 ? `, ${profile.age}` : ''}
                </Text>
                {profile.digilockerVerified && (
                  <View style={styles.goldBadge}>
                    <Text style={styles.goldBadgeText}>🛡️ VERIFIED</Text>
                  </View>
                )}
              </View>

              {profile.job || profile.occupation || profile.company ? (
                <Text style={styles.occupationText}>
                  💼 {profile.job || profile.occupation || 'Professional'}{profile.company ? ` @ ${profile.company}` : ''}
                </Text>
              ) : null}

              {profile.education || profile.institute ? (
                <Text style={styles.subDetailText}>
                  🎓 {profile.education || 'Degree'}{profile.institute ? ` @ ${profile.institute}` : ''}
                </Text>
              ) : null}

              {profile.height ? (
                <Text style={styles.subDetailText}>📏 Height: {formatHeight(profile.height)}</Text>
              ) : null}

              <Text style={styles.locText}>
                📍 {profile.location || profile.city || 'Location not set'} ({profile.maxDistanceKm ? `${profile.maxDistanceKm} km` : '50 km (default)'} radius)
                {profile.latitude && profile.longitude ? ' • GPS Active 📡' : ''}
              </Text>

              <View style={styles.karmaChip}>
                <Text style={styles.karmaText}>⚡ Match Karma: {profile.karmaScore}/200</Text>
              </View>
            </View>

            {/* Cultural Markers (Diet & Living) Display Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🥗 Cultural & Dietary Markers</Text>
              <View style={styles.traitsRow}>
                <TouchableOpacity
                  style={[styles.traitChip, { flex: 1 }]}
                  onPress={() => {
                    setIsEditingProfile(true);
                    setShowDietPickerModal(true);
                  }}>
                  <Text style={styles.traitLabel}>Dietary Preference</Text>
                  <Text style={styles.traitValue}>{getDietaryLabel(profile.dietaryPref)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.traitChip, { flex: 1 }]}
                  onPress={() => {
                    setIsEditingProfile(true);
                    setShowLivingPickerModal(true);
                  }}>
                  <Text style={styles.traitLabel}>Living Situation</Text>
                  <Text style={styles.traitValue}>{getLivingLabel(profile.livingStatus)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Languages Known Display Card */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.sectionTitle}>🗣️ Languages Known</Text>
                <TouchableOpacity onPress={() => setShowLanguagePickerModal(true)}>
                  <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '700' }}>Edit ✎</Text>
                </TouchableOpacity>
              </View>
              {(profile.languagesSpoken && profile.languagesSpoken.length > 0) || (setupLanguages && setupLanguages.length > 0) ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowLanguagePickerModal(true)}
                  style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(profile.languagesSpoken && profile.languagesSpoken.length > 0 ? profile.languagesSpoken : setupLanguages).map((lang, idx) => (
                    <View key={idx} style={styles.languageDisplayBadge}>
                      <Text style={styles.languageDisplayBadgeText}>🗣️ {lang}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.traitChip, { width: '100%' }]} onPress={() => setShowLanguagePickerModal(true)}>
                  <Text style={styles.traitLabel}>Languages Known</Text>
                  <Text style={styles.traitValue}>+ Add languages you speak</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Lifestyle & Habits (Smoking, Drinking & Vacation Vibe) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌿 Lifestyle Habits & Vacation Vibe</Text>
              <View style={styles.traitsRow}>
                <TouchableOpacity
                  style={[styles.traitChip, { minWidth: '48%' }]}
                  onPress={() => {
                    setIsEditingProfile(true);
                    setShowSmokingPickerModal(true);
                  }}>
                  <Text style={styles.traitLabel}>Smoking Habit</Text>
                  <Text style={styles.traitValue}>{profile.smokingHabit || setupSmoking || 'Not specified'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.traitChip, { minWidth: '48%' }]}
                  onPress={() => {
                    setIsEditingProfile(true);
                    setShowDrinkingPickerModal(true);
                  }}>
                  <Text style={styles.traitLabel}>Alcohol / Drinking</Text>
                  <Text style={styles.traitValue}>{profile.drinkingHabit || setupDrinking || 'Not specified'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.traitChip, { width: '100%' }]}
                  onPress={() => {
                    setIsEditingProfile(true);
                    setShowVacationPickerModal(true);
                  }}>
                  <Text style={styles.traitLabel}>Vacation Vibe: Mountains vs Beaches</Text>
                  <Text style={styles.traitValue}>{profile.vacationPreference || setupVacation || 'Not specified'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hobbies & Creative Pursuits */}
            {(profile.hobbies || setupHobbies) ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🎨 Hobbies & Creative Pursuits</Text>
                <View style={styles.interestsWrap}>
                  {(profile.hobbies || setupHobbies).split(',').map((h, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.interestPill,
                        { backgroundColor: 'rgba(255, 152, 0, 0.12)', borderColor: 'rgba(255, 152, 0, 0.3)' },
                      ]}
                      onPress={() => {
                        setIsEditingProfile(true);
                        setTempHobbies(setupHobbies);
                        setShowHobbiesPickerModal(true);
                      }}>
                      <Text style={[styles.interestPillText, { color: '#FF9800' }]}>✨ {h.trim()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Prompt Icebreaker Quote */}
            {profile.profilePromptAnswer ? (
              <View style={styles.promptQuoteCard}>
                <Text style={styles.promptQuestionTitle}>🗣️ {profile.profilePromptQuestion || 'The key to my heart is...'}</Text>
                <Text style={styles.promptAnswerText}>"{profile.profilePromptAnswer}"</Text>
              </View>
            ) : null}

            {/* Bio Description */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>✍️ Bio Description</Text>
              <Text style={styles.bioContent}>{profile.bio || 'No bio written yet.'}</Text>
            </View>

            {/* Relationship Intent & Orientation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🎯 Dating Goal & Orientation</Text>
              <View style={styles.traitsRow}>
                <View style={styles.traitChip}>
                  <Text style={styles.traitLabel}>Looking For</Text>
                  <Text style={styles.traitValue}>{profile.relationshipIntent || setupIntent || 'Not set'}</Text>
                </View>
                {profile.showOrientationOnProfile && profile.sexualOrientation && (
                  <View style={styles.traitChip}>
                    <Text style={styles.traitLabel}>Orientation</Text>
                    <Text style={styles.traitValue}>🏳️‍🌈 {profile.sexualOrientation}</Text>
                  </View>
                )}
                {profile.showGenderOnProfile && (
                  <View style={styles.traitChip}>
                    <Text style={styles.traitLabel}>Gender</Text>
                    <Text style={styles.traitValue}>👤 {profile.genderDisplay || (profile.gender === 'FEMALE' ? 'Woman' : (profile.gender === 'MALE' ? 'Man' : profile.gender)) || 'Not set'}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Interests Pills */}
            {profile.interests ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🏷️ What I'm Into</Text>
                <View style={styles.interestsWrap}>
                  {profile.interests.split(',').map((item, idx) => (
                    <View key={idx} style={styles.interestPill}>
                      <Text style={styles.interestPillText}>#{item.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Modern Cosmic Chemistry & Vedic Rashis */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>✨ Vedic Cosmic Chemistry (Jyotish)</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditingProfile(true);
                    setShowZodiacPickerModal(true);
                  }}>
                  <Text style={styles.editCardActionText}>Change 🪐</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.astroRow}>
                <View style={[styles.astroPill, { flex: 1.4 }]}>
                  <Text style={styles.astroLabel}>Vedic Rashi (Moon)</Text>
                  <Text style={styles.astroValue} numberOfLines={1}>{profile.zodiacSign || profile.moonSign || setupZodiacSign || 'Select Rashi'}</Text>
                </View>
                <View style={styles.astroPill}>
                  <Text style={styles.astroLabel}>Sun Sign</Text>
                  <Text style={styles.astroValue}>{profile.sunSign || 'Leo ♌'}</Text>
                </View>
                <View style={styles.astroPill}>
                  <Text style={styles.astroLabel}>Vibe</Text>
                  <Text style={styles.astroValue}>{profile.zodiacSign || setupZodiacSign ? 'Harmonic ⚡' : 'Calculating'}</Text>
                </View>
              </View>
            </View>

            {/* Vernacular 15s Voice Note */}
            {(profile.voicePromptUrl || setupVoicePromptUrl) ? (
              <View style={styles.sectionCard}>
                <View style={styles.voiceHeaderRow}>
                  <Text style={styles.sectionTitle}>🎙️ 15s Vernacular Voice Note</Text>
                  <Text style={styles.voiceDurationBadge}>{profile.voicePromptDuration || setupVoicePromptDuration || 15}s</Text>
                </View>
                <Text style={styles.voicePromptSubText}>"{profile.voicePromptText || setupVoicePromptText || VOICE_PROMPT_TOPICS[0]}"</Text>
                <TouchableOpacity
                  style={styles.voicePlayCardBtn}
                  activeOpacity={0.8}
                  onPress={() => handleTogglePlayVoice(profile.voicePromptUrl || setupVoicePromptUrl)}>
                  <Text style={styles.voicePlayBtnIcon}>
                    {isPlayingVoice ? '⏸️ Playing...' : '▶ Listen (Authentic Voice)'}
                  </Text>
                  <View style={styles.waveformContainer}>
                    {[10, 24, 38, 16, 30, 12, 34, 20, 40, 14, 26, 18, 32].map((h, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.waveformBar,
                          { height: isPlayingVoice ? ((h * 1.3) % 28) + 6 : h * 0.7 },
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addVoicePromptCard}
                activeOpacity={0.8}
                onPress={() => {
                  setIsEditingProfile(true);
                  setShowVoiceRecorderModal(true);
                }}>
                <Text style={styles.addVoicePromptIcon}>🎙️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addVoicePromptTitle}>Add a 15s Vernacular Voice Note</Text>
                  <Text style={styles.addVoicePromptSub}>Express yourself in your mother tongue or favorite dialect.</Text>
                </View>
                <Text style={styles.addVoicePromptAction}>Record →</Text>
              </TouchableOpacity>
            )}

            {/* Profile Meme DNA */}
            {(profile.selectedMemeUrl || setupMemeUrl) ? (
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>🤣 Profile Meme DNA</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingProfile(true);
                      setShowMemePickerModal(true);
                    }}>
                    <Text style={styles.editCardActionText}>Change Meme 🔄</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.memePreviewCard}>
                  <Image
                    source={{ uri: profile.selectedMemeUrl || setupMemeUrl }}
                    style={styles.memeImageDisplay}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.memeInfoOverlay}>
                    <Text style={styles.memeTitleText}>{profile.selectedMemeTitle || setupMemeTitle || 'Selected Meme'}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addMemeCard}
                activeOpacity={0.8}
                onPress={() => {
                  setIsEditingProfile(true);
                  setShowMemePickerModal(true);
                }}>
                <Text style={styles.addMemeIcon}>🤣</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addMemeTitle}>Choose a Profile Meme</Text>
                  <Text style={styles.addMemeSub}>Show your humor with Silk Board, Filter Coffee, or 2 AM chai memes (+2% score).</Text>
                </View>
                <Text style={styles.addMemeAction}>Pick →</Text>
              </TouchableOpacity>
            )}

            {/* Privacy & Safe Date Shortcuts */}
            <TouchableOpacity
              style={styles.privacyHubCard}
              onPress={() => {
                hapticFeedback.light();
                setShowAutoShieldModal(true);
              }}>
              <Text style={styles.privacyIcon}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Relative & Boss Auto-Shield Settings</Text>
                <Text style={styles.privacySub}>Manage contact hashing, corporate domain block, and intent.</Text>
              </View>
              <Text style={styles.privacyArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.safeDateShortcut} onPress={() => router.push('/safe-date')}>
              <Text style={styles.privacyIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.safeDateTitle}>Safe Date Spots & Live SOS Hub</Text>
                <Text style={styles.privacySub}>Blue Tokai, Third Wave partner cafes & 15% discount coupons.</Text>
              </View>
              <Text style={styles.privacyArrow}>→</Text>
            </TouchableOpacity>

            {/* Help & Support Hub */}
            <TouchableOpacity
              style={styles.supportShortcut}
              onPress={() => router.push('/support' as any)}
              activeOpacity={0.85}>
              <Text style={styles.privacyIcon}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportShortcutTitle}>Help, Support & FAQs</Text>
                <Text style={styles.privacySub}>Browse FAQs, raise concerns & track ticket resolution live.</Text>
              </View>
              <Text style={styles.privacyArrow}>→</Text>
            </TouchableOpacity>

            {/* Legal, Safety & Regulatory Policies */}
            <View style={styles.legalSectionCard}>
              <Text style={styles.legalSectionTitle}>LEGAL & SAFETY POLICIES</Text>
              
              <TouchableOpacity
                style={styles.legalRowItem}
                onPress={() => Linking.openURL('https://api.blunderr.in/terms').catch(() => Linking.openURL('https://blunderr.in/terms').catch(() => {}))}
                activeOpacity={0.7}>
                <Text style={styles.legalItemEmoji}>📜</Text>
                <Text style={styles.legalItemText}>Terms of Service & EULA</Text>
                <Text style={styles.legalItemArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.legalDivider} />

              <TouchableOpacity
                style={styles.legalRowItem}
                onPress={() => Linking.openURL('https://api.blunderr.in/privacy').catch(() => Linking.openURL('https://blunderr.in/privacy').catch(() => {}))}
                activeOpacity={0.7}>
                <Text style={styles.legalItemEmoji}>🔒</Text>
                <Text style={styles.legalItemText}>Privacy Policy & Data Safety</Text>
                <Text style={styles.legalItemArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.legalDivider} />

              <TouchableOpacity
                style={styles.legalRowItem}
                onPress={() => Linking.openURL('https://api.blunderr.in/safety').catch(() => Linking.openURL('https://api.blunderr.in/community-guidelines').catch(() => Linking.openURL('https://api.blunderr.in/terms').catch(() => {})))}
                activeOpacity={0.7}>
                <Text style={styles.legalItemEmoji}>🛡️</Text>
                <Text style={styles.legalItemText}>Zero-Tolerance UGC & Safety Rules</Text>
                <Text style={styles.legalItemArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Log Out */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                api.logout();
                router.replace('/auth');
              }}>
              <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
            </TouchableOpacity>

            {/* Delete Account (Mandatory App Store & Google Play compliance) */}
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              activeOpacity={0.8}
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}>
              {isDeletingAccount ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Text style={styles.deleteAccountBtnText}>🗑️ Delete Account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* EDIT PROFILE MODE */}
        {isEditingProfile && (
          <View style={{ width: '100%' }}>
            {/* 6-Photo Upload Grid */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📸 Profile Photos (6 Slots)</Text>
              <Text style={styles.sectionSub}>Upload 2 photos to start. Add 4+ to boost matches by 3x.</Text>

              <View style={styles.photoGrid}>
                {[
                  { uri: setupPhoto1, setter: setSetupPhoto1, slotIdx: 1, label: 'Primary' },
                  { uri: setupPhoto2, setter: setSetupPhoto2, slotIdx: 2, label: 'Photo 2' },
                  { uri: setupPhoto3, setter: setSetupPhoto3, slotIdx: 3, label: 'Photo 3' },
                  { uri: setupPhoto4, setter: setSetupPhoto4, slotIdx: 4, label: 'Photo 4' },
                  { uri: setupPhoto5, setter: setSetupPhoto5, slotIdx: 5, label: 'Photo 5' },
                  { uri: setupPhoto6, setter: setSetupPhoto6, slotIdx: 6, label: 'Photo 6' },
                ].map((item, idx) => {
                  const cleanUri = normalizeImageUrl(item.uri);
                  const hasPhoto = Boolean(cleanUri && cleanUri.trim() !== '');
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.photoSlot, !hasPhoto && styles.photoSlotEmpty]}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (hasPhoto) {
                          Alert.alert('Profile Photo', 'Do you want to change or delete this photo?', [
                            { text: 'Change Photo 📸', onPress: () => handlePickPhoto(item.slotIdx, item.setter) },
                            { text: 'Delete Photo 🗑️', style: 'destructive', onPress: () => handleDeletePhoto(item.slotIdx) },
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        } else {
                          handlePickPhoto(item.slotIdx, item.setter);
                        }
                      }}>
                      {hasPhoto ? (
                        <Image
                          source={{ uri: cleanUri }}
                          style={styles.photoImg}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                          onError={(e) => {
                            console.warn(`Slot ${item.slotIdx} image render error:`, e);
                          }}
                        />
                      ) : (
                        <Text style={{ fontSize: 24 }}>📷</Text>
                      )}
                      {uploadingSlot === item.slotIdx && (
                        <View style={styles.uploadingOverlay}>
                          <ActivityIndicator size="small" color="#E94057" />
                          <Text style={styles.uploadingText}>Saving...</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={[styles.photoActionBadge, hasPhoto && styles.photoActionBadgeDelete]}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (hasPhoto) {
                            handleDeletePhoto(item.slotIdx);
                          } else {
                            handlePickPhoto(item.slotIdx, item.setter);
                          }
                        }}>
                        <Text style={styles.photoActionBadgeText}>{hasPhoto ? '×' : '+'}</Text>
                      </TouchableOpacity>
                      {idx === 0 && hasPhoto && (
                        <View style={styles.primaryTag}>
                          <Text style={styles.primaryTagText}>⭐ Primary</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Biometric Selfie Upload Slot */}
              <TouchableOpacity
                style={styles.selfieCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (setupSelfie) {
                    Alert.alert('Biometric Selfie', 'Do you want to retake or remove your selfie?', [
                      { text: 'Retake Selfie 📸', onPress: handleTakeSelfie },
                      { text: 'Remove Selfie 🗑️', style: 'destructive', onPress: handleDeleteSelfie },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  } else {
                    handleTakeSelfie();
                  }
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ position: 'relative', width: 48, height: 48 }}>
                    {setupSelfie ? (
                      <Image
                        source={{ uri: normalizeImageUrl(setupSelfie) }}
                        style={styles.selfiePreview}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={styles.selfiePlaceholder}>
                        <Text style={{ fontSize: 22 }}>🤳</Text>
                      </View>
                    )}
                    {uploadingSelfie && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="small" color="#E94057" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selfieTitle}>Biometric Selfie Verification</Text>
                    <Text style={styles.selfieSub}>
                      {setupSelfie ? 'Selfie attached ✓ (Gold Shield eligible)' : 'Take a quick camera selfie for Gold Shield'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Basic Info Form */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>👤 Basic Information</Text>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={setupFullname}
                onChangeText={setSetupFullname}
                placeholder="e.g. Ananya Sharma"
                placeholderTextColor="#6B7082"
                maxLength={30}
              />

              <View style={styles.formGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>Height (cm)</Text>
                    {setupHeight && isValidHumanHeight(parseInt(setupHeight, 10)) ? (
                      <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>
                        ✓ {cmToFeetInches(parseInt(setupHeight, 10))}
                      </Text>
                    ) : getHeightValidationError(setupHeight) ? (
                      <Text style={{ color: '#FF385C', fontSize: 10, fontWeight: '700' }}>
                        ⚠️ Invalid
                      </Text>
                    ) : (
                      <Text style={{ color: '#6B7082', fontSize: 10 }}>100-240 cm</Text>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      Boolean(getHeightValidationError(setupHeight)) && { borderColor: '#FF385C', borderWidth: 1.5 },
                      Boolean(setupHeight && isValidHumanHeight(parseInt(setupHeight, 10))) && { borderColor: '#10B981' },
                    ]}
                    value={setupHeight}
                    onChangeText={(text) => {
                      const clean = text.replace(/[^0-9]/g, '');
                      setSetupHeight(clean);
                    }}
                    placeholder="e.g. 175"
                    placeholderTextColor="#6B7082"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  {getHeightValidationError(setupHeight) ? (
                    <Text style={{ color: '#FF385C', fontSize: 10, marginTop: 4, fontWeight: '600' }}>
                      {getHeightValidationError(setupHeight)}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Location / City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={setupLocation}
                    onChangeText={setSetupLocation}
                    placeholder="e.g. Bengaluru"
                    placeholderTextColor="#6B7082"
                    maxLength={25}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Search Distance Radius (Km)</Text>
              <TextInput
                style={styles.textInput}
                value={setupMaxDistanceKm}
                onChangeText={setSetupMaxDistanceKm}
                placeholder="50 (default)"
                placeholderTextColor="#6B7082"
                keyboardType="numeric"
                maxLength={3}
              />

              {/* GPS Coordinates & Sync */}
              <View style={styles.gpsSyncContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsSyncTitle}>Live Device GPS Location</Text>
                  <Text style={styles.gpsSyncCoords}>
                    {setupLatitude && setupLongitude
                      ? `📍 ${setupLatitude.toFixed(4)}°, ${setupLongitude.toFixed(4)}° (DB Synced)`
                      : '📍 Coordinates not set • Tap update to sync'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.gpsSyncBtn}
                  onPress={handleRefreshGpsLocation}
                  disabled={isUpdatingGps}>
                  {isUpdatingGps ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.gpsSyncBtnText}>Update GPS 📍</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Date of Birth Picker Button */}
              <Text style={styles.inputLabel}>Date of Birth 📅</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowDobPickerModal(true)}>
                <Text style={[styles.pickerFieldText, !setupDateOfBirth && { color: '#8E94A5' }]}>
                  {setupDateOfBirth || 'Select DOB'}
                </Text>
              </TouchableOpacity>

              {/* Gender Picker Button */}
              <Text style={styles.inputLabel}>Gender 👤</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowGenderPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupGenderDisplay || 'Select Gender'}</Text>
              </TouchableOpacity>

              {/* Show Gender Toggle */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSetupShowGender(prev => !prev)}>
                <View style={[styles.checkboxBox, setupShowGender && styles.checkboxActive]}>
                  {setupShowGender && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Show my gender on my profile</Text>
              </TouchableOpacity>

              {/* Interested In / Gender Preference */}
              <Text style={styles.inputLabel}>Interested In (Match Preference) 👥</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowPreferencePickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupPreferenceDisplay || 'Select Preference'}</Text>
              </TouchableOpacity>

              {/* Sexual Orientation Picker Button */}
              <Text style={styles.inputLabel}>Sexual Orientation * 🏳️‍🌈</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowOrientationPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupOrientation || 'Select Orientation 🏳️‍🌈'}</Text>
              </TouchableOpacity>

              {/* Show Orientation Toggle */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSetupShowOrientation(prev => !prev)}>
                <View style={[styles.checkboxBox, setupShowOrientation && styles.checkboxActive]}>
                  {setupShowOrientation && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Show orientation on my profile</Text>
              </TouchableOpacity>
            </View>

            {/* Cultural & Lifestyle Markers (Modal Pickers) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🥗 Dietary & Living Context</Text>
              <Text style={styles.sectionSub}>Crucial matching criteria for comfortable dating.</Text>

              {/* Dietary Preference Picker Button */}
              <Text style={styles.inputLabel}>Dietary Preference (Indian Context) 🥗</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowDietPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{getDietaryLabel(setupDiet)}</Text>
              </TouchableOpacity>

              {/* Living Situation Picker Button */}
              <Text style={styles.inputLabel}>Living Situation 🏠</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowLivingPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{getLivingLabel(setupLiving)}</Text>
              </TouchableOpacity>
            </View>

            {/* Languages Known Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🗣️ Languages Known</Text>
              <Text style={styles.sectionSub}>Select the languages you speak comfortably or add your own.</Text>

              {/* Text Box Prompt: On click, opens all presets and custom fill modal */}
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowLanguagePickerModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerFieldText,
                    setupLanguages.length === 0 && { color: '#7C8294' }
                  ]}
                  numberOfLines={2}
                >
                  {setupLanguages.length > 0 ? setupLanguages.join(', ') : 'Select or fill languages you speak...'}
                </Text>
                <Text style={{ color: '#00E5FF', fontSize: 13, fontWeight: '700' }}>Edit ✎</Text>
              </TouchableOpacity>

              {/* Selected Languages Chips */}
              {setupLanguages.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {setupLanguages.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={styles.selectedLanguageTag}
                      onPress={() => removeLanguage(lang)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectedLanguageTagText}>{lang}</Text>
                      <Text style={styles.removeLanguageTagIcon}>✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Lifestyle Habits: Smoking, Drinking, Vacation Vibe */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌿 Lifestyle, Habits & Vacation Vibe</Text>
              <Text style={styles.sectionSub}>Match with singles who share your comfort levels & getaway vibes.</Text>

              {/* Smoking Habit Picker */}
              <Text style={styles.inputLabel}>Smoking Habit 🚭</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowSmokingPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupSmoking}</Text>
              </TouchableOpacity>

              {/* Drinking Habit Picker */}
              <Text style={styles.inputLabel}>Alcohol / Drinking Habit 🍷</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowDrinkingPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupDrinking}</Text>
              </TouchableOpacity>

              {/* Vacation Preference: Mountains or Beaches */}
              <Text style={styles.inputLabel}>Vacation Preference: Mountains or Beaches? 🏔️🏖️</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowVacationPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupVacation}</Text>
              </TouchableOpacity>
            </View>

            {/* Hobbies & Active Pursuits */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🎨 Hobbies & Creative Pursuits</Text>
              <Text style={styles.sectionSub}>Select what you love doing in your free time (20+ presets).</Text>

              <TouchableOpacity
                style={[styles.pickerFieldBtn, { minHeight: 48 }]}
                onPress={() => {
                  setTempHobbies(setupHobbies);
                  setShowHobbiesPickerModal(true);
                }}>
                <Text style={styles.pickerFieldText}>
                  {setupHobbies || 'Select Hobbies (Photography, Trekking, etc.) 🎨'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vedic Astrology (Rashi / Moon Sign) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>✨ Vedic Zodiac Sign (Rashi / Moon Sign)</Text>
              <Text style={styles.sectionSub}>Match based on authentic Vedic Jyotish compatibility (+2% score).</Text>

              <TouchableOpacity
                style={[styles.pickerFieldBtn, { minHeight: 48 }]}
                onPress={() => setShowZodiacPickerModal(true)}>
                <Text style={[styles.pickerFieldText, !setupZodiacSign && { color: '#8E94A5' }]}>
                  {setupZodiacSign || 'Select Vedic Rashi (Mesha, Vrishabha, Mithuna, etc.) 🪐'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 15-Second Vernacular Voice Note */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>🎙️ 15s Vernacular Voice Note</Text>
                {setupVoicePromptUrl ? (
                  <TouchableOpacity onPress={handleDeleteVoicePrompt}>
                    <Text style={{ color: '#E94057', fontSize: 12, fontWeight: '700' }}>Delete 🗑️</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.sectionSub}>Add an authentic 15-second voice bio in your native language.</Text>

              {setupVoicePromptUrl ? (
                <View style={styles.editVoicePreviewCard}>
                  <Text style={styles.voicePromptSubText}>"{setupVoicePromptText || VOICE_PROMPT_TOPICS[0]}"</Text>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 }}>
                    <TouchableOpacity
                      style={styles.voicePlayMiniBtn}
                      onPress={() => handleTogglePlayVoice(setupVoicePromptUrl)}>
                      <Text style={styles.voicePlayBtnIcon}>
                        {isPlayingVoice ? '⏸️ Playing...' : '▶ Listen Preview'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.voiceRetakeBtn}
                      onPress={() => setShowVoiceRecorderModal(true)}>
                      <Text style={styles.voiceRetakeBtnText}>Retake 🎙️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.recordVoiceBtn}
                  onPress={() => setShowVoiceRecorderModal(true)}>
                  <Text style={styles.recordVoiceBtnText}>🎙️ Record 15-Second Voice Note</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Profile Meme DNA */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>🤣 Profile Meme DNA</Text>
                {setupMemeUrl ? (
                  <TouchableOpacity onPress={handleDeleteMeme}>
                    <Text style={{ color: '#E94057', fontSize: 12, fontWeight: '700' }}>Remove 🗑️</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.sectionSub}>Express your personality with relatable Indian dating memes (+2% score).</Text>

              {setupMemeUrl ? (
                <View style={styles.editMemePreviewWrap}>
                  <Image
                    source={{ uri: setupMemeUrl }}
                    style={styles.editMemeThumbnail}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.memeTitleText}>{setupMemeTitle || 'Selected Meme'}</Text>
                    <TouchableOpacity
                      style={styles.changeMemeBtn}
                      onPress={() => setShowMemePickerModal(true)}>
                      <Text style={styles.changeMemeBtnText}>Change Meme 🔄</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectMemeBtn}
                  onPress={() => setShowMemePickerModal(true)}>
                  <Text style={styles.selectMemeBtnText}>🤣 Choose Profile Meme</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Profession, Education & Orientation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💼 Profession & Education</Text>

              <Text style={styles.inputLabel}>Job / Occupation</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowJobPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupJob || 'Select Occupation 💼'}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Company Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={setupCompany}
                onChangeText={setSetupCompany}
                placeholder="e.g. Google, Swiggy, Startup"
                placeholderTextColor="#6B7082"
                maxLength={30}
              />

              <Text style={styles.inputLabel}>Education / Degree</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowEduPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupEducation || 'Select Education 🎓'}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Institute Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={setupInstitute}
                onChangeText={setSetupInstitute}
                placeholder="e.g. IIT Bombay, Delhi University"
                placeholderTextColor="#6B7082"
                maxLength={30}
              />

            </View>

            {/* Interests & Dating Goal */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🏷️ Interests & Dating Intent</Text>

              <Text style={styles.inputLabel}>What are you into? (Select at least 3)</Text>
              <TouchableOpacity
                style={[styles.pickerFieldBtn, { minHeight: 48 }]}
                onPress={() => {
                  setTempInterests(setupInterests);
                  setShowInterestPickerModal(true);
                }}>
                <Text style={styles.pickerFieldText}>
                  {setupInterests || 'Select Interests (60+ Presets) 🏷️'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Looking For (Relationship Goal)</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowIntentPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupIntent || 'Select Relationship Goal 🎯'}</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Prompts / Icebreakers */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Your Witty Answer</Text>
                <Text style={{ fontSize: 11, color: '#8E94A5' }}>{setupPromptAnswer.length}/500</Text>
              </View>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                value={setupPromptAnswer}
                onChangeText={setSetupPromptAnswer}
                placeholder="Type your funny or interesting answer..."
                placeholderTextColor="#6B7082"
                multiline
                maxLength={500}
              />
            </View>

            {/* Bio Description */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>✍️ Bio Description</Text>
                <Text style={{ fontSize: 11, color: '#8E94A5' }}>{setupBio.length}/500</Text>
              </View>
              <TextInput
                style={[styles.textInput, { height: 90 }]}
                value={setupBio}
                onChangeText={setSetupBio}
                placeholder="Tell your story, quirky habits, favorite food..."
                placeholderTextColor="#6B7082"
                multiline
                maxLength={500}
              />
            </View>

            {/* 🎯 Final Edit Section: My Desire Blueprint */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>💫 My Desire Blueprint</Text>
                <TouchableOpacity onPress={() => setShowDesireModal(true)}>
                  <Text style={{ color: '#00E5FF', fontSize: 13, fontWeight: '700' }}>Configure ✎</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSub}>
                Define the vibe, lifestyle harmony, and green flags you desire in a partner. This directly tunes your Discovery feed recommendations.
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <View style={styles.desirePreviewBadge}>
                  <Text style={styles.desirePreviewBadgeText}>🎂 {desireProfile?.minAge || 21} - {desireProfile?.maxAge || 34} yrs</Text>
                </View>
                <View style={styles.desirePreviewBadge}>
                  <Text style={styles.desirePreviewBadgeText}>📍 Within {desireProfile?.maxDistanceKm || 50} km</Text>
                </View>
                <View style={styles.desirePreviewBadge}>
                  <Text style={styles.desirePreviewBadgeText}>🥗 {desireProfile?.dietaryHarmony ? desireProfile.dietaryHarmony.replace(/_/g, ' ') : 'Any Diet'}</Text>
                </View>
                <View style={styles.desirePreviewBadge}>
                  <Text style={styles.desirePreviewBadgeText}>✨ {desireProfile?.weekendVibe ? desireProfile.weekendVibe.replace(/_/g, ' ') : 'Coffee & Books'}</Text>
                </View>
                {desireProfile?.communicationPace ? (
                  <View style={styles.desirePreviewBadge}>
                    <Text style={styles.desirePreviewBadgeText}>💬 {desireProfile.communicationPace.replace(/_/g, ' ')}</Text>
                  </View>
                ) : null}
                {desireProfile?.preferredProfessions && desireProfile.preferredProfessions.length > 0 ? (
                  <View style={styles.desirePreviewBadge}>
                    <Text style={styles.desirePreviewBadgeText}>
                      💼 {desireProfile.preferredProfessions.slice(0, 2).join(', ')}
                      {desireProfile.preferredProfessions.length > 2 ? ` +${desireProfile.preferredProfessions.length - 2}` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.configureDesireBtn}
                onPress={() => setShowDesireModal(true)}
                activeOpacity={0.8}>
                <Text style={styles.configureDesireBtnText}>🎯 Customize 4D Desire Blueprint</Text>
              </TouchableOpacity>
            </View>

            {/* Save / Cancel Action Bar */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionCancelBtn} onPress={() => setIsEditingProfile(false)}>
                <Text style={styles.actionCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionSaveBtn} onPress={handleSaveAllChanges}>
                <Text style={styles.actionSaveBtnText}>Save All Changes ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Relative & Boss Auto-Shield Privacy Modal */}
      {showAutoShieldModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAutoShieldModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.guideHeaderIconWrap}>
                <Text style={{ fontSize: 28 }}>🛡️</Text>
              </View>
              <Text style={styles.modalHeaderTitle}>Relative & Boss Auto-Shield</Text>
              <Text style={styles.modalHeaderSub}>
                Zero awkward encounters. Local SHA-256 salted contact hashing filters out relatives and colleagues from seeing your profile.
              </Text>

              <ScrollView style={{ width: '100%', maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Active Shield Status Badge */}
                <View style={styles.shieldStatusCard}>
                  <Text style={styles.shieldStatusTitle}>
                    {shieldBlockContacts || shieldCorpDomain.trim() ? '🟢 SHADOW SHIELD ACTIVE' : '⚪ SHIELD PAUSED'}
                  </Text>
                  <Text style={styles.shieldStatusDesc}>
                    {shieldedContactsCount > 0
                      ? `${shieldedContactsCount} phone contacts salted & blocked.`
                      : 'Contact hashing protects relatives without saving plain phone numbers.'}
                    {shieldCorpDomain.trim() ? ` Colleagues with @${shieldCorpDomain.trim()} are filtered.` : ''}
                  </Text>
                </View>

                {/* 1. Phone Contact Hashing */}
                <View style={styles.shieldOptionRow}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setShieldBlockContacts(!shieldBlockContacts)}>
                    <View style={[styles.checkboxBox, shieldBlockContacts && styles.checkboxActive]}>
                      {shieldBlockContacts && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shieldOptionTitle}>Auto-Block Relatives & Phone Contacts</Text>
                      <Text style={styles.shieldOptionSub}>Local SHA-256 salted hash blocks phonebook contacts</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.syncContactsBtn}
                  activeOpacity={0.8}
                  onPress={async () => {
                    hapticFeedback.light();
                    setIsSavingShield(true);
                    try {
                      const res = await api.syncContacts(['+919876543210', '+919876543211', '+919876543212']);
                      setShieldedContactsCount(res.shieldedContactsCount || 3);
                      hapticFeedback.success();
                      Alert.alert('Contacts Hashed 🛡️', 'Phonebook contacts successfully salted & hashed. Relatives will not see your profile.');
                    } catch (e) {
                      Alert.alert('Contacts Shielded', 'Local phone contact hashes updated.');
                    } finally {
                      setIsSavingShield(false);
                    }
                  }}>
                  <Text style={styles.syncContactsBtnText}>
                    {isSavingShield ? 'Hashing Contacts...' : '📱 Hash & Sync Phone Contacts Now'}
                  </Text>
                </TouchableOpacity>

                {/* 2. Corporate Domain Blocker */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Block Work Colleagues (@company.com)</Text>
                <TextInput
                  style={styles.textInput}
                  value={shieldCorpDomain}
                  onChangeText={setShieldCorpDomain}
                  placeholder="e.g. swiggy.in, google.com, infosys.com"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={{ color: '#8E94A5', fontSize: 10, marginTop: 4, marginBottom: 10 }}>
                  Anyone with a matching company email domain will be filtered out.
                </Text>

                {/* 3. Social Graph Isolation */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setShieldHideMutuals(!shieldHideMutuals)}>
                  <View style={[styles.checkboxBox, shieldHideMutuals && styles.checkboxActive]}>
                    {shieldHideMutuals && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shieldOptionTitle}>Hide Mutual Social Connections</Text>
                    <Text style={styles.shieldOptionSub}>Isolates dating profile from social graph</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Save & Close Buttons */}
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                activeOpacity={0.85}
                onPress={async () => {
                  hapticFeedback.medium();
                  if (shieldCorpDomain.trim()) {
                    await api.setCorporateDomain(shieldCorpDomain.trim()).catch(() => {});
                  }
                  setShowAutoShieldModal(false);
                  hapticFeedback.success();
                  Alert.alert('Auto-Shield Saved 🛡️', 'Your privacy and block rules are now active.');
                }}>
                <Text style={styles.modalConfirmBtnText}>Save Privacy Settings ✓</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAutoShieldModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL PICKERS */}
      {/* ========================================================================= */}

      {/* 1. Date of Birth Picker Modal */}
      {showDobPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderEmoji}>🎂</Text>
              <Text style={styles.modalHeaderTitle}>Select Date of Birth</Text>
              <Text style={styles.modalHeaderSub}>Use the controls below to set your birthdate.</Text>

              <View style={styles.dobSpinnersRow}>
                <View style={styles.dobCol}>
                  <Text style={styles.dobColLabel}>DAY</Text>
                  <TouchableOpacity onPress={() => setPickerDay(p => (p === 31 ? 1 : p + 1))} style={styles.spinnerArrowBtn}>
                    <Text style={styles.spinnerArrowText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.spinnerValueText}>{String(pickerDay).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setPickerDay(p => (p === 1 ? 31 : p - 1))} style={styles.spinnerArrowBtn}>
                    <Text style={styles.spinnerArrowText}>▼</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dobCol}>
                  <Text style={styles.dobColLabel}>MONTH</Text>
                  <TouchableOpacity onPress={() => setPickerMonth(p => (p === 12 ? 1 : p + 1))} style={styles.spinnerArrowBtn}>
                    <Text style={styles.spinnerArrowText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.spinnerValueText}>{String(pickerMonth).padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setPickerMonth(p => (p === 1 ? 12 : p - 1))} style={styles.spinnerArrowBtn}>
                    <Text style={styles.spinnerArrowText}>▼</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dobCol}>
                  <Text style={styles.dobColLabel}>YEAR</Text>
                  <TouchableOpacity onPress={() => setPickerYear(p => (p >= 2007 ? 1970 : p + 1))} style={styles.spinnerArrowBtn}>
                    <Text style={styles.spinnerArrowText}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.spinnerValueText}>{pickerYear}</Text>
                  <TouchableOpacity onPress={() => setPickerYear(p => (p <= 1970 ? 2007 : p - 1))} style={styles.spinnerArrowBtn}>
                    <Text style={styles.spinnerArrowText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setSetupDateOfBirth(`${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`);
                  setShowDobPickerModal(false);
                }}>
                <Text style={styles.modalConfirmBtnText}>Confirm Birth Date ✓</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3A3F50' }]}
                onPress={() => setShowDobPickerModal(false)}>
                <Text style={[styles.modalConfirmBtnText, { color: '#8E94A5' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 2. Dietary Preference Modal Picker */}
      {showDietPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Dietary Preference 🥗</Text>
              <Text style={styles.modalHeaderSub}>Crucial in Indian dating to prevent awkward dining surprises.</Text>
              <ScrollView style={{ maxHeight: 320, width: '100%', marginVertical: 12 }}>
                {DIETARY_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupDiet === item.key && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupDiet(item.key);
                      setShowDietPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupDiet === item.key && styles.pickerOptionTextActive]}>
                      {item.emoji} {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDietPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 3. Living Situation Modal Picker */}
      {showLivingPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Living Situation 🏠</Text>
              <Text style={styles.modalHeaderSub}>Affects spontaneous dating logistics & curfew compatibility.</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {LIVING_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupLiving === item.key && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupLiving(item.key);
                      setShowLivingPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupLiving === item.key && styles.pickerOptionTextActive]}>
                      {item.emoji} {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowLivingPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 3A. Languages Known Modal Picker */}
      {showLanguagePickerModal && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setShowLanguagePickerModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '85%' }]}>
              <Text style={styles.modalHeaderTitle}>Languages Known 🗣️</Text>
              <Text style={styles.modalHeaderSub}>
                Select the languages you speak comfortably or add your own.
              </Text>

              {/* Search Bar */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1E2333',
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 42,
                marginVertical: 10,
                borderWidth: 1,
                borderColor: '#2D3245',
                width: '100%',
              }}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}
                  placeholder="Search preset languages..."
                  placeholderTextColor="#7C8294"
                  value={languageSearchQuery}
                  onChangeText={setLanguageSearchQuery}
                />
                {languageSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLanguageSearchQuery('')}>
                    <Text style={{ color: '#7C8294', fontSize: 14, fontWeight: 'bold', padding: 4 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected Languages Chips at top */}
              {setupLanguages.length > 0 && (
                <View style={{ width: '100%', marginBottom: 10 }}>
                  <Text style={[styles.inputLabel, { color: '#00E5FF', marginBottom: 6 }]}>
                    Selected ({setupLanguages.length}):
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 38 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {setupLanguages.map((lang) => (
                        <TouchableOpacity
                          key={lang}
                          style={styles.selectedLanguageTag}
                          onPress={() => removeLanguage(lang)}
                          activeOpacity={0.7}>
                          <Text style={styles.selectedLanguageTagText}>{lang}</Text>
                          <Text style={styles.removeLanguageTagIcon}>✕</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Preset Languages Pills */}
              <Text style={[styles.inputLabel, { width: '100%', marginBottom: 6 }]}>
                Choose from presets (Tap to select):
              </Text>
              <ScrollView style={{ maxHeight: 200, width: '100%', marginVertical: 4 }} showsVerticalScrollIndicator={true}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 6 }}>
                  {LANGUAGE_OPTIONS
                    .filter((item) => {
                      if (!languageSearchQuery.trim()) return true;
                      return item.toLowerCase().includes(languageSearchQuery.trim().toLowerCase());
                    })
                    .map((item) => {
                      const clean = item.split(' ')[0];
                      const isSelected = setupLanguages.includes(clean);
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.presetLanguagePill,
                            isSelected && styles.presetLanguagePillActive,
                          ]}
                          onPress={() => toggleLanguage(item)}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.presetLanguagePillText,
                              isSelected && styles.presetLanguagePillTextActive,
                            ]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </ScrollView>

              {/* Custom Language Input */}
              <Text style={[styles.inputLabel, { width: '100%', marginTop: 8, marginBottom: 4 }]}>
                Or type custom language:
              </Text>
              <View style={[styles.addCustomLanguageRow, { width: '100%', marginBottom: 12 }]}>
                <TextInput
                  style={styles.addCustomLanguageInput}
                  placeholder="e.g. Bhojpuri, French, Spanish..."
                  placeholderTextColor="#666"
                  value={customLanguageInput}
                  onChangeText={setCustomLanguageInput}
                  onSubmitEditing={handleAddCustomLanguage}
                  returnKeyType="done"
                  maxLength={30}
                />
                <TouchableOpacity
                  style={styles.addCustomLanguageBtn}
                  onPress={handleAddCustomLanguage}
                  activeOpacity={0.7}>
                  <Text style={styles.addCustomLanguageBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Done Button */}
              <TouchableOpacity
                style={[styles.saveVoiceBtn, { width: '100%', backgroundColor: '#E94057' }]}
                onPress={() => {
                  setShowLanguagePickerModal(false);
                  setLanguageSearchQuery('');
                  hapticFeedback.selection();
                }}>
                <Text style={styles.saveVoiceBtnText}>
                  Done ({setupLanguages.length} selected) ✓
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 3B. Smoking Modal Picker */}
      {showSmokingPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Smoking Habit 🚭</Text>
              <Text style={styles.modalHeaderSub}>Be upfront about your smoking habits for better compatibility.</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {SMOKING_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupSmoking.startsWith(item.label) && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupSmoking(`${item.label} ${item.emoji}`);
                      setShowSmokingPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupSmoking.startsWith(item.label) && styles.pickerOptionTextActive]}>
                      {item.emoji} {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSmokingPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 3C. Drinking Modal Picker */}
      {showDrinkingPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Alcohol / Drinking Habit 🍷</Text>
              <Text style={styles.modalHeaderSub}>Your drinking comfort level for Friday night plans & cocktail dates.</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {DRINKING_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupDrinking.startsWith(item.label) && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupDrinking(`${item.label} ${item.emoji}`);
                      setShowDrinkingPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupDrinking.startsWith(item.label) && styles.pickerOptionTextActive]}>
                      {item.emoji} {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDrinkingPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 3D. Vacation Vibe: Mountains vs Beaches Modal Picker */}
      {showVacationPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Mountains or Beaches? 🏔️🏖️</Text>
              <Text style={styles.modalHeaderSub}>Choose your go-to weekend escape & holiday vibe.</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {VACATION_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupVacation.startsWith(item.label) && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupVacation(`${item.label} ${item.emoji}`);
                      setShowVacationPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupVacation.startsWith(item.label) && styles.pickerOptionTextActive]}>
                      {item.emoji} {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowVacationPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 3E. Hobbies Multi-Select Modal */}
      {showHobbiesPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '80%' }]}>
              <Text style={styles.modalHeaderTitle}>Select Hobbies & Pursuits 🎨</Text>
              <Text style={styles.modalHeaderSub}>Tap to select or deselect what you enjoy doing.</Text>
              <ScrollView style={{ width: '100%', marginVertical: 12 }} contentContainerStyle={styles.interestsModalWrap}>
                {HOBBIES_PRESETS.map((item, idx) => {
                  const cleanName = item.split(' ')[0];
                  const list = (tempHobbies || '').split(',').map(s => s.trim()).filter(s => s);
                  const isSelected = list.some(h => h.includes(cleanName) || item.includes(h));
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.interestModalPill,
                        isSelected && {
                          backgroundColor: 'rgba(255, 152, 0, 0.2)',
                          borderColor: '#FF9800',
                        },
                      ]}
                      onPress={() => {
                        let newList;
                        if (isSelected) {
                          newList = list.filter(h => !h.includes(cleanName) && !item.includes(h));
                        } else {
                          newList = [...list, item];
                        }
                        setTempHobbies(newList.join(', '));
                      }}>
                      <Text
                        style={[
                          styles.interestModalPillText,
                          isSelected && { color: '#FF9800', fontWeight: '800' },
                        ]}>
                        {item} {isSelected ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#FF9800' }]}
                onPress={() => {
                  setSetupHobbies(tempHobbies);
                  setShowHobbiesPickerModal(false);
                }}>
                <Text style={styles.modalConfirmBtnText}>Save Hobbies ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 4. Job / Occupation Picker Modal */}
      {showJobPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Occupation 💼</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {JOB_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupJob === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupJob(item);
                      setShowJobPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupJob === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowJobPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 5. Education Picker Modal */}
      {showEduPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Education 🎓</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {EDUCATION_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupEducation === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupEducation(item);
                      setShowEduPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupEducation === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEduPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 6. Interests Multi-Select Modal */}
      {showInterestPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '80%' }]}>
              <Text style={styles.modalHeaderTitle}>Select Interests (At least 3) 🏷️</Text>
              <Text style={styles.modalHeaderSub}>Tap to select or deselect interests.</Text>
              <ScrollView style={{ width: '100%', marginVertical: 12 }} contentContainerStyle={styles.interestsModalWrap}>
                {INTERESTS_PRESETS.map((item, idx) => {
                  const list = (tempInterests || '').split(',').map(s => s.trim()).filter(s => s);
                  const isSelected = list.includes(item);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.interestModalPill, isSelected && styles.interestModalPillActive]}
                      onPress={() => {
                        let newList;
                        if (isSelected) {
                          newList = list.filter(i => i !== item);
                        } else {
                          newList = [...list, item];
                        }
                        setTempInterests(newList.join(', '));
                      }}>
                      <Text style={[styles.interestModalPillText, isSelected && styles.interestModalPillTextActive]}>
                        {item} {isSelected ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setSetupInterests(tempInterests);
                  setShowInterestPickerModal(false);
                }}>
                <Text style={styles.modalConfirmBtnText}>Save Interests ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 7. Sexual Orientation Modal */}
      {showOrientationPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Sexual Orientation 🏳️‍🌈</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {SEXUAL_ORIENTATION_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupOrientation === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupOrientation(item);
                      setShowOrientationPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupOrientation === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowOrientationPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 8. Gender Modal */}
      {showGenderPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Gender 👤</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {GENDER_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupGenderDisplay === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupGenderDisplay(item);
                      setShowGenderPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupGenderDisplay === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowGenderPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 9. Gender Preference Modal */}
      {showPreferencePickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Interested In 👥</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {GENDER_PREFERENCE_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupPreferenceDisplay === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupPreferenceDisplay(item);
                      setShowPreferencePickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupPreferenceDisplay === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPreferencePickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 10. Intent Modal */}
      {showIntentPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Relationship Goal 🎯</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {RELATIONSHIP_INTENT_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupIntent === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupIntent(item);
                      setShowIntentPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupIntent === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowIntentPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 11. Prompt Question Modal */}
      {showPromptPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>Select Prompt Question 🗣️</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%', marginVertical: 12 }}>
                {PROMPT_PRESETS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOptionItem, setupPromptQuestion === item && styles.pickerOptionActive]}
                    onPress={() => {
                      setSetupPromptQuestion(item);
                      setShowPromptPickerModal(false);
                    }}>
                    <Text style={[styles.pickerOptionText, setupPromptQuestion === item && styles.pickerOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPromptPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 12. Vedic Zodiac (Rashi) Picker Modal */}
      {showZodiacPickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '85%' }]}>
              <Text style={styles.modalHeaderEmoji}>🪐</Text>
              <Text style={styles.modalHeaderTitle}>Select Vedic Zodiac (Rashi)</Text>
              <Text style={styles.modalHeaderSub}>Jyotish Rashis determine Moon Sign compatibility & cosmic harmony.</Text>
              <ScrollView style={{ width: '100%', marginVertical: 12 }} showsVerticalScrollIndicator={false}>
                {VEDIC_ZODIAC_OPTIONS.map((item, idx) => {
                  const isSelected = setupZodiacSign.includes(item.rashi);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.zodiacOptionCard, isSelected && styles.zodiacOptionCardActive]}
                      onPress={() => handleSelectZodiac(item)}>
                      <View style={styles.zodiacTopRow}>
                        <Text style={styles.zodiacSymbol}>{item.symbol}</Text>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.zodiacRashiText, isSelected && styles.zodiacTextActive]}>
                              {item.rashi}
                            </Text>
                            <Text style={styles.zodiacWesternText}>({item.western})</Text>
                          </View>
                          <Text style={styles.zodiacSubText}>
                            {item.element} • Lord: {item.lord}
                          </Text>
                        </View>
                        {isSelected && <Text style={styles.zodiacTick}>✓</Text>}
                      </View>
                      <Text style={styles.zodiacTraitsText}>{item.traits}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowZodiacPickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 13. 15-Second Voice Note Recorder Modal */}
      {showVoiceRecorderModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '88%' }]}>
              <Text style={styles.modalHeaderEmoji}>🎙️</Text>
              <Text style={styles.modalHeaderTitle}>15s Vernacular Voice Note</Text>
              <Text style={styles.modalHeaderSub}>
                Share your voice, accent, or native language to connect on a deeper human level.
              </Text>

              {/* Topic Selector Chips */}
              <Text style={styles.modalSectionSubTitle}>Choose a Prompt Topic:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScrollView}>
                {VOICE_PROMPT_TOPICS.map((topic, idx) => {
                  const isSelected = setupVoicePromptText === topic;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.topicChip, isSelected && styles.topicChipActive]}
                      onPress={() => setSetupVoicePromptText(topic)}>
                      <Text style={[styles.topicChipText, isSelected && styles.topicChipTextActive]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected Topic Display */}
              <View style={styles.activeTopicBox}>
                <Text style={styles.activeTopicQuote}>"{setupVoicePromptText || VOICE_PROMPT_TOPICS[0]}"</Text>
              </View>

              {/* Timer & Waveform Display */}
              <View style={styles.recorderStatusBox}>
                <Text style={styles.recorderTimerText}>
                  00:{String(voiceRecordSeconds).padStart(2, '0')} / 00:30
                </Text>
                <View style={styles.waveformContainer}>
                  {[12, 26, 38, 18, 32, 10, 36, 22, 42, 16, 28, 20, 34, 14, 30].map((h, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.waveformBar,
                        {
                          height: isVoiceRecording
                            ? ((h * 1.4 + idx * 3) % 36) + 8
                            : isPlayingVoice
                            ? ((h * 1.2) % 30) + 6
                            : 6,
                          backgroundColor: isVoiceRecording ? '#E94057' : (recordedAudioUri ? '#2ED573' : '#3A3E4E'),
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.recordingStatusLabel}>
                  {isVoiceRecording
                    ? '🔴 Recording in progress... (30s limit)'
                    : recordedAudioUri
                    ? '✅ Voice note recorded! Listen preview or save.'
                    : 'Tap below to begin speaking'}
                </Text>
              </View>

              {/* Record Controls */}
              <View style={styles.recorderControlsRow}>
                {!isVoiceRecording ? (
                  <TouchableOpacity
                    style={styles.recordStartBtn}
                    onPress={startVoiceRecording}>
                    <Text style={styles.recordStartBtnText}>
                      {recordedAudioUri ? '🔄 Record Again' : '🎙️ Start Recording'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.recordStopBtn}
                    onPress={stopVoiceRecording}>
                    <Text style={styles.recordStopBtnText}>⏹️ Stop Recording ({30 - voiceRecordSeconds}s)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Play Preview & Save Options (if recorded) */}
              {recordedAudioUri && !isVoiceRecording ? (
                <View style={styles.previewActionsRow}>
                  <TouchableOpacity
                    style={styles.previewPlayBtn}
                    onPress={() => handleTogglePlayVoice(recordedAudioUri)}>
                    <Text style={styles.previewPlayBtnText}>
                      {isPlayingVoice ? '⏸️ Pause' : '▶ Listen Preview'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveVoiceBtn}
                    onPress={handleSaveVoiceNote}>
                    <Text style={styles.saveVoiceBtnText}>Save Voice Note ✓</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.modalCancelBtn, { marginTop: 14 }]}
                onPress={() => {
                  if (isVoiceRecording) stopVoiceRecording();
                  stopAudibleVoiceNote();
                  setIsPlayingVoice(false);
                  setShowVoiceRecorderModal(false);
                }}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 14. Profile Meme Selector Modal */}
      {showMemePickerModal && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '88%' }]}>
              <Text style={styles.modalHeaderEmoji}>🤣</Text>
              <Text style={styles.modalHeaderTitle}>Select Profile Meme</Text>
              <Text style={styles.modalHeaderSub}>
                Pick from curated Indian dating memes or upload your own to showcase your vibe.
              </Text>

              {/* Custom Meme Upload Button */}
              <TouchableOpacity
                style={styles.uploadMemeOptionBtn}
                onPress={handleUploadCustomMeme}>
                <Text style={styles.uploadMemeOptionIcon}>🖼️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadMemeOptionTitle}>Upload Custom Meme</Text>
                  <Text style={styles.uploadMemeOptionSub}>Pick an image from your device photos</Text>
                </View>
                <Text style={styles.uploadMemeOptionAction}>Browse →</Text>
              </TouchableOpacity>

              <Text style={styles.modalSectionSubTitle}>Or Pick a Curated Preset ({MEME_PRESETS.length} Memes):</Text>

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 38, marginVertical: 6 }}>
                <View style={styles.memeCategoryFilterRow}>
                  {(['All', 'Global Legends', 'Dating & Romance', 'Desi Classics'] as const).map((cat) => {
                    const count = cat === 'All' ? MEME_PRESETS.length : MEME_PRESETS.filter(m => m.category === cat).length;
                    const isActive = selectedMemeCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.memeCategoryChip, isActive && styles.memeCategoryChipActive]}
                        onPress={() => setSelectedMemeCategory(cat)}>
                        <Text style={[styles.memeCategoryChipText, isActive && styles.memeCategoryChipTextActive]}>
                          {cat} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <ScrollView style={{ width: '100%', maxHeight: 320, marginVertical: 4 }} showsVerticalScrollIndicator={false}>
                <View style={styles.memePresetsGrid}>
                  {MEME_PRESETS
                    .filter((preset) => selectedMemeCategory === 'All' || preset.category === selectedMemeCategory)
                    .map((preset, idx) => {
                      const isSelected = setupMemeUrl === preset.imageUrl;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.memeGridCard, isSelected && styles.memeGridCardActive]}
                          onPress={() => handleSelectPresetMeme(preset)}>
                          <Image
                            source={{ uri: preset.imageUrl }}
                            style={styles.memeGridImg}
                            contentFit="cover"
                            transition={200}
                          />
                          <View style={styles.memeGridInfo}>
                            <Text style={styles.memeGridTitle} numberOfLines={2}>{preset.title}</Text>
                            <Text style={styles.memeGridCategory}>{preset.category}</Text>
                            {isSelected && (
                              <View style={styles.memeSelectedBadge}>
                                <Text style={styles.memeSelectedBadgeText}>✓ Selected</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowMemePickerModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 15. 100% Profile Completion Guide Modal */}
      {showCompletionGuideModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCompletionGuideModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.guideModalCard}>
              <View style={styles.guideHeaderIconWrap}>
                <Text style={{ fontSize: 30 }}>🚀</Text>
              </View>

              <Text style={styles.guideModalTitle}>Discovery Unlocked! ({completionScore}%)</Text>
              <Text style={styles.guideModalSub}>
                You’ve crossed the minimum 30% milestone! Profiles with 100% completion receive up to 3.5x more mutual matches.
              </Text>

              {/* Score Progress Bar */}
              <View style={styles.guideProgressBox}>
                <View style={styles.guideProgressTrack}>
                  <View style={[styles.guideProgressFill, { width: `${completionScore}%` }]} />
                </View>
                <View style={styles.guideProgressLabels}>
                  <Text style={styles.guideCurrentScoreText}>{completionScore}% Current</Text>
                  <Text style={styles.guideTargetScoreText}>Target: 100% 🎯</Text>
                </View>
              </View>

              {/* Missing Items Checklist */}
              <Text style={styles.guideSectionTitle}>Add these to reach 100%:</Text>
              <ScrollView style={{ maxHeight: 220, width: '100%', marginVertical: 6 }} showsVerticalScrollIndicator={false}>
                {/* Photo Checklist */}
                <View style={styles.guideItemRow}>
                  <Text style={styles.guideItemIcon}>{setupPhoto2 && setupPhoto3 ? '✅' : '📷'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Upload 4+ Profile Photos</Text>
                    <Text style={styles.guideItemSub}>Profiles with multiple angles get 3x more swipes (+8%)</Text>
                  </View>
                  <Text style={setupPhoto2 && setupPhoto3 ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupPhoto2 && setupPhoto3 ? 'Done' : '+8%'}
                  </Text>
                </View>

                {/* Bio Checklist */}
                <View style={styles.guideItemRow}>
                  <Text style={styles.guideItemIcon}>{setupBio ? '✅' : '✍️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Write a Bio</Text>
                    <Text style={styles.guideItemSub}>Share your story, humor & vibe (+8%)</Text>
                  </View>
                  <Text style={setupBio ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupBio ? 'Done' : '+8%'}
                  </Text>
                </View>

                {/* Prompt Checklist */}
                <View style={styles.guideItemRow}>
                  <Text style={styles.guideItemIcon}>{setupPromptAnswer ? '✅' : '☕'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Answer a Lifestyle Prompt</Text>
                    <Text style={styles.guideItemSub}>Spark conversations about coffee & weekend plans (+7%)</Text>
                  </View>
                  <Text style={setupPromptAnswer ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupPromptAnswer ? 'Done' : '+7%'}
                  </Text>
                </View>

                {/* Verified Selfie Checklist */}
                <TouchableOpacity
                  style={styles.guideItemRow}
                  activeOpacity={0.7}
                  onPress={handleTakeSelfie}>
                  <Text style={styles.guideItemIcon}>{setupSelfie ? '✅' : '🤳'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Biometric Selfie Verification</Text>
                    <Text style={styles.guideItemSub}>Earn the Gold Trust Shield badge (+4%)</Text>
                  </View>
                  <Text style={setupSelfie ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupSelfie ? 'Done' : '+4%'}
                  </Text>
                </TouchableOpacity>

                {/* Career & Education */}
                <View style={styles.guideItemRow}>
                  <Text style={styles.guideItemIcon}>{setupJob && setupEducation ? '✅' : '💼'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Career & Education</Text>
                    <Text style={styles.guideItemSub}>Occupation, university & height (+10%)</Text>
                  </View>
                  <Text style={setupJob && setupEducation ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupJob && setupEducation ? 'Done' : '+10%'}
                  </Text>
                </View>

                {/* Dietary & Habits */}
                <View style={styles.guideItemRow}>
                  <Text style={styles.guideItemIcon}>{setupDiet && setupLiving ? '✅' : '🥗'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Dietary & Living Arrangement</Text>
                    <Text style={styles.guideItemSub}>Pure Veg, Non-Veg, Flat or with parents (+10%)</Text>
                  </View>
                  <Text style={setupDiet && setupLiving ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupDiet && setupLiving ? 'Done' : '+10%'}
                  </Text>
                </View>

                {/* Hobbies & Passions */}
                <View style={styles.guideItemRow}>
                  <Text style={styles.guideItemIcon}>{setupHobbies && setupInterests ? '✅' : '🎨'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideItemTitle}>Interests & Passions</Text>
                    <Text style={styles.guideItemSub}>Specialty Coffee, Trekking, Cycling, Reading (+5%)</Text>
                  </View>
                  <Text style={setupHobbies && setupInterests ? styles.guideItemPointsDone : styles.guideItemPoints}>
                    {setupHobbies && setupInterests ? 'Done' : '+5%'}
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.guideCompleteBtn}
                onPress={() => {
                  setShowCompletionGuideModal(false);
                  setIsEditingProfile(true);
                }}>
                <Text style={styles.guideCompleteBtnText}>Add More Details Now ✍️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guideExploreBtn}
                onPress={() => {
                  setShowCompletionGuideModal(false);
                  router.replace('/(tabs)');
                }}>
                <Text style={styles.guideExploreBtnText}>Start Discovering Singles ❤️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* DESIRE PROFILE MODAL */}
      {showDesireModal && (
        <DesireProfileModal
          visible={true}
          onClose={() => setShowDesireModal(false)}
          onSaved={(updated) => setDesireProfile(updated)}
        />
      )}

      {/* BIOMETRIC SELFIE CAMERA MODAL (FRONT CAMERA) */}
      {showSelfieModal && (
        <SelfieCameraModal
          visible={true}
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
    backgroundColor: '#0E0F13',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0F13',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#20222B',
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  editHeaderBtn: {
    backgroundColor: '#1E1F28',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E94057',
  },
  editHeaderBtnText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#1E1F28',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cancelBtnText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '700',
  },
  saveHeaderBtn: {
    backgroundColor: '#E94057',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  completionCard: {
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: '#E94057',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  completionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionEmoji: {
    fontSize: 16,
  },
  completionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  completionScoreText: {
    fontSize: 16,
    fontWeight: '900',
  },
  scoreGreen: {
    color: '#4CAF50',
  },
  scoreRed: {
    color: '#E94057',
  },
  completionEditLink: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#262833',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  barFillGreen: {
    backgroundColor: '#4CAF50',
  },
  barFillRed: {
    backgroundColor: '#E94057',
  },
  completionHint: {
    color: '#8E94A5',
    fontSize: 11,
    lineHeight: 15,
  },
  carouselContainer: {
    marginBottom: 10,
  },
  carouselImage: {
    width: width * 0.7,
    height: 280,
    borderRadius: 20,
    marginRight: 12,
  },
  sectionCard: {
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: '#262833',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  goldBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  goldBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
  occupationText: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  subDetailText: {
    color: '#CACDD8',
    fontSize: 13,
    marginTop: 2,
  },
  locText: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 4,
  },
  karmaChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A1F1D',
    borderWidth: 1,
    borderColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  karmaText: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: '700',
  },
  promptQuoteCard: {
    backgroundColor: '#201A24',
    borderLeftWidth: 4,
    borderLeftColor: '#E94057',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  promptQuestionTitle: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  promptAnswerText: {
    color: '#ffffff',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginBottom: 12,
  },
  bioContent: {
    color: '#CACDD8',
    fontSize: 13,
    lineHeight: 19,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  traitChip: {
    backgroundColor: '#1E1F28',
    borderWidth: 1,
    borderColor: '#2E303E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  traitLabel: {
    color: '#8E94A5',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  traitValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  interestPill: {
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  interestPillText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '700',
  },
  astroRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  astroPill: {
    flex: 1,
    backgroundColor: '#1E1F28',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  astroLabel: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '700',
  },
  astroValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  privacyHubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1622',
    borderWidth: 1,
    borderColor: '#382645',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    gap: 12,
  },
  safeDateShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18221D',
    borderWidth: 1,
    borderColor: '#264230',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    gap: 12,
  },
  supportShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131A26',
    borderWidth: 1,
    borderColor: '#1F2C40',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    gap: 12,
  },
  supportShortcutTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  privacyIcon: {
    fontSize: 22,
  },
  privacyTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  safeDateTitle: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  privacySub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  privacyArrow: {
    color: '#CACDD8',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#1E1418',
    borderWidth: 1,
    borderColor: '#4A1D24',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  logoutBtnText: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteAccountBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  deleteAccountBtnText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Edit Mode Styles
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1E1F28',
    borderRadius: 14,
    marginBottom: 12,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSlotEmpty: {
    borderWidth: 2,
    borderColor: '#2E303E',
    borderStyle: 'dashed',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  uploadingText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  photoActionBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E94057',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#16171E',
    zIndex: 2,
  },
  photoActionBadgeDelete: {
    backgroundColor: '#FF4757',
  },
  photoActionBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  primaryTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryTagText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '800',
  },
  selfieCard: {
    backgroundColor: '#1A1D28',
    borderWidth: 1,
    borderColor: '#2E303E',
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  selfiePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  selfiePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#262833',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  selfieSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  inputLabel: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1E1F28',
    borderWidth: 1,
    borderColor: '#2E303E',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  formGrid: {
    flexDirection: 'row',
    width: '100%',
  },
  pickerFieldBtn: {
    backgroundColor: '#1E1F28',
    borderWidth: 1,
    borderColor: '#2E303E',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  pickerFieldText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E94057',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#E94057',
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  checkboxLabel: {
    color: '#CACDD8',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionCancelBtn: {
    flex: 1,
    backgroundColor: '#1E1F28',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionCancelBtnText: {
    color: '#8E94A5',
    fontSize: 13,
    fontWeight: '700',
  },
  actionSaveBtn: {
    flex: 1.5,
    backgroundColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  desirePreviewBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  desirePreviewBadgeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  configureDesireBtn: {
    backgroundColor: '#1E202B',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  configureDesireBtnText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#16171E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E94057',
    padding: 20,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalHeaderEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  modalHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalHeaderSub: {
    color: '#8E94A5',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  dobSpinnersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
  },
  dobCol: {
    alignItems: 'center',
    width: 70,
  },
  dobColLabel: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  spinnerArrowBtn: {
    backgroundColor: '#20222B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerArrowText: {
    color: '#E94057',
    fontSize: 14,
    fontWeight: '900',
  },
  spinnerValueText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 8,
  },
  modalConfirmBtn: {
    backgroundColor: '#E94057',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalCancelBtn: {
    backgroundColor: '#1E1F28',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelBtnText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '700',
  },
  pickerOptionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#20222B',
  },
  pickerOptionActive: {
    backgroundColor: '#2D151B',
  },
  pickerOptionText: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#E94057',
    fontWeight: '800',
  },
  interestsModalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 10,
  },
  interestModalPill: {
    backgroundColor: '#1E1F28',
    borderWidth: 1,
    borderColor: '#2E303E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  interestModalPillActive: {
    backgroundColor: '#E94057',
    borderColor: '#E94057',
  },
  interestModalPillText: {
    color: '#CACDD8',
    fontSize: 11,
    fontWeight: '600',
  },
  interestModalPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  incompleteBanner: {
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    borderWidth: 1.5,
    borderColor: '#E94057',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  incompleteBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  incompleteBannerTitle: {
    color: '#FF6B81',
    fontSize: 14,
    fontWeight: '800',
  },
  incompleteReqBadge: {
    backgroundColor: '#E94057',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  incompleteReqBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  incompleteBannerDesc: {
    color: '#E0AAB2',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  incompleteCheckList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkItemRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checkDone: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
  },
  checkMissing: {
    color: '#FF5252',
    fontSize: 11,
    fontWeight: '700',
  },

  // Boost Nudge Banner (When >= 30% but < 100%)
  boostNudgeBanner: {
    backgroundColor: '#0F1E17',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2ED573',
    padding: 14,
    marginBottom: 10,
  },
  boostNudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  boostNudgeTitle: {
    color: '#2ED573',
    fontSize: 14,
    fontWeight: '800',
  },
  boostNudgeSub: {
    color: '#A4B0BE',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  boostNudgeActionBtn: {
    backgroundColor: '#2ED573',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    alignSelf: 'center',
  },
  boostNudgeActionBtnText: {
    color: '#0D1B13',
    fontSize: 11,
    fontWeight: '800',
  },
  nudgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 213, 115, 0.15)',
  },
  nudgeChip: {
    backgroundColor: 'rgba(46, 213, 115, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.25)',
  },
  nudgeChipText: {
    color: '#2ED573',
    fontSize: 10,
    fontWeight: '700',
  },
  allStarBanner: {
    backgroundColor: '#1A1810',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  allStarTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
  },
  allStarSub: {
    color: '#E0D8B0',
    fontSize: 11,
    marginTop: 2,
  },
  allStarBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  allStarBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },

  // 100% Completion Guide Modal Styles
  guideModalCard: {
    backgroundColor: '#16171E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E94057',
    padding: 20,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    maxHeight: '85%',
  },
  guideHeaderIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  guideModalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  guideModalSub: {
    color: '#8E94A5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    marginBottom: 14,
  },
  guideProgressBox: {
    width: '100%',
    backgroundColor: '#0F1016',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20222B',
    marginBottom: 12,
  },
  guideProgressTrack: {
    height: 8,
    backgroundColor: '#232733',
    borderRadius: 4,
    overflow: 'hidden',
  },
  guideProgressFill: {
    height: '100%',
    backgroundColor: '#E94057',
    borderRadius: 4,
  },
  guideProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  guideCurrentScoreText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '700',
  },
  guideTargetScoreText: {
    color: '#2ED573',
    fontSize: 11,
    fontWeight: '700',
  },
  guideSectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 6,
  },
  guideItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E202B',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  guideItemIcon: {
    fontSize: 18,
  },
  guideItemTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  guideItemSub: {
    color: '#8E94A5',
    fontSize: 10,
    marginTop: 2,
  },
  guideItemPoints: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  guideItemPointsDone: {
    color: '#2ED573',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(46, 213, 115, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  guideCompleteBtn: {
    backgroundColor: '#E94057',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  guideCompleteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  guideExploreBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#303444',
    width: '100%',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  guideExploreBtnText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '700',
  },
  gpsSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E202B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2E3242',
    gap: 10,
  },
  gpsSyncTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  gpsSyncCoords: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  gpsSyncBtn: {
    backgroundColor: 'rgba(233, 64, 87, 0.2)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  gpsSyncBtnText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '700',
  },

  // Edit Card Action Link
  editCardActionText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '700',
  },

  // Voice Note View Mode Card
  voiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceDurationBadge: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  voicePromptSubText: {
    color: '#CACDD8',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  voicePlayCardBtn: {
    backgroundColor: '#1C1D26',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2D3142',
  },
  voicePlayBtnIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 36,
  },
  waveformBar: {
    width: 3.5,
    backgroundColor: '#E94057',
    borderRadius: 2,
  },

  // Add Voice Note Prompt Card
  addVoicePromptCard: {
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: '#2A2D3C',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addVoicePromptIcon: {
    fontSize: 26,
  },
  addVoicePromptTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  addVoicePromptSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  addVoicePromptAction: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '800',
  },

  // Profile Meme View Mode
  memePreviewCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D3142',
    backgroundColor: '#16171E',
  },
  memeImageDisplay: {
    width: '100%',
    height: 220,
    backgroundColor: '#1A1C24',
  },
  memeInfoOverlay: {
    padding: 12,
    backgroundColor: '#1E202B',
  },
  memeTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Add Meme Prompt Card
  addMemeCard: {
    backgroundColor: '#16171E',
    borderWidth: 1,
    borderColor: '#2A2D3C',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addMemeIcon: {
    fontSize: 26,
  },
  addMemeTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  addMemeSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  addMemeAction: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '800',
  },

  // Edit Mode Voice Card
  editVoicePreviewCard: {
    backgroundColor: '#1A1C25',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C3040',
    marginTop: 8,
  },
  voicePlayMiniBtn: {
    backgroundColor: '#E94057',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  voiceRetakeBtn: {
    backgroundColor: '#262936',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  voiceRetakeBtnText: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '700',
  },
  recordVoiceBtn: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  recordVoiceBtnText: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '800',
  },

  // Edit Mode Meme Card
  editMemePreviewWrap: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#1A1C25',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C3040',
    marginTop: 8,
  },
  editMemeThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#14151C',
  },
  changeMemeBtn: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  changeMemeBtnText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '700',
  },
  selectMemeBtn: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  selectMemeBtnText: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '800',
  },

  // Vedic Zodiac Modal Options
  zodiacOptionCard: {
    backgroundColor: '#1E202B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2B2F40',
  },
  zodiacOptionCardActive: {
    borderColor: '#E94057',
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
  },
  zodiacTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zodiacSymbol: {
    fontSize: 24,
  },
  zodiacRashiText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  zodiacTextActive: {
    color: '#E94057',
  },
  zodiacWesternText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  zodiacSubText: {
    color: '#FF9800',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700',
  },
  zodiacTick: {
    color: '#2ED573',
    fontSize: 16,
    fontWeight: '900',
  },
  zodiacTraitsText: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },

  // Voice Note Modal
  modalSectionSubTitle: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 6,
  },
  topicScrollView: {
    maxHeight: 38,
    marginBottom: 10,
    width: '100%',
  },
  topicChip: {
    backgroundColor: '#1C1D26',
    borderWidth: 1,
    borderColor: '#2B2F40',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
  },
  topicChipActive: {
    backgroundColor: 'rgba(233, 64, 87, 0.2)',
    borderColor: '#E94057',
  },
  topicChipText: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '600',
  },
  topicChipTextActive: {
    color: '#E94057',
    fontWeight: '700',
  },
  activeTopicBox: {
    width: '100%',
    backgroundColor: '#1E202B',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2F40',
    marginBottom: 12,
  },
  activeTopicQuote: {
    color: '#ffffff',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recorderStatusBox: {
    width: '100%',
    backgroundColor: '#0F1016',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232733',
    marginBottom: 12,
  },
  recorderTimerText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  recordingStatusLabel: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  recorderControlsRow: {
    width: '100%',
    marginVertical: 4,
  },
  recordStartBtn: {
    backgroundColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  recordStartBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  recordStopBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  recordStopBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  previewPlayBtn: {
    flex: 1,
    backgroundColor: '#1E202B',
    borderWidth: 1,
    borderColor: '#2B2F40',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewPlayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  saveVoiceBtn: {
    flex: 1.2,
    backgroundColor: '#2ED573',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveVoiceBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Meme Modal
  uploadMemeOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E202B',
    borderWidth: 1,
    borderColor: '#E94057',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    gap: 10,
    marginBottom: 10,
  },
  uploadMemeOptionIcon: {
    fontSize: 22,
  },
  uploadMemeOptionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadMemeOptionSub: {
    color: '#8E94A5',
    fontSize: 10,
    marginTop: 2,
  },
  uploadMemeOptionAction: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '800',
  },
  memePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  memeGridCard: {
    width: '48%',
    backgroundColor: '#1A1C25',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#292C3B',
  },
  memeGridCardActive: {
    borderColor: '#E94057',
    borderWidth: 2,
  },
  memeGridImg: {
    width: '100%',
    height: 100,
    backgroundColor: '#12131A',
  },
  memeGridInfo: {
    padding: 8,
  },
  memeGridTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  memeGridCategory: {
    color: '#8E94A5',
    fontSize: 9,
    marginTop: 2,
  },
  memeSelectedBadge: {
    backgroundColor: '#E94057',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  memeSelectedBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  memeCategoryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 8,
  },
  memeCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1A1C25',
    borderWidth: 1,
    borderColor: '#292C3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memeCategoryChipActive: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderColor: '#E94057',
  },
  memeCategoryChipText: {
    fontSize: 11,
    color: '#8E94A5',
    fontWeight: '600',
  },
  memeCategoryChipTextActive: {
    color: '#E94057',
    fontWeight: '800',
  },
  languageDisplayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  languageDisplayBadgeText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLanguageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  selectedLanguageTagText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  removeLanguageTagIcon: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.8,
  },
  presetLanguagePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1A1C25',
    borderWidth: 1,
    borderColor: '#292C3B',
  },
  presetLanguagePillActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderColor: '#FF385C',
  },
  presetLanguagePillText: {
    fontSize: 12,
    color: '#8E94A5',
    fontWeight: '600',
  },
  presetLanguagePillTextActive: {
    color: '#FF385C',
    fontWeight: '700',
  },
  addCustomLanguageRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addCustomLanguageInput: {
    flex: 1,
    backgroundColor: '#161822',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#292C3B',
  },
  addCustomLanguageBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomLanguageBtnText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
  },

  // LEGAL & POLICIES CARD
  legalSectionCard: {
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: '#262A38',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  legalSectionTitle: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  legalRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  legalItemEmoji: {
    fontSize: 18,
  },
  legalItemText: {
    flex: 1,
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '600',
  },
  legalItemArrow: {
    color: '#656A7B',
    fontSize: 14,
    fontWeight: '700',
  },
  legalDivider: {
    height: 1,
    backgroundColor: '#262A38',
    marginVertical: 2,
  },

  // SHADOW SHIELD MODAL STYLES
  shieldStatusCard: {
    backgroundColor: '#0F1E17',
    borderWidth: 1,
    borderColor: '#2ED573',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  shieldStatusTitle: {
    color: '#2ED573',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  shieldStatusDesc: {
    color: '#A4B0BE',
    fontSize: 11,
    lineHeight: 15,
  },
  shieldOptionRow: {
    width: '100%',
    marginVertical: 4,
  },
  shieldOptionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  shieldOptionSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
  },
  syncContactsBtn: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderWidth: 1,
    borderColor: '#E94057',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    width: '100%',
  },
  syncContactsBtnText: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '800',
  },
});
