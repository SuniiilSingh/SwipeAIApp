export interface CommunityColorConfig {
  key: string;
  name: string;
  primary: string;
  badgeBg: string;
  badgeBorder: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  emoji: string;
}

// Aliased type for backwards compatibility
export type MetroLineConfig = CommunityColorConfig;

/**
 * Deterministic color resolution for community circles, metro lines, and neighborhood tribes.
 * Resolves live colors based on official metro lines, semantic name keywords, and vibe categories.
 */
export function getCommunityColor(
  nameOrSlug?: string | null,
  vibeCategory?: string | null
): CommunityColorConfig {
  const s = (nameOrSlug || '').toLowerCase();
  const v = (vibeCategory || '').toUpperCase();

  // 1. METRO LINES (Official DMRC / Namma / Mumbai Metro Line Colors)
  if (s.includes('yellow line') || s.includes('yellow-line')) {
    return {
      key: 'yellow-line',
      name: 'Yellow Line',
      primary: '#FFD700',
      badgeBg: 'rgba(255, 215, 0, 0.22)',
      badgeBorder: 'rgba(255, 215, 0, 0.65)',
      cardBg: 'rgba(255, 215, 0, 0.08)',
      cardBorder: 'rgba(255, 215, 0, 0.45)',
      textColor: '#FFD700',
      tagBg: 'rgba(255, 215, 0, 0.20)',
      tagBorder: 'rgba(255, 215, 0, 0.55)',
      tagText: '#FFD700',
      emoji: '🟡',
    };
  }

  if (s.includes('blue line') || s.includes('blue-line')) {
    return {
      key: 'blue-line',
      name: 'Blue Line',
      primary: '#3B82F6',
      badgeBg: 'rgba(59, 130, 246, 0.22)',
      badgeBorder: 'rgba(59, 130, 246, 0.65)',
      cardBg: 'rgba(59, 130, 246, 0.08)',
      cardBorder: 'rgba(59, 130, 246, 0.45)',
      textColor: '#60A5FA',
      tagBg: 'rgba(59, 130, 246, 0.20)',
      tagBorder: 'rgba(59, 130, 246, 0.55)',
      tagText: '#93C5FD',
      emoji: '🔵',
    };
  }

  if (s.includes('magenta line') || s.includes('magenta-line')) {
    return {
      key: 'magenta-line',
      name: 'Magenta Line',
      primary: '#D946EF',
      badgeBg: 'rgba(217, 70, 239, 0.22)',
      badgeBorder: 'rgba(217, 70, 239, 0.65)',
      cardBg: 'rgba(217, 70, 239, 0.08)',
      cardBorder: 'rgba(217, 70, 239, 0.45)',
      textColor: '#E879F9',
      tagBg: 'rgba(217, 70, 239, 0.20)',
      tagBorder: 'rgba(217, 70, 239, 0.55)',
      tagText: '#F0ABFC',
      emoji: '🟣',
    };
  }

  if (s.includes('pink line') || s.includes('pink-line')) {
    return {
      key: 'pink-line',
      name: 'Pink Line',
      primary: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.22)',
      badgeBorder: 'rgba(236, 72, 153, 0.65)',
      cardBg: 'rgba(236, 72, 153, 0.08)',
      cardBorder: 'rgba(236, 72, 153, 0.45)',
      textColor: '#F472B6',
      tagBg: 'rgba(236, 72, 153, 0.20)',
      tagBorder: 'rgba(236, 72, 153, 0.55)',
      tagText: '#F9A8D4',
      emoji: '🌸',
    };
  }

  if (
    s.includes('violet line') ||
    s.includes('violet-line') ||
    s.includes('purple line') ||
    s.includes('purple-line')
  ) {
    return {
      key: 'violet-line',
      name: 'Violet Line',
      primary: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.22)',
      badgeBorder: 'rgba(139, 92, 246, 0.65)',
      cardBg: 'rgba(139, 92, 246, 0.08)',
      cardBorder: 'rgba(139, 92, 246, 0.45)',
      textColor: '#A78BFA',
      tagBg: 'rgba(139, 92, 246, 0.20)',
      tagBorder: 'rgba(139, 92, 246, 0.55)',
      tagText: '#C4B5FD',
      emoji: '🪻',
    };
  }

  if (s.includes('red line') || s.includes('red-line')) {
    return {
      key: 'red-line',
      name: 'Red Line',
      primary: '#EF4444',
      badgeBg: 'rgba(239, 68, 68, 0.22)',
      badgeBorder: 'rgba(239, 68, 68, 0.65)',
      cardBg: 'rgba(239, 68, 68, 0.08)',
      cardBorder: 'rgba(239, 68, 68, 0.45)',
      textColor: '#F87171',
      tagBg: 'rgba(239, 68, 68, 0.20)',
      tagBorder: 'rgba(239, 68, 68, 0.55)',
      tagText: '#FCA5A5',
      emoji: '🔴',
    };
  }

  if (s.includes('green line') || s.includes('green-line')) {
    return {
      key: 'green-line',
      name: 'Green Line',
      primary: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.22)',
      badgeBorder: 'rgba(16, 185, 129, 0.65)',
      cardBg: 'rgba(16, 185, 129, 0.08)',
      cardBorder: 'rgba(16, 185, 129, 0.45)',
      textColor: '#34D399',
      tagBg: 'rgba(16, 185, 129, 0.20)',
      tagBorder: 'rgba(16, 185, 129, 0.55)',
      tagText: '#6EE7B7',
      emoji: '🟢',
    };
  }

  if (
    s.includes('orange line') ||
    s.includes('orange-line') ||
    s.includes('airport express')
  ) {
    return {
      key: 'orange-line',
      name: 'Airport Express',
      primary: '#F97316',
      badgeBg: 'rgba(249, 115, 22, 0.22)',
      badgeBorder: 'rgba(249, 115, 22, 0.65)',
      cardBg: 'rgba(249, 115, 22, 0.08)',
      cardBorder: 'rgba(249, 115, 22, 0.45)',
      textColor: '#FB923C',
      tagBg: 'rgba(249, 115, 22, 0.20)',
      tagBorder: 'rgba(249, 115, 22, 0.55)',
      tagText: '#FDBA74',
      emoji: '✈️',
    };
  }

  if (s.includes('aqua line') || s.includes('aqua-line')) {
    return {
      key: 'aqua-line',
      name: 'Aqua Line',
      primary: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.22)',
      badgeBorder: 'rgba(6, 182, 212, 0.65)',
      cardBg: 'rgba(6, 182, 212, 0.08)',
      cardBorder: 'rgba(6, 182, 212, 0.45)',
      textColor: '#22D3EE',
      tagBg: 'rgba(6, 182, 212, 0.20)',
      tagBorder: 'rgba(6, 182, 212, 0.55)',
      tagText: '#67E8F9',
      emoji: '🌊',
    };
  }

  if (s.includes('rapid metro') || s.includes('cyber city metro')) {
    return {
      key: 'rapid-metro',
      name: 'Rapid Metro',
      primary: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.22)',
      badgeBorder: 'rgba(56, 189, 248, 0.65)',
      cardBg: 'rgba(56, 189, 248, 0.08)',
      cardBorder: 'rgba(56, 189, 248, 0.45)',
      textColor: '#38BDF8',
      tagBg: 'rgba(56, 189, 248, 0.20)',
      tagBorder: 'rgba(56, 189, 248, 0.55)',
      tagText: '#7DD3FC',
      emoji: '⚡',
    };
  }

  // 1B. MARATHON & RUNNING TRIBES
  if (
    s.includes('marathon') ||
    s.includes('running') ||
    s.includes('runner') ||
    s.includes('ultra run') ||
    s.includes('5k') ||
    s.includes('10k') ||
    s.includes('21k') ||
    v === 'MARATHON' ||
    v === 'RUNNING'
  ) {
    return {
      key: 'marathon',
      name: 'Marathon & Running Tribe',
      primary: '#F97316',
      badgeBg: 'rgba(249, 115, 22, 0.22)',
      badgeBorder: 'rgba(249, 115, 22, 0.65)',
      cardBg: 'rgba(249, 115, 22, 0.08)',
      cardBorder: 'rgba(249, 115, 22, 0.45)',
      textColor: '#FB923C',
      tagBg: 'rgba(249, 115, 22, 0.20)',
      tagBorder: 'rgba(249, 115, 22, 0.55)',
      tagText: '#FDBA74',
      emoji: '🏃',
    };
  }

  // 1C. SOLO TRAVELERS, BACKPACKERS & NOMADS
  if (
    s.includes('solo travel') ||
    s.includes('traveler') ||
    s.includes('traveller') ||
    s.includes('backpacker') ||
    s.includes('nomad') ||
    s.includes('wanderer') ||
    s.includes('trekker') ||
    s.includes('voyager') ||
    s.includes('road-tripper') ||
    v === 'TRAVEL' ||
    v === 'SOLO_TRAVEL'
  ) {
    return {
      key: 'solo-travel',
      name: 'Solo Travelers & Nomads',
      primary: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.22)',
      badgeBorder: 'rgba(6, 182, 212, 0.65)',
      cardBg: 'rgba(6, 182, 212, 0.08)',
      cardBorder: 'rgba(6, 182, 212, 0.45)',
      textColor: '#22D3EE',
      tagBg: 'rgba(6, 182, 212, 0.20)',
      tagBorder: 'rgba(6, 182, 212, 0.55)',
      tagText: '#67E8F9',
      emoji: '🎒',
    };
  }

  // 1D. LIVE CONCERTS, MUSIC FESTIVALS & GIGS
  if (
    s.includes('concert') ||
    s.includes('festival') ||
    s.includes('sunburn') ||
    s.includes('live music') ||
    s.includes('music fest') ||
    s.includes('indie gig') ||
    s.includes('amphitheatre') ||
    s.includes('jazz') ||
    s.includes('acoustic') ||
    v === 'CONCERT' ||
    v === 'FESTIVAL'
  ) {
    return {
      key: 'concerts',
      name: 'Live Concerts & Festivals',
      primary: '#D946EF',
      badgeBg: 'rgba(217, 70, 239, 0.22)',
      badgeBorder: 'rgba(217, 70, 239, 0.65)',
      cardBg: 'rgba(217, 70, 239, 0.08)',
      cardBorder: 'rgba(217, 70, 239, 0.45)',
      textColor: '#E879F9',
      tagBg: 'rgba(217, 70, 239, 0.20)',
      tagBorder: 'rgba(217, 70, 239, 0.55)',
      tagText: '#F0ABFC',
      emoji: '🎸',
    };
  }

  // 2. COFFEE, CAFES, CHAI & BRUNCH
  if (
    s.includes('cafe') ||
    s.includes('coffee') ||
    s.includes('chai') ||
    s.includes('roaster') ||
    s.includes('brunch') ||
    s.includes('brew')
  ) {
    return {
      key: 'coffee',
      name: 'Artisan Cafe',
      primary: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.22)',
      badgeBorder: 'rgba(245, 158, 11, 0.65)',
      cardBg: 'rgba(245, 158, 11, 0.08)',
      cardBorder: 'rgba(245, 158, 11, 0.45)',
      textColor: '#FBBF24',
      tagBg: 'rgba(245, 158, 11, 0.20)',
      tagBorder: 'rgba(245, 158, 11, 0.55)',
      tagText: '#FCD34D',
      emoji: '☕',
    };
  }

  // 3. STARTUPS, FOUNDERS & UNICORNS
  if (
    s.includes('founder') ||
    s.includes('startup') ||
    s.includes('unicorn') ||
    s.includes('hacker') ||
    s.includes('builder') ||
    v === 'STARTUP'
  ) {
    return {
      key: 'startup',
      name: 'Startup Founders',
      primary: '#6366F1',
      badgeBg: 'rgba(99, 102, 241, 0.22)',
      badgeBorder: 'rgba(99, 102, 241, 0.65)',
      cardBg: 'rgba(99, 102, 241, 0.08)',
      cardBorder: 'rgba(99, 102, 241, 0.45)',
      textColor: '#818CF8',
      tagBg: 'rgba(99, 102, 241, 0.20)',
      tagBorder: 'rgba(99, 102, 241, 0.55)',
      tagText: '#A5B4FC',
      emoji: '🚀',
    };
  }

  // 4. TECH, CODE & CYBER
  if (
    s.includes('tech') ||
    s.includes('coder') ||
    s.includes('code') ||
    s.includes('cyber') ||
    s.includes('developer') ||
    s.includes('ai') ||
    v === 'TECH'
  ) {
    return {
      key: 'tech',
      name: 'Tech & AI',
      primary: '#00E5FF',
      badgeBg: 'rgba(0, 229, 255, 0.22)',
      badgeBorder: 'rgba(0, 229, 255, 0.65)',
      cardBg: 'rgba(0, 229, 255, 0.08)',
      cardBorder: 'rgba(0, 229, 255, 0.45)',
      textColor: '#38BDF8',
      tagBg: 'rgba(0, 229, 255, 0.20)',
      tagBorder: 'rgba(0, 229, 255, 0.55)',
      tagText: '#7DD3FC',
      emoji: '💻',
    };
  }

  // 5. CREATIVES, ART, CINEMA & THEATER
  if (
    s.includes('creative') ||
    s.includes('art') ||
    s.includes('cinema') ||
    s.includes('theater') ||
    s.includes('theatre') ||
    s.includes('design') ||
    s.includes('media') ||
    s.includes('film') ||
    v === 'CREATIVE' ||
    v === 'ART' ||
    v === 'MEDIA'
  ) {
    return {
      key: 'creative',
      name: 'Creative Studio',
      primary: '#F43F5E',
      badgeBg: 'rgba(244, 63, 94, 0.22)',
      badgeBorder: 'rgba(244, 63, 94, 0.65)',
      cardBg: 'rgba(244, 63, 94, 0.08)',
      cardBorder: 'rgba(244, 63, 94, 0.45)',
      textColor: '#FB7185',
      tagBg: 'rgba(244, 63, 94, 0.20)',
      tagBorder: 'rgba(244, 63, 94, 0.55)',
      tagText: '#FDA4AF',
      emoji: '🎨',
    };
  }

  // 6. CORPORATE & FINANCE
  if (
    s.includes('corporate') ||
    s.includes('finance') ||
    s.includes('bank') ||
    s.includes('consulting') ||
    s.includes('leader') ||
    v === 'CORPORATE'
  ) {
    return {
      key: 'corporate',
      name: 'Corporate & Finance',
      primary: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.22)',
      badgeBorder: 'rgba(16, 185, 129, 0.65)',
      cardBg: 'rgba(16, 185, 129, 0.08)',
      cardBorder: 'rgba(16, 185, 129, 0.45)',
      textColor: '#34D399',
      tagBg: 'rgba(16, 185, 129, 0.20)',
      tagBorder: 'rgba(16, 185, 129, 0.55)',
      tagText: '#6EE7B7',
      emoji: '💼',
    };
  }

  // 7. BOOKS, CULTURE & HERITAGE
  if (
    s.includes('book') ||
    s.includes('heritage') ||
    s.includes('culture') ||
    s.includes('reading') ||
    s.includes('vintage') ||
    s.includes('old') ||
    v === 'CULTURE' ||
    v === 'HERITAGE'
  ) {
    return {
      key: 'heritage',
      name: 'Culture & Heritage',
      primary: '#D97706',
      badgeBg: 'rgba(217, 119, 6, 0.22)',
      badgeBorder: 'rgba(217, 119, 6, 0.65)',
      cardBg: 'rgba(217, 119, 6, 0.08)',
      cardBorder: 'rgba(217, 119, 6, 0.45)',
      textColor: '#F59E0B',
      tagBg: 'rgba(217, 119, 6, 0.20)',
      tagBorder: 'rgba(217, 119, 6, 0.55)',
      tagText: '#FBBF24',
      emoji: '📚',
    };
  }

  // 8. COLLEGIATE, CAMPUS & SCHOLARS
  if (
    s.includes('campus') ||
    s.includes('college') ||
    s.includes('university') ||
    s.includes('student') ||
    s.includes('scholar') ||
    s.includes('iit') ||
    s.includes('du') ||
    s.includes('adda') ||
    v === 'COLLEGIATE'
  ) {
    return {
      key: 'collegiate',
      name: 'Campus Collegiate',
      primary: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.22)',
      badgeBorder: 'rgba(139, 92, 246, 0.65)',
      cardBg: 'rgba(139, 92, 246, 0.08)',
      cardBorder: 'rgba(139, 92, 246, 0.45)',
      textColor: '#A78BFA',
      tagBg: 'rgba(139, 92, 246, 0.20)',
      tagBorder: 'rgba(139, 92, 246, 0.55)',
      tagText: '#C4B5FD',
      emoji: '🎓',
    };
  }

  // 9. LIFESTYLE, CHIC, BRUNCH & FASHION
  if (
    s.includes('chic') ||
    s.includes('lifestyle') ||
    s.includes('market') ||
    s.includes('galleria') ||
    s.includes('mall') ||
    s.includes('fashion') ||
    v === 'LIFESTYLE' ||
    v === 'LUXURY'
  ) {
    return {
      key: 'lifestyle',
      name: 'Urban Chic',
      primary: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.22)',
      badgeBorder: 'rgba(236, 72, 153, 0.65)',
      cardBg: 'rgba(236, 72, 153, 0.08)',
      cardBorder: 'rgba(236, 72, 153, 0.45)',
      textColor: '#F472B6',
      tagBg: 'rgba(236, 72, 153, 0.20)',
      tagBorder: 'rgba(236, 72, 153, 0.55)',
      tagText: '#F9A8D4',
      emoji: '✨',
    };
  }

  // 10. FITNESS, RUNNERS, TRAILS & NATURE
  if (
    s.includes('trail') ||
    s.includes('run') ||
    s.includes('fit') ||
    s.includes('cycl') ||
    s.includes('rider') ||
    s.includes('nature') ||
    s.includes('sanctuary') ||
    s.includes('park') ||
    v === 'FITNESS'
  ) {
    return {
      key: 'fitness',
      name: 'Fitness & Trails',
      primary: '#22C55E',
      badgeBg: 'rgba(34, 197, 94, 0.22)',
      badgeBorder: 'rgba(34, 197, 94, 0.65)',
      cardBg: 'rgba(34, 197, 94, 0.08)',
      cardBorder: 'rgba(34, 197, 94, 0.45)',
      textColor: '#4ADE80',
      tagBg: 'rgba(34, 197, 94, 0.20)',
      tagBorder: 'rgba(34, 197, 94, 0.55)',
      tagText: '#86EFAC',
      emoji: '🌿',
    };
  }

  // 11. COASTAL, BEACHES & LAKES
  if (
    s.includes('beach') ||
    s.includes('lake') ||
    s.includes('coastal') ||
    s.includes('sea') ||
    s.includes('marine') ||
    s.includes('water') ||
    s.includes('goa') ||
    v === 'COASTAL'
  ) {
    return {
      key: 'coastal',
      name: 'Coastal Vibe',
      primary: '#0EA5E9',
      badgeBg: 'rgba(14, 165, 233, 0.22)',
      badgeBorder: 'rgba(14, 165, 233, 0.65)',
      cardBg: 'rgba(14, 165, 233, 0.08)',
      cardBorder: 'rgba(14, 165, 233, 0.45)',
      textColor: '#38BDF8',
      tagBg: 'rgba(14, 165, 233, 0.20)',
      tagBorder: 'rgba(14, 165, 233, 0.55)',
      tagText: '#7DD3FC',
      emoji: '🌊',
    };
  }

  // 12. MUSIC, INDIE, NIGHTLIFE & GIGS
  if (
    s.includes('music') ||
    s.includes('vinyl') ||
    s.includes('gig') ||
    s.includes('band') ||
    s.includes('bar') ||
    s.includes('cocktail') ||
    s.includes('night') ||
    v === 'NIGHTLIFE' ||
    v === 'BOHEMIAN'
  ) {
    return {
      key: 'nightlife',
      name: 'Indie & Nightlife',
      primary: '#A855F7',
      badgeBg: 'rgba(168, 85, 247, 0.22)',
      badgeBorder: 'rgba(168, 85, 247, 0.65)',
      cardBg: 'rgba(168, 85, 247, 0.08)',
      cardBorder: 'rgba(168, 85, 247, 0.45)',
      textColor: '#C084FC',
      tagBg: 'rgba(168, 85, 247, 0.20)',
      tagBorder: 'rgba(168, 85, 247, 0.55)',
      tagText: '#E9D5FF',
      emoji: '🎸',
    };
  }

  // 13. HIGH-RISE, SOCIETY & COMMUNITY
  if (
    s.includes('society') ||
    s.includes('high-rise') ||
    s.includes('highrise') ||
    s.includes('apartment') ||
    s.includes('gated') ||
    v === 'COMMUNITY'
  ) {
    return {
      key: 'community',
      name: 'Urban Community',
      primary: '#14B8A6',
      badgeBg: 'rgba(20, 184, 166, 0.22)',
      badgeBorder: 'rgba(20, 184, 166, 0.65)',
      cardBg: 'rgba(20, 184, 166, 0.08)',
      cardBorder: 'rgba(20, 184, 166, 0.45)',
      textColor: '#2DD4BF',
      tagBg: 'rgba(20, 184, 166, 0.20)',
      tagBorder: 'rgba(20, 184, 166, 0.55)',
      tagText: '#5EEAD4',
      emoji: '🏢',
    };
  }

  // 14. DETERMINISTIC LUXURY ROTATION (Guarantees every circle gets a lively glowing color)
  const ROTATING_PALETTES = [
    {
      key: 'neon-violet',
      name: 'Urban Tribe',
      primary: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.22)',
      badgeBorder: 'rgba(139, 92, 246, 0.65)',
      cardBg: 'rgba(139, 92, 246, 0.08)',
      cardBorder: 'rgba(139, 92, 246, 0.45)',
      textColor: '#A78BFA',
      tagBg: 'rgba(139, 92, 246, 0.20)',
      tagBorder: 'rgba(139, 92, 246, 0.55)',
      tagText: '#C4B5FD',
      emoji: '⚡',
    },
    {
      key: 'golden-amber',
      name: 'Local Scene',
      primary: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.22)',
      badgeBorder: 'rgba(245, 158, 11, 0.65)',
      cardBg: 'rgba(245, 158, 11, 0.08)',
      cardBorder: 'rgba(245, 158, 11, 0.45)',
      textColor: '#FBBF24',
      tagBg: 'rgba(245, 158, 11, 0.20)',
      tagBorder: 'rgba(245, 158, 11, 0.55)',
      tagText: '#FCD34D',
      emoji: '✨',
    },
    {
      key: 'cyber-cyan',
      name: 'City Vibe',
      primary: '#00E5FF',
      badgeBg: 'rgba(0, 229, 255, 0.22)',
      badgeBorder: 'rgba(0, 229, 255, 0.65)',
      cardBg: 'rgba(0, 229, 255, 0.08)',
      cardBorder: 'rgba(0, 229, 255, 0.45)',
      textColor: '#38BDF8',
      tagBg: 'rgba(0, 229, 255, 0.20)',
      tagBorder: 'rgba(0, 229, 255, 0.55)',
      tagText: '#7DD3FC',
      emoji: '🏙️',
    },
    {
      key: 'emerald-mint',
      name: 'Green Circle',
      primary: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.22)',
      badgeBorder: 'rgba(16, 185, 129, 0.65)',
      cardBg: 'rgba(16, 185, 129, 0.08)',
      cardBorder: 'rgba(16, 185, 129, 0.45)',
      textColor: '#34D399',
      tagBg: 'rgba(16, 185, 129, 0.20)',
      tagBorder: 'rgba(16, 185, 129, 0.55)',
      tagText: '#6EE7B7',
      emoji: '🍀',
    },
    {
      key: 'hot-rose',
      name: 'Vibrant Pulse',
      primary: '#F43F5E',
      badgeBg: 'rgba(244, 63, 94, 0.22)',
      badgeBorder: 'rgba(244, 63, 94, 0.65)',
      cardBg: 'rgba(244, 63, 94, 0.08)',
      cardBorder: 'rgba(244, 63, 94, 0.45)',
      textColor: '#FB7185',
      tagBg: 'rgba(244, 63, 94, 0.20)',
      tagBorder: 'rgba(244, 63, 94, 0.55)',
      tagText: '#FDA4AF',
      emoji: '💖',
    },
    {
      key: 'sunset-coral',
      name: 'Sunset Tribe',
      primary: '#F97316',
      badgeBg: 'rgba(249, 115, 22, 0.22)',
      badgeBorder: 'rgba(249, 115, 22, 0.65)',
      cardBg: 'rgba(249, 115, 22, 0.08)',
      cardBorder: 'rgba(249, 115, 22, 0.45)',
      textColor: '#FB923C',
      tagBg: 'rgba(249, 115, 22, 0.20)',
      tagBorder: 'rgba(249, 115, 22, 0.55)',
      tagText: '#FDBA74',
      emoji: '🌅',
    },
  ];

  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ROTATING_PALETTES.length;
  return ROTATING_PALETTES[index];
}

/**
 * Convenience alias for Metro Line resolution.
 */
export function getMetroLineColor(nameOrSlug?: string | null): CommunityColorConfig | null {
  if (!nameOrSlug) return null;
  const s = nameOrSlug.toLowerCase();
  if (s.includes('line') || s.includes('metro')) {
    return getCommunityColor(nameOrSlug);
  }
  return null;
}
