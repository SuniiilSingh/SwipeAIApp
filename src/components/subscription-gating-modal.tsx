import React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

export type GatingFeatureType = 'SWIPE' | 'SUPER_LIKE' | 'DIRECT_DM' | 'REWIND' | 'REVIVE';

interface FeatureConfig {
  icon: string;
  tag: string;
  title: string;
  subtitle: string;
  perks: string[];
  ctaText: string;
}

const FEATURE_CONFIGS: Record<GatingFeatureType, FeatureConfig> = {
  SWIPE: {
    icon: '❤️',
    tag: 'OUT OF DAILY SWIPES',
    title: 'Unlock Unlimited Swipes',
    subtitle: 'You have exhausted your free daily swipes. Get an active pass for unlimited likes and zero daily timeouts!',
    perks: [
      'Unlimited likes & daily swipes without caps',
      '100% Unlimited Chat once matched (Always Free)',
      'See who liked your profile before swiping',
      'Weekend Pass starts at just ₹79 (Fri - Sun)',
    ],
    ctaText: 'Buy Subscription • From ₹79 →',
  },
  SUPER_LIKE: {
    icon: '⭐',
    tag: 'SUPER SPARKS REQUIRED',
    title: 'Super Likes & Sparks',
    subtitle: 'Super Sparks pin your profile right at the top of candidate decks with a 3x higher match & reply rate!',
    perks: [
      'Top-of-deck spotlight on candidate feeds',
      'Special gold flame notification to recipient',
      'Available in 5 Sparks Pack (₹79) or Monthly VIP',
      '100% Unlimited Chat once matched (Free)',
    ],
    ctaText: 'Unlock Sparks in VibeStore →',
  },
  DIRECT_DM: {
    icon: '💬',
    tag: 'SKIP THE SWIPING QUEUE',
    title: 'Direct Messages (Pre-Match)',
    subtitle: 'Direct DMs let you send a personal note directly to their inbox before matching so you get noticed immediately.',
    perks: [
      'Direct message note placed in priority inbox',
      'Skip the swiping queue entirely',
      'Included with VIP Passes or 3x Direct DMs Pack (₹89)',
      '100% Unlimited Chat once matched (Free)',
    ],
    ctaText: 'Buy Subscription / DM Pack →',
  },
  REWIND: {
    icon: '↺',
    tag: 'VIP PRIVILEGE',
    title: 'Rewind Accidental Passes',
    subtitle: 'Accidentally swiped left on someone special? Active passes allow you to rewind and restore missed connections.',
    perks: [
      'Undo any accidental pass in 1 tap',
      'Restore candidate back to top of deck',
      'Included with Weekend Pass (₹79) & Monthly Pass',
      'Unlimited rewinds while pass is active',
    ],
    ctaText: 'Buy Subscription to Rewind →',
  },
  REVIVE: {
    icon: '⏳',
    tag: '48H CHAT TIMEOUT',
    title: 'Revive Expired Match',
    subtitle: 'The 48-hour ephemeral timer has ended. Unfreeze the chat lounge to continue your conversation.',
    perks: [
      'Restores active chat lounge for 48 more hours',
      'Unfreezes locked conversations instantly',
      'Included with Active Passes or ₹19 Sachet',
      '100% Unlimited Chat in restored window',
    ],
    ctaText: 'Buy Subscription / Revive (₹19) →',
  },
};

export interface SubscriptionGatingModalProps {
  visible: boolean;
  feature?: GatingFeatureType;
  onClose: () => void;
  onUpgrade?: () => void;
}

export default function SubscriptionGatingModal({
  visible,
  feature = 'SWIPE',
  onClose,
  onUpgrade,
}: SubscriptionGatingModalProps) {
  const router = useRouter();
  const config = FEATURE_CONFIGS[feature] || FEATURE_CONFIGS.SWIPE;

  const handleProceedToStore = () => {
    hapticFeedback.selection();
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/(tabs)/store');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Top Tag & Close Button */}
          <View style={styles.topRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{config.tag}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{config.icon}</Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.titleText}>{config.title}</Text>
          <Text style={styles.subtitleText}>{config.subtitle}</Text>

          {/* Perks Preview Checklist */}
          <View style={styles.perksCard}>
            {config.perks.map((perk, idx) => (
              <View key={idx} style={styles.perkRow}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          {/* Trust Guarantees */}
          <View style={styles.guaranteeRow}>
            <Text style={styles.guaranteeText}>
              🔒 Instant 1-tap activation • DigiLocker verified • UPI & Cards
            </Text>
          </View>

          {/* Primary Call to Action */}
          <TouchableOpacity
            style={styles.upgradeBtn}
            activeOpacity={0.85}
            onPress={handleProceedToStore}>
            <Text style={styles.upgradeBtnText}>{config.ctaText}</Text>
          </TouchableOpacity>

          {/* Secondary Dismiss Action */}
          <TouchableOpacity
            style={styles.maybeLaterBtn}
            activeOpacity={0.7}
            onPress={onClose}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sheetContainer: {
    width: Math.min(width - 32, 400),
    backgroundColor: '#161822',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#2B2F40',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: 'rgba(233, 64, 87, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.35)',
  },
  tagBadgeText: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#8E94A5',
    fontSize: 14,
    fontWeight: '700',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(233, 64, 87, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  iconText: {
    fontSize: 32,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: '#9EABC0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  perksCard: {
    width: '100%',
    backgroundColor: '#11131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 16,
    gap: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '900',
  },
  perkText: {
    color: '#D8DBE5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  guaranteeRow: {
    marginTop: 12,
    marginBottom: 4,
  },
  guaranteeText: {
    color: '#656A7B',
    fontSize: 10,
    textAlign: 'center',
  },
  upgradeBtn: {
    width: '100%',
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#E94057',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  maybeLaterBtn: {
    paddingVertical: 10,
    marginTop: 4,
  },
  maybeLaterText: {
    color: '#8E94A5',
    fontSize: 12,
    fontWeight: '600',
  },
});
