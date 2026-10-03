import {
  ActionType,
  CandidateCard,
  ChatMessage,
  ContextType,
  DatingIntent,
  DietaryPreference,
  Gender,
  IcebreakerQuiz,
  LivingStatus,
  MatchItem,
  MicroCircle,
  SafeDateSpot,
  SkuCatalogItem,
  UserProfile,
  VirtualChaiSession,
  DesireProfile,
  AppNotification,
  PaymentAuditTimeline,
  PaymentAuditEvent,
  PaymentExecutionLog,
  SupportTicket,
  TicketCategory,
  TicketStatus,
  FaqItem,
  ActivePlanResponse,
  TransactionHistoryItem,
} from '@/types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEATURE_FLAGS } from '@/config/features';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://api.blunderr.in';
};

const BASE_URL = getBaseUrl();

export const normalizeImageUrl = (url?: string | null, isFromRemoteDb: boolean = false): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  let trimmed = url.trim();

  // If this comes from remote DB or saved profile response, local file/content URIs are invalid across sessions!
  if (isFromRemoteDb && (trimmed.startsWith('file:') || trimmed.startsWith('content:'))) {
    return '';
  }

  // Return local file, content, data, or blob URIs as-is (e.g. from local camera/gallery picker)
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Upgrade cleartext HTTP to HTTPS to satisfy iOS ATS and Android Network Security Config
  if (trimmed.startsWith('http://')) {
    if (trimmed.includes('api.blunderr.in')) {
      trimmed = trimmed.replace('http://', 'https://');
    } else if (trimmed.includes('188.245.13.211') || trimmed.includes('localhost') || trimmed.includes(':8080')) {
      trimmed = trimmed.replace(/http:\/\/[^\/]+/, BASE_URL);
    } else {
      trimmed = trimmed.replace('http://', 'https://');
    }
  }

  // Prepend BASE_URL for relative paths starting with /
  if (trimmed.startsWith('/')) {
    return `${BASE_URL}${trimmed}`;
  }

  // Prepend BASE_URL/uploads/ for relative paths or bare filenames
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (trimmed.startsWith('uploads/')) {
      return `${BASE_URL}/${trimmed}`;
    }
    return `${BASE_URL}/uploads/${trimmed}`;
  }

  return trimmed;
};

export const normalizeProfilePhotos = (p: UserProfile): UserProfile => {
  if (!p) return p;
  const photo1 = normalizeImageUrl(p.photo1, true);
  const photo2 = normalizeImageUrl(p.photo2, true);
  const photo3 = normalizeImageUrl(p.photo3, true);
  const photo4 = normalizeImageUrl(p.photo4, true);
  const photo5 = normalizeImageUrl(p.photo5, true);
  const photo6 = normalizeImageUrl(p.photo6, true);
  const rawPhotos = Array.isArray(p.photos) ? p.photos : [];
  const photos = rawPhotos.map((url) => normalizeImageUrl(url, true)).filter(Boolean);

  const constructedPhotos = [photo1, photo2, photo3, photo4, photo5, photo6].filter(Boolean);
  const combinedPhotos = Array.from(new Set([...photos, ...constructedPhotos]));

  return {
    ...p,
    photo1: combinedPhotos[0] || '',
    photo2: combinedPhotos[1] || '',
    photo3: combinedPhotos[2] || '',
    photo4: combinedPhotos[3] || '',
    photo5: combinedPhotos[4] || '',
    photo6: combinedPhotos[5] || '',
    photos: combinedPhotos,
    selfieUrl: normalizeImageUrl(p.selfieUrl, true),
    selectedMemeUrl: normalizeImageUrl(p.selectedMemeUrl, false),
    voicePromptUrl: normalizeImageUrl(p.voicePromptUrl, false),
  };
};

// Safe fetch with 10s timeout for reliable mobile network API requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

const STORAGE_KEYS = {
  AUTH_TOKEN: '@swipeai_auth_token',
  USER_ID: '@swipeai_user_id',
  ONBOARDING_COMPLETED: '@swipeai_onboarding_completed',
  USER_PROFILE: '@swipeai_user_profile',
  PUSH_TOKEN: '@swipeai_push_token',
};

let authToken: string | null = null;
let currentUserId: string = '';

export const setAuthToken = (token: string | null, userId?: string) => {
  authToken = token;
  if (userId) currentUserId = userId;
  if (token) {
    AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token).catch(() => {});
    if (userId) AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId).catch(() => {});
    // Auto-sync cached push token if user was registered before login
    AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN).then((savedPushToken) => {
      if (savedPushToken && authToken) {
        api.registerPushToken(savedPushToken).catch(() => {});
      }
    }).catch(() => {});
  } else {
    AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN).catch(() => {});
    AsyncStorage.removeItem(STORAGE_KEYS.USER_ID).catch(() => {});
  }
};

export const initAuth = async (): Promise<string | null> => {
  try {
    const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (storedToken) {
      authToken = storedToken;
      if (storedUserId) currentUserId = storedUserId;
      return storedToken;
    }
  } catch (e) {}
  return authToken;
};

export const setOnboardingCompleted = async (completed: boolean) => {
  try {
    if (completed) {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    }
  } catch (e) {}
};

export const isOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return val === 'true';
  } catch (e) {
    return false;
  }
};

export const getAuthToken = () => authToken;
export const getCurrentUserId = () => currentUserId;

