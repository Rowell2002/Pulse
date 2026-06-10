import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Share,
} from 'react-native';
import { Trophy, Timer, Flame, Dumbbell, ArrowRight, Share2 } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EXERCISES } from '../../constants/exerciseDb';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [notes, setNotes] = useState('');

  // Retrieve finished exercise details from database
  const exerciseId = params.exerciseId as string;
  const exercise = EXERCISES.find((ex) => ex.id === exerciseId) || EXERCISES[0];

  // Retrieve passed tracking statistics or default to 0 if missing
  const volumeParam = params.volume ? parseFloat(params.volume as string) : 0;
  const maxWeightParam = params.maxWeight ? parseFloat(params.maxWeight as string) : 0;
  const timeParam = (params.time as string) || '00:00';
  const completedSetsParam = params.completedSets ? parseInt(params.completedSets as string) : 0;

  // Compute calorie burn based on intensity and active time (only if sets were completed)
  const parsedMinutes = timeParam.includes(':') ? parseInt(timeParam.split(':')[0]) || 0 : 0;
  const caloriesBurned = completedSetsParam > 0
    ? Math.round(parsedMinutes * (exercise.intensity || 7.5) * 1.3)
    : 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏋️ Just crushed ${exercise.name} on PULSE! ${volumeParam.toLocaleString()}kg total volume, new personal record set! 💪⚡`,
        title: 'Workout Complete — PULSE',
      });
    } catch (e) {
      // share cancelled or error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatarContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSu3Sf4cxST91JrfyB_JAmwNIe3ztRVD74XakGLqleVVG9e7aPySXW_qoMpE1hv48jg7WcaH6VJll1qGUq6YygDclF2XOufsC13Ry4GVpYgXUHr95PfsQsS4hCY8xWyhJQN6HOKKABBPyJJlvS2bKWsOSS_z6y1aaDjLtgu9HBAjYVAZV72OSnpioa2k-cGXiXrAX1vTVsB0GGujbqUOVC8nlf3jby3Gi4KOwaDQqnANBtTzPf-Q-9sG0tmr1iJ5g5vgDgaJqb8yvh',
              }}
              style={styles.headerAvatar}
            />
          </View>
          <Text style={styles.brandTitle}>PULSE</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleShare}
          style={styles.iconButton}
        >
          <Share2 size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: exercise.image,
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlayGradient} />
          <View style={styles.heroTextContainer}>
            <Text style={styles.celebrationTitle}>WORKOUT COMPLETE!</Text>
            <Text style={styles.celebrationSubtitle}>{exercise.name} Session</Text>
          </View>
        </View>

        {/* Metrics Bento Grid */}
        <View style={styles.bentoSection}>
          {/* Summary Main: Total Volume */}
          <GlassCard style={[styles.volumeCard, styles.glowAccent]}>
            <View style={styles.bentoHeaderRow}>
              <Text style={styles.bentoLabel}>Total Volume</Text>
              <Dumbbell size={18} color={completedSetsParam > 0 ? COLORS.primary : COLORS.textMuted} />
            </View>
            <View style={styles.volumeValueContainer}>
              {completedSetsParam > 0 ? (
                <>
                  <Text style={styles.volumeValue}>
                    {volumeParam.toLocaleString()} <Text style={styles.volumeUnit}>kg</Text>
                  </Text>
                  <View style={styles.trackBar}>
                    <View style={[styles.trackBarFill, { width: '80%' }]} />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.volumeValue, { color: COLORS.textMuted, fontSize: 20 }]}>
                    No sets completed
                  </Text>
                  <View style={styles.trackBar}>
                    <View style={[styles.trackBarFill, { width: '0%' }]} />
                  </View>
                </>
              )}
            </View>
          </GlassCard>

          {/* Time & Calories Dual Row */}
          <View style={styles.dualRow}>
            {/* Time Card */}
            <GlassCard style={styles.metricsCell}>
              <Timer size={20} color={COLORS.textMuted} />
              <View style={styles.metricsMeta}>
                <Text style={styles.bentoLabel}>Time</Text>
                <Text style={styles.metricsValue}>{timeParam}</Text>
              </View>
            </GlassCard>

            {/* Calories Card */}
            <GlassCard style={styles.metricsCell}>
              <Flame size={20} color={COLORS.textMuted} />
              <View style={styles.metricsMeta}>
                <Text style={styles.bentoLabel}>Calories</Text>
                <Text style={styles.metricsValue}>{caloriesBurned}</Text>
              </View>
            </GlassCard>
          </View>
        </View>

        {/* Personal Bests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personal Bests</Text>
          <GlassCard style={styles.pbCard}>
            <View style={styles.pbLeft}>
              <View style={[styles.pbIconContainer, completedSetsParam === 0 && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Trophy size={20} color={completedSetsParam > 0 ? COLORS.primary : COLORS.textMuted} fill={completedSetsParam > 0 ? "#000000" : "none"} />
              </View>
              <View style={styles.pbMeta}>
                <Text style={styles.pbTitle}>{exercise.name}</Text>
                <Text style={[styles.pbRecordLabel, completedSetsParam === 0 && { color: COLORS.textMuted }]}>
                  {completedSetsParam > 0
                    ? (maxWeightParam > 0 ? `NEW RECORD: ${maxWeightParam}KG` : `RECORD: ${completedSetsParam} SETS COMPLETED`)
                    : 'No sets completed'}
                </Text>
              </View>
            </View>
            <View style={styles.pbRight}>
              <Text style={[styles.pbDelta, completedSetsParam === 0 && { color: COLORS.textMuted }]}>
                {completedSetsParam > 0 
                  ? (maxWeightParam > 0 ? `+${maxWeightParam - (maxWeightParam > 50 ? 5 : 2.5)}kg` : 'PR') 
                  : '--'}
              </Text>
              <Text style={styles.pbDeltaSub}>vs Last Week</Text>
            </View>
          </GlassCard>
        </View>

        {/* Session Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Session Notes</Text>
          <GlassCard style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline={true}
              placeholder={`Reflect on your performance... (e.g., Felt strong doing ${exercise.name})`}
              placeholderTextColor={COLORS.textMuted}
            />
          </GlassCard>
        </View>

        {/* Action Button: Back to Dashboard */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.replace('/(tabs)/home' as any)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Back to Dashboard</Text>
            <ArrowRight size={16} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  iconButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    height: 240,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderBottomWidth: 140,
    borderBottomColor: '#000000',
    opacity: 0.85,
    marginTop: 116,
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 4,
  },
  celebrationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  celebrationSubtitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bentoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  volumeCard: {
    padding: 20,
    gap: 14,
  },
  glowAccent: {
    borderColor: 'rgba(204, 255, 0, 0.2)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  volumeValueContainer: {
    gap: 10,
  },
  volumeValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  volumeUnit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  trackBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricsCell: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metricsMeta: {
    gap: 2,
  },
  metricsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  pbCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pbIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pbMeta: {
    gap: 2,
  },
  pbTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pbRecordLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  pbRight: {
    alignItems: 'flex-end',
  },
  pbDelta: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pbDeltaSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  notesCard: {
    padding: 14,
    height: 100,
  },
  notesInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
    height: '100%',
    padding: 0,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  actionButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
