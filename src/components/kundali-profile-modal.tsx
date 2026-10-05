import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/services/api';
import { UserAstrology } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

interface KundaliProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userDob?: string;
}

export default function KundaliProfileModal({
  visible,
  onClose,
  userDob,
}: KundaliProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [astrology, setAstrology] = useState<UserAstrology | null>(null);

  const [birthTime, setBirthTime] = useState('');
  const [birthCity, setBirthCity] = useState('');

  useEffect(() => {
    if (visible) {
      loadChart();
    }
  }, [visible]);

  const loadChart = async () => {
    setLoading(true);
    try {
      const data = await api.getMyAstrology();
      if (data) {
        setAstrology(data);
        if (data.birthTime) setBirthTime(data.birthTime);
        if (data.birthCity) setBirthCity(data.birthCity);
      }
    } catch (e) {
      console.warn('Failed to load astrology chart:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!birthTime.trim() && !birthCity.trim()) {
      Alert.alert('Details Missing', 'Please enter your birth time or city to calibrate your chart.');
      return;
    }

    setSaving(true);
    hapticFeedback.medium();
    try {
      const updated = await api.updateMyBirthDetails({
        birthTime: birthTime.trim(),
        birthCity: birthCity.trim(),
      });
      if (updated) {
        setAstrology(updated);
        hapticFeedback.success();
        Alert.alert('Chart Recalibrated ✨', 'Your exact Kundali and Nakshatra have been updated successfully!');
      }
    } catch (e) {
      Alert.alert('Update Failed', 'Could not save birth details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Vedic Cosmic Chart 🌌</Text>
                <Text style={styles.headerSubtitle}>
                  {astrology?.isExactTimeProvided
                    ? '✓ 100% Exact Astrological Blueprint'
                    : 'Estimated from Date of Birth'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  onClose();
                }}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Computing Sidereal Ephemeris...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View
                  style={[
                    styles.statusCard,
                    astrology?.isExactTimeProvided ? styles.statusCardVerified : styles.statusCardEstimated,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {astrology?.isExactTimeProvided
                      ? '⭐ Exact Astrological Blueprint Calibrated'
                      : '⚡ Estimated from DOB (12:00 PM Noon Reference)'}
                  </Text>
                  <Text style={styles.statusSubtext}>
                    {astrology?.isExactTimeProvided
                      ? 'Your Nakshatra, Pada, and Moon Sign are calibrated to the minute.'
                      : 'Add your exact birth time & city below to unlock 100% precision and your verified Cosmic Badge!'}
                  </Text>
                </View>

                {/* Primary Chart Attributes Grid */}
                <Text style={styles.sectionHeader}>Your Astrological Core 🪐</Text>
                <View style={styles.attrGrid}>
                  {/* Nakshatra */}
                  <View style={styles.attrCard}>
                    <Text style={styles.attrLabel}>✨ Birth Star (Nakshatra)</Text>
                    <Text style={styles.attrValue}>{astrology?.nakshatraName || 'Rohini'}</Text>
                    <Text style={styles.attrSub}>Pada {astrology?.nakshatraPada || 1}</Text>
                  </View>

                  {/* Moon Sign */}
                  <View style={styles.attrCard}>
                    <Text style={styles.attrLabel}>🌙 Moon Sign (Rashi)</Text>
                    <Text style={styles.attrValue}>{astrology?.chandraRashi || 'Taurus'}</Text>
                    <Text style={styles.attrSub}>{astrology?.chandraRashiLord || 'Venus'}</Text>
                  </View>

                  {/* Sun Sign */}
                  <View style={styles.attrCard}>
                    <Text style={styles.attrLabel}>☀️ Western Sun Sign</Text>
                    <Text style={styles.attrValue}>{astrology?.sunSign || 'Taurus'}</Text>
                    <Text style={styles.attrSub}>Ecliptic Sun</Text>
                  </View>

                  {/* Numerology */}
                  <View style={styles.attrCard}>
                    <Text style={styles.attrLabel}>🔢 Life Path Number</Text>
                    <Text style={styles.attrValue}>{astrology?.numerologyNumber || 6}</Text>
                    <Text style={styles.attrSub}>Destiny Root</Text>
                  </View>
                </View>

                {/* 8 Compatibility Archetypes */}
                <Text style={styles.sectionHeader}>Compatibility Archetypes 🧬</Text>
                <View style={styles.archetypeContainer}>
                  <View style={styles.archetypeRow}>
                    <Text style={styles.archetypeLabel}>🐾 Animal Totem (Yoni):</Text>
                    <Text style={styles.archetypeValue}>{astrology?.yoniAnimal || 'Serpent'}</Text>
                  </View>
                  <View style={styles.archetypeRow}>
                    <Text style={styles.archetypeLabel}>⚡ Temperament (Gana):</Text>
                    <Text style={styles.archetypeValue}>{astrology?.gana || 'Manushya'}</Text>
                  </View>
                  <View style={styles.archetypeRow}>
                    <Text style={styles.archetypeLabel}>🧬 Vitality (Nadi):</Text>
                    <Text style={styles.archetypeValue}>{astrology?.nadi || 'Antya'}</Text>
                  </View>
                  <View style={styles.archetypeRow}>
                    <Text style={styles.archetypeLabel}>🕊️ Work Spirit (Varna):</Text>
                    <Text style={styles.archetypeValue}>{astrology?.varna || 'Vaishya'}</Text>
                  </View>
                  <View style={styles.archetypeRow}>
                    <Text style={styles.archetypeLabel}>💫 Power Alignment (Vashya):</Text>
                    <Text style={styles.archetypeValue}>{astrology?.vashya || 'Chatushpada'}</Text>
                  </View>
                  <View style={styles.archetypeRow}>
                    <Text style={styles.archetypeLabel}>🔥 Manglik Status:</Text>
                    <Text style={[styles.archetypeValue, astrology?.isManglik && { color: '#F59E0B' }]}>
                      {astrology?.isManglik ? 'Manglik (High Passion)' : 'Non-Manglik (Balanced Mars)'}
                    </Text>
                  </View>
                </View>

                {/* Optional Calibration Card */}
                <View style={styles.calibrateCard}>
                  <Text style={styles.calibrateTitle}>Calibrate Exact Birth Details ✨</Text>
                  <Text style={styles.calibrateSubtitle}>
                    Enter your exact birth time & city from your Janampatri/birth certificate for 100% precise Kundali Milan matching.
                  </Text>

                  <Text style={styles.inputLabel}>Birth Time (HH:mm)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. 14:30 or 06:15"
                    placeholderTextColor="#666677"
                    value={birthTime}
                    onChangeText={setBirthTime}
                    keyboardType="numbers-and-punctuation"
                  />

                  <Text style={styles.inputLabel}>Birth City / Town</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. Jaipur, Lucknow, Bengaluru"
                    placeholderTextColor="#666677"
                    value={birthCity}
                    onChangeText={setBirthCity}
                  />

                  <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSaveDetails}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Recalibrate My Chart 🚀</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F0F16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    borderWidth: 1,
    borderColor: '#262638',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A28',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusCardVerified: {
    backgroundColor: '#10B98118',
    borderColor: '#10B98144',
  },
  statusCardEstimated: {
    backgroundColor: '#3B82F614',
    borderColor: '#3B82F633',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 11,
    color: '#A0A0B5',
    lineHeight: 15,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 12,
    marginTop: 4,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  attrCard: {
    width: (width - 46) / 2,
    backgroundColor: '#161624',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262638',
  },
  attrLabel: {
    fontSize: 11,
    color: '#85859B',
    fontWeight: '600',
    marginBottom: 4,
  },
  attrValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  attrSub: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  archetypeContainer: {
    backgroundColor: '#14141E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222232',
    gap: 10,
    marginBottom: 18,
  },
  archetypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  archetypeLabel: {
    fontSize: 13,
    color: '#8E8E9F',
    fontWeight: '500',
  },
  archetypeValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calibrateCard: {
    backgroundColor: '#161622',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  calibrateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  calibrateSubtitle: {
    fontSize: 12,
    color: '#8E8E9F',
    lineHeight: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0B0',
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#0D0D14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#282838',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
