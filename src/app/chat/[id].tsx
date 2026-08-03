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
  Alert,
  Linking,
} from 'react-native';
import { ChevronLeft, Phone, Video, Send, Paperclip, Smile, FileText, ExternalLink } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../theme/colors';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '../../components/GlassCard';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { messages: allMessages, sendMessage, markAsRead, threads } = useChat();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [attaching, setAttaching] = useState(false);

  // File picking and uploading handler with option suggestion
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const fileAsset = res.assets[0];
      const localUri = fileAsset.uri;
      const name = fileAsset.name || 'document.pdf';

      console.log('[Chat] Picked file:', name, 'uri:', localUri);

      // Prompt user with suggestion to Pin as Meal Plan or send as regular PDF
      Alert.alert(
        'Send PDF Attachment',
        `Document: "${name}"\n\nHow would you like to send this PDF in the chat?`,
        [
          {
            text: '📌 Pin as Active Meal Plan',
            onPress: () => processUploadAndSend(localUri, name, true),
          },
          {
            text: '📄 Send as Regular PDF',
            onPress: () => processUploadAndSend(localUri, name, false),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.warn('[Chat] File picking failed:', err);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const processUploadAndSend = async (localUri: string, name: string, isMealPlan: boolean) => {
    try {
      setAttaching(true);
      let finalUrl = localUri;
      if (storage && user?.uid && id) {
        try {
          const response = await fetch(localUri);
          const blob = await response.blob();
          const storageRef = ref(storage, `chats/${id}/documents/${Date.now()}_${name}`);
          await uploadBytes(storageRef, blob);
          finalUrl = await getDownloadURL(storageRef);
          console.log('[Chat] File uploaded to Firebase Storage:', finalUrl);
        } catch (storageErr) {
          console.warn('[Chat] Storage upload fallback to local uri:', storageErr);
        }
      }

      // Send document message with meal plan flag
      await sendMessage(id!, '', finalUrl, name, 'pdf', isMealPlan);
      
      // Auto scroll
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      console.warn('[Chat] File send failed:', err);
      Alert.alert('Error', 'Failed to send file.');
    } finally {
      setAttaching(false);
    }
  };

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

  // Find all meal plan PDF messages
  const mealPlanPdfMessages = messages.filter(
    (m) =>
      m.isMealPlan ||
      (m.fileType === 'pdf' &&
        (m.fileName?.toLowerCase().includes('meal') ||
          m.fileName?.toLowerCase().includes('diet') ||
          m.fileName?.toLowerCase().includes('nutrition')))
  );

  // The latest meal plan PDF is the active pinned meal plan
  const activeMealPlanMsg =
    mealPlanPdfMessages.length > 0
      ? mealPlanPdfMessages[mealPlanPdfMessages.length - 1]
      : null;

  // Filter messages for chat history stream:
  // Hide old meal plan PDFs from history stream so only the active pinned meal plan is kept.
  // Regular PDF documents and text messages stay in the history stream!
  const displayedMessages = messages.filter((msg) => {
    const isMealPlanPdf =
      msg.isMealPlan ||
      (msg.fileType === 'pdf' &&
        (msg.fileName?.toLowerCase().includes('meal') ||
          msg.fileName?.toLowerCase().includes('diet') ||
          msg.fileName?.toLowerCase().includes('nutrition')));

    if (isMealPlanPdf) {
      // Hide old meal plan PDFs from chat history.
      return activeMealPlanMsg && msg.id === activeMealPlanMsg.id;
    }

    return true;
  });

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
        {/* Floating Active Meal Plan Banner */}
        {activeMealPlanMsg && (
          <GlassCard style={styles.mealPlanBanner}>
            <View style={styles.bannerLeft}>
              <View style={styles.pdfIconContainer}>
                <FileText size={18} color={COLORS.primary} />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerLabel}>Active Meal Plan</Text>
                <Text style={styles.bannerFileName} numberOfLines={1}>
                  {activeMealPlanMsg.fileName || 'Meal Plan.pdf'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.bannerViewButton}
              onPress={() => activeMealPlanMsg.fileUrl && Linking.openURL(activeMealPlanMsg.fileUrl)}
            >
              <Text style={styles.bannerViewText}>View</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

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

          {displayedMessages.map((msg) => {
            const isMe = msg.senderId === user?.uid || msg.senderId === 'me';
            const isMealPlanItem = msg.isMealPlan || (activeMealPlanMsg && msg.id === activeMealPlanMsg.id);
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
                    msg.fileUrl ? styles.fileBubble : null,
                  ]}
                >
                  {msg.fileUrl ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => Linking.openURL(msg.fileUrl!)}
                      style={styles.fileContainer}
                    >
                      <View style={styles.fileIconWrapper}>
                        <FileText size={20} color={isMe ? '#000000' : COLORS.primary} />
                      </View>
                      <View style={styles.fileMeta}>
                        <Text style={[styles.fileNameText, isMe ? styles.myFileNameText : styles.theirFileNameText]} numberOfLines={1}>
                          {msg.fileName || 'document.pdf'}
                        </Text>
                        <Text style={styles.fileSizeText}>
                          {isMealPlanItem ? '📌 Pinned Meal Plan' : 'PDF Document'}
                        </Text>
                      </View>
                      <ExternalLink size={14} color={isMe ? 'rgba(0,0,0,0.5)' : COLORS.textMuted} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe ? styles.myBubbleText : styles.theirBubbleText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  )}
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
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.inputAction}
            onPress={handlePickDocument}
            disabled={attaching}
          >
            {attaching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Paperclip size={18} color={COLORS.textMuted} />
            )}
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
  // Floating banner and file attachment styles
  mealPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pdfIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    gap: 2,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  bannerFileName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bannerViewButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  bannerViewText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  fileBubble: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 160,
    maxWidth: 240,
    padding: 6,
  },
  fileIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fileMeta: {
    flex: 1,
    gap: 1,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  myFileNameText: {
    color: '#000000',
  },
  theirFileNameText: {
    color: COLORS.textPrimary,
  },
  fileSizeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
