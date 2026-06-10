import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const TopAppBar: React.FC = () => {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      where('unread', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (err) => {
        console.warn('[TopAppBar] Error listening to notifications:', err);
      }
    );

    return unsubscribe;
  }, [user]);

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/profile' as any)}
          style={styles.avatarContainer}
        >
          <Image
            source={{
              uri: userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPLec3e4wQZMTx7tJorZXjjXzORSwVZWYl3y6GCF7eu1mjUrk5QMlPazqaXlZIg18YGqkyIwI2KP_bqGzRtz17XGo6ZflvUS_EzNV3B6NvvyqjfNUKPhSVwcFU5jRkw_fJwkjhL4PeiP8WBV4A9umQRcKxZOIBPp6WHKm7p5Oj6Qfrz7r8PganYgXnXuICVP8l7uYx_JhF5A8VzokaMBjFyE3DXDDd0wZGjj1ds2oieWkK9oxr04-6ScXH2VpeYGjUoLgv8UiGUdJI',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.replace('/(tabs)/home' as any)}>
          <Text style={styles.brandTitle}>PULSE</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/notifications')}
        style={styles.iconButton}
      >
        <View style={styles.iconWrapper}>
          <Bell size={24} color={COLORS.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.primary,
  },
  iconButton: {
    padding: 4,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#000000',
  },
  badgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