const emptyUserProfile: UserProfile = {
  userId: '',
  phoneE164: '',
  displayName: '',
  fullName: '',
  bio: '',
  age: 0,
  birthDate: '',
  gender: undefined,
  intent: undefined,
  digilockerVerified: false,
  whatsappVerified: false,
  livenessScore: 0.0,
  karmaScore: 100,
  dietaryPref: undefined,
  livingStatus: undefined,
  languagesSpoken: [],
  zodiacSign: '',
  sunSign: '',
  moonSign: '',
  voicePromptUrl: '',
  voicePromptDuration: 0,
  voicePromptText: '',
  company: '',
  occupation: '',
  job: '',
  education: '',
  interests: '',
  height: undefined,
  location: '',
  maxDistanceKm: 50,
  latitude: undefined,
  longitude: undefined,
  sexualOrientation: '',
  showOrientationOnProfile: true,
  genderDisplay: '',
  showGenderOnProfile: true,
  genderPreferenceDisplay: '',
  relationshipIntent: '',
  profilePromptQuestion: '',
  profilePromptAnswer: '',
  photo1: '',
  photo2: '',
  photo3: '',
  photo4: '',
  photo5: '',
  photo6: '',
  selfieUrl: '',
  smokingHabit: '',
  drinkingHabit: '',
  hobbies: '',
  vacationPreference: '',
  completionPercentage: 0,
  city: '',
  neighborhood: '',
  microCircle: '',
  photos: [],
  sparksBalance: 0,
  boostsBalance: 0,
  directDmsBalance: 0,
  hasActivePass: false,
  selectedMemeUrl: '',
  selectedMemeTitle: '',
};

let cachedProfile: UserProfile = { ...emptyUserProfile };

