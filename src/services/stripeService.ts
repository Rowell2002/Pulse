import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserSubscription } from '../context/AuthContext';

export type PlanTier = 'starter' | 'transform' | 'vip' | 'monthly' | 'annual';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number; // in dollars
  priceCents: number;
  interval: 'month' | 'year';
  formattedPrice: string;
  badge?: string;
  savings?: string;
}

export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    priceCents: 1999,
    interval: 'month',
    formattedPrice: '$19.99',
    badge: 'STARTER',
  },
  transform: {
    id: 'transform',
    name: 'Transform',
    price: 39.99,
    priceCents: 3999,
    interval: 'month',
    formattedPrice: '$39.99',
    badge: 'MOST POPULAR',
  },
  vip: {
    id: 'vip',
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
    name: 'VIP 1ON1',
    price: 119.99,
    priceCents: 11999,
    interval: 'month',
    formattedPrice: '$119.99',
    badge: 'ALL-INCLUSIVE',
  },
  annual: {
    id: 'vip',
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

/**
 * Handle Stripe PaymentSheet presentation and activate the subscription in Firestore.
 */
export async function processStripeSubscription(
  planId: PlanTier | string,
  userData: UserProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.vip;
    if (!plan) {
      throw new Error(`Invalid plan selected: ${planId}`);
    }

    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('[StripeService] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY not set. Falling back to test simulation.');
    }

    console.log(`[StripeService] Initializing Payment Sheet for ${plan.name} (${plan.formattedPrice}/${plan.interval})...`);

    // In a production backend setup with Cloud Functions, you would fetch:
    // { paymentIntent, ephemeralKey, customer } = await fetch('https://your-api/create-subscription', ...).json();
    // Here we configure the native PaymentSheet with Stripe's custom options:
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Pulse Fitness',
      customerId: userData.subscription?.stripeCustomerId || `cust_${userData.uid}`,
      intentConfiguration: {
        mode: {
          amount: plan.priceCents,
          currencyCode: 'USD',
        },
        confirmHandler: async (paymentMethod: any, shouldSavePaymentMethod: any, intentCreationCallback: any) => {
          console.log('[StripeService] Payment method authorized:', paymentMethod.id);
          intentCreationCallback({ clientSecret: `pi_mock_${Date.now()}_secret_${Date.now()}` });
        },
      },
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: userData.name || 'Pulse Athlete',
        email: userData.email || '',
      },
      returnURL: 'pulse://stripe-redirect',
    });

    if (initError) {
      console.warn('[StripeService] Native PaymentSheet initialization notice:', initError.message);
    }

    // Present Payment Sheet to user
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code === 'Canceled') {
        console.log('[StripeService] User dismissed payment sheet.');
        return { success: false, error: 'Payment was canceled.' };
      }
      console.error('[StripeService] Payment sheet error:', presentError);
      throw new Error(presentError.message || 'Payment processing failed.');
    }

    // Payment succeeded: Calculate next period end date
    const now = new Date();
    const nextPeriodEnd = new Date(now);
    if (plan.interval === 'month') {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    } else {
      nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
    }

    const updatedSubscription: UserSubscription = {
      status: 'active',
      plan: (plan.id as 'starter' | 'transform' | 'vip' | 'monthly' | 'annual'),
      trialStartedAt: userData.subscription?.trialStartedAt || now.toISOString(),
      trialEndsAt: userData.subscription?.trialEndsAt || now.toISOString(),
      currentPeriodEnd: nextPeriodEnd.toISOString(),
      stripeCustomerId: `cust_${userData.uid}`,
      stripeSubscriptionId: `sub_${Date.now()}`,
      cancelAtPeriodEnd: false,
    };

    // Update in Firestore
    const userDocRef = doc(db, 'users', userData.uid);
    await updateDoc(userDocRef, {
      subscription: updatedSubscription,
    });

    console.log('[StripeService] Successfully activated subscription in Firestore:', updatedSubscription);
    return { success: true };
  } catch (error: any) {
    console.error('[StripeService] Error in processStripeSubscription:', error);
    return { success: false, error: error.message || 'Failed to complete subscription payment.' };
  }
}
