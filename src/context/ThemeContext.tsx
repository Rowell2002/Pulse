import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

interface ThemeContextType {
  isDark: boolean;
  colors: typeof DARK_COLORS;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  
  // Default to dark mode (OLED Black)
  const isDark = userData?.settings?.darkMode !== false;
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, colors }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
