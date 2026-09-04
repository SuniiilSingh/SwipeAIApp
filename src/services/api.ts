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
} from '@/types';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:8080`;
    }
  } catch (e) {}
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
};

const BASE_URL = getBaseUrl();

// Safe fetch with 2.5s timeout to guarantee instant responsiveness on real mobile devices
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> => {
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

let authToken: string | null = null;
let currentUserId: string = '8f3b2c14-5d82-4f2a-89b1-a1e948c27189';

export const setAuthToken = (token: string, userId?: string) => {
  authToken = token;
  if (userId) currentUserId = userId;
};

export const getAuthToken = () => authToken;
export const getCurrentUserId = () => currentUserId;

let mockProfile: UserProfile = {
  userId: currentUserId,
  phoneE164: '+919876543210',
  displayName: 'Ananya',
  fullName: 'Ananya Sharma',
  bio: 'Product Designer @ Fintech. Obsessed with typography, specialty filter coffee, and finding the crispiest butter masala dosa in Bangalore.',
  age: 24,
  gender: 'FEMALE',
  intent: 'SERIOUS_DATING',
  digilockerVerified: true,
  whatsappVerified: true,
  livenessScore: 0.99,
  karmaScore: 145,
  dietaryPref: 'PURE_VEG',
  livingStatus: 'INDEPENDENT_FLAT',
  languagesSpoken: ['English', 'Hindi', 'Kannada', 'Hinglish'],
  zodiacSign: 'Leo',
  sunSign: 'Leo',
  moonSign: 'Scorpio',
  voicePromptUrl: 'https://cdn.swipeai.in/v/ananya_chai.m4a',
  voicePromptDuration: 14,
  voicePromptText: 'Elaichi chai is superior to masala chai, don’t debate me.',
  company: 'Fintech Corp',
  occupation: 'Product Designer',
  job: 'Product Designer',
  education: 'Rhode Island School of Design / NID',
  interests: 'Design, Coffee, Biryani, Stand-up comedy, Indie pop, Spotify',
  height: 165,
  location: 'Bengaluru',
  maxDistanceKm: 50,
  sexualOrientation: 'Straight',
  showOrientationOnProfile: true,
  genderDisplay: 'Woman',
  showGenderOnProfile: true,
  genderPreferenceDisplay: 'Men',
  relationshipIntent: 'Long-term partner',
  profilePromptQuestion: 'The key to my heart is...',
  profilePromptAnswer: 'Authentic Indiranagar filter coffee and thoughtful Figma critiques.',
  photo1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
  photo2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
  photo3: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
  photo4: '',
  photo5: '',
  photo6: '',
  selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
  smokingHabit: 'Non-Smoker 🚭',
  drinkingHabit: 'Social / Weekend Drinker 🍷',
  hobbies: 'Specialty Coffee, Typography, Cycling, Photography, Pottery',
  vacationPreference: 'Majestic Mountains 🏔️',
  completionPercentage: 90,
  city: 'Bengaluru',
  neighborhood: 'Indiranagar',
  microCircle: 'Koramangala Tech Founders',
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
  ],
  sparksBalance: 3,
  boostsBalance: 1,
  directDmsBalance: 2,
  hasActivePass: false,
};

// Seed Discovery candidates with 10 FULL dummy profiles
let mockCandidates: CandidateCard[] = [
  {
    userId: 'c1-rohan-26',
    displayName: 'Rohan',
    fullName: 'Rohan Verma',
    age: 26,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.98,
    distanceKm: 3.8,
    culturalBadges: {
      diet: 'EGGETARIAN',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Hindi', 'Kannada'],
      zodiac: 'Aries',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/rohan.m4a',
      durationSec: 18,
      promptText: 'Dilli ki sardi ya Mumbai ki baarish? Bangalore weather wins.',
    },
    memeMatch: {
      matchPercent: 88,
      memeTitle: 'Explaining Bangalore house deposits to parents',
      memeImageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600',
    },
    cosmicChemistry: {
      synergyTag: '91% Electric Chemistry',
      score: 91,
    },
    compatibilityScore: 94,
    bio: 'Tech Lead @ SaaS. Weekend cyclist, cold brew enthusiast, acoustic guitar. Looking for thoughtful banter, quiet book cafes, and someone to explore hidden culinary gems in Bangalore with.',
    company: 'SaaS Startup',
    occupation: 'Tech Lead',
    job: 'Tech Lead',
    education: 'BITS Pilani (Computer Science & Engineering)',
    height: 180,
    interests: 'Cricket, Cycling, Specialty Coffee, Stand-up comedy, Spotify, Road trips',
    sexualOrientation: 'Straight',
    genderDisplay: 'Man',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'The key to my heart is...',
    profilePromptAnswer: 'Authentic Indiranagar filter coffee, dry wit, and spontaneous Sunday morning cycling trips.',
    sunSign: 'Aries',
    moonSign: 'Leo',
    karmaScore: 182,
    smokingHabit: 'Non-Smoker 🚭',
    drinkingHabit: 'Social / Weekend Drinker 🍷',
    hobbies: 'Cycling, Acoustic guitar, Cold brew, Photography, Trekking',
    vacationPreference: 'Majestic Mountains 🏔️',
    city: 'Bengaluru',
    neighborhood: 'Indiranagar',
    microCircle: 'Koramangala Tech Founders',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    ],
  },
  {
    userId: 'c2-priya-25',
    displayName: 'Priya',
    fullName: 'Priya Mehta',
    age: 25,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.97,
    distanceKm: 4.2,
    culturalBadges: {
      diet: 'STRICT_JAIN',
      living: 'WITH_PARENTS',
      languages: ['English', 'Hindi', 'Gujarati'],
      zodiac: 'Scorpio',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/priya.m4a',
      durationSec: 12,
      promptText: 'Ask me about old Bangalore heritage bungalows.',
    },
    memeMatch: {
      matchPercent: 92,
      memeTitle: 'Finding aesthetic cafe with charging points',
      memeImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600',
    },
    cosmicChemistry: {
      synergyTag: '88% Deep Resonance',
      score: 88,
    },
    compatibilityScore: 89,
    bio: 'Architect & Urban Sketcher. Specialty matcha, pottery, indie gigs, and documenting vintage colonial architecture before it disappears.',
    company: 'Studio Decode',
    occupation: 'Architect',
    job: 'Architect',
    education: 'CEPT Ahmedabad (Architecture & Urban Design)',
    height: 165,
    interests: 'Architecture, Pottery, Art, Matcha, Indie music, Heritage walks, Reading',
    sexualOrientation: 'Straight',
    genderDisplay: 'Woman',
    relationshipIntent: 'Long-term, open to short',
    profilePromptQuestion: 'My most controversial opinion is...',
    profilePromptAnswer: 'Modern glass buildings have zero soul compared to red brick courtyards.',
    sunSign: 'Scorpio',
    moonSign: 'Cancer',
    karmaScore: 194,
    smokingHabit: 'Non-Smoker 🚭',
    drinkingHabit: 'Non-Drinker / Teetotaler 🚫🍺',
    hobbies: 'Urban Sketching, Pottery, Architecture, Reading, Matcha',
    vacationPreference: 'Sunny Beaches 🏖️',
    city: 'Bengaluru',
    neighborhood: 'Koramangala',
    microCircle: 'Indie Music & Festival Goers',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
    ],
  },
  {
    userId: 'c3-kabir-27',
    displayName: 'Kabir',
    fullName: 'Kabir Sengupta',
    age: 27,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.99,
    distanceKm: 6.1,
    culturalBadges: {
      diet: 'PURE_VEG',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Hindi', 'Bengali'],
      zodiac: 'Sagittarius',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/kabir.m4a',
      durationSec: 15,
      promptText: 'Best live indie music spots in the city?',
    },
    memeMatch: {
      matchPercent: 85,
      memeTitle: 'Bangalore auto drivers rejecting rides',
      memeImageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
    },
    cosmicChemistry: {
      synergyTag: '93% Spontaneous Spark',
      score: 93,
    },
    compatibilityScore: 92,
    bio: 'Brand Strategist. Vinyl collector, sourdough baker, and golden retriever foster dad. Passionate about indie documentaries, jazz, and midnight kitchen experiments.',
    company: 'Ogilvy & Mather',
    occupation: 'Brand Strategist',
    job: 'Brand Strategist',
    education: 'St. Xavier’s College & MICA Ahmedabad',
    height: 178,
    interests: 'Vinyl records, Sourdough baking, Dogs, Jazz, Badminton, Travel, Coffee',
    sexualOrientation: 'Straight',
    genderDisplay: 'Man',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'We’ll get along if...',
    profilePromptAnswer: 'You love discovering weird retro vinyls at second-hand record shops on Church Street.',
    sunSign: 'Sagittarius',
    moonSign: 'Gemini',
    karmaScore: 175,
    smokingHabit: 'Social / Occasional 🚬',
    drinkingHabit: 'Social / Weekend Drinker 🍷',
    hobbies: 'Vinyl Records, Sourdough Baking, Dog Fostering, Jazz, Badminton',
    vacationPreference: 'Both (Mountain Streams & Beach Sunsets) 🌊⛰️',
    city: 'Bengaluru',
    neighborhood: 'Church Street',
    microCircle: 'Dog Parents & Pet Lovers',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    ],
  },
  {
    userId: 'c4-ananya-24',
    displayName: 'Ananya',
    fullName: 'Ananya Iyer',
    age: 24,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.99,
    distanceKm: 2.5,
    culturalBadges: {
      diet: 'PURE_VEG',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Tamil', 'Hindi'],
      zodiac: 'Taurus',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/ananya.m4a',
      durationSec: 14,
      promptText: 'Convince me that Indiranagar coffee beats Mylapore filter coffee.',
    },
    memeMatch: {
      matchPercent: 95,
      memeTitle: 'Figma autolayout breaking right before design review',
      memeImageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
    },
    cosmicChemistry: {
      synergyTag: '96% Soul Sync',
      score: 96,
    },
    compatibilityScore: 97,
    bio: 'Product Designer @ Fintech. Ceramic pottery hobbyist, 35mm film shooter, and typography obsessive. Love exploring art galleries, quiet book cafes, and Sunday brunches.',
    company: 'Cred',
    occupation: 'Lead Product Designer',
    job: 'Lead Product Designer',
    education: 'NID Ahmedabad (Interaction Design)',
    height: 167,
    interests: 'Design, Specialty Coffee, Film Photography, Pottery, Yoga, Indie Pop',
    sexualOrientation: 'Straight',
    genderDisplay: 'Woman',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'I’m looking for someone who...',
    profilePromptAnswer: 'Appreciates good typography, doesn’t rush through art galleries, and can hold a 2 AM conversation about aesthetics.',
    sunSign: 'Taurus',
    moonSign: 'Libra',
    karmaScore: 195,
    smokingHabit: 'Non-Smoker 🚭',
    drinkingHabit: 'Social / Weekend Drinker 🍷',
    hobbies: 'Film Photography, Coffee Brewing, Clay Pottery, Yoga, Solo Travel',
    vacationPreference: 'Majestic Mountains 🏔️',
    city: 'Bengaluru',
    neighborhood: 'HSR Layout',
    microCircle: 'Design & Creative Thinkers',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    ],
  },
  {
    userId: 'c5-aarav-28',
    displayName: 'Aarav',
    fullName: 'Aarav Sharma',
    age: 28,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.98,
    distanceKm: 4.8,
    culturalBadges: {
      diet: 'NON_VEG',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Hindi', 'Punjabi'],
      zodiac: 'Leo',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/aarav.m4a',
      durationSec: 20,
      promptText: 'First marathon or first startup: which is harder?',
    },
    memeMatch: {
      matchPercent: 89,
      memeTitle: 'Pitch deck slide 14 vs reality',
      memeImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600',
    },
    cosmicChemistry: {
      synergyTag: '90% High Energy Duo',
      score: 90,
    },
    compatibilityScore: 91,
    bio: 'Fintech Founder & Angel Investor. Marathon runner, scuba certified, and weekend tennis player. Love high-conviction ideas, electronic music, and late-night highway drives.',
    company: 'SeedFin',
    occupation: 'Founder & CEO',
    job: 'Founder & CEO',
    education: 'IIT Bombay (Electrical Engineering)',
    height: 184,
    interests: 'Startups, Tennis, Running, Scuba Diving, Electronic Music, Travel',
    sexualOrientation: 'Straight',
    genderDisplay: 'Man',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'A random fact I love is...',
    profilePromptAnswer: 'Honey never spoils. Also, Indiranagar auto drivers are the world’s most resilient negotiators.',
    sunSign: 'Leo',
    moonSign: 'Aries',
    karmaScore: 188,
    smokingHabit: 'Non-Smoker 🚭',
    drinkingHabit: 'Regular Drinker 🍻',
    hobbies: 'Scuba Diving, Marathon Running, Podcasting, Tennis, Travel',
    vacationPreference: 'Sunny Beaches 🏖️',
    city: 'Bengaluru',
    neighborhood: 'Indiranagar',
    microCircle: 'Koramangala Tech Founders',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    ],
  },
  {
    userId: 'c6-meera-26',
    displayName: 'Meera',
    fullName: 'Meera Nambiar',
    age: 26,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.99,
    distanceKm: 5.4,
    culturalBadges: {
      diet: 'VEGAN',
      living: 'PG',
      languages: ['English', 'Malayalam', 'Hindi', 'French'],
      zodiac: 'Virgo',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/meera.m4a',
      durationSec: 16,
      promptText: 'Classical Bharatanatyam meets cognitive neuroscience.',
    },
    memeMatch: {
      matchPercent: 94,
      memeTitle: 'Reading peer-reviewed neuroscience papers on Sunday morning',
      memeImageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
    },
    cosmicChemistry: {
      synergyTag: '94% Intellectual Harmony',
      score: 94,
    },
    compatibilityScore: 93,
    bio: 'Neuroscience Researcher @ IISc & Classical Bharatanatyam dancer. Plant lover, tea enthusiast, and weekend trekker. Believer in mindful living and deep empathy.',
    company: 'Indian Institute of Science (IISc)',
    occupation: 'Neuroscience Researcher',
    job: 'Neuroscience Researcher',
    education: 'IISc Bengaluru & Kalakshetra Foundation',
    height: 163,
    interests: 'Classical Dance, Neuroscience, Hiking, Books, Classical Music, Vegan Food',
    sexualOrientation: 'Straight',
    genderDisplay: 'Woman',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'A boundary of mine is...',
    profilePromptAnswer: 'Weekend digital detox after 8 PM. Let’s talk face-to-face over artisanal chamomile tea.',
    sunSign: 'Virgo',
    moonSign: 'Taurus',
    karmaScore: 198,
    smokingHabit: 'Non-Smoker 🚭',
    drinkingHabit: 'Sober / Mindful 🧘',
    hobbies: 'Classical Dance, Hiking, Neuroscience Podcasting, Gardening, Reading',
    vacationPreference: 'Majestic Mountains 🏔️',
    city: 'Bengaluru',
    neighborhood: 'Malleshwaram',
    microCircle: 'Researchers & Deep Thinkers',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    ],
  },
  {
    userId: 'c7-dev-27',
    displayName: 'Dev',
    fullName: 'Devanshu Joshi',
    age: 27,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.98,
    distanceKm: 7.2,
    culturalBadges: {
      diet: 'STRICT_JAIN',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Hindi', 'Marwari'],
      zodiac: 'Capricorn',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/dev.m4a',
      durationSec: 15,
      promptText: 'Ask me about my telescope setup in Spiti Valley.',
    },
    memeMatch: {
      matchPercent: 91,
      memeTitle: 'Waiting for clouds to clear during star photography',
      memeImageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600',
    },
    cosmicChemistry: {
      synergyTag: '87% Steady Grounding',
      score: 87,
    },
    compatibilityScore: 90,
    bio: 'Senior Software Engineer @ Google. Astrophotographer, piano player, and serious chess nerd. Spend my long weekends chasing dark sky reserves in Himachal and Ladakh.',
    company: 'Google',
    occupation: 'Senior Software Engineer',
    job: 'Senior Software Engineer',
    education: 'BITS Pilani Goa (Computer Science)',
    height: 181,
    interests: 'Trekking, Chess, Astrophotography, Piano, Board Games, Tech',
    sexualOrientation: 'Straight',
    genderDisplay: 'Man',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'The key to my heart is...',
    profilePromptAnswer: 'Starry Himalayan skies with zero light pollution and a hot thermos of cardamom ginger tea.',
    sunSign: 'Capricorn',
    moonSign: 'Virgo',
    karmaScore: 185,
    smokingHabit: 'Non-Smoker 🚭',
    drinkingHabit: 'Non-Drinker / Teetotaler 🚫🍺',
    hobbies: 'Trekking & Hiking, Astrophotography, Board Games, Piano, Chess',
    vacationPreference: 'Majestic Mountains 🏔️',
    city: 'Bengaluru',
    neighborhood: 'Bellandur',
    microCircle: 'Stargazers & Trekkers',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800',
    ],
  },
  {
    userId: 'c8-tanvi-25',
    displayName: 'Tanvi',
    fullName: 'Tanvi Kulkarni',
    age: 25,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.99,
    distanceKm: 3.1,
    culturalBadges: {
      diet: 'EGGETARIAN',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Marathi', 'Hindi', 'French'],
      zodiac: 'Cancer',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/tanvi.m4a',
      durationSec: 13,
      promptText: 'Life is too short for grocery store sourdough.',
    },
    memeMatch: {
      matchPercent: 96,
      memeTitle: 'Accidentally buying 10kg of imported French butter',
      memeImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
    },
    cosmicChemistry: {
      synergyTag: '95% Sweet Compatibility',
      score: 95,
    },
    compatibilityScore: 96,
    bio: 'Pastry Chef & Owner @ The Little Crumb. Sourdough whisperer, olive oil collector, and avid ocean swimmer. Weekend routine: French patisserie experiments & jazz playlists.',
    company: 'The Little Crumb Patisserie',
    occupation: 'Head Pastry Chef & Founder',
    job: 'Head Pastry Chef & Founder',
    education: 'Le Cordon Bleu Paris & Welcomgroup Manipal',
    height: 162,
    interests: 'Baking, French Pastries, Swimming, Olive Oil Tasting, Watercolor, Travel',
    sexualOrientation: 'Straight',
    genderDisplay: 'Woman',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'We’ll get along if...',
    profilePromptAnswer: 'You can appreciate a genuinely flaky butter croissant and don’t mind being my dessert taste-tester.',
    sunSign: 'Cancer',
    moonSign: 'Pisces',
    karmaScore: 180,
    smokingHabit: 'Social / Occasional 🚬',
    drinkingHabit: 'Social / Weekend Drinker 🍷',
    hobbies: 'Cooking & Baking, Sourdough, Swimming, Watercolor Painting, Travel',
    vacationPreference: 'Sunny Beaches 🏖️',
    city: 'Bengaluru',
    neighborhood: 'Lavelle Road',
    microCircle: 'Culinary Artisans & Bakers',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    ],
  },
  {
    userId: 'c9-vik-29',
    displayName: 'Vikram',
    fullName: 'Vikramaditya Singhania',
    age: 29,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.98,
    distanceKm: 5.0,
    culturalBadges: {
      diet: 'NON_VEG',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Hindi'],
      zodiac: 'Libra',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/vik.m4a',
      durationSec: 17,
      promptText: 'Squash matches on Tuesday, Formula 1 debate on Sunday.',
    },
    memeMatch: {
      matchPercent: 87,
      memeTitle: 'Explaining Ferrari pit stop strategy at dinner',
      memeImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600',
    },
    cosmicChemistry: {
      synergyTag: '89% Sophisticated Resonance',
      score: 89,
    },
    compatibilityScore: 88,
    bio: 'Engagement Manager @ McKinsey. Formula 1 fanatic, squash player, and stand-up comedy regular. When not traveling for clients, exploring Bangalore speakeasies.',
    company: 'McKinsey & Company',
    occupation: 'Engagement Manager',
    job: 'Engagement Manager',
    education: 'SRCC Delhi & IIM Ahmedabad',
    height: 183,
    interests: 'Formula 1, Squash, Economics, Stand-up Comedy, Wine, Road Trips',
    sexualOrientation: 'Straight',
    genderDisplay: 'Man',
    relationshipIntent: 'Long-term partner',
    profilePromptQuestion: 'First concert I ever went to was...',
    profilePromptAnswer: 'Prateek Kuhad in 2017 before he blew up worldwide. Still know all the lyrics by heart.',
    sunSign: 'Libra',
    moonSign: 'Aquarius',
    karmaScore: 172,
    smokingHabit: 'Trying to Quit 🌿',
    drinkingHabit: 'Social / Weekend Drinker 🍷',
    hobbies: 'Squash, Golf, Stand-up Comedy, Wine Tasting, Formula 1',
    vacationPreference: 'Both (Mountain Streams & Beach Sunsets) 🌊⛰️',
    city: 'Bengaluru',
    neighborhood: 'Richmond Town',
    microCircle: 'Consultants & Strategists',
    photos: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    ],
  },
  {
    userId: 'c10-zoya-26',
    displayName: 'Zoya',
    fullName: 'Zoya Merchant',
    age: 26,
    isDigilockerVerified: true,
    isWhatsappVerified: true,
    livenessScore: 0.99,
    distanceKm: 4.0,
    culturalBadges: {
      diet: 'NON_VEG',
      living: 'INDEPENDENT_FLAT',
      languages: ['English', 'Hindi', 'Urdu'],
      zodiac: 'Pisces',
    },
    voicePrompt: {
      audioUrl: 'https://cdn.swipeai.in/v/zoya.m4a',
      durationSec: 19,
      promptText: 'Stories from old Bangalore streets through my lens.',
    },
    memeMatch: {
      matchPercent: 93,
      memeTitle: 'Bargaining for antique film cameras in Russell Market',
      memeImageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600',
    },
    cosmicChemistry: {
      synergyTag: '92% Poetic Connection',
      score: 92,
    },
    compatibilityScore: 95,
    bio: 'Documentary Filmmaker & Photojournalist. Lover of vintage thrift stores, indie cinema, vinyl records, and street food history. Always carrying a loaded 35mm camera.',
    company: 'Independent Filmmaker',
    occupation: 'Documentary Filmmaker',
    job: 'Documentary Filmmaker',
    education: 'Jamia Millia Islamia (AJK MCRC)',
    height: 168,
    interests: 'Cinema, Street Photography, Thrift Shopping, Vinyl Records, Travel, Chai',
    sexualOrientation: 'Straight',
    genderDisplay: 'Woman',
    relationshipIntent: 'Long-term, open to short',
    profilePromptQuestion: 'My favorite weekend activity is...',
    profilePromptAnswer: 'Wandering through Russell Market with a 35mm film camera, hunting for stories and old street snacks.',
    sunSign: 'Pisces',
    moonSign: 'Scorpio',
    karmaScore: 191,
    smokingHabit: 'Social / Occasional 🚬',
    drinkingHabit: 'Social / Weekend Drinker 🍷',
    hobbies: 'Photography, Film Making, Cycling, Thrift Shopping, Vinyl Records',
    vacationPreference: 'Majestic Mountains 🏔️',
    city: 'Bengaluru',
    neighborhood: 'Frazer Town',
    microCircle: 'Filmmakers & Visual Storytellers',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    ],
  },
];

let mockMatches: MatchItem[] = [
  {
    id: 'm1-rohan',
    otherUserId: 'c1-rohan-26',
    otherUserName: 'Rohan',
    otherUserPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    otherUserAge: 26,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 3,
    remainingHours: 42,
    expiresAt: new Date(Date.now() + 42 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    icebreakerQuiz: {
      quizId: 'quiz_sunday_vibe',
      title: '10s Rapid-Fire Quiz: Sunday Vibe',
      question: 'Your Ultimate Sunday Vibe:',
      options: [
        'Filter Coffee & Dosa crawl in Indiranagar',
        'Sleep until 2 PM & binge true-crime podcasts',
        'Spontaneous road trip to Nandi Hills',
      ],
      userAAnswer: 0,
      userBAnswer: 0,
      isCompleted: true,
      isMutualAgreement: true,
      wingmanRecommendation: 'Both picked Filter Coffee & Dosa Crawl!',
    },
    lastMessage: 'CTR butter masala dosa is legendary though! Want to do a quick Virtual Chai call tonight?',
    lastMessageTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    otherProfile: mockCandidates[0],
  },
  {
    id: 'm2-priya',
    otherUserId: 'c2-priya-25',
    otherUserName: 'Priya',
    otherUserPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    otherUserAge: 25,
    isDigilockerVerified: true,
    status: 'PENDING_ICEBREAKER',
    messagesCount: 0,
    remainingHours: 47,
    expiresAt: new Date(Date.now() + 47 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    icebreakerQuiz: {
      quizId: 'quiz_weekend_vibe',
      title: '10s Rapid-Fire Quiz',
      question: 'Ideal first hangout spot:',
      options: [
        'Quiet aesthetic cafe with great pour-overs',
        'Sunset walk in Cubbon Park with matcha latte',
        'Board game night at a cozy lounge',
      ],
      userAAnswer: null,
      userBAnswer: 0,
      isCompleted: false,
      isMutualAgreement: false,
      wingmanRecommendation: 'Pick your answer to unlock the chat lounge!',
    },
    otherProfile: mockCandidates[1],
  },
  {
    id: 'm3-ananya',
    otherUserId: 'c4-ananya-24',
    otherUserName: 'Ananya',
    otherUserPhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
    otherUserAge: 24,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 4,
    remainingHours: 36,
    expiresAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    icebreakerQuiz: {
      quizId: 'quiz_coffee_vibe',
      title: '10s Rapid-Fire Quiz: Coffee Culture',
      question: 'Filter Coffee or Specialty Pour-Over?',
      options: ['Traditional Filter Coffee', 'Specialty Pour-Over', 'Matcha Latte'],
      userAAnswer: 1,
      userBAnswer: 1,
      isCompleted: true,
      isMutualAgreement: true,
      wingmanRecommendation: 'Both picked Specialty Pour-Over!',
    },
    lastMessage: 'Blue Tokai Indiranagar sounds perfect for this Sunday! ☕',
    lastMessageTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    otherProfile: mockCandidates[3],
  },
  {
    id: 'm4-aarav',
    otherUserId: 'c5-aarav-28',
    otherUserName: 'Aarav',
    otherUserPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    otherUserAge: 28,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 2,
    remainingHours: 40,
    expiresAt: new Date(Date.now() + 40 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    lastMessage: 'Hey! Saw you love tennis and startups too. Let’s connect!',
    lastMessageTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    otherProfile: mockCandidates[4],
  },
  {
    id: 'm5-kabir',
    otherUserId: 'c3-kabir-27',
    otherUserName: 'Kabir',
    otherUserPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    otherUserAge: 27,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 1,
    remainingHours: 44,
    expiresAt: new Date(Date.now() + 44 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lastMessage: 'Any favorite vinyl store on Church Street?',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    otherProfile: mockCandidates[2],
  },
  {
    id: 'm6-meera',
    otherUserId: 'c6-meera-26',
    otherUserName: 'Meera',
    otherUserPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    otherUserAge: 26,
    isDigilockerVerified: true,
    status: 'PENDING_ICEBREAKER',
    messagesCount: 0,
    remainingHours: 46,
    expiresAt: new Date(Date.now() + 46 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    otherProfile: mockCandidates[5],
  },
  {
    id: 'm7-dev',
    otherUserId: 'c7-dev-27',
    otherUserName: 'Dev',
    otherUserPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    otherUserAge: 27,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 1,
    remainingHours: 38,
    expiresAt: new Date(Date.now() + 38 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    lastMessage: 'Let’s play chess over cardamom tea this weekend.',
    lastMessageTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    otherProfile: mockCandidates[6],
  },
  {
    id: 'm8-tanvi',
    otherUserId: 'c8-tanvi-25',
    otherUserName: 'Tanvi',
    otherUserPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    otherUserAge: 25,
    isDigilockerVerified: true,
    status: 'PENDING_ICEBREAKER',
    messagesCount: 0,
    remainingHours: 47,
    expiresAt: new Date(Date.now() + 47 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    otherProfile: mockCandidates[7],
  },
  {
    id: 'm9-vik',
    otherUserId: 'c9-vik-29',
    otherUserName: 'Vikram',
    otherUserPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    otherUserAge: 29,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 2,
    remainingHours: 35,
    expiresAt: new Date(Date.now() + 35 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 13 * 3600 * 1000).toISOString(),
    lastMessage: 'F1 race screening this Sunday! You in?',
    lastMessageTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    otherProfile: mockCandidates[8],
  },
  {
    id: 'm10-zoya',
    otherUserId: 'c10-zoya-26',
    otherUserName: 'Zoya',
    otherUserPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    otherUserAge: 26,
    isDigilockerVerified: true,
    status: 'ACTIVE_CHAT',
    messagesCount: 3,
    remainingHours: 32,
    expiresAt: new Date(Date.now() + 32 * 3600 * 1000).toISOString(),
    matchedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    lastMessage: 'Shot some amazing film photographs today at Russell Market!',
    lastMessageTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    otherProfile: mockCandidates[9],
  },
];

let mockChatMessages: Record<string, ChatMessage[]> = {
  'm1-rohan': [
    {
      id: 'msg-1',
      matchId: 'm1-rohan',
      senderId: 'c1-rohan-26',
      recipientId: currentUserId,
      content: 'Haha since we both agree on Rameshwaram Cafe, what’s your take on their ghee podi idli?',
      mediaType: 'TEXT',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      isFromMe: false,
    },
    {
      id: 'msg-2',
      matchId: 'm1-rohan',
      senderId: currentUserId,
      recipientId: 'c1-rohan-26',
      content: 'Unpopular opinion: It’s delicious but the ghee coma afterward is dangerous! 😅',
      mediaType: 'TEXT',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      isFromMe: true,
    },
    {
      id: 'msg-3',
      matchId: 'm1-rohan',
      senderId: 'c1-rohan-26',
      recipientId: currentUserId,
      content: 'CTR butter masala dosa is legendary though! Want to do a quick Virtual Chai call tonight to compare notes?',
      mediaType: 'TEXT',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isFromMe: false,
    },
  ],
};

export const api = {
  getAuthToken: () => authToken,
  setAuthToken: (token: string | null, userId?: string) => {
    authToken = token;
    if (userId) currentUserId = userId;
  },
  getCurrentUserId: () => currentUserId,
  logout: () => {
    authToken = null;
  },

  // Auth
  sendOtp: async (phoneE164: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164 }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { status: 'success', message: 'OTP sent (Demo OTP: 1234)', demoOtp: '1234' };
  },

  verifyOtp: async (phoneE164: string, otp: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164, otp }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token, data.userId);
        return data;
      }
    } catch (e) {}
    setAuthToken('mock_jwt_token', currentUserId);
    return { token: 'mock_jwt_token', userId: currentUserId, isNewUser: false };
  },

  loginWhatsApp: async (phoneE164: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/auth/whatsapp/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164 }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token, data.userId);
        return data;
      }
    } catch (e) {}
    setAuthToken('mock_jwt_token_wa', currentUserId);
    return { token: 'mock_jwt_token_wa', userId: currentUserId, whatsappVerified: true };
  },

  // KYC
  verifyDigiLocker: async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/kyc/digilocker/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ stateToken: 'state_123', simulateSuccess: true }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    mockProfile.digilockerVerified = true;
    return { isVerified: true, badge: 'GOLD_SHIELD', message: 'DigiLocker Verified Citizen Badge awarded!' };
  },

  verifyLiveness: async (headTurnDurationMs: number = 3000) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/kyc/liveness/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ headTurnDurationMs, simulatePass: true }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    mockProfile.livenessScore = 0.99;
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
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockProfile;
  },

  updateMyProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/profiles/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    mockProfile = { ...mockProfile, ...updates };
    return mockProfile;
  },

  uploadImage: async (localUri: string): Promise<string> => {
    try {
      const filename = localUri.split('/').pop() || 'photo.jpg';
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image/jpeg`;

      const presignRes = await fetchWithTimeout(`${BASE_URL}/api/images/presign?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(type)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (presignRes.ok) {
        const data = await presignRes.json();
        return data.publicUrl;
      }
    } catch (e) {}
    return localUri;
  },

  // Discovery Feed
  getFeed: async (microCircle?: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/discovery/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ microCircle }),
      });
      if (res.ok) {
        const json = await res.json();
        const feedData = json?.data || json;
        if (feedData && Array.isArray(feedData.candidates) && feedData.candidates.length >= 10) {
          return feedData;
        }
      }
    } catch (e) {}

    return {
      remainingDailySwipes: mockProfile.hasActivePass ? 999 : 25,
      dailyHardCap: 25,
      candidates: mockCandidates,
    };
  },

  getAllCandidates: (): CandidateCard[] => {
    return mockCandidates;
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

    const isMatch = actionType === 'LIKE' || actionType === 'SUPER_CHAI';
    return {
      isMatch,
      matchId: isMatch ? 'm1-rohan' : null,
      message: isMatch ? 'Vibe Match! 10s Icebreaker Quiz unlocked.' : 'Recorded.',
      remainingDailySwipes: 21,
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
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockMatches;
  },

  getMatchDetails: async (matchId: string): Promise<MatchItem> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockMatches.find((m) => m.id === matchId) || mockMatches[0];
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

    const match = mockMatches.find((m) => m.id === matchId);
    if (match && match.icebreakerQuiz) {
      match.icebreakerQuiz.userAAnswer = selectedOptionIndex;
      match.icebreakerQuiz.userBAnswer = selectedOptionIndex; // match in demo
      match.icebreakerQuiz.isCompleted = true;
      match.icebreakerQuiz.isMutualAgreement = true;
      match.status = 'ACTIVE_CHAT';
    }

    return {
      isQuizCompleted: true,
      isMutualAgreement: true,
      newMatchStatus: 'ACTIVE_CHAT',
      wingmanSparks: [
        'Heard your controversial chai opinion — Rohan, I completely agree!',
        'Rameshwaram Cafe vs CTR — which side of the Indiranagar dosa debate are you on?',
        'If we grab cutting chai tonight, what’s your go-to tea spot?',
      ],
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
      candidateName: 'Rohan',
      sparks: [
        'Heard your controversial chai opinion — Rohan, I completely agree!',
        'Rameshwaram Cafe vs CTR — which side of the Indiranagar dosa debate are you on?',
        'If we grab cutting chai tonight, what’s your go-to tea spot?',
      ],
      commonGround: 'Both love specialty coffee and Indiranagar dosa crawls',
    };
  },

  // Chat & Shield 360
  getMessages: async (matchId: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/chat/${matchId}/messages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockChatMessages[matchId] || [];
  },

  sendMessage: async (matchId: string, content: string, mediaUrl?: string, mediaType: 'TEXT' | 'IMAGE' | 'VIRTUAL_CHAI' = 'TEXT'): Promise<ChatMessage> => {
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
      recipientId: 'c1-rohan-26',
      content,
      mediaUrl,
      mediaType,
      isBlurred: isSensitive,
      blurReason: isSensitive ? 'Sensitive Content Warning: Auto-blurred by Shield 360' : undefined,
      createdAt: new Date().toISOString(),
      isFromMe: true,
    };

    if (!mockChatMessages[matchId]) mockChatMessages[matchId] = [];
    mockChatMessages[matchId].push(newMsg);
    return newMsg;
  },

  // VibeStore & UPI Sachet Store
  getCatalog: async (): Promise<SkuCatalogItem[]> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/v1/payments/store/catalog`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      { sku: 'WEEKEND_PASS_99', title: 'Weekend Dating Pass', priceInr: 99, subtitle: 'Unlimited Likes + 3 Sparks + See Who Liked You', tag: 'MOST POPULAR IN BENGALURU', perks: ['Unlimited Swipes', '3 Super Sparks Included', 'Priority Profile Pool'] },
      { sku: 'SUPER_SPARK_19', title: '1 Super Spark', priceInr: 19, subtitle: 'Stand out instantly with 3x reply rate', tag: 'SACHET', perks: ['Highlights your profile at top of feed'] },
      { sku: 'CUTTING_CHAI_21', title: 'Virtual Cutting Chai Invite', priceInr: 21, subtitle: 'Send a digital cutting chai + 15% partner cafe coupon', tag: 'HIGH REACTION', perks: ['100% of women say they reply to chai invites', '15% off Blue Tokai & Third Wave coupon'] },
      { sku: 'BOOST_1X_FRIDAY_29', title: '1 Friday Night Boost', priceInr: 29, subtitle: '10x profile visibility during 9 PM - 1 AM peak', tag: 'PEAK CONVERSION', perks: ['Surfaces profile to top of nearby candidates'] },
      { sku: 'DIRECT_DMS_3X_49', title: '3 Direct DMs', priceInr: 49, subtitle: 'Skip the queue & message high-intent matches directly', tag: 'SACHET', perks: ['Send personalized intro before matching'] },
      { sku: 'REVIVE_MATCH_19', title: 'Revive Expired Match', priceInr: 19, subtitle: 'Unfreeze 48h timer and restore match', tag: 'SACHET', perks: ['Re-opens chat lounge for 48 hours'] },
      { sku: 'WEEKLY_PASS_149', title: 'Weekly VIP Pass', priceInr: 149, subtitle: 'Full VIP access for 7 days with direct DMs', tag: 'POPULAR', perks: ['Unlimited likes', '5 Super Sparks', '3 Direct DMs'] },
      { sku: 'FORTNIGHT_PASS_199', title: '14-Day Fortnight Pass', priceInr: 199, subtitle: 'Full VIP access for 14 days + 6 Sparks + 2 Boosts', tag: 'BEST VALUE', perks: ['Unlimited likes for 14 days', '6 Super Sparks', '2 Profile Boosts', '5 Direct DMs'] },
      { sku: 'SELECT_QUARTERLY_999', title: 'Select Club (Quarterly)', priceInr: 999, subtitle: 'Concierge recommendations & priority DigiLocker pool', tag: 'PREMIUM', perks: ['Concierge curated dates', 'Exclusive offline mixers'] },
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
      WEEKEND_PASS_99: 99,
      SUPER_SPARK_19: 19,
      CUTTING_CHAI_21: 21,
      BOOST_1X_FRIDAY_29: 29,
      DIRECT_DMS_3X_49: 49,
      REVIVE_MATCH_19: 19,
      WEEKLY_PASS_149: 149,
      FORTNIGHT_PASS_199: 199,
      SELECT_QUARTERLY_999: 999,
    };
    const amt = prices[sku] || 29;
    const orderId = `order_sachet_${Date.now()}`;
    const upiIntentUrl = `upi://pay?pa=payments@swipeai&pn=SwipeAI&am=${amt}&cu=INR&tn=${sku}&tr=${orderId}`;

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
    mockProfile.hasActivePass = true;
    mockProfile.sparksBalance += 3;
    return { status: 'success', orderId };
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
        couponCode: 'SWIPEAI15',
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
      trackingUrl: `https://safe.swipeai.in/sos/live/${sessionId}`,
      cafeName: 'Blue Tokai Coffee Roasters',
      discountCoupon: 'SWIPEAI15',
      status: 'ACTIVE',
      message: 'Safe Date Mode Active: Live location & cafe check-in shared with emergency contacts.',
    };
  },

  // Virtual Chai Masked Calling
  createVirtualChaiSession: async (matchId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/v1/calling/virtual-chai/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      roomName: `chai_room_${matchId}`,
      participantToken: `jwt_livekit_${Date.now()}`,
      serverUrl: 'wss://mock-sfu.swipeai.in/livekit',
      callerMaskedName: 'Ananya',
      recipientMaskedName: 'Rohan',
      phoneMasked: true,
      isSimulated: true,
    };
  },
};
