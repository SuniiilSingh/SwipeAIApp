import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts/legacy';
import { api } from '@/services/api';
import { SafeDateSpot } from '@/types';
import { useThemedStyles } from '@/context/theme-context';
import { hapticFeedback } from '@/utils/haptics';

export default function SafeDateScreen() {
  const router = useRouter();
  const styles = useThemedStyles(baseStyles);
  const [spots, setSpots] = useState<SafeDateSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<SafeDateSpot | null>(null);
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [guardianName, setGuardianName] = useState<string>('');
  const [isPickingContact, setIsPickingContact] = useState(false);
  const [activeSosUrl, setActiveSosUrl] = useState<string | null>(null);

  const [userCity, setUserCity] = useState<string>('');

  useEffect(() => {
    loadSpots();
    loadSavedEmergencyContact();
  }, []);

  const loadSavedEmergencyContact = async () => {
    try {
      let savedPhone = await AsyncStorage.getItem('SAFE_DATE_EMERGENCY_CONTACT');
      let savedName = await AsyncStorage.getItem('SAFE_DATE_GUARDIAN_NAME');
      if (!savedPhone) {
        const rawJson = await AsyncStorage.getItem('@blunderr_emergency_contact');
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed?.phone) savedPhone = parsed.phone;
          if (parsed?.name) savedName = parsed.name;
        }
      }
      if (savedPhone) {
        setEmergencyContact(savedPhone);
      }
      if (savedName) {
        setGuardianName(savedName);
      }
    } catch (e) {}
  };

  const handlePickContact = async () => {
    try {
      setIsPickingContact(true);

      if (Platform.OS === 'web') {
        Alert.alert(
          'Contact Permission (Web)',
          'Direct device address book picker is available on the Android and iOS apps. On web, you can enter your emergency guardian phone number directly in the box below.'
        );
        setIsPickingContact(false);
        return;
      }

      // Check / Request Contact Permission with explicit user prompt
      let { status } = await Contacts.getPermissionsAsync();
      if (status !== 'granted') {
        const req = await Contacts.requestPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Contacts Permission Required 👥',
          'BlunderR needs permission to access your contacts to let you pick a trusted emergency guardian. You can enable contact access in Settings, or type the phone number manually.'
        );
        setIsPickingContact(false);
        return;
      }

      // Launch Native Contact Picker
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        const name = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Guardian';
        const rawPhone = contact.phoneNumbers?.[0]?.number || '';
        const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

        if (cleanPhone) {
          setEmergencyContact(cleanPhone);
          setGuardianName(name);
          await AsyncStorage.setItem('SAFE_DATE_EMERGENCY_CONTACT', cleanPhone);
          await AsyncStorage.setItem('SAFE_DATE_GUARDIAN_NAME', name);
          await AsyncStorage.setItem(
            '@blunderr_emergency_contact',
            JSON.stringify({ name, phone: cleanPhone })
          );
          hapticFeedback.success();
          Alert.alert('Guardian Selected 🛡️', `Emergency tracking will be sent to ${name} (${cleanPhone}).`);
        } else {
          Alert.alert('No Phone Number', `${name} does not have a phone number saved in your contacts.`);
        }
      }
    } catch (e: any) {
      console.warn('Contact picker error:', e);
      Alert.alert('Contact Picker', 'Could not open contact picker. You can enter the number manually.');
    } finally {
      setIsPickingContact(false);
    }
  };

  const loadSpots = async () => {
    setLoading(true);
    const profile = await api.getMyProfile().catch(() => null);
    const city = profile?.city || profile?.location || '';
    if (city) setUserCity(city);
    const list = await api.getSafeDateSpots(city || 'Bengaluru');
    setSpots(list);
    if (list.length > 0) setSelectedSpot(list[0]);
    setLoading(false);
  };

  const handleStartSos = async () => {
    if (!selectedSpot) return;
    if (!emergencyContact || emergencyContact.trim().length === 0) {
      Alert.alert(
        'Emergency Contact Required 👥',
        'Please select a contact from your phonebook or enter an emergency phone number before activating Safe Date SOS.'
      );
      return;
    }

    const res = await api.startSos(selectedSpot.id, undefined, [emergencyContact]);
    setActiveSosUrl(res.trackingUrl);
    Alert.alert(
      '🛡️ Safe Date Mode Activated',
      `Live check-in at ${selectedSpot.name} is active.\n\nDynamic SOS link: ${res.trackingUrl}\nShared with: ${guardianName ? `${guardianName} (${emergencyContact})` : emergencyContact}\n15% discount code applied: ${res.discountCoupon}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerBadge}>🛡️ O2O WOMEN-FIRST SAFETY</Text>
          <Text style={styles.title}>Safe Date Spots & Live SOS</Text>
          <Text style={styles.subtitle}>
            Partnered, well-lit verified cafes with 15% discount & one-tap emergency contact tracking.
          </Text>
        </View>

        {/* ACTIVE SOS STATUS BANNER */}
        {activeSosUrl && (
          <View style={styles.sosLiveCard}>
            <Text style={styles.sosLiveTitle}>🟢 Live SOS Session Active</Text>
            <Text style={styles.sosLiveDesc}>
              Location and meeting details are continuously shared with your emergency contacts.
            </Text>
            <Text style={styles.sosLiveLink}>{activeSosUrl}</Text>
            <TouchableOpacity style={styles.endSosBtn} onPress={() => setActiveSosUrl(null)}>
              <Text style={styles.endSosBtnText}>End Safe Date Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMERGENCY CONTACT SETUP */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionHeading}>👥 Emergency Contact Sharing</Text>
            <TouchableOpacity
              style={styles.selectContactBtn}
              onPress={handlePickContact}
              disabled={isPickingContact}>
              {isPickingContact ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.selectContactBtnText}>👤 Select Contact</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSub}>
            We will auto-send a discrete WhatsApp/SMS tracking link when you check in.
          </Text>

          {guardianName ? (
            <View style={styles.selectedGuardianBadge}>
              <Text style={styles.selectedGuardianText}>✓ Selected Guardian: {guardianName}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.contactInput}
            value={emergencyContact}
            onChangeText={(text) => {
              setEmergencyContact(text);
              if (guardianName) setGuardianName('');
            }}
            placeholder="Tap 'Select Contact' above or enter mobile number (e.g. +91 98765 43210)"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
          />
        </View>

        {/* VERIFIED CAFE SPOTS */}
        <Text style={styles.sectionHeading}>
          ☕ Verified Partner Cafes {userCity ? `in ${userCity}` : ''} (15% Off)
        </Text>

        {loading ? (
          <ActivityIndicator color="#E94057" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.spotsList}>
            {spots.map((spot) => {
              const isSelected = selectedSpot?.id === spot.id;
              return (
                <TouchableOpacity
                  key={spot.id}
                  style={[styles.spotCard, isSelected && styles.spotCardActive]}
                  onPress={() => setSelectedSpot(spot)}>
                  {spot.photoUrl && (
                    <Image source={{ uri: spot.photoUrl }} style={styles.spotPhoto} resizeMode="cover" />
                  )}
                  <View style={styles.spotInfo}>
                    <View style={styles.spotBadgeRow}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{spot.discountPercent}% OFF • {spot.couponCode}</Text>
                      </View>
                      <Text style={styles.sosBadgeText}>🛡️ SOS Enabled</Text>
                    </View>

                    <Text style={styles.spotName}>{spot.name}</Text>
                    <Text style={styles.spotAddress}>{spot.address}</Text>

                    <TouchableOpacity
                      style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
                      onPress={() => setSelectedSpot(spot)}>
                      <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                        {isSelected ? 'Selected for Date ✓' : 'Select Safe Spot'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* START CHECK-IN BUTTON */}
        {selectedSpot && !activeSosUrl && (
          <TouchableOpacity style={styles.activateBtn} onPress={handleStartSos}>
            <Text style={styles.activateBtnText}>Check-in at {selectedSpot.brand} & Start SOS 🛡️</Text>
            <Text style={styles.activateBtnSub}>Applies 15% discount code & alerts emergency contacts</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginVertical: 10,
  },
  backLink: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerBadge: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: '#8A8D98',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  sosLiveCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
  },
  sosLiveTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '800',
  },
  sosLiveDesc: {
    color: '#D2F0D4',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  sosLiveLink: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 6,
    textDecorationLine: 'underline',
  },
  endSosBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  endSosBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#181920',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262934',
    marginVertical: 8,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionSub: {
    color: '#7F8496',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  selectContactBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectContactBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedGuardianBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  selectedGuardianText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
  },
  contactInput: {
    backgroundColor: '#242734',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
  },
  spotsList: {
    gap: 12,
    marginTop: 6,
  },
  spotCard: {
    backgroundColor: '#181920',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262934',
  },
  spotCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#16221A',
  },
  spotPhoto: {
    width: '100%',
    height: 130,
  },
  spotInfo: {
    padding: 14,
  },
  spotBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  discountBadge: {
    backgroundColor: 'rgba(242, 113, 33, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F27121',
  },
  discountBadgeText: {
    color: '#F27121',
    fontSize: 10,
    fontWeight: '800',
  },
  sosBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '700',
  },
  spotName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  spotAddress: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  selectBtn: {
    backgroundColor: '#242734',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  selectBtnActive: {
    backgroundColor: '#4CAF50',
  },
  selectBtnText: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '700',
  },
  selectBtnTextActive: {
    color: '#ffffff',
  },
  activateBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  activateBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  activateBtnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
});
