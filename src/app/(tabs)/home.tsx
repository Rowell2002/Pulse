import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Play, Flame, Utensils, Droplet, Check, MapPin } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { VitalityRing } from '../../components/VitalityRing';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { TrainerDashboard } from '../../components/TrainerDashboard';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { userData } = useAuth();

  const [assignedExercises, setAssignedExercises] = useState<any[]>([]);
  const [loadingFocus, setLoadingFocus] = useState(true);
  const [completedWorkoutsToday, setCompletedWorkoutsToday] = useState<any[]>([]);
  const [trainerData, setTrainerData] = useState<any>(null);

  // Subscribe to assigned exercises
  useEffect(() => {
    if (!userData?.uid || userData?.role === 'trainer') return;

    const q = query(
      collection(db, 'users', userData.uid, 'assigned_exercises'),
      orderBy('assignedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: any[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAssignedExercises(list);
        setLoadingFocus(false);
      },
      (err) => {
        console.warn('[Dashboard] Error listing assigned exercises:', err);
        setLoadingFocus(false);
      }
    );

    return unsubscribe;
  }, [userData?.uid, userData?.role]);

  // Subscribe to completed workouts (to compute today's stats)
  useEffect(() => {
    if (!userData?.uid || userData?.role === 'trainer') return;

    const q = query(
      collection(db, 'users', userData.uid, 'completed_workouts'),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const listToday: any[] = [];
        querySnap.forEach((docSnap) => {
          const w = docSnap.data();
          const compDate = w.completedAt?.toDate ? w.completedAt.toDate() : null;
          if (compDate && compDate >= today) {
            listToday.push({ id: docSnap.id, ...w });
          }
        });
        setCompletedWorkoutsToday(listToday);
      },
      (err) => {
        console.warn('[Dashboard] Error listing completed workouts:', err);
      }
    );

    return unsubscribe;
  }, [userData?.uid, userData?.role]);

  // Subscribe to trainer profile
  useEffect(() => {
    if (!userData?.trainerId || userData?.role === 'trainer') {
      setTrainerData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userData.trainerId),
      (docSnap) => {
        if (docSnap.exists()) {
          setTrainerData(docSnap.data());
        } else {
          setTrainerData(null);
        }
      },
      (err) => {
        console.warn('[Dashboard] Error fetching trainer profile:', err);
      }
    );

    return unsubscribe;
  }, [userData?.trainerId, userData?.role]);

  if (userData?.role === 'trainer') {
    return <TrainerDashboard />;
  }

  const getCaloriesBurnedToday = () => {
    let totalCal = 0;
    completedWorkoutsToday.forEach((w) => {
      const timeStr = w.time || '00:00';
      const parts = timeStr.split(':');
      const mins = parts.length > 0 ? parseFloat(parts[0]) || 0 : 0;
      const secs = parts.length > 1 ? parseFloat(parts[1]) || 0 : 0;
      const durationMins = mins + secs / 60;
      totalCal += Math.round(durationMins * 7.5 * 1.3);
    });
    return totalCal;
  };

  const caloriesBurned = getCaloriesBurnedToday();
  const caloriesTarget = 500;
  const caloriesProgress = Math.min(caloriesBurned / caloriesTarget, 1.0);

  // Today's Focus calculations
  const hasAssigned = assignedExercises.length > 0;
  const focusTitle = hasAssigned ? assignedExercises[0].name : "Push Day - Chest Press";
  const focusMeta = hasAssigned
    ? `Assigned: ${assignedExercises[0].sets} Sets x ${assignedExercises[0].reps} Reps @ ${assignedExercises[0].weight} lbs`
    : "45 Min • High Intensity";

  // Upcoming calculations
  const upcomingTitle = hasAssigned ? `Assigned: ${assignedExercises[0].name}` : 'Leg Day';

  // Extract first name for greeting
  const greetingName = userData?.name ? userData.name.split(' ')[0] : 'Athlete';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Greeting Section */}
      <View style={styles.greetingHeader}>
        <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
        <Text style={styles.welcomeTitle}>Good morning, {greetingName}!</Text>
      </View>

      {/* Today's Focus Bento Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (hasAssigned) {
            router.push({
              pathname: '/workout/active',
              params: {
                exerciseId: assignedExercises[0].id,
                sets: assignedExercises[0].sets,
                reps: assignedExercises[0].reps,
                weight: assignedExercises[0].weight,
              },
            } as any);
          } else {
            router.push('/workout/active');
          }
        }}
        style={styles.bentoCardWrapper}
      >
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8TfmuAvQl-2QPMrNRHkhoZY4tDMzga_Nm-jK6VLmjpw4iHV1JRIEqkuC6iPloOr88D6l0SKgnzIhLy9ZKsRF7maC5AwC0Rq5ud0FZ4imgQfLjLbBZtczcMU7R1t6K1Tw2jb7EJgLiZnA76T5CW9Xuj5XpaE5xe1n44NDtsVO_wCwQ-LuhLPzbuKpQcEE1yE15LKVOihomPDAvQfLczmdtLrtkbC4RheP8DOF-mlgNBWoFaycfbp10m1HQYS93ksvJzd_YqltKxESB',
          }}
          style={styles.bentoImage as any}
        />
        <View style={styles.bentoOverlay} />
        <View style={styles.bentoContent}>
          <View style={styles.bentoTextGroup}>
            <View style={styles.bentoTag}>
              <Text style={styles.bentoTagText}>TODAY'S FOCUS</Text>
            </View>
            {loadingFocus ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <>
                <Text style={styles.bentoTitle}>{focusTitle}</Text>
                <Text style={styles.bentoMeta}>{focusMeta}</Text>
              </>
            )}
          </View>
          <View style={styles.playButton}>
            <Play size={28} color="#000000" fill="#000000" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Daily Vitality Progress Rings */}
      <GlassCard style={styles.vitalityCard}>
        <View style={styles.vitalityHeader}>
          <Text style={styles.vitalityTitle}>Daily Vitality</Text>
          <Text style={styles.vitalityMeta}>
            {Math.round((caloriesProgress * 0.4 + 0.35) * 100)}% Complete
          </Text>
        </View>

        <View style={styles.ringsGrid}>
          {/* Calories */}
          <View style={styles.ringCell}>
            <VitalityRing
              progress={caloriesProgress}
              color={COLORS.primary}
              icon={<Flame size={20} color={COLORS.primary} />}
            />
            <Text style={styles.ringLabel}>Calories</Text>
            <Text style={styles.ringValue}>{caloriesBurned} kcal</Text>
          </View>

          {/* Protein */}
          <View style={styles.ringCell}>
            <VitalityRing
              progress={0.61}
              color={COLORS.secondary}
              icon={<Utensils size={20} color={COLORS.secondary} />}
            />
            <Text style={styles.ringLabel}>Protein</Text>
            <Text style={styles.ringValue}>92g / 150g</Text>
          </View>

          {/* Water */}
          <View style={styles.ringCell}>
            <VitalityRing
              progress={0.7}
              color={COLORS.tertiary}
              icon={<Droplet size={20} color={COLORS.tertiary} />}
            />
            <Text style={styles.ringLabel}>Water</Text>
            <Text style={styles.ringValue}>2.1L / 3L</Text>
          </View>
        </View>
      </GlassCard>

      {/* Habit Tracker */}
      <View style={styles.habitsSection}>
        <Text style={styles.sectionTitle}>Active Habits</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.habitsScroll}
        >
          {/* Habit 1 — Workout */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <GlassCard style={styles.habitCard}>
              <View style={styles.habitIconWrapper}>
                <Check size={18} color={completedWorkoutsToday.length > 0 ? COLORS.primary : COLORS.textMuted} />
              </View>
              <View style={styles.habitMeta}>
                <Text style={styles.habitTitle}>Workout</Text>
                <View style={styles.habitStatusRow}>
                  {completedWorkoutsToday.length > 0 ? (
                    <>
                      <Check size={14} color={COLORS.primary} />
                      <Text style={[styles.habitStatusText, { color: COLORS.primary, fontWeight: '600' }]}>Done</Text>
                    </>
                  ) : (
                    <Text style={styles.habitStatusText}>Not started</Text>
                  )}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Habit 2 — Steps */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/search-filters')}
          >
            <GlassCard style={styles.habitCard}>
              <View style={styles.habitIconWrapper}>
                <Flame size={18} color={COLORS.textMuted} />
              </View>
              <View style={styles.habitMeta}>
                <Text style={styles.habitTitle}>Steps</Text>
                <Text style={styles.habitStatusText}>8.4k / 10k</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Habit 3 — Nutrition */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/workout/details')}
          >
            <GlassCard style={styles.habitCard}>
              <View style={styles.habitIconWrapper}>
                <Utensils size={18} color={COLORS.textMuted} />
              </View>
              <View style={styles.habitMeta}>
                <Text style={styles.habitTitle}>Nutrition</Text>
                <Text style={styles.habitStatusText}>Track now</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Upcoming Event */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (userData?.trainerId) {
            router.push('/(tabs)/workouts');
          } else {
            router.push('/profile/settings');
          }
        }}
        style={styles.upcomingWrapper}
      >
        <GlassCard style={styles.upcomingCard}>
          <View style={styles.upcomingBadge} />
          <View style={styles.upcomingContent}>
            <View style={styles.upcomingText}>
              <Text style={styles.upcomingLabel}>
                {userData?.trainerId ? 'UPCOMING SESSION' : 'GET A COACH'}
              </Text>
              <Text style={styles.upcomingTitle}>
                {userData?.trainerId
                  ? `${upcomingTitle} with Coach ${trainerData?.name || 'Sarah'}`
                  : 'Hire a certified personal coach in app settings.'}
              </Text>
              <View style={styles.upcomingLocation}>
                <MapPin size={12} color={COLORS.textMuted} />
                <Text style={styles.upcomingLocationText}>
                  {userData?.trainerId
                    ? (trainerData?.bio || 'Performance Center')
                    : 'PULSE Coaching Network'}
                </Text>
              </View>
            </View>
            <Image
              source={{
                uri: trainerData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOGAaYR94dkcvQEhj7j13nYRIPMjGzrxjFiuIOpsxvcrBnHvdJhpkRFUVnOd8ULMub1aMaJI8ekm7ra6MaIpsjWFuHxmGEUhLgGEZiiP5gxbDU17ZpNbvxCKkLFFaQ_541wA0NZzQD42ZnU4Og1KsVnJcORJ-0IGb2yiA_zRXmGPDC-zaEYImJIA3ieZTjYDgPyQVonJNGMz0uiUlGQxBq1OMiVfZObsCxavyV9SwfrMakRGA1cKLg5kIxKz6x9_-0eYp1dcyr1yiT',
              }}
              style={styles.coachAvatar as any}
            />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  greetingHeader: {
    gap: 4,
    marginTop: 10,
  },
  welcomeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: COLORS.primary,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bentoCardWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  bentoImage: {
    width: '100%',
    height: '100%',
  },
  bentoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bentoContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bentoTextGroup: {
    gap: 6,
    flex: 1,
  },
  bentoTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  bentoTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
  },
  bentoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bentoMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalityCard: {
    padding: 20,
    gap: 20,
  },
  vitalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  vitalityMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  ringsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringCell: {
    alignItems: 'center',
    gap: 6,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  ringValue: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  habitsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  habitsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 140,
    padding: 12,
  },
  habitIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitMeta: {
    gap: 2,
  },
  habitTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  habitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  habitStatusText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  upcomingWrapper: {
    marginBottom: 20,
  },
  upcomingCard: {
    padding: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
  },
  upcomingContent: {
    padding: 16,
    paddingLeft: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  upcomingText: {
    flex: 1,
    gap: 4,
  },
  upcomingLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  upcomingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingLocationText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
});
