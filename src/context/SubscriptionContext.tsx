import React, { createContext, useContext, useMemo } from 'react';
import { useAuth, UserSubscription, getPromoCodeTrial } from './AuthContext';
import { processStripeSubscription, SUBSCRIPTION_PLANS, PlanConfig, PlanTier } from '../services/stripeService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

import {
  PlanFeatureKey,
  PlanFeaturePermission,
  resolveUserPlanTier,
  TIER_PERMISSIONS,
  checkPlanPermission,
} from '../services/planPermissions';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  isSubscribed: boolean;
  isInTrial: boolean;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  plan: 'starter' | 'transform' | 'vip' | 'monthly' | 'annual' | 'free_trial' | null;
  currentTier: PlanTier;
  formattedRenewalDate: string | null;
  plans: Record<string, PlanConfig>;
  permissions: Record<PlanFeatureKey, PlanFeaturePermission>;
  hasPermission: (feature: PlanFeatureKey) => PlanFeaturePermission;
  subscribe: (planId: PlanTier | string) => Promise<{ success: boolean; error?: string }>;
  applyPromoCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, user } = useAuth();
  const subscription = userData?.subscription || null;

  // Compute trial & subscription status
  const { isSubscribed, isInTrial, isTrialExpired, daysLeftInTrial, formattedRenewalDate } = useMemo(() => {
    if (!subscription) {
      return {
        isSubscribed: false,
        isInTrial: false,
        isTrialExpired: true,
        daysLeftInTrial: 0,
        formattedRenewalDate: null,
      };
    }

    const now = new Date();

    if (subscription.status === 'active') {
      const renewalDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      return {
        isSubscribed: true,
        isInTrial: false,
        isTrialExpired: false,
        daysLeftInTrial: 0,
        formattedRenewalDate: renewalDate
          ? renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null,
      };
    }

    if (subscription.status === 'trialing') {
      const trialEnds = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : now;
      const diffMs = trialEnds.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isExpired = diffMs <= 0;

      return {
        isSubscribed: !isExpired,
        isInTrial: !isExpired,
        isTrialExpired: isExpired,
        daysLeftInTrial: diffDays,
        formattedRenewalDate: trialEnds.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    }

    return {
      isSubscribed: false,
      isInTrial: false,
      isTrialExpired: true,
      daysLeftInTrial: 0,
      formattedRenewalDate: null,
    };
  }, [subscription]);

  // Apply promo code (PULSE4FREE = 4 Months Free)
  const applyPromoCode = async (code: string) => {
    if (!user) {
      return { success: false, error: 'You must be signed in to apply a promo code.' };
    }
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode !== 'PULSE4FREE') {
      return { success: false, error: 'Invalid promo code. Please enter a valid code.' };
    }
    if (subscription?.promoCode === 'PULSE4FREE' && subscription?.status === 'trialing' && !isTrialExpired) {
      return { success: false, error: 'Promo code PULSE4FREE is already active on this account.' };
    }

    try {
      const now = new Date();
      const trialData = getPromoCodeTrial(now);
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        subscription: trialData,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to apply promo code.' };
    }
  };

  // Trigger Stripe Payment Sheet subscription
  const subscribe = async (planId: PlanTier | string) => {
    if (!userData || !user) {
      return { success: false, error: 'User must be signed in to subscribe.' };
    }

    const result = await processStripeSubscription(planId, userData);
    return result;
  };

  // Cancel subscription (at period end)
  const cancelSubscription = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      'subscription.cancelAtPeriodEnd': true,
      'subscription.status': 'canceled',
    });
  };

  const currentTier = useMemo(() => resolveUserPlanTier(subscription), [subscription]);
  const permissions = useMemo(() => TIER_PERMISSIONS[currentTier] || TIER_PERMISSIONS.starter, [currentTier]);
  const hasPermission = (feature: PlanFeatureKey) => checkPlanPermission(subscription, feature);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isSubscribed,
        isInTrial,
        isTrialExpired,
        daysLeftInTrial,
        plan: subscription?.plan || null,
        currentTier,
        formattedRenewalDate,
        plans: SUBSCRIPTION_PLANS,
        permissions,
        hasPermission,
        subscribe,
        applyPromoCode,
        cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
