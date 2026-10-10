import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  PurchasesOffering,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserSubscription } from '../context/AuthContext';

export type PlanTier = 'starter' | 'transform' | 'vip' | 'monthly' | 'annual';

export interface PlanConfig {
  id: PlanTier;
  productId: string;
  name: string;
  price: number; // in dollars
  priceCents: number;
  interval: 'month' | 'year';
  formattedPrice: string;
  badge?: string;
  savings?: string;
}

// Standard Apple App Store & Google Play In-App Purchase Product IDs
export const IAP_PRODUCT_IDS: Record<string, string> = {
  starter: 'pulse_starter_19',
  transform: 'pulse_transform_39',
  vip: 'pulse_vip_119',
  monthly: 'pulse_vip_119',
  annual: 'pulse_annual_1259',
};

export const ENTITLEMENT_IDS = {
  starter: 'starter',
  transform: 'transform',
  vip: 'vip',
  premium: 'premium',
};

export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    productId: IAP_PRODUCT_IDS.starter,
    name: 'Starter',
    price: 19.99,
    priceCents: 1999,
    interval: 'month',
    formattedPrice: '$19.99',
    badge: 'STARTER',
  },
  transform: {
    id: 'transform',
    productId: IAP_PRODUCT_IDS.transform,
    name: 'Transform',
    price: 39.99,
    priceCents: 3999,
    interval: 'month',
    formattedPrice: '$39.99',
    badge: 'MOST POPULAR',
  },
  vip: {
    id: 'vip',
    productId: IAP_PRODUCT_IDS.vip,
    name: 'VIP 1ON1',
    price: 119.99,
    priceCents: 11999,
    interval: 'month',
    formattedPrice: '$119.99',
    badge: 'ALL-INCLUSIVE',
  },
  // Legacy aliases
  monthly: {
    id: 'vip',
    productId: IAP_PRODUCT_IDS.monthly,
    name: 'VIP 1ON1',
    price: 119.99,
    priceCents: 11999,
    interval: 'month',
    formattedPrice: '$119.99',
    badge: 'ALL-INCLUSIVE',
  },
  annual: {
    id: 'vip',
    productId: IAP_PRODUCT_IDS.annual,
    name: 'VIP 1ON1 (Annual)',
    price: 1199.99,
    priceCents: 119999,
    interval: 'year',
    formattedPrice: '$1,199.99',
    savings: '$99.99/mo',
  },
};

export interface PlanFeatureRow {
  feature: string;
  starter: string | boolean;
  transform: string | boolean;
  vip: string | boolean;
}

export const PLAN_COMPARISON_FEATURES: PlanFeatureRow[] = [
  {
    feature: 'Personalized Fitness Profile',
    starter: true,
    transform: true,
    vip: true,
  },
  {
    feature: 'Goal Assessment',
    starter: true,
    transform: true,
    vip: true,
  },
  {
    feature: 'Workout Programs',
    starter: 'Basic',
    transform: 'Personalized',
    vip: 'Fully Personalized',
  },
  {
    feature: 'Weekly Workout Updates',
    starter: false,
    transform: true,
    vip: true,
  },
  {
    feature: 'Exercise Video Library',
    starter: true,
    transform: true,
    vip: true,
  },
  {
    feature: 'Nutrition Guidance',
    starter: 'Basic',
    transform: 'Personalized',
    vip: 'Fully Personalized',
  },
  {
    feature: 'Meal Plan',
    starter: false,
    transform: true,
    vip: true,
  },
  {
    feature: 'Calorie & Macros',
    starter: 'Basic',
    transform: 'Personalized',
    vip: 'Personalized + Adjustments',
  },
  {
    feature: 'Progress Tracking (Weight & Pics)',
    starter: 'Basic',
    transform: 'Advanced',
    vip: '+ Advanced',
  },
  {
    feature: 'Weekly Check-In',
    starter: false,
    transform: '1×/week',
    vip: '1×/week',
  },
  {
    feature: 'Form Check / Video Review',
    starter: false,
    transform: '1×/month',
    vip: 'Weekly',
  },
  {
    feature: 'Direct Trainer Messaging',
    starter: false,
    transform: 'Limited',
    vip: 'Priority + Direct',
  },
  {
    feature: 'Workout Adjustments',
    starter: false,
    transform: 'Monthly',
    vip: 'As needed',
  },
  {
    feature: 'Challenges & Community',
    starter: true,
    transform: true,
    vip: 'VIP Access',
  },
  {
    feature: 'Live Coaching Call',
    starter: false,
    transform: false,
    vip: '1×/monthly',
  },
];

let isInitialized = false;

/**
 * Configure and initialize RevenueCat for In-App Purchases
 */
export async function initializePurchases(userId?: string): Promise<boolean> {
  try {
    const apiKey =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn(
        '[PurchaseService] EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY is not configured. Running in sandbox/simulation mode.'
      );
      return false;
    }

    if (!isInitialized) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({
        apiKey,
        appUserID: userId || undefined,
      });
      isInitialized = true;
      console.log('[PurchaseService] RevenueCat initialized successfully.');
    } else if (userId) {
      await Purchases.logIn(userId);
    }

    return true;
  } catch (error) {
    console.error('[PurchaseService] Failed to initialize RevenueCat:', error);
    return false;
  }
}

/**
 * Fetch available offerings configured in App Store Connect / RevenueCat
 */
