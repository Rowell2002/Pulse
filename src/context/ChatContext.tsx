import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth, db } from '../config/firebase';
import { COLORS } from '../theme/colors';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  Timestamp,
  limit,
  startAt,
  endAt,
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  time: any; // Timestamp or formatted time string
  isPinned?: boolean;
}

export interface ChatThread {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  name: string;
  subtitle: string;
  avatar?: string;
  emoji?: string;
  accentColor?: string;
  memberCount?: number;
  lastMessage: string;
  lastMessageTime: any; // ISO time string or Timestamp
  unreadCount: number;
  isOnline?: boolean;
}

interface ChatContextType {
  threads: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  loading: boolean;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  startChatWithUser: (targetUser: { uid: string; name: string; username: string; avatar?: string; bio?: string }) => Promise<string>;
  searchUsers: (searchQuery: string) => Promise<any[]>;
  markAsRead: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);

  // Initialize and load chats
  useEffect(() => {
    if (!user) {
      setThreads([]);
      setMessages({});
      setLoading(false);
      return;
    }

    if (!db) {
      console.error('[ChatContext] Firestore db is not initialized. Skipping initialization.');
      setLoading(false);
      return;
    }

    // Real Firestore Mode
    // 1. Initialize Default Groups & DMs in Firestore if they don't exist
    const initializeDefaultFirestoreData = async () => {
      try {
        const defaultGroups = [
          {
            id: 'strength-team',
            type: 'group',
            participants: [],
            name: 'Strength Team',
            subtitle: 'Heavy lifting, big gains.',
            emoji: '💪',
            accentColor: COLORS.primary,
            memberCount: 24,
            lastMessage: 'Marcus: Thanks guys!! The Shred Challenge consistency is paying off. Keep pushing!',
            lastMessageTime: new Date(Date.now() - 2 * 3600000),
            unreadCount: 0,
          },
          {
            id: 'shred-challenge',
            type: 'group',
            participants: [],
            name: '6-Week Shred Challenge',
            subtitle: '1,240 athletes. One goal.',
            emoji: '⚡',
            accentColor: COLORS.warning,
            memberCount: 1240,
            lastMessage: 'Marcus: YES. Coach tweaked the rest intervals. Way harder!',
            lastMessageTime: new Date(Date.now() - 24 * 3600000),
            unreadCount: 0,
          },
          {
            id: 'morning-run',
            type: 'group',
            participants: [],
            name: 'Morning Run Club',
            subtitle: '5AM crew. No excuses.',
            emoji: '🏃',
            accentColor: COLORS.tertiary,
            memberCount: 58,
            lastMessage: 'Alex T.: Let\'s do 8km this time. We\'ve been slacking at 6km',
            lastMessageTime: new Date(Date.now() - 48 * 3600000),
            unreadCount: 0,
          }
        ];

        for (const grp of defaultGroups) {
          const grpRef = doc(db, 'chats', grp.id);
          const snap = await getDoc(grpRef);
          if (!snap.exists()) {
            await setDoc(grpRef, {
              ...grp,
              participants: [user.uid],
              lastMessageTime: Timestamp.fromDate(grp.lastMessageTime)
            });

            // Seed initial messages subcollection
            const msgsRef = collection(db, 'chats', grp.id, 'messages');
            let defaultMsgs: any[] = [];
            if (grp.id === 'strength-team') {
              defaultMsgs = [
                { text: 'Morning crew! Who\'s hitting the gym today?', senderId: 'coach-sarah', senderName: 'Coach Sarah', time: new Date(Date.now() - 4 * 3600000) },
                { text: 'Me! Leg day. Dreading it but let\'s go 💀', senderId: 'marcus-chen', senderName: 'Marcus Chen', time: new Date(Date.now() - 3.9 * 3600000) },
                { text: 'Marcus just hit 225lbs bench press for reps! New group record!! 🏆', senderId: 'coach-sarah', senderName: 'Coach Sarah', time: new Date(Date.now() - 2.5 * 3600000), isPinned: true },
                { text: 'Thanks guys!! The Shred Challenge consistency is paying off. Keep pushing!', senderId: 'marcus-chen', senderName: 'Marcus Chen', time: new Date(Date.now() - 2 * 3600000) }
              ];
            } else if (grp.id === 'shred-challenge') {
              defaultMsgs = [
                { text: 'Week 3 check-in! How\'s everyone\'s progress?', senderId: 'admin', senderName: 'Challenge Admin', time: new Date(Date.now() - 3.5 * 24 * 3600000) },
                { text: 'Down 4lbs from week 1! Nutrition discipline is everything 💯', senderId: 'jordan', senderName: 'Jordan K.', time: new Date(Date.now() - 3.4 * 24 * 3600000) },
                { text: 'Cardio every morning is brutal but worth it', senderId: 'priya', senderName: 'Priya M.', time: new Date(Date.now() - 2 * 24 * 3600000) },
                { text: 'YES. Coach tweaked the rest intervals. Way harder!', senderId: 'marcus-chen', senderName: 'Marcus Chen', time: new Date(Date.now() - 22 * 3600000) }
              ];
            } else if (grp.id === 'morning-run') {
              defaultMsgs = [
                { text: '5AM tomorrow. Riverside route. Who\'s in?', senderId: 'run-lead', senderName: 'Run Lead', time: new Date(Date.now() - 2 * 24 * 3600000) },
                { text: 'Let\'s do 8km this time. We\'ve been slacking at 6km', senderId: 'alex-t', senderName: 'Alex T.', time: new Date(Date.now() - 25 * 3600000) }
              ];
            }

            for (const msg of defaultMsgs) {
              await addDoc(msgsRef, {
                ...msg,
                time: Timestamp.fromDate(msg.time)
              });
            }
          } else {
            // Group already exists, make sure user is in participants list
            const currentData = snap.data();
            const currentParticipants = currentData?.participants || [];
            if (!currentParticipants.includes(user.uid)) {
              await updateDoc(grpRef, {
                participants: [...currentParticipants, user.uid]
              });
            }
          }
        }

        // Seed coach-sarah and nutrition DM threads for user if missing
        const defaultDMs = [
          {
            id: `dm_${[user.uid, 'coach-sarah'].sort().join('_')}`,
            type: 'direct',
            participants: [user.uid, 'coach-sarah'],
            name: 'Coach Sarah',
            subtitle: 'Personal Trainer • Online',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL40S2aGC_J6AYPUSZ-IvFLMzAJJ8jjiyg38PCvhPwsr8ZUuPJDROayW0iNcuVZEZoMAfJVd0pKkGgZN0sJGCRAQvZoALlD8dQ1aljmR1m_jU1ZFlnYsp-huMlPnb7cqMP-La1W9U5vo38JCQPVH9L7vRcLjB3HYN0vMnlOt8UdduR4B8_X-9tKt9-MBYmCtSlfv0gYQmCvNuVU1Q42TTOKvSqa4lw7R9ONZ7PDeg3FBvCs9gMJ9N2wQFXlwOUeuJcQhUmlkWRx1c5',
            lastMessage: 'Your macros look perfect for today! Keep it up, you\'re crushing it ⚡️',
            lastMessageTime: new Date(Date.now() - 12 * 60000),
            unreadCount: 0,
          },
          {
            id: `dm_${[user.uid, 'nutrition'].sort().join('_')}`,
            type: 'direct',
            participants: [user.uid, 'nutrition'],
            name: '1-on-1 Nutrition',
            subtitle: 'Nutrition Coach • Active',
            lastMessage: 'How was your post-workout meal?',
            lastMessageTime: new Date(Date.now() - 2.5 * 3600000),
            unreadCount: 0,
          }
        ];

        for (const dm of defaultDMs) {
          const dmRef = doc(db, 'chats', dm.id);
          const snap = await getDoc(dmRef);
          if (!snap.exists()) {
            await setDoc(dmRef, {
              ...dm,
              lastMessageTime: Timestamp.fromDate(dm.lastMessageTime)
            });

            const msgsRef = collection(db, 'chats', dm.id, 'messages');
            let defaultMsgs: any[] = [];
            if (dm.name === 'Coach Sarah') {
              defaultMsgs = [
                { text: 'Hey! How are you feeling after yesterday\'s push day?', senderId: 'coach-sarah', time: new Date(Date.now() - 2 * 3600000) },
                { text: 'That\'s exactly what we want. Progressive overload working. I checked your macros for the week — you\'re on track!', senderId: 'coach-sarah', time: new Date(Date.now() - 1.8 * 3600000) },
                { text: 'Leg day! We\'re hitting heavy squats, Romanian deadlifts, and finishing with calf raises. Be there at 6PM.', senderId: 'coach-sarah', time: new Date(Date.now() - 1.4 * 3600000) },
                { text: 'Your macros look perfect for today! Keep it up, you\'re crushing it ⚡️', senderId: 'coach-sarah', time: new Date(Date.now() - 12 * 60000) }
              ];
            } else {
              defaultMsgs = [
                { text: 'Welcome to your nutrition coaching session! I\'ve reviewed your food log from last week.', senderId: 'nutrition', time: new Date(Date.now() - 24 * 3600000) },
                { text: 'How was your post-workout meal?', senderId: 'nutrition', time: new Date(Date.now() - 2.5 * 3600000) }
              ];
            }

            for (const msg of defaultMsgs) {
              await addDoc(msgsRef, {
                ...msg,
                time: Timestamp.fromDate(msg.time)
              });
            }
          }
        }
      } catch (err) {
        console.warn('[ChatContext] Failed to seed default Firestore chat data:', err);
      }
    };

    // Run seeding
    initializeDefaultFirestoreData();

    // Setup subscription to active chats where the user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (querySnap) => {
      const loadedThreads: ChatThread[] = [];
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const threadTime = data.lastMessageTime
          ? (data.lastMessageTime as Timestamp).toDate().toISOString()
          : new Date().toISOString();

        loadedThreads.push({
          id: docSnap.id,
          type: data.type,
          participants: data.participants || [],
          name: data.name,
          subtitle: data.subtitle || '',
          avatar: data.avatar,
          emoji: data.emoji,
          accentColor: data.accentColor,
          memberCount: data.memberCount,
          lastMessage: data.lastMessage || '',
          lastMessageTime: threadTime,
          unreadCount: data.unreadCount || 0,
          isOnline: data.isOnline,
        });
      });

      // Sort chronologically
      loadedThreads.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      setThreads(loadedThreads);
      setLoading(false);
    });

    return () => {
      unsubscribeChats();
    };
  }, [user]);

  // Load message collections dynamically in real time
  const subscribeToMessages = (chatId: string) => {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnap) => {
      const loadedMsgs: ChatMessage[] = [];
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedTime = 'Just now';
        if (data.time) {
          const date = (data.time as Timestamp).toDate();
          formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        loadedMsgs.push({
          id: docSnap.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          time: formattedTime,
          isPinned: data.isPinned || false,
        });
      });

      setMessages((prev) => ({
        ...prev,
        [chatId]: loadedMsgs,
      }));
    });

    return unsubscribe;
  };

  useEffect(() => {
    if (threads.length === 0) return;

    // Set up subscriptions for active chats
    const unsubscribes = threads.map((thread) => subscribeToMessages(thread.id));

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [threads]);

  // Send Message
  const sendMessage = async (chatId: string, text: string) => {
    if (!user) return;
    const cleanText = text.trim();
    if (!cleanText) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const now = new Date();

      await addDoc(messagesRef, {
        text: cleanText,
        senderId: user.uid,
        senderName: userData?.name || 'Pulse Athlete',
        time: Timestamp.fromDate(now),
      });

      // Update the main thread document
      const threadRef = doc(db, 'chats', chatId);
      const thread = threads.find(t => t.id === chatId);
      const lastMsgLabel = thread?.type === 'group' 
        ? `${userData?.name || 'Athlete'}: ${cleanText}` 
        : cleanText;

      await updateDoc(threadRef, {
        lastMessage: lastMsgLabel,
        lastMessageTime: Timestamp.fromDate(now),
      });

      // Write notification for direct message recipient
      if (chatId.startsWith('dm_')) {
        const parts = chatId.replace('dm_', '').split('_');
        const recipientUid = parts.find(uid => uid !== user.uid);
        if (recipientUid) {
          const notifRef = doc(collection(db, 'users', recipientUid, 'notifications'));
          const displaySnippet = cleanText.length > 60 
            ? cleanText.substring(0, 57) + '...' 
            : cleanText;
          
          await setDoc(notifRef, {
            id: notifRef.id,
            category: 'Community',
            type: 'message',
            title: 'New Message',
            snippet: `${userData?.name || 'Someone'}: "${displaySnippet}"`,
            highlight: userData?.name || 'Someone',
            unread: true,
            createdAt: Timestamp.fromDate(now),
          });
        }
      }
    } catch (err) {
      console.error('[ChatContext] Error sending message:', err);
    }
  };

  // Start direct conversation with a searched user
  const startChatWithUser = async (targetUser: { uid: string; name: string; username: string; avatar?: string; bio?: string }) => {
    if (!user) throw new Error('User not logged in');

    // Create a deterministic thread ID based on user UIDs sorted alphabetically
    const uids = [user.uid, targetUser.uid].sort();
    const chatId = `dm_${uids.join('_')}`;

    const threadRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(threadRef);

    if (!docSnap.exists()) {
      const newThread = {
        id: chatId,
        type: 'direct',
        participants: [user.uid, targetUser.uid],
        name: targetUser.name,
        subtitle: targetUser.bio || `@${targetUser.username}`,
        avatar: targetUser.avatar || '',
        lastMessage: 'Tap to start chatting!',
        lastMessageTime: Timestamp.fromDate(new Date()),
        unreadCount: 0,
        isOnline: true,
      };
      await setDoc(threadRef, newThread);
    }
    return chatId;
  };

  // Search registered users from database using range prefix queries
  const searchUsers = async (searchQuery: string): Promise<any[]> => {
    const queryStr = searchQuery.trim().toLowerCase();
    try {
      const list: any[] = [];
      if (!queryStr) {
        // Return a small list of users (limit 15) as suggestions when empty
        const q = query(collection(db, 'users'), limit(15));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          const u = docSnap.data();
          if (u.uid !== user?.uid) {
            list.push({
              uid: u.uid,
              name: u.name,
              username: u.username,
              avatar: u.avatar || undefined,
              bio: u.bio || '',
            });
          }
        });
        return list;
      }

      // Query by username prefix (usernames are stored lowercased)
      const qUsername = query(
        collection(db, 'users'),
        orderBy('username'),
        startAt(queryStr),
        endAt(queryStr + '\uf8ff'),
        limit(10)
      );
      const snapUsername = await getDocs(qUsername);
      snapUsername.forEach((docSnap) => {
        const u = docSnap.data();
        if (u.uid !== user?.uid) {
          list.push({
            uid: u.uid,
            name: u.name,
            username: u.username,
            avatar: u.avatar || undefined,
            bio: u.bio || '',
          });
        }
      });

      // Query by name prefix (sentence-cased for capitalized names)
      const sentenceCaseQuery = queryStr.charAt(0).toUpperCase() + queryStr.slice(1);
      const qName = query(
        collection(db, 'users'),
        orderBy('name'),
        startAt(sentenceCaseQuery),
        endAt(sentenceCaseQuery + '\uf8ff'),
        limit(10)
      );
      const snapName = await getDocs(qName);
      snapName.forEach((docSnap) => {
        const u = docSnap.data();
        if (u.uid !== user?.uid && !list.some(existing => existing.uid === u.uid)) {
          list.push({
            uid: u.uid,
            name: u.name,
            username: u.username,
            avatar: u.avatar || undefined,
            bio: u.bio || '',
          });
        }
      });

      return list;
    } catch (err) {
      console.error('[ChatContext] Error searching users in Firestore:', err);
      return [];
    }
  };

  // Mark all messages as read
  const markAsRead = async (chatId: string) => {
    try {
      const threadRef = doc(db, 'chats', chatId);
      await updateDoc(threadRef, { unreadCount: 0 });
    } catch (err) {
      console.warn('[ChatContext] Failed to mark thread as read:', err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        threads,
        messages,
        loading,
        sendMessage,
        startChatWithUser,
        searchUsers,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