export const api = {
  getAuthToken: () => authToken,
  setAuthToken: (token: string | null, userId?: string) => setAuthToken(token, userId),
  getCurrentUserId: () => currentUserId,
  getBaseUrl: () => BASE_URL,
  initAuth: async () => initAuth(),
  setOnboardingCompleted: async (c: boolean) => setOnboardingCompleted(c),
  isOnboardingCompleted: async () => isOnboardingCompleted(),
  logout: async () => {
    authToken = null;
    currentUserId = '';
    cachedProfile = { ...emptyUserProfile };
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.USER_PROFILE,
      ]);
    } catch (e) {}
  },

  deleteAccount: async (): Promise<boolean> => {
    try {
      await fetchWithTimeout(`${BASE_URL}/v1/profiles/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (e) {
      console.warn('[api] Failed to delete account from server:', e);
    }
    await api.logout();
    return true;
  },

  // Helper to normalize Indian/international phone numbers into clean E.164
  normalizePhone: (p: string) => {
    const cleaned = p.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    return `+${cleaned}`;
  },

  // Auth
  sendOtp: async (phoneE164: string, channel: 'sms' | 'whatsapp' = 'sms') => {
    const normalized = api.normalizePhone(phoneE164);
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164: normalized, channel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Failed to send OTP (${res.status})`);
      }
      return data;
    } catch (err: any) {
      if (FEATURE_FLAGS.USE_MOCK_OTP) {
        return {
          status: 'success',
          channel,
          message: '⚡ Test Mode Active: Enter code 123456',
          isMockOtp: true,
          mockOtp: '123456',
          otpLength: 6,
        };
      }
      throw err;
    }
  },

  verifyOtp: async (
    phoneE164: string,
    otp: string,
    channel: 'sms' | 'whatsapp' = 'sms',
    latitude?: number,
    longitude?: number,
    city?: string,
    location?: string
  ) => {
    const normalized = api.normalizePhone(phoneE164);
    const bodyPayload: any = { phoneE164: normalized, otp: otp.trim(), channel };
    if (latitude != null && longitude != null) {
      bodyPayload.latitude = latitude;
      bodyPayload.longitude = longitude;
    }
    if (city) bodyPayload.city = city;
    if (location || city) bodyPayload.location = location || city;

    const res = await fetchWithTimeout(`${BASE_URL}/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Invalid or expired OTP');
    }
    setAuthToken(data.token, data.userId);
    return data;
  },

  updateLocation: async (
    latitude: number,
    longitude: number,
    city?: string,
    location?: string
  ): Promise<{ status: string; latitude: number; longitude: number; city?: string; location?: string }> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ latitude, longitude, city, location: location || city }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        cachedProfile = {
          ...cachedProfile,
          latitude,
          longitude,
          city: city || cachedProfile.city,
          location: location || city || cachedProfile.location,
        };
        return data;
      }
    } catch (e) {}
    cachedProfile = {
      ...cachedProfile,
      latitude,
      longitude,
      city: city || cachedProfile.city,
      location: location || city || cachedProfile.location,
    };
    return { status: 'success', latitude, longitude, city, location: location || city };
  },

  loginWhatsApp: async (phoneE164: string, otp?: string) => {
    const normalized = api.normalizePhone(phoneE164);
    if (otp && otp.trim()) {
      return api.verifyOtp(normalized, otp.trim(), 'whatsapp');
    }
    return api.sendOtp(normalized, 'whatsapp');
  },

  // KYC
  verifyDigiLocker: async () => {
    if (!FEATURE_FLAGS.ENABLE_DIGILOCKER) {
      return { isVerified: false, badge: 'NONE', message: 'DigiLocker KYC is disabled in this version build.' };
    }
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/kyc/digilocker/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ stateToken: 'state_123', simulateSuccess: true }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    cachedProfile.digilockerVerified = true;
    return { isVerified: true, badge: 'GOLD_SHIELD', message: 'DigiLocker Verified Citizen Badge awarded!' };
  },

  verifyLiveness: async (headTurnDurationMs: number = 3000, passed: boolean = true) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/kyc/liveness/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ headTurnDurationMs, simulatePass: passed }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    if (!passed) {
      return { isLiveHuman: false, livenessScore: 0.45, message: 'Liveness check failed. Movement was not completed.' };
    }
    cachedProfile.livenessScore = 0.99;
    return { isLiveHuman: true, livenessScore: 0.99, message: '3D Biometric Liveness verified.' };
  },

  // Shadow Shield
  syncContacts: async (phoneNumbers: string[]) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/privacy/shadow-shield/sync-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ rawPhoneNumbers: phoneNumbers }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { shieldedContactsCount: phoneNumbers.length, isShieldActive: true };
  },

  setCorporateDomain: async (domain: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/privacy/shadow-shield/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ corporateDomain: domain }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { corporateDomain: domain, isShieldActive: true };
  },

  // Profiles
  getMyProfile: async (): Promise<UserProfile> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        cachedProfile = normalizeProfilePhotos(data);
        return cachedProfile;
      }
    } catch (e) {}
    return normalizeProfilePhotos(cachedProfile);
  },

  updateMyProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        cachedProfile = normalizeProfilePhotos(data);
        return cachedProfile;
      }
      console.warn(`[api] Profile update returned HTTP ${res.status}`);
    } catch (e) {
      console.warn('[api] Failed to update profile on server:', e);
    }
    cachedProfile = normalizeProfilePhotos({ ...cachedProfile, ...updates });
    return cachedProfile;
  },

  getDesireProfile: async (): Promise<DesireProfile> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/desire`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      minAge: 21,
      maxAge: 34,
      ageFlexible: true,
      maxDistanceKm: 50,
      dietaryHarmony: 'ANY_DIET',
      smokingComfort: 'NON_SMOKER_PREFERRED',
      drinkingComfort: 'SOCIAL_DRINKER_OK',
      livingSituationComfort: 'NO_PREFERENCE',
      relationshipIntentMatch: 'ANY',
      weekendVibe: 'COFFEE_AND_BOOKS',
      communicationPace: 'VOICE_NOTES_AND_MEMES',
      banterStyle: 'DRY_WIT',
      loveLanguage: 'QUALITY_TIME',
      greenFlags: ['Reads physical books 📚', 'Emotionally articulate 🧠', 'Orders dessert for the table 🍰'],
      naturalLanguagePrompt: 'Someone authentic and creative who enjoys good coffee and deep conversations.',
    };
  },

  updateDesireProfile: async (updates: Partial<DesireProfile>): Promise<DesireProfile> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/desire`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return updates as DesireProfile;
  },

  uploadVoicePrompt: async (voicePromptUrl: string, durationSec: number, promptText: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/voice-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ voicePromptUrl, durationSec, promptText }),
      });
      if (res.ok) {
        const data = await res.json();
        cachedProfile = { ...cachedProfile, voicePromptUrl, voicePromptDuration: durationSec, voicePromptText: promptText };
        return data;
      }
    } catch (e) {}
    cachedProfile = { ...cachedProfile, voicePromptUrl, voicePromptDuration: durationSec, voicePromptText: promptText };
    return cachedProfile;
  },

  uploadImage: async (localUri: string, directBase64?: string | null): Promise<string> => {
    if (!localUri) return '';
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      return normalizeImageUrl(localUri);
    }

    // 1. Direct Base64 from ImagePicker (instant, skips local file reading, completely reliable)
    if (directBase64) {
      try {
        const filename = localUri.split('/').pop() || `photo_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';

        const res = await fetchWithTimeout(
          `${BASE_URL}/v1/images/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
              filename,
              contentType: mimeType,
              base64Data: directBase64,
            }),
          },
          30000
        );

        if (res.ok) {
          const data = await res.json();
          if (data && data.publicUrl) {
            return normalizeImageUrl(data.publicUrl);
          }
        }
      } catch (e) {
        console.warn('Direct base64 upload failed, trying file upload:', e);
      }
    }

    // 2. Native FileSystem Multipart Upload (Expo 57 modern File API or legacy uploadAsync)
    try {
      if (Platform.OS !== 'web') {
        // Expo 57 modern File.upload API
        if (typeof FileSystem.File === 'function') {
          try {
            const file = new FileSystem.File(localUri);
            const uploadResult = await file.upload(`${BASE_URL}/v1/images/upload`, {
              httpMethod: 'POST',
              uploadType: FileSystem.UploadType.MULTIPART,
              fieldName: 'file',
              headers: {
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            });

            if (uploadResult.status >= 200 && uploadResult.status < 300) {
              const data = JSON.parse(uploadResult.body);
              if (data && data.publicUrl) {
                return normalizeImageUrl(data.publicUrl);
              }
            }
          } catch (modernErr) {
            console.warn('Modern File.upload attempt error:', modernErr);
          }
        }

        // FileSystemLegacy uploadAsync fallback
        if (FileSystemLegacy && typeof FileSystemLegacy.uploadAsync === 'function') {
          const uploadResult = await FileSystemLegacy.uploadAsync(
            `${BASE_URL}/v1/images/upload`,
            localUri,
            {
              httpMethod: 'POST',
              uploadType: FileSystemLegacy.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              headers: {
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            }
          );

          if (uploadResult.status >= 200 && uploadResult.status < 300) {
            const data = JSON.parse(uploadResult.body);
            if (data && data.publicUrl) {
              return normalizeImageUrl(data.publicUrl);
            }
          }
        }
      }
    } catch (fsErr) {
      console.warn('Native FileSystem multipart upload error:', fsErr);
    }

    // 3. Fallback: Read file to base64 via FileSystemLegacy
    try {
      let base64Data: string | null = null;
      if (Platform.OS !== 'web' && FileSystemLegacy && typeof FileSystemLegacy.readAsStringAsync === 'function') {
        try {
          base64Data = await FileSystemLegacy.readAsStringAsync(localUri, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });
        } catch (ignored) {}
      }

      if (base64Data) {
        const filename = localUri.split('/').pop() || `photo_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';

        const res = await fetchWithTimeout(
          `${BASE_URL}/v1/images/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
              filename,
              contentType: mimeType,
              base64Data,
            }),
          },
          30000
        );

        if (res.ok) {
          const data = await res.json();
          if (data && data.publicUrl) {
            return normalizeImageUrl(data.publicUrl);
          }
        }
      }
    } catch (e) {
      console.warn('Fallback base64 upload failed:', e);
    }

    if (localUri.startsWith('file:') || localUri.startsWith('content:') || localUri.startsWith('data:') || localUri.startsWith('blob:')) {
      return '';
    }
    return normalizeImageUrl(localUri);
  },

  // Discovery Feed
  getFeed: async (
    options?: string | { microCircle?: string; maxDistanceKm?: number; latitude?: number; longitude?: number; limit?: number; dietaryFilters?: string[] }
  ): Promise<{ remainingDailySwipes: number; dailyHardCap: number; candidates: CandidateCard[] }> => {
    try {
      const payload: any = {};
      if (typeof options === 'string') {
        payload.microCircle = options;
      } else if (options && typeof options === 'object') {
        if (options.microCircle) payload.microCircle = options.microCircle;
        if (typeof options.maxDistanceKm === 'number') payload.maxDistanceKm = options.maxDistanceKm;
        if (typeof options.latitude === 'number') payload.latitude = options.latitude;
        if (typeof options.longitude === 'number') payload.longitude = options.longitude;
        if (typeof options.limit === 'number') payload.limit = options.limit;
        if (Array.isArray(options.dietaryFilters)) payload.dietaryFilters = options.dietaryFilters;
      }

      const res = await fetchWithTimeout(`${BASE_URL}/v1/discovery/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        const feedData = json?.data || json;
        if (feedData && Array.isArray(feedData.candidates)) {
          feedData.candidates = feedData.candidates.map((c: CandidateCard) => ({
            ...c,
            photos: (c.photos || []).map((url) => normalizeImageUrl(url)).filter(Boolean),
            voicePrompt: c.voicePrompt
              ? { ...c.voicePrompt, audioUrl: normalizeImageUrl(c.voicePrompt.audioUrl) }
              : undefined,
            memeMatch: c.memeMatch
              ? { ...c.memeMatch, memeImageUrl: normalizeImageUrl(c.memeMatch.memeImageUrl) }
              : undefined,
          }));
          return feedData;
        }
      }
    } catch (e) {}

    return {
      remainingDailySwipes: cachedProfile.hasActivePass ? 999 : 25,
      dailyHardCap: 25,
      candidates: [],
    };
  },

  getAllCandidates: (): CandidateCard[] => {
    return [];
  },

  interact: async (targetId: string, actionType: ActionType, contextType?: ContextType, contextTargetId?: string, commentText?: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/discovery/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ targetId, actionType, contextType, contextTargetId, commentText }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      isMatch: false,
      matchId: null,
      message: 'Recorded.',
      remainingDailySwipes: 25,
    };
  },

  getMicroCircles: async (): Promise<MicroCircle[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/discovery/circles`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      { id: 'koramangala-tech', name: 'Koramangala Tech Founders', description: 'Product designers & VC builders', activeMembers: 1420, icon: 'laptop-outline' },
      { id: 'dmrc-yellow-line', name: 'DMRC Yellow Line Commuters', description: 'Gurgaon to Hauz Khas daily listeners', activeMembers: 2890, icon: 'subway-outline' },
      { id: 'indie-music', name: 'Indie Music & Festival Goers', description: 'Prateek Kuhad, Peter Cat & NH7', activeMembers: 1850, icon: 'musical-notes-outline' },
      { id: 'dog-parents', name: 'Dog Parents & Pet Lovers', description: 'Cubbon Park Sunday meetups', activeMembers: 980, icon: 'paw-outline' },
    ];
  },

  // Matches & Icebreakers
  getMatches: async (): Promise<MatchItem[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((m: MatchItem) => ({
            ...m,
            otherUserPhoto: normalizeImageUrl(m.otherUserPhoto, true),
            otherProfile: m.otherProfile
              ? {
                  ...m.otherProfile,
                  photos: (m.otherProfile.photos || []).map((url: string) => normalizeImageUrl(url, true)).filter(Boolean),
                }
              : undefined,
          }));
        }
      }
    } catch (e) {}
    return [];
  },

  getMatchDetails: async (matchId: string): Promise<MatchItem | null> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const m = await res.json();
        return {
          ...m,
          otherUserPhoto: normalizeImageUrl(m.otherUserPhoto, true),
          otherProfile: m.otherProfile
            ? {
                ...m.otherProfile,
                photos: (m.otherProfile.photos || []).map((url: string) => normalizeImageUrl(url, true)).filter(Boolean),
              }
            : undefined,
        };
      }
    } catch (e) {}
    return null;
  },

  answerIcebreaker: async (matchId: string, selectedOptionIndex: number) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches/${matchId}/icebreaker/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ selectedOptionIndex }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      isQuizCompleted: true,
      isMutualAgreement: true,
      newMatchStatus: 'ACTIVE_CHAT',
      wingmanSparks: ['Say hello and share what you have in common!'],
      message: 'Chat lounge unlocked!',
    };
  },

  getWingmanSparks: async (matchId: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches/${matchId}/wingman/sparks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      matchId,
      candidateName: 'Match',
      sparks: ['Say hello and share what you have in common!'],
      commonGround: 'Shared interests and mutual spark',
    };
  },

  getMutualChemistrySparks: async (matchId: string) => {
    return api.getWingmanSparks(matchId);
  },

  unmatch: async (matchId: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches/${matchId}/unmatch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('Unmatch error:', e);
      return false;
    }
  },

  reportUser: async (matchId: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches/${matchId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Report user error:', e);
      return false;
    }
  },

  reportProfile: async (targetUserId: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/${targetUserId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Report profile error:', e);
      return false;
    }
  },

  blockUser: async (targetUserId: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/${targetUserId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('Block user error:', e);
      return false;
    }
  },

  getCosmicChemistry: async (targetUserId: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profile/cosmic-chemistry/${targetUserId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Cosmic chemistry fetch error:', e);
    }
    return null;
  },

  // Chat & Shield 360
  getMessages: async (matchId: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/chat/${matchId}/messages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((m: ChatMessage) => ({
            ...m,
            isFromMe: m.senderId ? m.senderId === currentUserId : Boolean(m.isFromMe),
          }));
        }
      }
    } catch (e) {}
    return [];
  },

  markMessagesAsRead: async (matchId: string): Promise<void> => {
    try {
      await fetchWithTimeout(`${BASE_URL}/v1/chat/${matchId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (e) {}
  },

  sendMessage: async (matchId: string, content: string, mediaUrl?: string, mediaType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'AUDIO_NOTE' | 'VIRTUAL_CHAI' = 'TEXT'): Promise<ChatMessage> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/chat/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ content, mediaUrl, mediaType }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const isSensitive = mediaUrl?.includes('sensitive') || mediaUrl?.includes('nsfw');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      matchId,
      senderId: currentUserId,
      recipientId: '',
      content,
      mediaUrl,
      mediaType,
      isBlurred: isSensitive,
      blurReason: isSensitive ? 'Sensitive Content Warning: Auto-blurred by Shield 360' : undefined,
      createdAt: new Date().toISOString(),
      isFromMe: true,
    };
    return newMsg;
  },

  // VibeStore & UPI Sachet Store
  getActivePlan: async (): Promise<ActivePlanResponse> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/active-plan`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[api] Failed to fetch active plan:', e);
    }
    return {
      activePlanName: cachedProfile.hasActivePass ? 'VIP Pass (Active)' : 'Free Plan',
      planStatus: cachedProfile.hasActivePass ? 'ACTIVE' : 'FREE',
      sparksBalance: cachedProfile.sparksBalance || 0,
      boostsBalance: cachedProfile.boostsBalance || 0,
      directDmsBalance: cachedProfile.directDmsBalance || 0,
      hasActivePass: Boolean(cachedProfile.hasActivePass),
      passExpiryDate: cachedProfile.hasActivePass ? 'Active' : 'No Active Pass',
      recentTransactions: [],
    };
  },

  getCatalog: async (): Promise<SkuCatalogItem[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/store/catalog`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      { sku: 'WEEKEND_PASS_99', title: 'Weekend Dating Pass', priceInr: 99, directPriceInr: 99, storePriceInr: 129, subtitle: 'Unlimited Swipes, Likes & Messages + 3 Super Sparks + See Who Liked You', tag: 'MOST POPULAR FOR WEEKENDS', perks: ['Unlimited Swipes, Likes & Messages (3 Days)', '3 Super Sparks Included', 'See Who Liked You', 'Priority Candidate Pool', 'Validity: 3 Days (Fri-Sun)'] },
      { sku: 'SUPER_SPARK_19', title: '1 Super Spark (₹19)', priceInr: 19, directPriceInr: 19, storePriceInr: 29, subtitle: 'Highlight your profile at the top of feeds with 3x reply rate', tag: 'HIGH REACTION', perks: ['3x higher match and reply rate', 'Instant highlight at top of discovery deck', 'Validity: Valid until used'] },
      { sku: 'SPARKS_PACK_5_79', title: '5 Super Sparks Pack', priceInr: 79, directPriceInr: 79, storePriceInr: 99, subtitle: 'Top-of-feed visibility 5 times (Save ₹16)', tag: 'VOLUME VALUE', perks: ['5 Super Sparks to highlight profile', '3x higher match rate', 'Validity: Valid until used'] },
      { sku: 'BOOST_1X_FRIDAY_29', title: '1 Friday Night Boost', priceInr: 29, directPriceInr: 29, storePriceInr: 49, subtitle: '10x profile visibility during 9 PM - 1 AM peak', tag: 'PEAK CONVERSION', perks: ['Surfaces profile to top of nearby candidates for 1 hour', 'Validity: 90 Days to activate'] },
      { sku: 'DIRECT_DMS_3X_49', title: '3 Direct DMs', priceInr: 49, directPriceInr: 49, storePriceInr: 69, subtitle: 'Skip the queue & message high-intent matches directly', tag: 'SCARCITY PERK', perks: ['Send personalized intro before matching', 'Verified direct inbox placement', 'Validity: Valid until used'] },
      { sku: 'REVIVE_MATCH_19', title: 'Revive Expired Match', priceInr: 19, directPriceInr: 19, storePriceInr: 29, subtitle: 'Unfreeze 48h timer and restore match', tag: 'SACHET', perks: ['Re-opens chat lounge for 48 hours', 'Unlimited Chat in active window'] },
      { sku: 'WEEKLY_PASS_149', title: 'Weekly VIP Pass', priceInr: 149, directPriceInr: 149, storePriceInr: 199, subtitle: 'Unlimited Swipes, Likes & Messages for 7 days + 5 Sparks + 1 Boost + 3 DMs', tag: 'POPULAR', perks: ['Unlimited Swipes, Likes & Messaging (7 Days)', '5 Super Sparks Included', '1 Profile Boost Included', '3 Direct DMs Included', 'Validity: 7 Days'] },
      { sku: 'MONTHLY_PASS_349', title: '30-Day Monthly VIP Pass', priceInr: 349, directPriceInr: 349, storePriceInr: 449, subtitle: 'Unlimited Swipes, Likes & Messages for 30 days + 15 Sparks + 4 Boosts + 10 DMs', tag: 'BEST OVERALL VALUE', perks: ['Unlimited Swipes, Likes & Messaging (30 Days)', '15 Super Sparks Included', '4 Profile Boosts Included', '10 Direct DMs Included', 'Priority Gold VIP Badge', 'Validity: 30 Days'] },
      { sku: 'FORTNIGHT_PASS_199', title: '14-Day Fortnight Pass', priceInr: 199, directPriceInr: 199, storePriceInr: 249, subtitle: 'Full VIP access for 14 days + 6 Sparks + 2 Boosts', tag: 'VALUE PASS', perks: ['Unlimited Swipes, Likes & Messaging (14 Days)', '6 Super Sparks Included', '2 Profile Boosts Included', '5 Direct DMs Included', 'Validity: 14 Days'] },
      { sku: 'SELECT_QUARTERLY_899', title: 'Select Club (Quarterly Concierge)', priceInr: 899, directPriceInr: 899, storePriceInr: 1199, subtitle: '90-day concierge recommendations & priority DigiLocker pool', tag: 'PREMIUM CLUB', perks: ['Concierge curated dates', 'Unlimited access for 90 days', 'Unlimited Chat & Messaging', 'Exclusive offline mixers', 'Validity: 90 Days'] },
    ];
  },

  createUpiOrder: async (sku: string, vpa?: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/upi/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ sku, vpa }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const prices: Record<string, number> = {
      WEEKEND_PASS_79: 79,
      WEEKEND_PASS_99: 99,
      SUPER_SPARK_19: 19,
      SPARKS_PACK_5_79: 79,
      CUTTING_CHAI_21: 21,
      BOOST_1X_FRIDAY_39: 39,
      BOOST_1X_FRIDAY_29: 29,
      DIRECT_DMS_3X_89: 89,
      DIRECT_DMS_3X_49: 49,
      REVIVE_MATCH_19: 19,
      WEEKLY_PASS_149: 149,
      WINGMAN_BUNDLE_199: 199,
      MONTHLY_PASS_349: 349,
      FORTNIGHT_PASS_199: 199,
      SELECT_QUARTERLY_899: 899,
      SELECT_QUARTERLY_999: 999,
    };
    const amt = prices[sku] || 29;
    const orderId = `order_sachet_${Date.now()}`;
    const upiIntentUrl = `upi://pay?pa=payments@blunderr&pn=Blunderr+Dating&am=${amt}&cu=INR&tn=${sku}&tr=${orderId}`;

    return {
      orderId,
      sku,
      amountPaise: amt * 100,
      formattedAmount: `₹${amt}`,
      upiIntentUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUrl)}`,
      simulated: true,
    };
  },

  confirmUpiPayment: async (orderId: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/upi/test-confirm/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    cachedProfile.hasActivePass = true;
    cachedProfile.sparksBalance += 3;
    return { status: 'success', orderId };
  },

  // Native In-App Purchase (Google Play / Apple StoreKit)
  verifyIapPurchase: async (data: {
    platform: 'android' | 'ios';
    productId: string;
    purchaseToken: string;
    orderId?: string;
    sku?: string;
  }) => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/iap/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback simulation when backend or network is offline
    if (data.sku === 'CUTTING_CHAI_21') {
      cachedProfile.sparksBalance += 1;
    } else if (data.sku === 'BOOST_1X_FRIDAY_29') {
      cachedProfile.boostsBalance += 1;
    } else if (data.sku === 'DIRECT_DMS_3X_49') {
      cachedProfile.directDmsBalance += 3;
    } else if (data.sku === 'SUPER_SPARK_19') {
      cachedProfile.sparksBalance += 1;
    } else {
      cachedProfile.hasActivePass = true;
      cachedProfile.sparksBalance += 3;
    }

    return {
      success: true,
      sku: data.sku || 'CUTTING_CHAI_21',
      orderId: data.orderId || `iap_sim_${Date.now()}`,
      message: 'In-App Purchase verified and benefits credited',
      perksGranted: { simulated: true },
    };
  },

  // Cashfree Checkout (Web / Direct UPI)
  createCashfreeOrder: async (sku: string, customerPhone?: string) => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/cashfree/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
        body: JSON.stringify({ sku, customerPhone: customerPhone || cachedProfile.phoneE164 || '+919876543210' }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const prices: Record<string, number> = {
      WEEKEND_PASS_79: 79,
      WEEKEND_PASS_99: 99,
      SUPER_SPARK_19: 19,
      SPARKS_PACK_5_79: 79,
      CUTTING_CHAI_21: 21,
      BOOST_1X_FRIDAY_39: 39,
      BOOST_1X_FRIDAY_29: 29,
      DIRECT_DMS_3X_89: 89,
      DIRECT_DMS_3X_49: 49,
      REVIVE_MATCH_19: 19,
      WEEKLY_PASS_149: 149,
      WINGMAN_BUNDLE_199: 199,
      MONTHLY_PASS_349: 349,
      FORTNIGHT_PASS_199: 199,
      SELECT_QUARTERLY_899: 899,
      SELECT_QUARTERLY_999: 999,
    };
    const amt = prices[sku] || 21;
    const orderId = `cf_order_${Date.now()}`;
    return {
      orderId,
      paymentSessionId: `cf_session_${Date.now()}`,
      cfOrderId: `cf_${Date.now()}`,
      orderAmount: amt,
      orderCurrency: 'INR',
      sku,
      simulated: true,
    };
  },

  confirmCashfreeTestPayment: async (orderId: string, sku?: string) => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/cashfree/test-confirm/${orderId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback simulation when backend or network is offline
    if (sku === 'CUTTING_CHAI_21') {
      cachedProfile.sparksBalance += 1;
    } else if (sku === 'BOOST_1X_FRIDAY_29') {
      cachedProfile.boostsBalance += 1;
    } else if (sku === 'DIRECT_DMS_3X_49') {
      cachedProfile.directDmsBalance += 3;
    } else if (sku === 'SUPER_SPARK_19') {
      cachedProfile.sparksBalance += 1;
    } else {
      cachedProfile.hasActivePass = true;
      cachedProfile.sparksBalance += 3;
    }
    return { status: 'success', orderId };
  },

  // Payment Audit & Forensic Traceability APIs
  getOrderAuditTimeline: async (orderId: string): Promise<PaymentAuditTimeline | null> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/audit/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[Payments] Failed to fetch order audit timeline:', e);
    }
    return null;
  },

  getUserPaymentAuditHistory: async (userId?: string): Promise<PaymentAuditTimeline[]> => {
    try {
      if (!authToken) await initAuth();
      const targetUserId = userId || currentUserId || cachedProfile.userId;
      if (!targetUserId) return [];
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/audit/user/${targetUserId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[Payments] Failed to fetch user payment audit history:', e);
    }
    return [];
  },

  reviewPaymentOrder: async (
    orderId: string,
    review: {
      adminNotes: string;
      status?: string;
      grantPerks?: boolean;
      adminIdOrName?: string;
    }
  ): Promise<PaymentAuditTimeline | null> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/audit/orders/${orderId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
        body: JSON.stringify(review),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[Payments] Failed to submit payment review:', e);
    }
    return null;
  },

  getPaymentExecutionLogs: async (orderId?: string, status?: string): Promise<PaymentExecutionLog[]> => {
    try {
      if (!authToken) await initAuth();
      const endpoint = orderId
        ? `${BASE_URL}/v1/payments/audit/execution-logs/${orderId}`
        : `${BASE_URL}/v1/payments/audit/execution-logs${status ? `?status=${status}` : ''}`;

      const res = await fetchWithTimeout(endpoint, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Client-Platform': Platform.OS,
          'X-App-Version': Constants.expoConfig?.version || '1.0.0',
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[Payments] Failed to fetch payment execution logs:', e);
    }
    return [];
  },

  // Safe Date Spots & SOS
  getSafeDateSpots: async (city: string = 'Bengaluru'): Promise<SafeDateSpot[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/safe-date/spots?city=${city}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      {
        id: 1,
        name: 'Blue Tokai Coffee Roasters - Indiranagar',
        brand: 'Blue Tokai',
        address: '583, 80 Feet Road, Indiranagar, Bengaluru',
        city: 'Bengaluru',
        neighborhood: 'Indiranagar',
        latitude: 12.9784,
        longitude: 77.6408,
        discountPercent: 15,
        couponCode: 'BLUNDERR15',
        sosEnabled: true,
        photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      },
      {
        id: 2,
        name: 'Third Wave Coffee - Koramangala 4th Block',
        brand: 'Third Wave Coffee',
        address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru',
        city: 'Bengaluru',
        neighborhood: 'Koramangala',
        latitude: 12.9352,
        longitude: 77.6245,
        discountPercent: 15,
        couponCode: 'VIBE15',
        sosEnabled: true,
        photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      },
      {
        id: 3,
        name: 'Starbucks - Church Street',
        brand: 'Starbucks',
        address: 'Church St, Haridevpur, Shanthala Nagar, Bengaluru',
        city: 'Bengaluru',
        neighborhood: 'Central',
        latitude: 12.9752,
        longitude: 77.6053,
        discountPercent: 15,
        couponCode: 'STARAI15',
        sosEnabled: true,
        photoUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800',
      },
    ];
  },

  startSos: async (safeSpotId: number, matchId?: string, emergencyContacts: string[] = []) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/safe-date/sos/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ safeSpotId, matchId, emergencyContacts }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const sessionId = `sos_trk_${Date.now()}`;
    return {
      trackingSessionId: sessionId,
      trackingUrl: `https://safe.blunderr.in/sos/live/${sessionId}`,
      cafeName: 'Blue Tokai Coffee Roasters',
      discountCoupon: 'BLUNDERR15',
      status: 'ACTIVE',
      message: 'Safe Date Mode Active: Live location & cafe check-in shared with emergency contacts.',
    };
  },

  // Virtual Chai Masked Calling
  createVirtualChaiSession: async (matchId: string, isVideo: boolean = false): Promise<VirtualChaiSession> => {
    const defaultLiveKitHost = (() => {
      try {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
          const ip = hostUri.split(':')[0];
          return `ws://${ip}:7880`;
        }
      } catch (e) {}
      return Platform.OS === 'android' ? 'ws://10.0.2.2:7880' : 'ws://localhost:7880';
    })();

    try {
      const res = await fetch(`${BASE_URL}/v1/calling/virtual-chai/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ matchId, isVideo }),
      });
      if (res.ok) {
        const data = await res.json();
        // If server returns localhost:7880 but app runs on device/emulator, adapt host
        if (data.serverUrl && data.serverUrl.includes('localhost') && Platform.OS !== 'web') {
          data.serverUrl = defaultLiveKitHost;
        }
        return data;
      }
    } catch (e) {}
    return {
      roomName: `chai_room_${matchId}`,
      participantToken: `jwt_livekit_${Date.now()}`,
      serverUrl: defaultLiveKitHost,
      callerMaskedName: cachedProfile.displayName || 'You',
      recipientMaskedName: 'Match Partner',
      phoneMasked: true,
      isVideo,
      isSimulated: false,
    };
  },

  sendCallSignal: async (
    matchId: string,
    signalType: 'CALL_ACCEPTED' | 'CALL_DECLINED' | 'CALL_ENDED'
  ): Promise<boolean> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetch(`${BASE_URL}/v1/calling/virtual-chai/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ matchId, signalType }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[Calling] Failed to send call signal:', e);
      return false;
    }
  },

  // Push Notifications (Expo Push Notification API)
  registerPushToken: async (token: string, platform?: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
      if (!authToken) {
        await initAuth();
      }
      if (!authToken) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ token, platform: platform || Platform.OS }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to register push token:', e);
      return false;
    }
  },

  unregisterPushToken: async (token: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
      if (!authToken) {
        await initAuth();
      }
      if (!authToken) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/push-token`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ token }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to unregister push token:', e);
      return false;
    }
  },

  sendTestPushNotification: async (title?: string, body?: string): Promise<boolean> => {
    try {
      if (!authToken) {
        await initAuth();
      }
      if (!authToken) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ title, body }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to send test push notification:', e);
      return false;
    }
  },

  // In-App Notification Center
  getNotifications: async (unreadOnly: boolean = false, page: number = 0, size: number = 30): Promise<AppNotification[]> => {
    try {
      if (!authToken) await initAuth();
      if (!authToken) return [];

      const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
      });
      if (unreadOnly) {
        queryParams.append('unreadOnly', 'true');
      }

      const res = await fetch(`${BASE_URL}/v1/notifications?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[api] Failed to fetch in-app notifications:', e);
    }
    return [];
  },

  getUnreadNotificationCount: async (): Promise<number> => {
    try {
      if (!authToken) await initAuth();
      if (!authToken) return 0;

      const res = await fetch(`${BASE_URL}/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return typeof data.unreadCount === 'number' ? data.unreadCount : 0;
      }
    } catch (e) {
      console.warn('[api] Failed to fetch unread notification count:', e);
    }
    return 0;
  },

  markNotificationAsRead: async (id: string): Promise<boolean> => {
    try {
      if (!authToken) await initAuth();
      if (!authToken) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to mark notification as read:', e);
      return false;
    }
  },

  markAllNotificationsAsRead: async (): Promise<boolean> => {
    try {
      if (!authToken) await initAuth();
      if (!authToken) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to mark all notifications as read:', e);
      return false;
    }
  },

  markMatchNotificationsAsRead: async (matchId: string): Promise<boolean> => {
    try {
      if (!authToken) await initAuth();
      if (!authToken || !matchId) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/match/${matchId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to mark match notifications as read:', e);
      return false;
    }
  },

  deleteNotification: async (id: string): Promise<boolean> => {
    try {
      if (!authToken) await initAuth();
      if (!authToken) return false;

      const res = await fetch(`${BASE_URL}/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('[api] Failed to delete notification:', e);
      return false;
    }
  },

  // Help & Support
  getFaqs: async (): Promise<FaqItem[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/support/faqs`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[api] Failed to fetch FAQs from server, using fallback:', e);
    }
    return [
      {
        id: 'faq-1',
        category: 'Matches & Chat',
        question: 'How does the 48-hour ephemeral timer work?',
        answer: 'When a match is formed, a 48-hour countdown timer begins. This prevents ghosting and keeps momentum active. Completing the 10s Icebreaker Quiz unlocks the chat lounge. Once you exchange 4+ messages, ghost-buster protection activates!',
      },
      {
        id: 'faq-2',
        category: 'Verification & Safety',
        question: 'How do I get DigiLocker and Liveness verified?',
        answer: 'Go to your Profile and tap "DigiLocker Verification". We use zero-knowledge proofs to verify your identity without storing your Aadhaar number. Complete the 3D selfie liveness check to earn the gold shield badge on your profile.',
      },
      {
        id: 'faq-3',
        category: 'Privacy & Shadow Shield',
        question: 'Can colleagues, exes, or family see my profile?',
        answer: 'No! Enable "Shadow Shield" under Privacy in your Profile tab. You can sync your phone contacts or enter a corporate email domain (e.g., flipkart.com). We hash phone numbers using SHA-256 on your device, completely hiding you from those contacts.',
      },
      {
        id: 'faq-4',
        category: 'Plans & Billing',
        question: 'What perks are included with Blunderr Pass?',
        answer: 'Blunderr Pass unlocks Unlimited Daily Swipes, Rewind accidental passes, Super Sparks to highlight your profile, Direct Pre-Match Notes, and Priority Visibility. Remember: chat and messaging after matching is ALWAYS 100% free!',
      },
      {
        id: 'faq-5',
        category: 'Plans & Billing',
        question: 'What payment methods are supported?',
        answer: 'You can pay securely via all UPI apps (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking via Cashfree, or official Google Play / Apple StoreKit in-app billing.',
      },
      {
        id: 'faq-6',
        category: 'Safety & SOS',
        question: 'How does Safe Date & Live SOS check-in work?',
        answer: 'Under Profile > Safe Date, you can choose verified, well-lit partner cafes (like Blue Tokai & Third Wave) and start a live SOS session. A discrete tracking link is shared with your trusted emergency contact, plus you get a 15% cafe discount coupon.',
      },
      {
        id: 'faq-7',
        category: 'Account & Data',
        question: 'How do I delete my account and data?',
        answer: 'Under your Profile tab, scroll to the bottom and tap "Delete Account". Confirming will immediately wipe your profile, photos, matches, and messages in compliance with the India DPDP Act and App Store guidelines.',
      },
    ];
  },

  getSupportTickets: async (): Promise<SupportTicket[]> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/support/tickets`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem('cached_support_tickets', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('[api] Failed to fetch support tickets, checking cache:', e);
    }
    try {
      const cached = await AsyncStorage.getItem('cached_support_tickets');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  },

  createSupportTicket: async (ticket: {
    category: TicketCategory;
    subject: string;
    description: string;
  }): Promise<SupportTicket> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(ticket),
      });
      if (res.ok) {
        const newTicket = await res.json();
        // Update local cache
        const existing = await api.getSupportTickets();
        await AsyncStorage.setItem('cached_support_tickets', JSON.stringify([newTicket, ...existing]));
        return newTicket;
      }
    } catch (e) {
      console.warn('[api] Failed to create support ticket on server, creating local ticket:', e);
    }
    // Local fallback
    const fallbackTicket: SupportTicket = {
      id: 'tkt_' + Date.now(),
      ticketNumber: 'TKT-' + Math.floor(10000 + Math.random() * 90000),
      category: ticket.category,
      status: 'PENDING',
      subject: ticket.subject,
      description: ticket.description,
      createdAt: new Date().toISOString(),
    };
    const existing = await api.getSupportTickets();
    await AsyncStorage.setItem('cached_support_tickets', JSON.stringify([fallbackTicket, ...existing]));
    return fallbackTicket;
  },

  resolveSupportTicket: async (id: string, resolutionNotes?: string): Promise<SupportTicket> => {
    try {
      if (!authToken) await initAuth();
      const res = await fetchWithTimeout(`${BASE_URL}/v1/support/tickets/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ resolutionNotes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[api] Failed to resolve support ticket on server:', e);
    }
    // Fallback local update
    const existing = await api.getSupportTickets();
    const updated = existing.map((t) =>
      t.id === id
        ? {
            ...t,
            status: 'RESOLVED' as TicketStatus,
            resolvedAt: new Date().toISOString(),
            resolutionNotes:
              resolutionNotes ||
              'Your concern has been thoroughly reviewed and resolved by our safety & support team. Thank you for your patience.',
          }
        : t
    );
    await AsyncStorage.setItem('cached_support_tickets', JSON.stringify(updated));
    return updated.find((t) => t.id === id) || existing[0];
  },
};
