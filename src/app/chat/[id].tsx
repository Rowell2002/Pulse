import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Phone, Video, Send, Paperclip, Smile } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../theme/colors';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { messages: allMessages, sendMessage, markAsRead, threads } = useChat();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const thread = threads.find((t) => t.id === id);
  const messages = allMessages[id as string] || [];

  // Parse target user UID from thread ID
  // e.g. "dm_mock-user-123_emma-watson" -> "emma-watson"
  // e.g. "coach-sarah" -> "coach-sarah"
  const targetUid = id
    ? id.startsWith('dm_')
      ? id.replace('dm_', '').split('_').find((uid) => uid !== user?.uid)
      : id
    : null;

  // Resolve target user details
  useEffect(() => {
    if (!targetUid) {
      setProfileLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', targetUid));
        if (userDoc.exists()) {
          setTargetProfile(userDoc.data());
        }
      } catch (err) {
        console.warn('[Chat] Failed to load user profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, [targetUid]);

  // Mark chat as read
  useEffect(() => {
    if (id) {
      markAsRead(id as string);
    }
  }, [id, messages.length]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !id) return;
    setInputText('');
    await sendMessage(id, trimmed);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const formatMsgTime = (timeVal: any) => {
    if (!timeVal) return '';
    if (typeof timeVal === 'string') {
      if (timeVal.includes('T')) {
        try {
          return new Date(timeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          return timeVal;
        }
      }
      return timeVal;
    }
    try {
      const date = new Date(timeVal);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Determine displaying fields
  const displayName = targetProfile?.name || thread?.name || 'Pulse Athlete';
  const displaySubtitle = targetProfile?.bio || thread?.subtitle || 'Athlete';
  const displayAvatar = targetProfile?.avatar || thread?.avatar;
  const isOnline = targetProfile?.isOnline || thread?.isOnline || false;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {profileLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : displayAvatar ? (
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: displayAvatar }} style={styles.headerAvatar} />
              {isOnline && <View style={styles.onlineDot} />}
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {displayName.charAt(0)}
              </Text>
              {isOnline && <View style={styles.onlineDot} />}
            </View>
          )}
          <View style={styles.headerMeta}>
            <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{displaySubtitle}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.8} style={styles.headerActionBtn}>
            <Phone size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.headerActionBtn}>
            <Video size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Date separator */}
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>TODAY</Text>
            <View style={styles.dateLine} />
          </View>

          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid || msg.senderId === 'me';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isMe ? styles.myMessageRow : styles.theirMessageRow,
                ]}
              >
                {!isMe && displayAvatar && (
                  <Image
                    source={{ uri: displayAvatar }}
                    style={styles.messageBubbleAvatar}
                  />
                )}
                {!isMe && !displayAvatar && (
                  <View style={styles.messageBubbleAvatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {displayName.charAt(0)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.myBubble : styles.theirBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isMe ? styles.myBubbleText : styles.theirBubbleText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Time + status of last message */}
          {messages.length > 0 && (
            <View style={styles.lastMsgMeta}>
              <Text style={styles.lastMsgTime}>
                {formatMsgTime(messages[messages.length - 1]?.time)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity activeOpacity={0.8} style={styles.inputAction}>
            <Paperclip size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="default"
            />
            <TouchableOpacity activeOpacity={0.8}>
              <Smile size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSend}
            style={[styles.sendButton, inputText.trim().length > 0 && styles.sendButtonActive]}
          >
            <Send
              size={18}
              color={inputText.trim().length > 0 ? '#000000' : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.borderGlass,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerMeta: {
    gap: 1,
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 4,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dateText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    gap: 8,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  messageBubbleAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#000000',
    fontWeight: '500',
  },
  theirBubbleText: {
    color: COLORS.textSecondary,
  },
  lastMsgMeta: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  lastMsgTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: COLORS.background,
  },
  inputAction: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
