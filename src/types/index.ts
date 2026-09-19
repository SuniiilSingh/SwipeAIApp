export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY';

export type DatingIntent =
  | 'MARRIAGE_MINDED'
  | 'SERIOUS_DATING'
  | 'CASUAL_DATES'
  | 'FIGURING_IT_OUT';

export type DietaryPreference =
  | 'STRICT_JAIN'
  | 'PURE_VEG'
  | 'VEGAN'
  | 'EGGETARIAN'
  | 'NON_VEG';

export type LivingStatus = 'WITH_PARENTS' | 'INDEPENDENT_FLAT' | 'PG';

export type MatchStatus =
  | 'PENDING_ICEBREAKER'
  | 'ACTIVE_CHAT'
  | 'EXPIRED'
  | 'UNMATCHED';

export type ActionType = 'LIKE' | 'PASS' | 'SUPER_CHAI';
export type ContextType = 'PHOTO' | 'VOICE' | 'PROMPT' | 'MEME';

export interface UserProfile {
  userId: string;
  phoneE164: string;
  displayName: string;
  fullName?: string;
  bio?: string;
  age: number;
  birthDate?: string;
  gender?: Gender;
  intent?: DatingIntent;
  digilockerVerified: boolean;
  whatsappVerified: boolean;
  livenessScore: number;
  karmaScore: number;
  dietaryPref?: DietaryPreference;
  livingStatus?: LivingStatus;
  languagesSpoken: string[];
  zodiacSign: string;
  sunSign: string;
  moonSign: string;
  voicePromptUrl?: string;
  voicePromptDuration?: number;
  voicePromptText?: string;
  company?: string;
  occupation?: string;
  job?: string;
  education?: string;
  institute?: string;
  interests?: string;
  height?: number;
  location?: string;
  maxDistanceKm?: number;
  latitude?: number;
  longitude?: number;
  sexualOrientation?: string;
  showOrientationOnProfile?: boolean;
  genderDisplay?: string;
  showGenderOnProfile?: boolean;
  genderPreferenceDisplay?: string;
  relationshipIntent?: string;
  profilePromptQuestion?: string;
  profilePromptAnswer?: string;
  photo1?: string;
  photo2?: string;
  photo3?: string;
  photo4?: string;
  photo5?: string;
  photo6?: string;
  selfieUrl?: string;
  smokingHabit?: string;
  drinkingHabit?: string;
  hobbies?: string;
  vacationPreference?: string;
  completionPercentage?: number;
  city?: string;
  neighborhood?: string;
  microCircle?: string;
  photos: string[];
  sparksBalance: number;
  boostsBalance: number;
  directDmsBalance: number;
  hasActivePass: boolean;
  selectedMemeUrl?: string;
  selectedMemeTitle?: string;
}

export interface CandidateCard {
  userId: string;
  displayName: string;
  age: number;
  isDigilockerVerified: boolean;
  isWhatsappVerified: boolean;
  livenessScore: number;
  distanceKm: number;
  culturalBadges: {
    diet: DietaryPreference;
    living: LivingStatus;
    languages: string[];
    zodiac: string;
  };
  voicePrompt?: {
    audioUrl: string;
    durationSec: number;
    promptText: string;
  };
  memeMatch?: {
    matchPercent: number;
    memeTitle: string;
    memeImageUrl: string;
  };
  cosmicChemistry?: {
    synergyTag: string;
    score: number;
  };
  compatibilityScore: number;
  bio: string;
  fullName?: string;
  company?: string;
  occupation?: string;
  job?: string;
  education?: string;
  institute?: string;
  height?: number;
  interests?: string;
  sexualOrientation?: string;
  genderDisplay?: string;
  relationshipIntent?: string;
  profilePromptQuestion?: string;
  profilePromptAnswer?: string;
  sunSign?: string;
  moonSign?: string;
  karmaScore?: number;
  smokingHabit?: string;
  drinkingHabit?: string;
  hobbies?: string;
  vacationPreference?: string;
  languagesSpoken?: string[];
  city?: string;
  neighborhood?: string;
  microCircle?: string;
  photos: string[];
  desireMatchPercent?: number;
  desireMatchHighlights?: string[];
}

export interface DesireProfile {
  userId?: string;
  isConfigured?: boolean;
  minAge: number;
  maxAge: number;
  ageFlexible: boolean;
  maxDistanceKm: number;
  dietaryHarmony: string;
  smokingComfort: string;
  drinkingComfort: string;
  livingSituationComfort: string;
  relationshipIntentMatch: string;
  weekendVibe: string;
  communicationPace: string;
  banterStyle: string;
  loveLanguage: string;
  greenFlags: string[];
  preferredProfessions?: string[];
  naturalLanguagePrompt?: string;
  updatedAt?: string;
}

export interface IcebreakerQuiz {
  quizId: string;
  title: string;
  question: string;
  options: string[];
  userAAnswer?: number | null;
  userBAnswer?: number | null;
  isCompleted: boolean;
  isMutualAgreement: boolean;
  wingmanRecommendation?: string;
}

export interface MatchItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string;
  otherUserAge: number;
  isDigilockerVerified: boolean;
  status: MatchStatus;
  messagesCount: number;
  remainingHours: number;
  expiresAt: string;
  matchedAt: string;
  icebreakerQuiz?: IcebreakerQuiz;
  lastMessage?: string;
  lastMessageTime?: string;
  otherProfile?: CandidateCard;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'TEXT' | 'AUDIO_NOTE' | 'IMAGE' | 'MEME' | 'VIRTUAL_CHAI' | 'SYSTEM';
  status?: 'SENT' | 'DELIVERED' | 'READ';
  isEncrypted?: boolean;
  encryptionAlgo?: string;
  isBlurred?: boolean;
  blurReason?: string;
  readAt?: string;
  createdAt: string;
  isFromMe: boolean;
}

export interface SafeDateSpot {
  id: number;
  name: string;
  brand: string;
  address: string;
  city: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
  discountPercent: number;
  couponCode: string;
  sosEnabled: boolean;
  photoUrl?: string;
}

export interface SkuCatalogItem {
  sku: string;
  title: string;
  priceInr: number;
  subtitle: string;
  tag?: string;
  perks: string[];
}

export interface MicroCircle {
  id: string;
  name: string;
  description: string;
  activeMembers: number;
  icon: string;
}

export interface VirtualChaiSession {
  roomName: string;
  participantToken: string;
  serverUrl: string;
  callerMaskedName: string;
  recipientMaskedName: string;
  phoneMasked: boolean;
  isVideo?: boolean;
  isSimulated?: boolean;
}
