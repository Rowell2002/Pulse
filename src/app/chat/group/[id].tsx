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
} from 'react-native';
import { ChevronLeft, Users, MoreVertical, Send, Paperclip, Smile, Pin } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../theme/colors';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';

export default function GroupChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { messages: allMessages, sendMessage, threads, markAsRead } = useChat();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');

  const thread = threads.find((t) => t.id === id);
  const messages = allMessages[id as string] || [];

  // Mark group chat as read
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

  // Resolve displaying group attributes
  const name = thread?.name || 'Group';
  const description = thread?.subtitle || 'Group chat';
  const memberCount = thread?.memberCount || 0;
  const emoji = thread?.emoji || '👥';
  const color = thread?.accentColor || COLORS.primary;

  const pinnedMessage = messages.find((m) => m.isPinned);

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
          <View style={[styles.groupEmoji, { borderColor: color + '40' }]}>
            <Text style={styles.groupEmojiText}>{emoji}</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
            <View style={styles.memberCountRow}>
              <Users size={10} color={COLORS.textMuted} />
              <Text style={styles.memberCountText}>
                {memberCount.toLocaleString()} members
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.headerActionBtn}>
          <MoreVertical size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Pinned message banner */}
      {pinnedMessage && (
        <View style={styles.pinnedBanner}>
          <Pin size={11} color={COLORS.primary} />
          <Text style={styles.pinnedText} numberOfLines={1}>
            📌 {pinnedMessage.text}
          </Text>
        </View>
      )}

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
            <Text style={styles.dateText}>THIS WEEK</Text>
            <View style={styles.dateLine} />
          </View>

          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid || msg.senderId === 'me';
            return (
              <View key={msg.id}>
                {/* Sender name for other group members */}
                {!isMe && (
                  <Text style={styles.senderLabel}>
                    {msg.senderName || 'Athlete'}
                  </Text>
                )}

                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.myMessageRow : styles.theirMessageRow,
                  ]}
                >
                  {!isMe && (
                    <>
                      {msg.senderAvatar ? (
                        <Image
                          source={{ uri: msg.senderAvatar }}
                          style={styles.messageBubbleAvatar}
                        />
                      ) : (
                        <View style={styles.messageBubbleAvatarPlaceholder}>
                          <Text style={styles.avatarInitial}>
                            {(msg.senderName || 'A').charAt(0)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.theirBubble,
                      msg.isPinned && styles.pinnedBubble,
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

                <Text
                  style={[
                    styles.msgTime,
                    isMe ? styles.myMsgTime : styles.theirMsgTime,
                  ]}
                >
                  {formatMsgTime(msg.time)}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity activeOpacity={0.8} style={styles.inputAction}>
            <Paperclip size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Message group..."
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
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && styles.sendButtonActive,
            ]}
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
  groupEmoji: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupEmojiText: {
    fontSize: 20,
  },
  headerMeta: {
    gap: 2,
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
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
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204, 255, 0, 0.12)',
  },
  pinnedText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
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
    gap: 2,
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
  senderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 44,
    marginBottom: 3,
    marginTop: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubbleAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  messageBubbleAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  pinnedBubble: {
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderWidth: 1,
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
  msgTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
    marginBottom: 6,
  },
  myMsgTime: {
    textAlign: 'right',
    marginRight: 4,
  },
  theirMsgTime: {
    marginLeft: 44,
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
