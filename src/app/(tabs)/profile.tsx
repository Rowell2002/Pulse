import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Trophy, Zap, ArrowRight, Settings, BarChart2, Share2, Grid, Users } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);
  const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [clientCount, setClientCount] = useState(0);

  // Subscribe to completed workouts (for stats & streak calculation)
  useEffect(() => {
    if (!user?.uid || userData?.role === 'trainer') {
      setLoadingStats(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'completed_workouts'));
    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        setCompletedWorkoutsCount(querySnap.size);

        const workoutsDates = querySnap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return data.completedAt?.toDate ? data.completedAt.toDate() : null;
          })
          .filter(Boolean) as Date[];

        if (workoutsDates.length === 0) {
          setStreakDays(0);
        } else {
          // Normalize dates to start of day and sort descending
          const uniqueDates = Array.from(
            new Set(
              workoutsDates.map((d) => {
                const copy = new Date(d);
                copy.setHours(0, 0, 0, 0);
                return copy.getTime();
              })
            )
          ).sort((a, b) => b - a);

          let streak = 0;
          const checkDate = new Date();
          checkDate.setHours(0, 0, 0, 0);
          const todayMs = checkDate.getTime();

          // Check if the most recent workout is today or yesterday
          if (uniqueDates[0] === todayMs || uniqueDates[0] === todayMs - 86400000) {
            streak = 1;
            let lastDate = uniqueDates[0];
            for (let i = 1; i < uniqueDates.length; i++) {
              if (lastDate - uniqueDates[i] === 86400000) {
                streak++;
                lastDate = uniqueDates[i];
              } else if (lastDate - uniqueDates[i] > 86400000) {
                break;
              }
            }
          }
          setStreakDays(streak);
        }
        setLoadingStats(false);
      },
      (err) => {
        console.warn('[Profile] Error fetching completed workouts:', err);
        setLoadingStats(false);
      }
    );

    return unsubscribe;
  }, [user?.uid, userData?.role]);

  // Subscribe to client count (only for trainers)
  useEffect(() => {
    if (!user?.uid || userData?.role !== 'trainer') return;

    const q = query(
      collection(db, 'users'),
      where('trainerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        setClientCount(querySnap.size);
        setLoadingStats(false);
      },
      (err) => {
        console.warn('[Profile] Error fetching client count:', err);
        setLoadingStats(false);
      }
    );

    return unsubscribe;
  }, [user?.uid, userData?.role]);

  const journeyPosts = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAYhKoiAselBiCxRBlzyYMw8xWps4s8qVztGHesADBVYrQk1g5ezkzbi4LjSODMnrMs7yWAWbrVv2jDRH1xVHRXCyb4fokO1k7MR37FiVKEy6wb3gwNawbNjEo8V674fDzvOYaqmqDBEvjM1Tac8mptP7lO1tcKzAhb4xYPmfSt_YeD-oely4V3Ehf-qhPgUh31t6zlxbg_TmyQOy552gi2g-Grdlinw_hS_aMfkFYGfoJiRaMI0QMmyXaJhcAXQvQKbb4VGrDamVbM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDjJrCKDiFz78HKuK8zbLpR2UXF6wppruzUsLGo8CE1HR8m04G6JKeYPp9cNJRz6oCzailuMycfgP-ReOIk0F3vYe86fFqhTDi58uP3OA0qP--skBmMNAL24UPrNPArWtRXN-SRdkB5-__GMon1teys8JBk2NPjd3SuU4OMs9DwLpZkzxkrD-Xo6rV84L22Mr_2J7JmXIVlIt8SREAbEly6uNR7wyDO0W7fvO1FkbaEp31vYs18wWPlWzihENSDVhOwYs2XmZaNjUbu',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAUv18p0HP1nbaX8Zd4Sg5TnYmfIvejB-9wUNq6acP6TNcWTu_gx1SE0vKK5Gm89GnxzW0ineEZhsDmYEqBywq35LD0q2rYM4uE80gcPLpM-bsgimSFUfzdv1Qf9XddZsOfztWw33vCpgl2TRLBPNiB0EVpiNOSWU8mXgtsUV9yNyYQ3dSU8e_6dUDaI9x9Ug55ieDU4pES7NzX8PyyxyqCjrVy3NiVuT2WXiUEQe3G_UjR7RMoYYPQNYaYaJyIVzNyrJPazrGt2Jp_',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDXxXkYBF3Q4G56I8Ls6obFGOcBgkhpi6xjYg4LoaEAYOqVQs2SD5LJJzWpYMeCkDk58dDC-aI7tj6bPyLNxf8tjl00oZrvGvIMFYRa2Xb0UK9T2G9JszDPwW87ZE2ELZGkqsfmVuQN4c0wf5UoFC9-shOJKCWtnayz_aqqvUbnPnsLYeoOvy6eJQOVKCMRz8ZbSzvnhnse_d7aLmtL2eNkZqrJ3TUY6D0hTOAEMfbEMpm22z2lS9FWuxFNPM-muYFVwainpEK0-4rj',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAM7GArMidziW_B5OPNyun-BWa5w0LkhKVXCKqURZybpzPljsKLdjwgNJRvOrwBkZNdLBC7BEm7GFNUcAY-Y5q-LEiHNbjzlMVgRb1mCDfSXCoOrbEE99Au6R5Q1WQv7FKy_6vAmbwrH_F9uQsdrl1H1KJoQXNZkwCnadodGl3n4bSdBETqLFNUnv77BM9tMhbZBBVLcD3S357AlX0dJYBktXV43w4hgMUXPI9KCY-cllW4A9aZrSDtub4snG5c3KUw-TBZZ_Rq8CGp',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB8OvuV7JUz2PjUEzxl0P7rsUcnXZkhyg1Lhw1XJ_5zCG07W60MB8ge6503HflFTM-JtOLGLTIvF6fMRZ7zTh09X5iV1EhAocfpADPm5q4Cl15RhbrevXUnLB-OeN6zayg0BrfbuFAPoX-ehrmsHnIWkQIsWIwiFvQf_Vf5YKqxXUcIECD34C1DzzBsIgUKyn0luuv15YcyL58iIk9_4EO3gbwlSZ_T98rl4j-wDh2uI7fGUj0AeDFlGN2ZjMTkWmCJ70rNn1-cVzVB',
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Quick Links Row (Smart addition to keep other views wired!) */}
        <View style={styles.navigationRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/profile/client-stats')}
            style={styles.navLinkCard}
          >
            <BarChart2 size={16} color={colors.primary} />
            <Text style={styles.navLinkCardText}>My Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/profile/settings')}
            style={styles.navLinkCard}
          >
            <Settings size={16} color={colors.primary} />
            <Text style={styles.navLinkCardText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.gradientRing}>
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 120 120">
                <Defs>
                  <LinearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                  </LinearGradient>
                </Defs>
                <SvgCircle cx="60" cy="60" r="57" stroke="url(#avatarGrad)" strokeWidth="4" fill="none" />
              </Svg>
              <View style={styles.imageClip}>
                <Image
                  source={{
                    uri: userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPLec3e4wQZMTx7tJorZXjjXzORSwVZWYl3y6GCF7eu1mjUrk5QMlPazqaXlZIg18YGqkyIwI2KP_bqGzRtz17XGo6ZflvUS_EzNV3B6NvvyqjfNUKPhSVwcFU5jRkw_fJwkjhL4PeiP8WBV4A9umQRcKxZOIBPp6WHKm7p5Oj6Qfrz7r8PganYgXnXuICVP8l7uYx_JhF5A8VzokaMBjFyE3DXDDd0wZGjj1ds2oieWkK9oxr04-6ScXH2VpeYGjUoLgv8UiGUdJI',
                  }}
                  style={styles.avatar}
                />
              </View>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.profileName}>{userData?.name || 'Alex Carter'}</Text>
          <Text style={styles.profileTagline}>
            {userData?.bio || 'Elite hybrid athlete focused on strength and endurance.'}
          </Text>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            {userData?.role === 'trainer' ? (
              <>
                <View style={styles.statCell}>
                  {loadingStats ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.statVal}>{clientCount}</Text>
                  )}
                  <Text style={styles.statLbl}>Clients</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statVal}>Coach</Text>
                  <Text style={styles.statLbl}>Role</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statVal}>{userData?.followersCount || 0}</Text>
                  <Text style={styles.statLbl}>Followers</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.statCell}>
                  {loadingStats ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.statVal}>{completedWorkoutsCount}</Text>
                  )}
                  <Text style={styles.statLbl}>Workouts</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  {loadingStats ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.statVal}>{streakDays}</Text>
                  )}
                  <Text style={styles.statLbl}>Day Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statVal}>{userData?.followersCount || 0}</Text>
                  <Text style={styles.statLbl}>Followers</Text>
                </View>
              </>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/profile/edit')}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transformation Journey */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transformation Journey</Text>
            <Grid size={18} color={colors.primary} />
          </View>

          <View style={styles.journeyGrid}>
            {journeyPosts.map((postUri, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={styles.gridItem}
              >
                <Image source={{ uri: postUri }} style={styles.gridImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestonesGrid}>
            {/* Milestone 1 */}
            <GlassCard style={styles.milestoneCard}>
              <Trophy size={32} color={colors.primary} fill={colors.textAccent} />
              <Text style={styles.milestoneTitle}>Power Peak</Text>
              <Text style={styles.milestoneSub}>Top 1% Squat</Text>
            </GlassCard>

            {/* Milestone 2 */}
            <GlassCard style={styles.milestoneCard}>
              <Zap size={32} color={colors.secondary} fill={colors.secondary} />
              <Text style={styles.milestoneTitle}>Hyper-Focus</Text>
              <Text style={styles.milestoneSub}>100 Day Club</Text>
            </GlassCard>
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
  navigationRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  navLinkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    height: 40,
    borderRadius: 8,
  },
  navLinkCardText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  gradientRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageClip: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.background,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  profileTagline: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    marginBottom: 20,
  },
  statsBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 16,
    marginBottom: 20,
  },
  statCell: {
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLbl: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  editBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.textAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  shareBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    gap: 14,
    marginTop: 10,
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
  journeyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: (width - 56) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  milestonesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  milestoneCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    backgroundColor: colors.surfaceCard,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  milestoneSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
