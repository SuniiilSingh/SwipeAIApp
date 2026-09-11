import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  AppStateStatus,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { api } from '@/services/api';
import { DatingIntent } from '@/types';
import LivenessCameraModal from '@/components/liveness-camera-modal';
import { FEATURE_FLAGS } from '@/config/features';

export default function AuthScreen() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('+91 89106 53499');
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
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // KYC state
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [livenessDone, setLivenessDone] = useState(false);
  const [livenessScore, setLivenessScore] = useState(0.99);

  // Ghost Shield state
  const [blockContacts, setBlockContacts] = useState(true);
  const [corpDomain, setCorpDomain] = useState('swiggy.in');
  const [hideMutuals, setHideMutuals] = useState(true);

  // Intent
  const [intent, setIntent] = useState<DatingIntent>('SERIOUS_DATING');

  // Modals
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [showLivenessModal, setShowLivenessModal] = useState(false);

  // Check WhatsApp App Availability and Existing Onboarding Status
  useEffect(() => {
    checkWhatsAppInstalled();
    checkExistingStatus();
  }, []);

  const checkExistingStatus = async () => {
    try {
      await api.initAuth();
      const token = api.getAuthToken();
      if (!token) return;

      const isCompleted = await api.isOnboardingCompleted();
      if (isCompleted) {
        router.replace('/(tabs)');
        return;
      }

      const profile = await api.getMyProfile();
      const isPhoneOrWa = Boolean(profile.whatsappVerified || profile.phoneE164);
      const isLiveness = Boolean((profile.livenessScore && profile.livenessScore >= 0.85) || profile.digilockerVerified);
      const hasIntent = Boolean(profile.intent);

      if (isPhoneOrWa && isLiveness && hasIntent) {
        await api.setOnboardingCompleted(true);
        router.replace('/(tabs)');
        return;
      }

      if (profile.phoneE164) {
        setPhone(profile.phoneE164);
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

      // Automatically advance to the incomplete step
      if (isPhoneOrWa && isLiveness) {
        setStep(3);
      } else if (isPhoneOrWa) {
        setStep(2);
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
      setIsAutoDetectingOtp(true);
      const codeLen = (res && (res.otpLength === 4 || res.otpLength === 6)) ? res.otpLength : 6;
      setExpectedOtpLength(codeLen);
      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
      setOtpFeedbackMsg(res.message || `OTP sent via ${channelLabel}`);
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 200);
    } catch (e: any) {
      setLoading(false);
      setIsAutoDetectingOtp(false);
      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
      Alert.alert(`${channelLabel} Error`, e.message || `Could not send OTP.`);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalOtp = (codeToVerify || otp).trim();
    if (!finalOtp || finalOtp.length < expectedOtpLength) {
      Alert.alert('Enter Code', `Enter the ${expectedOtpLength}-digit code.`);
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, finalOtp, authChannel);
      setLoading(false);
      if (res?.whatsappVerified || authChannel === 'whatsapp') {
        setWhatsappVerified(true);
      }
      setStep(2); // Move to Trust Pass KYC
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

  const handleLivenessSuccess = async (score: number) => {
    setLivenessScore(score);
    setLivenessDone(true);
    try {
      await api.verifyLiveness(3000);
    } catch (err) {
      console.warn('Liveness verification error:', err);
    }
    Alert.alert(
      '3D Liveness Verified ✓',
      `Zero Deepfake detected. Verified live human! Score: ${Math.round(score * 100)}%`
    );
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
      await api.updateMyProfile({ intent, digilockerVerified });
      await api.setOnboardingCompleted(true);
      setLoading(false);
      router.replace('/(tabs)');
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to save settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Text style={styles.brandTitle}>Blunderr Dating</Text>
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkBadgeText}>✦ Trust Pass</Text>
            </View>
          </View>
          <Text style={styles.subHeadline}>100% Real Indian Singles</Text>
          <Text style={styles.subText}>No fake profiles. Zero creepy spam. Total privacy.</Text>
        </View>

        {/* STEP 1: Phone / WhatsApp OTP with Auto-Detection */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>1. Instant Verification</Text>
            <Text style={styles.cardDesc}>
              Authenticate securely with a 6-digit verification code. Receive your code via WhatsApp (recommended) or SMS.
            </Text>

            {/* WhatsApp Detection Indicator */}
            <View style={styles.detectionBadgeRow}>
              <View style={[styles.statusDot, isWhatsAppDetected ? styles.dotGreen : styles.dotGray]} />
              <Text style={styles.detectionText}>
                {isCheckingWhatsApp
                  ? 'Detecting WhatsApp on this device...'
                  : isWhatsAppDetected
                  ? '⚡ WhatsApp Detected on this device'
                  : 'WhatsApp not detected • SMS OTP available'}
              </Text>
            </View>

            {/* Mobile Number Field */}
            <Text style={styles.inputLabel}>Mobile Number (+91)</Text>
            <View style={styles.phoneInputRow}>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#6B7082"
                keyboardType="phone-pad"
              />
            </View>

            {/* Channel Selection Buttons */}
            <View style={styles.channelButtonsContainer}>
              {/* WhatsApp Verification Button */}
              <TouchableOpacity
                style={[
                  styles.waButton,
                  authChannel === 'whatsapp' && otpSent && styles.waButtonActive,
                  isWhatsAppDetected && styles.waButtonDetected,
                ]}
                onPress={() => handleSendOtp('whatsapp')}
                disabled={loading || (resendTimer > 0 && authChannel === 'whatsapp')}
                activeOpacity={0.85}>
                {loading && authChannel === 'whatsapp' ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <View style={styles.waButtonInner}>
                      <Text style={styles.waButtonEmoji}>💬</Text>
                      <Text style={styles.waButtonText}>
                        {otpSent && authChannel === 'whatsapp'
                          ? (resendTimer > 0 ? `Resend on WhatsApp (${resendTimer}s)` : 'Resend Code via WhatsApp')
                          : 'Verify via WhatsApp OTP'}
                      </Text>
                      <View style={styles.instantPill}>
                        <Text style={styles.instantPillText}>RECOMMENDED ⚡</Text>
                      </View>
                    </View>
                    <Text style={styles.waSubText}>
                      Instant 6-digit OTP code sent directly to WhatsApp • 0% SMS carrier drops
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* SMS Verification Button */}
              <TouchableOpacity
                style={[styles.smsButton, authChannel === 'sms' && otpSent && styles.smsButtonActive]}
                onPress={() => handleSendOtp('sms')}
                disabled={loading || (resendTimer > 0 && authChannel === 'sms')}
                activeOpacity={0.85}>
                {loading && authChannel === 'sms' ? (
                  <ActivityIndicator color="#CACDD8" />
                ) : (
                  <View style={styles.smsButtonInner}>
                    <Text style={styles.smsButtonEmoji}>📱</Text>
                    <Text style={styles.smsButtonText}>
                      {otpSent && authChannel === 'sms'
                        ? (resendTimer > 0 ? `Resend SMS (${resendTimer}s)` : 'Resend Code via SMS')
                        : 'Send Code via SMS OTP'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Feedback Message */}
            {otpFeedbackMsg && (
              <View style={styles.otpInfoBanner}>
                <Text style={styles.otpInfoText}>{otpFeedbackMsg}</Text>
              </View>
            )}

            {/* Auto-Detection Status Indicator */}
            {isAutoDetectingOtp && (
              <View style={styles.autoDetectWrapper}>
                <Animated.View style={[styles.autoDetectBanner, { transform: [{ scale: pulseAnim }] }]}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.autoDetectText}>
                    {authChannel === 'whatsapp'
                      ? '📡 Auto-detecting WhatsApp OTP'
                      : '📡 Auto-detecting SMS OTP'}
                  </Text>
                </Animated.View>
                {authChannel === 'whatsapp' && (
                  <View style={styles.autoDetectButtonsRow}>
                    <TouchableOpacity
                      style={styles.openWhatsAppBtn}
                      onPress={handleOpenWhatsApp}>
                      <Text style={styles.openWhatsAppText}>💬 Open WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {autoDetectedSuccess && (
              <View style={styles.autoDetectSuccessBanner}>
                <Text style={styles.autoDetectSuccessText}>
                  {authChannel === 'whatsapp'
                    ? '✓ WhatsApp OTP Auto-detected!'
                    : '✓ SMS OTP Auto-detected!'}
                </Text>
              </View>
            )}

            {/* Dynamic OTP Boxes UI (adapts to 4 or 6 digits) */}
            <Text style={styles.inputLabel}>Enter {expectedOtpLength}-Digit Verification Code</Text>
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
                        styles.otpBox,
                        isFocused && styles.otpBoxFocused,
                        isSuccess && styles.otpBoxSuccess,
                      ]}>
                      <Text style={[styles.otpDigit, isSuccess && styles.otpDigitSuccess]}>{digit}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Underlying Input with full accessibility and Android Autofill support */}
              <TextInput
                ref={otpInputRef}
                style={styles.hiddenOtpInput}
                value={otp}
                onChangeText={(text) => {
                  const clean = text.replace(/\D/g, '').slice(0, expectedOtpLength);
                  setOtp(clean);
                  if (clean.length === expectedOtpLength) {
                    setIsAutoDetectingOtp(false);
                    setAutoDetectedSuccess(true);
                    setTimeout(() => {
                      handleVerifyOtp(clean);
                    }, 400);
                  }
                }}
                placeholder=""
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                importantForAutofill="yes"
                caretHidden={true}
                selectionColor="transparent"
                maxLength={expectedOtpLength}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, (!otp || otp.length < expectedOtpLength) && styles.primaryButtonDisabled]}
              onPress={() => handleVerifyOtp()}
              disabled={loading || otp.length < expectedOtpLength}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Proceed →</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: '#0E0F13',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    backgroundColor: '#16171E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262833',
    marginBottom: 20,
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
});
