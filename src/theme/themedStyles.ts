import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { DARK_COLORS } from './colors';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleFactory: (colors: typeof DARK_COLORS, isDark: boolean) => T
): T {
  const { colors, isDark } = useTheme();
  // Memoize style generation based on the active theme
  return useMemo(() => styleFactory(colors, isDark), [colors, isDark, styleFactory]);
}
