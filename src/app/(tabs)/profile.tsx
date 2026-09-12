import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';
import { DatingIntent, DietaryPreference, LivingStatus, UserProfile } from '@/types';

const { width } = Dimensions.get('window');

// MatchAI Presets
const INTERESTS_PRESETS = [
  'Soul music', 'Hip hop', 'Skincare', 'Musical theatre', 'J-Pop', 'Cricket',
  'Freelancing', 'K-Pop', 'Skateboarding', 'Pop music', 'Punk rock',
  'Trying new things', 'Photography', 'Bollywood', 'Reading', 'Singing',
  'Rap music', 'Sports', 'Poetry', 'Stand-up comedy', 'Coffee', 'Karaoke',
  'Fortnite', 'Self-development', 'Mental health awareness', 'Food tours',
  'Climate change', 'Walking my dog', 'Feminism', 'Escape rooms', 'Shopping',
  'Brunch', 'Jetskiing', 'Jogging', 'Harry Potter', 'Self-care', 'Heavy metal',
  'House parties', 'Gymnastics', 'Ludo', 'Biryani', 'Meditation', 'Foodie',
  'Sushi', 'Spotify', 'Hockey', 'Basketball', 'Fantasy films', 'Home workouts',
  'Theatre', 'Café hopping', 'Aquarium', 'Instagram', 'Walking', 'Running',
  'Travel', 'Films', 'Gym', 'Social media'
];

const JOB_PRESETS = [
  'Software Engineer', 'Doctor', 'Designer', 'Student', 'Artist', 'Manager',
  'Entrepreneur', 'Teacher', 'Writer', 'Chef', 'Lawyer', 'Consultant',
  'Photographer', 'Architect', 'Scientist', 'Musician', 'Product Manager',
  'Freelancer', 'Finance Analyst', 'Other'
];

const EDUCATION_PRESETS = [
  '8th pass', '10th pass', '12th pass', 'High School', 'Bachelors Degree', 'Masters Degree', 'PhD / Doctorate',
  'Stanford University', 'Harvard University', 'MIT', 'Oxford University',
  'Cambridge University', 'University of California', 'Delhi University',
  'IIT', 'IIM', 'BITS Pilani', 'Self-Taught', 'Other'
];

const SEXUAL_ORIENTATION_PRESETS = [
  'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Demisexual', 'Pansexual', 'Queer', 'Other'
];

const GENDER_PRESETS = [
  'Man', 'Woman', 'Non-binary', 'Transgender', 'Agender', 'Bigender', 'Genderfluid', 'Other'
];

const GENDER_PREFERENCE_PRESETS = [
  'Women', 'Men', 'Everyone', 'Other'
];

const RELATIONSHIP_INTENT_PRESETS = [
  'Long-term partner',
  'Long-term, open to short',
  'Short-term, open to long',
  'Short-term fun',
  'New friends',
  'Still figuring it out',
  'Other'
];

const PROMPT_PRESETS = [
  'The key to my heart is...',
  'My most controversial opinion is...',
  'First concert I ever went to was...',
  'I’m looking for someone who...',
  'We’ll get along if...',
  'A boundary of mine is...',
  'My favorite weekend activity is...',
  'A random fact I love is...'
];

const DIETARY_OPTIONS: { key: DietaryPreference; label: string; emoji: string }[] = [
  { key: 'STRICT_JAIN', label: 'Strict Jain (No Root Veg)', emoji: '🪷' },
  { key: 'PURE_VEG', label: 'Pure Veg', emoji: '🥦' },
  { key: 'VEGAN', label: 'Vegan (Plant-Based)', emoji: '🌱' },
  { key: 'EGGETARIAN', label: 'Eggetarian', emoji: '🍳' },
  { key: 'NON_VEG', label: 'Non-Veg', emoji: '🍗' },
];

