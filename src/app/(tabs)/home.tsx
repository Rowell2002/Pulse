import { useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Check, Droplet, Dumbbell, Flame, MapPin, Play, Utensils, Moon, Heart, Activity, Camera } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { TrainerDashboard } from '../../components/TrainerDashboard';
import { VitalityRing } from '../../components/VitalityRing';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';

const { width } = Dimensions.get('window');

const MOCK_LATEST_PHOTOS = {
  date: '2026-05-18',
  front: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYhKoiAselBiCxRBlzyYMw8xWps4s8qVztGHesADBVYrQk1g5ezkzbi4LjSODMnrMs7yWAWbrVv2jDRH1xVHRXCyb4fokO1k7MR37FiVKEy6wb3gwNawbNjEo8V674fDzvOYaqmqDBEvjM1Tac8mptP7lO1tcKzAhb4xYPmfSt_YeD-oely4V3Ehf-qhPgUh31t6zlxbg_TmyQOy552gi2g-Grdlinw_hS_aMfkFYGfoJiRaMI0QMmyXaJhcAXQvQKbb4VGrDamVbM',
  side: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjJrCKDiFz78HKuK8zbLpR2UXF6wppruzUsLGo8CE1HR8m04G6JKeYPp9cNJRz6oCzailuMycfgP-ReOIk0F3vYe86fFqhTDi58uP3OA0qP--skBmMNAL24UPrNPArWtRXN-SRdkB5-__GMon1teys8JBk2NPjd3SuU4OMs9DwLpZkzxkrD-Xo6rV84L22Mr_2J7JmXIVlIt8SREAbEly6uNR7wyDO0W7fvO1FkbaEp31vYs18wWPlWzihENSDVhOwYs2XmZaNjUbu',
  back: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUv18p0HP1nbaX8Zd4Sg5TnYmfIvejB-9wUNq6acP6TNcWTu_gx1SE0vKK5Gm89GnxzW0ineEZhsDmYEqBywq35LD0q2rYM4uE80gcPLpM-bsgimSFUfzdv1Qf9XddZsOfztWw33vCpgl2TRLBPNiB0EVpiNOSWU8mXgtsUV9yNyYQ3dSU8e_6dUDaI9x9Ug55ieDU4pES7NzX8PyyxyqCjrVy3NiVuT2WXiUEQe3G_UjR7RMoYYPQNYaYaJyIVzNyrJPazrGt2Jp_',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { userData } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);

  const [assignedExercises, setAssignedExercises] = useState<any[]>([]);
  const [loadingFocus, setLoadingFocus] = useState(true);
  const [completedWorkoutsToday, setCompletedWorkoutsToday] = useState<any[]>([]);
  const [trainerData, setTrainerData] = useState<any>(null);
  const [latestPhotos, setLatestPhotos] = useState<{ date: string; front?: string; side?: string; back?: string } | null>(null);
  const [latestWeight, setLatestWeight] = useState<{ weight: number; date: string } | null>(null);

  // Subscribe to progress photos
  useEffect(() => {
    if (!userData?.uid || userData?.role === 'trainer') return;
    const q = query(
      collection(db, 'users', userData.uid, 'progress_photos'),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnap) => {
      const list: any[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      if (list.length > 0) {
        const latestDate = list[0].date;
        const group = list.filter((p: any) => p.date === latestDate);
        setLatestPhotos({
          date: latestDate,
          front: group.find((p: any) => p.angle === 'front')?.url,
          side: group.find((p: any) => p.angle === 'side')?.url,
          back: group.find((p: any) => p.angle === 'back')?.url,
        });
      } else {
        setLatestPhotos(MOCK_LATEST_PHOTOS);
      }
    });
    return unsubscribe;
  }, [userData?.uid, userData?.role]);

  // Subscribe to weight history
  useEffect(() => {
    if (!userData?.uid || userData?.role === 'trainer') return;
    const q = query(
      collection(db, 'users', userData.uid, 'weight_history'),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnap) => {
      const list: any[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      if (list.length > 0) {
        setLatestWeight({
          weight: list[0].weight,
          date: list[0].date,
        });
      } else {
        // Fallback default from screenshot
        setLatestWeight({
          weight: 82.05,
          date: '2026-05-18',
        });
      }
    });
    return unsubscribe;
  }, [userData?.uid, userData?.role]);

  const formatLatestPhotoDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIndex < 0 || monthIndex > 11 || isNaN(day)) return dateString;
    return `${day} ${months[monthIndex]} ${parts[0]}`; // e.g. "18 May 2026"
  };

  // Step tracker states
  const [baselineSteps, setBaselineSteps] = useState(0);
  const [sessionSteps, setSessionSteps] = useState(0);

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

  // Real-time Pedometer sensors step counting
  useEffect(() => {
    if (userData?.role === 'trainer') return;

    let subscription: any = null;

    Pedometer.isAvailableAsync().then(
      (available) => {
        if (available) {
          // Query steps taken today since midnight
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();

          Pedometer.getStepCountAsync(start, end).then(
            (result) => {
              setBaselineSteps(result.steps);
            },
            (error) => {
              console.warn('[Pedometer] Failed to query baseline steps:', error);
              setBaselineSteps(8420); // Fallback mock steps for emulator
            }
          );

          // Subscribe to live steps while app is active
          subscription = Pedometer.watchStepCount((result) => {
            setSessionSteps(result.steps);
          });
        } else {
          setBaselineSteps(8420); // Fallback mock steps for simulators
        }
      },
      (error) => {
        console.warn('[Pedometer] Error checking pedometer availability:', error);
        setBaselineSteps(8420); // Fallback mock steps
      }
    );

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [userData?.role]);

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
    ? `Assigned: ${assignedExercises[0].sets} Sets x ${assignedExercises[0].reps} Reps @ ${assignedExercises[0].weight} ${assignedExercises[0].unit || 'lbs'}`
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
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <>
                <Text style={styles.bentoTitle}>{focusTitle}</Text>
                <Text style={styles.bentoMeta}>{focusMeta}</Text>
              </>
            )}
          </View>
          <View style={styles.playButton}>
            <Play size={28} color={colors.textAccent} fill={colors.textAccent} />
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
              color={colors.primary}
              icon={<Flame size={20} color={colors.primary} />}
            />
            <Text style={styles.ringLabel}>Calories</Text>
            <Text style={styles.ringValue}>{caloriesBurned} kcal</Text>
          </View>

          {/* Protein */}
          <View style={styles.ringCell}>
            <VitalityRing
              progress={0.61}
              color={colors.secondary}
              icon={<Utensils size={20} color={colors.secondary} />}
            />
            <Text style={styles.ringLabel}>Protein</Text>
            <Text style={styles.ringValue}>92g / 150g</Text>
          </View>

          {/* Water */}
          <View style={styles.ringCell}>
            <VitalityRing
              progress={0.7}
              color={colors.tertiary}
              icon={<Droplet size={20} color={colors.tertiary} />}
            />
            <Text style={styles.ringLabel}>Water</Text>
            <Text style={styles.ringValue}>2.1L / 3L</Text>
          </View>
        </View>
      </GlassCard>

      {/* Habit Tracker */}
      <View style={styles.habitsSection}>
        <Text style={styles.sectionTitle}>Active Habits</Text>
        <View style={styles.habitsGrid}>
          {/* Habit 1 — Workout */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/workouts')}
            style={styles.habitTouchTarget}
          >
            <GlassCard style={styles.habitCard}>
              <View style={styles.habitIconWrapper}>
                <Dumbbell size={18} color={colors.textMuted} />
              </View>
              <View style={styles.habitMeta}>
                <Text style={styles.habitTitle}>Workout</Text>
                <View style={styles.habitStatusRow}>
                  {completedWorkoutsToday.length > 0 ? (
                    <>
                      <Check size={14} color={colors.primary} />
                      <Text style={[styles.habitStatusText, { color: colors.primary, fontWeight: '600' }]}>Done</Text>
                    </>
                  ) : (
                    <Text style={styles.habitStatusText}>Not started</Text>
                  )}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Habit 2 — Steps */}
          <View style={styles.habitTouchTarget}>
            <GlassCard style={styles.habitCard}>
              <View style={styles.habitIconWrapper}>
                <Flame size={18} color={colors.textMuted} />
              </View>
              <View style={styles.habitMeta}>
                <Text style={styles.habitTitle}>Steps</Text>
                <Text style={styles.habitStatusText}>
                  {((baselineSteps + sessionSteps) || 0).toLocaleString()} / 10k
                </Text>
              </View>
            </GlassCard>
          </View>
        </View>
      </View>

      {/* My Progress Bento Grid Section (Matches Dashboard.jpg) */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>My Progress</Text>
          <Text style={styles.progressMeta}>Last synced: 7:51 AM, Today</Text>
        </View>

        <View style={styles.progressGrid}>
          <View style={styles.progressRow}>
            {/* Body Weight Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.progressCardTouchable}
              onPress={() => router.push('/profile/weight' as any)}
            >
              <GlassCard style={styles.progressCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>Body Weight</Text>
                  <Activity size={16} color={colors.secondary} />
                </View>
                {latestWeight ? (
                  <Text style={styles.cardDate}>{formatLatestPhotoDate(latestWeight.date)}</Text>
                ) : (
                  <Text style={styles.cardDate}>Today</Text>
                )}
                <Text style={styles.cardValue}>
                  {latestWeight ? latestWeight.weight.toFixed(2) : '82.05'}{' '}
                  <Text style={styles.cardUnitText}>{(userData?.settings?.weightUnit || 'kg').toLowerCase()}</Text>
                </Text>
                <View style={styles.weightWave} />
              </GlassCard>
            </TouchableOpacity>

            {/* Photos Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.progressCardTouchable}
              onPress={() => router.push('/profile/photos' as any)}
            >
              <GlassCard style={styles.progressCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>Photos</Text>
                  <Camera size={16} color={colors.primary} />
                </View>
                {latestPhotos ? (
                  <>
                    <Text style={styles.cardDate}>{formatLatestPhotoDate(latestPhotos.date)}</Text>
                    <View style={styles.thumbRow}>
                      {latestPhotos.front ? (
                        <Image source={{ uri: latestPhotos.front }} style={styles.thumbMini} />
                      ) : (
                        <View style={styles.thumbMiniPlaceholder} />
                      )}
                      {latestPhotos.side ? (
                        <Image source={{ uri: latestPhotos.side }} style={styles.thumbMini} />
                      ) : (
                        <View style={styles.thumbMiniPlaceholder} />
                      )}
                      {latestPhotos.back ? (
                        <Image source={{ uri: latestPhotos.back }} style={styles.thumbMini} />
                      ) : (
                        <View style={styles.thumbMiniPlaceholder} />
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.thumbRowEmpty}>
                    <Text style={styles.cardSubValue}>Tap to upload progress</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>
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
                <MapPin size={12} color={colors.textMuted} />
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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bentoCardWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderGlass,
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
    backgroundColor: colors.primary,
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
    color: colors.textPrimary,
  },
  bentoMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
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
    color: colors.textPrimary,
  },
  vitalityMeta: {
    fontSize: 12,
    color: colors.textMuted,
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
    color: colors.textPrimary,
    marginTop: 4,
  },
  ringValue: {
    fontSize: 11,
    color: colors.textMuted,
  },
  habitsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  habitsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  habitTouchTarget: {
    flex: 1,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    flex: 1,
  },
  habitIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitMeta: {
    gap: 2,
  },
  habitTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  habitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  habitStatusText: {
    fontSize: 10,
    color: colors.textMuted,
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
    backgroundColor: colors.primary,
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
    color: colors.primary,
    letterSpacing: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  upcomingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingLocationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  // My Progress Bento Styles
  progressSection: {
    marginTop: 20,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
  },
  progressMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  progressGrid: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    padding: 14,
    minHeight: 112,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  progressCardTouchable: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  cardSubValue: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardUnitText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.textMuted,
  },
  weightWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFE600', // yellow wave line as in Dashboard.jpg
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  thumbMini: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  thumbMiniPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderStyle: 'dashed',
  },
  thumbRowEmpty: {
    marginTop: 8,
    justifyContent: 'center',
  },
});
