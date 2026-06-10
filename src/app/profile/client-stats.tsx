import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { ChevronLeft, BarChart2, TrendingUp, Award, AwardIcon } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';

export default function ClientStatsScreen() {
  const router = useRouter();

  const metrics = [
    { label: 'Weight Progression', value: '78 kg', change: '-2.4 kg (30d)', status: 'down' },
    { label: 'Estimated Body Fat', value: '12.4%', change: '-0.8% (30d)', status: 'down' },
    { label: 'Skeletal Muscle Mass', value: '38.2 kg', change: '+1.1 kg (30d)', status: 'up' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progression & Stats</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.statsLabel}>PERFORMANCE DASHBOARD</Text>
          <Text style={styles.statsTitle}>Alex's Vital Statistics</Text>
          <Text style={styles.statsMeta}>Sync: Today, 08:32 AM via Smartwatch Scale</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsContainer}>
          {metrics.map((item, index) => (
            <GlassCard key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <TrendingUp size={16} color={item.status === 'up' ? COLORS.secondary : COLORS.primary} />
              </View>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text
                style={[
                  styles.metricChange,
                  { color: item.status === 'up' ? COLORS.secondary : COLORS.primary },
                ]}
              >
                {item.change}
              </Text>
            </GlassCard>
          ))}
        </View>

        {/* Strength Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>One-Rep Max Milestones</Text>
          <View style={styles.milestonesList}>
            {/* Max 1 */}
            <GlassCard style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <Award size={20} color={COLORS.primary} />
                <View style={styles.milestoneMeta}>
                  <Text style={styles.milestoneExercise}>Barbell Bench Press</Text>
                  <Text style={styles.milestoneVal}>225 lbs (102 kg)</Text>
                </View>
              </View>
              <Text style={styles.milestoneDate}>2w ago</Text>
            </GlassCard>

            {/* Max 2 */}
            <GlassCard style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <Award size={20} color={COLORS.primary} />
                <View style={styles.milestoneMeta}>
                  <Text style={styles.milestoneExercise}>Barbell Back Squat</Text>
                  <Text style={styles.milestoneVal}>315 lbs (143 kg)</Text>
                </View>
              </View>
              <Text style={styles.milestoneDate}>Yesterday</Text>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerPlaceholder: {
    width: 36,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  titleSection: {
    gap: 6,
    marginTop: 10,
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statsMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metricsContainer: {
    gap: 12,
  },
  metricCard: {
    padding: 16,
    gap: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  milestonesList: {
    gap: 12,
  },
  milestoneCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneMeta: {
    gap: 2,
  },
  milestoneExercise: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  milestoneVal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  milestoneDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