const LIVING_OPTIONS: { key: LivingStatus; label: string; emoji: string }[] = [
  { key: 'WITH_PARENTS', label: 'Living with Parents', emoji: '👨‍👩‍👧' },
  { key: 'INDEPENDENT_FLAT', label: 'Independent Flat', emoji: '🏙️' },
  { key: 'PG', label: 'PG / Co-Living', emoji: '🏠' },
];

const SMOKING_OPTIONS = [
  { key: 'NON_SMOKER', label: 'Non-Smoker', emoji: '🚭' },
  { key: 'OCCASIONAL', label: 'Social / Occasional', emoji: '🚬' },
  { key: 'REGULAR', label: 'Regular Smoker', emoji: '🚬' },
  { key: 'TRYING_TO_QUIT', label: 'Trying to Quit', emoji: '🌿' },
];

const DRINKING_OPTIONS = [
  { key: 'NON_DRINKER', label: 'Non-Drinker / Teetotaler', emoji: '🚫🍺' },
  { key: 'SOCIAL_DRINKER', label: 'Social / Weekend Drinker', emoji: '🍷' },
  { key: 'REGULAR_DRINKER', label: 'Regular Drinker', emoji: '🍻' },
  { key: 'SOBER', label: 'Sober / Mindful', emoji: '🧘' },
];

const VACATION_OPTIONS = [
  { key: 'MOUNTAINS', label: 'Majestic Mountains', emoji: '🏔️' },
  { key: 'BEACHES', label: 'Sunny Beaches', emoji: '🏖️' },
  { key: 'BOTH', label: 'Both (Mountain Streams & Beach Sunsets)', emoji: '🌊⛰️' },
  { key: 'CITY_BREAKS', label: 'Vibrant City Breaks', emoji: '🏙️' },
];

