import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface BlunderRWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | number;
  slant?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  rStyle?: StyleProp<TextStyle>;
  showCommunityPill?: boolean;
  communityName?: string;
  lightMode?: boolean;
}

/**
 * BlunderR Official Brand Wordmark (The Flipped R Luxury Direction ⚡)
 * Features tight, bold Swiss/grotesk typography with 'BLUNDER' in pristine cream (#FAF7F2)
 * and the iconic signature mirrored 'R' in Electric Coral (#FF385C).
 */
export const BlunderRWordmark: React.FC<BlunderRWordmarkProps> = ({
  size = 'md',
  slant = false,
  style,
  textStyle,
  rStyle,
  showCommunityPill = false,
  communityName,
  lightMode = false,
}) => {
  const getFontSizes = () => {
    if (typeof size === 'number') {
      return { root: size, accent: size, pill: Math.max(9, Math.round(size * 0.45)) };
    }
    switch (size) {
      case 'sm':
        return { root: 17, accent: 17, pill: 9 };
      case 'lg':
        return { root: 28, accent: 28, pill: 11 };
      case 'md':
      default:
        return { root: 22, accent: 22, pill: 10 };
    }
  };

  const { root: rootSize, accent: accentSize, pill: pillSize } = getFontSizes();
  const baseColor = lightMode ? '#08080C' : '#FAF7F2';

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.wordmarkRow, slant && styles.slantedLockup]}>
        <Text
          style={[
            styles.baseText,
            { fontSize: rootSize, color: baseColor },
            textStyle,
          ]}
          numberOfLines={1}>
          BLUNDER
        </Text>
        <View style={styles.flippedRContainer}>
          <Text
            style={[
              styles.flippedRText,
              { fontSize: accentSize },
              rStyle,
            ]}
            numberOfLines={1}>
            R
          </Text>
        </View>
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
    flexShrink: 0,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  slantedLockup: {
    transform: [{ skewX: '-4deg' }],
  },
  baseText: {
    fontWeight: '900',
    letterSpacing: -0.6,
    ...Platform.select({
      web: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Arial Black", Arial, sans-serif',
        userSelect: 'none',
      } as any,
      default: {},
    }),
  },
  flippedRContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0.5,
    transform: [{ scaleX: -1 }],
  },
  flippedRText: {
    fontWeight: '900',
    color: '#FF385C',
    letterSpacing: -0.6,
    ...Platform.select({
      web: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Arial Black", Arial, sans-serif',
        textShadow: '0 0 20px rgba(255, 56, 92, 0.45)',
        userSelect: 'none',
      } as any,
      default: {
        textShadowColor: 'rgba(255, 56, 92, 0.55)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
      },
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
