import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { hapticFeedback } from '@/utils/haptics';
import { UserProfile } from '@/types';

interface VibeQuizOption {
  id: string;
  label: string;
  tagKey: 'vacationPreference' | 'livingStatus' | 'drinkingHabit' | 'hobbies';
  tagValue: any;
}

interface VibeQuizCardProps {
  feedDimensions: { width: number; height: number };
  userProfile?: UserProfile | null;
  onAnswered: (tagKey: string, tagValue: any) => void;
  onSkip: () => void;
}

export const VibeQuizCard: React.FC<VibeQuizCardProps> = ({
  feedDimensions,
  userProfile,
  onAnswered,
  onSkip,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Determine which question to ask based on what's missing
  let questionTitle = 'Weekend Vacation Vibe? ✈️';
  let questionSubtitle = 'Where does your soul recharge? Matches you with similar travelers.';
  let options: VibeQuizOption[] = [
    { id: 'MOUNTAINS', label: 'Majestic Mountains 🏔️', tagKey: 'vacationPreference', tagValue: 'Majestic Mountains 🏔️' },
    { id: 'BEACHES', label: 'Sunny Beaches 🏖️', tagKey: 'vacationPreference', tagValue: 'Sunny Beaches 🏖️' },
    { id: 'BOTH', label: 'Both (Mountains & Beaches) 🌊⛰️', tagKey: 'vacationPreference', tagValue: 'Both (Mountain Streams & Beach Sunsets) 🌊⛰️' },
    { id: 'CITY_BREAKS', label: 'Vibrant City Breaks 🏙️', tagKey: 'vacationPreference', tagValue: 'Vibrant City Breaks 🏙️' },
  ];

  if (userProfile?.vacationPreference && !userProfile?.livingStatus) {
    questionTitle = 'What is your living setup? 🏡';
    questionSubtitle = 'Helps find matches with harmonious lifestyle rhythm.';
    options = [
      { id: 'INDEPENDENT_FLAT', label: 'Independent Flat 🏙️', tagKey: 'livingStatus', tagValue: 'INDEPENDENT_FLAT' },
      { id: 'WITH_PARENTS', label: 'Living with Parents 👨‍👩‍👧', tagKey: 'livingStatus', tagValue: 'WITH_PARENTS' },
      { id: 'PG', label: 'PG / Co-Living 🏠', tagKey: 'livingStatus', tagValue: 'PG' },
    ];
  } else if (userProfile?.vacationPreference && userProfile?.livingStatus && !userProfile?.drinkingHabit) {
    questionTitle = 'Friday night drink energy? 🍷';
    questionSubtitle = 'Zero awkwardness on your first date vibe.';
    options = [
      { id: 'SOCIAL', label: 'Social / Weekend Drinker 🍷', tagKey: 'drinkingHabit', tagValue: 'Social / Weekend Drinker 🍷' },
      { id: 'NON_DRINKER', label: 'Non-Drinker / Teetotaler 🚫🍺', tagKey: 'drinkingHabit', tagValue: 'Non-Drinker / Teetotaler 🚫🍺' },
      { id: 'REGULAR', label: 'Regular Drinker 🍻', tagKey: 'drinkingHabit', tagValue: 'Regular Drinker 🍻' },
      { id: 'SOBER', label: 'Sober / Mindful 🧘', tagKey: 'drinkingHabit', tagValue: 'Sober / Mindful 🧘' },
    ];
  } else if (userProfile?.vacationPreference && userProfile?.livingStatus && userProfile?.drinkingHabit) {
    questionTitle = 'Pick your creative hobby 🎨';
    questionSubtitle = 'Sparks automatic chemistry on shared weekend pursuits.';
    options = [
      { id: 'TREKKING', label: 'Trekking & Hiking 🥾', tagKey: 'hobbies', tagValue: 'Trekking & Hiking 🥾' },
      { id: 'COFFEE', label: 'Specialty Coffee ☕', tagKey: 'hobbies', tagValue: 'Specialty Coffee ☕' },
      { id: 'PHOTOGRAPHY', label: 'Photography & Art 📷', tagKey: 'hobbies', tagValue: 'Photography 📷' },
      { id: 'COOKING', label: 'Cooking & Food Trails 🍳', tagKey: 'hobbies', tagValue: 'Cooking & Baking 🍳' },
    ];
  }

  const handleSelect = (opt: VibeQuizOption) => {
    if (confirmed) return;
    hapticFeedback.success();
    setSelectedOptionId(opt.id);
    setConfirmed(true);

    // Call onAnswered
    onAnswered(opt.tagKey, opt.tagValue);
  };

  return (
    <View style={[styles.container, { width: feedDimensions.width, height: feedDimensions.height }]}>
      <View style={styles.card}>
        {/* Top Header Badge */}
        <View style={styles.topHeaderRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>⚡ 1-TAP VIBE CHECK</Text>
          </View>
          <Text style={styles.multiplierText}>+5% Reach Multiplier 🔥</Text>
        </View>

        {/* Question Title & Subtitle */}
        <Text style={styles.questionTitle}>{questionTitle}</Text>
        <Text style={styles.questionSubtitle}>{questionSubtitle}</Text>

        {/* Options List */}
        <View style={styles.optionsWrap}>
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionBtn,
                  isSelected && styles.optionBtnSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelect(opt)}>
                <Text style={[styles.optionBtnText, isSelected && styles.optionBtnTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                ) : (
                  <Text style={styles.arrowIcon}>❯</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Confirmation */}
        {confirmed ? (
          <View style={styles.confirmedBanner}>
            <Text style={styles.confirmedBannerText}>
              🎉 Vibe Locked! Match Reach Multiplier Boosted 🔥
            </Text>
          </View>
        ) : null}

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip for now ❯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090B10',
  },
  card: {
    width: '100%',
    backgroundColor: '#12151F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 56, 92, 0.18)',
    borderColor: '#FF385C',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePillText: {
    color: '#FF385C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  multiplierText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  questionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  questionSubtitle: {
    color: '#8E94A5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  optionsWrap: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(255, 56, 92, 0.2)',
    borderColor: '#FF385C',
  },
  optionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionBtnTextSelected: {
    color: '#FF385C',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF385C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  arrowIcon: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmedBanner: {
    marginTop: 16,
    backgroundColor: 'rgba(46, 213, 115, 0.16)',
    borderColor: '#2ED573',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  confirmedBannerText: {
    color: '#2ED573',
    fontSize: 12,
    fontWeight: '800',
  },
  skipBtn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
