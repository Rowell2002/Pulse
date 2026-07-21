import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Search, Play, SlidersHorizontal, Dumbbell } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { PROGRAMS, Program } from '../../constants/exerciseDb';
import { useAuth } from '../../context/AuthContext';
import { TrainerClients } from '../../components/TrainerClients';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function WorkoutsScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);
  const [search, setSearch] = useState('');

  const [assignedExercises, setAssignedExercises] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const defaultTrainerWorkouts = [
    {
      name: 'Chest Workout',
      exercises: [
        { id: 'dumbbell-chest-press', name: 'Dumbbell Chest Press', sets: 4, reps: 10, weight: 20 },
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2NRdLXej0zuPG0oLQpBosq0ZuMCZbARsVfvi-KBPzLRYUrIbu38ndJfUCya-axwxE3-pqmZQdzZeqs8VVWff64bDpqBxumIVKc6Kkmgs7lGVxvibdUR6T8HUPwWvlMtoYIH8NMUKed5xicesmDjB9yCA9lybIWMtc7Xba753T09uovn93KIx14d_FdKXTd7ozZaib4EsWgtUyIXYcRnIP9wyG0hLS4kwyyNOwV7izlyY33TBlrRGDeQ6juZYa37d_eGnt0C5ZAVvn'
    },
    {
      name: 'Back Workout',
      exercises: [
        { id: 'pull-up', name: 'Bodyweight Pull-Up', sets: 4, reps: 8, weight: 0 },
        { id: 'deadlift', name: 'Conventional Barbell Deadlift', sets: 3, reps: 5, weight: 100 }
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKahpWUjryOS5P0xCh39QVdCKwCavtHgSdLUu6iAyU1LK3Sfg_cMLYXqafEiVRhVFEcHiD63xwSGeL3ijGtrixb5Ah1BMYDj3p41T2y41ep6yhB9wGLJHbxDl46YQnTNCDYTx45FccNuo1KllMiOP0nkISIIU51uo6CY2JPPGW7VCRuY3lEgyA43OJWCZXHX0OzCcoRHpXdEMsCbOmGSMZO9qbEM9xd0ZrBlMl790chJDgTEzKro-3xK522y7zWjfYq4DJeXv_ZmTs'
    },
    {
      name: 'Legs Workout',
      exercises: [
        { id: 'barbell-back-squat', name: 'Barbell Back Squat', sets: 4, reps: 8, weight: 80 },
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn3kGdXbGLF6PwfeuEzV1XIud4h-DRY6trZVw5Z5PuBynLqI8Sixutg8gyninV-P_ytR7d8rfLORc91Ad9ePWV1Cfi34jJYhfH5Fzp95p2mjrxvFSnGzhiNPstoE_8E39j6Q7IOGWNIQeds-Zkb-S0XOv50-yp-p36VKdbb6GQo2ji-HT6elp4_h3ZrP7YQyyIpp8chwkgmmffc4CkrzFWFwtVN2cfuMfPq5OSMDicptSJ2RlqTjzg_8ept6OOLlPNLU8WfVqjkaFB'
    }
  ];

  // Sync client assigned exercises from trainer in real time
  useEffect(() => {
    if (!user || userData?.role === 'trainer') return;

    setLoadingAssignments(true);
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
        setAssignedExercises(list);
        setLoadingAssignments(false);
      },
      (err) => {
        console.warn('[Workouts] Error loading assignments:', err);
        setLoadingAssignments(false);
      }
    );

    return unsubscribe;
  }, [user, userData]);

  const getWorkoutImage = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('chest') || lowercaseName.includes('bench') || lowercaseName.includes('press')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2NRdLXej0zuPG0oLQpBosq0ZuMCZbARsVfvi-KBPzLRYUrIbu38ndJfUCya-axwxE3-pqmZQdzZeqs8VVWff64bDpqBxumIVKc6Kkmgs7lGVxvibdUR6T8HUPwWvlMtoYIH8NMUKed5xicesmDjB9yCA9lybIWMtc7Xba753T09uovn93KIx14d_FdKXTd7ozZaib4EsWgtUyIXYcRnIP9wyG0hLS4kwyyNOwV7izlyY33TBlrRGDeQ6juZYa37d_eGnt0C5ZAVvn';
    }
    if (lowercaseName.includes('back') || lowercaseName.includes('deadlift') || lowercaseName.includes('pull')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKahpWUjryOS5P0xCh39QVdCKwCavtHgSdLUu6iAyU1LK3Sfg_cMLYXqafEiVRhVFEcHiD63xwSGeL3ijGtrixb5Ah1BMYDj3p41T2y41ep6yhB9wGLJHbxDl46YQnTNCDYTx45FccNuo1KllMiOP0nkISIIU51uo6CY2JPPGW7VCRuY3lEgyA43OJWCZXHX0OzCcoRHpXdEMsCbOmGSMZO9qbEM9xd0ZrBlMl790chJDgTEzKro-3xK522y7zWjfYq4DJeXv_ZmTs';
    }
    if (lowercaseName.includes('leg') || lowercaseName.includes('squat') || lowercaseName.includes('quad')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn3kGdXbGLF6PwfeuEzV1XIud4h-DRY6trZVw5Z5PuBynLqI8Sixutg8gyninV-P_ytR7d8rfLORc91Ad9ePWV1Cfi34jJYhfH5Fzp95p2mjrxvFSnGzhiNPstoE_8E39j6Q7IOGWNIQeds-Zkb-S0XOv50-yp-p36VKdbb6GQo2ji-HT6elp4_h3ZrP7YQyyIpp8chwkgmmffc4CkrzFWFwtVN2cfuMfPq5OSMDicptSJ2RlqTjzg_8ept6OOLlPNLU8WfVqjkaFB';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAViwHv8c8Oe9bsVKUgCHqIKO0shbrkkNdRJfxTIUuksRoxszVHF8tb7YaU1mEPLpSuYhOCmrVn2F56P3WjEMFxCfNRprbPMbYkB7I7f6v26fqIDWrDFja3ZXBSxbascsi2FV83ZqPClFeVuOpxqXVMTH0k3ZM5_pldFy3MraJUEGv7gzH2grAiRttD0pcDd_86bkayGapAJ4vVKN3pfo4LmC6ePChr97mkstRl4ysNMzlbZjgUTB-FuEekUHiFo8-GLIZYETwzBhAq';
  };

  // Group assigned exercises by workout name
  const workoutsGrouped: { [key: string]: any[] } = {};
  assignedExercises.forEach((asg) => {
    const name = asg.workoutName || 'Trainer Workout';
    if (!workoutsGrouped[name]) {
      workoutsGrouped[name] = [];
    }
    workoutsGrouped[name].push(asg);
  });

  const trainerWorkouts = Object.keys(workoutsGrouped).map((name) => ({
    name,
    exercises: workoutsGrouped[name],
    image: getWorkoutImage(name),
  }));

  const activeWorkoutsList = trainerWorkouts.length > 0 ? trainerWorkouts : defaultTrainerWorkouts;

  if (userData?.role === 'trainer') {
    return <TrainerClients />;
  }

  const goals = [
    {
      title: 'Fat Loss',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDepfHBAIVTEb9XQhwouzITabgE2LMTQYTVmDgDgo5ytN9Xz83D2pzq_0oJEnR7QM32iZv2I7r5RvDRBwOk8i7-zpq-FXL1PTeRGFj7Y1BBhGUXB4bTHIV8gsSor2doGIi-yBKam8VZj5n5DRPd6x0kgs7-ZCboM44pvOxeYyRLD-pDEkTmbVYSU8OGAP9PTaDgEDndcBwMQ3pBBQ0Tail51qcXvAWgFrqqulWXVoc__7BwH_H7oKH6jy_GGXtpzlsaXMlOdenjCpZd',
    },
    {
      title: 'Muscle Gain',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOCrUuP5D22u-JOkIavj437qo9W5ZfX9GQNuF0GF0XvI2M22CPiukFvLAGUH_MgEi20Oh2gyjGoWEMWKsbL0MsbwzrixbJO1XOfd7H3o_norCo41Rg7Jl2hhdWos37Bv_OcsHEv7YZ9_7jsTfj6wL2oi79ZrDAKqjZy9Smo07Ib8FdWZKPzqmQv2wP_vkp-x76w-lFD2EhHs55xIscMb7wXTq5v659uKnQinDb5zGKNzt-c1vpCP1h4R30VBTsGyJzx0V9jLS5wAN8',
    },
    {
      title: 'Endurance',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9aa6H82jFrhlDrT8kKCXc6W4s1UsB48NjLJFNsCthjYQ3v69C0UgrL2DbzMzIYklxu99v9uOz-LehSMI4UOAG9fnizuYr1NY4M3kknzhpUENkGL7RM7-GzQgynckloqo-vLkG8XCnZf-WQtc7_fDLPVJKd1Xt8BsCeXtETsjDvVlEPoxRSKqwn3rIl6ypiDJNB2apz1gInfFxQGLAF_R0ev2Yv_j3Xm6tS1hZXI9yHYH4lu4qA2JGRL-uteqGDQ3hHSOcpCVD_48e',
    },
    {
      title: 'Flexibility',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuElD0ZoimuCj2EwugeFRYCQSelWolCFiNnF92LDFlNpGvCeKVW0D9ex5GmLvXAdlKVx5Ii1QrqhTm_EzJCBEfsk-KP_hej6le5wKqrx04D7-dM-BPVnSAeqPOKtggdTHPvUy_GGRtMnEpgPpVG7E9z9TnSezcA-MJETD8nyMbNbzxnlsTik7Q0tU1RZuVvsPHl9LlKOffOEAOAlPlTedsSACVboNdNKAd6JWmZGkSWZ7I79GJyN309RgAQBe-d8AfKMSo8XatMMYO',
    },
  ];

  // Dynamically filter trainer-assigned workouts based on search input
  const filteredTrainerWorkouts = activeWorkoutsList.filter((workout) => {
    const matchesSearch =
      workout.name.toLowerCase().includes(search.toLowerCase()) ||
      workout.exercises.some((e: any) => e.name.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  });

  // Dynamically filter programs based on search input selection
  const filteredPrograms = PROGRAMS.filter((program) => {
    const matchesSearch =
      program.title.toLowerCase().includes(search.toLowerCase()) ||
      program.difficulty.toLowerCase().includes(search.toLowerCase()) ||
      program.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleProgramPress = (program: Program) => {
    // Navigate to details of the first exercise in this program
    router.push({
      pathname: '/workout/details',
      params: { exerciseId: program.exercises[0] },
    } as any);
  };

  const handlePlayPress = (program: Program) => {
    // Start active tracking for the first exercise in this program
    router.push({
      pathname: '/workout/active',
      params: { exerciseId: program.exercises[0] },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search training programs..."
              placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/search-filters')}
            style={styles.filterButton}
          >
            <SlidersHorizontal size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {/* Workout for the Day */}
        {(() => {
          const todayWorkout = activeWorkoutsList[0];
          if (!todayWorkout) return null;

          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout for the Day</Text>
              <GlassCard style={styles.todayCard}>
                <ImageBackground
                  source={{ uri: todayWorkout.image }}
                  style={styles.todayBg}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.todayOverlay} />
                  <View style={styles.todayContent}>
                    <Text style={styles.todayTitle}>{todayWorkout.name}</Text>
                    <Text style={styles.todayMeta}>
                      {todayWorkout.exercises.length} Exercise{todayWorkout.exercises.length > 1 ? 's' : ''} • {todayWorkout.exercises.reduce((sum: number, e: any) => sum + (e.sets || 3), 0)} Sets Total
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/workout/assigned_details',
                          params: { workoutName: todayWorkout.name },
                        } as any)
                      }
                      style={styles.todayStartBtn}
                    >
                      <Play size={14} color="#000000" fill="#000000" />
                      <Text style={styles.todayStartText}>Start Workout</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </GlassCard>
            </View>
          );
        })()}

        {/* Training Programs (Lists both Trainer Workouts & standard programs) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Programs</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/search-filters')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredTrainerWorkouts.length === 0 && filteredPrograms.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No programs match your search/category.</Text>
            </GlassCard>
          ) : (
            <View style={styles.programsList}>
              {/* 1. Workouts Assigned by Trainer */}
              {filteredTrainerWorkouts.map((group) => {
                const exerciseNames = group.exercises.map((e: any) => e.name).join(', ');
                const truncatedNames = exerciseNames.length > 50 
                  ? exerciseNames.substring(0, 50) + '...' 
                  : exerciseNames;
                const totalSets = group.exercises.reduce((sum: number, e: any) => sum + (e.sets || 3), 0);

                return (
                  <GlassCard key={group.name} style={styles.programCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/workout/assigned_details',
                          params: { workoutName: group.name },
                        } as any)
                      }
                      style={styles.programCardContent}
                    >
                      <View style={styles.exerciseIconWrapper}>
                        <Dumbbell size={22} color={colors.primary} />
                      </View>
                      <View style={styles.programMeta}>
                        <Text style={styles.programTitle}>{group.name}</Text>
                        <Text style={styles.programWeek} numberOfLines={1}>
                          {truncatedNames}
                        </Text>
                        <Text style={styles.programWeek}>
                          {group.exercises.length} Exercise{group.exercises.length > 1 ? 's' : ''} • {totalSets} Sets Total
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/workout/assigned_active',
                          params: { workoutName: group.name },
                        } as any)
                      }
                      style={styles.playIconWrapper}
                    >
                      <Play size={18} color={colors.primary} fill={colors.primary} />
                    </TouchableOpacity>
                  </GlassCard>
                );
              })}

              {/* 2. Standard Training Programs */}
              {filteredPrograms.map((program) => (
                <GlassCard key={program.id} style={styles.programCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleProgramPress(program)}
                    style={styles.programCardContent}
                  >
                    <Image
                      source={{ uri: program.image }}
                      style={styles.programThumbnail}
                    />
                    <View style={styles.programMeta}>
                      <Text style={styles.programTitle}>{program.title}</Text>
                      <Text style={styles.programWeek}>
                        {program.weekText || `${program.duration} • ${program.difficulty}`}
                      </Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${program.progress || 0}%` }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePlayPress(program)}
                    style={styles.playIconWrapper}
                  >
                    <Play size={18} color={colors.primary} fill={colors.primary} />
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  activeCategoryChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: colors.textAccent,
  },
  featuredWrapper: {
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 6,
  },
  featuredTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  featuredTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  featuredMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  featuredButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  featuredButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textAccent,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
  },
  programsList: {
    gap: 12,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
  },
  programCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  programThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  programMeta: {
    flex: 1,
    gap: 4,
  },
  programTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  programWeek: {
    fontSize: 11,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  playIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },
  exerciseIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalGridWrapper: {
    width: (width - 52) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  goalImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalImageRadius: {
    borderRadius: 16,
  },
  goalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  goalText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  todayCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 0,
  },
  todayBg: {
    width: '100%',
    height: '100%',
  },
  todayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  todayContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  todayMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    opacity: 0.9,
  },
  todayStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
  },
  todayStartText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textAccent,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  indicatorDotActive: {
    backgroundColor: colors.primary,
    width: 14,
  },
});
