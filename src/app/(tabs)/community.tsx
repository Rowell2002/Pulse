import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Heart, MessageSquare, Share2, Award, Zap, MessageSquarePlus, Utensils, Users, ChevronRight, Search, X } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { useChat, ChatThread } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { threads, loading, searchUsers, startChatWithUser, markAsRead } = useChat();

  const handleMarkAllRead = async () => {
    try {
      const unreadThreads = threads.filter(t => t.unreadCount > 0);
      await Promise.all(unreadThreads.map(t => markAsRead(t.id)));
    } catch (err) {
      console.warn('[Community] Failed to mark all read:', err);
    }
  };

  const handleMessageMarcus = async () => {
    try {
      const targetUser = {
        uid: 'marcus-chen',
        name: 'Marcus Chen',
        username: 'marcus_chen',
        bio: 'Athlete • Strength Team',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpD2kh56DTxuXNZru_ypU6fp1vhMPBe7HmLtF-5DYPEZFG-hvzHHSircLkY_dtN-E3gZYybE0AzSIOK_pnQRbN1tNGY4MOlbpKDtIGssJVjtrN6e7BRKVBk9snjXG85eqLljffRMouUUUtBlAglVWF2_4VRjlDsmvMgP4Lujb0_qcPZdKtsT28MFX-EHuIaxCN4RCxiwvCs5PtIoNeFpVwI5S-ThqmMsB5JoeWgp6b9vjql6li4CAl2HDihZSJn615vXrXmy7YBH-k'
      };
      const chatId = await startChatWithUser(targetUser);
      router.push(`/chat/${chatId}` as any);
    } catch (err) {
      console.warn('[Community] Failed to start chat with Marcus:', err);
    }
  };

  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);

  // Debounced search for users inside the modal
  useEffect(() => {
    const fetchUsers = async () => {
      setSearching(true);
      try {
        const results = await searchUsers(userQuery);
        setUserResults(results);
      } catch (err) {
        console.warn('[Community] Error searching users:', err);
      } finally {
        setSearching(false);
      }
    };

    if (modalVisible) {
      const timer = setTimeout(fetchUsers, 300);
      return () => clearTimeout(timer);
    }
  }, [userQuery, modalVisible]);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: '💪 Marcus Chen just crushed 225lb bench press on PULSE! Check it out! ⚡',
        title: 'Strength Team — PULSE',
      });
    } catch (e) {
      // cancelled
    }
  };

  const handleStartChat = async (targetUser: any) => {
    try {
      const chatId = await startChatWithUser(targetUser);
      setModalVisible(false);
      setUserQuery('');
      // Navigate to direct chat
      router.push(`/chat/${chatId}` as any);
    } catch (err) {
      console.error('[Community] Failed to start chat:', err);
    }
  };

  const formatLastMessageTime = (timeStr: any) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) {
        if (date.getDate() === now.getDate()) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return `${diffHours}h ago`;
      }
      if (diffMs < 48 * 3600000 && date.getDate() === now.getDate() - 1) {
        return 'Yesterday';
      }
      if (diffMs < 7 * 24 * 3600000) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Yesterday';
    }
  };

  // Filter threads by search query
  const filteredThreads = threads.filter((thread) => {
    const q = chatSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      thread.name.toLowerCase().includes(q) ||
      thread.lastMessage.toLowerCase().includes(q) ||
      (thread.subtitle && thread.subtitle.toLowerCase().includes(q))
    );
  });



  return (
    <View style={styles.container}>
      {/* Header Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={chatSearchQuery}
            onChangeText={setChatSearchQuery}
            autoCapitalize="none"
          />
          {chatSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setChatSearchQuery('')} activeOpacity={0.8}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hide highlights/challenges when active search is filtering */}
        {!chatSearchQuery && (
          <>
            {/* Feed Highlights */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Feed Highlights</Text>
              <GlassCard style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpD2kh56DTxuXNZru_ypU6fp1vhMPBe7HmLtF-5DYPEZFG-hvzHHSircLkY_dtN-E3gZYybE0AzSIOK_pnQRbN1tNGY4MOlbpKDtIGssJVjtrN6e7BRKVBk9snjXG85eqLljffRMouUUUtBlAglVWF2_4VRjlDsmvMgP4Lujb0_qcPZdKtsT28MFX-EHuIaxCN4RCxiwvCs5PtIoNeFpVwI5S-ThqmMsB5JoeWgp6b9vjql6li4CAl2HDihZSJn615vXrXmy7YBH-k',
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.authorMeta}>
                    <Text style={styles.authorName}>Marcus Chen</Text>
                    <Text style={styles.postTime}>
                      2 hours ago • <Text style={styles.teamText}>Strength Team</Text>
                    </Text>
                  </View>
                  <View style={styles.pbBadge}>
                    <Award size={12} color={COLORS.primary} />
                    <Text style={styles.pbText}>Personal Best</Text>
                  </View>
                </View>

                <Text style={styles.postContent}>
                  Finally crushed the 225lb bench press for reps! Consistency in the Shred Challenge is paying off. Keep pushing everyone! ⚡️
                </Text>

                <View style={styles.postImageWrapper}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHmKv3PZkU3W8xtr6c9tmbTBbBIgeoWLPAtjpGBgVPczsCDuoi2zCSsBfl2QlPD0_RBMFUFD-n0h-NY-EEoiLu1Eie3NWb_fu7r31ZXMGpDkPsu1VUlwCItd9a2Y3f7I-Lm8qXO0HlneympiBGJqmaw1XSSgKHKDCFx1D0mqDUKqUtAhxKCU50lriZSmPTVGC740plMexWJbDnWX3guDdYfQGwYwyleZxmXuEA3NUKnKqJC4Hfipm7yjG22AEiBjuMxuIXeR_KxUqJ',
                    }}
                    style={styles.postImage}
                  />
                  <View style={styles.postGradientOverlay} />
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLike}
                    style={styles.actionButton}
                  >
                    <Heart
                      size={16}
                      color={liked ? COLORS.error : COLORS.textMuted}
                      fill={liked ? COLORS.error : 'transparent'}
                    />
                    <Text style={[styles.actionText, liked && { color: COLORS.error }]}>
                      {likeCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleMessageMarcus}
                    style={styles.actionButton}
                  >
                    <MessageSquare size={16} color={COLORS.textMuted} />
                    <Text style={styles.actionText}>12</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleShare}
                    style={styles.actionButton}
                  >
                    <Share2 size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </View>

            {/* Active Challenges */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Active Challenges</Text>
              <GlassCard style={styles.challengeCard}>
                <View style={styles.challengeLeft}>
                  <View style={styles.challengeIconWrapper}>
                    <Zap size={22} color={COLORS.primary} fill={COLORS.primary} />
                  </View>
                  <View style={styles.challengeMeta}>
                    <Text style={styles.challengeTitle}>6-Week Shred Challenge</Text>
                    <Text style={styles.challengeCount}>1,240 active members</Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/chat/group/shred-challenge' as any)}
                  style={styles.joinButton}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          </>
        )}

        {/* Chats Section */}
        <View style={styles.section}>
          <View style={styles.recentChatsHeader}>
            <Text style={styles.sectionLabel}>Chats & Groups</Text>
            {threads.some(t => t.unreadCount > 0) && (
              <TouchableOpacity activeOpacity={0.8} onPress={handleMarkAllRead}>
                <Text style={styles.markAllReadText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : filteredThreads.length === 0 ? (
            <GlassCard style={styles.emptyChatsCard}>
              <Text style={styles.emptyChatsText}>
                {chatSearchQuery ? 'No chats match your search.' : 'No conversations active. Start one!'}
              </Text>
            </GlassCard>
          ) : (
            <View style={styles.chatsList}>
              {filteredThreads.map((thread) => {
                const isGroup = thread.type === 'group';
                const detailRoute = isGroup ? `/chat/group/${thread.id}` : `/chat/${thread.id}`;

                return (
                  <TouchableOpacity
                    key={thread.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      markAsRead(thread.id);
                      router.push(detailRoute as any);
                    }}
                  >
                    <GlassCard style={[styles.chatCard, thread.unreadCount === 0 && thread.type === 'direct' && thread.id === 'james-wilson' && styles.mutedChatCard]}>
                      {isGroup ? (
                        <View style={[styles.groupEmojiWrapper, { borderColor: (thread.accentColor || COLORS.primary) + '40' }]}>
                          <Text style={styles.groupEmojiText}>{thread.emoji || '👥'}</Text>
                        </View>
                      ) : (
                        <View style={styles.chatAvatarWrapper}>
                          {thread.avatar ? (
                            <Image
                              source={{ uri: thread.avatar }}
                              style={styles.chatAvatar}
                            />
                          ) : (
                            <View style={styles.chatIconWrapper}>
                              <Text style={styles.placeholderInitial}>
                                {thread.name.charAt(0)}
                              </Text>
                            </View>
                          )}
                          {thread.isOnline && <View style={styles.onlineDot} />}
                        </View>
                      )}

                      <View style={styles.chatContent}>
                        <View style={styles.chatHeader}>
                          <Text style={styles.chatName}>{thread.name}</Text>
                          <Text style={styles.chatTime}>
                            {formatLastMessageTime(thread.lastMessageTime)}
                          </Text>
                        </View>
                        {isGroup && thread.memberCount && (
                          <View style={styles.groupMeta}>
                            <Users size={10} color={COLORS.textMuted} />
                            <Text style={styles.groupMemberText}>
                              {thread.memberCount.toLocaleString()} members
                            </Text>
                          </View>
                        )}
                        <Text
                          style={[
                            styles.chatSnippet,
                            thread.unreadCount > 0 && styles.unreadSnippet
                          ]}
                          numberOfLines={1}
                        >
                          {thread.lastMessage}
                        </Text>
                      </View>

                      {thread.unreadCount > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                        </View>
                      ) : (
                        <ChevronRight size={16} color={COLORS.textMuted} />
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (Opens User Search Modal) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setModalVisible(true)}
        style={styles.fab}
      >
        <MessageSquarePlus size={26} color="#000000" />
      </TouchableOpacity>

      {/* Slide-Up Bottom Sheet Modal for Search Registered Users */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Modal Drag Indicator */}
            <View style={styles.dragIndicator} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Conversation</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.8}
              >
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Search Bar */}
            <View style={styles.modalSearchWrapper}>
              <Search size={16} color={COLORS.textMuted} style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search athletes by name..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={userQuery}
                onChangeText={setUserQuery}
                autoFocus
                autoCapitalize="none"
              />
              {userQuery.length > 0 && (
                <TouchableOpacity onPress={() => setUserQuery('')} activeOpacity={0.8}>
                  <X size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Matching Users List / Suggested Athletes */}
            <ScrollView
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {searching ? (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : userResults.length === 0 ? (
                <View style={styles.emptyResultsContainer}>
                  <Text style={styles.emptyResultsText}>
                    {userQuery.trim().length > 0 ? 'No athletes found with that name.' : 'No registered athletes found.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.resultsWrapper}>
                  <Text style={styles.listSectionTitle}>
                    {userQuery.trim().length > 0 ? 'Search Results' : 'Suggested Athletes'}
                  </Text>
                  {userResults.map((u) => (
                    <TouchableOpacity
                      key={u.uid}
                      style={styles.userRow}
                      activeOpacity={0.8}
                      onPress={() => handleStartChat(u)}
                    >
                      {u.avatar ? (
                        <Image source={{ uri: u.avatar }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatarPlaceholder}>
                          <Text style={styles.userInitial}>{u.name.charAt(0)}</Text>
                        </View>
                      )}
                      <View style={styles.userMeta}>
                        <Text style={styles.userName}>{u.name}</Text>
                        <Text style={styles.userUsername}>@{u.username}</Text>
                        {u.bio ? (
                          <Text style={styles.userBio} numberOfLines={1}>
                            {u.bio}
                          </Text>
                        ) : null}
                      </View>
                      <ChevronRight size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra space for FAB
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  postCard: {
    padding: 16,
    gap: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  authorMeta: {
    gap: 2,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  postTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  teamText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  pbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pbText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  postImageWrapper: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  challengeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeMeta: {
    gap: 2,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  challengeCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  recentChatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markAllReadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  chatsList: {
    gap: 8,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  mutedChatCard: {
    opacity: 0.6,
  },
  chatAvatarWrapper: {
    position: 'relative',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: '#000000',
  },
  placeholderInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  chatIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chatName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  chatTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  chatSnippet: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  unreadSnippet: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyChatsCard: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 40,
  },
  groupEmojiWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupEmojiText: {
    fontSize: 22,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMemberText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 16,
  },
  modalSearchIcon: {
    marginRight: 2,
  },
  modalSearchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  modalLoaderContainer: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultsContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  resultsWrapper: {
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  userUsername: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  userBio: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
