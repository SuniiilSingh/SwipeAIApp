import { ImageSourcePropType } from 'react-native';

/**
 * High-performance bundled local assets.
 * Kept entirely inside the app bundle so the UI never displays blank screens,
 * broken images, or stalls in low network / offline situations.
 */

export const CITY_ASSETS: Record<string, ImageSourcePropType> = {
  bengaluru: require('@/assets/images/cities/bengaluru.jpg'),
  bangalore: require('@/assets/images/cities/bengaluru.jpg'),
  mumbai: require('@/assets/images/cities/mumbai.jpg'),
  delhi: require('@/assets/images/cities/delhi.jpg'),
  'delhi-ncr': require('@/assets/images/cities/delhi.jpg'),
  'delhi ncr': require('@/assets/images/cities/delhi.jpg'),
  gurgaon: require('@/assets/images/cities/delhi.jpg'),
  noida: require('@/assets/images/cities/delhi.jpg'),
  pune: require('@/assets/images/cities/pune.jpg'),
  hyderabad: require('@/assets/images/cities/hyderabad.jpg'),
  goa: require('@/assets/images/cities/goa.jpg'),
  chennai: require('@/assets/images/cities/chennai.jpg'),
  kolkata: require('@/assets/images/cities/kolkata.jpg'),
};

export const MODEL_ASSETS = {
  tara: require('@/assets/images/models/tara.jpg'),
  ananya: require('@/assets/images/models/ananya.jpg'),
  meera: require('@/assets/images/models/meera.jpg'),
  rhea: require('@/assets/images/models/rhea.jpg'),
  aanya: require('@/assets/images/models/aanya.jpg'),
  kabir: require('@/assets/images/models/kabir.jpg'),
  rohan: require('@/assets/images/models/rohan.jpg'),
  aryan: require('@/assets/images/models/aryan.jpg'),
  defaultAvatar: require('@/assets/images/models/default-avatar.jpg'),
};

export const FEMALE_MODEL_LIST = [
  MODEL_ASSETS.tara,
  MODEL_ASSETS.ananya,
  MODEL_ASSETS.meera,
  MODEL_ASSETS.rhea,
  MODEL_ASSETS.aanya,
];

export const MALE_MODEL_LIST = [
  MODEL_ASSETS.kabir,
  MODEL_ASSETS.rohan,
  MODEL_ASSETS.aryan,
];

export const MEME_ASSETS = [
  require('@/assets/images/memes/meme1.jpg'),
  require('@/assets/images/memes/meme2.jpg'),
  require('@/assets/images/memes/meme3.jpg'),
  require('@/assets/images/memes/meme4.jpg'),
  require('@/assets/images/memes/meme5.jpg'),
];

/**
 * Returns a bundled local asset for any Indian city.
 */
export const getCityAsset = (cityNameOrId?: string): ImageSourcePropType => {
  if (!cityNameOrId) return CITY_ASSETS.bengaluru;
  const key = cityNameOrId.toLowerCase().trim();
  if (CITY_ASSETS[key]) return CITY_ASSETS[key];
  if (key.includes('bangalore') || key.includes('bengaluru')) return CITY_ASSETS.bengaluru;
  if (key.includes('mumbai') || key.includes('bombay')) return CITY_ASSETS.mumbai;
  if (key.includes('delhi') || key.includes('gurgaon') || key.includes('noida')) return CITY_ASSETS.delhi;
  if (key.includes('pune')) return CITY_ASSETS.pune;
  if (key.includes('hyderabad')) return CITY_ASSETS.hyderabad;
  if (key.includes('goa')) return CITY_ASSETS.goa;
  if (key.includes('chennai')) return CITY_ASSETS.chennai;
  if (key.includes('kolkata') || key.includes('calcutta')) return CITY_ASSETS.kolkata;
  return CITY_ASSETS.bengaluru;
};

/**
 * Returns a bundled local model avatar for fallbacks and demo profiles.
 */
export const getModelAsset = (
  nameOrGender?: string,
  index: number = 0
): ImageSourcePropType => {
  if (!nameOrGender) return FEMALE_MODEL_LIST[index % FEMALE_MODEL_LIST.length];
  const lower = nameOrGender.toLowerCase().trim();
  if (lower === 'tara') return MODEL_ASSETS.tara;
  if (lower === 'ananya' || lower === 'tanya') return MODEL_ASSETS.ananya;
  if (lower === 'meera') return MODEL_ASSETS.meera;
  if (lower === 'rhea') return MODEL_ASSETS.rhea;
  if (lower === 'aanya') return MODEL_ASSETS.aanya;
  if (lower === 'kabir' || lower === 'aarav') return MODEL_ASSETS.kabir;
  if (lower === 'rohan') return MODEL_ASSETS.rohan;
  if (lower === 'aryan') return MODEL_ASSETS.aryan;

  if (lower === 'male' || lower === 'm') {
    return MALE_MODEL_LIST[index % MALE_MODEL_LIST.length];
  }
  return FEMALE_MODEL_LIST[index % FEMALE_MODEL_LIST.length];
};

/**
 * Resolves an image source for ExpoImage or React Native Image.
 * If source is a valid remote/local URI string, returns { uri }.
 * If source is a bundled require(...) number, returns it directly.
 * If source is missing/empty, returns the local bundled fallback.
 */
export const resolveImageSource = (
  source?: any,
  fallback: ImageSourcePropType = MODEL_ASSETS.defaultAvatar
): any => {
  if (typeof source === 'number') return source;
  if (source && typeof source === 'object' && source.uri) return source;
  if (typeof source === 'string' && source.trim()) {
    const trimmed = source.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('file:') ||
      trimmed.startsWith('content:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return { uri: trimmed };
    }
  }
  return fallback;
};
