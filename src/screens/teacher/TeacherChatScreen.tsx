import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ListRenderItem,
  ActivityIndicator,
  Modal,
  ScrollView,
  BackHandler,
  Pressable,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  Dimensions,
} from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGetStudentsQuery, useGetAdminsQuery, useLazyGetChatQuery } from '../../store/api';
import { realtimeService } from '../../services/realtimeService';
import axios from 'axios';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Send, MessageCircle } from 'lucide-react-native';
import { useAppSelector } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message as ApiMessage } from '../../types/messages.types';
import { showErrorToast } from '../../utils';

/** IMessage with optional read and reply from our API */
export type ChatMessage = IMessage & {
  read?: boolean;
  repliedTo?: { _id: string; text: string } | null;
};

const RECENT_CHATS_STORAGE_KEY = 'persistentRecentChats_teacher';
const RECENT_CHATS_LIMIT = 10;

function ScrollToBottomIcon() {
  return <Icon name="chevron-double-down" size={24} color="#666" />;
}

export const formatChatMessageTime = (timestamp: number | Date): string => {
  if (timestamp instanceof Date) {
    timestamp = timestamp.getTime();
  }
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/** Placeholder skeleton when loading messages */
function ChatMessageSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
        <View
          key={i}
          style={[
            skeletonStyles.bubble,
            i % 2 === 0
              ? skeletonStyles.bubbleRight
              : skeletonStyles.bubbleLeft,
          ]}
        />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  bubble: {
    width: '70%',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  bubbleLeft: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleRight: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
});

// ---------------------------------------------------------------------------
// Helpers: API message → Gifted Chat IMessage
// ---------------------------------------------------------------------------

function getMessageSenderId(msg: ApiMessage): string {
  const raw = msg.senderId;
  return typeof raw === 'string' ? raw : (raw as { _id: string })._id;
}

function getMessageReceiverId(msg: ApiMessage): string {
  const raw = msg.receiverId;
  return typeof raw === 'string' ? raw : (raw as { _id: string })._id;
}

function apiMessageToGifted(
  msg: ApiMessage,
  currentUserId: string,
  otherUserId: string,
  myUser: User,
  otherUser: User,
  context?: { messageIndex?: number; lastMessageSender?: 'me' | 'user' },
): ChatMessage {
  const actualSenderId = getMessageSenderId(msg);
  const actualReceiverId = getMessageReceiverId(msg);

  let isFromMe = actualSenderId === currentUserId;

  // Backend bug: senderId === receiverId; use context to infer sender
  if (actualSenderId === currentUserId && actualReceiverId === currentUserId) {
    if (context?.messageIndex !== undefined) {
      isFromMe = context.messageIndex % 2 === 0;
    } else if (context?.lastMessageSender !== undefined) {
      isFromMe = context.lastMessageSender === 'user';
    }
  } else if (actualSenderId === otherUserId) {
    isFromMe = false;
  }

  const createdAt = msg.createdAt ? new Date(msg.createdAt) : new Date();

  const gifted: ChatMessage = {
    _id: msg._id,
    text: msg.text,
    createdAt,
    user: isFromMe ? myUser : otherUser,
    sent: true,
    received: true,
  };
  if (typeof msg.read === 'boolean') {
    gifted.read = msg.read;
  }
  if (
    msg.repliedTo &&
    typeof msg.repliedTo === 'object' &&
    msg.repliedTo.text
  ) {
    gifted.repliedTo = { _id: msg.repliedTo._id, text: msg.repliedTo.text };
  }
  return gifted;
}

// Type definitions
interface User {
  _id: string;
  name: string;
  picture: string;
  role: 'student' | 'admin';
  presence?: {
    isOnline: boolean;
    lastSeen: string | null;
  };
  isOnline?: boolean;
  lastSeen?: string | null;
  email?: string;
  qualification?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'user';
  time: string;
  read?: boolean;
  edited?: boolean;
  deleted?: boolean;
  repliedTo?: string | null;
}

const TeacherChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useAppSelector(state => state.user.user);
  const recentChatUsers = useAppSelector(state => state.user.recentChatUsers);
  const { data: studentsData, isLoading: studentsLoading, refetch: refetchStudents } = useGetStudentsQuery();
  const { data: adminsData, isLoading: adminsLoading, refetch: refetchAdmins } = useGetAdminsQuery();
  const [getChat] = useLazyGetChatQuery();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const onRefreshUsers = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStudents(), refetchAdmins()]);
    setRefreshing(false);
  }, [refetchStudents, refetchAdmins]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [userId: string]: { time: string; text: string } }>({});
  const [persistentRecentChats, setPersistentRecentChats] = useState<string[]>([]); // For permanent storage
  
  // New state for advanced chat features
  const [giftedMessages, setGiftedMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [messageOptionsMessage, setMessageOptionsMessage] = useState<ChatMessage | null>(null);
  const [selectedUserForMenu, setSelectedUserForMenu] = useState<User | null>(null);
  const [showUserOptionsMenu, setShowUserOptionsMenu] = useState(false);
  
  // Refs for message handling
  const giftedMessagesRef = useRef<ChatMessage[]>([]);
  giftedMessagesRef.current = giftedMessages;
  const editingMessageIdRef = useRef<string | null>(null);
  editingMessageIdRef.current = editingMessage
    ? String(editingMessage._id)
    : null;

  // Get user ID at component level
  const userId = user?.id || (user as any)?._id;

  // Gifted Chat user objects (stable refs for current user and selected user)
  const giftedUser: User = useMemo(
    () => ({
      _id: userId,
      name: user?.name ?? '',
      avatar: user?.picture ?? undefined,
    }),
    [userId, user?.name, user?.picture],
  );

  const giftedOtherUser: User | null = useMemo(() => {
    if (!selectedUser) return null;
    return {
      _id: selectedUser._id,
      name: selectedUser.name,
      avatar: selectedUser.picture,
    };
  }, [selectedUser]);

  // Load persistent recent chats from AsyncStorage on mount
  useEffect(() => {
    const loadPersistentRecentChats = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_CHATS_STORAGE_KEY);
        if (stored) {
          setPersistentRecentChats(JSON.parse(stored));
        }
      } catch (error) {
        // Handle error silently
      }
    };
    loadPersistentRecentChats();
  }, []);

  // Save recent chat to AsyncStorage when message is sent
  const saveRecentChatToStorage = useCallback(async (userId: string) => {
    try {
      setPersistentRecentChats(prev => {
        const updated = [
          userId,
          ...prev.filter(id => id !== userId),
        ].slice(0, RECENT_CHATS_LIMIT);
        AsyncStorage.setItem(RECENT_CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      // Handle error silently
    }
  }, []);

  // Function to get recent chat users and add them to the top (using persistent storage)
  const getRecentChatUsers = useCallback(() => {
    if (!persistentRecentChats || persistentRecentChats.length === 0) {
      return [];
    }
    
    return persistentRecentChats.map(userId => {
      const user = allUsers.find(u => u._id === userId);
      // Only include user if they exist AND have messages
      return (user && lastMessages[userId]) ? { ...user, isRecentChat: true } : null;
    }).filter(Boolean);
  }, [persistentRecentChats, allUsers, lastMessages]);

  // Function to get non-recent users (only users with conversations)
  const getNonRecentUsers = useCallback(() => {
    const recentUserIds = persistentRecentChats || [];
    return users.filter(user => 
      !recentUserIds.includes(user._id) && 
      lastMessages[user._id] // Only show users who have messages
    );
  }, [users, persistentRecentChats, lastMessages]);

  // Combine recent and non-recent users (filter nulls for FlatList)
  const sortedUsers = useMemo((): User[] => {
    const recent = getRecentChatUsers().filter((u): u is User & { isRecentChat: true } => u != null);
    const nonRecent = getNonRecentUsers();
    const allSorted = [...recent, ...nonRecent];
    console.log('Sorted users:', allSorted.length, 'users');
    console.log('Recent users:', recent.length);
    console.log('Non-recent users:', nonRecent.length);
    console.log('LastMessages keys:', Object.keys(lastMessages));
    return allSorted;
  }, [getRecentChatUsers, getNonRecentUsers, lastMessages]);

  // Check if users are coming from route params
  useEffect(() => {
    const routeUsers = (route.params as any)?.users;
    if (routeUsers) {
      setUsers(routeUsers);
      setAllUsers(routeUsers);
      setIsLoading(false);
    }
  }, [route.params]);

  // Load chat history and realtime when a user is selected
  useEffect(() => {
    if (!selectedUser || !userId || !giftedOtherUser) return;

    const selectedUserId = selectedUser._id;

    console.log('Setting up chat for user:', selectedUser.name);
    console.log('Socket URL available:', !!'SOCKET_URL' in window || !!process.env.SOCKET_URL);

    const loadHistory = async () => {
      setIsLoadingMessages(true);
      try {
        const result = await getChat({
          senderId: userId,
          receiverId: selectedUserId,
        }).unwrap();

        const list = result?.data;
        if (list?.length) {
          const mapped: ChatMessage[] = list.map(
            (msg: ApiMessage, idx: number) =>
              apiMessageToGifted(
                msg,
                userId,
                selectedUserId,
                giftedUser,
                giftedOtherUser,
                {
                  messageIndex: idx,
                },
              ),
          );
          mapped.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setGiftedMessages(mapped);
          console.log('Loaded', mapped.length, 'messages for', selectedUser.name);
        } else {
          setGiftedMessages([]);
          console.log('No messages found for', selectedUser.name);
        }
      } catch {
        setGiftedMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadHistory();

    realtimeService.startPolling(userId, selectedUserId, 3000);

    const handleNewMessage = (msg: ApiMessage) => {
      const current = giftedMessagesRef.current;
      const lastSender: 'me' | 'user' | undefined =
        current.length > 0
          ? current[0].user._id === userId
            ? 'me'
            : 'user'
          : undefined;

      const gifted = apiMessageToGifted(
        msg,
        userId,
        selectedUserId,
        giftedUser,
        giftedOtherUser,
        { lastMessageSender: lastSender },
      );

      setGiftedMessages(prev => {
        const exists = prev.some(m => String(m._id) === String(gifted._id));
        if (exists) {
          return prev.map(m =>
            String(m._id) === String(gifted._id) ? gifted : m,
          );
        }
        return [gifted, ...prev];
      });
    };

    const handleMessageEdited = (msg: ApiMessage) => {
      const gifted = apiMessageToGifted(
        msg,
        userId,
        selectedUserId,
        giftedUser,
        giftedOtherUser,
        {},
      );
      setGiftedMessages(prev =>
        prev.map(m => (String(m._id) === String(gifted._id) ? gifted : m)),
      );
      if (
        editingMessageIdRef.current &&
        String(msg._id) === editingMessageIdRef.current
      ) {
        setEditingMessage(null);
        setEditDraft('');
      }
    };

    const handleMessageDeleted = (messageId: string) => {
      setGiftedMessages(prev =>
        prev.filter(m => String(m._id) !== String(messageId)),
      );
    };

    realtimeService.on('newMessage', handleNewMessage);
    realtimeService.on('messageEdited', handleMessageEdited);
    realtimeService.on('messageDeleted', handleMessageDeleted);

    return () => {
      realtimeService.off('newMessage', handleNewMessage);
      realtimeService.off('messageEdited', handleMessageEdited);
      realtimeService.off('messageDeleted', handleMessageDeleted);
      realtimeService.stopPolling(`${userId}-${selectedUserId}`);
    };
  }, [selectedUser, userId, giftedUser, giftedOtherUser, getChat]);

  // Clear reply and edit when leaving chat
  useEffect(() => {
    if (!selectedUser) {
      setReplyingTo(null);
      setEditingMessage(null);
      setEditDraft('');
    }
  }, [selectedUser]);

  // Handle hardware back button
  useEffect(() => {
    const handleBackPress = () => {
      if (selectedUser) {
        setSelectedUser(null);
        navigation.setOptions({ headerShown: true });
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [selectedUser, navigation]);

  // Hide/show header based on user selection
  useFocusEffect(
    React.useCallback(() => {
      if (selectedUser) {
        navigation.setOptions({ headerShown: false });
      } else {
        navigation.setOptions({ headerShown: true });
      }
    }, [selectedUser, navigation])
  );

  // Fetch last messages when users are loaded
  useEffect(() => {
    if (users.length > 0 && userId) {
      fetchLastMessagesForUsers(users);
    }
  }, [users, userId]);

  const students = useMemo(() => {
    const data = (studentsData as any)?.data ?? studentsData?.data ?? [];
    return Array.isArray(data) ? data.map((student: any) => ({
      _id: student._id,
      name: student.name,
      picture: student.picture,
      role: 'student' as const,
      presence: student.presence,
      isOnline: student.presence?.isOnline || student.isOnline || false,
      lastSeen: student.presence?.lastSeen || student.lastSeen || null,
      email: student.email,
      qualification: student.qualification
    })) : [];
  }, [studentsData]);

  const admins = useMemo(() => {
    const data = (adminsData as any)?.data ?? adminsData?.data ?? [];
    return Array.isArray(data) ? data.map((admin: any) => ({
      _id: admin._id,
      name: admin.name,
      picture: admin.picture,
      role: 'admin' as const,
      presence: admin.presence,
      isOnline: admin.presence?.isOnline || admin.isOnline || false,
      lastSeen: admin.presence?.lastSeen || admin.lastSeen || null,
      email: admin.email,
      qualification: admin.qualification
    })) : [];
  }, [adminsData]);

  const allUsersData = useMemo(() => [...students, ...admins], [students, admins]);

  useEffect(() => {
    if (allUsersData.length > 0) {
      setUsers(allUsersData);
      setAllUsers(allUsersData);
      fetchLastMessagesForUsers(allUsersData);
    }
    setIsLoading(studentsLoading || adminsLoading);
  }, [allUsersData, studentsLoading, adminsLoading]);

  // Function to fetch last messages for all users
  const fetchLastMessagesForUsers = async (usersList: User[]) => {
    if (!userId) {
      console.log('No userId available for fetching messages');
      return;
    }

    console.log('Fetching last messages for', usersList.length, 'users');
    const lastMessagesData: { [userId: string]: { time: string; text: string } } = {};

    for (const userItem of usersList) {
      try {
        const result = await getChat({ senderId: userId, receiverId: userItem._id }).unwrap();

        if (result?.data && result.data.length > 0) {
          const messages = result.data;
          const lastMessage = messages[messages.length - 1];

          lastMessagesData[userItem._id] = {
              time: new Date(lastMessage.createdAt ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: lastMessage.text
            };
          console.log('Found messages for user', userItem.name, ':', lastMessage.text);
        } else {
          console.log('No messages found for user', userItem.name);
        }
      } catch (error) {
        console.log('Error fetching messages for user', userItem.name, ':', error);
      }
    }

    console.log('Setting lastMessages with', Object.keys(lastMessagesData).length, 'entries');
    setLastMessages(lastMessagesData);
  };

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text?.trim();
      if (!text || !selectedUser || !userId) return;

      const selectedUserId = selectedUser._id;
      const replyToId = replyingTo?._id ? String(replyingTo._id) : undefined;
      setIsSending(true);
      try {
        await realtimeService.sendMessage(userId, selectedUserId, text, replyToId);
        setReplyingTo(null);
        saveRecentChatToStorage(selectedUserId);
        const now = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastMessages(prev => ({
          ...prev,
          [selectedUserId]: {
            time: now,
            text: text.length > 30 ? `${text.slice(0, 30)}...` : text,
          },
        }));
      } catch {
        // Error handled by realtime/API; optionally show toast
      } finally {
        setIsSending(false);
      }
    },
    [selectedUser, userId, saveRecentChatToStorage, replyingTo],
  );

  const handleDeleteMessage = useCallback(
    (message: ChatMessage) => {
      if (!selectedUser || !userId) return;
      Alert.alert(
        'Delete message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await realtimeService.deleteMessage(
                  String(message._id),
                  userId,
                  selectedUser._id,
                );
              } catch {
                // optionally show toast
              }
            },
          },
        ],
      );
    },
    [selectedUser, userId],
  );

  const openMessageOptions = useCallback((message: ChatMessage) => {
    setMessageOptionsMessage(message);
  }, []);

  const closeMessageOptions = useCallback(() => {
    setMessageOptionsMessage(null);
  }, []);

  const handleMessageOptionReply = useCallback(() => {
    if (messageOptionsMessage) setReplyingTo(messageOptionsMessage);
    closeMessageOptions();
  }, [messageOptionsMessage, closeMessageOptions]);

  const handleMessageOptionEdit = useCallback(() => {
    if (messageOptionsMessage) {
      setEditingMessage(messageOptionsMessage);
      setEditDraft(messageOptionsMessage.text ?? '');
    }
    closeMessageOptions();
  }, [messageOptionsMessage, closeMessageOptions]);

  const handleMessageOptionDelete = useCallback(() => {
    if (messageOptionsMessage) handleDeleteMessage(messageOptionsMessage);
    closeMessageOptions();
  }, [messageOptionsMessage, handleDeleteMessage, closeMessageOptions]);

  const handleSaveEdit = useCallback(async () => {
    const text = editDraft.trim();
    if (!editingMessage || !userId || !selectedUser || !text) {
      setEditingMessage(null);
      setEditDraft('');
      setIsEditing(false);
      return;
    }

    setIsEditing(true);
    try {
      const result = await realtimeService.editMessage(
        String(editingMessage._id),
        userId,
        selectedUser._id,
        text,
      );
      if (result?.data) {
        realtimeService.notifyMessageEdited(result.data);
      }
      setEditingMessage(null);
      setEditDraft('');
    } catch {
      showErrorToast('Failed to edit message');
    } finally {
      setIsEditing(false);
    }
  }, [editingMessage, editDraft, userId, selectedUser]);

  // User menu functions
  const openUserMenu = useCallback((user: User) => {
    setSelectedUserForMenu(user);
    setShowUserOptionsMenu(true);
  }, []);

  const closeUserMenu = useCallback(() => {
    setSelectedUserForMenu(null);
    setShowUserOptionsMenu(false);
  }, []);

  const handleDeleteConversation = useCallback(() => {
    if (!selectedUserForMenu) return;
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete all messages with this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete conversation logic
            closeUserMenu();
          },
        },
      ],
    );
  }, [selectedUserForMenu, closeUserMenu]);

  const handleArchiveConversation = useCallback(() => {
    if (!selectedUserForMenu) return;
    // TODO: Implement archive conversation logic
    closeUserMenu();
  }, [selectedUserForMenu, closeUserMenu]);

  const handleBlockUser = useCallback(() => {
    if (!selectedUserForMenu) return;
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${selectedUserForMenu.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement block user logic
            closeUserMenu();
          },
        },
      ],
    );
  }, [selectedUserForMenu, closeUserMenu]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = allUsers.filter(userItem =>
        userItem.name.toLowerCase().includes(query.toLowerCase()) ||
        (userItem.qualification && userItem.qualification.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filtered);
    }
  };

  const handleSelectUser = (userItem: User) => {
    setSelectedUser(userItem);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderUserItem: ListRenderItem<User> = ({ item }) => {
    const hasMessages = lastMessages[item._id] && lastMessages[item._id].time !== undefined;
    const isRecentChat = (item as any).isRecentChat || false;
    
    // Show all users, but highlight recent chat users
    return (
      <TouchableOpacity
        style={[
          styles.teacherItem, 
          selectedUser?._id === item._id && styles.selectedTeacher,
          isRecentChat && styles.recentChatItem
        ]}
        onPress={() => {
          setSelectedUser(item);
        }}
      >
        <View style={styles.teacherAvatarContainer}>
          <Image source={{ uri: item.picture }} style={styles.teacherAvatar} />
          {item.isOnline && <View style={styles.onlineIndicator} />}
          {isRecentChat && (
            <View>
              {/* <MessageCircle size={12} color="#4A90E2" /> */}
            </View>
          )}
        </View>
        <View style={styles.teacherInfo}>
          <View style={styles.teacherNameContainer}>
            <StyledText style={styles.teacherName}>{item.name}</StyledText>
            {/* {isRecentChat && (
              <StyledText style={styles.recentChatLabel}>Recent</StyledText>
            )} */}
          </View>
          <StyledText style={styles.teacherLastText}>
            {hasMessages ? lastMessages[item._id]?.text : 'No messages yet'}
          </StyledText>
          <View style={styles.teacherRoleContainer}>
            <StyledText style={styles.teacherRole}>
              {item.role === 'admin' ? 'Admin' : 'Student'}
            </StyledText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.userMenuButton}
          onPress={(e) => {
            e.stopPropagation();
            openUserMenu(item);
          }}
        >
          <Icon name="dots-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSearchUserItem: ListRenderItem<User> = ({ item }) => (
    <TouchableOpacity
      style={styles.searchTeacherItem}
      onPress={() => handleSelectUser(item)}
    >
      <View style={styles.teacherAvatarContainer}>
        <Image source={{ uri: item.picture }} style={styles.teacherAvatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.teacherInfo}>
        <StyledText style={styles.teacherName}>{item.name}</StyledText>
        {item.email && <StyledText style={styles.teacherEmail}>{item.email}</StyledText>}
        <StyledText style={styles.teacherRole}>{item.role === 'admin' ? 'Admin' : 'Student'}</StyledText>
        {lastMessages[item._id] && (
          <StyledText style={styles.teacherLastText}>{lastMessages[item._id]?.text}</StyledText>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isMyMessage = item.sender === 'me';

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.userMessageContainer
      ]}>
        {!isMyMessage && (
          <Image
            source={{ uri: selectedUser?.picture }}
            style={styles.messageAvatar}
          />
        )}
        <View style={styles.messageContentWrapper}>
          {!isMyMessage && (
            <StyledText style={styles.userSenderLabel}>
              {selectedUser?.name}
            </StyledText>
          )}
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.userMessage
          ]}>
            <StyledText style={[
              styles.messageText,
              isMyMessage && styles.myMessageText
            ]}>{item.text}</StyledText>
          </View>
          <StyledText style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.userMessageTime
          ]}>{item.time}</StyledText>
        </View>
        {isMyMessage && (
          <Image
            source={{ uri: user?.picture }}
            style={styles.messageAvatar}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: 0 + insets.top }]}>
      {!selectedUser ? (
        <View style={styles.teacherListContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.plusButton}
              onPress={() => setShowSearchModal(true)}
            >
              <Icon name="plus" size={24} color="black" />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E56B8C" />
              <StyledText style={styles.loadingText}>Loading users...</StyledText>
            </View>
          ) : (
            <FlatList
              data={sortedUsers}
              keyExtractor={item => item._id}
              renderItem={renderUserItem}
              contentContainerStyle={styles.teacherList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefreshUsers} colors={['#E56B8C']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <StyledText style={styles.emptyText}>No chat conversations available</StyledText>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.chatHeader}>
            <Pressable
              onPress={() => {
                setSelectedUser(null);
                navigation.setOptions({ headerShown: true });
              }}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: pressed ? '#f0f0f0' : 'transparent' },
              ]}
            >
              <Icon name="arrow-left" size={24} color="#333" />
            </Pressable>
            <Pressable
              onPress={() => {
                setSelectedUser(null);
                navigation.setOptions({ headerShown: true });
              }}
              style={styles.teacherHeaderTouchable}
            >
              <Image
                source={{ uri: selectedUser.picture }}
                style={styles.chatHeaderAvatar}
              />
              <View>
                <StyledText style={styles.chatHeaderName}>
                  {selectedUser.name}
                </StyledText>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      selectedUser.isOnline
                        ? styles.statusDotOnline
                        : styles.statusDotOffline,
                    ]}
                  />
                  <StyledText style={styles.statusText}>
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </StyledText>
                </View>
              </View>
            </Pressable>
          </View>

          {isLoadingMessages && giftedMessages.length === 0 ? (
            <ChatMessageSkeleton />
          ) : (
            <GiftedChat
              messages={giftedMessages}
              onSend={onSend}
              user={giftedUser}
              placeholder="Type a message..."
              alwaysShowSend
              scrollToBottomComponent={ScrollToBottomIcon}
              disableComposer={isSending}
              maxInputLength={500}
              bottomOffset={insets.bottom + 8}
              renderChatFooter={
                replyingTo
                  ? () => (
                      <View style={styles.replyBar}>
                        <View style={styles.replyBarLeft}>
                          <Text style={styles.replyBarLabel} numberOfLines={1}>
                            Replying to: {replyingTo.text}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setReplyingTo(null)}
                          style={styles.replyBarClose}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Icon name="close" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                    )
                  : undefined
              }
              listViewProps={
                {
                  keyboardDismissMode: 'on-drag',
                  keyboardShouldPersistTaps: 'handled',
                  initialNumToRender: 20,
                  maxToRenderPerBatch: 10,
                  windowSize: 10,
                  removeClippedSubviews: true,
                } as React.ComponentProps<typeof GiftedChat>['listViewProps']
              }
              renderBubble={props => {
                const msg = props.currentMessage as ChatMessage | undefined;
                const isMe = msg?.user._id === userId;
                const read = msg && isMe && msg.read;
                const text = msg?.text ?? '';
                const reply = msg?.repliedTo;
                const bubbleMaxWidth = Dimensions.get('window').width * 0.8;
                const replyAction = () => (
                  <View style={styles.swipeReplyAction}>
                    <Icon name="reply" size={16} color="#fff" />
                    <Text style={styles.swipeReplyText}>Reply</Text>
                  </View>
                );

                const bubbleContent = (
                  <View
                    style={[
                      styles.bubble,
                      { maxWidth: bubbleMaxWidth },
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                      styles.bubbleContentNoStretch,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => msg && openMessageOptions(msg)}
                      style={[
                        styles.bubbleDotsInside,
                        isMe
                          ? styles.bubbleDotsInsideMe
                          : styles.bubbleDotsInsideOther,
                      ]}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Icon
                        name="dots-vertical"
                        size={20}
                        color={isMe ? 'rgba(255,255,255,0.9)' : '#666'}
                      />
                    </TouchableOpacity>
                    {reply?.text ? (
                      <View
                        style={[
                          styles.replyPreview,
                          isMe ? styles.replyPreviewMe : styles.replyPreviewOther,
                        ]}
                      >
                        <Text
                          style={[
                            styles.replyPreviewLabel,
                            isMe
                              ? styles.replyPreviewLabelMe
                              : styles.replyPreviewLabelOther,
                          ]}
                          numberOfLines={1}
                        >
                          Reply to: {reply.text}
                        </Text>
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe ? styles.bubbleTextMe : styles.bubbleTextOther,
                      ]}
                      selectable
                    >
                      {text}
                    </Text>
                    <View
                      style={[
                        styles.bubbleFooterRow,
                        isMe
                          ? styles.bubbleFooterRowMe
                          : styles.bubbleFooterRowOther,
                      ]}
                    >
                      {isMe && (
                        <View style={styles.messageStatusIconWrap}>
                          {read ? (
                            <CheckCheck size={14} color="rgba(255,255,255,0.85)" />
                          ) : (
                            <Check size={14} color="rgba(255,255,255,0.85)" />
                          )}
                        </View>
                      )}
                      {msg?.createdAt && (
                        <Text
                          style={[
                            styles.bubbleTimeText,
                            isMe
                              ? styles.bubbleTimeTextMe
                              : styles.bubbleTimeTextOther,
                          ]}
                        >
                          {formatChatMessageTime(msg.createdAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                );

                return (
                  <Swipeable
                    renderRightActions={replyAction}
                    renderLeftActions={replyAction}
                    onSwipeableOpen={(_direction, swipeable) => {
                      if (msg) setReplyingTo(msg);
                      swipeable.close();
                    }}
                    containerStyle={[
                      styles.bubbleWrapper,
                      isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOther,
                    ]}
                    friction={2}
                  >
                    {bubbleContent}
                  </Swipeable>
                );
              }}
              timeFormat="HH:mm"
              dateFormat="MMM d, yyyy"
              showUserAvatar
              renderAvatar={(props: { currentMessage?: IMessage }) => (
                <Image
                  source={{
                    uri:
                      typeof props.currentMessage?.user.avatar === 'string'
                        ? props.currentMessage.user.avatar
                        : undefined,
                  }}
                  style={styles.avatar}
                />
              )}
              minInputToolbarHeight={44}
              maxComposerHeight={120}
              renderInputToolbar={(props) => (
                <View style={styles.customInputToolbar}>
                  <TextInput
                    style={styles.customTextInput}
                    value={props.text}
                    onChangeText={props.onTextChanged}
                    placeholder="Type a message..."
                    placeholderTextColor="black"
                    multiline
                    maxLength={500}
                    textAlignVertical="center"
                    editable={!isSending}
                  />
                  {props.text && props.text.trim() !== '' && (
                    <TouchableOpacity
                      style={styles.customSendButton}
                      onPress={() => {
                        if (props.text && props.text.trim()) {
                          props.onSend({ text: props.text.trim() }, true);
                        }
                      }}
                      disabled={isSending}
                    >
                      <Send size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              renderSend={undefined}
            />
          )}

          {/* Message options popover (dropdown) */}
          <Modal
            visible={!!messageOptionsMessage}
            transparent
            animationType="fade"
            onRequestClose={closeMessageOptions}
          >
            <Pressable
              style={styles.optionsPopoverOverlay}
              onPress={closeMessageOptions}
            >
              <Pressable
                style={styles.optionsPopoverCard}
                onPress={e => e.stopPropagation()}
              >
                {messageOptionsMessage && (
                  <>
                    <TouchableOpacity
                      style={styles.optionsPopoverRow}
                      onPress={handleMessageOptionReply}
                      activeOpacity={0.7}
                    >
                      <Icon name="reply-outline" size={20} color="#333" />
                      <Text style={styles.optionsPopoverRowText}>Reply</Text>
                    </TouchableOpacity>
                    {messageOptionsMessage.user._id === userId && (
                      <>
                        <TouchableOpacity
                          style={styles.optionsPopoverRow}
                          onPress={handleMessageOptionEdit}
                          activeOpacity={0.7}
                        >
                          <Icon name="pencil-outline" size={20} color="#333" />
                          <Text style={styles.optionsPopoverRowText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.optionsPopoverRow,
                            styles.optionsPopoverRowDestructive,
                          ]}
                          onPress={handleMessageOptionDelete}
                          activeOpacity={0.7}
                        >
                          <Icon name="delete-outline" size={20} color="#D32F2F" />
                          <Text
                            style={[
                              styles.optionsPopoverRowText,
                              styles.optionsPopoverRowTextDestructive,
                            ]}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <View style={styles.optionsPopoverDivider} />
                    <TouchableOpacity
                      style={styles.optionsPopoverRow}
                      onPress={closeMessageOptions}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionsPopoverRowTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Modal>

          {/* Edit message modal */}
          <Modal
            visible={!!editingMessage}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setEditingMessage(null);
              setEditDraft('');
            }}
          >
            <Pressable
              style={styles.editModalOverlay}
              onPress={() => {
                setEditingMessage(null);
                setEditDraft('');
              }}
            >
              <Pressable
                style={styles.editModalContent}
                onPress={e => e.stopPropagation()}
              >
                <StyledText style={styles.editModalTitle}>Edit message</StyledText>
                <TextInput
                  style={styles.editModalInput}
                  value={editDraft}
                  onChangeText={setEditDraft}
                  placeholder="Message..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={500}
                />
                <View style={styles.editModalActions}>
                  <TouchableOpacity
                    style={[styles.editModalButton, styles.editModalButtonCancel]}
                    onPress={() => {
                      setEditingMessage(null);
                      setEditDraft('');
                    }}
                  >
                    <StyledText style={styles.editModalButtonCancelText}>
                      Cancel
                    </StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.editModalButton,
                      styles.editModalButtonSave,
                      isEditing && styles.editModalButtonSaveDisabled,
                    ]}
                    onPress={handleSaveEdit}
                    disabled={isEditing}
                  >
                    <StyledText style={styles.editModalButtonSaveText}>
                      {isEditing ? 'Saving...' : 'Save'}
                    </StyledText>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* User Options Modal */}
          <Modal
            visible={showUserOptionsMenu}
            transparent
            animationType="fade"
            onRequestClose={closeUserMenu}
          >
            <Pressable
              style={styles.optionsPopoverOverlay}
              onPress={closeUserMenu}
            >
              <Pressable
                style={styles.optionsPopoverCard}
                onPress={e => e.stopPropagation()}
              >
                {selectedUserForMenu && (
                  <>
                    <TouchableOpacity
                      style={styles.optionsPopoverRow}
                      onPress={handleArchiveConversation}
                      activeOpacity={0.7}
                    >
                      <Icon name="archive-outline" size={20} color="#333" />
                      <Text style={styles.optionsPopoverRowText}>Archive Conversation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionsPopoverRow,
                        styles.optionsPopoverRowDestructive,
                      ]}
                      onPress={handleDeleteConversation}
                      activeOpacity={0.7}
                    >
                      <Icon name="delete-outline" size={20} color="#D32F2F" />
                      <Text
                        style={[
                          styles.optionsPopoverRowText,
                          styles.optionsPopoverRowTextDestructive,
                        ]}
                      >
                        Delete Conversation
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionsPopoverRow,
                        styles.optionsPopoverRowDestructive,
                      ]}
                      onPress={handleBlockUser}
                      activeOpacity={0.7}
                    >
                      <Icon name="block-helper" size={20} color="#D32F2F" />
                      <Text
                        style={[
                          styles.optionsPopoverRowText,
                          styles.optionsPopoverRowTextDestructive,
                        ]}
                      >
                        Block User
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.optionsPopoverDivider} />
                    <TouchableOpacity
                      style={styles.optionsPopoverRow}
                      onPress={closeUserMenu}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionsPopoverRowTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.placeholder} />
            <StyledText style={styles.modalTitle}>Message Users</StyledText>
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchSection}>
            <StyledText style={styles.searchSectionTitle}>Select a user to start a new conversation.</StyledText>
            <View style={styles.searchInputContainer}>
              <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or qualification..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.resultsSection}>
            {searchQuery.trim() === '' ? (
              allUsers.length === 0 ? (
                <View style={styles.searchPlaceholder}>
                  <Icon name="account-off" size={48} color="#ccc" />
                  <StyledText style={styles.searchPlaceholderText}>
                    No users available
                  </StyledText>
                </View>
              ) : (
                <View style={styles.resultsList}>
                  <FlatList
                    data={allUsers}
                    keyExtractor={item => item._id}
                    renderItem={renderSearchUserItem}
                    contentContainerStyle={styles.teacherList}
                  />
                </View>
              )
            ) : searchResults.length === 0 ? (
              <View style={styles.searchPlaceholder}>
                <Icon name="account-off" size={48} color="#ccc" />
                <StyledText style={styles.searchPlaceholderText}>
                  No users found
                </StyledText>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <StyledText style={styles.searchResultsTitle}>
                  Search Results ({searchResults.length})
                </StyledText>
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item._id}
                  renderItem={renderSearchUserItem}
                  contentContainerStyle={styles.teacherList}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // User List Styles
  teacherListContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  teacherList: {
    padding: 8,
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    justifyContent: 'space-between',
  },
  userMenuButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentChatItem: {
    // backgroundColor: '#e8f4fd',
    // borderColor: '#4A90E2',
  },
  selectedTeacher: {
    backgroundColor: '#e3f2fd',
  },
  teacherAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  // recentChatBadge: {
  //   position: 'absolute',
  //   top: -2,
  //   right: -2,
  //   backgroundColor: '#4A90E2',
  //   borderRadius: 10,
  //   width: 20,
  //   height: 20,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  onlineIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
    right: 8,
    bottom: 0,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  recentChatLabel: {
    fontSize: 10,
    color: '#4A90E2',
    fontWeight: '500',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  teacherEmail: {
    fontSize: 12,
    color: 'black',
    marginTop: 2,
  },
  teacherRole: {
    fontSize: 12,
    color: 'black',
    marginTop: 1,
  },
  teacherRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  teacherTime: {
    fontSize: 11,
    color: 'black',
    marginTop: 2,
  },
  teacherLastText: {
    fontSize: 12,
    color: 'black',
    marginTop: 2,
  },
  // Chat Styles
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    paddingHorizontal: 2,
    padding: 16,
    paddingBottom: 80,
  },
  loadingMessagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  loadingMessagesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  messageContentWrapper: {
    maxWidth: '100%',
  },
  userSenderLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: '#666',
    textAlign: 'left',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E56B8C',
  },
  userMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  myMessageTime: {
    color: '#666',
    textAlign: 'right',
  },
  userMessageTime: {
    color: '#666',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E56B8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  // Plus button and modal styles
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddddddff'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  searchSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsSection: {
    flex: 1,
    padding: 1,
  },
  resultsList: {
    flex: 1,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  searchTeacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  // New GiftedChat styles
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F4F8',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  replyBarLeft: {
    flex: 1,
    marginRight: 8,
  },
  replyBarLabel: {
    fontSize: 14,
    color: '#475569',
  },
  replyBarClose: {
    padding: 4,
  },
  optionsPopoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsPopoverCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 200,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  optionsPopoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionsPopoverRowText: {
    fontSize: 16,
    color: '#333',
  },
  optionsPopoverRowTextDestructive: {
    color: '#D32F2F',
  },
  optionsPopoverRowTextCancel: {
    fontSize: 16,
    color: '#666',
  },
  optionsPopoverRowDestructive: {},
  optionsPopoverDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  editModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  editModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editModalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  editModalButtonCancelText: {
    color: '#666',
    fontSize: 16,
  },
  editModalButtonSave: {
    backgroundColor: '#E56B8C',
  },
  editModalButtonSaveDisabled: {
    opacity: 0.6,
  },
  editModalButtonSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Updated chat styles for GiftedChat
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  statusDotOffline: {
    backgroundColor: '#9E9E9E',
  },
  bubbleWrapper: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: 5,
  },
  bubbleWrapperMe: {
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  },
  bubbleWrapperOther: {
    justifyContent: 'flex-start',
    marginRight: 'auto',
  },
  bubbleContentNoStretch: {
    alignSelf: 'flex-start',
  },
  swipeReplyAction: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25D366',
    width: 72,
    marginVertical: 4,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swipeReplyText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  bubbleDotsInside: {
    position: 'absolute',
    top: 4,
    padding: 4,
    zIndex: 1,
  },
  bubbleDotsInsideMe: {
    right: 4,
  },
  bubbleDotsInsideOther: {
    left: 4,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#E56B8C',
    borderBottomRightRadius: 4,
    paddingRight: 32,
    justifyContent: 'flex-start',
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 4,
    paddingLeft: 32,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 22,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTextOther: {
    color: '#333',
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  replyPreviewMe: {
    borderLeftColor: 'rgba(255,255,255,0.7)',
  },
  replyPreviewOther: {
    borderLeftColor: 'rgba(0,0,0,0.2)',
  },
  replyPreviewLabel: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  replyPreviewLabelMe: {
    color: 'rgba(255,255,255,0.9)',
  },
  replyPreviewLabelOther: {
    color: 'rgba(0,0,0,0.6)',
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
  },
  bubbleFooterRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleFooterRowOther: {
    justifyContent: 'flex-start',
  },
  messageStatusIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bubbleTimeTextMe: {
    color: 'rgba(255,255,255,0.75)',
  },
  bubbleTimeTextOther: {
    color: '#8E8E93',
  },
  messageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  customSendButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E56B8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customInputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  customTextInput: {
    fontFamily: 'Fira-Code',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    // backgroundColor: '#f9f9f9',
    marginRight: 8,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
});

export default TeacherChatScreen;