const HOBBIES_PRESETS = [
  'Photography 📷', 'Cooking & Baking 🍳', 'Trekking & Hiking 🥾', 'Cycling 🚴',
  'Reading & Books 📚', 'Gym & Fitness 🏋️', 'Yoga & Meditation 🧘', 'Painting & Art 🎨',
  'Gaming 🎮', 'Gardening 🪴', 'Writing & Poetry ✍️', 'Music Production 🎧',
  'Solo Travel ✈️', 'Specialty Coffee ☕', 'Board Games 🎲', 'Swimming 🏊',
  'Badminton 🏸', 'Film Making 🎬', 'Dog Fostering 🐕', 'Pottery 🏺'
];

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit form states
  const [setupFullname, setSetupFullname] = useState('');
  const [setupDateOfBirth, setSetupDateOfBirth] = useState('');
  const [setupHeight, setSetupHeight] = useState('');
  const [setupLocation, setSetupLocation] = useState('');
  const [setupMaxDistanceKm, setSetupMaxDistanceKm] = useState('50');
  const [setupGenderDisplay, setSetupGenderDisplay] = useState('');
  const [setupShowGender, setSetupShowGender] = useState(true);
  const [setupPreferenceDisplay, setSetupPreferenceDisplay] = useState('');
  const [setupJob, setSetupJob] = useState('');
  const [setupEducation, setSetupEducation] = useState('');
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
  const [setupPhoto1, setSetupPhoto1] = useState('');
  const [setupPhoto2, setSetupPhoto2] = useState('');
  const [setupPhoto3, setSetupPhoto3] = useState('');
  const [setupPhoto4, setSetupPhoto4] = useState('');
  const [setupPhoto5, setSetupPhoto5] = useState('');
  const [setupPhoto6, setSetupPhoto6] = useState('');
  const [setupSelfie, setSetupSelfie] = useState('');
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

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

  // New Dietary & Living Picker Modals
  const [showDietPickerModal, setShowDietPickerModal] = useState(false);
  const [showLivingPickerModal, setShowLivingPickerModal] = useState(false);

  // Lifestyle Picker Modals
  const [showSmokingPickerModal, setShowSmokingPickerModal] = useState(false);
  const [showDrinkingPickerModal, setShowDrinkingPickerModal] = useState(false);
  const [showVacationPickerModal, setShowVacationPickerModal] = useState(false);
  const [showHobbiesPickerModal, setShowHobbiesPickerModal] = useState(false);
  const [tempHobbies, setTempHobbies] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const p = await api.getMyProfile();
    setProfile(p);
    populateFormStates(p);
    setLoading(false);
  };

  const populateFormStates = (p: UserProfile) => {
    setSetupFullname(p.fullName || p.displayName || '');
    if (p.birthDate) {
      setSetupDateOfBirth(p.birthDate);
      const parts = p.birthDate.split('-');
      if (parts.length === 3) {
        setPickerYear(parseInt(parts[0], 10) || 2000);
        setPickerMonth(parseInt(parts[1], 10) || 8);
        setPickerDay(parseInt(parts[2], 10) || 15);
      }
    } else if (p.age && p.age > 0) {
      const yr = new Date().getFullYear() - p.age;
      setSetupDateOfBirth(`${yr}-01-01`);
      setPickerYear(yr);
      setPickerMonth(1);
      setPickerDay(1);
    } else {
      setSetupDateOfBirth('');
    }
    setSetupHeight(p.height ? String(p.height) : '');
    setSetupLocation(p.location || p.city || '');
    setSetupMaxDistanceKm(p.maxDistanceKm ? String(p.maxDistanceKm) : '50');
    setSetupGenderDisplay(p.genderDisplay || (p.gender === 'FEMALE' ? 'Woman' : (p.gender === 'MALE' ? 'Man' : '')));
    setSetupShowGender(p.showGenderOnProfile !== undefined ? p.showGenderOnProfile : true);
    setSetupPreferenceDisplay(p.genderPreferenceDisplay || '');
    setSetupJob(p.job || p.occupation || '');
    setSetupEducation(p.education || '');
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
    setSetupPhoto1(p.photo1 || p.photos?.[0] || '');
    setSetupPhoto2(p.photo2 || p.photos?.[1] || '');
    setSetupPhoto3(p.photo3 || p.photos?.[2] || '');
    setSetupPhoto4(p.photo4 || '');
    setSetupPhoto5(p.photo5 || '');
    setSetupPhoto6(p.photo6 || '');
    setSetupSelfie(p.selfieUrl || '');
  };

  const getDietaryLabel = (key?: DietaryPreference) => {
    const item = DIETARY_OPTIONS.find(d => d.key === key);
    return item ? `${item.emoji} ${item.label}` : 'Select dietary preference';
  };

  const getLivingLabel = (key?: LivingStatus) => {
    const item = LIVING_OPTIONS.find(l => l.key === key);
    return item ? `${item.emoji} ${item.label}` : 'Select living arrangement';
  };

  // MatchAI Profile Completion Calculation
  const calculateLocalPct = () => {
    let pct = 0;
    if (setupFullname && setupFullname.trim()) pct += 10;
    if (setupDateOfBirth && setupDateOfBirth.trim()) pct += 10;
    if (setupGenderDisplay) pct += 10;
    if (setupPreferenceDisplay) pct += 10;
    if (setupBio && setupBio.trim()) pct += 10;
    if (setupJob && setupJob.trim()) pct += 10;
    if (setupEducation && setupEducation.trim()) pct += 10;

    const interestSplit = (setupInterests || '').split(',');
    const intCount = interestSplit.map(i => i.trim()).filter(i => i).length;
    if (intCount >= 3) {
      pct += 10;
    } else if (intCount > 0) {
      pct += intCount * 3;
    }

    if (setupPhoto1 && setupPhoto1.trim()) pct += 5;
    if (setupPhoto2 && setupPhoto2.trim()) pct += 5;
    if (setupPhoto3 && setupPhoto3.trim()) pct += 5;
    if (setupPhoto4 && setupPhoto4.trim()) pct += 5;
    if (setupPhoto5 && setupPhoto5.trim()) pct += 5;
    if (setupPhoto6 && setupPhoto6.trim()) pct += 5;
    if (setupSelfie && setupSelfie.trim()) pct += 5;

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
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const localUri = asset.uri;
        const directBase64 = asset.base64;
        
        // Instantly display local image in slot
        setter(localUri);
        setUploadingSlot(slotIdx);

        // Instantly update the main profile view so it shows immediately inside profile!
        setProfile(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (slotIdx === 1) updated.photo1 = localUri;
          else if (slotIdx === 2) updated.photo2 = localUri;
          else if (slotIdx === 3) updated.photo3 = localUri;
          else if (slotIdx === 4) updated.photo4 = localUri;
          else if (slotIdx === 5) updated.photo5 = localUri;
          else if (slotIdx === 6) updated.photo6 = localUri;
          const photos = [
            slotIdx === 1 ? localUri : setupPhoto1,
            slotIdx === 2 ? localUri : setupPhoto2,
            slotIdx === 3 ? localUri : setupPhoto3,
            slotIdx === 4 ? localUri : setupPhoto4,
            slotIdx === 5 ? localUri : setupPhoto5,
            slotIdx === 6 ? localUri : setupPhoto6,
          ].filter((p): p is string => !!p && p.trim() !== '');
          updated.photos = photos;
          return updated;
        });

        try {
          const uploadedUrl = await api.uploadImage(localUri, directBase64);
          if (uploadedUrl && uploadedUrl.trim() !== '') {
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
              ].filter((p): p is string => !!p && p.trim() !== '');
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
            ].filter((p): p is string => !!p && p.trim() !== '');

            api.updateMyProfile({
              [`photo${slotIdx}`]: uploadedUrl,
              photos: syncPhotos,
            } as any).catch(err => {
              console.warn('Profile sync warning:', err);
            });
          }
        } catch (err) {
          console.warn('Photo upload failed:', err);
        } finally {
          setUploadingSlot(null);
        }
      }
    } catch (e) {
      console.warn('Image picker error:', e);
      setUploadingSlot(null);
    }
  };

  const handleTakeSelfie = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is needed to take a selfie.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const localUri = asset.uri;
        const directBase64 = asset.base64;
        setSetupSelfie(localUri);
        setUploadingSelfie(true);
        setProfile(prev => prev ? ({ ...prev, selfieUrl: localUri }) : prev);
        try {
          const uploadedUrl = await api.uploadImage(localUri, directBase64);
          if (uploadedUrl && uploadedUrl.trim() !== '') {
            setSetupSelfie(uploadedUrl);
            setProfile(prev => prev ? ({ ...prev, selfieUrl: uploadedUrl }) : prev);
            api.updateMyProfile({ selfieUrl: uploadedUrl }).catch(() => {});
          }
        } catch (err) {
          console.warn('Selfie upload failed:', err);
        } finally {
          setUploadingSelfie(false);
        }
      }
    } catch (e) {
      console.warn('Camera selfie error:', e);
      setUploadingSelfie(false);
    }
  };

  const handleSaveAllChanges = async () => {
    setLoading(true);
    const photosList = [setupPhoto1, setupPhoto2, setupPhoto3, setupPhoto4, setupPhoto5, setupPhoto6]
      .filter((p): p is string => !!p && p.trim() !== '');

    const updated = await api.updateMyProfile({
      displayName: setupFullname.split(' ')[0] || 'User',
      fullName: setupFullname,
      bio: setupBio,
      dietaryPref: setupDiet,
      livingStatus: setupLiving,
      smokingHabit: setupSmoking,
      drinkingHabit: setupDrinking,
      vacationPreference: setupVacation,
      hobbies: setupHobbies,
      job: setupJob,
      occupation: setupJob,
      education: setupEducation,
      interests: setupInterests,
      height: setupHeight ? parseInt(setupHeight) : 165,
      location: setupLocation,
      maxDistanceKm: setupMaxDistanceKm ? parseInt(setupMaxDistanceKm) : 50,
      sexualOrientation: setupOrientation,
      showOrientationOnProfile: setupShowOrientation,
      genderDisplay: setupGenderDisplay,
      showGenderOnProfile: setupShowGender,
      genderPreferenceDisplay: setupPreferenceDisplay,
      relationshipIntent: setupIntent,
      profilePromptQuestion: setupPromptQuestion,
      profilePromptAnswer: setupPromptAnswer,
      photo1: setupPhoto1,
      photo2: setupPhoto2,
      photo3: setupPhoto3,
      photo4: setupPhoto4,
      photo5: setupPhoto5,
      photo6: setupPhoto6,
      selfieUrl: setupSelfie,
      birthDate: setupDateOfBirth || undefined,
      photos: photosList,
      completionPercentage: calculateLocalPct(),
    });

    setProfile(updated);
    populateFormStates(updated);
    setIsEditingProfile(false);
    setLoading(false);
    Alert.alert('Profile Saved ✓', 'All changes and photos updated successfully!');
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
            <TouchableOpacity onPress={() => setIsEditingProfile(false)} style={styles.cancelBtn}>
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
        {/* Real-Time Profile Completion Progress Bar */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.completionCard}
          onPress={() => setIsEditingProfile(true)}>
          <View style={styles.completionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.completionEmoji}>⚡</Text>
              <Text style={styles.completionTitle}>Profile Completion</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.completionScoreText, completionScore >= 80 ? styles.scoreGreen : styles.scoreRed]}>
                {completionScore}%
              </Text>
              {!isEditingProfile && <Text style={styles.completionEditLink}>Tap to Complete →</Text>}
            </View>
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
          {completionScore < 100 && (
            <Text style={styles.completionHint}>
              💡 Add more photos, work, diet & prompt answer to boost profile matches by 3.4x!
            </Text>
          )}
        </TouchableOpacity>

        {/* VIEW PROFILE MODE */}
        {!isEditingProfile && (
          <View style={{ width: '100%' }}>
            {/* Photos Carousel */}
            {(() => {
              const carouselPhotos = [
                profile.photo1,
                profile.photo2,
                profile.photo3,
                profile.photo4,
                profile.photo5,
                profile.photo6,
                ...(profile.photos || []),
              ].filter((img, i, arr): img is string => !!img && typeof img === 'string' && img.trim() !== '' && arr.indexOf(img) === i);

              if (carouselPhotos.length > 0) {
                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
                    {carouselPhotos.map((img, idx) => (
                      <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => setIsEditingProfile(true)}>
                        <Image source={{ uri: img }} style={styles.carouselImage} contentFit="cover" transition={200} />
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

              {profile.job || profile.occupation ? (
                <Text style={styles.occupationText}>💼 {profile.job || profile.occupation} {profile.company ? `@ ${profile.company}` : ''}</Text>
              ) : null}

              {profile.education ? (
                <Text style={styles.subDetailText}>🎓 {profile.education}</Text>
              ) : null}

              {profile.height ? (
                <Text style={styles.subDetailText}>📏 Height: {profile.height} cm</Text>
              ) : null}

              <Text style={styles.locText}>📍 {profile.location || profile.city || 'Location not set'} ({profile.maxDistanceKm || 50} km match radius)</Text>

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
                    <Text style={styles.traitValue}>👤 {profile.genderDisplay || profile.gender || 'Not set'}</Text>
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

            {/* Modern Cosmic Chemistry */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>✨ Modern Cosmic Chemistry</Text>
              <View style={styles.astroRow}>
                <View style={styles.astroPill}>
                  <Text style={styles.astroLabel}>Sun Sign</Text>
                  <Text style={styles.astroValue}>{profile.sunSign || 'Not set'}</Text>
                </View>
                <View style={styles.astroPill}>
                  <Text style={styles.astroLabel}>Moon Sign</Text>
                  <Text style={styles.astroValue}>{profile.moonSign || 'Not set'}</Text>
                </View>
                <View style={styles.astroPill}>
                  <Text style={styles.astroLabel}>Vibe</Text>
                  <Text style={styles.astroValue}>{profile.sunSign ? 'Warm Anchor' : 'Not calculated'}</Text>
                </View>
              </View>
            </View>

            {/* Privacy & Safe Date Shortcuts */}
            <TouchableOpacity style={styles.privacyHubCard} onPress={() => router.push('/auth')}>
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

            {/* Log Out */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                api.logout();
                router.replace('/auth');
              }}>
              <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
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
                  const hasPhoto = !!item.uri;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.photoSlot, !hasPhoto && styles.photoSlotEmpty]}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (hasPhoto) {
                          Alert.alert('Profile Photo', 'Do you want to change or delete this photo?', [
                            { text: 'Change Photo 📸', onPress: () => handlePickPhoto(item.slotIdx, item.setter) },
                            { text: 'Delete Photo 🗑️', onPress: () => {
                              item.setter('');
                              setProfile(prev => {
                                if (!prev) return prev;
                                const updated = { ...prev, [`photo${item.slotIdx}`]: '' };
                                const photos = [
                                  item.slotIdx === 1 ? '' : setupPhoto1,
                                  item.slotIdx === 2 ? '' : setupPhoto2,
                                  item.slotIdx === 3 ? '' : setupPhoto3,
                                  item.slotIdx === 4 ? '' : setupPhoto4,
                                  item.slotIdx === 5 ? '' : setupPhoto5,
                                  item.slotIdx === 6 ? '' : setupPhoto6,
                                ].filter((p): p is string => !!p && p.trim() !== '');
                                updated.photos = photos;
                                return updated;
                              });
                              const syncPhotos = [
                                item.slotIdx === 1 ? '' : setupPhoto1,
                                item.slotIdx === 2 ? '' : setupPhoto2,
                                item.slotIdx === 3 ? '' : setupPhoto3,
                                item.slotIdx === 4 ? '' : setupPhoto4,
                                item.slotIdx === 5 ? '' : setupPhoto5,
                                item.slotIdx === 6 ? '' : setupPhoto6,
                              ].filter((p): p is string => !!p && p.trim() !== '');
                              api.updateMyProfile({ [`photo${item.slotIdx}`]: '', photos: syncPhotos } as any).catch(() => {});
                            }, style: 'destructive' },
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        } else {
                          handlePickPhoto(item.slotIdx, item.setter);
                        }
                      }}>
                      {hasPhoto ? (
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.photoImg}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                          onError={(e) => {
                            console.warn(`Slot ${item.slotIdx} image render error:`, e);
                            if (e && JSON.stringify(e).includes('404')) {
                              item.setter('');
                              setProfile(prev => prev ? ({ ...prev, [`photo${item.slotIdx}`]: '' }) : prev);
                            }
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
                      <View style={[styles.photoActionBadge, hasPhoto && styles.photoActionBadgeDelete]}>
                        <Text style={styles.photoActionBadgeText}>{hasPhoto ? '×' : '+'}</Text>
                      </View>
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
              <TouchableOpacity style={styles.selfieCard} activeOpacity={0.8} onPress={handleTakeSelfie}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ position: 'relative', width: 48, height: 48 }}>
                    {setupSelfie ? (
                      <Image
                        source={{ uri: setupSelfie }}
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
              />

              <View style={styles.formGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={setupHeight}
                    onChangeText={setSetupHeight}
                    placeholder="e.g. 165"
                    placeholderTextColor="#6B7082"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Location / City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={setupLocation}
                    onChangeText={setSetupLocation}
                    placeholder="e.g. Bengaluru"
                    placeholderTextColor="#6B7082"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Search Distance Radius (Km)</Text>
              <TextInput
                style={styles.textInput}
                value={setupMaxDistanceKm}
                onChangeText={setSetupMaxDistanceKm}
                placeholder="50"
                placeholderTextColor="#6B7082"
                keyboardType="numeric"
              />

              {/* Date of Birth Picker Button */}
              <Text style={styles.inputLabel}>Date of Birth 📅</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowDobPickerModal(true)}>
                <Text style={styles.pickerFieldText}>
                  {setupDateOfBirth || 'Select Birth Date (Day / Month / Year)'}
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

            {/* Profession, Education & Orientation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💼 Profession & Education</Text>

              <Text style={styles.inputLabel}>Job / Occupation</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowJobPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupJob || 'Select Occupation 💼'}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Education</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowEduPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupEducation || 'Select Education 🎓'}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Sexual Orientation</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowOrientationPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupOrientation || 'Select Orientation 🏳️‍🌈'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSetupShowOrientation(prev => !prev)}>
                <View style={[styles.checkboxBox, setupShowOrientation && styles.checkboxActive]}>
                  {setupShowOrientation && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Show orientation on my profile</Text>
              </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>🗣️ Profile Prompt / Icebreaker</Text>

              <Text style={styles.inputLabel}>Prompt Question</Text>
              <TouchableOpacity
                style={styles.pickerFieldBtn}
                onPress={() => setShowPromptPickerModal(true)}>
                <Text style={styles.pickerFieldText}>{setupPromptQuestion}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Your Witty Answer</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                value={setupPromptAnswer}
                onChangeText={setSetupPromptAnswer}
                placeholder="Type your funny or interesting answer..."
                placeholderTextColor="#6B7082"
                multiline
              />
            </View>

            {/* Bio Description */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>✍️ Bio Description</Text>
              <TextInput
                style={[styles.textInput, { height: 90 }]}
                value={setupBio}
                onChangeText={setSetupBio}
                placeholder="Tell your story, quirky habits, favorite food..."
                placeholderTextColor="#6B7082"
                multiline
              />
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

      {/* ========================================================================= */}
      {/* MODAL PICKERS */}
      {/* ========================================================================= */}

      {/* 1. Date of Birth Picker Modal */}
      <Modal visible={showDobPickerModal} transparent animationType="slide">
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
          </View>
        </View>
      </Modal>

      {/* 2. Dietary Preference Modal Picker */}
      <Modal visible={showDietPickerModal} transparent animationType="slide">
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

      {/* 3. Living Situation Modal Picker */}
      <Modal visible={showLivingPickerModal} transparent animationType="slide">
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

      {/* 3B. Smoking Modal Picker */}
      <Modal visible={showSmokingPickerModal} transparent animationType="slide">
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

      {/* 3C. Drinking Modal Picker */}
      <Modal visible={showDrinkingPickerModal} transparent animationType="slide">
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

      {/* 3D. Vacation Vibe: Mountains vs Beaches Modal Picker */}
      <Modal visible={showVacationPickerModal} transparent animationType="slide">
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

      {/* 3E. Hobbies Multi-Select Modal */}
      <Modal visible={showHobbiesPickerModal} transparent animationType="slide">
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

      {/* 4. Job / Occupation Picker Modal */}
      <Modal visible={showJobPickerModal} transparent animationType="slide">
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

      {/* 5. Education Picker Modal */}
      <Modal visible={showEduPickerModal} transparent animationType="slide">
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

      {/* 6. Interests Multi-Select Modal */}
      <Modal visible={showInterestPickerModal} transparent animationType="slide">
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

      {/* 7. Sexual Orientation Modal */}
      <Modal visible={showOrientationPickerModal} transparent animationType="slide">
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

      {/* 8. Gender Modal */}
      <Modal visible={showGenderPickerModal} transparent animationType="slide">
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

      {/* 9. Gender Preference Modal */}
      <Modal visible={showPreferencePickerModal} transparent animationType="slide">
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

      {/* 10. Intent Modal */}
      <Modal visible={showIntentPickerModal} transparent animationType="slide">
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

      {/* 11. Prompt Question Modal */}
      <Modal visible={showPromptPickerModal} transparent animationType="slide">
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
    marginBottom: 16,
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
    marginBottom: 14,
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
});
