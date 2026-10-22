/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  /**
   * Warm Ivory Daylight Palette (#FAF7F2)
   * Soft alabaster canvas with pure white floating cards, warm stone borders,
   * and deep espresso-charcoal typography for zero harsh white glare.
   */
  light: {
    text: '#14151A',
    background: '#FAF7F2',
    backgroundElement: '#F2ECE4',
    backgroundSelected: '#E7E0D6',
    textSecondary: '#57534E',
    textMuted: '#78716C',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E7E0D6',
    pillBg: '#EFECE6',
    tabBarBg: '#FFFFFF',
    brandCoral: '#E11D48',
    brandCoralSoft: 'rgba(225, 29, 72, 0.10)',
    goldAccent: '#D97706',
    goldSoft: 'rgba(217, 119, 6, 0.12)',
    emeraldText: '#059669',
    emeraldSoft: 'rgba(5, 150, 105, 0.12)',
    chatIncoming: '#F0ECE3',
    chatOutgoing: '#E11D48',
  },
  /**
   * Signature Obsidian Dark Mode (#0E0F13) — Default App Theme
   */
  dark: {
    text: '#F8FAFC',
    background: '#0E0F13',
    backgroundElement: '#14161E',
    backgroundSelected: '#1F2332',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    card: '#181B26',
    cardElevated: '#1F2332',
    border: '#232634',
    pillBg: '#1D202C',
    tabBarBg: '#121318',
    brandCoral: '#FF385C',
    brandCoralSoft: 'rgba(255, 56, 92, 0.15)',
    goldAccent: '#F59E0B',
    goldSoft: 'rgba(245, 158, 11, 0.15)',
    emeraldText: '#34D399',
    emeraldSoft: 'rgba(16, 185, 129, 0.15)',
    chatIncoming: '#1E2230',
    chatOutgoing: '#FF385C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
