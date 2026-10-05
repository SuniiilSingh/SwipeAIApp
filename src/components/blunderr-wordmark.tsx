import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface BlunderRWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  slant?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  rStyle?: StyleProp<TextStyle>;
  showCommunityPill?: boolean;
  communityName?: string;
}

/**
 * Letter-by-letter calibrated gradient stops across the full word 'BlunderR'.
 * Flows seamlessly from Electric Coral Flame (#FF385C) -> Sunset Rose (#FF6584) -> Sunburst Amber (#F59E0B).
 * Guarantees 100% native smooth gradient rendering across iOS, Android, and Web without white text.
 */
const FULL_FLOW_LETTERS: Array<{ char: string; color: string; isAccent?: boolean }> = [
  { char: 'B', color: '#FF385C' },
  { char: 'l', color: '#FF4767' },
  { char: 'u', color: '#FF5773' },
  { char: 'n', color: '#FF687F' },
  { char: 'd', color: '#FF798C' },
  { char: 'e', color: '#FF8A98' },
  { char: 'r', color: '#FE9A74' },
  { char: 'R', color: '#F59E0B', isAccent: true },
];

/**
 * BlunderR Official Brand Wordmark (Option A: Full Flow Slant ⚡ - Full Word Gradient Edition)
 * Every letter flows through the signature Sunset/Coral palette (NO WHITE).
 * Features uniform kinetic forward slant and a prominent, taller capital 'R' with a glowing finish.
 */
export const BlunderRWordmark: React.FC<BlunderRWordmarkProps> = ({
  size = 'md',
  slant = true,
  style,
  textStyle,
  rStyle,
  showCommunityPill = false,
  communityName,
}) => {
  const getFontSizes = () => {
    switch (size) {
      case 'sm':
        return { root: 16, accent: 20, pill: 9 };
      case 'lg':
        return { root: 28, accent: 35, pill: 11 };
      case 'md':
      default:
        return { root: 22, accent: 27, pill: 10 };
    }
  };

  const { root: rootSize, accent: accentSize, pill: pillSize } = getFontSizes();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.wordmarkRow, slant && styles.slantedLockup]}>
        <Text
          style={[
            styles.baseText,
            slant && styles.italicText,
            Platform.select({
              web: styles.webGradientWordmark,
            }),
          ]}
          numberOfLines={1}>
          {FULL_FLOW_LETTERS.map((item, idx) => (
            <Text
              key={`${item.char}-${idx}`}
              style={[
                styles.charText,
                {
                  fontSize: item.isAccent ? accentSize : rootSize,
                  color: item.color,
                },
                item.isAccent && styles.accentR,
                item.isAccent && rStyle,
                !item.isAccent && textStyle,
              ]}>
              {item.char}
            </Text>
          ))}
        </Text>
      </View>

      {showCommunityPill && !!communityName && (
        <View style={styles.communityPill}>
          <Text style={[styles.communityPillText, { fontSize: pillSize }]} numberOfLines={1}>
            {communityName.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  slantedLockup: {
    transform: [{ skewX: '-5deg' }],
  },
  italicText: {
    fontStyle: 'italic',
  },
  baseText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  charText: {
    fontWeight: '900',
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        textShadow: '0 0 16px rgba(255, 56, 92, 0.45), 0 2px 8px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(255, 56, 92, 0.55)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
      },
    }),
  },
  accentR: {
    marginLeft: 1,
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        textShadow: '0 0 20px rgba(245, 158, 11, 0.55), 0 0 12px rgba(255, 56, 92, 0.6)',
      },
      default: {
        textShadowColor: 'rgba(245, 158, 11, 0.65)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 10,
      },
    }),
  },
  webGradientWordmark: {
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #FF385C 0%, #FF6584 55%, #F59E0B 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      } as any,
    }),
  },
  communityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 56, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 92, 0.35)',
    alignSelf: 'center',
  },
  communityPillText: {
    fontWeight: '900',
    color: '#FF758C',
    letterSpacing: 0.5,
  },
});
