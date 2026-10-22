import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = '@blunderr_theme_mode';

interface ThemeContextValue {
  /** Active mode ('dark' is the default) */
  themeMode: ThemeMode;
  /** True when Obsidian Dark mode is active */
  isDark: boolean;
  /** Semantic color palette for the active mode (Obsidian Dark vs Warm Ivory Light) */
  colors: typeof Colors.dark | typeof Colors.light;
  /** Toggle between 'dark' and 'light' */
  toggleTheme: () => void;
  /** Explicitly set 'dark' or 'light' */
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'dark',
  isDark: true,
  colors: Colors.dark,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to Dark Mode ('dark') as specified
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (mounted && (saved === 'light' || saved === 'dark')) {
          setThemeModeState(saved);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    hapticFeedback.selection();
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      hapticFeedback.selection();
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Sync web document root background when running on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const activeColors = themeMode === 'dark' ? Colors.dark : Colors.light;
      document.documentElement.setAttribute('data-theme', themeMode);
      document.body.style.backgroundColor = activeColors.background;
    }
  }, [themeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      isDark: themeMode === 'dark',
      colors: themeMode === 'dark' ? Colors.dark : Colors.light,
      toggleTheme,
      setThemeMode,
    }),
    [themeMode, toggleTheme, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ============================================================================
// AUTOMATIC WARM IVORY LIGHT MODE STYLESHEET ADAPTER
// ============================================================================

const PRIMARY_DARK_BGS = new Set([
  '#000',
  '#000000',
  '#050608',
  '#06070b',
  '#07080d',
  '#08080e',
  '#08090e',
  '#090a0f',
  '#0a0b10',
  '#0b0c10',
  '#0b0d13',
  '#0b0e17',
  '#0c0d12',
  '#0c0d14',
  '#0d0e14',
  '#0d0f17',
  '#0e0f13',
  '#0e0f14',
  '#0e1017',
  '#0f1016',
  '#0f1118',
  '#10121a',
  '#11131a',
]);

const CARD_DARK_BGS = new Set([
  '#121318',
  '#12141c',
  '#12141f',
  '#13151d',
  '#13151f',
  '#14151c',
  '#14161e',
  '#14161f',
  '#141722',
  '#15161e',
  '#151720',
  '#151722',
  '#16171e',
  '#161821',
  '#161822',
  '#171923',
  '#181922',
  '#181a20',
  '#181a24',
  '#181b26',
  '#181c2c',
  '#191b26',
  '#1a1c26',
  '#1a1d28',
  '#1a1d2b',
  '#1b1e2b',
  '#1c1f2e',
]);

const RECESSED_DARK_BGS = new Set([
  '#1d202a',
  '#1d202c',
  '#1e1f28',
  '#1e202b',
  '#1e212d',
  '#1e212e',
  '#1e2230',
  '#1e2333',
  '#1f222e',
  '#1f2332',
  '#1f2437',
  '#20222b',
  '#202330',
  '#212225',
  '#212432',
  '#222533',
  '#232634',
  '#242736',
  '#242838',
  '#252836',
  '#262833',
  '#262938',
  '#282b3a',
  '#282c3e',
  '#2a2d3d',
  '#2e3135',
]);

const TINTED_CARD_BGS: Record<string, string> = {
  '#2a1f1d': '#FFF7ED',
  '#201a24': '#FDF2F8',
  '#1c1622': '#FAF5FF',
  '#18221d': '#ECFDF5',
  '#1e1418': '#FEF2F2',
  '#131a26': '#F0F9FF',
};

const DARK_BORDER_HEXES = new Set([
  '#1e212e',
  '#1f222e',
  '#1f2c40',
  '#20222b',
  '#222530',
  '#232634',
  '#252836',
  '#262833',
  '#262938',
  '#26293b',
  '#264230',
  '#282c3a',
  '#2a2d3d',
  '#2d3142',
  '#2e303e',
  '#2e3244',
  '#32364a',
  '#382645',
  '#3a3f50',
  '#4a1d24',
]);

const PRIMARY_LIGHT_TEXTS = new Set([
  '#fff',
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#eaeef6',
  '#edeff5',
  '#f3f4f6',
  '#e5e7eb',
  '#cacdd8',
]);

const SECONDARY_LIGHT_TEXTS = new Set([
  '#8e94a5',
  '#8e92a4',
  '#94a3b8',
  '#9ca3af',
  '#8a8f9e',
  '#a0a5b5',
  '#a1a1aa',
  '#b0b4ba',
  '#cbd5e1',
  '#d1d5db',
]);

const MUTED_LIGHT_TEXTS = new Set([
  '#64748b',
  '#6b7082',
  '#6b7280',
  '#71717a',
  '#7c8294',
  '#5a5f72',
]);

/**
 * Style keys that sit on top of full-bleed photos, camera feeds, or filled vibrant buttons
 * where white text (#FFFFFF) must remain white even in Warm Ivory Light Mode.
 */
const PRESERVE_WHITE_TEXT_KEY_PATTERN =
  /BtnText|ButtonText|BadgeText|BadgeCountText|CheckText|CtaText|SubmitText|Overlay|CandidateName|Photo|MemeTitle|LivePill|Outgoing|ActionBtn|PrimaryBtn|SendBtn|VerifyBtn|SaveHeader|PlayBtn|RecordBtn|Toast|Floating|Scrim|Camera|Selfie|BannerBtn/i;

const PRESERVE_ENTIRE_RULE_KEY_PATTERN =
  /Overlay|Scrim|PhotoCard|Camera|Selfie|MemeInfo|Toast/i;

function mapBackgroundForLightMode(bg: string): string {
  const lower = bg.trim().toLowerCase();
  if (PRIMARY_DARK_BGS.has(lower)) return Colors.light.background; // #FAF7F2 Warm Ivory
  if (CARD_DARK_BGS.has(lower)) return Colors.light.card; // #FFFFFF Pure White Card
  if (RECESSED_DARK_BGS.has(lower)) return Colors.light.backgroundElement; // #F2ECE4 Warm Alabaster
  if (TINTED_CARD_BGS[lower]) return TINTED_CARD_BGS[lower];

  // Handle translucent dark glass surfaces like rgba(18, 20, 28, 0.85) or rgba(255,255,255,0.05)
  if (lower.startsWith('rgba(')) {
    if (
      lower.startsWith('rgba(10,') ||
      lower.startsWith('rgba(12,') ||
      lower.startsWith('rgba(14,') ||
      lower.startsWith('rgba(15,') ||
      lower.startsWith('rgba(16,') ||
      lower.startsWith('rgba(18,') ||
      lower.startsWith('rgba(20,') ||
      lower.startsWith('rgba(22,') ||
      lower.startsWith('rgba(24,') ||
      lower.startsWith('rgba(26,') ||
      lower.startsWith('rgba(28,') ||
      lower.startsWith('rgba(30,')
    ) {
      return 'rgba(255, 255, 255, 0.94)';
    }
    if (lower.startsWith('rgba(255, 255, 255, 0.0') || lower.startsWith('rgba(255,255,255,0.0')) {
      return Colors.light.backgroundElement; // #F2ECE4
    }
  }
  return bg;
}

function mapBorderForLightMode(border: string): string {
  const lower = border.trim().toLowerCase();
  if (DARK_BORDER_HEXES.has(lower)) return Colors.light.border; // #E7E0D6
  if (
    lower.startsWith('rgba(255, 255, 255, 0.0') ||
    lower.startsWith('rgba(255, 255, 255, 0.1') ||
    lower.startsWith('rgba(255,255,255,0.0') ||
    lower.startsWith('rgba(255,255,255,0.1')
  ) {
    return Colors.light.border;
  }
  return border;
}

/**
 * Automatically adapts a React Native StyleSheet object between Obsidian Dark Mode (default)
 * and Warm Ivory Light Mode (#FAF7F2).
 */
export function useThemedStyles<T extends Record<string, any>>(
  baseStyles: T,
  preserveDarkKeys: (keyof T)[] = []
): T {
  const { isDark } = useAppTheme();

  return useMemo(() => {
    if (isDark) return baseStyles;

    const preserveSet = new Set(preserveDarkKeys.map(String));
    const adapted: Record<string, any> = {};

    for (const key of Object.keys(baseStyles)) {
      const rule = baseStyles[key];
      if (!rule || typeof rule !== 'object') {
        adapted[key] = rule;
        continue;
      }

      if (preserveSet.has(key) || PRESERVE_ENTIRE_RULE_KEY_PATTERN.test(key)) {
        adapted[key] = rule;
        continue;
      }

      const nextRule: Record<string, any> = { ...rule };

      // Check if this rule has a vibrant accent background (like #E94057 / #FF385C)
      const origBg = typeof rule.backgroundColor === 'string' ? rule.backgroundColor.trim().toLowerCase() : '';
      const mappedBg = origBg ? mapBackgroundForLightMode(origBg) : '';
      const isVibrantFilledBg =
        Boolean(origBg) &&
        mappedBg === origBg &&
        !origBg.startsWith('rgba(') &&
        origBg !== 'transparent';

      if (typeof nextRule.backgroundColor === 'string') {
        nextRule.backgroundColor = mapBackgroundForLightMode(nextRule.backgroundColor);
      }

      for (const bProp of ['borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor']) {
        if (typeof nextRule[bProp] === 'string') {
          nextRule[bProp] = mapBorderForLightMode(nextRule[bProp]);
        }
      }

      if (typeof nextRule.color === 'string') {
        const lowerColor = nextRule.color.trim().toLowerCase();
        const shouldKeepWhite = isVibrantFilledBg || PRESERVE_WHITE_TEXT_KEY_PATTERN.test(key);

        if (!shouldKeepWhite && PRIMARY_LIGHT_TEXTS.has(lowerColor)) {
          nextRule.color = Colors.light.text; // #14151A Deep Espresso
        } else if (SECONDARY_LIGHT_TEXTS.has(lowerColor)) {
          nextRule.color = Colors.light.textSecondary; // #57534E Warm Stone
        } else if (MUTED_LIGHT_TEXTS.has(lowerColor)) {
          nextRule.color = Colors.light.textMuted; // #78716C Warm Taupe
        }
      }

      adapted[key] = nextRule;
    }

    return adapted as T;
  }, [baseStyles, isDark, preserveDarkKeys]);
}
