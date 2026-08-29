import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  ShieldCheck,
  Clock,
  CreditCard,
  Flame,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useSubscription } from '../../context/SubscriptionContext';

export default function PaywallScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);
  const { isInTrial, isTrialExpired, daysLeftInTrial, plans, subscribe } = useSubscription();

  // Monthly is prioritized and selected by default
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const result = await subscribe(selectedPlan);
      if (result.success) {
        Alert.alert(
          '🎉 Membership Active',
          'Your Pulse membership is active. Enjoy your workouts and coaching!',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else if (result.error && result.error !== 'Payment was canceled.') {
        Alert.alert('Payment Notice', result.error);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment processing encountered an issue.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Pulse Membership</Text>
          <Text style={styles.heroSubtitle}>
            Enjoy 4 months free with your account. Select your billing preference to continue your membership.
          </Text>
        </View>

        {/* 4-Month Trial Status Banner */}
        {isInTrial && !isTrialExpired && (
          <GlassCard style={styles.trialBanner} active>
            <View style={styles.trialBannerContent}>
              <View style={styles.trialIconWrapper}>
                <Clock size={20} color={colors.primary} />
              </View>
              <View style={styles.trialTextWrapper}>
                <Text style={styles.trialBannerTitle}>4-Month Free Trial Active</Text>
                <Text style={styles.trialBannerSubtitle}>
                  You have <Text style={styles.highlightText}>{daysLeftInTrial} days remaining</Text> in your free trial.
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {isTrialExpired && (
          <GlassCard style={styles.expiredBanner}>
            <View style={styles.trialBannerContent}>
              <View style={[styles.trialIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Flame size={20} color="#EF4444" />
              </View>
              <View style={styles.trialTextWrapper}>
                <Text style={[styles.trialBannerTitle, { color: '#EF4444' }]}>Free Trial Expired</Text>
                <Text style={styles.trialBannerSubtitle}>
                  Select a membership plan below to continue without interruption.
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Membership Plans - Monthly Prioritized */}
        <View style={styles.plansContainer}>
          {/* Monthly Plan (Prioritized & Default) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('monthly')}
          >
            <GlassCard
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.selectedPlanCard,
              ]}
              active={selectedPlan === 'monthly'}
            >
              <View style={styles.planCardHeader}>
                <View style={styles.planNameWrapper}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planTitle}>Monthly Membership</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text style={styles.planSubtitle}>Billed monthly • Cancel anytime</Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedPlan === 'monthly' && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={styles.planPriceRow}>
                <Text style={styles.planPriceText}>{plans.monthly.formattedPrice}</Text>
                <Text style={styles.planPeriodText}>/ month</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Annual Plan (Alternative) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedPlan('annual')}
          >
            <GlassCard
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.selectedPlanCard,
              ]}
              active={selectedPlan === 'annual'}
            >
              <View style={styles.planCardHeader}>
                <View style={styles.planNameWrapper}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planTitle}>Annual Membership</Text>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>SAVE $179.89/YR</Text>
                    </View>
                  </View>
                  <Text style={styles.planSubtitle}>Billed annually • Cancel anytime</Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedPlan === 'annual' && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPlan === 'annual' && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={styles.planPriceRow}>
                <Text style={styles.planPriceText}>{plans.annual.formattedPrice}</Text>
                <Text style={styles.planPeriodText}>/ year ($104.99/mo)</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Checkout Button */}
        <View style={styles.checkoutSection}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.checkoutButton, isProcessing && styles.disabledButton]}
            onPress={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <CreditCard size={18} color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.checkoutButtonText}>
                  {selectedPlan === 'monthly'
                    ? `Continue with Monthly — ${plans.monthly.formattedPrice}/mo`
                    : `Continue with Annual — ${plans.annual.formattedPrice}/yr`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Secure Trust Badges */}
          <View style={styles.securityRow}>
            <ShieldCheck size={14} color={colors.textMuted} />
            <Text style={styles.securityText}>
              Secured by Stripe • Apple Pay • Google Pay • 256-bit Encryption
            </Text>
          </View>
        </View>

        {/* Legal Footer */}
        <Text style={styles.legalText}>
          Payment is processed securely via Stripe. Subscriptions renew automatically per chosen period and can be canceled anytime in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceCard,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerPlaceholder: {
      width: 36,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      gap: 20,
    },
    heroSection: {
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 12,
    },
    trialBanner: {
      padding: 16,
      borderColor: colors.primary,
      borderWidth: 1.5,
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.06)' : 'rgba(118, 158, 0, 0.06)',
    },
    expiredBanner: {
      padding: 16,
      borderColor: 'rgba(239, 68, 68, 0.4)',
      borderWidth: 1.5,
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    trialBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    trialIconWrapper: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(118, 158, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trialTextWrapper: {
      flex: 1,
      gap: 2,
    },
    trialBannerTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    trialBannerSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
    highlightText: {
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    plansContainer: {
      gap: 14,
      marginTop: 4,
    },
    planCard: {
      padding: 18,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: 12,
    },
    selectedPlanCard: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(118, 158, 0, 0.08)',
    },
    planCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    planNameWrapper: {
      gap: 4,
      flex: 1,
      paddingRight: 8,
    },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    planTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    recommendedBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
    },
    recommendedBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: 0.5,
    },
    savingsBadge: {
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.18)' : 'rgba(118, 158, 0, 0.18)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    savingsBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    planSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
    },
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    planPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    planPriceText: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    planPeriodText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },
    checkoutSection: {
      gap: 12,
      marginTop: 12,
    },
    checkoutButton: {
      height: 56,
      backgroundColor: colors.primary,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    disabledButton: {
      opacity: 0.7,
    },
    checkoutButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#000000',
    },
    securityRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    securityText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500',
    },
    legalText: {
      fontSize: 10,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 14,
      opacity: 0.7,
      marginBottom: 20,
    },
  });
