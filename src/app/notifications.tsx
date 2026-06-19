import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Dumbbell, Heart, Users, Trophy, RotateCw, Bell, ArrowLeft, MessageSquare } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../theme/themedStyles';
import { GlassCard } from '../components/GlassCard';
import { useRouter } from 'expo-router';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'Training', 'Community', 'System'];

  // Subscribe to real-time notifications from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: any[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          let timeText = 'Just now';
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const diffMs = Date.now() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) {
              timeText = 'Just now';
            } else if (diffMins < 60) {
              timeText = `${diffMins}m ago`;
            } else if (diffHours < 24) {
              timeText = `${diffHours}h ago`;
            } else {
              timeText = `${diffDays}d ago`;
            }
          }

          list.push({
            id: docSnap.id,
            ...data,
            time: timeText,
          });
        });
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.warn('[Notifications] Error loading notifications:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid, 'notifications', id);
      await updateDoc(ref, { unread: false });
    } catch (err) {
      console.warn('[Notifications] Failed to mark as read:', err);
    }
  };

  const getIconComponent = (type: string, warningColor = false) => {
    switch (type) {
      case 'workout':
        return <Dumbbell size={20} color={colors.primary} />;
      case 'message':
        return <MessageSquare size={20} color={colors.primary} />;
      case 'like':
        return <Heart size={20} color={colors.textMuted} />;
      case 'invite':
        return <Users size={20} color={colors.textMuted} />;
      case 'badge':
        return <Trophy size={20} color={warningColor ? colors.warning : colors.primary} fill="#000000" />;
      case 'sync':
        return <RotateCw size={20} color={colors.textMuted} />;
      default:
        return <Bell size={20} color={colors.textMuted} />;
    }
  };

  const filteredNotifications = notifications.filter(
    (item) => activeFilter === 'All' || item.category === activeFilter
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={styles.headerAvatarContainer}
          >
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8F7KKuK_caaRGak9MQ_W2ILllheoVUN5wUopz5X-5ztRdMuoRU3d3S8eG_kceq3cZwU_wqJSgsTXLcpIWcBJImPuO3Dkvcxv5pHyMMJ_Hzixk_VVQUoOvUt1mmvhqoo9yZAS_mSAHFtZZeaRUBVAzQpb5ZVLFwDKpDTnV8DcSAky1aoBxP3eIumCVDrAccmEGlfWHqX4wlR4Q72NnRUrq7OKZ7_al81BNyjKLE2ILi_f3tV2M8riIDO1Q7up4DWOdbP1RndfCFnYY',
              }}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>PULSE</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.iconButton}>
          <Bell size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Title */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Notifications</Text>
          <Text style={styles.screenSubtitle}>Stay updated with your training and squad.</Text>
        </View>

        {/* Filter Chips Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          style={styles.filtersContainer}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  isActive && styles.activeFilterChip,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.activeFilterChipText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Categorized Feed */}
        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
          ) : filteredNotifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications in this category.</Text>
          ) : (
            filteredNotifications.map((item) => {
              const showCategoryHeader =
                activeFilter === 'All' &&
                (filteredNotifications.indexOf(item) === 0 ||
                  filteredNotifications[filteredNotifications.indexOf(item) - 1].category !==
                    item.category);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleMarkAsRead(item.id)}
                  style={styles.itemWrapper}
                >
                  {showCategoryHeader && (
                    <Text style={styles.categoryLabel}>{item.category}</Text>
                  )}

                  <GlassCard
                    style={[
                      styles.notificationCard,
                      item.faded && styles.fadedCard,
                    ]}
                  >
                    {/* Unread Indicator Dot */}
                    {item.unread && (
                      <View style={styles.unreadDot} />
                    )}

                    {/* Icon wrapper block */}
                    <View
                      style={[
                        styles.iconBlock,
                        (item.type === 'workout' || item.type === 'message') && styles.workoutIconBlock,
                        item.type === 'badge' && styles.badgeIconBlock,
                      ]}
                    >
                      {getIconComponent(item.type, item.warningColor)}
                    </View>

                    {/* Content text */}
                    <View style={styles.textBlock}>
                      <View style={styles.titleRow}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        <Text style={styles.timeText}>{item.time}</Text>
                      </View>

                      {/* Snippet with optional highlighting */}
                      <Text style={styles.snippetText}>
                        {item.highlight ? (
                          <>
                            {item.snippet.split(item.highlight)[0]}
                            <Text
                              style={[
                                styles.highlightText,
                                item.warningColor && styles.warningHighlightText,
                              ]}
                            >
                              {item.highlight}
                            </Text>
                            {item.snippet.split(item.highlight)[1]}
                          </>
                        ) : (
                          item.snippet
                        )}
                      </Text>

                      {/* Optional Action Button */}
                      {item.hasAction && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.actionBtn}
                          onPress={() => router.push('/workouts')}
                        >
                          <Text style={styles.actionBtnText}>{item.actionText}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.primary,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filtersContainer: {
    marginTop: 16,
    maxHeight: 50,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 6,
  },
  filterChip: {
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterChip: {
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: colors.primary,
  },
  list: {
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 16,
  },
  itemWrapper: {
    gap: 10,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 10,
    paddingLeft: 4,
  },
  notificationCard: {
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    position: 'relative',
  },
  fadedCard: {
    opacity: 0.7,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconBlock: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  workoutIconBlock: {
    backgroundColor: isDark ? 'rgba(204, 255, 0, 0.1)' : 'rgba(118, 158, 0, 0.1)',
    borderColor: isDark ? 'rgba(204, 255, 0, 0.2)' : 'rgba(118, 158, 0, 0.2)',
  },
  badgeIconBlock: {
    backgroundColor: 'rgba(252, 209, 59, 0.1)',
    borderColor: 'rgba(252, 209, 59, 0.2)',
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  snippetText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  highlightText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  warningHighlightText: {
    color: colors.warning,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  actionBtnText: {
    color: colors.textAccent,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
