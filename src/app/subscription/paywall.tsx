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
  TextInput,
} from 'react-native';
import {
  ChevronLeft,
  ShieldCheck,
  Clock,
  CreditCard,
  Flame,
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  Tag,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  PlanTier,
  SUBSCRIPTION_PLANS,
  PLAN_COMPARISON_FEATURES,
} from '../../services/stripeService';

export default function PaywallScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);
  const { subscription, isInTrial, isTrialExpired, daysLeftInTrial, subscribe, applyPromoCode } = useSubscription();

  // Selected plan tier (default to 'transform')
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('transform');
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const activePlanConfig = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS.transform;

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Promo Code', 'Please enter a promo code.');
      return;
    }
    setIsApplyingPromo(true);
    try {
      const res = await applyPromoCode(code);
      if (res.success) {
        Alert.alert(
          '🎉 4-Month Free Access Unlocked!',
          'Promo code PULSE4FREE was applied successfully! You have 4 months of free Pulse access.',
          [{ text: 'Great!', onPress: () => router.back() }]
        );
        setPromoCodeInput('');
      } else {
        Alert.alert('Promo Code Notice', res.error || 'Invalid promo code. Use PULSE4FREE for 4 months free.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to apply promo code.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const result = await subscribe(selectedPlan);
      if (result.success) {
        Alert.alert(
          '🎉 Membership Active',
          `Your ${activePlanConfig.name} plan is now active. Enjoy your workouts and personalized coaching!`,
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

  const renderCellValue = (value: string | boolean, isHighlighted: boolean) => {
    if (value === true) {
      return (
        <View style={[styles.statusIconWrap, isHighlighted && styles.statusIconWrapActive]}>
          <Check size={16} color={colors.primary} strokeWidth={3} />
        </View>
      );
    }
    if (value === false) {
      return (
        <View style={styles.statusIconWrap}>
          <X size={15} color={colors.textMuted} strokeWidth={2.5} style={{ opacity: 0.5 }} />
        </View>
      );
    }
    return (
      <View style={[styles.textValueBadge, isHighlighted && styles.textValueBadgeActive]}>
        <Text
          style={[
            styles.textValueLabel,
            isHighlighted && { color: colors.primary, fontWeight: '700' },
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERSONALIZED FITNESS PLANS</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.heroSection}>
          <Text style={styles.heroMainTitle}>PERSONALIZED FITNESS PLANS</Text>
          <Text style={styles.heroSubHeader}>Plan Comparison</Text>
        </View>

        {/* Promo Code Section */}
        {isInTrial && !isTrialExpired ? (
          <GlassCard style={styles.trialBanner} active>
            <View style={styles.trialBannerContent}>
              <View style={styles.trialIconWrapper}>
                <Sparkles size={20} color={colors.primary} />
              </View>
              <View style={styles.trialTextWrapper}>
                <Text style={styles.trialBannerTitle}>4-Month Free Access Active (PULSE4FREE)</Text>
                <Text style={styles.trialBannerSubtitle}>
                  You have <Text style={styles.highlightText}>{daysLeftInTrial} days remaining</Text> in your promo period.
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.promoCard}>
            <View style={styles.promoHeader}>
              <Tag size={16} color={colors.primary} />
              <Text style={styles.promoTitle}>Have a Promo Code?</Text>
            </View>
            <Text style={styles.promoSubtitle}>
              Apply code <Text style={styles.promoHighlight}>PULSE4FREE</Text> to get 4 months completely free.
            </Text>
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter PULSE4FREE"
                placeholderTextColor={colors.textMuted}
                value={promoCodeInput}
                onChangeText={setPromoCodeInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.promoApplyBtn, isApplyingPromo && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={handleApplyPromo}
                disabled={isApplyingPromo}
              >
                {isApplyingPromo ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.promoApplyText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {isTrialExpired && !isInTrial && (
          <GlassCard style={styles.expiredBanner}>
            <View style={styles.trialBannerContent}>
              <View style={[styles.trialIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Flame size={20} color="#EF4444" />
              </View>
              <View style={styles.trialTextWrapper}>
                <Text style={[styles.trialBannerTitle, { color: '#EF4444' }]}>Free Trial Expired</Text>
                <Text style={styles.trialBannerSubtitle}>
                  Apply promo code or select a fitness plan below to continue training.
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* 3 Plan Selection Cards */}
        <View style={styles.planCardsRow}>
          {/* STARTER */}
          <TouchableOpacity
            style={styles.planCardWrapper}
            activeOpacity={0.85}
            onPress={() => setSelectedPlan('starter')}
          >
            <GlassCard
              style={[
                styles.tierCard,
                selectedPlan === 'starter' && styles.tierCardSelected,
              ]}
              active={selectedPlan === 'starter'}
            >
              <View style={styles.tierHeader}>
                <Zap size={16} color={selectedPlan === 'starter' ? colors.primary : colors.textMuted} />
                <Text style={styles.tierName}>STARTER</Text>
              </View>
              <Text style={styles.tierPrice}>$19.99</Text>
              <Text style={styles.tierPeriod}>/ month</Text>
            </GlassCard>
          </TouchableOpacity>

          {/* TRANSFORM */}
          <TouchableOpacity
            style={styles.planCardWrapper}
            activeOpacity={0.85}
            onPress={() => setSelectedPlan('transform')}
          >
            <GlassCard
              style={[
                styles.tierCard,
                styles.popularCard,
                selectedPlan === 'transform' && styles.tierCardSelected,
              ]}
              active={selectedPlan === 'transform'}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
              <View style={styles.tierHeader}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={styles.tierName}>TRANSFORM</Text>
              </View>
              <Text style={styles.tierPrice}>$39.99</Text>
              <Text style={styles.tierPeriod}>/ month</Text>
            </GlassCard>
          </TouchableOpacity>

          {/* VIP 1ON1 */}
          <TouchableOpacity
            style={styles.planCardWrapper}
            activeOpacity={0.85}
            onPress={() => setSelectedPlan('vip')}
          >
            <GlassCard
              style={[
                styles.tierCard,
                selectedPlan === 'vip' && styles.tierCardSelected,
              ]}
              active={selectedPlan === 'vip'}
            >
              <View style={styles.tierHeader}>
                <Crown size={16} color={selectedPlan === 'vip' ? colors.primary : colors.textMuted} />
                <Text style={styles.tierName}>VIP 1ON1</Text>
              </View>
              <Text style={styles.tierPrice}>$119.99</Text>
              <Text style={styles.tierPeriod}>/ month</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Plan Comparison Matrix / Table */}
        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableInner}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.columnHeader, styles.featureColumn]}>
                  <Text style={styles.tableHeaderLabel}>Feature</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedPlan('starter')}
                  style={[
                    styles.columnHeader,
                    styles.planColumn,
                    selectedPlan === 'starter' && styles.columnSelectedHeader,
                  ]}
                >
                  <Text style={styles.tablePlanTitle}>STARTER</Text>
                  <Text style={styles.tablePlanPrice}>$19.99</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedPlan('transform')}
                  style={[
                    styles.columnHeader,
                    styles.planColumn,
                    selectedPlan === 'transform' && styles.columnSelectedHeader,
                  ]}
                >
                  <Text style={[styles.tablePlanTitle, { color: colors.primary }]}>TRANSFORM</Text>
                  <Text style={styles.tablePlanPrice}>$39.99</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedPlan('vip')}
                  style={[
                    styles.columnHeader,
                    styles.planColumn,
                    selectedPlan === 'vip' && styles.columnSelectedHeader,
                  ]}
                >
                  <Text style={styles.tablePlanTitle}>VIP 1ON1</Text>
                  <Text style={styles.tablePlanPrice}>$119.99</Text>
                </TouchableOpacity>
              </View>

              {/* Table Rows */}
              {PLAN_COMPARISON_FEATURES.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <View
                    key={item.feature}
                    style={[
                      styles.tableRow,
                      isEven ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <View style={[styles.cell, styles.featureColumn]}>
                      <Text style={styles.featureText}>{item.feature}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedPlan('starter')}
                      style={[
                        styles.cell,
                        styles.planColumn,
                        selectedPlan === 'starter' && styles.cellSelected,
                      ]}
                    >
                      {renderCellValue(item.starter, selectedPlan === 'starter')}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedPlan('transform')}
                      style={[
                        styles.cell,
                        styles.planColumn,
                        selectedPlan === 'transform' && styles.cellSelected,
                      ]}
                    >
                      {renderCellValue(item.transform, selectedPlan === 'transform')}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedPlan('vip')}
                      style={[
                        styles.cell,
                        styles.planColumn,
                        selectedPlan === 'vip' && styles.cellSelected,
                      ]}
                    >
                      {renderCellValue(item.vip, selectedPlan === 'vip')}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Check size={14} color={colors.primary} strokeWidth={3} />
            <Text style={styles.legendText}>Included</Text>
          </View>
          <View style={styles.legendItem}>
            <X size={14} color={colors.textMuted} strokeWidth={2.5} />
            <Text style={styles.legendText}>Not included</Text>
          </View>
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
                  {`Continue with ${activePlanConfig.name} — ${activePlanConfig.formattedPrice}/mo`}
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
          Payment is processed securely via Stripe. Subscriptions renew automatically monthly and can be canceled anytime in Settings.
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
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    headerPlaceholder: {
      width: 36,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      gap: 16,
    },
    heroSection: {
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    heroMainTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    heroSubHeader: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    promoCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: 8,
    },
    promoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    promoTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    promoSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
    promoHighlight: {
      color: colors.primary,
      fontWeight: '800',
    },
    promoInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    promoInput: {
      flex: 1,
      height: 42,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 8,
      paddingHorizontal: 12,
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    promoApplyBtn: {
      height: 42,
      paddingHorizontal: 18,
      backgroundColor: colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    promoApplyText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
    },
    trialBanner: {
      padding: 14,
      borderColor: colors.primary,
      borderWidth: 1.5,
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.06)' : 'rgba(118, 158, 0, 0.06)',
    },
    expiredBanner: {
      padding: 14,
      borderColor: 'rgba(239, 68, 68, 0.4)',
      borderWidth: 1.5,
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    trialBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    trialIconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(118, 158, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trialTextWrapper: {
      flex: 1,
      gap: 2,
    },
    trialBannerTitle: {
      fontSize: 14,
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
    planCardsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    planCardWrapper: {
      flex: 1,
    },
    tierCard: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: 3,
      minHeight: 88,
      justifyContent: 'center',
    },
    popularCard: {
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    popularBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: 0.5,
    },
    tierCardSelected: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.09)' : 'rgba(118, 158, 0, 0.09)',
    },
    tierHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tierName: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.4,
    },
    tierPrice: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    tierPeriod: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '500',
    },
    tableContainer: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      overflow: 'hidden',
    },
    tableInner: {
      minWidth: 460,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    columnHeader: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    columnSelectedHeader: {
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(118, 158, 0, 0.12)',
    },
    featureColumn: {
      width: 170,
      paddingLeft: 12,
      alignItems: 'flex-start',
    },
    planColumn: {
      width: 100,
    },
    tableHeaderLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tablePlanTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.4,
    },
    tablePlanPrice: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: 2,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      minHeight: 46,
    },
    tableRowEven: {
      backgroundColor: 'transparent',
    },
    tableRowOdd: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.015)',
    },
    cell: {
      paddingVertical: 8,
      paddingHorizontal: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cellSelected: {
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.06)' : 'rgba(118, 158, 0, 0.06)',
    },
    featureText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 16,
    },
    statusIconWrap: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusIconWrapActive: {
      transform: [{ scale: 1.1 }],
    },
    textValueBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textValueBadgeActive: {
      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(118, 158, 0, 0.15)',
    },
    textValueLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginTop: -4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    checkoutSection: {
      gap: 12,
      marginTop: 4,
    },
    checkoutButton: {
      height: 54,
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
