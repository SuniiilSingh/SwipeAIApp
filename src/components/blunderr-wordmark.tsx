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
 * BlunderR Official Brand Wordmark (Option A: Full Flow Slant ⚡)
 * Features crisp diamond white for 'Blunder' + kinetic forward slant +
 * commanding, slightly taller capital 'R' in glowing Electric Coral (#FF385C).
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
            styles.rootText,
            { fontSize: rootSize },
            slant && styles.italicText,
            textStyle,
          ]}
          numberOfLines={1}>
          Blunder
        </Text>
        <Text
          style={[
            styles.accentR,
            { fontSize: accentSize },
            slant && styles.italicText,
            rStyle,
          ]}
          numberOfLines={1}>
          R
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
    transform: [{ skewX: '-4deg' }],
  },
  italicText: {
    fontStyle: 'italic',
  },
  rootText: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  accentR: {
    fontWeight: '900',
    color: '#FF385C',
    marginLeft: 1,
    letterSpacing: -0.5,
    lineHeight: Platform.OS === 'ios' ? undefined : undefined,
    ...Platform.select({
      web: {
        textShadow: '0 0 16px rgba(255, 56, 92, 0.65), 0 2px 8px rgba(0, 0, 0, 0.6)',
      },
      default: {
        textShadowColor: 'rgba(255, 56, 92, 0.75)',
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
