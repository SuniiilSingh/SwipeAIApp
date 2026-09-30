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

  const weekendPass = catalog.find((c) => c.sku === 'WEEKEND_PASS_79' || c.sku === 'WEEKEND_PASS_99');
  const sachetItems = catalog.filter((c) => c.sku !== 'WEEKEND_PASS_79' && c.sku !== 'WEEKEND_PASS_99');

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
          <Text style={styles.title}>VibeStore & Micro-Sachets</Text>
          <Text style={styles.subtitle}>Unlock boosts, sparks, and passes instantly</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E94057" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* HERO CARD: Weekend Dating Pass */}
            {weekendPass && (
              <View style={styles.heroPassCard}>
                <View style={styles.heroTopTag}>
                  <Text style={styles.heroTagText}>🔥 MOST POPULAR IN BENGALURU & DELHI</Text>
                </View>
                <Text style={styles.heroTitle}>{weekendPass.title}</Text>
                <View style={styles.heroPriceRow}>
                  <Text style={styles.heroPrice}>₹{weekendPass.priceInr}</Text>
                  <Text style={styles.heroDuration}>/ pass</Text>
                </View>
                <Text style={styles.heroSubtitle}>{weekendPass.subtitle}</Text>

                <View style={styles.heroPerksList}>
                  {weekendPass.perks.map((p, idx) => (
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
                    Get Weekend Pass • ₹{weekendPass.priceInr}
                  </Text>
                  <Text style={styles.heroBuySubText}>
                    {availableRails.length > 1
                      ? 'Choose Google Play or Cashfree at checkout'
                      : activeRail.securityNotice}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sachet Micro-Packs Grid */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Micro-Sachet Packs</Text>
              <Text style={styles.sectionSubHeading}>
                Instant boosts, sparks, and profile micro-upgrades
              </Text>
            </View>

            <View style={styles.sachetGrid}>
              {sachetItems.map((item) => {
                return (
                  <TouchableOpacity
                    key={item.sku}
                    style={styles.sachetCard}
                    activeOpacity={0.8}
                    onPress={() => handleOpenCheckout(item)}>
                    <View style={styles.sachetCardTop}>
                      <View style={styles.sachetTagRow}>
                        {item.tag ? (
                          <View style={styles.sachetTag}>
                            <Text style={styles.sachetTagText}>{item.tag}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.sachetPrice}>₹{item.priceInr}</Text>
                      <Text style={styles.sachetTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.sachetSubtitle} numberOfLines={3}>
                        {item.subtitle}
                      </Text>
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
                <Text style={styles.modalHeading}>Checkout & Benefits</Text>
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

              {/* PAYMENT METHOD CHOOSER (Only shown when multiple billing options are available) */}
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
                  <View style={styles.perksReviewBox}>
                    <Text style={styles.perksReviewHeading}>Included with this perk:</Text>
                    {checkoutItem?.perks.map((perk, idx) => (
                      <View key={idx} style={styles.perkReviewRow}>
                        <Text style={styles.perkReviewDot}>•</Text>
                        <Text style={styles.perkReviewItem}>{perk}</Text>
                      </View>
                    ))}
                  </View>

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
  storeBadgeContainer: {
    backgroundColor: 'rgba(233, 64, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  storeBadge: {
    color: '#E94057',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  heroPassCard: {
    backgroundColor: '#1E1724',
    borderWidth: 2,
    borderColor: '#E94057',
    borderRadius: 22,
    padding: 18,
    marginVertical: 12,
    position: 'relative',
    overflow: 'hidden',
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
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 6,
  },
  heroPrice: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  heroDuration: {
    color: '#A0A4B4',
    fontSize: 14,
    marginLeft: 6,
  },
  heroSubtitle: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
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
  sectionHeader: {
    marginTop: 18,
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
  sachetTagText: {
    color: '#F27121',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
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
  sachetSubtitle: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
    minHeight: 44,
  },
  buySachetBtn: {
    backgroundColor: '#242734',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 12,
  },
  buySachetBtnText: {
    color: '#E94057',
    fontSize: 11,
    fontWeight: '800',
  },
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
    marginVertical: 12,
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
  securityBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#303444',
  },
  securityBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '700',
  },
  productIdText: {
    color: '#656A7B',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  perksReviewBox: {
    backgroundColor: '#161822',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  perksReviewHeading: {
    color: '#CACDD8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  perkReviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  perkReviewDot: {
    color: '#E94057',
    fontSize: 14,
    lineHeight: 16,
  },
  perkReviewItem: {
    color: '#8E94A5',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
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
