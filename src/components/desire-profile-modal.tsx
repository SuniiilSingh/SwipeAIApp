import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { DesireProfile } from '@/types';

const { width } = Dimensions.get('window');

interface DesireProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (profile: DesireProfile) => void;
}

const WEEKEND_VIBE_OPTIONS = [
  { id: 'COFFEE_AND_BOOKS', title: 'Third Wave Coffee & Book Walk', emoji: '☕📚', desc: 'Indiranagar cafes, pour-overs, library quiet, Cubbon Park strolls' },
  { id: 'WESTERN_GHATS_TREK', title: 'Western Ghats & Road Trips', emoji: '⛰️🚗', desc: 'Early monsoon drives, mountain viewpoints, road trip playlists' },
  { id: 'INDIRANAGAR_GIGS', title: 'Craft Beers & Live Gigs', emoji: '🍸🎸', desc: 'Social butterfly, indie concerts, comedy clubs, brewery hopping' },
  { id: 'ART_AND_CINEMA', title: 'Art Galleries & Indie Cinema', emoji: '🎨🎬', desc: 'Creative exploration, film festivals, flea markets, aesthetic taste' },
  { id: 'HOME_COOKING_VINYL', title: 'Home Cooking & Vinyl Records', emoji: '🍳📻', desc: 'Sourdough baking, cozy home brunch, records playing, intimate chill' },
  { id: 'SUNRISE_FITNESS', title: 'Sunrise Runs & Outdoor Fitness', emoji: '🏃🏸', desc: 'Marathon training, bouldering, morning badminton, healthy active flow' },
];

const DIET_HARMONY_OPTIONS = [
  { id: 'ANY_DIET', label: 'Foodie Open to All Diets', emoji: '🥗🍗' },
  { id: 'VEG_SPECTRUM', label: 'Veg Spectrum (Jain, Veg, Vegan)', emoji: '🥦🪷🌱' },
  { id: 'STRICT_JAIN_ONLY', label: 'Strict Jain Preferred', emoji: '🪷' },
  { id: 'EGGETARIAN_OR_VEG', label: 'Eggetarian & Veg Friendly', emoji: '🍳' },
  { id: 'NON_VEG_FRIENDLY', label: 'Comfortable with Non-Veg', emoji: '🍗' },
];

const SMOKING_PREF_OPTIONS = [
  { id: 'NON_SMOKER_PREFERRED', label: 'Non-Smoker Only', emoji: '🚭' },
  { id: 'SOCIAL_OK', label: 'Social / Occasional', emoji: '🚬' },
  { id: 'NO_PREFERENCE', label: 'No Preference', emoji: '🤷' },
];

const DRINKING_PREF_OPTIONS = [
  { id: 'TEETOTALER_PREFERRED', label: 'Teetotaler Only', emoji: '🚫🍺' },
  { id: 'SOCIAL_DRINKER_OK', label: 'Social / Weekend Drinker', emoji: '🍷' },
  { id: 'NO_PREFERENCE', label: 'No Preference', emoji: '🤷' },
];

const BANTER_OPTIONS = [
  { id: 'DRY_WIT', label: 'Dry Wit & Satire ☕', desc: 'Subtle sarcasm and dry observational humor' },
  { id: 'WHOLESOME_GOOFY', label: 'Wholesome & Goofy 🎈', desc: 'Playful banter, cute jokes, warm giggles' },
  { id: 'DEEP_PHILOSOPHICAL', label: 'Deep Philosophical 🌌', desc: 'Late-night cosmic debates and life questions' },
  { id: 'MEMES_POP_CULTURE', label: 'Memes & Pop Culture 🍿', desc: 'Insta reels, film quotes, viral humor' },
];

const COMMUNICATION_PACE_OPTIONS = [
  { id: 'VOICE_NOTES_AND_MEMES', label: 'Voice Notes & Reels 🎙️', desc: 'Expressive audio notes throughout the day' },
  { id: 'EVENING_CALLS', label: 'Thoughtful Evening Catchup 🌙', desc: 'Focused end-of-day quality call' },
  { id: 'IN_PERSON_FIRST', label: 'Low Screen Time / In-Person First ☕', desc: 'Save the best conversations for real life' },
  { id: 'FAST_TEXTER', label: 'Fast Real-Time Texter 💬', desc: 'Quick replies and lively ping-pong banter' },
];

