import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Check, Timer, MessageSquare, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EXERCISES } from '../../constants/exerciseDb';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, setDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from 'firebase/firestore';

const MOCK_WORKOUTS_DATABASE: { [key: string]: any[] } = {
  'Chest Workout': [
    { id: 'dumbbell-chest-press', name: 'Dumbbell Chest Press', sets: 4, reps: 10, weight: 20, unit: 'lbs', workoutName: 'Chest Workout' },
    { id: 'bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: 12, unit: 'lbs', workoutName: 'Chest Workout' }
  ],
  'Back Workout': [
    { id: 'pull-up', name: 'Bodyweight Pull-Up', sets: 4, reps: 8, weight: 0, unit: 'lbs', workoutName: 'Back Workout' },
    { id: 'deadlift', name: 'Conventional Barbell Deadlift', sets: 3, reps: 5, weight: 100, unit: 'lbs', workoutName: 'Back Workout' }
  ],
  'Legs Workout': [
    { id: 'barbell-back-squat', name: 'Barbell Back Squat', sets: 4, reps: 8, weight: 80, unit: 'lbs', workoutName: 'Legs Workout' },
    { id: 'kettlebell-swing', name: 'Russian Kettlebell Swing', sets: 3, reps: 15, weight: 16, unit: 'lbs', workoutName: 'Legs Workout' }
  ],
  'Full Body Conditioning': [
    { id: 'barbell-back-squat', name: 'Barbell Back Squat', sets: 3, reps: 10, weight: 60, unit: 'lbs', workoutName: 'Full Body Conditioning' },
    { id: 'dumbbell-chest-press', name: 'Dumbbell Chest Press', sets: 3, reps: 10, weight: 15, unit: 'lbs', workoutName: 'Full Body Conditioning' },
    { id: 'plank', name: 'Forearm Core Plank', sets: 3, reps: 60, weight: 0, unit: 'lbs', workoutName: 'Full Body Conditioning' }
  ]
};

const { width } = Dimensions.get('window');

export default function AssignedActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, userData } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);

  const workoutName = (params.workoutName as string) || 'Trainer Workout';
  const weightUnit = (userData?.settings?.weightUnit || 'lbs').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [autoFill, setAutoFill] = useState(false);

  // Stats state: { [exerciseId]: { weights: string[], reps: string[] } }
  const [stats, setStats] = useState<{
    [exerciseId: string]: {
      weights: string[];
      reps: string[];
    };
  }>({});

  // History state: { [exerciseId]: { weights: string[], reps: string[] } }
  const [history, setHistory] = useState<{
    [exerciseId: string]: {
      weights: string[];
      reps: string[];
    };
  }>({});

  // Timers state for rest timers per set: { [setIndex]: number } (seconds left)
  const [restTimers, setRestTimers] = useState<{ [setIndex: number]: number }>({});
  const timerIntervalsRef = useRef<{ [setIndex: number]: any }>({});

  // Total session timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedIntervalRef = useRef<any>(null);

  // Load exercises & user history
  useEffect(() => {
    if (!user) return;

    // Start total elapsed timer
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const loadData = async () => {
      try {
        // 1. Fetch assigned exercises
        const q = query(
          collection(db, 'users', user.uid, 'assigned_exercises'),
          orderBy('assignedAt', 'desc')
        );
        const querySnap = await getDocs(q);
        const list: any[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        let filtered = list.filter(
          (asg) => (asg.workoutName || 'Trainer Workout') === workoutName
        );

        if (filtered.length === 0 && MOCK_WORKOUTS_DATABASE[workoutName]) {
          filtered = MOCK_WORKOUTS_DATABASE[workoutName];
        }

        setExercises(filtered);

        // 2. Fetch history for each exercise to show "Previous" and enable auto-fill
        const historyData: typeof history = {};
        const initialStats: typeof stats = {};

        for (const ex of filtered) {
          const histQuery = query(
            collection(db, 'users', user.uid, 'completed_workouts'),
            where('exerciseId', '==', ex.id),
            orderBy('completedAt', 'desc'),
            limit(1)
          );
          const histSnap = await getDocs(histQuery);
          
          let prevWeights: string[] = [];
          let prevReps: string[] = [];

          if (!histSnap.empty) {
            const lastWorkout = histSnap.docs[0].data();
            prevWeights = lastWorkout.weights || [];
            prevReps = lastWorkout.reps || [];
          }

          historyData[ex.id] = {
            weights: prevWeights,
            reps: prevReps,
          };

          // Initialize stats as empty strings
          initialStats[ex.id] = {
            weights: Array(ex.sets || 3).fill(''),
            reps: Array(ex.sets || 3).fill(''),
          };
        }

        setHistory(historyData);
        setStats(initialStats);
        setLoading(false);
      } catch (err) {
        console.warn('[AssignedActive] Error loading screen data:', err);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      // Clean up all running rest timers
      Object.values(timerIntervalsRef.current).forEach((interval) => clearInterval(interval));
    };
  }, [user, workoutName]);

  // Handle auto fill toggle change
  const handleToggleAutoFill = (value: boolean) => {
    setAutoFill(value);
    
    const newStats = { ...stats };
    exercises.forEach((ex) => {
      const hist = history[ex.id];
      const setsCount = ex.sets || 3;

      if (value) {
        // Autofill: Use history if exists, else fall back to trainer targets
        const filledWeights = Array(setsCount).fill('');
        const filledReps = Array(setsCount).fill('');

        for (let i = 0; i < setsCount; i++) {
          filledWeights[i] = hist?.weights?.[i] || hist?.weights?.[0] || String(ex.weight || '0');
          filledReps[i] = hist?.reps?.[i] || hist?.reps?.[0] || String(ex.reps || '10');
        }

        newStats[ex.id] = {
          weights: filledWeights,
          reps: filledReps,
        };
      } else {
        // Clear inputs when toggled off
        newStats[ex.id] = {
          weights: Array(setsCount).fill(''),
          reps: Array(setsCount).fill(''),
        };
      }
    });

    setStats(newStats);
  };

  // Start rest timer for a set
  const startRestTimer = (setIndex: number) => {
    // Clear existing timer if any
    if (timerIntervalsRef.current[setIndex]) {
      clearInterval(timerIntervalsRef.current[setIndex]);
    }

    setRestTimers((prev) => ({ ...prev, [setIndex]: 60 }));

    timerIntervalsRef.current[setIndex] = setInterval(() => {
      setRestTimers((prev) => {
        const left = prev[setIndex];
        if (left <= 1) {
          clearInterval(timerIntervalsRef.current[setIndex]);
          delete timerIntervalsRef.current[setIndex];
          const newTimers = { ...prev };
          delete newTimers[setIndex];
          return newTimers;
        }
        return { ...prev, [setIndex]: left - 1 };
      });
    }, 1000);
  };

  // Helper to format elapsed workout time
  const formatElapsed = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Save/Finish workout handler
  const handleSaveWorkout = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const timeStr = formatElapsed(elapsedSeconds);
      let anySetsCompleted = false;

      // 1. Loop through each exercise and save to completed_workouts
      for (const ex of exercises) {
        const exStats = stats[ex.id];
        if (!exStats) continue;

        let completedSetsCount = 0;
        let totalVolume = 0;
        let maxWeight = 0;
        const validWeights: string[] = [];
        const validReps: string[] = [];

        exStats.weights.forEach((wStr, idx) => {
          const rStr = exStats.reps[idx];
          const weight = parseFloat(wStr) || 0;
          const reps = parseInt(rStr) || 0;

          validWeights.push(wStr || '0');
          validReps.push(rStr || '0');

          if (reps > 0) {
            completedSetsCount++;
            totalVolume += weight * reps;
            if (weight > maxWeight) {
              maxWeight = weight;
            }
          }
        });

        if (completedSetsCount > 0) {
          anySetsCompleted = true;
          const completedWorkoutRef = doc(collection(db, 'users', user.uid, 'completed_workouts'));
          
          await setDoc(completedWorkoutRef, {
            id: completedWorkoutRef.id,
            exerciseId: ex.id,
            name: ex.name,
            category: ex.category || 'Strength',
            volume: totalVolume,
            maxWeight: maxWeight,
            time: timeStr,
            completedSets: completedSetsCount,
            completedAt: serverTimestamp(),
            weights: validWeights,
            reps: validReps,
            workoutName: workoutName,
          });
        }
      }

      if (!anySetsCompleted) {
        Alert.alert('No Stats Recorded', 'Please fill in reps and weight for at least one set before saving.');
        setSaving(false);
        return;
      }

      // 2. Notify trainer if they have one
      if (userData?.trainerId) {
        const trainerNotifRef = doc(collection(db, 'users', userData.trainerId, 'notifications'));
        await setDoc(trainerNotifRef, {
          id: trainerNotifRef.id,
          category: 'Training',
          type: 'workout',
          title: 'Client Completed Workout',
          snippet: `${userData?.name || 'Client'} completed workout "${workoutName}" in ${timeStr}.`,
          highlight: workoutName,
          unread: true,
          createdAt: serverTimestamp(),
        });
      }

      // 3. Clear timers
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      Object.values(timerIntervalsRef.current).forEach((interval) => clearInterval(interval));

      // 4. Navigate to summary (using first exercise as banner details)
      router.replace({
        pathname: '/workout/summary',
        params: {
          exerciseId: exercises[0]?.id || 'dumbbell-chest-press',
          time: timeStr,
          completedSets: '1', // dummy count for volume render trigger
          volume: '0',
          maxWeight: '0',
        },
      } as any);

    } catch (err) {
      console.warn('[AssignedActive] Failed to save workout:', err);
      Alert.alert('Error', 'Could not save your workout to database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Find max sets to render the Set blocks
  const maxSets = Math.max(...exercises.map((ex) => ex.sets || 3), 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{workoutName}</Text>
          <Text style={styles.elapsedText}>{formatElapsed(elapsedSeconds)}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
            <Timer size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
            <MessageSquare size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
            <MoreVertical size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSaveWorkout}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Auto fill stats toggle bar */}
        <GlassCard style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleLabel}>Auto fill stats</Text>
              <TouchableOpacity activeOpacity={0.7} style={styles.helpBadge}>
                <Text style={styles.helpText}>?</Text>
              </TouchableOpacity>
            </View>
            <Switch
              value={autoFill}
              onValueChange={handleToggleAutoFill}
              trackColor={{ false: '#393939', true: colors.primary }}
              thumbColor={autoFill ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#393939"
            />
          </View>
        </GlassCard>

        {/* Subtitle */}
        <Text style={styles.workoutSubtitle}>Workout of {maxSets} sets</Text>

        {/* Set-by-Set Blocks */}
        {Array.from({ length: maxSets }).map((_, setIdx) => {
          return (
            <View key={setIdx} style={styles.setSection}>
              <Text style={styles.setSectionTitle}>Set {setIdx + 1}</Text>

              {exercises.map((ex) => {
                // Check if this exercise has this set
                if (setIdx >= (ex.sets || 3)) return null;

                const localEx = EXERCISES.find((e) => e.id === ex.id);
                const imageUri = localEx?.image || 'https://via.placeholder.com/150';

                // Get previous values for display
                const hist = history[ex.id];
                const prevWeight = hist?.weights?.[setIdx] || hist?.weights?.[0] || '';
                const prevReps = hist?.reps?.[setIdx] || hist?.reps?.[0] || '';
                const prevDisplay = prevWeight && prevReps ? `${prevReps} x ${prevWeight} kg` : 'None';

                return (
                  <GlassCard key={ex.id} style={styles.exerciseTrackerCard}>
                    {/* Exercise title & thumbnail */}
                    <View style={styles.exHeader}>
                      <Image source={{ uri: imageUri }} style={styles.exImage} />
                      <View style={styles.exMeta}>
                        <Text style={styles.exName}>{ex.name}</Text>
                        <Text style={styles.exTarget}>-reps {ex.reps}</Text>
                      </View>
                    </View>

                    {/* Stats Logger Table Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.prevCol}>
                        <Text style={styles.statLabel}>Previous</Text>
                        <Text style={styles.prevValue}>{prevDisplay}</Text>
                      </View>

                      <View style={styles.inputCol}>
                        <Text style={styles.statLabel}>Reps</Text>
                        <TextInput
                          style={styles.statInput}
                          keyboardType="numeric"
                          placeholder={String(ex.reps)}
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={stats[ex.id]?.reps?.[setIdx] || ''}
                          onChangeText={(val) => {
                            const newStats = { ...stats };
                            if (!newStats[ex.id]) {
                              newStats[ex.id] = {
                                weights: Array(ex.sets || 3).fill(''),
                                reps: Array(ex.sets || 3).fill(''),
                              };
                            } else {
                              newStats[ex.id] = {
                                weights: [...(newStats[ex.id].weights || Array(ex.sets || 3).fill(''))],
                                reps: [...(newStats[ex.id].reps || Array(ex.sets || 3).fill(''))],
                              };
                            }
                            newStats[ex.id].reps[setIdx] = val;
                            setStats(newStats);
                          }}
                        />
                      </View>

                      <View style={styles.inputCol}>
                        <Text style={styles.statLabel}>Kg</Text>
                        <TextInput
                          style={styles.statInput}
                          keyboardType="numeric"
                          placeholder={String(ex.weight || '0')}
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={stats[ex.id]?.weights?.[setIdx] || ''}
                          onChangeText={(val) => {
                            const newStats = { ...stats };
                            if (!newStats[ex.id]) {
                              newStats[ex.id] = {
                                weights: Array(ex.sets || 3).fill(''),
                                reps: Array(ex.sets || 3).fill(''),
                              };
                            } else {
                              newStats[ex.id] = {
                                weights: [...(newStats[ex.id].weights || Array(ex.sets || 3).fill(''))],
                                reps: [...(newStats[ex.id].reps || Array(ex.sets || 3).fill(''))],
                              };
                            }
                            newStats[ex.id].weights[setIdx] = val;
                            setStats(newStats);
                          }}
                        />
                      </View>
                    </View>
                  </GlassCard>
                );
              })}

              {/* Set Rest Timer Button */}
              <View style={styles.restRow}>
                <View style={styles.restLeft}>
                  <Text style={styles.restText}>
                    {restTimers[setIdx] !== undefined
                      ? `Resting... ${restTimers[setIdx]}s`
                      : 'Rest for 60s'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => startRestTimer(setIdx)}
                  style={styles.restStartBtn}
                >
                  <Timer size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.restStartText}>
                    {restTimers[setIdx] !== undefined ? 'Restart' : 'Start'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  headerBtn: {
    paddingVertical: 6,
  },
  cancelText: {
    color: colors.error || '#FFB4AB',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  elapsedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  saveText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },
  toggleCard: {
    padding: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  helpBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  workoutSubtitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setSection: {
    gap: 12,
    marginBottom: 8,
  },
  setSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  exerciseTrackerCard: {
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.surfaceCard,
  },
  exMeta: {
    flex: 1,
    gap: 2,
  },
  exName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  exTarget: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  prevCol: {
    flex: 5,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  prevValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  inputCol: {
    flex: 3,
  },
  statInput: {
    height: 36,
    borderRadius: 6,
    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 0,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    marginBottom: 10,
  },
  restLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  restStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  restStartText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
