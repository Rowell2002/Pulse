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
  const [activeCategory, setActiveCategory] = useState('For You');

  const [assignedExercises, setAssignedExercises] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

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
          list.push(docSnap.data());
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

  if (userData?.role === 'trainer') {
    return <TrainerClients />;
  }

  const categories = ['For You', 'Strength', 'HIIT', 'Yoga', 'Mobility'];

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

  // Dynamically filter programs based on search input and active category selection
  const filteredPrograms = PROGRAMS.filter((program) => {
    const matchesCategory =
      activeCategory === 'For You' || program.category === activeCategory;
    const matchesSearch =
      program.title.toLowerCase().includes(search.toLowerCase()) ||
      program.difficulty.toLowerCase().includes(search.toLowerCase()) ||
      program.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
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

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(category)}
                style={[
                  styles.categoryChip,
                  isActive && styles.activeCategoryChip,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.activeCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Workouts Assigned by Trainer */}
        {assignedExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned by Trainer</Text>
            <View style={styles.programsList}>
              {assignedExercises.map((asg) => (
                <GlassCard key={asg.id} style={styles.programCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/workout/details',
                        params: { exerciseId: asg.id },
                      } as any)
                    }
                    style={styles.programCardContent}
                  >
                    <View style={styles.exerciseIconWrapper}>
                      <Dumbbell size={22} color={colors.primary} />
                    </View>
                    <View style={styles.programMeta}>
                      <Text style={styles.programTitle}>{asg.name}</Text>
                      <Text style={styles.programWeek}>
                        {asg.sets} Sets • {asg.reps} Reps • {asg.weight} lbs
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/workout/active',
                        params: { exerciseId: asg.id },
                      } as any)
                    }
                    style={styles.playIconWrapper}
                  >
                    <Play size={18} color={colors.primary} fill={colors.primary} />
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* Featured Program Hero (Rendered if matches active filter) */}
        {filteredPrograms.some(p => p.id === 'elite-strength-2-0') && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/workout/details', params: { exerciseId: 'barbell-back-squat' } } as any)}
            style={styles.featuredWrapper}
          >
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAViwHv8c8Oe9bsVKUgCHqIKO0shbrkkNdRJfxTIUuksRoxszVHF8tb7YaU1mEPLpSuYhOCmrVn2F56P3WjEMFxCfNRprbPMbYkB7I7f6v26fqIDWrDFja3ZXBSxbascsi2FV83ZqPClFeVuOpxqXVMTH0k3ZM5_pldFy3MraJUEGv7gzH2grAiRttD0pcDd_86bkayGapAJ4vVKN3pfo4LmC6ePChr97mkstRl4ysNMzlbZjgUTB-FuEekUHiFo8-GLIZYETwzBhAq',
              }}
              style={styles.featuredImage}
            />
            <View style={styles.featuredOverlay} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredTag}>
                <Text style={styles.featuredTagText}>FEATURED</Text>
              </View>
              <Text style={styles.featuredTitle}>Elite Strength 2.0</Text>
              <Text style={styles.featuredMeta}>8 Weeks • Advanced • Hypertrophy Focus</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/workout/details', params: { exerciseId: 'barbell-back-squat' } } as any)}
                style={styles.featuredButton}
              >
                <Text style={styles.featuredButtonText}>Start Training</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* My Programs Section */}
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

          {filteredPrograms.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No programs match your search/category.</Text>
            </GlassCard>
          ) : (
            <View style={styles.programsList}>
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

        {/* Browse by Goal Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Goal</Text>
          <View style={styles.goalsGrid}>
            {goals.map((goal, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={styles.goalGridWrapper}
                onPress={() => router.push({ pathname: '/search-filters', params: { goal: goal.title } } as any)}
              >
                <ImageBackground
                  source={{ uri: goal.image }}
                  style={styles.goalImage}
                  imageStyle={styles.goalImageRadius}
                >
                  <View style={styles.goalOverlay} />
                  <Text style={styles.goalText}>{goal.title}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
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
});