export async function getIAPOfferings(): Promise<PurchasesOffering | null> {
  try {
    if (!isInitialized) {
      const initialized = await initializePurchases();
      if (!initialized) return null;
    }
    const offerings = await Purchases.getOfferings();
    return offerings.current || null;
  } catch (error) {
    console.warn('[PurchaseService] Error fetching offerings:', error);
    return null;
  }
}

/**
 * Sync user subscription state with Firestore
 */
async function syncSubscriptionWithFirestore(
  userId: string,
  planId: PlanTier | string,
  customerInfo?: CustomerInfo
): Promise<void> {
  const normalizedPlan: PlanTier = (SUBSCRIPTION_PLANS[planId]?.id || 'vip') as PlanTier;
  const now = new Date();
  const nextPeriodEnd = new Date(now);
  if (normalizedPlan === 'annual') {
    nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
  } else {
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
  }

  const updatedSubscription: UserSubscription = {
    status: 'active',
    plan: normalizedPlan,
    trialStartedAt: now.toISOString(),
    trialEndsAt: now.toISOString(),
    currentPeriodEnd: customerInfo?.latestExpirationDate || nextPeriodEnd.toISOString(),
    iapProductId: IAP_PRODUCT_IDS[normalizedPlan] || IAP_PRODUCT_IDS.vip,
    iapOriginalTransactionId: customerInfo?.originalAppUserId || `iap_${Date.now()}`,
    revenueCatAppUserId: customerInfo?.originalAppUserId || userId,
    cancelAtPeriodEnd: false,
  };

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    subscription: updatedSubscription,
  });

  console.log('[PurchaseService] Subscription synced in Firestore:', updatedSubscription);
}

/**
 * Process In-App Purchase for selected plan tier
 */
export async function processInAppPurchase(
  planId: PlanTier | string,
  userData: UserProfile
): Promise<{ success: boolean; error?: string; userCancelled?: boolean }> {
  try {
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.vip;
    if (!plan) {
      throw new Error(`Invalid plan selected: ${planId}`);
    }

    const apiKey =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

    // Simulation fallback if API key is not yet set up
    if (!apiKey) {
      console.log('[PurchaseService] Simulation mode: activating plan without live RevenueCat key.');
      await syncSubscriptionWithFirestore(userData.uid, plan.id);
      return { success: true };
    }

    if (!isInitialized) {
      await initializePurchases(userData.uid);
    }

    const offerings = await Purchases.getOfferings();
    let packageToBuy: PurchasesPackage | undefined;

    if (offerings.current?.availablePackages) {
      packageToBuy = offerings.current.availablePackages.find(
        (pkg) =>
          pkg.product.identifier === plan.productId ||
          pkg.identifier.toLowerCase() === plan.id.toLowerCase()
      );
    }

    let customerInfo: CustomerInfo;

    if (packageToBuy) {
      const purchaseResult = await Purchases.purchasePackage(packageToBuy);
      customerInfo = purchaseResult.customerInfo;
    } else {
      const products = await Purchases.getProducts([plan.productId]);
      const targetProduct = products.find((p) => p.identifier === plan.productId);
      if (!targetProduct) {
        throw new Error(
          `In-App Purchase product '${plan.productId}' is not yet available in the store. Please ensure it is created in App Store Connect.`
        );
      }
      const purchaseResult = await Purchases.purchaseStoreProduct(targetProduct);
      customerInfo = purchaseResult.customerInfo;
    }

    await syncSubscriptionWithFirestore(userData.uid, plan.id, customerInfo);
    return { success: true };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[PurchaseService] User cancelled In-App Purchase.');
      return { success: false, userCancelled: true };
    }

    console.error('[PurchaseService] Purchase error:', error);
    return {
      success: false,
      error: error.message || 'In-App Purchase could not be completed.',
    };
  }
}

/**
 * Restore previous In-App Purchases (Mandatory for Apple StoreKit compliance)
 */
export async function restoreInAppPurchases(
  userData: UserProfile
): Promise<{ success: boolean; restored: boolean; message: string }> {
  try {
    const apiKey =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

    if (!apiKey) {
      return {
        success: true,
        restored: false,
        message: 'No active subscriptions found to restore in sandbox mode.',
      };
    }

    if (!isInitialized) {
      await initializePurchases(userData.uid);
    }

    const customerInfo = await Purchases.restorePurchases();
    const hasActiveSub =
      Object.keys(customerInfo.entitlements.active).length > 0 ||
      customerInfo.activeSubscriptions.length > 0;

    if (hasActiveSub) {
      // Determine plan from active subscription
      let resolvedPlan: PlanTier = 'vip';
      for (const sub of customerInfo.activeSubscriptions) {
        if (sub.includes('starter')) resolvedPlan = 'starter';
        else if (sub.includes('transform')) resolvedPlan = 'transform';
        else if (sub.includes('vip')) resolvedPlan = 'vip';
      }

      await syncSubscriptionWithFirestore(userData.uid, resolvedPlan, customerInfo);
      return {
        success: true,
        restored: true,
        message: 'Your active subscription has been restored successfully!',
      };
    } else {
      return {
        success: true,
        restored: false,
        message: 'No active subscriptions were found for your Apple ID.',
      };
    }
  } catch (error: any) {
    console.error('[PurchaseService] Restore error:', error);
    return {
      success: false,
      restored: false,
      message: error.message || 'Failed to restore purchases.',
    };
  }
}

/**
 * Alias for legacy references
 */
export const processStripeSubscription = processInAppPurchase;
