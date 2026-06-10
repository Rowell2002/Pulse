import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { ArrowLeft, Bell, Timer, Zap, Activity, Info, Play } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EXERCISES } from '../../constants/exerciseDb';

const { width } = Dimensions.get('window');

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pulseScale, setPulseScale] = useState(1);

  // Retrieve matching exercise from database, defaulting to Back Squat if not found
  const exerciseId = params.exerciseId as string;
  const exercise = EXERCISES.find((ex) => ex.id === exerciseId) || EXERCISES[0];

  // Simple state loop to animate pulsing dot
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.4 : 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const steps = exercise.steps;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>PULSE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconButton}>
            <Bell size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EDkPj9tkBRafTo3lCoYrET_mI_k0CB9hDczuK6VVd85YpEOVjZ3h2A9smiqp_trMTr698fNL5-CYcKpog0txAA7-zBrwlBBwL7bD8tGYxjdJY02QeVCGFbz8W021jpTyC85DOF9enooC1VCZbjFhwbvNrGeBBJuSnUOcXKXGa98j1JUfhOImwlR5xvbw33TNXjGnDMBY5gYT2UTStb8POsgKOJI7OU9VbeBvf_uxPB6vL8GxsavBVHRgg3N2XFKd4_mEaTuobXpk',
              }}
              style={styles.headerAvatar}
            />
          </View>
        </View>
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
          <View style={styles.heroGradient} />

          <View style={styles.heroInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{exercise.category.toUpperCase()}</Text>
            </View>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Timer size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{exercise.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Zap size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{exercise.difficulty.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bento Grid Stats */}
        <View style={styles.bentoSection}>
          {/* Target Muscles */}
          <GlassCard style={styles.musclesCard}>
            <View style={styles.bentoTitleRow}>
              <Activity size={16} color={COLORS.primary} />
              <Text style={styles.bentoTitle}>TARGET MUSCLE GROUPS</Text>
            </View>
            <View style={styles.chipsRow}>
              <View style={[styles.chip, styles.activeChip]}>
                <Text style={[styles.chipText, styles.activeChipText]}>{exercise.muscleGroup}</Text>
              </View>
              {exercise.id === 'barbell-back-squat' && (
                <>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Glutes</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Hamstrings</Text>
                  </View>
                </>
              )}
              {exercise.id === 'dumbbell-chest-press' && (
                <>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Triceps</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Shoulders</Text>
                  </View>
                </>
              )}
              {exercise.id === 'deadlift' && (
                <>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Glutes</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Lower Back</Text>
                  </View>
                </>
              )}
            </View>
          </GlassCard>

          {/* Dual Column Bento Cells */}
          <View style={styles.dualRow}>
            {/* Equipment Card */}
            <GlassCard style={styles.equipmentCard}>
              <Text style={styles.bentoLabel}>EQUIPMENT</Text>
              {exercise.equipment.map((item, index) => (
                <Text key={index} style={styles.equipmentText}>{item}</Text>
              ))}
            </GlassCard>

            {/* Effort/Intensity progress tracker */}
            <GlassCard style={styles.intensityCard}>
              <View style={styles.progressWrapper}>
                <Svg style={styles.svgProgress} viewBox="0 0 36 36">
                  {/* Background Track */}
                  <Path
                    stroke="#231F20"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Active Track (intensity effort index) */}
                  <Path
                    stroke={COLORS.primary}
                    strokeWidth="3.5"
                    strokeDasharray={`${exercise.intensity * 10}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </Svg>
                <View style={styles.progressInnerValue}>
                  <Text style={styles.progressValueText}>{exercise.intensity}</Text>
                </View>
              </View>
              <Text style={styles.intensityLabel}>INTENSITY</Text>
            </GlassCard>
          </View>
        </View>

        {/* Step-by-Step Guide */}
        <View style={styles.section}>
          <View style={styles.guideHeader}>
            <View style={styles.guideAccentLine} />
            <Text style={styles.sectionTitle}>Step-by-Step Guide</Text>
          </View>

          <View style={styles.stepsList}>
            {steps.map((step, idx) => (
              <View key={step.num} style={[styles.stepItem, idx === steps.length - 1 && styles.lastStepItem]}>
                <Text style={styles.stepNum}>{step.num}</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Anatomical Focus Indicator */}
        <View style={styles.section}>
          <GlassCard style={styles.anatomyCard}>
            <View style={styles.anatomyHeader}>
              <Text style={styles.anatomyTitle}>ANATOMICAL FOCUS</Text>
              <Info size={18} color={COLORS.primary} />
            </View>
            <View style={styles.silhouetteArea}>
              {/* Silhouette representation */}
              <View style={styles.silhouetteBack}>
                <Text style={styles.anatomySilhouetteSymbol}>👤</Text>
              </View>

              {/* Hotspots */}
              {/* Primary Hotspot */}
              {exercise.primaryHotspot && (
                <View
                  style={[
                    styles.primaryHotspot,
                    {
                      top: `${exercise.primaryHotspot.top}%` as any,
                      left: `${exercise.primaryHotspot.left}%` as any,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [{ scale: pulseScale }],
                        opacity: pulseScale === 1 ? 0.8 : 0.2,
                      },
                    ]}
                  />
                  <View style={styles.solidDotYellow} />
                  <View style={styles.tooltipBox}>
                    <Text style={styles.tooltipText}>{exercise.primaryHotspot.label}</Text>
                  </View>
                </View>
              )}

              {/* Secondary Hotspot */}
              {exercise.secondaryHotspot && (
                <View
                  style={[
                    styles.secondaryHotspot,
                    {
                      top: `${exercise.secondaryHotspot.top}%` as any,
                      left: `${exercise.secondaryHotspot.left}%` as any,
                    },
                  ]}
                >
                  <View style={styles.solidDotWhite} />
                  <View style={[styles.tooltipBox, styles.tooltipSecondary]}>
                    <Text style={styles.tooltipTextMuted}>
                      {exercise.secondaryHotspot.label}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Floating Action Button (START SET) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: '/workout/active',
            params: { exerciseId: exercise.id },
          } as any)
        }
        style={styles.fabStartSet}
      >
        <Play size={18} color="#000000" fill="#000000" />
        <Text style={styles.fabStartSetText}>START SET</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
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
  scrollContent: {
    paddingBottom: 120, // Space for FAB
  },
  heroSection: {
    height: 440,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Gradient replicated using linear background depth overlay
    borderBottomWidth: 200,
    borderBottomColor: '#000000',
    opacity: 0.85,
    marginTop: 240,
  },
  heroInfo: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  bentoSection: {
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  musclesCard: {
    padding: 16,
    gap: 12,
  },
  bentoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bentoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeChip: {
    borderColor: 'rgba(204, 255, 0, 0.4)',
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  equipmentCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 4,
  },
  bentoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  equipmentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  intensityCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressWrapper: {
    width: 60,
    height: 60,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgProgress: {
    ...StyleSheet.absoluteFillObject,
  },
  progressInnerValue: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'System',
  },
  intensityLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 16,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guideAccentLine: {
    width: 24,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  stepsList: {
    gap: 4,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  lastStepItem: {
    borderBottomWidth: 0,
  },
  stepNum: {
    fontSize: 40,
    fontWeight: '900',
    color: 'rgba(204, 255, 0, 0.15)',
    lineHeight: 44,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  anatomyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  anatomyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  anatomyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  silhouetteArea: {
    height: 240,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  silhouetteBack: {
    opacity: 0.15,
  },
  anatomySilhouetteSymbol: {
    fontSize: 120,
    color: COLORS.primary,
  },
  primaryHotspot: {
    position: 'absolute',
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solidDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  secondaryHotspot: {
    position: 'absolute',
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solidDotWhite: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  tooltipBox: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
  },
  tooltipSecondary: {
    backgroundColor: COLORS.surfaceCard,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    width: 130,
  },
  tooltipText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  tooltipTextMuted: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  fabStartSet: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 40,
  },
  fabStartSetText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
