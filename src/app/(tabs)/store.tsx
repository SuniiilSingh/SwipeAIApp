import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { SkuCatalogItem } from '@/types';

export default function StoreScreen() {
  const [catalog, setCatalog] = useState<SkuCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutItem, setCheckoutItem] = useState<SkuCatalogItem | null>(null);
  const [upiOrderData, setUpiOrderData] = useState<any | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    const items = await api.getCatalog();
    setCatalog(items);
    setLoading(false);
  };

  const handleOpenCheckout = async (item: SkuCatalogItem) => {
    setCheckoutItem(item);
    setProcessingPayment(true);
    const order = await api.createUpiOrder(item.sku);
    setUpiOrderData(order);
    setProcessingPayment(false);
  };

  const handleSimulateUpiAppPayment = async (appName: string) => {
    if (!upiOrderData) return;
    setProcessingPayment(true);
    setTimeout(async () => {
      await api.confirmUpiPayment(upiOrderData.orderId);
      setProcessingPayment(false);
      const skuTitle = checkoutItem?.title || 'Pass';
      setCheckoutItem(null);
      setUpiOrderData(null);
      Alert.alert(
        '🎉 Payment Successful via ' + appName,
        `Your ${skuTitle} is now active! All benefits have been credited to your account.`
      );
    }, 1500);
  };

  const weekendPass = catalog.find((c) => c.sku === 'WEEKEND_PASS_99');
  const sachetItems = catalog.filter((c) => c.sku !== 'WEEKEND_PASS_99');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.storeBadge}>✦ VIBESTORE (UPI NATIVE)</Text>
          <Text style={styles.title}>The Indian Sachet Store</Text>
          <Text style={styles.subtitle}>Micro-pricing (₹19 - ₹99). Zero recurring credit card locks.</Text>
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
                  <Text style={styles.heroDuration}>/ weekend pass</Text>
                </View>
                <Text style={styles.heroSubtitle}>{weekendPass.subtitle}</Text>

                <View style={styles.heroPerksList}>
                  {weekendPass.perks.map((p, idx) => (
                    <Text key={idx} style={styles.heroPerkItem}>✓ {p}</Text>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.heroUpiBtn}
                  onPress={() => handleOpenCheckout(weekendPass)}>
                  <Text style={styles.heroUpiBtnText}>⚡ Activate via UPI (₹99)</Text>
                  <Text style={styles.heroUpiSubText}>GPay • PhonePe • Paytm • BHIM</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sachet Micro-Packs Grid */}
            <Text style={styles.sectionHeading}>Micro-Sachet Packs (No Subscription)</Text>
            <View style={styles.sachetGrid}>
              {sachetItems.map((item) => (
                <TouchableOpacity
                  key={item.sku}
                  style={styles.sachetCard}
                  onPress={() => handleOpenCheckout(item)}>
                  {item.tag && (
                    <View style={styles.sachetTag}>
                      <Text style={styles.sachetTagText}>{item.tag}</Text>
                    </View>
                  )}
                  <Text style={styles.sachetPrice}>₹{item.priceInr}</Text>
                  <Text style={styles.sachetTitle}>{item.title}</Text>
                  <Text style={styles.sachetSubtitle}>{item.subtitle}</Text>

                  <View style={styles.buySachetBtn}>
                    <Text style={styles.buySachetBtnText}>Get for ₹{item.priceInr} →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* 1-CLICK UPI CHECKOUT MODAL */}
        <Modal visible={!!checkoutItem} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>1-Click UPI Payment</Text>
                <TouchableOpacity onPress={() => setCheckoutItem(null)}>
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              {checkoutItem && (
                <View style={styles.orderSummaryBox}>
                  <Text style={styles.summaryTitle}>{checkoutItem.title}</Text>
                  <Text style={styles.summaryPrice}>Total: ₹{checkoutItem.priceInr}</Text>
                </View>
              )}

              {processingPayment ? (
                <View style={styles.processingBox}>
                  <ActivityIndicator size="large" color="#E94057" />
                  <Text style={styles.processingText}>Processing instant UPI payment...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.chooseUpiAppText}>Choose your UPI App:</Text>

                  <View style={styles.upiAppList}>
                    {[
                      { name: 'Google Pay', icon: '🟢', key: 'gpay' },
                      { name: 'PhonePe', icon: '🟣', key: 'phonepe' },
                      { name: 'Paytm UPI', icon: '🔵', key: 'paytm' },
                      { name: 'BHIM UPI', icon: '🟠', key: 'bhim' },
                    ].map((app) => (
                      <TouchableOpacity
                        key={app.key}
                        style={styles.upiAppBtn}
                        onPress={() => handleSimulateUpiAppPayment(app.name)}>
                        <Text style={styles.upiAppIcon}>{app.icon}</Text>
                        <Text style={styles.upiAppName}>{app.name}</Text>
                        <Text style={styles.upiAppAction}>Pay Now →</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {upiOrderData?.qrCodeUrl && (
                    <View style={styles.qrSection}>
                      <Text style={styles.qrTitle}>Or scan NPCI QR code:</Text>
                      <Image source={{ uri: upiOrderData.qrCodeUrl }} style={styles.qrImage} />
                    </View>
                  )}
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
  storeBadge: {
    color: '#F27121',
    fontSize: 11,
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
    gap: 4,
    marginVertical: 8,
  },
  heroPerkItem: {
    color: '#D8DBE5',
    fontSize: 12,
  },
  heroUpiBtn: {
    backgroundColor: '#E94057',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  heroUpiBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  heroUpiSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginVertical: 14,
  },
  sachetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sachetCard: {
    width: '48%',
    backgroundColor: '#181920',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262934',
  },
  sachetTag: {
    backgroundColor: 'rgba(242, 113, 33, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  sachetTagText: {
    color: '#F27121',
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
  },
  sachetSubtitle: {
    color: '#8E94A5',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
    minHeight: 28,
  },
  buySachetBtn: {
    backgroundColor: '#242734',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
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
  summaryTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  summaryPrice: {
    color: '#F27121',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  chooseUpiAppText: {
    color: '#CACDD8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  upiAppList: {
    gap: 8,
  },
  upiAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242734',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#343847',
  },
  upiAppIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  upiAppName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  upiAppAction: {
    color: '#E94057',
    fontSize: 12,
    fontWeight: '800',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C303E',
  },
  qrTitle: {
    color: '#8E94A5',
    fontSize: 11,
    marginBottom: 8,
  },
  qrImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  processingBox: {
    alignItems: 'center',
    padding: 30,
  },
  processingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});
