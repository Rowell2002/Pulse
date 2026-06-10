import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, active = false }) => {
  return (
    <View
      style={[
        styles.card,
        active && styles.activeCard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    padding: 16,
    overflow: 'hidden',
  },
  activeCard: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});
