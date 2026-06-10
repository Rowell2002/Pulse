import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Users, ClipboardList, MessageSquare, Megaphone, CheckCircle, Flame, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GlassCard } from './GlassCard';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export const TrainerDashboard: React.FC = () => {
  const router = useRouter();
  const { userData } = useAuth();
  const { threads, sendMessage } = useChat();

  const [athleteCount, setAthleteCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [clientActivities, setClientActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Fetch client counts and listen to completed workouts from Firestore
  useEffect(() => {
    if (!userData?.uid) return;

    // Listen to this trainer's clients
    const qClients = query(
      collection(db, 'users'),
      where('trainerId', '==', userData.uid)
    );

    const unsubscribeClients = onSnapshot(qClients, (clientsSnap) => {
      const clientList: any[] = [];
      clientsSnap.forEach((docSnap) => {
        const u = docSnap.data();
        clientList.push(u);
      });

      // Update total clients count dynamically
      setAthleteCount(clientList.length);
      setLoadingStats(false);

      if (clientList.length === 0) {
        setClientActivities([]);
        setLoadingActivities(false);
        return;
      }

      // Track subcollection listeners
      const unsubscribes: (() => void)[] = [];
      const allActivities: Record<string, any[]> = {};

      const updateActivitiesState = () => {
        const merged: any[] = [];
        Object.keys(allActivities).forEach((clientUid) => {
          merged.push(...allActivities[clientUid]);
        });
        
        // Sort by completedAt desc
        merged.sort((a, b) => {
          const timeA = a.completedAt?.toMillis ? a.completedAt.toMillis() : 0;
          const timeB = b.completedAt?.toMillis ? b.completedAt.toMillis() : 0;
          return timeB - timeA;
        });

        // Limit to 10 recent activities
        setClientActivities(merged.slice(0, 10));
        setLoadingActivities(false);
      };

      clientList.forEach((client) => {
        const qWorkouts = query(
          collection(db, 'users', client.uid, 'completed_workouts'),
          orderBy('completedAt', 'desc')
        );

        const unsubW = onSnapshot(qWorkouts, (workoutsSnap) => {
          const workouts: any[] = [];
          workoutsSnap.forEach((wSnap) => {
            const w = wSnap.data();
            let timeText = 'Recent';
            if (w.completedAt) {
              const date = w.completedAt.toDate ? w.completedAt.toDate() : new Date();
              const diffMs = new Date().getTime() - date.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              if (diffMins < 1) {
                timeText = 'Just now';
              } else if (diffMins < 60) {
                timeText = `${diffMins}m ago`;
              } else if (diffHours < 24) {
                timeText = `${diffHours}h ago`;
              } else {
                timeText = date.toLocaleDateString();
              }
            }
            workouts.push({
              id: wSnap.id,
              name: client.name,
              detail: `Completed ${w.name} (${w.completedSets} sets, Vol: ${w.volume} lbs)`,
              time: timeText,
              completedAt: w.completedAt,
            });
          });
          allActivities[client.uid] = workouts;
          updateActivitiesState();
        }, (err) => {
          console.warn(`[TrainerDashboard] Error fetching workouts for client ${client.uid}:`, err);
        });

        unsubscribes.push(unsubW);
      });

      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    }, (err) => {
      console.warn('[TrainerDashboard] Error listening to clients:', err);
      setLoadingStats(false);
      setLoadingActivities(false);
    });

    return unsubscribeClients;
  }, [userData?.uid]);

  // Count unread threads
  const unreadThreadsCount = threads.filter((t) => t.unreadCount > 0).length;

  const handleBroadcast = async () => {
    const text = broadcastText.trim();
    if (!text) return;

    setBroadcasting(true);
    try {
      // Find all group chats
      const groupThreads = threads.filter((t) => t.type === 'group');
      if (groupThreads.length === 0) {
        // Fallback: send to strength-team if it exists
        await sendMessage('strength-team', `📢 COACH ANNOUNCEMENT: ${text}`);
      } else {
        // Send broadcast to all group chats
        for (const grp of groupThreads) {
          await sendMessage(grp.id, `📢 COACH ANNOUNCEMENT: ${text}`);
        }
      }
      setBroadcastText('');
      Alert.alert('Broadcast Sent', 'Your announcement has been posted to all active training group chats!');
    } catch (err) {
      console.warn('[TrainerDashboard] Broadcast failed:', err);
      Alert.alert('Error', 'Failed to send broadcast announcement.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Greeting Header */}
      <View style={styles.greetingHeader}>
        <Text style={styles.welcomeLabel}>COACH DASHBOARD</Text>
        <Text style={styles.welcomeTitle}>Welcome, {userData?.name || 'Coach'}! ⚡</Text>
      </View>

      {/* Stats Rings / Cards Row */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Users size={24} color={COLORS.primary} />
          <View style={styles.statMeta}>
            <Text style={styles.statLabel}>Total Clients</Text>
            {loadingStats ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>{athleteCount}</Text>
            )}
          </View>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <MessageSquare size={24} color={COLORS.secondary} />
          <View style={styles.statMeta}>
            <Text style={styles.statLabel}>Unread Chats</Text>
            <Text style={styles.statValue}>{unreadThreadsCount}</Text>
          </View>
        </GlassCard>
      </View>

      {/* Broadcast Announcement Bento Card */}
      <GlassCard style={styles.broadcastCard}>
        <View style={styles.cardHeader}>
          <Megaphone size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Group Broadcast</Text>
        </View>
        <Text style={styles.cardDesc}>
          Send a priority announcement to all active training groups simultaneously.
        </Text>
        <View style={styles.broadcastInputWrapper}>
          <TextInput
            style={styles.broadcastInput}
            placeholder="Type your coaching announcement here..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={broadcastText}
            onChangeText={setBroadcastText}
            multiline
            numberOfLines={3}
          />
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.broadcastBtn, !broadcastText.trim() && styles.disabledBtn]}
          onPress={handleBroadcast}
          disabled={!broadcastText.trim() || broadcasting}
        >
          {broadcasting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Text style={styles.broadcastBtnText}>Broadcast Update</Text>
              <Megaphone size={14} color="#000000" />
            </>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Client Progress Activity Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Client Activity</Text>
        <View style={styles.activityList}>
          {loadingActivities ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : clientActivities.length === 0 ? (
            <GlassCard style={styles.activityCard}>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', width: '100%', paddingVertical: 8 }}>
                No recent client workout activity found.
              </Text>
            </GlassCard>
          ) : (
            clientActivities.map((act) => (
              <GlassCard key={act.id} style={styles.activityCard}>
                <View style={styles.activityDot} />
                <View style={styles.activityMeta}>
                  <Text style={styles.activityUser}>{act.name}</Text>
                  <Text style={styles.activityDetail}>{act.detail}</Text>
                </View>
                <Text style={styles.activityTime}>{act.time}</Text>
              </GlassCard>
            ))
          )}
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/workouts' as any)}
          style={styles.quickLinkRow}
        >
          <GlassCard style={styles.quickLinkCard}>
            <View style={styles.quickLinkLeft}>
              <ClipboardList size={18} color={COLORS.primary} />
              <Text style={styles.quickLinkLabel}>Assign Exercises & Workouts</Text>
            </View>
            <ArrowRight size={16} color={COLORS.textMuted} />
          </GlassCard>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  greetingHeader: {
    gap: 4,
    marginTop: 10,
  },
  welcomeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: COLORS.primary,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  statMeta: {
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  broadcastCard: {
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  broadcastInputWrapper: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  broadcastInput: {
    color: COLORS.textPrimary,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  broadcastBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  broadcastBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  activityList: {
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  activityMeta: {
    flex: 1,
    gap: 2,
  },
  activityUser: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  activityDetail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    opacity: 0.8,
  },
  quickLinkRow: {
    width: '100%',
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  quickLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickLinkLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
