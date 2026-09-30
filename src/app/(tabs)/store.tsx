import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { SkuCatalogItem } from '@/types';
import {
  executePurchase,
  getActivePaymentRail,
  getAvailablePaymentRails,
  resolveDisplayPrice,
  resolvePlatformProductId,
  PaymentRail,
} from '@/services/payments';
import { hapticFeedback } from '@/utils/haptics';

export interface BenefitBreakdown {
  messages: string;     // e.g. "10 Direct Messages"
  likes: string;        // e.g. "Unlimited (30 Days)"
  superLikes: string;   // e.g. "15 Super Sparks"
  boosts?: string;      // e.g. "4 Friday Peak Boosts"
  extra?: string;       // e.g. "DigiLocker Trust Badge"
}

export function getBenefitBreakdown(sku?: string): BenefitBreakdown {
  if (!sku) {
    return {
      messages: 'Standard Matching',
      likes: 'Standard Swipes',
      superLikes: 'None',
    };
  }
  switch (sku) {
    case 'MONTHLY_PASS_349':
      return {
        likes: 'Unlimited Swipes (30 Days)',
        messages: '10 Direct Messages',
        superLikes: '15 Super Sparks',
        boosts: '4 Friday Night Boosts',
        extra: 'DigiLocker Trust Badge',
      };
    case 'WEEKEND_PASS_79':
    case 'WEEKEND_PASS_99':
      return {
        likes: 'Unlimited Swipes (3 Days)',
        messages: 'Matching Required',
        superLikes: '3 Super Sparks Included',
        boosts: 'Priority Pool Visibility',
        extra: 'See Who Liked You',
      };
    case 'WINGMAN_BUNDLE_199':
      return {
        likes: 'Weekend Pass (3 Days)',
        messages: '2 Direct Messages',
        superLikes: '5 Super Sparks',
        boosts: '1 Friday Night Boost',
        extra: 'All-In-One Weekend Kit',
      };
    case 'WEEKLY_PASS_149':
      return {
        likes: 'Unlimited Swipes (7 Days)',
        messages: '3 Direct Messages',
        superLikes: '5 Super Sparks',
        boosts: '1 Profile Boost',
      };
    case 'FORTNIGHT_PASS_199':
      return {
        likes: 'Unlimited Swipes (14 Days)',
        messages: '5 Direct Messages',
        superLikes: '6 Super Sparks',
        boosts: '2 Profile Boosts',
      };
    case 'SELECT_QUARTERLY_899':
    case 'SELECT_QUARTERLY_999':
      return {
        likes: 'Unlimited Swipes (90 Days)',
        messages: '25 Direct Messages',
        superLikes: '25 Super Sparks',
        boosts: 'Concierge Curation',
        extra: 'Exclusive Offline Mixers',
      };
    case 'DIRECT_DMS_3X_89':
    case 'DIRECT_DMS_3X_49':
      return {
        messages: '3 Direct Messages',
        likes: 'Standard Swipes',
        superLikes: 'None',
        extra: 'Chat before matching',
      };
    case 'SPARKS_PACK_5_79':
      return {
        superLikes: '5 Super Sparks',
        likes: 'Standard Swipes',
        messages: 'Standard Match',
        extra: 'Top of feed visibility (5x)',
      };
    case 'SUPER_SPARK_19':
      return {
        superLikes: '1 Super Spark',
        likes: 'Standard Swipes',
        messages: 'Standard Match',
        extra: '3x higher reply rate',
      };
    case 'BOOST_1X_FRIDAY_39':
    case 'BOOST_1X_FRIDAY_29':
      return {
        boosts: '1 Friday Peak Boost',
        likes: 'Standard Swipes',
        messages: 'Standard Match',
        superLikes: 'None',
        extra: '10x profile views (1 hr)',
      };
    case 'CUTTING_CHAI_21':
      return {
        messages: '1 Chai Micro-Invite',
        superLikes: '1 Chai Highlight',
        likes: 'Standard Swipes',
        extra: '15% Partner Cafe Coupon',
      };
    case 'REVIVE_MATCH_19':
      return {
        messages: 'Restores Chat for 48h',
        likes: 'Standard Swipes',
        superLikes: 'None',
        extra: 'Unfreezes 1 expired match',
      };
    default:
      return {
        likes: 'Standard Swipes',
        messages: 'Standard Match',
        superLikes: 'Included with perk',
      };
  }
}

