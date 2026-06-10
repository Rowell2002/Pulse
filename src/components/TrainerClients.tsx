import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, ChevronRight, ChevronLeft, Plus, Trash2, MessageSquare, Dumbbell, Award, User, Check } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GlassCard } from './GlassCard';
import { EXERCISES, Exercise } from '../constants/exerciseDb';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';

export const TrainerClients: React.FC = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { startChatWithUser } = useChat();

  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Assignment form state
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISES[0]?.id || '');
  const [targetSets, setTargetSets] = useState('3');
  const [targetReps, setTargetReps] = useState('10');
  const [targetWeight, setTargetWeight] = useState('0');
  const [assigning, setAssigning] = useState(false);

  // Active client assignments state
  const [assignedExercises, setAssignedExercises] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Fetch all registered athletes (non-trainers)
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const u = docSnap.data();
          if (u.uid !== user?.uid && u.role !== 'trainer') {
            list.push(u);
          }
        });
        setClients(list);
      } catch (err) {
        console.warn('[TrainerClients] Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [user]);

  // Load selected client's active exercise assignments
  useEffect(() => {
    if (!selectedClient) {
      setAssignedExercises([]);
      return;
    }

    setLoadingAssignments(true);
    const q = query(
      collection(db, 'users', selectedClient.uid, 'assigned_exercises'),
      orderBy('assignedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: any[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ docId: docSnap.id, ...docSnap.data() });
        });
        setAssignedExercises(list);
        setLoadingAssignments(false);
      },
      (err) => {
        console.warn('[TrainerClients] Error listening to assignments:', err);
        setLoadingAssignments(false);
      }
    );

    return unsubscribe;
  }, [selectedClient]);

  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  // Load selected client's completed workouts history
  useEffect(() => {
    if (!selectedClient) {
      setCompletedWorkouts([]);
      return;
    }

    setLoadingCompleted(true);
    const q = query(
      collection(db, 'users', selectedClient.uid, 'completed_workouts'),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: any[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            ...data,
            completedAtText: data.completedAt?.toDate
              ? data.completedAt.toDate().toLocaleDateString()
              : new Date().toLocaleDateString(),
          });
        });
        setCompletedWorkouts(list);
        setLoadingCompleted(false);
      },
      (err) => {
        console.warn('[TrainerClients] Error listening to completed workouts:', err);
        setLoadingCompleted(false);
      }
    );

    return unsubscribe;
  }, [selectedClient]);

  // Handle assigning an exercise
  const handleAssignExercise = async () => {
    if (!selectedClient || !user) return;
    const exercise = EXERCISES.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;

    setAssigning(true);
    try {
      const setsNum = parseInt(targetSets) || 3;
      const repsNum = parseInt(targetReps) || 10;
      const weightNum = parseFloat(targetWeight) || 0;

      const assignmentRef = doc(
        db,
        'users',
        selectedClient.uid,
        'assigned_exercises',
        selectedExerciseId
      );

      await setDoc(assignmentRef, {
        id: selectedExerciseId,
        name: exercise.name,
        category: exercise.category,
        sets: setsNum,
        reps: repsNum,
        weight: weightNum,
        assignedBy: user.uid,
        assignedAt: serverTimestamp(),
      });

      // Establish trainer relationship on client's user document
      const clientUserRef = doc(db, 'users', selectedClient.uid);
      await setDoc(clientUserRef, { trainerId: user.uid }, { merge: true });

      // Write notification document to `/users/{clientUid}/notifications`
      const notifRef = doc(collection(db, 'users', selectedClient.uid, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        category: 'Training',
        type: 'workout',
        title: 'New Workout Assigned',
        snippet: `${userData?.name || 'Your Trainer'} assigned "${exercise.name}" (${setsNum} sets x ${repsNum} reps @ ${weightNum} lbs).`,
        highlight: `"${exercise.name}"`,
        unread: true,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', `${exercise.name} assigned to ${selectedClient.name}!`);
      // Reset form
      setTargetSets('3');
      setTargetReps('10');
      setTargetWeight('0');
    } catch (err) {
      console.warn('[TrainerClients] Failed to assign exercise:', err);
      Alert.alert('Error', 'Failed to assign exercise to the database.');
    } finally {
      setAssigning(false);
    }
  };

  // Handle deleting an assignment
  const handleDeleteAssignment = async (docId: string, exerciseName: string) => {
    if (!selectedClient) return;

    Alert.alert(
      'Remove Assignment',
      `Are you sure you want to remove ${exerciseName} from ${selectedClient.name}'s assigned list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const ref = doc(db, 'users', selectedClient.uid, 'assigned_exercises', docId);
              await deleteDoc(ref);
            } catch (err) {
              console.warn('[TrainerClients] Failed to delete assignment:', err);
              Alert.alert('Error', 'Failed to remove assignment.');
            }
          },
        },
      ]
    );
  };

  // Open direct messaging
  const handleMessageClient = async () => {
    if (!selectedClient) return;
    try {
      const chatId = await startChatWithUser(selectedClient);
      router.push(`/chat/${chatId}` as any);
    } catch (err) {
      console.warn('[TrainerClients] Failed to open DM:', err);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  // If a client is selected, show their full management workspace
  if (selectedClient) {
    return (
      <View style={styles.container}>
        <View style={styles.workspaceHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedClient(null)}
            style={styles.backButton}
          >
            <ChevronLeft size={20} color={COLORS.textPrimary} />
            <Text style={styles.backButtonText}>Back to Clients</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Client profile bento card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {selectedClient.avatar ? (
                <Image source={{ uri: selectedClient.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.placeholderInitial}>{selectedClient.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{selectedClient.name}</Text>
                <Text style={styles.profileUsername}>@{selectedClient.username}</Text>
                <View style={styles.goalBadge}>
                  <Award size={12} color={COLORS.primary} />
                  <Text style={styles.goalText}>
                    GOAL: {(selectedClient.selectedGoal || 'NOT SET').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            {selectedClient.bio && <Text style={styles.profileBio}>{selectedClient.bio}</Text>}

            {/* Chat shortcut button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.messageBtn}
              onPress={handleMessageClient}
            >
              <MessageSquare size={16} color="#000000" />
              <Text style={styles.messageBtnText}>Message Client</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Form to assign a new exercise */}
          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Assign New Exercise</Text>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SELECT EXERCISE</Text>
              <View style={styles.pickerWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
                  {EXERCISES.map((ex) => {
                    const isSelected = selectedExerciseId === ex.id;
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        onPress={() => setSelectedExerciseId(ex.id)}
                        style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      >
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                          {ex.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.formLabel}>TARGET SETS</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={targetSets}
                  onChangeText={setTargetSets}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.formLabel}>TARGET REPS</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={targetReps}
                  onChangeText={setTargetReps}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.formLabel}>WEIGHT (LBS)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.assignBtn}
              onPress={handleAssignExercise}
              disabled={assigning}
            >
              {assigning ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Plus size={16} color="#000000" />
                  <Text style={styles.assignBtnText}>Assign Exercise</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* List of currently assigned exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currently Assigned Exercises</Text>
            {loadingAssignments ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 16 }} />
            ) : assignedExercises.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>No exercises currently assigned to this athlete.</Text>
              </GlassCard>
            ) : (
              <View style={styles.assignmentsList}>
                {assignedExercises.map((asg) => (
                  <GlassCard key={asg.docId} style={styles.assignmentCard}>
                    <View style={styles.assignmentInfo}>
                      <View style={styles.exerciseIconWrapper}>
                        <Dumbbell size={16} color={COLORS.primary} />
                      </View>
                      <View>
                        <Text style={styles.assignmentName}>{asg.name}</Text>
                        <Text style={styles.assignmentMeta}>
                          {asg.sets} Sets • {asg.reps} Reps • {asg.weight} lbs
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleDeleteAssignment(asg.docId, asg.name)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </GlassCard>
                ))}
              </View>
            )}
          </View>

          {/* Completed Workouts Log */}
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Completed Workouts History</Text>
            {loadingCompleted ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 16 }} />
            ) : completedWorkouts.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>No workouts completed yet by this athlete.</Text>
              </GlassCard>
            ) : (
              <View style={styles.assignmentsList}>
                {completedWorkouts.map((w) => (
                  <GlassCard key={w.id} style={styles.assignmentCard}>
                    <View style={styles.assignmentInfo}>
                      <View style={[styles.exerciseIconWrapper, { backgroundColor: 'rgba(204, 255, 0, 0.05)', borderColor: 'rgba(204, 255, 0, 0.15)' }]}>
                        <Check size={18} color={COLORS.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assignmentName}>{w.name}</Text>
                        <Text style={styles.assignmentMeta}>
                          {w.completedSets} Sets completed • {w.volume?.toLocaleString()} kg volume • {w.time}
                        </Text>
                        <Text style={styles.completedDateText}>Completed on {w.completedAtText}</Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Else render client directory list
  return (
    <View style={styles.container}>
      {/* Search clients input */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients by name..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Client Directory</Text>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : filteredClients.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No registered clients found.</Text>
            </GlassCard>
          ) : (
            <View style={styles.clientsList}>
              {filteredClients.map((client) => (
                <TouchableOpacity
                  key={client.uid}
                  activeOpacity={0.8}
                  onPress={() => setSelectedClient(client)}
                >
                  <GlassCard style={styles.clientCard}>
                    {client.avatar ? (
                      <Image source={{ uri: client.avatar }} style={styles.clientAvatar} />
                    ) : (
                      <View style={styles.clientAvatarPlaceholder}>
                        <Text style={styles.placeholderInitial}>{client.name.charAt(0)}</Text>
                      </View>
                    )}
                    <View style={styles.clientContent}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      <Text style={styles.clientUsername}>@{client.username}</Text>
                      {client.selectedGoal && (
                        <Text style={styles.clientGoal} numberOfLines={1}>
                          Goal: {client.selectedGoal.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  clientsList: {
    gap: 8,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  clientAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  clientContent: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  clientUsername: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  clientGoal: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Workspace styles
  workspaceHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    padding: 20,
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  profileUsername: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  goalText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  messageBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  messageBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Assignment Form Styles
  formCard: {
    padding: 20,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  pickerWrapper: {
    height: 44,
  },
  pickerList: {
    gap: 8,
    alignItems: 'center',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pickerItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(204,255,0,0.1)',
  },
  pickerItemText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: COLORS.primary,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
    gap: 6,
  },
  formInput: {
    height: 44,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  assignBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  assignBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Assignments List Styles
  assignmentsList: {
    gap: 8,
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  assignmentMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  completedDateText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
