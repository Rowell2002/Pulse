import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, Dumbbell, Zap, Heart } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';

export default function OnboardingScreen() {
  const { updateProfile } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goals = [
    {
      id: 'hypertrophy',
      title: 'Muscle Growth (Hypertrophy)',
      description: 'Focus on progressive overload to increase muscle mass.',
      icon: TrendingUp,
    },
    {
      id: 'strength',
      title: 'Strength & Power',
      description: 'Optimize maximum lift weight and physical force.',
      icon: Dumbbell,
    },
    {
      id: 'lean_bulk',
      title: 'Lean & Toned Physique',
      description: 'Build muscle while maintaining low body fat percentage.',
      icon: Zap,
    },
    {
      id: 'endurance',
      title: 'Cardiovascular Endurance',
      description: 'Enhance respiratory metrics and long-duration stamina.',
      icon: Heart,
    },
  ];

  const handleContinue = async () => {
    if (!selectedGoal) return;
    setIsSubmitting(true);
    try {
      await updateProfile({ selectedGoal });
      // The Auth Guard inside _layout.tsx will see the completed profile
      // and redirect the user automatically to /(tabs)/home
    } catch (error) {
      console.error('[Onboarding] Error saving fitness goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Define Your Target</Text>
          <Text style={styles.subtitle}>
            Select your primary fitness objective. Coach Sarah will use this to optimize your routines.
          </Text>
        </View>

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          {goals.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            const Icon = goal.icon;

            return (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.8}
                onPress={() => setSelectedGoal(goal.id)}
                disabled={isSubmitting}
              >
                <GlassCard active={isSelected} style={styles.goalCard}>
                  <View
                    style={[
                      styles.iconWrapper,
                      isSelected && styles.iconActiveWrapper,
                    ]}
                  >
                    <Icon
                      size={24}
                      color={isSelected ? '#000000' : COLORS.textSecondary}
                    />
                  </View>
                  <View style={styles.textWrapper}>
                    <Text
                      style={[
                        styles.goalTitle,
                        isSelected && styles.goalActiveTitle,
                      ]}
                    >
                      {goal.title}
                    </Text>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.continueButton,
            (!selectedGoal || isSubmitting) && styles.disabledButton,
          ]}
          disabled={!selectedGoal || isSubmitting}
          onPress={handleContinue}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={styles.continueButtonText}>Finish Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 32,
  },
  header: {
    gap: 8,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  goalsContainer: {
    gap: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActiveWrapper: {
    backgroundColor: COLORS.primary,
  },
  textWrapper: {
    flex: 1,
    gap: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  goalActiveTitle: {
    color: COLORS.primary,
  },
  goalDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  continueButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: 'rgba(204, 255, 0, 0.3)',
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