const LOVE_LANGUAGE_OPTIONS = [
  { id: 'QUALITY_TIME', label: 'Quality Chai & Long Talks ☕' },
  { id: 'ACTS_OF_KINDNESS', label: 'Thoughtful Gestures & Favors 🎁' },
  { id: 'WORDS_OF_AFFIRMATION', label: 'Words of Affirmation & Hype ✨' },
  { id: 'SPONTANEOUS_ADVENTURES', label: 'Spontaneous Date Adventures 🎒' },
];

const GREEN_FLAG_PRESETS = [
  'Reads physical books 📚',
  'Emotionally articulate 🧠',
  'Kind to waitstaff & drivers 🚕',
  'Orders dessert for table 🍰',
  'Has a passion side project 🚀',
  'Appreciates indie bands & ghazals 🎶',
  'Comfortable sitting in silence 🧘',
  'Remembers little details 💡',
  'Open to trying new street food 🍲',
  'Has genuine long-term friends 🤝',
];

const PROFESSION_PRESETS = [
  'Software Engineer',
  'Doctor / Healthcare',
  'Designer / Creative',
  'Founder / Entrepreneur',
  'Product Manager',
  'Finance / Investment',
  'Lawyer / Legal',
  'Architect',
  'Consultant',
  'Scientist / Researcher',
  'Teacher / Professor',
  'Writer / Journalist',
  'Chef / Culinary',
  'Photographer / Filmmaker',
  'Musician / Artist',
  'Marketing / Growth',
  'Civil Servant / Govt',
  'Student',
];

