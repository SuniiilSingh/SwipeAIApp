export interface MetroLineConfig {
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

export function getMetroLineColor(nameOrSlug?: string | null): MetroLineConfig | null {
  if (!nameOrSlug) return null;
  const s = nameOrSlug.toLowerCase();

  // Yellow Line (Gurugram ↔ Cyber City ↔ Hauz Khas ↔ Connaught Place ↔ DU North Campus)
  if (s.includes('yellow line') || s.includes('yellow-line')) {
    return {
      key: 'yellow',
      name: 'Yellow Line',
      primary: '#FFD700',
      badgeBg: 'rgba(255, 215, 0, 0.22)',
      badgeBorder: 'rgba(255, 215, 0, 0.55)',
      cardBg: 'rgba(255, 215, 0, 0.07)',
      cardBorder: 'rgba(255, 215, 0, 0.45)',
      textColor: '#FFD700',
      tagBg: 'rgba(255, 215, 0, 0.18)',
      tagBorder: 'rgba(255, 215, 0, 0.5)',
      tagText: '#FFD700',
      emoji: '🟡',
    };
  }

  // Blue Line (Dwarka ↔ Rajiv Chowk ↔ Noida / Vaishali)
  if (s.includes('blue line') || s.includes('blue-line')) {
    return {
      key: 'blue',
      name: 'Blue Line',
      primary: '#3B82F6',
      badgeBg: 'rgba(59, 130, 246, 0.22)',
      badgeBorder: 'rgba(59, 130, 246, 0.55)',
      cardBg: 'rgba(59, 130, 246, 0.07)',
      cardBorder: 'rgba(59, 130, 246, 0.45)',
      textColor: '#60A5FA',
      tagBg: 'rgba(59, 130, 246, 0.18)',
      tagBorder: 'rgba(59, 130, 246, 0.5)',
      tagText: '#93C5FD',
      emoji: '🔵',
    };
  }

  // Magenta Line (Janakpuri W ↔ Hauz Khas ↔ IGI T1 ↔ Botanical Garden)
  if (s.includes('magenta line') || s.includes('magenta-line')) {
    return {
      key: 'magenta',
      name: 'Magenta Line',
      primary: '#D946EF',
      badgeBg: 'rgba(217, 70, 239, 0.22)',
      badgeBorder: 'rgba(217, 70, 239, 0.55)',
      cardBg: 'rgba(217, 70, 239, 0.07)',
      cardBorder: 'rgba(217, 70, 239, 0.45)',
      textColor: '#E879F9',
      tagBg: 'rgba(217, 70, 239, 0.18)',
      tagBorder: 'rgba(217, 70, 239, 0.5)',
      tagText: '#F0ABFC',
      emoji: '🟣',
    };
  }

  // Pink Line (Ring Road Corridor)
  if (s.includes('pink line') || s.includes('pink-line')) {
    return {
      key: 'pink',
      name: 'Pink Line',
      primary: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.22)',
      badgeBorder: 'rgba(236, 72, 153, 0.55)',
      cardBg: 'rgba(236, 72, 153, 0.07)',
      cardBorder: 'rgba(236, 72, 153, 0.45)',
      textColor: '#F472B6',
      tagBg: 'rgba(236, 72, 153, 0.18)',
      tagBorder: 'rgba(236, 72, 153, 0.5)',
      tagText: '#F9A8D4',
      emoji: '🌸',
    };
  }

  // Violet / Purple Line (Heritage Line ↔ Mandi House ↔ Faridabad)
  if (
    s.includes('violet line') ||
    s.includes('violet-line') ||
    s.includes('purple line') ||
    s.includes('purple-line')
  ) {
    return {
      key: 'violet',
      name: 'Violet Line',
      primary: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.22)',
      badgeBorder: 'rgba(139, 92, 246, 0.55)',
      cardBg: 'rgba(139, 92, 246, 0.07)',
      cardBorder: 'rgba(139, 92, 246, 0.45)',
      textColor: '#A78BFA',
      tagBg: 'rgba(139, 92, 246, 0.18)',
      tagBorder: 'rgba(139, 92, 246, 0.5)',
      tagText: '#C4B5FD',
      emoji: '🪻',
    };
  }

  // Red Line (Rithala ↔ Kashmere Gate ↔ Ghaziabad)
  if (s.includes('red line') || s.includes('red-line')) {
    return {
      key: 'red',
      name: 'Red Line',
      primary: '#EF4444',
      badgeBg: 'rgba(239, 68, 68, 0.22)',
      badgeBorder: 'rgba(239, 68, 68, 0.55)',
      cardBg: 'rgba(239, 68, 68, 0.07)',
      cardBorder: 'rgba(239, 68, 68, 0.45)',
      textColor: '#F87171',
      tagBg: 'rgba(239, 68, 68, 0.18)',
      tagBorder: 'rgba(239, 68, 68, 0.5)',
      tagText: '#FCA5A5',
      emoji: '🔴',
    };
  }

  // Green Line (Inderlok ↔ Kirti Nagar ↔ Bahadurgarh)
  if (s.includes('green line') || s.includes('green-line')) {
    return {
      key: 'green',
      name: 'Green Line',
      primary: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.22)',
      badgeBorder: 'rgba(16, 185, 129, 0.55)',
      cardBg: 'rgba(16, 185, 129, 0.07)',
      cardBorder: 'rgba(16, 185, 129, 0.45)',
      textColor: '#34D399',
      tagBg: 'rgba(16, 185, 129, 0.18)',
      tagBorder: 'rgba(16, 185, 129, 0.5)',
      tagText: '#6EE7B7',
      emoji: '🟢',
    };
  }

  // Orange Line / Airport Express (New Delhi ↔ Aerocity ↔ IGI T3 ↔ Yashobhoomi)
  if (
    s.includes('orange line') ||
    s.includes('orange-line') ||
    s.includes('airport express')
  ) {
    return {
      key: 'orange',
      name: 'Airport Express (Orange)',
      primary: '#F97316',
      badgeBg: 'rgba(249, 115, 22, 0.22)',
      badgeBorder: 'rgba(249, 115, 22, 0.55)',
      cardBg: 'rgba(249, 115, 22, 0.07)',
      cardBorder: 'rgba(249, 115, 22, 0.45)',
      textColor: '#FB923C',
      tagBg: 'rgba(249, 115, 22, 0.18)',
      tagBorder: 'rgba(249, 115, 22, 0.5)',
      tagText: '#FDBA74',
      emoji: '✈️',
    };
  }

  // Aqua Line (Noida Sector 51 ↔ Greater Noida Depot)
  if (s.includes('aqua line') || s.includes('aqua-line')) {
    return {
      key: 'aqua',
      name: 'Aqua Line',
      primary: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.22)',
      badgeBorder: 'rgba(6, 182, 212, 0.55)',
      cardBg: 'rgba(6, 182, 212, 0.07)',
      cardBorder: 'rgba(6, 182, 212, 0.45)',
      textColor: '#22D3EE',
      tagBg: 'rgba(6, 182, 212, 0.18)',
      tagBorder: 'rgba(6, 182, 212, 0.5)',
      tagText: '#67E8F9',
      emoji: '🌊',
    };
  }

  // Rapid Metro (Cyber City ↔ Phase 3 / Golf Course)
  if (s.includes('rapid metro') || s.includes('cyber city metro')) {
    return {
      key: 'rapid',
      name: 'Rapid Metro',
      primary: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.22)',
      badgeBorder: 'rgba(56, 189, 248, 0.55)',
      cardBg: 'rgba(56, 189, 248, 0.07)',
      cardBorder: 'rgba(56, 189, 248, 0.45)',
      textColor: '#38BDF8',
      tagBg: 'rgba(56, 189, 248, 0.18)',
      tagBorder: 'rgba(56, 189, 248, 0.5)',
      tagText: '#7DD3FC',
      emoji: '⚡',
    };
  }

  return null;
}
