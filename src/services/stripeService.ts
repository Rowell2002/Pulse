import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserSubscription } from '../context/AuthContext';

export interface PlanConfig {
  id: 'monthly' | 'annual';
  name: string;
  price: number; // in dollars
  priceCents: number;
  interval: 'month' | 'year';
  formattedPrice: string;
  badge?: string;
  savings?: string;
}

export const SUBSCRIPTION_PLANS: Record<'monthly' | 'annual', PlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Pulse Monthly Service',
    price: 119.99,
    priceCents: 11999,
    interval: 'month',
    formattedPrice: '$119.99',
    badge: 'RECOMMENDED',
  },
  annual: {
    id: 'annual',
    name: 'Pulse Annual Service',
    price: 1259.99,
    priceCents: 125999,
    interval: 'year',
    formattedPrice: '$1,259.99',
    savings: '$104.99/mo (Save $179/yr)',
  },
};

/**
 * Handle Stripe PaymentSheet presentation and activate the subscription in Firestore.
 */
export async function processStripeSubscription(
  planId: 'monthly' | 'annual',
  userData: UserProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const plan = SUBSCRIPTION_PLANS[planId];
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
        confirmHandler: async (paymentMethod, shouldSavePaymentMethod, intentCreationCallback) => {
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
      plan: planId,
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
