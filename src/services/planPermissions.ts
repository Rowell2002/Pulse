import { PlanTier } from './stripeService';
import { UserSubscription } from '../context/AuthContext';

export type PlanFeatureKey =
  | 'fitnessProfile'
  | 'goalAssessment'
  | 'workoutPrograms'
  | 'weeklyWorkoutUpdates'
  | 'exerciseVideoLibrary'
  | 'nutritionGuidance'
  | 'mealPlan'
  | 'calorieMacros'
  | 'progressTracking'
  | 'weeklyCheckIn'
  | 'formCheckVideoReview'
  | 'directTrainerMessaging'
  | 'workoutAdjustments'
  | 'challengesCommunity'
  | 'liveCoachingCall';

export interface PlanFeaturePermission {
  allowed: boolean;
  level: string; // e.g. 'Basic', 'Personalized', 'Fully Personalized', '1×/week', 'Weekly', '1×/month', 'Limited', 'Priority + Direct', 'VIP Access', '1×/monthly', '+ Advanced', 'Included', 'Not included'
  upgradeRequiredTo?: PlanTier;
}

/**
 * Normalizes user subscription into an active PlanTier.
 * If user is on trial, defaults to 'vip' (full access during trial) or 'transform'.
 */
export function resolveUserPlanTier(subscription: UserSubscription | null | undefined): PlanTier {
  if (!subscription) return 'starter';
  
  if (subscription.status === 'trialing') {
    // Users in free trial experience full features
    return 'vip';
  }

  const plan = subscription.plan;
  if (plan === 'vip' || plan === 'annual' || plan === 'monthly') return 'vip';
  if (plan === 'transform') return 'transform';
  if (plan === 'starter') return 'starter';

  return 'starter';
}

/**
 * Complete Matrix of all 15 Features and their tier permissions strictly based on PDF
 */
