import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticFeedback } from '@/utils/haptics';

export interface DateProposalPayload {
  date: string;
  time: string;
  timeVibe: string;
  venue: string;
  note: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

interface LuxuryDateProposalModalProps {
  visible: boolean;
  onClose: () => void;
  onSendProposal: (proposal: DateProposalPayload) => void;
  candidateName?: string;
  isSending?: boolean;
  userGender?: string;
}

const DAYTIME_TIME_SLOTS = [
  { time: '9:00 AM', vibe: 'Morning Coffee ☕', badge: 'Quiet' },
  { time: '10:30 AM', vibe: 'Coffee & Croissant 🥐', badge: 'Top Pick' },
  { time: '12:00 PM', vibe: 'Weekend Brunch 🥑', badge: 'Popular' },
  { time: '1:30 PM', vibe: 'Lunch Date & Walk 🥪', badge: 'Relaxed' },
];

const EVENING_TIME_SLOTS = [
  { time: '4:00 PM', vibe: 'Low-key Chai 🫖', badge: 'Afternoon' },
  { time: '6:00 PM', vibe: 'Sunset Drinks 🌇', badge: 'Golden Hour' },
  { time: '8:00 PM', vibe: 'Dinner Prime 🍸', badge: 'Romantic' },
  { time: '9:30 PM', vibe: 'Late Night Jazz 🎷', badge: 'Acoustic' },
];

const CURATED_VENUES = [
  { name: 'Blue Tokai Coffee, Indiranagar', desc: 'Artisanal roastery & relaxed banter • 12th Main' },
  { name: 'Toit Brewpub, Indiranagar', desc: 'Craft beers & rooftop energy • Indiranagar 100ft Rd' },
  { name: 'The Reservoire, Koramangala', desc: 'Candlelit cocktails & live acoustic • 5th Block' },
  { name: 'Smoke House Deli, Lavelle Road', desc: 'Chic European bistro & wine • Lavelle Rd' },
];

export default function LuxuryDateProposalModal({
  visible,
  onClose,
  onSendProposal,
  candidateName = 'your match',
  isSending = false,
  userGender,
}: LuxuryDateProposalModalProps) {
  // Check if non-male user (for SafeDate emergency contact feature)
  const isNonMale = userGender ? userGender.toUpperCase() !== 'MALE' : true;
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Hydrate saved emergency contact (synced with Safe Date spots)
  useEffect(() => {
    AsyncStorage.getItem('@blunderr_emergency_contact').then(async (val) => {
      let foundName = '';
      let foundPhone = '';
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed.name) foundName = parsed.name;
          if (parsed.phone) foundPhone = parsed.phone;
        } catch {}
      }
      if (!foundPhone) {
        const altPhone = await AsyncStorage.getItem('SAFE_DATE_EMERGENCY_CONTACT').catch(() => null);
        const altName = await AsyncStorage.getItem('SAFE_DATE_GUARDIAN_NAME').catch(() => null);
        if (altPhone) foundPhone = altPhone;
        if (altName) foundName = altName;
      }
      if (foundName) setEmergencyName(foundName);
      if (foundPhone) setEmergencyPhone(foundPhone);
    }).catch(() => {});
  }, []);

  // Generate next 7 calendar days with contextual tags
  const dateOptions = useMemo(() => {
    const days: { label: string; dayNum: string; fullDate: string; tag?: string }[] = [];
    const now = new Date();
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const isTomorrow = i === 1;
      const dayOfWeek = d.getDay();
      const dayName = isTomorrow ? 'TOM' : dayNames[dayOfWeek];
      const dayNum = d.getDate().toString();
      const fullDate = `${dayNames[dayOfWeek]}, ${monthNames[d.getMonth()]} ${dayNum}`;

      let tag: string | undefined = undefined;
      if (isTomorrow) tag = 'Tomorrow';
      else if (dayOfWeek === 6 || dayOfWeek === 0) tag = 'Weekend';
      else if (dayOfWeek === 5) tag = 'Fri Night';

      days.push({ label: dayName, dayNum, fullDate, tag });
    }
    return days;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(
    dateOptions[0]?.fullDate || 'Tomorrow'
  );
  const [dayPeriod, setDayPeriod] = useState<'day' | 'eve'>('day');
  const [selectedTime, setSelectedTime] = useState<string>(DAYTIME_TIME_SLOTS[1].time);
  const [selectedTimeVibe, setSelectedTimeVibe] = useState<string>(DAYTIME_TIME_SLOTS[1].vibe);
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customTimeInput, setCustomTimeInput] = useState<string>('');

  const [selectedVenue, setSelectedVenue] = useState<string>(CURATED_VENUES[0].name);
  const [customVenue, setCustomVenue] = useState<string>('');
  const [isCustomVenue, setIsCustomVenue] = useState<boolean>(false);
  const [note, setNote] = useState<string>(
    "Looking forward to meeting in person! Coffee & treats are on me ☕"
  );

  const handleSend = () => {
    hapticFeedback.success();
    const finalVenue = isCustomVenue && customVenue.trim() ? customVenue.trim() : selectedVenue;
    const finalTime = isCustomTime && customTimeInput.trim() ? customTimeInput.trim() : selectedTime;
    const finalVibe = isCustomTime && customTimeInput.trim() ? 'Custom Planned Time ⏰' : selectedTimeVibe;
    
    // Save emergency contact locally for convenience (two-way sync with Safe Date)
    if (emergencyName.trim() || emergencyPhone.trim()) {
      const contactObj = { name: emergencyName.trim(), phone: emergencyPhone.trim() };
      AsyncStorage.setItem('@blunderr_emergency_contact', JSON.stringify(contactObj)).catch(() => {});
      if (emergencyPhone.trim()) {
        AsyncStorage.setItem('SAFE_DATE_EMERGENCY_CONTACT', emergencyPhone.trim()).catch(() => {});
      }
      if (emergencyName.trim()) {
        AsyncStorage.setItem('SAFE_DATE_GUARDIAN_NAME', emergencyName.trim()).catch(() => {});
      }
    }

    onSendProposal({
      date: selectedDate,
      time: finalTime,
      timeVibe: finalVibe,
      venue: finalVenue,
      note: note.trim(),
      emergencyContact: (emergencyName.trim() || emergencyPhone.trim()) ? {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
      } : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}>
          <View
            style={styles.sheet}
            onStartShouldSetResponder={() => true}>
            {/* Sheet Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeIcon}>💌</Text>
                <Text style={styles.headerBadgeText}>SAFEDATE SHIELD™ PROPOSAL</Text>
              </View>
              <Text style={styles.title}>Propose a Real Date</Text>
              <Text style={styles.subtitle}>
                Turn digital spark into real chemistry with {candidateName}.
                Sending triggers an illuminated card and live flower shower on their screen!
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
            {/* 1. DATE SELECTOR */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>1. SELECT DATE</Text>
                <Text style={styles.sectionSelectedPill}>{selectedDate}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}>
                {dateOptions.map((opt, idx) => {
                  const isSelected = selectedDate === opt.fullDate;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dateChip,
                        isSelected && styles.dateChipSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        hapticFeedback.light();
                        setSelectedDate(opt.fullDate);
                      }}>
                      {opt.tag ? (
                        <View style={[styles.dateChipTag, isSelected && styles.dateChipTagSelected]}>
                          <Text style={[styles.dateChipTagText, isSelected && styles.dateChipTagTextSelected]}>
                            {opt.tag}
                          </Text>
                        </View>
                      ) : null}
                      <Text
                        style={[
                          styles.dateChipDay,
                          isSelected && styles.dateChipDaySelected,
                        ]}>
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipNum,
                          isSelected && styles.dateChipNumSelected,
                        ]}>
                        {opt.dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. TIME SLOT SELECTOR WITH DAYTIME / EVENING SWITCHER */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>2. TIME & VIBE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setIsCustomTime(!isCustomTime)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.toggleCustomText}>
                      {isCustomTime ? '‹ Presets' : '+ Custom Time'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.sectionSelectedPill}>
                    {isCustomTime && customTimeInput ? customTimeInput : selectedTime}
                  </Text>
                </View>
              </View>

              {/* Day Period Switcher */}
              {!isCustomTime && (
                <View style={styles.periodSwitcher}>
                  <TouchableOpacity
                    style={[styles.periodBtn, dayPeriod === 'day' && styles.periodBtnActiveDay]}
                    activeOpacity={0.85}
                    onPress={() => {
                      hapticFeedback.light();
                      setDayPeriod('day');
                      setSelectedTime(DAYTIME_TIME_SLOTS[1].time);
                      setSelectedTimeVibe(DAYTIME_TIME_SLOTS[1].vibe);
                    }}>
                    <Text style={[styles.periodBtnText, dayPeriod === 'day' && styles.periodBtnTextActiveDay]}>
                      ☀️ Daytime (Before 3 PM)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.periodBtn, dayPeriod === 'eve' && styles.periodBtnActiveEve]}
                    activeOpacity={0.85}
                    onPress={() => {
                      hapticFeedback.light();
                      setDayPeriod('eve');
                      setSelectedTime(EVENING_TIME_SLOTS[2].time);
                      setSelectedTimeVibe(EVENING_TIME_SLOTS[2].vibe);
                    }}>
                    <Text style={[styles.periodBtnText, dayPeriod === 'eve' && styles.periodBtnTextActiveEve]}>
                      🌙 Evening (After 3 PM)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isCustomTime ? (
                <View style={styles.customTimeWrap}>
                  <TextInput
                    style={styles.customTimeInput}
                    placeholder="Enter custom time (e.g. 11:15 AM or 2:30 PM)..."
                    placeholderTextColor="#64748B"
                    value={customTimeInput}
                    onChangeText={setCustomTimeInput}
                  />
                  <Text style={styles.customTimeHint}>
                    💡 Enter any specific time before 3 PM or evening that suits you both.
                  </Text>
                </View>
              ) : (
                <View style={styles.timeGrid}>
                  {(dayPeriod === 'day' ? DAYTIME_TIME_SLOTS : EVENING_TIME_SLOTS).map((slot, idx) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.timeChip,
                          isSelected && (dayPeriod === 'day' ? styles.timeChipSelectedDay : styles.timeChipSelectedEve),
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          hapticFeedback.light();
                          setSelectedTime(slot.time);
                          setSelectedTimeVibe(slot.vibe);
                        }}>
                        <View style={styles.timeChipHeaderRow}>
                          <Text
                            style={[
                              styles.timeChipTime,
                              isSelected && (dayPeriod === 'day' ? styles.timeChipTimeSelectedDay : styles.timeChipTimeSelectedEve),
                            ]}>
                            {slot.time}
                          </Text>
                          {slot.badge ? (
                            <View style={[styles.slotBadge, isSelected && styles.slotBadgeSelected]}>
                              <Text style={[styles.slotBadgeText, isSelected && styles.slotBadgeTextSelected]}>
                                {slot.badge}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.timeChipVibe,
                            isSelected && styles.timeChipVibeSelected,
                          ]}
                          numberOfLines={1}>
                          {slot.vibe}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 3. VERIFIED VENUE SELECTOR */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>3. VERIFIED SAFEDATE VENUE</Text>
                <TouchableOpacity
                  onPress={() => setIsCustomVenue(!isCustomVenue)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.toggleCustomText}>
                    {isCustomVenue ? '‹ Curated Venues' : '+ Other Venue'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomVenue ? (
                <TextInput
                  style={styles.customVenueInput}
                  placeholder="Enter custom cafe, lounge or restaurant name..."
                  placeholderTextColor="#64748B"
                  value={customVenue}
                  onChangeText={setCustomVenue}
                />
              ) : (
                <View style={styles.venueList}>
                  {CURATED_VENUES.map((v, idx) => {
                    const isSelected = selectedVenue === v.name;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.venueCard,
                          isSelected && styles.venueCardSelected,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => {
                          hapticFeedback.light();
                          setSelectedVenue(v.name);
                        }}>
                        <View style={styles.venueCheckWrap}>
                          <Text style={styles.venueCheckIcon}>
                            {isSelected ? '🔘' : '⚪'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.venueName,
                              isSelected && styles.venueNameSelected,
                            ]}>
                            {v.name}
                          </Text>
                          <Text style={styles.venueDesc}>{v.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 4. INVITATION NOTE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>4. PERSONAL INVITATION NOTE</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a sweet personal note..."
                placeholderTextColor="#64748B"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* 5. SAFEDATE EMERGENCY CONTACT (FOR NON-MALE USERS) */}
            {isNonMale && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>🛡️ SAFEDATE EMERGENCY CONTACT</Text>
                  <Text style={styles.sectionHint}>Optional • SafeDate Shield</Text>
                </View>
                <Text style={styles.emergencyNoticeText}>
                  Add a trusted friend or family member's details. Prior to the date, our automated safety daemon can discretely notify them with the venue and time details.
                </Text>

                <View style={styles.emergencyBox}>
                  <Text style={styles.emergencyFieldLabel}>FRIEND / CONTACT NAME</Text>
                  <TextInput
                    style={styles.emergencyTextInput}
                    placeholder="e.g. Priya Sharma (Best Friend)"
                    placeholderTextColor="#64748B"
                    value={emergencyName}
                    onChangeText={setEmergencyName}
                  />

                  <Text style={[styles.emergencyFieldLabel, { marginTop: 10 }]}>PHONE NUMBER</Text>
                  <TextInput
                    style={styles.emergencyTextInput}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                  />
                </View>
              </View>
            )}

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                isSending && { opacity: 0.7 },
              ]}
              disabled={isSending}
              activeOpacity={0.85}
              onPress={handleSend}>
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.sendBtnIcon}>💌</Text>
                  <Text style={styles.sendBtnText}>
                    Send Date Proposal with Flower Shower
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Keep Chatting for Now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A0D18',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    marginBottom: 14,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  headerBadgeIcon: {
    fontSize: 12,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF385C',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionSelectedPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF385C',
  },
  toggleCustomText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  chipsScroll: {
    gap: 8,
  },
  dateChip: {
    width: 68,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateChipTag: {
    position: 'absolute',
    top: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dateChipTagSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  dateChipTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FCD34D',
    textTransform: 'uppercase',
  },
  dateChipTagTextSelected: {
    color: '#FFFFFF',
  },
  dateChipSelected: {
    backgroundColor: '#FF385C',
    borderColor: '#FFA4B3',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  dateChipDay: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  dateChipDaySelected: {
    color: '#FFE4E6',
  },
  dateChipNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  dateChipNumSelected: {
    color: '#FFFFFF',
  },
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  periodBtnActiveDay: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  periodBtnActiveEve: {
    backgroundColor: '#FF385C',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  periodBtnTextActiveDay: {
    color: '#0F172A',
    fontWeight: '800',
  },
  periodBtnTextActiveEve: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  customTimeWrap: {
    backgroundColor: '#111526',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
  },
  customTimeInput: {
    backgroundColor: '#0A0D18',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customTimeHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 15,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    width: '48%',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeChipSelectedDay: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#F59E0B',
  },
  timeChipSelectedEve: {
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderColor: '#FF385C',
  },
  timeChipSelected: {
    backgroundColor: 'rgba(255, 56, 92, 0.16)',
    borderColor: '#FF385C',
  },
  timeChipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  slotBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  slotBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  slotBadgeTextSelected: {
    color: '#FFFFFF',
  },
  timeChipTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timeChipTimeSelectedDay: {
    color: '#FCD34D',
  },
  timeChipTimeSelectedEve: {
    color: '#FF385C',
  },
  timeChipTimeSelected: {
    color: '#FF385C',
  },
  timeChipVibe: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  timeChipVibeSelected: {
    color: '#FDA4AF',
    fontWeight: '600',
  },
  venueList: {
    gap: 8,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 16,
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  venueCardSelected: {
    borderColor: '#FF385C',
    backgroundColor: 'rgba(255, 56, 92, 0.1)',
  },
  venueCheckWrap: {
    paddingLeft: 2,
  },
  venueCheckIcon: {
    fontSize: 14,
  },
  venueName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  venueNameSelected: {
    color: '#FF385C',
  },
  venueDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  customVenueInput: {
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  noteInput: {
    backgroundColor: '#111526',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 12,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF385C',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 6,
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  sendBtnIcon: {
    fontSize: 16,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyNoticeText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 10,
  },
  emergencyBox: {
    backgroundColor: '#0D101C',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.25)',
    borderRadius: 14,
    padding: 12,
  },
  emergencyFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  emergencyTextInput: {
    backgroundColor: '#15192B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