export default function StoreScreen() {
  const [catalog, setCatalog] = useState<SkuCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<SkuCatalogItem | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const availableRails = getAvailablePaymentRails();
  const [selectedRail, setSelectedRail] = useState<PaymentRail>(availableRails[0].rail);

  const activeRail = getActivePaymentRail(selectedRail);

  const loadCatalog = async () => {
    try {
      const items = await api.getCatalog();
      if (items && items.length > 0) {
        setCatalog(items);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light();
    loadCatalog();
  };

  const handleOpenCheckout = (item: SkuCatalogItem) => {
    hapticFeedback.light();
    setSelectedRail(availableRails[0].rail);
    setCheckoutItem(item);
  };

  const handleConfirmPurchase = async () => {
    if (!checkoutItem) return;

    setProcessingPayment(true);
    hapticFeedback.medium();

    try {
      const result = await executePurchase(checkoutItem, selectedRail, (status) => {
        setProcessingStatus(status);
      });

      setProcessingPayment(false);
      setCheckoutItem(null);

      Alert.alert(
        '🎉 Payment Successful',
        result.message || `Your ${checkoutItem.title} is now active!`
      );
    } catch (err: any) {
      setProcessingPayment(false);
      Alert.alert('Payment Incomplete', err.message || 'Transaction could not be verified.');
    }
  };

  // Categorize catalog items into distinct visual tiers
  const weekendPass = catalog.find((c) => c.sku === 'WEEKEND_PASS_79' || c.sku === 'WEEKEND_PASS_99');

  const vipPasses = catalog.filter((c) =>
    ['MONTHLY_PASS_349', 'WINGMAN_BUNDLE_199', 'WEEKLY_PASS_149', 'FORTNIGHT_PASS_199', 'SELECT_QUARTERLY_899', 'SELECT_QUARTERLY_999'].includes(c.sku)
  );

  const sachetItems = catalog.filter(
    (c) =>
      c.sku !== 'WEEKEND_PASS_79' &&
      c.sku !== 'WEEKEND_PASS_99' &&
      !['MONTHLY_PASS_349', 'WINGMAN_BUNDLE_199', 'WEEKLY_PASS_149', 'FORTNIGHT_PASS_199', 'SELECT_QUARTERLY_899', 'SELECT_QUARTERLY_999'].includes(c.sku)
  );

  const checkoutBenefits = getBenefitBreakdown(checkoutItem?.sku);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E94057"
            colors={['#E94057']}
          />
        }>
        {/* Dynamic Platform-Aware Store Header */}
        <View style={styles.header}>
          <Text style={styles.title}>VibeStore & Passes</Text>
          <Text style={styles.subtitle}>Unlock direct messages, unlimited likes, and profile sparks</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E94057" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 1. HERO CARD: Weekend Dating Pass */}
            {weekendPass && (
              <View style={styles.heroPassCard}>
                <View style={styles.heroTopTag}>
                  <Text style={styles.heroTagText}>🔥 MOST POPULAR FOR WEEKENDS</Text>
                </View>

                <View style={styles.heroPriceRow}>
                  <Text style={styles.heroPrice}>₹{weekendPass.priceInr}</Text>
                  <Text style={styles.heroDuration}>/ weekend pass (Fri - Sun)</Text>
                </View>

                <Text style={styles.heroTitle}>{weekendPass.title}</Text>
                <Text style={styles.heroSubtitle}>{weekendPass.subtitle}</Text>

                {/* EXACT DELIVERABLE STAT PILLS */}
                <View style={styles.statsPillRow}>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillText}>❤️ Unlimited Likes (3d)</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillText}>⭐ 3 Super Sparks</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillText}>👁️ See Who Liked You</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Text style={styles.statPillText}>🚀 Priority Pool</Text>
                  </View>
                </View>

                {/* CHECKLIST */}
                <View style={styles.heroPerksList}>
                  {weekendPass.perks?.map((p, idx) => (
                    <View key={idx} style={styles.heroPerkRow}>
                      <Text style={styles.heroPerkCheck}>✓</Text>
                      <Text style={styles.heroPerkItem}>{p}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.heroBuyBtn}
                  activeOpacity={0.85}
                  onPress={() => handleOpenCheckout(weekendPass)}>
                  <Text style={styles.heroBuyBtnText}>
                    Get Weekend Pass • ₹{weekendPass.priceInr} →
                  </Text>
                  <Text style={styles.heroBuySubText}>
                    Instant 1-tap activation • Restores automatically
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. VIP PASSES & PACKS SECTION (Full Width Cards with Clear Counts) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>👑 VIP Subscriptions & Bundles</Text>
              <Text style={styles.sectionSubHeading}>
                Full unlimited access with direct messages, sparks, and peak boosts
              </Text>
            </View>

            <View style={styles.vipPassList}>
              {vipPasses.map((item) => {
                const benefits = getBenefitBreakdown(item.sku);
                const isMonthly = item.sku === 'MONTHLY_PASS_349';
                const isWingman = item.sku === 'WINGMAN_BUNDLE_199';

                return (
                  <TouchableOpacity
                    key={item.sku}
                    style={[
                      styles.vipPassCard,
                      isMonthly && styles.vipPassCardMonthly,
                      isWingman && styles.vipPassCardWingman,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleOpenCheckout(item)}>
                    
                    {/* Header Row: Title + Tag */}
                    <View style={styles.vipPassHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vipPassTitle}>{item.title}</Text>
                        <Text style={styles.vipPassSubtitle}>{item.subtitle}</Text>
                      </View>
                      <View style={styles.vipPriceCol}>
                        <Text style={styles.vipPriceText}>₹{item.priceInr}</Text>
                        {item.tag && (
                          <View style={[styles.vipPassTag, isMonthly && styles.vipPassTagGold]}>
                            <Text style={[styles.vipPassTagText, isMonthly && styles.vipPassTagTextGold]}>
                              {item.tag}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* KEY DELIVERABLES BADGES (Messages, Likes, Sparks, Boosts) */}
                    <View style={styles.statsPillRow}>
                      <View style={[styles.statPill, styles.statPillHighlight]}>
                        <Text style={styles.statPillText}>❤️ {benefits.likes}</Text>
                      </View>
                      <View style={[styles.statPill, styles.statPillMessages]}>
                        <Text style={[styles.statPillText, styles.statPillTextMessages]}>
                          💬 {benefits.messages}
                        </Text>
                      </View>
                      <View style={[styles.statPill, styles.statPillSparks]}>
                        <Text style={[styles.statPillText, styles.statPillTextSparks]}>
                          ⭐ {benefits.superLikes}
                        </Text>
                      </View>
                      {benefits.boosts && (
                        <View style={styles.statPill}>
                          <Text style={styles.statPillText}>🚀 {benefits.boosts}</Text>
                        </View>
                      )}
                    </View>

                    {/* PERKS CHECKLIST */}
                    <View style={styles.vipPerksList}>
                      {item.perks?.map((perk, idx) => (
                        <View key={idx} style={styles.vipPerkRow}>
                          <Text style={styles.vipPerkCheck}>✓</Text>
                          <Text style={styles.vipPerkItem}>{perk}</Text>
                        </View>
                      ))}
                    </View>

                    {/* ACTION BUTTON */}
                    <View style={[styles.vipBuyBtn, isMonthly && styles.vipBuyBtnMonthly]}>
                      <Text style={styles.vipBuyBtnText}>
                        Unlock {item.title} • ₹{item.priceInr} →
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. MICRO-SACHETS & TOP-UPS SECTION (2-Column Grid) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>⚡ Micro-Sachets & Top-Ups</Text>
              <Text style={styles.sectionSubHeading}>
                Instant single-use direct message packs, sparks, and visibility boosts
              </Text>
            </View>

            <View style={styles.sachetGrid}>
              {sachetItems.map((item) => {
                const benefits = getBenefitBreakdown(item.sku);
                const isDms = item.sku.includes('DMS');
                const isSparks = item.sku.includes('SPARK');

                return (
                  <TouchableOpacity
                    key={item.sku}
                    style={styles.sachetCard}
                    activeOpacity={0.8}
                    onPress={() => handleOpenCheckout(item)}>
                    <View style={styles.sachetCardTop}>
                      {/* Top Deliverable Badge */}
                      <View style={styles.sachetTagRow}>
                        {isDms ? (
                          <View style={[styles.sachetTag, styles.sachetTagDms]}>
                            <Text style={styles.sachetTagTextDms}>💬 {benefits.messages}</Text>
                          </View>
                        ) : isSparks ? (
                          <View style={[styles.sachetTag, styles.sachetTagSparks]}>
                            <Text style={styles.sachetTagTextSparks}>⭐ {benefits.superLikes}</Text>
                          </View>
                        ) : item.tag ? (
                          <View style={styles.sachetTag}>
                            <Text style={styles.sachetTagText}>{item.tag}</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.sachetPrice}>₹{item.priceInr}</Text>
                      <Text style={styles.sachetTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      
                      {/* Clear Deliverables Callout */}
                      <View style={styles.sachetDeliverableBox}>
                        {isDms ? (
                          <Text style={styles.sachetDeliverableHighlight}>
                            💬 3 Direct Messages to chat before matching
                          </Text>
                        ) : isSparks ? (
                          <Text style={styles.sachetDeliverableHighlight}>
                            ⭐ Highlights profile at top of candidate feed
                          </Text>
                        ) : (
                          <Text style={styles.sachetDeliverableHighlight}>
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.buySachetBtn}>
                      <Text style={styles.buySachetBtnText}>
                        Unlock • ₹{item.priceInr}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* SECURE DUAL-RAIL CHECKOUT CONFIRMATION MODAL */}
        <Modal visible={!!checkoutItem} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>Checkout & Deliverables</Text>
                <TouchableOpacity onPress={() => setCheckoutItem(null)} disabled={processingPayment}>
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              {checkoutItem && (
                <View style={styles.orderSummaryBox}>
                  <View style={styles.summaryItemRow}>
                    <Text style={styles.summaryTitle}>{checkoutItem.title}</Text>
                    <Text style={styles.summaryPrice}>
                      ₹{resolveDisplayPrice(checkoutItem, selectedRail)}
                    </Text>
                  </View>
                  <Text style={styles.summarySubtitle}>{checkoutItem.subtitle}</Text>
                </View>
              )}

              {/* EXACT DELIVERABLES BREAKDOWN TABLE */}
              {checkoutItem && (
                <View style={styles.modalDeliverablesCard}>
                  <Text style={styles.modalDeliverablesHeader}>
                    📦 EXACT DELIVERABLES IN THIS PACK:
                  </Text>
                  
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>💬 Direct Messages:</Text>
                    <Text style={styles.modalRowValue}>{checkoutBenefits.messages}</Text>
                  </View>
                  
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>❤️ Daily Likes & Swipes:</Text>
                    <Text style={styles.modalRowValue}>{checkoutBenefits.likes}</Text>
                  </View>
                  
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>⭐ Super Likes / Sparks:</Text>
                    <Text style={styles.modalRowValue}>{checkoutBenefits.superLikes}</Text>
                  </View>
                  
                  {checkoutBenefits.boosts && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalRowLabel}>🚀 Visibility Boosts:</Text>
                      <Text style={styles.modalRowValue}>{checkoutBenefits.boosts}</Text>
                    </View>
                  )}
                  
                  {checkoutBenefits.extra && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalRowLabel}>🛡️ Extra Privilege:</Text>
                      <Text style={styles.modalRowValue}>{checkoutBenefits.extra}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* PAYMENT METHOD CHOOSER */}
              {availableRails.length > 1 && (
                <>
                  <Text style={styles.paymentMethodLabel}>Select Billing Option:</Text>
                  <View style={styles.methodChoiceList}>
                    {availableRails.map((railInfo) => {
                      const isSelected = selectedRail === railInfo.rail;
                      const price = resolveDisplayPrice(checkoutItem, railInfo.rail);
                      return (
                        <TouchableOpacity
                          key={railInfo.rail}
                          style={[
                            styles.methodChoiceCard,
                            isSelected && styles.methodChoiceCardActive,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => {
                            hapticFeedback.selection();
                            setSelectedRail(railInfo.rail);
                          }}>
                          <View style={styles.methodChoiceHeader}>
                            <View style={styles.methodTitleRow}>
                              <Text style={styles.methodRadio}>{isSelected ? '🔘' : '⚪'}</Text>
                              <Text style={styles.methodChoiceTitle}>{railInfo.name}</Text>
                            </View>
                            <Text style={styles.methodChoicePrice}>₹{price}</Text>
                          </View>
                          <Text style={styles.methodChoiceDesc}>{railInfo.description}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {processingPayment ? (
                <View style={styles.processingBox}>
                  <ActivityIndicator size="large" color="#E94057" />
                  <Text style={styles.processingText}>
                    {processingStatus || 'Verifying transaction with gateway...'}
                  </Text>
                  <Text style={styles.processingSubText}>
                    Please do not close this screen while benefits are being credited.
                  </Text>
                </View>
              ) : (
                <>
                  {availableRails.length > 1 && (
                    <Text style={styles.ucbNoticeText}>
                      Google Play terms and buyer protections apply to purchases completed through Google Play.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.confirmPayBtn}
                    activeOpacity={0.85}
                    onPress={handleConfirmPurchase}>
                    <Text style={styles.confirmPayBtnText}>
                      {selectedRail === 'CASHFREE_WEB'
                        ? `Pay ₹${resolveDisplayPrice(checkoutItem, 'CASHFREE_WEB')} with Cashfree (UPI & Cards)`
                        : Platform.OS === 'ios'
                        ? `Pay ₹${resolveDisplayPrice(checkoutItem, 'APPLE_STOREKIT')} with Apple`
                        : `Pay ₹${resolveDisplayPrice(checkoutItem, 'GOOGLE_PLAY')} with Google Play`}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.disclaimerText}>
                    {activeRail.securityNotice} Purchases are encrypted via AES-256-GCM and restore automatically.
                  </Text>
                </>
              )}
            </View>
          </View>
        </Modal>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  subtitle: {
    color: '#8A8D98',
    fontSize: 13,
    marginTop: 4,
  },

  // HERO PASS CARD
  heroPassCard: {
    backgroundColor: '#1E1724',
    borderWidth: 2,
    borderColor: '#E94057',
    borderRadius: 22,
    padding: 18,
    marginVertical: 12,
  },
  heroTopTag: {
    backgroundColor: 'rgba(233, 64, 87, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  heroTagText: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  heroPrice: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  heroDuration: {
    color: '#A0A4B4',
    fontSize: 13,
    marginLeft: 6,
  },
  heroSubtitle: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  // STATS PILL BADGES
  statsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statPillHighlight: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    borderColor: 'rgba(233, 64, 87, 0.4)',
  },
  statPillMessages: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderColor: 'rgba(0, 180, 216, 0.4)',
  },
  statPillSparks: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    borderColor: 'rgba(255, 183, 3, 0.4)',
  },
  statPillText: {
    color: '#E0E3EE',
    fontSize: 11,
    fontWeight: '700',
  },
  statPillTextMessages: {
    color: '#00B4D8',
  },
  statPillTextSparks: {
    color: '#FFB703',
  },

  heroPerksList: {
    gap: 6,
    marginVertical: 10,
  },
  heroPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPerkCheck: {
    color: '#E94057',
    fontSize: 13,
    fontWeight: '900',
  },
  heroPerkItem: {
    color: '#D8DBE5',
    fontSize: 12,
    flex: 1,
  },
  heroBuyBtn: {
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  heroBuyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroBuySubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  // SECTION HEADERS
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#8E94A5',
    marginTop: 3,
  },

  // VIP PASS LIST (Full-Width Cards)
  vipPassList: {
    gap: 14,
  },
  vipPassCard: {
    backgroundColor: '#181922',
    borderWidth: 1.5,
    borderColor: '#262934',
    borderRadius: 20,
    padding: 16,
  },
  vipPassCardMonthly: {
    borderColor: '#FFB703',
    backgroundColor: '#1C191E',
  },
  vipPassCardWingman: {
    borderColor: '#E94057',
    backgroundColor: '#1E1720',
  },
  vipPassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vipPassTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  vipPassSubtitle: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 3,
  },
  vipPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  vipPriceText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  vipPassTag: {
    backgroundColor: 'rgba(233, 64, 87, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  vipPassTagGold: {
    backgroundColor: 'rgba(255, 183, 3, 0.2)',
  },
  vipPassTagText: {
    color: '#E94057',
    fontSize: 9,
    fontWeight: '800',
  },
  vipPassTagTextGold: {
    color: '#FFB703',
  },
  vipPerksList: {
    gap: 6,
    marginVertical: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  vipPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipPerkCheck: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '900',
  },
  vipPerkItem: {
    color: '#CACDD8',
    fontSize: 12,
    flex: 1,
  },
  vipBuyBtn: {
    backgroundColor: '#242734',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  vipBuyBtnMonthly: {
    backgroundColor: '#E94057',
  },
  vipBuyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // SACHET 2-COLUMN GRID
  sachetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  sachetCard: {
    width: '48.5%',
    backgroundColor: '#181920',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262934',
    justifyContent: 'space-between',
  },
  sachetCardTop: {
    flex: 1,
  },
  sachetTagRow: {
    minHeight: 22,
    marginBottom: 6,
    justifyContent: 'center',
  },
  sachetTag: {
    backgroundColor: 'rgba(242, 113, 33, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sachetTagDms: {
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
  },
  sachetTagSparks: {
    backgroundColor: 'rgba(255, 183, 3, 0.2)',
  },
  sachetTagText: {
    color: '#F27121',
    fontSize: 9,
    fontWeight: '800',
  },
  sachetTagTextDms: {
    color: '#00B4D8',
    fontSize: 9,
    fontWeight: '800',
  },
  sachetTagTextSparks: {
    color: '#FFB703',
    fontSize: 9,
    fontWeight: '800',
  },
  sachetPrice: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  sachetTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    minHeight: 34,
  },
  sachetDeliverableBox: {
    marginTop: 6,
    minHeight: 38,
  },
  sachetDeliverableHighlight: {
    color: '#9EABC0',
    fontSize: 11,
    lineHeight: 15,
  },
  buySachetBtn: {
    backgroundColor: '#242734',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 10,
  },
  buySachetBtnText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  modalContent: {
    backgroundColor: '#1E2028',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#363946',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeModalText: {
    color: '#8E94A5',
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  orderSummaryBox: {
    backgroundColor: '#242734',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryPrice: {
    color: '#F27121',
    fontSize: 18,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 4,
  },

  // MODAL DELIVERABLES CARD
  modalDeliverablesCard: {
    backgroundColor: '#161822',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalDeliverablesHeader: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  modalRowLabel: {
    color: '#A0A4B4',
    fontSize: 12,
    fontWeight: '600',
  },
  modalRowValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  confirmPayBtn: {
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 4,
  },
  confirmPayBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  disclaimerText: {
    color: '#656A7B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
  },
  processingBox: {
    alignItems: 'center',
    padding: 30,
  },
  processingText: {
    color: '#ffffff',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  processingSubText: {
    color: '#8E94A5',
    marginTop: 6,
    fontSize: 11,
    textAlign: 'center',
  },
  paymentMethodLabel: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  methodChoiceList: {
    gap: 8,
    marginBottom: 14,
  },
  methodChoiceCard: {
    backgroundColor: '#161822',
    borderWidth: 1.5,
    borderColor: '#262A38',
    borderRadius: 14,
    padding: 12,
  },
  methodChoiceCardActive: {
    borderColor: '#E94057',
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
  },
  methodChoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  methodRadio: {
    fontSize: 14,
  },
  methodChoiceTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  methodChoicePrice: {
    color: '#F27121',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
  methodChoiceDesc: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 22,
    lineHeight: 15,
  },
  ucbNoticeText: {
    color: '#8E94A5',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
});
