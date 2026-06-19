import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Home, Dumbbell, Users, User, MessageSquare } from 'lucide-react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../theme/themedStyles';

export const BottomNavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();
  const { threads } = useChat();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);

  const isTrainer = userData?.role === 'trainer';

  const unreadChatsCount = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

  const tabs = isTrainer
    ? [
        { name: 'Dashboard', path: '/home', icon: Home },
        { name: 'Clients', path: '/workouts', icon: Users },
        { name: 'Community', path: '/community', icon: MessageSquare },
        { name: 'Profile', path: '/profile', icon: User },
      ]
    : [
        { name: 'Home', path: '/home', icon: Home },
        { name: 'Workouts', path: '/workouts', icon: Dumbbell },
        { name: 'Community', path: '/community', icon: Users },
        { name: 'Profile', path: '/profile', icon: User },
      ];

  return (
    <View
      style={[
        styles.navBar,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path);
        const IconComponent = tab.icon;
        const isCommunity = tab.name === 'Community';

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.8}
            onPress={() => router.replace(tab.path as any)}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
          >
            <View style={styles.iconContainer}>
              <IconComponent
                size={isActive ? 24 : 22}
                color={isActive ? colors.primary : colors.textMuted}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isCommunity && unreadChatsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? 'bold' : '500' },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.75)' : 'rgba(255, 255, 255, 0.75)',
    borderTopWidth: 1,
    borderTopColor: colors.borderGlass,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
  },
  activeTabButton: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'System',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: isDark ? '#000000' : '#FFFFFF',
  },
  badgeText: {
    color: colors.textAccent,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
