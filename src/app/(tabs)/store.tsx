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
  messages: string;       // e.g. "10 Direct DMs (Pre-Match)"
  chatAfterMatch: string; // e.g. "Unlimited Always (Free)"
  likes: string;          // e.g. "Unlimited (30 Days)"
  superLikes: string;     // e.g. "15 Super Sparks"
  boosts?: string;        // e.g. "4 Friday Peak Boosts"
  validity: string;       // e.g. "30 Days Full Access"
  extra?: string;         // e.g. "DigiLocker Trust Badge"
}

export function getBenefitBreakdown(sku?: string): BenefitBreakdown {
  if (!sku) {
    return {
      messages: 'Standard Matching',
      chatAfterMatch: 'Unlimited Always (100% Free)',
      likes: 'Standard Swipes',
      superLikes: 'None',
      validity: 'Active Immediately',
    };
  }
  switch (sku) {
    case 'MONTHLY_PASS_349':
      return {
        likes: 'Unlimited Swipes (30 Days)',
        messages: '10 Direct DMs (Pre-Match)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '15 Super Sparks',
        boosts: '4 Friday Night Boosts',
        validity: '30 Days Full Access',
        extra: 'DigiLocker Trust Badge',
      };
    case 'WEEKEND_PASS_79':
    case 'WEEKEND_PASS_99':
      return {
        likes: 'Unlimited Swipes (3 Days)',
        messages: 'Matching Required (0 Pre-Match DMs)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '3 Super Sparks Included',
        boosts: 'Priority Pool Visibility',
        validity: '3 Days (Fri 6 PM - Mon 6 AM)',
        extra: 'See Who Liked You',
      };
    case 'WINGMAN_BUNDLE_199':
      return {
        likes: 'Unlimited Swipes (7 Days)',
        messages: '2 Direct DMs (Pre-Match)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '5 Super Sparks',
        boosts: '1 Friday Night Boost',
        validity: '7 Days VIP Access',
        extra: 'All-In-One Weekend Kit',
      };
    case 'WEEKLY_PASS_149':
      return {
        likes: 'Unlimited Swipes (7 Days)',
        messages: '3 Direct DMs (Pre-Match)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '5 Super Sparks',
        boosts: '1 Profile Boost',
        validity: '7 Days Full Access',
      };
    case 'FORTNIGHT_PASS_199':
      return {
        likes: 'Unlimited Swipes (14 Days)',
        messages: '5 Direct DMs (Pre-Match)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '6 Super Sparks',
        boosts: '2 Profile Boosts',
        validity: '14 Days Full Access',
      };
    case 'SELECT_QUARTERLY_899':
    case 'SELECT_QUARTERLY_999':
      return {
        likes: 'Unlimited Swipes (90 Days)',
        messages: '25 Direct DMs (Pre-Match)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '25 Super Sparks',
        boosts: 'Concierge Curation',
        validity: '90 Days Full Access',
        extra: 'Exclusive Offline Mixers',
      };
    case 'DIRECT_DMS_3X_89':
    case 'DIRECT_DMS_3X_49':
      return {
        messages: '3 Direct DMs (Pre-Match)',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        likes: 'Standard Daily Swipes',
        superLikes: 'None',
        validity: 'No Expiry (Valid until used)',
        extra: 'Skip swiping and message direct',
      };
    case 'SPARKS_PACK_5_79':
      return {
        superLikes: '5 Super Sparks',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        likes: 'Standard Daily Swipes',
        messages: 'Standard Matching',
        validity: 'No Expiry (Valid until used)',
        extra: 'Top of feed visibility (5x)',
      };
    case 'SUPER_SPARK_19':
      return {
        superLikes: '1 Super Spark',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        likes: 'Standard Daily Swipes',
        messages: 'Standard Matching',
        validity: 'No Expiry (Valid until used)',
        extra: '3x higher reply rate',
      };
    case 'BOOST_1X_FRIDAY_39':
    case 'BOOST_1X_FRIDAY_29':
      return {
        boosts: '1 Friday Peak Boost',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        likes: 'Standard Daily Swipes',
        messages: 'Standard Matching',
        superLikes: 'None',
        validity: '90 Days to Activate',
        extra: '10x profile views (1 hr)',
      };
    case 'CUTTING_CHAI_21':
      return {
        messages: '1 Chai Micro-Invite',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: '1 Chai Highlight',
        likes: 'Standard Daily Swipes',
        validity: '30 Days to Redeem',
        extra: '15% Partner Cafe Coupon',
      };
    case 'REVIVE_MATCH_19':
      return {
        messages: 'Restores Chat for 48h',
        chatAfterMatch: 'Unlimited in 48h window',
        likes: 'Standard Daily Swipes',
        superLikes: 'None',
        validity: '48 Hours Active Window',
        extra: 'Unfreezes 1 expired match',
      };
    default:
      return {
        likes: 'Standard Daily Swipes',
        messages: 'Standard Matching',
        chatAfterMatch: 'Unlimited Always (100% Free)',
        superLikes: 'Included with perk',
        validity: 'Active Immediately',
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
                  <Text style={styles.heroDuration}>/ 3-day access (Fri - Sun)</Text>
                </View>

                <Text style={styles.heroTitle}>{weekendPass.title}</Text>
                <Text style={styles.heroSubtitle}>{weekendPass.subtitle}</Text>

                {/* EXACT DELIVERABLE STAT PILLS */}
                <View style={styles.statsPillRow}>
                  <View style={[styles.statPill, styles.statPillHighlight]}>
                    <Text style={styles.statPillText}>❤️ Unlimited Likes (3d)</Text>
                  </View>
                  <View style={[styles.statPill, styles.statPillSparks]}>
                    <Text style={[styles.statPillText, styles.statPillTextSparks]}>⭐ 3 Super Sparks</Text>
                  </View>
                  <View style={[styles.statPill, styles.statPillChat]}>
                    <Text style={[styles.statPillText, styles.statPillTextChat]}>💌 Unlimited Chat</Text>
                  </View>
                  <View style={[styles.statPill, styles.statPillValidity]}>
                    <Text style={[styles.statPillText, styles.statPillTextValidity]}>⏳ 3-Day Validity</Text>
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

                    {/* KEY DELIVERABLES BADGES (Messages, Likes, Sparks, Boosts, Chat, Validity) */}
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
                      <View style={[styles.statPill, styles.statPillChat]}>
                        <Text style={[styles.statPillText, styles.statPillTextChat]}>
                          💌 Unlimited Chat
                        </Text>
                      </View>
                      <View style={[styles.statPill, styles.statPillValidity]}>
                        <Text style={[styles.statPillText, styles.statPillTextValidity]}>
                          ⏳ {benefits.validity}
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
                            💬 3 Direct DMs (Pre-Match) • 💌 Unlimited Chat Post-Match • ⏳ {benefits.validity}
                          </Text>
                        ) : isSparks ? (
                          <Text style={styles.sachetDeliverableHighlight}>
                            ⭐ Highlights profile at top of feed • ⏳ {benefits.validity}
                          </Text>
                        ) : (
                          <Text style={styles.sachetDeliverableHighlight}>
                            {item.subtitle} • ⏳ {benefits.validity}
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

        {/* FULL-SCREEN IMMERSIVE CHECKOUT & DETAIL SCREEN */}
        <Modal
          visible={!!checkoutItem}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            if (!processingPayment) setCheckoutItem(null);
          }}>
          <SafeAreaView style={styles.fullScreenContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity
                style={styles.fullScreenBackBtn}
                activeOpacity={0.8}
                onPress={() => setCheckoutItem(null)}
                disabled={processingPayment}>
                <Text style={styles.fullScreenBackText}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.fullScreenHeaderTitle}>Plan Details & Deliverables</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.fullScreenScrollContent}
              showsVerticalScrollIndicator={false}>
              {checkoutItem && (
                <>
                  {/* Hero Presentation */}
                  <View style={styles.fullScreenHeroCard}>
                    <View style={styles.heroTopRow}>
                      {checkoutItem.tag ? (
                        <View style={styles.fullScreenTag}>
                          <Text style={styles.fullScreenTagText}>{checkoutItem.tag}</Text>
                        </View>
                      ) : <View />}
                      <View style={styles.heroValidityBadge}>
                        <Text style={styles.heroValidityBadgeText}>⏳ {checkoutBenefits.validity}</Text>
                      </View>
                    </View>

                    <Text style={styles.fullScreenTitle}>{checkoutItem.title}</Text>
                    <Text style={styles.fullScreenSubtitle}>{checkoutItem.subtitle}</Text>

                    {/* Unlimited Chat Highlight Box */}
                    <View style={styles.heroHighlightBanner}>
                      <Text style={styles.heroHighlightText}>
                        💌 <Text style={styles.heroHighlightBold}>Unlimited Chat Messages</Text> after matching with any profile is 100% free & included!
                      </Text>
                    </View>

                    <View style={styles.fullScreenPriceRow}>
                      <Text style={styles.fullScreenPrice}>
                        ₹{resolveDisplayPrice(checkoutItem, selectedRail)}
                      </Text>
                      <Text style={styles.fullScreenPriceSub}>
                        {selectedRail === 'CASHFREE_WEB' ? '• Direct UPI Price' : '• Store Price'}
                      </Text>
                    </View>
                  </View>

                  {/* 6 Metric Counter Cards (Messages, Chat After Match, Likes, Super Sparks, Boosts, Validity) */}
                  <View style={styles.fullScreenSectionHeader}>
                    <Text style={styles.fullScreenSectionTitle}>📦 What You Get in This Pack</Text>
                    <Text style={styles.fullScreenSectionSubtitle}>
                      Exact allowances, messaging rules, and package validity
                    </Text>
                  </View>

                  <View style={styles.metricGrid}>
                    {/* 1. Direct Messages Before Matching */}
                    <View style={[styles.metricCard, styles.metricCardMessages]}>
                      <Text style={styles.metricIcon}>💬</Text>
                      <Text style={styles.metricLabel}>Direct DMs (Pre-Match)</Text>
                      <Text style={styles.metricValue}>{checkoutBenefits.messages}</Text>
                      <Text style={styles.metricHint}>Skip swiping & reach inbox directly</Text>
                    </View>

                    {/* 2. Messages After Match (UNLIMITED!) */}
                    <View style={[styles.metricCard, styles.metricCardChat]}>
                      <Text style={styles.metricIcon}>💌</Text>
                      <Text style={styles.metricLabel}>Chat After Match</Text>
                      <Text style={[styles.metricValue, styles.metricValueChat]}>
                        {checkoutBenefits.chatAfterMatch}
                      </Text>
                      <Text style={styles.metricHint}>100% free unlimited messages once matched</Text>
                    </View>

                    {/* 3. Likes & Swipes */}
                    <View style={[styles.metricCard, styles.metricCardLikes]}>
                      <Text style={styles.metricIcon}>❤️</Text>
                      <Text style={styles.metricLabel}>Likes & Swipes</Text>
                      <Text style={styles.metricValue}>{checkoutBenefits.likes}</Text>
                      <Text style={styles.metricHint}>Swipe candidates without daily timeouts</Text>
                    </View>

                    {/* 4. Super Likes / Sparks */}
                    <View style={[styles.metricCard, styles.metricCardSparks]}>
                      <Text style={styles.metricIcon}>⭐</Text>
                      <Text style={styles.metricLabel}>Super Likes / Sparks</Text>
                      <Text style={styles.metricValue}>{checkoutBenefits.superLikes}</Text>
                      <Text style={styles.metricHint}>Pins profile to top of candidate feed</Text>
                    </View>

                    {/* 5. Visibility Boosts */}
                    <View style={[styles.metricCard, styles.metricCardBoosts]}>
                      <Text style={styles.metricIcon}>🚀</Text>
                      <Text style={styles.metricLabel}>Visibility Boosts</Text>
                      <Text style={styles.metricValue}>
                        {checkoutBenefits.boosts || 'Standard pool'}
                      </Text>
                      <Text style={styles.metricHint}>10x profile views during 9 PM - 1 AM peak</Text>
                    </View>

                    {/* 6. Plan Validity */}
                    <View style={[styles.metricCard, styles.metricCardValidity]}>
                      <Text style={styles.metricIcon}>⏳</Text>
                      <Text style={styles.metricLabel}>Plan Validity</Text>
                      <Text style={[styles.metricValue, styles.metricValueValidity]}>
                        {checkoutBenefits.validity}
                      </Text>
                      <Text style={styles.metricHint}>Active duration for all pack privileges</Text>
                    </View>
                  </View>

                  {/* Full Included Perks Checklist */}
                  <View style={styles.fullPerksCard}>
                    <Text style={styles.fullPerksTitle}>✨ All Included Features & Privileges</Text>

                    {/* 1. Explicit Unlimited Messages After Match */}
                    <View style={styles.fullPerkItemRow}>
                      <View style={styles.checkCircleHighlight}>
                        <Text style={styles.checkMarkTextHighlight}>✓</Text>
                      </View>
                      <Text style={styles.fullPerkItemHighlight}>
                        Unlimited Messages & Chat once matched (Always 100% Free)
                      </Text>
                    </View>

                    {/* 2. Explicit Validity */}
                    <View style={styles.fullPerkItemRow}>
                      <View style={styles.checkCircleHighlight}>
                        <Text style={styles.checkMarkTextHighlight}>✓</Text>
                      </View>
                      <Text style={styles.fullPerkItemHighlight}>
                        Package Validity: {checkoutBenefits.validity}
                      </Text>
                    </View>

                    {checkoutItem.perks?.map((perk, idx) => (
                      <View key={idx} style={styles.fullPerkItemRow}>
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkMarkText}>✓</Text>
                        </View>
                        <Text style={styles.fullPerkItemText}>{perk}</Text>
                      </View>
                    ))}
                    {checkoutBenefits.extra && (
                      <View style={styles.fullPerkItemRow}>
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkMarkText}>✓</Text>
                        </View>
                        <Text style={styles.fullPerkItemText}>{checkoutBenefits.extra}</Text>
                      </View>
                    )}
                  </View>

                  {/* Trust & Guarantee Badges */}
                  <View style={styles.trustBadgesRow}>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeIcon}>🛡️</Text>
                      <Text style={styles.trustBadgeTitle}>Safe & Verified</Text>
                      <Text style={styles.trustBadgeDesc}>DigiLocker Profiles</Text>
                    </View>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeIcon}>⚡</Text>
                      <Text style={styles.trustBadgeTitle}>Instant Credit</Text>
                      <Text style={styles.trustBadgeDesc}>Active right after pay</Text>
                    </View>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeIcon}>🔒</Text>
                      <Text style={styles.trustBadgeTitle}>Bank Grade</Text>
                      <Text style={styles.trustBadgeDesc}>AES-256 Encrypted</Text>
                    </View>
                  </View>

                  {/* Payment Method Selector */}
                  {availableRails.length > 1 && (
                    <View style={styles.methodSelectSection}>
                      <Text style={styles.fullScreenSectionTitle}>💳 Select Billing Option</Text>
                      <View style={styles.methodChoiceList}>
                        {availableRails.map((railInfo) => {
                          const isSelected = selectedRail === railInfo.rail;
                          const price = resolveDisplayPrice(checkoutItem, railInfo.rail);
                          return (
                            <TouchableOpacity
                              key={railInfo.rail}
                              style={[
                                styles.fullMethodCard,
                                isSelected && styles.fullMethodCardActive,
                              ]}
                              activeOpacity={0.85}
                              onPress={() => {
                                hapticFeedback.selection();
                                setSelectedRail(railInfo.rail);
                              }}>
                              <View style={styles.fullMethodHeader}>
                                <View style={styles.fullMethodTitleRow}>
                                  <Text style={styles.methodRadio}>{isSelected ? '🔘' : '⚪'}</Text>
                                  <Text style={styles.fullMethodTitle}>{railInfo.name}</Text>
                                </View>
                                <Text style={styles.fullMethodPrice}>₹{price}</Text>
                              </View>
                              <Text style={styles.fullMethodDesc}>{railInfo.description}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {availableRails.length > 1 && (
                    <Text style={styles.ucbNoticeText}>
                      Google Play terms and buyer protections apply to purchases completed through Google Play.
                    </Text>
                  )}

                  <View style={{ height: 110 }} />
                </>
              )}
            </ScrollView>

            {/* Fixed Bottom Action Bar */}
            {checkoutItem && (
              <View style={styles.fixedBottomBar}>
                {processingPayment ? (
                  <View style={styles.processingBarBox}>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.processingBarText}>
                      {processingStatus || 'Verifying transaction with gateway...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.fixedPayBtn}
                      activeOpacity={0.85}
                      onPress={handleConfirmPurchase}>
                      <Text style={styles.fixedPayBtnText}>
                        {selectedRail === 'CASHFREE_WEB'
                          ? `Pay ₹${resolveDisplayPrice(checkoutItem, 'CASHFREE_WEB')} via Direct UPI →`
                          : Platform.OS === 'ios'
                          ? `Pay ₹${resolveDisplayPrice(checkoutItem, 'APPLE_STOREKIT')} with Apple →`
                          : `Pay ₹${resolveDisplayPrice(checkoutItem, 'GOOGLE_PLAY')} with Google Play →`}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.fixedSecurityNotice}>
                      🔒 256-bit bank encrypted • Benefits restore automatically
                    </Text>
                  </>
                )}
              </View>
            )}
          </SafeAreaView>
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
  statPillChat: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: 'rgba(0, 230, 118, 0.35)',
  },
  statPillValidity: {
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    borderColor: 'rgba(255, 183, 3, 0.35)',
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
  statPillTextChat: {
    color: '#00E676',
  },
  statPillTextValidity: {
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

  // FULL-SCREEN MODAL STYLES
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#0E0F13',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  fullScreenBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  fullScreenBackText: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '700',
  },
  fullScreenHeaderTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  fullScreenScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  fullScreenHeroCard: {
    backgroundColor: '#181A24',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#2B2F40',
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroValidityBadge: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.35)',
  },
  heroValidityBadgeText: {
    color: '#FFB703',
    fontSize: 11,
    fontWeight: '800',
  },
  heroHighlightBanner: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  heroHighlightText: {
    color: '#D8DBE5',
    fontSize: 12,
    lineHeight: 16,
  },
  heroHighlightBold: {
    color: '#00E676',
    fontWeight: '800',
  },
  fullScreenTag: {
    backgroundColor: 'rgba(233, 64, 87, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  fullScreenTagText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fullScreenTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fullScreenSubtitle: {
    color: '#9EABC0',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  fullScreenPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  fullScreenPrice: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  fullScreenPriceSub: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  // 6 METRIC COUNTERS
  fullScreenSectionHeader: {
    marginBottom: 12,
  },
  fullScreenSectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  fullScreenSectionSubtitle: {
    color: '#8E94A5',
    fontSize: 12,
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#161822',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#262A38',
  },
  metricCardMessages: {
    borderColor: 'rgba(0, 180, 216, 0.35)',
    backgroundColor: '#121C26',
  },
  metricCardChat: {
    borderColor: 'rgba(0, 230, 118, 0.4)',
    backgroundColor: '#0F2018',
  },
  metricValueChat: {
    color: '#00E676',
  },
  metricCardLikes: {
    borderColor: 'rgba(233, 64, 87, 0.35)',
    backgroundColor: '#20151C',
  },
  metricCardSparks: {
    borderColor: 'rgba(255, 183, 3, 0.35)',
    backgroundColor: '#221D13',
  },
  metricCardBoosts: {
    borderColor: 'rgba(157, 78, 221, 0.35)',
    backgroundColor: '#1B1424',
  },
  metricCardValidity: {
    borderColor: 'rgba(255, 183, 3, 0.4)',
    backgroundColor: '#201A12',
  },
  metricValueValidity: {
    color: '#FFB703',
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  metricLabel: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
    minHeight: 38,
  },
  metricHint: {
    color: '#656A7B',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },

  // PERKS LIST
  fullPerksCard: {
    backgroundColor: '#161822',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262A38',
    marginBottom: 16,
  },
  fullPerksTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  fullPerkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleHighlight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '900',
  },
  checkMarkTextHighlight: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '900',
  },
  fullPerkItemText: {
    color: '#E0E3EE',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  fullPerkItemHighlight: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // TRUST BADGES
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  trustBadge: {
    flex: 1,
    backgroundColor: '#161822',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trustBadgeIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  trustBadgeTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  trustBadgeDesc: {
    color: '#8E94A5',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },

  // PAYMENT METHODS
  methodSelectSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  methodChoiceList: {
    gap: 10,
    marginTop: 10,
  },
  fullMethodCard: {
    backgroundColor: '#161822',
    borderWidth: 1.5,
    borderColor: '#262A38',
    borderRadius: 16,
    padding: 14,
  },
  fullMethodCardActive: {
    borderColor: '#E94057',
    backgroundColor: 'rgba(233, 64, 87, 0.08)',
  },
  fullMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullMethodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  methodRadio: {
    fontSize: 16,
  },
  fullMethodTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  fullMethodPrice: {
    color: '#F27121',
    fontSize: 17,
    fontWeight: '900',
  },
  fullMethodDesc: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 24,
    lineHeight: 16,
  },
  ucbNoticeText: {
    color: '#8E94A5',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },

  // STICKY BOTTOM BAR
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#14161F',
    borderTopWidth: 1,
    borderTopColor: '#262A38',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  fixedPayBtn: {
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E94057',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  fixedPayBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  fixedSecurityNotice: {
    color: '#656A7B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  processingBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242734',
    borderRadius: 14,
    paddingVertical: 14,
  },
  processingBarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
