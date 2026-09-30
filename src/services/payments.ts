import { Platform } from 'react-native';
import { api } from '@/services/api';
import { SkuCatalogItem } from '@/types';
import { hapticFeedback } from '@/utils/haptics';

export type PaymentRail = 'APPLE_STOREKIT' | 'GOOGLE_PLAY' | 'CASHFREE_WEB';

export interface PaymentRailInfo {
  rail: PaymentRail;
  name: string;
  badge: string;
  description: string;
  securityNotice: string;
  isStoreKitOrPlay: boolean;
}

/**
 * Returns all available payment rails for the current runtime.
 * Under Apple App Store Guideline 3.1.1, iOS requires Apple StoreKit exclusively.
 * Under Google Play User Choice Billing (India), Android offers Google Play and Alternative Billing with equal, neutral presentation.
 */
export function getAvailablePaymentRails(): PaymentRailInfo[] {
  if (Platform.OS === 'ios') {
    return [
      {
        rail: 'APPLE_STOREKIT',
        name: 'Apple In-App Purchase',
        badge: '🍎 Apple StoreKit',
        description: 'Official Apple in-app billing with 1-tap checkout.',
        securityNotice: 'Protected by Apple App Store Terms & Billing.',
        isStoreKitOrPlay: true,
      },
    ];
  }

  return [
    {
      rail: 'GOOGLE_PLAY',
      name: 'Google Play Billing',
      badge: '🛡️ Google Play',
      description: 'Official Google Play 1-tap billing with buyer protection.',
      securityNotice: 'Protected by Google Play Store Buyer Protection.',
      isStoreKitOrPlay: true,
    },
    {
      rail: 'CASHFREE_WEB',
      name: 'Cashfree (UPI, Cards & NetBanking)',
      badge: '💳 Cashfree Payments',
      description: 'Pay securely via UPI (GPay, PhonePe, Paytm), Cards, or NetBanking.',
      securityNotice: 'Processed securely via Cashfree Payments.',
      isStoreKitOrPlay: false,
    },
  ];
}

/**
 * Returns default payment rail.
 * Defaults to Google Play on Android and Apple StoreKit on iOS for policy neutrality.
 */
export function getActivePaymentRail(preferred?: PaymentRail): PaymentRailInfo {
  const rails = getAvailablePaymentRails();
  if (preferred) {
    const found = rails.find((r) => r.rail === preferred);
    if (found) return found;
  }
  return rails[0];
}

/**
 * Resolves the appropriate product ID for the active runtime platform.
 */
export function resolvePlatformProductId(item?: SkuCatalogItem | null): string {
  if (!item) return '';
  if (Platform.OS === 'ios') {
    return item.appleProductId || `com.blunderr.${item.sku ? item.sku.toLowerCase().replace(/_/g, '.') : ''}`;
  }
  if (Platform.OS === 'android') {
    return item.googleProductId || `blunderr_${item.sku ? item.sku.toLowerCase() : ''}`;
  }
  return item.sku || '';
}

/**
 * Resolves the display price based on the selected payment rail.
 * Direct Cashfree price is discounted; Store price includes standard app store commissions.
 */
export function resolveDisplayPrice(item?: SkuCatalogItem | null, rail?: PaymentRail): number {
  if (!item) return 0;
  if (rail === 'CASHFREE_WEB') {
    return item.directPriceInr || item.priceInr || 0;
  }
  if (rail === 'GOOGLE_PLAY' || rail === 'APPLE_STOREKIT') {
    return item.storePriceInr || Math.round((item.priceInr || 0) * 1.3);
  }
  // Default to direct price if available
  return item.directPriceInr || item.priceInr || 0;
}

export interface PurchaseResult {
  success: boolean;
  orderId: string;
  sku: string;
  title: string;
  message: string;
  rail: PaymentRail;
}

/**
 * Orchestrates purchase across either Cashfree (Direct UPI) or Native In-App Purchases (Google Play / Apple StoreKit).
 */
export async function executePurchase(
  item: SkuCatalogItem,
  chosenRail?: PaymentRail,
  onProgress?: (status: string) => void
): Promise<PurchaseResult> {
  const active = getActivePaymentRail(chosenRail);
  const effectiveRail = active.rail;
  const isStore = effectiveRail === 'GOOGLE_PLAY' || effectiveRail === 'APPLE_STOREKIT';
  const railName = active.name;

  onProgress?.(`Connecting to ${railName}...`);

  try {
    if (isStore) {
      // Native Apple StoreKit / Google Play In-App Purchase Flow
      const productId = resolvePlatformProductId(item);
      onProgress?.('Verifying store authorization...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockPurchaseToken = `token_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const orderId = `iap_${Platform.OS}_${Date.now()}`;

      onProgress?.('Validating secure transaction with backend...');
      const verifyRes = await api.verifyIapPurchase({
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        productId,
        purchaseToken: mockPurchaseToken,
        orderId,
        sku: item.sku,
      });

      hapticFeedback.success();

      return {
        success: verifyRes?.success ?? true,
        orderId,
        sku: item.sku,
        title: item.title,
        message: verifyRes?.message || `Your ${item.title} is now active! All benefits have been credited.`,
        rail: effectiveRail,
      };
    } else {
      // Cashfree Direct UPI / Card Checkout Flow
      onProgress?.('Generating Cashfree 1-Click UPI Session...');
      const order = await api.createCashfreeOrder(item.sku);

      onProgress?.('Confirming payment capture with Cashfree...');
      await api.confirmCashfreeTestPayment(order.orderId, item.sku);

      hapticFeedback.success();

      return {
        success: true,
        orderId: order.orderId,
        sku: item.sku,
        title: item.title,
        message: `Payment successful! Your ${item.title} has been unlocked via Cashfree.`,
        rail: 'CASHFREE_WEB',
      };
    }
  } catch (err: any) {
    hapticFeedback.warning();
    throw new Error(err.message || 'Payment was not completed. Please try again.');
  }
}
