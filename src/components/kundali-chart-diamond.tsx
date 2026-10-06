import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface KundaliChartDiamondProps {
  lagnaSign?: string | null;
  chandraRashi?: string;
  sunSign?: string;
  nakshatraName?: string;
  isManglik?: boolean;
}

/**
 * Authentic Vedic North Indian Kundali Diamond Chart ( लग्न कुंडली ).
 * Uses clean flex and positioned elements to render the traditional
 * 12-house Vedic birth diamond chart with houses, planetary signs, and central Tanu Bhava (Ascendant).
 */
export default function KundaliChartDiamond({
  lagnaSign,
  chandraRashi,
  sunSign,
  nakshatraName,
  isManglik,
}: KundaliChartDiamondProps) {
  const rashiShort = (name?: string | null) => {
    if (!name) return '—';
    const clean = name.split(' ')[0].slice(0, 4);
    return clean;
  };

  return (
    <View style={styles.chartWrapper}>
      <View style={styles.chartTitleRow}>
        <Text style={styles.chartTitle}>लग्न कुंडली (North Indian Vedic Janampatri)</Text>
        <View style={styles.chartPill}>
          <Text style={styles.chartPillText}>D1 Rashi Chart</Text>
        </View>
      </View>

      {/* The Traditional 12-Bhavas Vedic Chart Container */}
      <View style={styles.diamondContainer}>
        {/* Diamond Outer Frame */}
        <View style={styles.outerFrame}>
          {/* Top Diamond - House 1 (Lagna / Tanu Bhava - Self & Soul) */}
          <View style={[styles.houseBox, styles.house1]}>
            <Text style={styles.houseNumber}>1</Text>
            <Text style={styles.housePlanet}>Asc: {rashiShort(lagnaSign || chandraRashi)}</Text>
            <Text style={styles.houseLabel}>तनु भाव (Lagna)</Text>
          </View>

          {/* House 2 - Top Left (Dhana Bhava - Wealth & Voice) */}
          <View style={[styles.houseBox, styles.house2]}>
            <Text style={styles.houseNumber}>2</Text>
            <Text style={styles.housePlanet}>धन</Text>
          </View>

          {/* House 12 - Top Right (Vyaya Bhava - Subconscious) */}
          <View style={[styles.houseBox, styles.house12]}>
            <Text style={styles.houseNumber}>12</Text>
            <Text style={styles.housePlanet}>व्यय</Text>
          </View>

          {/* House 4 - Center Left (Matru / Sukh Bhava - Inner Peace & Home) */}
          <View style={[styles.houseBox, styles.house4]}>
            <Text style={styles.houseNumber}>4</Text>
            <Text style={styles.housePlanet}>Mo: {rashiShort(chandraRashi)}</Text>
            <Text style={styles.houseLabel}>सुख (Moon)</Text>
          </View>

          {/* House 10 - Center Right (Karma Bhava - Ambition & Purpose) */}
          <View style={[styles.houseBox, styles.house10]}>
            <Text style={styles.houseNumber}>10</Text>
            <Text style={styles.housePlanet}>Su: {rashiShort(sunSign)}</Text>
            <Text style={styles.houseLabel}>कर्म (Sun)</Text>
          </View>

          {/* House 7 - Bottom Diamond (Kalatra Bhava - True Love & Life Partner) */}
          <View style={[styles.houseBox, styles.house7]}>
            <Text style={styles.houseNumber}>7</Text>
            <Text style={[styles.housePlanet, { color: '#FF6B6B' }]}>
              {isManglik ? 'Ma (मंगळ)' : 'कलत्र (Love)'}
            </Text>
            <Text style={styles.houseLabel}>जाया भाव (Spouse)</Text>
          </View>

          {/* House 5 - Tri-Kona (Love Romance & Intellect) */}
          <View style={[styles.houseBox, styles.house5]}>
            <Text style={styles.houseNumber}>5</Text>
            <Text style={styles.housePlanet}>पुत्र/प्रेम</Text>
          </View>

          {/* House 9 - Dharma Bhava (Fortune & Higher Calling) */}
          <View style={[styles.houseBox, styles.house9]}>
            <Text style={styles.houseNumber}>9</Text>
            <Text style={styles.housePlanet}>धर्म/भाग्य</Text>
          </View>
        </View>

        {/* Center Astrological Badge */}
        <View style={styles.centerBadge}>
          <Text style={styles.centerZodiacSymbol}>🪐</Text>
          <Text style={styles.centerStarText}>{nakshatraName || 'Rohini'}</Text>
          <Text style={styles.centerSubText}>Sidereal Lahiri</Text>
        </View>
      </View>

      {/* Vedic Houses Legend Key */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
          <Text style={styles.legendText}>H1: Lagna (Soul)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F472B6' }]} />
          <Text style={styles.legendText}>H4: Moon (Emotions)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>H7: Kalatra (Partner)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
          <Text style={styles.legendText}>H10: Karma (Path)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    backgroundColor: '#0F101A',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#2D304D',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.3,
  },
  chartPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  chartPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  diamondContainer: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#0A0A12',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3730A3',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerFrame: {
    ...StyleSheet.absoluteFill,
    padding: 6,
  },
  houseBox: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'rgba(30, 32, 54, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  house1: {
    top: 8,
    left: '25%',
    right: '25%',
    height: '24%',
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(14, 116, 144, 0.25)',
  },
  house2: {
    top: 8,
    left: 8,
    width: '20%',
    height: '24%',
  },
  house12: {
    top: 8,
    right: 8,
    width: '20%',
    height: '24%',
  },
  house4: {
    top: '36%',
    left: 8,
    width: '26%',
    height: '28%',
    borderColor: 'rgba(244, 114, 182, 0.5)',
    backgroundColor: 'rgba(157, 23, 77, 0.22)',
  },
  house10: {
    top: '36%',
    right: 8,
    width: '26%',
    height: '28%',
    borderColor: 'rgba(251, 191, 36, 0.5)',
    backgroundColor: 'rgba(180, 83, 9, 0.22)',
  },
  house7: {
    bottom: 8,
    left: '25%',
    right: '25%',
    height: '25%',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(185, 28, 28, 0.22)',
  },
  house5: {
    bottom: 8,
    left: 8,
    width: '20%',
    height: '25%',
  },
  house9: {
    bottom: 8,
    right: 8,
    width: '20%',
    height: '25%',
  },
  houseNumber: {
    position: 'absolute',
    top: 3,
    left: 5,
    fontSize: 9,
    fontWeight: '800',
    color: '#818CF8',
  },
  housePlanet: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  houseLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },
  centerBadge: {
    width: '32%',
    height: '26%',
    borderRadius: 12,
    backgroundColor: 'rgba(20, 20, 35, 0.95)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  centerZodiacSymbol: {
    fontSize: 16,
    marginBottom: 2,
  },
  centerStarText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  centerSubText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#818CF8',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
