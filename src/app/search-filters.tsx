import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Check, Search, Dumbbell, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EXERCISES, Exercise } from '../constants/exerciseDb';

const { width } = Dimensions.get('window');

export default function SearchFiltersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(EXERCISES);

  const muscles = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Arms', 'Core'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  // Handle goals passed from Browse by Goal grid
  useEffect(() => {
    if (params.goal) {
      const goalStr = (params.goal as string).toLowerCase();
      if (goalStr.includes('fat') || goalStr.includes('flex')) {
        setSelectedDifficulty('Beginner');
      } else if (goalStr.includes('endur')) {
        setSelectedDifficulty('Intermediate');
        setSelectedMuscle('Hamstrings');
      } else if (goalStr.includes('muscle') || goalStr.includes('gain')) {
        setSelectedDifficulty('Advanced');
      }
    }
  }, [params.goal]);

  // Sync filtration results
  useEffect(() => {
    let result = EXERCISES;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.muscleGroup.toLowerCase().includes(q) ||
          ex.category.toLowerCase().includes(q)
      );
    }

    // Muscle Group filter
    if (selectedMuscle) {
      result = result.filter((ex) => ex.muscleGroup === selectedMuscle);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      result = result.filter((ex) => ex.difficulty === selectedDifficulty);
    }

    setFilteredExercises(result);
  }, [searchQuery, selectedMuscle, selectedDifficulty]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedMuscle(null);
    setSelectedDifficulty(null);
  };

  const handleExercisePress = (id: string) => {
    router.push({
      pathname: '/workout/details',
      params: { exerciseId: id },
    } as any);
  };

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
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleClearFilters}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises by name, muscle..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Muscle group */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Muscle Group</Text>
          <View style={styles.grid}>
            {muscles.map((muscle) => {
              const isSelected = selectedMuscle === muscle;
              return (
                <TouchableOpacity
                  key={muscle}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMuscle(isSelected ? null : muscle)}
                  style={[
                    styles.chip,
                    isSelected && styles.activeChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.activeChipText,
                    ]}
                  >
                    {muscle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {difficulties.map((level) => {
              const isSelected = selectedDifficulty === level;
              return (
                <TouchableOpacity
                  key={level}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDifficulty(isSelected ? null : level)}
                  style={{ flex: 1 }}
                >
                  <GlassCard active={isSelected} style={styles.difficultyCard}>
                    <Text
                      style={[
                        styles.difficultyCardText,
                        isSelected && styles.activeDifficultyText,
                      ]}
                    >
                      {level}
                    </Text>
                    {isSelected && <Check size={12} color={COLORS.primary} />}
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Exercise Results List */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Exercises ({filteredExercises.length})</Text>
          </View>

          {filteredExercises.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Dumbbell size={24} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No exercises found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or filters.</Text>
            </GlassCard>
          ) : (
            <View style={styles.exerciseList}>
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  activeOpacity={0.8}
                  onPress={() => handleExercisePress(exercise.id)}
                >
                  <GlassCard style={styles.exerciseCard}>
                    <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{exercise.muscleGroup}</Text>
                        </View>
                        <View style={[styles.badge, styles.difficultyBadge]}>
                          <Text style={styles.difficultyBadgeText}>{exercise.difficulty}</Text>
                        </View>
                      </View>
                    </View>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeChip: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: COLORS.primary,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  difficultyCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeDifficultyText: {
    color: COLORS.primary,
  },
  resultsSection: {
    gap: 12,
    marginTop: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 14,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  exerciseInfo: {
    flex: 1,
    gap: 6,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