export default function DesireProfileModal({ visible, onClose, onSaved }: DesireProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'foundations' | 'vibe' | 'chemistry' | 'greenFlags'>('foundations');

  // Form State
  const [minAge, setMinAge] = useState(21);
  const [maxAge, setMaxAge] = useState(33);
  const [ageFlexible, setAgeFlexible] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState(50);
  const [dietaryHarmony, setDietaryHarmony] = useState('ANY_DIET');
  const [smokingComfort, setSmokingComfort] = useState('NON_SMOKER_PREFERRED');
  const [drinkingComfort, setDrinkingComfort] = useState('SOCIAL_DRINKER_OK');
  const [livingSituationComfort, setLivingSituationComfort] = useState('NO_PREFERENCE');
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [customProfInput, setCustomProfInput] = useState('');
  const [weekendVibe, setWeekendVibe] = useState('COFFEE_AND_BOOKS');
  const [communicationPace, setCommunicationPace] = useState('VOICE_NOTES_AND_MEMES');
  const [banterStyle, setBanterStyle] = useState('DRY_WIT');
  const [loveLanguage, setLoveLanguage] = useState('QUALITY_TIME');
  const [selectedGreenFlags, setSelectedGreenFlags] = useState<string[]>([
    'Reads physical books 📚',
    'Emotionally articulate 🧠',
    'Orders dessert for table 🍰',
  ]);
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState(
    'A creative, authentic soul in Bangalore who loves indie music, weekend road trips, and cozy chai conversations.'
  );

  const toggleProfession = (prof: string) => {
    if (selectedProfessions.includes(prof)) {
      setSelectedProfessions(selectedProfessions.filter((p) => p !== prof));
    } else {
      setSelectedProfessions([...selectedProfessions, prof]);
    }
  };

  const handleAddCustomProf = () => {
    const trimmed = customProfInput.trim();
    if (trimmed && !selectedProfessions.includes(trimmed)) {
      setSelectedProfessions([...selectedProfessions, trimmed]);
      setCustomProfInput('');
    }
  };

  useEffect(() => {
    if (visible) {
      loadDesireProfile();
    }
  }, [visible]);

  const loadDesireProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getDesireProfile();
      if (data) {
        if (data.minAge) setMinAge(data.minAge);
        if (data.maxAge) setMaxAge(data.maxAge);
        if (data.ageFlexible !== undefined) setAgeFlexible(data.ageFlexible);
        if (data.maxDistanceKm) setMaxDistanceKm(data.maxDistanceKm);
        if (data.dietaryHarmony) setDietaryHarmony(data.dietaryHarmony);
        if (data.smokingComfort) setSmokingComfort(data.smokingComfort);
        if (data.drinkingComfort) setDrinkingComfort(data.drinkingComfort);
        if (data.livingSituationComfort) setLivingSituationComfort(data.livingSituationComfort);
        if (data.preferredProfessions && Array.isArray(data.preferredProfessions)) {
          setSelectedProfessions(data.preferredProfessions);
        }
        if (data.weekendVibe) setWeekendVibe(data.weekendVibe);
        if (data.communicationPace) setCommunicationPace(data.communicationPace);
        if (data.banterStyle) setBanterStyle(data.banterStyle);
        if (data.loveLanguage) setLoveLanguage(data.loveLanguage);
        if (data.greenFlags && Array.isArray(data.greenFlags)) setSelectedGreenFlags(data.greenFlags);
        if (data.naturalLanguagePrompt) setNaturalLanguagePrompt(data.naturalLanguagePrompt);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const toggleGreenFlag = (flag: string) => {
    if (selectedGreenFlags.includes(flag)) {
      setSelectedGreenFlags(selectedGreenFlags.filter((f) => f !== flag));
    } else {
      if (selectedGreenFlags.length >= 4) {
        Alert.alert('Limit Reached', 'You can pick up to 4 secret green flags.');
        return;
      }
      setSelectedGreenFlags([...selectedGreenFlags, flag]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<DesireProfile> = {
        minAge,
        maxAge,
        ageFlexible,
        maxDistanceKm,
        dietaryHarmony,
        smokingComfort,
        drinkingComfort,
        livingSituationComfort,
        preferredProfessions: selectedProfessions,
        weekendVibe,
        communicationPace,
        banterStyle,
        loveLanguage,
        greenFlags: selectedGreenFlags,
        naturalLanguagePrompt,
      };

      const updated = await api.updateDesireProfile(payload);
      if (onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update Desire Profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>💫 My Desire Blueprint</Text>
            <Text style={styles.headerSub}>Who You Crave & Vibe With</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'foundations' && styles.tabBtnActive]}
            onPress={() => setActiveTab('foundations')}>
            <Text style={[styles.tabBtnText, activeTab === 'foundations' && styles.tabBtnTextActive]}>
              1. Foundations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'vibe' && styles.tabBtnActive]}
            onPress={() => setActiveTab('vibe')}>
            <Text style={[styles.tabBtnText, activeTab === 'vibe' && styles.tabBtnTextActive]}>
              2. Weekend Vibe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'chemistry' && styles.tabBtnActive]}
            onPress={() => setActiveTab('chemistry')}>
            <Text style={[styles.tabBtnText, activeTab === 'chemistry' && styles.tabBtnTextActive]}>
              3. Chemistry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'greenFlags' && styles.tabBtnActive]}
            onPress={() => setActiveTab('greenFlags')}>
            <Text style={[styles.tabBtnText, activeTab === 'greenFlags' && styles.tabBtnTextActive]}>
              4. AI Prompt
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#FF385C" />
            <Text style={styles.loadingText}>Syncing your Desire Blueprint...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* TAB 1: FOUNDATIONS */}
            {activeTab === 'foundations' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>🎯 Core Match Criteria & Boundaries</Text>
                <Text style={styles.sectionDesc}>
                  Define your age span, distance reach, and dietary spectrum comfort.
                </Text>

                {/* Age Span */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>🎂 Preferred Age Range</Text>
                    <Text style={styles.rangeValueText}>{minAge} - {maxAge} years</Text>
                  </View>

                  <View style={styles.stepperRow}>
                    <View style={styles.stepperGroup}>
                      <Text style={styles.stepperLabel}>Min Age</Text>
                      <View style={styles.stepperControls}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setMinAge((prev) => Math.max(18, Math.min(prev - 1, maxAge - 1)))}>
                          <Text style={styles.stepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepVal}>{minAge}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setMinAge((prev) => Math.min(prev + 1, maxAge - 1))}>
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.stepperGroup}>
                      <Text style={styles.stepperLabel}>Max Age</Text>
                      <View style={styles.stepperControls}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setMaxAge((prev) => Math.max(minAge + 1, prev - 1))}>
                          <Text style={styles.stepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepVal}>{maxAge}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setMaxAge((prev) => Math.min(prev + 1, 60))}>
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>Flexible ±2 Years</Text>
                      <Text style={styles.switchSub}>Prevents empty decks when someone is exceptionally compatible</Text>
                    </View>
                    <Switch
                      value={ageFlexible}
                      onValueChange={setAgeFlexible}
                      trackColor={{ false: '#262938', true: '#FF385C' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Maximum Distance */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>📍 Search Radius Limit</Text>
                    <Text style={styles.rangeValueText}>{maxDistanceKm} km</Text>
                  </View>
                  <View style={styles.pillWrap}>
                    {[10, 25, 50, 75, 100].map((dist) => (
                      <TouchableOpacity
                        key={dist}
                        style={[styles.choicePill, maxDistanceKm === dist && styles.choicePillActive]}
                        onPress={() => setMaxDistanceKm(dist)}>
                        <Text style={[styles.choicePillText, maxDistanceKm === dist && styles.choicePillTextActive]}>
                          {dist} km
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Dietary Spectrum Harmony */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🥗 Dietary Spectrum Compatibility</Text>
                  <Text style={styles.cardSub}>Who are you comfortable eating meals & sharing dates with?</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {DIET_HARMONY_OPTIONS.map((opt) => {
                      const isSelected = dietaryHarmony === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.radioCard, isSelected && styles.radioCardActive]}
                          onPress={() => setDietaryHarmony(opt.id)}>
                          <Text style={styles.radioEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                            {opt.label}
                          </Text>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Smoking & Drinking Comfort */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🚭 Smoking Comfort</Text>
                  <View style={styles.pillWrap}>
                    {SMOKING_PREF_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.choicePill, smokingComfort === opt.id && styles.choicePillActive]}
                        onPress={() => setSmokingComfort(opt.id)}>
                        <Text style={[styles.choicePillText, smokingComfort === opt.id && styles.choicePillTextActive]}>
                          {opt.emoji} {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.cardTitle, { marginTop: 16 }]}>🍷 Alcohol / Drinking Comfort</Text>
                  <View style={styles.pillWrap}>
                    {DRINKING_PREF_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.choicePill, drinkingComfort === opt.id && styles.choicePillActive]}
                        onPress={() => setDrinkingComfort(opt.id)}>
                        <Text style={[styles.choicePillText, drinkingComfort === opt.id && styles.choicePillTextActive]}>
                          {opt.emoji} {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Preferred Professions (Multi-Select) */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>💼 Preferred Professions</Text>
                    <Text style={styles.rangeValueText}>
                      {selectedProfessions.length === 0 ? 'Open to All' : `${selectedProfessions.length} Selected`}
                    </Text>
                  </View>
                  <Text style={styles.cardSub}>
                    Select professions you'd love to connect with. Leave empty to stay open to all careers.
                  </Text>

                  {/* Selected Professions Chips */}
                  {selectedProfessions.length > 0 && (
                    <View style={[styles.pillWrap, { marginBottom: 12 }]}>
                      {selectedProfessions.map((prof) => (
                        <TouchableOpacity
                          key={prof}
                          style={styles.selectedProfPill}
                          onPress={() => toggleProfession(prof)}>
                          <Text style={styles.selectedProfPillText}>{prof}</Text>
                          <Text style={styles.removeProfIcon}>✕</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Popular Profession Presets (Multi-select) */}
                  <View style={styles.pillWrap}>
                    {PROFESSION_PRESETS.map((prof) => {
                      const isSelected = selectedProfessions.includes(prof);
                      return (
                        <TouchableOpacity
                          key={prof}
                          style={[styles.choicePill, isSelected && styles.choicePillActive]}
                          onPress={() => toggleProfession(prof)}>
                          <Text style={[styles.choicePillText, isSelected && styles.choicePillTextActive]}>
                            {isSelected ? '✓ ' : ''}{prof}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Profession Add Row */}
                  <View style={styles.customProfRow}>
                    <TextInput
                      style={styles.customProfInput}
                      placeholder="Or type custom profession (e.g. Pilot)"
                      placeholderTextColor="#686E80"
                      value={customProfInput}
                      onChangeText={setCustomProfInput}
                    />
                    <TouchableOpacity
                      style={styles.customProfAddBtn}
                      onPress={handleAddCustomProf}>
                      <Text style={styles.customProfAddBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: WEEKEND VIBE & DATE ENERGY */}
            {activeTab === 'vibe' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>✨ Weekend Rhythm & Date Archetype</Text>
                <Text style={styles.sectionDesc}>
                  Select the lifestyle energy you crave for unforgettable Saturday & Sunday dates.
                </Text>

                <View style={{ gap: 12 }}>
                  {WEEKEND_VIBE_OPTIONS.map((opt) => {
                    const isSelected = weekendVibe === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.vibeCard, isSelected && styles.vibeCardActive]}
                        onPress={() => setWeekendVibe(opt.id)}
                        activeOpacity={0.8}>
                        <View style={styles.vibeHeaderRow}>
                          <Text style={styles.vibeEmoji}>{opt.emoji}</Text>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.vibeTitle, isSelected && styles.vibeTitleActive]}>
                              {opt.title}
                            </Text>
                            <Text style={styles.vibeDesc}>{opt.desc}</Text>
                          </View>
                          {isSelected && <Text style={styles.vibeCheck}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB 3: CHEMISTRY & COMMUNICATION */}
            {activeTab === 'chemistry' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>🧠 Communication & Chemistry Style</Text>
                <Text style={styles.sectionDesc}>
                  How your ideal match banters, communicates, and shows affection.
                </Text>

                {/* Banter & Humor */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🎭 Banter & Humor Style</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {BANTER_OPTIONS.map((opt) => {
                      const isSelected = banterStyle === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.radioCard, isSelected && styles.radioCardActive]}
                          onPress={() => setBanterStyle(opt.id)}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                              {opt.label}
                            </Text>
                            <Text style={styles.radioSub}>{opt.desc}</Text>
                          </View>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Communication Pace */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📲 Texting & Calling Rhythm</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {COMMUNICATION_PACE_OPTIONS.map((opt) => {
                      const isSelected = communicationPace === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.radioCard, isSelected && styles.radioCardActive]}
                          onPress={() => setCommunicationPace(opt.id)}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                              {opt.label}
                            </Text>
                            <Text style={styles.radioSub}>{opt.desc}</Text>
                          </View>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Love Language */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>💖 Love Language Priority</Text>
                  <View style={styles.pillWrap}>
                    {LOVE_LANGUAGE_OPTIONS.map((opt) => {
                      const isSelected = loveLanguage === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.choicePill, isSelected && styles.choicePillActive]}
                          onPress={() => setLoveLanguage(opt.id)}>
                          <Text style={[styles.choicePillText, isSelected && styles.choicePillTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 4: GREEN FLAGS & AI PROMPT */}
            {activeTab === 'greenFlags' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>🌟 Secret Green Flags & AI Match Prompt</Text>
                <Text style={styles.sectionDesc}>
                  Pick up to 4 green flags and describe your dream connection in natural language.
                </Text>

                {/* Green Flags Chips */}
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>🌿 Secret Green Flags</Text>
                    <Text style={styles.rangeValueText}>{selectedGreenFlags.length}/4 chosen</Text>
                  </View>
                  <Text style={styles.cardSub}>Tap to toggle what instantly sparks respect & attraction in you.</Text>
                  <View style={styles.pillWrap}>
                    {GREEN_FLAG_PRESETS.map((flag) => {
                      const isSelected = selectedGreenFlags.includes(flag);
                      return (
                        <TouchableOpacity
                          key={flag}
                          style={[styles.greenFlagPill, isSelected && styles.greenFlagPillActive]}
                          onPress={() => toggleGreenFlag(flag)}>
                          <Text style={[styles.greenFlagPillText, isSelected && styles.greenFlagPillTextActive]}>
                            {isSelected ? '✓ ' : '+ '} {flag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Natural Language Prompt */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🤖 Describe Your Dream Match to AI</Text>
                  <Text style={styles.cardSub}>
                    In your own words: what kind of person, vibe, or mutual wavelength are you searching for?
                  </Text>
                  <TextInput
                    style={styles.aiPromptInput}
                    multiline
                    numberOfLines={4}
                    placeholder="e.g. Someone creative and curious who loves road trips to Coorg, reads books, appreciates filter coffee, and doesn't take themselves too seriously..."
                    placeholderTextColor="#666"
                    value={naturalLanguagePrompt}
                    onChangeText={setNaturalLanguagePrompt}
                    maxLength={300}
                  />
                  <Text style={styles.charCounter}>{naturalLanguagePrompt.length}/300 characters</Text>
                </View>
              </View>
            )}

            {/* Bottom Save Action Button */}
            <TouchableOpacity style={styles.bigSaveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.bigSaveBtnText}>✨ Save & Apply Desire Blueprint</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafe: {
    flex: 1,
    backgroundColor: '#08080E',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1E2230',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#8E94A5',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveHeaderBtn: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#12141E',
    borderBottomWidth: 1,
    borderColor: '#1E2230',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    borderColor: '#FF385C',
  },
  tabBtnText: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FF385C',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E94A5',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabSection: {
    gap: 16,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDesc: {
    color: '#8E94A5',
    fontSize: 12,
    lineHeight: 17,
    marginTop: -8,
  },
  card: {
    backgroundColor: '#161822',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242838',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cardSub: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  rangeValueText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  stepperGroup: {
    alignItems: 'center',
  },
  stepperLabel: {
    color: '#8E94A5',
    fontSize: 11,
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2230',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C3246',
  },
  stepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stepBtnText: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: '800',
  },
  stepVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#222636',
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  switchSub: {
    color: '#8E94A5',
    fontSize: 10,
    marginTop: 2,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1A1C28',
    borderWidth: 1,
    borderColor: '#292C3C',
  },
  choicePillActive: {
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderColor: '#FF385C',
  },
  choicePillText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  choicePillTextActive: {
    color: '#FF385C',
    fontWeight: '700',
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C28',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242838',
  },
  radioCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  radioEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  radioLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  radioLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  radioSub: {
    color: '#8E94A5',
    fontSize: 10,
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#3D445C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#00E5FF',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
  },
  vibeCard: {
    backgroundColor: '#161822',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#242838',
  },
  vibeCardActive: {
    borderColor: '#FF385C',
    backgroundColor: 'rgba(255, 56, 92, 0.08)',
  },
  vibeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeEmoji: {
    fontSize: 28,
  },
  vibeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  vibeTitleActive: {
    color: '#FF385C',
  },
  vibeDesc: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  vibeCheck: {
    color: '#FF385C',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
  greenFlagPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1A1C28',
    borderWidth: 1,
    borderColor: '#2C3246',
  },
  greenFlagPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
  greenFlagPillText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  greenFlagPillTextActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  aiPromptInput: {
    backgroundColor: '#12141E',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#292C3C',
    minHeight: 85,
    textAlignVertical: 'top',
  },
  charCounter: {
    color: '#666',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  bigSaveBtn: {
    backgroundColor: '#FF385C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#FF385C',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bigSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selectedProfPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedProfPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeProfIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.8,
  },
  customProfRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  customProfInput: {
    flex: 1,
    backgroundColor: '#12141E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#292C3C',
  },
  customProfAddBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customProfAddBtnText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
  },
});