export const TIER_PERMISSIONS: Record<PlanTier, Record<PlanFeatureKey, PlanFeaturePermission>> = {
  starter: {
    fitnessProfile: { allowed: true, level: 'Included' },
    goalAssessment: { allowed: true, level: 'Included' },
    workoutPrograms: { allowed: true, level: 'Basic' },
    weeklyWorkoutUpdates: { allowed: false, level: 'Not included', upgradeRequiredTo: 'transform' },
    exerciseVideoLibrary: { allowed: true, level: 'Included' },
    nutritionGuidance: { allowed: true, level: 'Basic' },
    mealPlan: { allowed: false, level: 'Not included', upgradeRequiredTo: 'transform' },
    calorieMacros: { allowed: true, level: 'Basic' },
    progressTracking: { allowed: true, level: 'Basic' },
    weeklyCheckIn: { allowed: false, level: 'Not included', upgradeRequiredTo: 'transform' },
    formCheckVideoReview: { allowed: false, level: 'Not included', upgradeRequiredTo: 'transform' },
    directTrainerMessaging: { allowed: false, level: 'Not included', upgradeRequiredTo: 'transform' },
    workoutAdjustments: { allowed: false, level: 'Not included', upgradeRequiredTo: 'transform' },
    challengesCommunity: { allowed: true, level: 'Included' },
    liveCoachingCall: { allowed: false, level: 'Not included', upgradeRequiredTo: 'vip' },
  },
  transform: {
    fitnessProfile: { allowed: true, level: 'Included' },
    goalAssessment: { allowed: true, level: 'Included' },
    workoutPrograms: { allowed: true, level: 'Personalized' },
    weeklyWorkoutUpdates: { allowed: true, level: 'Included' },
    exerciseVideoLibrary: { allowed: true, level: 'Included' },
    nutritionGuidance: { allowed: true, level: 'Personalized' },
    mealPlan: { allowed: true, level: 'Included' },
    calorieMacros: { allowed: true, level: 'Personalized' },
    progressTracking: { allowed: true, level: 'Advanced' },
    weeklyCheckIn: { allowed: true, level: '1×/week' },
    formCheckVideoReview: { allowed: true, level: '1×/month' },
    directTrainerMessaging: { allowed: true, level: 'Limited' },
    workoutAdjustments: { allowed: true, level: 'Monthly' },
    challengesCommunity: { allowed: true, level: 'Included' },
    liveCoachingCall: { allowed: false, level: 'Not included', upgradeRequiredTo: 'vip' },
  },
  vip: {
    fitnessProfile: { allowed: true, level: 'Included' },
    goalAssessment: { allowed: true, level: 'Included' },
    workoutPrograms: { allowed: true, level: 'Fully Personalized' },
    weeklyWorkoutUpdates: { allowed: true, level: 'Included' },
    exerciseVideoLibrary: { allowed: true, level: 'Included' },
    nutritionGuidance: { allowed: true, level: 'Fully Personalized' },
    mealPlan: { allowed: true, level: 'Included' },
    calorieMacros: { allowed: true, level: 'Personalized + Adjustments' },
    progressTracking: { allowed: true, level: '+ Advanced' },
    weeklyCheckIn: { allowed: true, level: '1×/week' },
    formCheckVideoReview: { allowed: true, level: 'Weekly' },
    directTrainerMessaging: { allowed: true, level: 'Priority + Direct' },
    workoutAdjustments: { allowed: true, level: 'As needed' },
    challengesCommunity: { allowed: true, level: 'VIP Access' },
    liveCoachingCall: { allowed: true, level: '1×/monthly' },
  },
  // Legacy aliases
  monthly: {
    fitnessProfile: { allowed: true, level: 'Included' },
    goalAssessment: { allowed: true, level: 'Included' },
    workoutPrograms: { allowed: true, level: 'Fully Personalized' },
    weeklyWorkoutUpdates: { allowed: true, level: 'Included' },
    exerciseVideoLibrary: { allowed: true, level: 'Included' },
    nutritionGuidance: { allowed: true, level: 'Fully Personalized' },
    mealPlan: { allowed: true, level: 'Included' },
    calorieMacros: { allowed: true, level: 'Personalized + Adjustments' },
    progressTracking: { allowed: true, level: '+ Advanced' },
    weeklyCheckIn: { allowed: true, level: '1×/week' },
    formCheckVideoReview: { allowed: true, level: 'Weekly' },
    directTrainerMessaging: { allowed: true, level: 'Priority + Direct' },
    workoutAdjustments: { allowed: true, level: 'As needed' },
    challengesCommunity: { allowed: true, level: 'VIP Access' },
    liveCoachingCall: { allowed: true, level: '1×/monthly' },
  },
  annual: {
    fitnessProfile: { allowed: true, level: 'Included' },
    goalAssessment: { allowed: true, level: 'Included' },
    workoutPrograms: { allowed: true, level: 'Fully Personalized' },
    weeklyWorkoutUpdates: { allowed: true, level: 'Included' },
    exerciseVideoLibrary: { allowed: true, level: 'Included' },
    nutritionGuidance: { allowed: true, level: 'Fully Personalized' },
    mealPlan: { allowed: true, level: 'Included' },
    calorieMacros: { allowed: true, level: 'Personalized + Adjustments' },
    progressTracking: { allowed: true, level: '+ Advanced' },
    weeklyCheckIn: { allowed: true, level: '1×/week' },
    formCheckVideoReview: { allowed: true, level: 'Weekly' },
    directTrainerMessaging: { allowed: true, level: 'Priority + Direct' },
    workoutAdjustments: { allowed: true, level: 'As needed' },
    challengesCommunity: { allowed: true, level: 'VIP Access' },
    liveCoachingCall: { allowed: true, level: '1×/monthly' },
  },
};

/**
 * Check permission for any of the 15 features
 */
export function checkPlanPermission(
  subscription: UserSubscription | null | undefined,
  feature: PlanFeatureKey
): PlanFeaturePermission {
  const tier = resolveUserPlanTier(subscription);
  const permissions = TIER_PERMISSIONS[tier] || TIER_PERMISSIONS.starter;
  return permissions[feature];
}
