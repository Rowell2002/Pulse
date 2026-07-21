import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Calendar, Dumbbell, Play, Timer } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EXERCISES } from '../../constants/exerciseDb';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const MOCK_WORKOUTS_DATABASE: { [key: string]: any[] } = {
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

export default function AssignedWorkoutDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);

  const workoutName = (params.workoutName as string) || 'Trainer Workout';
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'assigned_exercises'),
      orderBy('assignedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: any[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Filter in JS for robustness & index independence
        let filtered = list.filter(
          (asg) => (asg.workoutName || 'Trainer Workout') === workoutName
        );

        if (filtered.length === 0 && MOCK_WORKOUTS_DATABASE[workoutName]) {
          filtered = MOCK_WORKOUTS_DATABASE[workoutName];
        }

        setExercises(filtered);
        setLoading(false);
      },
      (err) => {
        console.warn('[AssignedDetails] Error loading exercises:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, workoutName]);

  const handleStartWorkout = () => {
    router.push({
      pathname: '/workout/assigned_active',
      params: { workoutName },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Calculate total sets of the workout
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0);
  const totalExercises = exercises.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workoutName}</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.calendarButton}>
          <Calendar size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {totalExercises > 0 ? (
          <>
            {/* Workout Summary Badge */}
            <View style={styles.supersetHeader}>
              <Text style={styles.supersetText}>
                Workout of {totalSets} sets • {totalExercises} Exercises
              </Text>
            </View>

            {/* Exercises List */}
            <View style={styles.exerciseList}>
              {exercises.map((asg, idx) => {
                // Find image from exerciseDb
                const localEx = EXERCISES.find((ex) => ex.id === asg.id);
                const imageUri = localEx?.image || 'https://via.placeholder.com/150';

                return (
                  <View key={asg.id} style={styles.exerciseItemContainer}>
                    <GlassCard style={styles.exerciseCard}>
                      <Image source={{ uri: imageUri }} style={styles.exerciseImage} />
                      <View style={styles.exerciseMeta}>
                        <Text style={styles.exerciseName}>{asg.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {asg.sets} sets x {asg.reps} reps • {asg.weight} {asg.unit || 'lbs'}
                        </Text>
                      </View>
                    </GlassCard>

                    {/* Rest between exercises UI (simulating the screenshot style) */}
                    {idx < totalExercises - 1 && (
                      <View style={styles.dividerRow}>
                        <Timer size={14} color={colors.textMuted} />
                        <Text style={styles.dividerText}>Rest for 60s between exercises</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Repeat set footer item to match the screenshot */}
              <View style={styles.repeatSetRow}>
                <Text style={styles.repeatSetText}>🔄 Repeat new set</Text>
              </View>
            </View>
          </>
        ) : (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No exercises assigned to this workout.</Text>
          </GlassCard>
        )}
      </ScrollView>

      {/* Floating/Fixed Start Button at bottom */}
      {totalExercises > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartWorkout}
            style={styles.startButton}
          >
            <Play size={18} color="#000000" fill="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.startButtonText}>Start Now</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  calendarButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Safe padding for bottom bar
  },
  supersetHeader: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 20,
  },
  supersetText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  exerciseList: {
    gap: 16,
  },
  exerciseItemContainer: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  exerciseImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surfaceCard,
  },
  exerciseMeta: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  exerciseDetails: {
    fontSize: 13,
    color: colors.textMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  repeatSetRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  repeatSetText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
    borderTopWidth: 1,
    borderTopColor: colors.borderGlass,
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    color: colors.textAccent,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
