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
} from 'react-native';
import { ArrowLeft, ArrowRight, Play, Settings, X, Check } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EXERCISES, PROGRAMS } from '../../constants/exerciseDb';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, userData } = useAuth();
  
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [setWeights, setSetWeights] = useState<string[]>([]);
  const [setReps, setSetReps] = useState<string[]>([]);
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    params.elapsed ? parseInt(params.elapsed as string) || 0 : 0
  );

  const elapsedIntervalRef = useRef<any>(null);
  const restIntervalRef = useRef<any>(null);

  // Load correct exercise based on route parameters
  const exerciseId = params.exerciseId as string;
  const exercise = EXERCISES.find((ex) => ex.id === exerciseId) || EXERCISES[1]; // default to Chest Press (index 1)

  // Find matching program containing the current exercise
  const activeProgram = PROGRAMS.find((p) => p.exercises.includes(exercise.id));
  const exercisePool = activeProgram
    ? activeProgram.exercises.map(id => EXERCISES.find(ex => ex.id === id)!).filter(Boolean)
    : EXERCISES;
  
  const currentPoolIndex = exercisePool.findIndex(ex => ex.id === exercise.id);
  const prevExercise = currentPoolIndex > 0 ? exercisePool[currentPoolIndex - 1] : null;
  const nextExercise = currentPoolIndex < exercisePool.length - 1 ? exercisePool[currentPoolIndex + 1] : null;
  const exerciseDisplayIndex = currentPoolIndex !== -1 ? currentPoolIndex + 1 : 1;
  const exercisePoolLength = exercisePool.length;

  // Initialize weights/reps based on exercise characteristics or assignments
  useEffect(() => {
    // Check if we have serialized progress for the current session
    if (params.sessionProgress) {
      try {
        const progressObj = JSON.parse(params.sessionProgress as string);
        if (progressObj[exercise.id]) {
          const prog = progressObj[exercise.id];
          setSetWeights(prog.setWeights);
          setSetReps(prog.setReps);
          setCompletedSets(prog.completedSets);
          setActiveSetIndex(prog.activeSetIndex);
          return;
        }
      } catch (e) {
        console.warn('[ActiveWorkout] Failed to parse session progress:', e);
      }
    }

    let defaultWeight = '24.0';
    let defaultReps = '12';

    if (params.weight) {
      defaultWeight = params.weight as string;
    } else if (exercise.id.includes('squat')) {
      defaultWeight = '100.0';
    } else if (exercise.id.includes('deadlift')) {
      defaultWeight = '120.0';
    } else if (exercise.id.includes('kettlebell')) {
      defaultWeight = '16.0';
    } else if (exercise.id.includes('plank') || exercise.id.includes('yoga')) {
      defaultWeight = '0.0';
    }

    if (params.reps) {
      defaultReps = params.reps as string;
    } else if (exercise.id.includes('squat')) {
      defaultReps = '8';
    } else if (exercise.id.includes('deadlift')) {
      defaultReps = '5';
    } else if (exercise.id.includes('kettlebell')) {
      defaultReps = '15';
    } else if (exercise.id.includes('plank') || exercise.id.includes('yoga')) {
      defaultReps = '60';
    }

    const setsCount = params.sets ? parseInt(params.sets as string) || 3 : 3;

    setSetWeights(Array(setsCount).fill(defaultWeight));
    setSetReps(Array(setsCount).fill(defaultReps));
    setCompletedSets(Array(setsCount).fill(false));
    setActiveSetIndex(0);
  }, [exercise, params.sets, params.reps, params.weight, params.sessionProgress]);

  // Live session elapsed timer
  useEffect(() => {
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
    };
  }, []);

  // Auto rest timer
  useEffect(() => {
    restIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          return 45; // Reset or stop
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    return `00:${secs.toString().padStart(2, '0')}`;
  };

  const formatElapsed = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleSet = (index: number) => {
    const nextSets = [...completedSets];
    const newCompleted = !nextSets[index];
    nextSets[index] = newCompleted;
    setCompletedSets(nextSets);

    if (newCompleted) {
      // Trigger rest timer
      setTimerSeconds(45);
      
      // Auto advance to next uncompleted set index
      const nextUncompleted = nextSets.findIndex((isComp, idx) => !isComp && idx > index);
      if (nextUncompleted !== -1) {
        setActiveSetIndex(nextUncompleted);
      } else {
        const firstUncompleted = nextSets.findIndex((isComp) => !isComp);
        if (firstUncompleted !== -1) {
          setActiveSetIndex(firstUncompleted);
        }
      }
    }
  };

  const handleFinish = async () => {
    // Clear intervals immediately to freeze elapsed time and stop timer state updates
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }

    // Calculate tracked stats to display in summary
    let totalVolume = 0;
    let maxWeight = 0;
    let completedSetsCount = 0;
    
    completedSets.forEach((isComp, idx) => {
      if (isComp) {
        completedSetsCount++;
        const weight = parseFloat(setWeights[idx]) || 0;
        const reps = parseInt(setReps[idx]) || 0;
        totalVolume += weight * reps;
        if (weight > maxWeight) {
          maxWeight = weight;
        }
      }
    });

    const sessionVolume = totalVolume;
    const sessionMaxWeight = maxWeight;
    const sessionTime = formatElapsed(elapsedSeconds);

    if (user) {
      try {
        const completedWorkoutRef = doc(collection(db, 'users', user.uid, 'completed_workouts'));
        await setDoc(completedWorkoutRef, {
          id: completedWorkoutRef.id,
          exerciseId: exercise.id,
          name: exercise.name,
          category: exercise.category,
          volume: sessionVolume,
          maxWeight: sessionMaxWeight,
          time: sessionTime,
          completedSets: completedSetsCount,
          completedAt: serverTimestamp(),
        });

        // Write notification for the client's assigned trainer
        if (userData?.trainerId) {
          const trainerNotifRef = doc(collection(db, 'users', userData.trainerId, 'notifications'));
          await setDoc(trainerNotifRef, {
            id: trainerNotifRef.id,
            category: 'Training',
            type: 'workout',
            title: 'Client Completed Workout',
            snippet: `${userData?.name || 'Client'} completed ${exercise.name} (${completedSetsCount} sets, volume: ${sessionVolume} lbs, time: ${sessionTime}).`,
            highlight: exercise.name,
            unread: true,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn('[ActiveWorkout] Failed to save completed workout:', err);
      }
    }

    router.replace({
      pathname: '/workout/summary',
      params: { 
        exerciseId: exercise.id,
        volume: sessionVolume,
        maxWeight: sessionMaxWeight,
        time: sessionTime,
        completedSets: completedSetsCount,
      },
    } as any);
  };

  const navigateToExercise = (targetId: string) => {
    // Parse existing session progress
    let sessionProgress: Record<string, any> = {};
    if (params.sessionProgress) {
      try {
        sessionProgress = JSON.parse(params.sessionProgress as string);
      } catch (e) {
        console.warn('[ActiveWorkout] Error parsing sessionProgress:', e);
      }
    }

    // Save current exercise progress
    sessionProgress[exercise.id] = {
      setWeights,
      setReps,
      completedSets,
      activeSetIndex,
    };

    router.replace({
      pathname: '/workout/active',
      params: {
        exerciseId: targetId,
        sessionProgress: JSON.stringify(sessionProgress),
        elapsed: elapsedSeconds.toString(),
        sets: params.sets,
        reps: params.reps,
        weight: params.weight,
      },
    } as any);
  };

  if (completedSets.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={styles.headerCloseBtn}
          >
            <X size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>PULSE</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.elapsedBadge}>
            <Text style={styles.elapsedText}>{formatElapsed(elapsedSeconds)}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.settingsIcon}>
            <Settings size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise Header */}
        <View style={styles.titleSection}>
          <Text style={styles.exerciseIndex}>
            Exercise {exerciseDisplayIndex} of {exercisePoolLength}
          </Text>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        </View>

        {/* Video Player Snapshot */}
        <View style={styles.videoWrapper}>
          <Image
            source={{
              uri: exercise.videoImage || exercise.image,
            }}
            style={styles.videoImage}
          />
          <View style={styles.videoOverlay} />
          <View style={styles.playButtonWrapper}>
            <Play size={28} color="#000000" fill="#000000" />
          </View>
          <View style={styles.guideBadge}>
            <Text style={styles.guideBadgeText}>Technique Guide</Text>
          </View>
        </View>

        {/* Tracking Grid Table */}
        <View style={styles.tableSection}>
          {/* Table Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Set</Text>
            <Text style={[styles.headerCell, { flex: 4, textAlign: 'center' }]}>
              {exercise.id.includes('plank') || exercise.id.includes('yoga') ? 'Hold (lbs)' : 'Weight (kg)'}
            </Text>
            <Text style={[styles.headerCell, { flex: 4, textAlign: 'center' }]}>
              {exercise.id.includes('plank') || exercise.id.includes('yoga') ? 'Time (sec)' : 'Reps'}
            </Text>
            <Text style={[styles.headerCell, { flex: 2, textAlign: 'right' }]}>Done</Text>
          </View>

          {/* Table Data Rows */}
          <View style={styles.rowsList}>
            {completedSets.map((_, idx) => {
              const isActive = activeSetIndex === idx;
              const isCompleted = completedSets[idx];

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => setActiveSetIndex(idx)}
                  style={{ width: '100%' }}
                >
                  <GlassCard
                    active={isActive}
                    style={[
                      styles.row,
                      isActive && styles.activeRow,
                      isCompleted && !isActive && styles.completedRow,
                    ]}
                  >
                    <Text style={[styles.setNumText, isActive && styles.activeSetNum, { flex: 2 }]}>
                      {idx + 1}
                    </Text>

                    {isActive ? (
                      <>
                        <View style={[styles.inputWrapper, { flex: 4 }]}>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={setWeights[idx]}
                            onChangeText={(val) => {
                              const nextWeights = [...setWeights];
                              nextWeights[idx] = val;
                              setSetWeights(nextWeights);
                            }}
                          />
                        </View>
                        <View style={[styles.inputWrapper, { flex: 4 }]}>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={setReps[idx]}
                            onChangeText={(val) => {
                              const nextReps = [...setReps];
                              nextReps[idx] = val;
                              setSetReps(nextReps);
                            }}
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={[styles.inputBoxMock, { flex: 4 }]}>
                          <Text style={styles.inputBoxMockText}>{setWeights[idx]}</Text>
                        </View>
                        <View style={[styles.inputBoxMock, { flex: 4 }]}>
                          <Text style={styles.inputBoxMockText}>{setReps[idx]}</Text>
                        </View>
                      </>
                    )}

                    <TouchableOpacity
                      onPress={() => handleToggleSet(idx)}
                      activeOpacity={0.8}
                      style={[styles.doneContainer, { flex: 2 }]}
                    >
                      {isCompleted ? (
                        <View style={styles.checkedCircleBg}>
                          <Check size={14} color="#000000" strokeWidth={3.5} />
                        </View>
                      ) : (
                        <View style={styles.emptyCircle} />
                      )}
                    </TouchableOpacity>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Resting Timer Panel */}
        <GlassCard style={styles.restTimerCard}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerLabel}>AUTO RESTING TIMER</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setTimerSeconds(45)}>
              <Text style={styles.timerSkipText}>RESET REST</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timerBody}>
            <Text style={styles.timerText}>{formatTimer(timerSeconds)}</Text>
            <View style={styles.timerControls}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setTimerSeconds((p) => p + 15)} style={styles.timerAdjustBtn}>
                <Text style={styles.timerAdjustBtnText}>+15s</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setTimerSeconds((p) => Math.max(15, p - 15))} style={styles.timerAdjustBtn}>
                <Text style={styles.timerAdjustBtnText}>-15s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Fixed bottom controls */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomBarMainRow}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.prevExerciseBtn, !prevExercise && styles.disabledBtn]}
            disabled={!prevExercise}
            onPress={() => prevExercise && navigateToExercise(prevExercise.id)}
          >
            <ArrowLeft size={16} color={prevExercise ? COLORS.textPrimary : COLORS.textMuted} />
            <Text style={[styles.prevExerciseText, !prevExercise && styles.disabledText]}>PREV</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={handleFinish} style={styles.finishWorkoutBtn}>
            <Text style={styles.finishWorkoutText}>FINISH WORKOUT</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.nextExerciseBtn, !nextExercise && styles.disabledBtn]}
            disabled={!nextExercise}
            onPress={() => nextExercise && navigateToExercise(nextExercise.id)}
          >
            <Text style={[styles.nextExerciseText, !nextExercise && styles.disabledText]}>NEXT</Text>
            <ArrowRight size={16} color={nextExercise ? COLORS.textPrimary : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCloseBtn: {
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
  elapsedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  elapsedText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  settingsIcon: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  titleSection: {
    gap: 4,
  },
  exerciseIndex: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  exerciseTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  videoWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  playButtonWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  guideBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableSection: {
    gap: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  headerCell: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rowsList: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  completedRow: {
    opacity: 0.65,
    backgroundColor: 'rgba(204, 255, 0, 0.02)',
    borderColor: 'rgba(204, 255, 0, 0.08)',
  },
  activeRow: {
    borderColor: 'rgba(204, 255, 0, 0.3)',
    backgroundColor: 'rgba(204, 255, 0, 0.03)',
  },
  setNumText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  activeSetNum: {
    color: COLORS.primary,
  },
  inputBoxMock: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
    marginHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inputBoxMockText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    height: 36,
    marginHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  input: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    height: '100%',
    padding: 0,
  },
  doneContainer: {
    alignItems: 'flex-end',
  },
  checkedCircleBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  restTimerCard: {
    padding: 16,
    gap: 12,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  timerSkipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timerBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timerAdjustBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerAdjustBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0E0E0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomBarMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prevExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  prevExerciseText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  finishWorkoutBtn: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishWorkoutText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nextExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nextExerciseText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  disabledBtn: {
    opacity: 0.3,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});
