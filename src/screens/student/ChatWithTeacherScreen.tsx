import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useGetTeachersQuery,
  useLazyGetChatQuery,
  useEditMessageMutation,
} from '../../store/api';
import { realtimeService } from '../../services/realtimeService';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CheckCheck } from 'lucide-react-native';
import type { Message as ApiMessage } from '../../types/messages.types';
import { showErrorToast } from '../../utils';

/** IMessage with optional read and reply from our API */
export type ChatMessage = IMessage & {
  read?: boolean;
  repliedTo?: { _id: string; text: string } | null;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  online: boolean;
  email: string;
  role: string;
  isRecentChat?: boolean;
}

interface TeacherApiResponse {
  _id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  qualification: string;
}

const RECENT_CHATS_STORAGE_KEY = 'persistentRecentChats_student';
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

/** Placeholder skeleton when loading messages (reference: ChatSkeleton pattern) */
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
  context?: { messageIndex?: number; lastMessageSender?: 'me' | 'teacher' },
): ChatMessage {
  const actualSenderId = getMessageSenderId(msg);
  const actualReceiverId = getMessageReceiverId(msg);

  let isFromMe = actualSenderId === currentUserId;

  // Backend bug: senderId === receiverId; use context to infer sender
  if (actualSenderId === currentUserId && actualReceiverId === currentUserId) {
    if (context?.messageIndex !== undefined) {
      isFromMe = context.messageIndex % 2 === 0;
    } else if (context?.lastMessageSender !== undefined) {
      isFromMe = context.lastMessageSender === 'teacher';
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChatWithTeacherScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAppSelector(state => state.user.user);
  const { data: teachersResponse, refetch: refetchTeachers } =
    useGetTeachersQuery();
  const [getChat] = useLazyGetChatQuery();

  const [editMessage, { isLoading: isEditing }] = useEditMessageMutation();

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [giftedMessages, setGiftedMessages] = useState<ChatMessage[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState('');
  const insets = useSafeAreaInsets();
  const [messageOptionsMessage, setMessageOptionsMessage] =
    useState<ChatMessage | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Teacher[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, { time: string; text: string }>
  >({});
  const [persistentRecentChats, setPersistentRecentChats] = useState<string[]>(
    [],
  );

  const giftedMessagesRef = useRef<ChatMessage[]>([]);
  giftedMessagesRef.current = giftedMessages;
  const editingMessageIdRef = useRef<string | null>(null);
  editingMessageIdRef.current = editingMessage
    ? String(editingMessage._id)
    : null;

  const userId = user?.id ?? (user as { _id?: string })?._id ?? '';

  // Gifted Chat user objects (stable refs for current user and selected teacher)
  const giftedUser: User = useMemo(
    () => ({
      _id: userId,
      name: user?.name ?? '',
      avatar: user?.picture ?? undefined,
    }),
    [userId, user?.name, user?.picture],
  );

  const giftedOtherUser: User | null = useMemo(() => {
    if (!selectedTeacher) return null;
    return {
      _id: selectedTeacher.id,
      name: selectedTeacher.name,
      avatar: selectedTeacher.avatar,
    };
  }, [selectedTeacher]);

  // -------------------------------------------------------------------------
  // Persistent recent chats
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_CHATS_STORAGE_KEY);
        if (cancelled) return;
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          setPersistentRecentChats(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveRecentChatToStorage = useCallback(async (teacherId: string) => {
    try {
      setPersistentRecentChats(prev => {
        const updated = [
          teacherId,
          ...prev.filter(id => id !== teacherId),
        ].slice(0, RECENT_CHATS_LIMIT);
        AsyncStorage.setItem(RECENT_CHATS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

  const getRecentChatUsers = useCallback((): Teacher[] => {
    if (!persistentRecentChats?.length) return [];
    return persistentRecentChats
      .map(teacherId => {
        const teacher = allTeachers.find(t => t.id === teacherId);
        return teacher ? { ...teacher, isRecentChat: true } : null;
      })
      .filter(
        (item): item is NonNullable<typeof item> => item != null,
      ) as Teacher[];
  }, [persistentRecentChats, allTeachers]);

  const getNonRecentUsers = useCallback(() => {
    return teachers.filter(t => !persistentRecentChats.includes(t.id));
  }, [teachers, persistentRecentChats]);

  const sortedTeachers = useMemo(() => {
    const recent = getRecentChatUsers();
    const nonRecent = getNonRecentUsers();
    return [...recent, ...nonRecent];
  }, [getRecentChatUsers, getNonRecentUsers]);

  // Route params (pre-loaded teachers)
  useEffect(() => {
    const routeTeachers = (route.params as { teachers?: Teacher[] })?.teachers;
    if (routeTeachers?.length) {
      setTeachers(routeTeachers);
      setAllTeachers(routeTeachers);
      setIsLoading(false);
    }
  }, [route.params]);

  const fetchLastMessagesForTeachers = useCallback(
    async (teachersList: Teacher[]) => {
      if (!userId) return;
      const data: Record<string, { time: string; text: string }> = {};
      for (const teacher of teachersList) {
        try {
          const result = await getChat({
            senderId: userId,
            receiverId: teacher.id,
          }).unwrap();
          const list = result?.data;
          if (list?.length) {
            const last = list[list.length - 1];
            const text = last.text;
            const time = last.createdAt
              ? new Date(last.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            data[teacher.id] = {
              time,
              text: text.length > 30 ? `${text.slice(0, 30)}...` : text,
            };
          }
        } catch {
          // skip
        }
      }
      setLastMessages(prev => ({ ...prev, ...data }));
    },
    [userId, getChat],
  );

  // Teachers from API
  useEffect(() => {
    const raw = (teachersResponse as { data?: unknown })?.data;
    const teachersData = Array.isArray(raw) ? raw : [];
    if (teachersData.length === 0) return;

    const transformed = teachersData.map((t: TeacherApiResponse) => ({
      id: t._id,
      name: t.name,
      subject: t.qualification ?? 'No subject specified',
      avatar:
        t.picture ??
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI1FHK3BJPb3bw1rg&s',
      online: Math.random() > 0.5,
      email: t.email,
      role: t.role,
    }));
    setTeachers(transformed);
    setAllTeachers(transformed);
    fetchLastMessagesForTeachers(transformed);
    setIsLoading(false);
  }, [teachersResponse, fetchLastMessagesForTeachers]);

  // Load chat history and realtime when a teacher is selected
  useEffect(() => {
    if (!selectedTeacher || !userId || !giftedOtherUser) return;

    const teacherId = selectedTeacher.id;

    const loadHistory = async () => {
      setIsLoadingMessages(true);
      try {
        const result = await getChat({
          senderId: userId,
          receiverId: teacherId,
        }).unwrap();

        const list = result?.data;
        if (list?.length) {
          const mapped: ChatMessage[] = list.map(
            (msg: ApiMessage, idx: number) =>
              apiMessageToGifted(
                msg,
                userId,
                teacherId,
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
        } else {
          setGiftedMessages([]);
        }
      } catch {
        setGiftedMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadHistory();

    realtimeService.startPolling(userId, teacherId, 3000);

    const handleNewMessage = (msg: ApiMessage) => {
      const current = giftedMessagesRef.current;
      const lastSender: 'me' | 'teacher' | undefined =
        current.length > 0
          ? current[0].user._id === userId
            ? 'me'
            : 'teacher'
          : undefined;

      const gifted = apiMessageToGifted(
        msg,
        userId,
        teacherId,
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
        teacherId,
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
      realtimeService.stopPolling(`${userId}-${teacherId}`);
    };
  }, [selectedTeacher, userId, giftedUser, giftedOtherUser, getChat]);

  // Clear reply and edit when leaving chat
  useEffect(() => {
    if (!selectedTeacher) {
      setReplyingTo(null);
      setEditingMessage(null);
      setEditDraft('');
    }
  }, [selectedTeacher]);

  // Hardware back
  useEffect(() => {
    const handler = () => {
      if (selectedTeacher) {
        setSelectedTeacher(null);
        navigation.setOptions({ headerShown: true });
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [selectedTeacher, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (selectedTeacher) {
        navigation.setOptions({ headerShown: false });
      } else {
        navigation.setOptions({ headerShown: true });
      }
    }, [selectedTeacher, navigation]),
  );

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text?.trim();
      if (!text || !selectedTeacher || !userId) return;

      const teacherId = selectedTeacher.id;
      const replyToId = replyingTo?._id ? String(replyingTo._id) : undefined;
      setIsSending(true);
      try {
        await realtimeService.sendMessage(userId, teacherId, text, replyToId);
        setReplyingTo(null);
        saveRecentChatToStorage(teacherId);
        const now = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastMessages(prev => ({
          ...prev,
          [teacherId]: {
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
    [selectedTeacher, userId, saveRecentChatToStorage, replyingTo],
  );

  const handleDeleteMessage = useCallback(
    (message: ChatMessage) => {
      if (!selectedTeacher || !userId) return;
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
                  selectedTeacher.id,
                );
              } catch {
                // optionally show toast
              }
            },
          },
        ],
      );
    },
    [selectedTeacher, userId],
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
    if (!editingMessage || !userId || !selectedTeacher || !text) {
      setEditingMessage(null);
      setEditDraft('');
      return;
    }

    try {
      const result = await editMessage({
        senderId: userId,
        receiverId: selectedTeacher.id,
        text,
        repliedTo: editingMessage.repliedTo?._id
          ? String(editingMessage.repliedTo._id)
          : undefined,
        messageId: String(editingMessage._id),
      }).unwrap();
      if (result?.data) {
        realtimeService.notifyMessageEdited(result.data);
      }
      setEditingMessage(null);
      setEditDraft('');
    } catch {
      showErrorToast('Failed to edit message');
      // optionally show toast
    }
  }, [editingMessage, editDraft, userId, selectedTeacher, editMessage]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
      } else {
        const q = query.toLowerCase();
        setSearchResults(
          allTeachers.filter(
            t =>
              t.name.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q),
          ),
        );
      }
    },
    [allTeachers],
  );

  const handleSelectTeacher = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setReplyingTo(null);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const onRefreshTeachers = useCallback(async () => {
    setRefreshing(true);
    await refetchTeachers();
    setRefreshing(false);
  }, [refetchTeachers]);

  const renderTeacherItem: ListRenderItem<Teacher> = ({ item }) => {
    const hasLast = lastMessages[item.id];
    return (
      <TouchableOpacity
        style={[
          styles.teacherItem,
          selectedTeacher?.id === item.id && styles.selectedTeacher,
        ]}
        onPress={() => setSelectedTeacher(item)}
      >
        <View style={styles.teacherAvatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.teacherAvatar} />
          {item.online && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.teacherInfo}>
          <StyledText style={styles.teacherName}>{item.name}</StyledText>
          {hasLast && (
            <StyledText style={styles.teacherLastText} numberOfLines={1}>
              {hasLast.text}
            </StyledText>
          )}
          <View style={styles.teacherRoleContainer}>
            {hasLast && (
              <StyledText style={styles.teacherRole}>{item.role}</StyledText>
            )}
            <StyledText style={styles.teacherTime}>{hasLast?.time}</StyledText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchTeacherItem: ListRenderItem<Teacher> = ({ item }) => (
    <TouchableOpacity
      style={styles.searchTeacherItem}
      onPress={() => handleSelectTeacher(item)}
    >
      <View style={styles.teacherAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.teacherAvatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.teacherInfo}>
        <StyledText style={styles.teacherName}>{item.name}</StyledText>
        <StyledText style={styles.teacherEmail}>{item.email}</StyledText>
        <StyledText style={styles.teacherRole}>{item.role}</StyledText>
      </View>
    </TouchableOpacity>
  );

  // -------------------------------------------------------------------------
  // Render: teacher list vs chat
  // -------------------------------------------------------------------------

  if (!selectedTeacher) {
    return (
      <View style={styles.container}>
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
              <ActivityIndicator size="large" color="#00A67E" />
              <StyledText style={styles.loadingText}>
                Loading teachers...
              </StyledText>
            </View>
          ) : (
            <FlatList
              data={sortedTeachers}
              keyExtractor={item => item.id}
              renderItem={renderTeacherItem}
              contentContainerStyle={styles.teacherList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefreshTeachers}
                  colors={['#E56B8C']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <StyledText style={styles.emptyText}>
                    No teachers available
                  </StyledText>
                </View>
              }
            />
          )}
        </View>

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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.placeholder} />
              <StyledText style={styles.modalTitle}>
                Message a Teacher
              </StyledText>
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
              <StyledText style={styles.searchSectionTitle}>
                Select a teacher to start a new conversation.
              </StyledText>
              <View style={styles.searchInputContainer}>
                <Icon
                  name="magnify"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or subject..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus
                />
              </View>
            </View>
            <View style={styles.resultsSection}>
              {searchQuery.trim() === '' ? (
                allTeachers.length === 0 ? (
                  <View style={styles.searchPlaceholder}>
                    <Icon name="account-off" size={48} color="#ccc" />
                    <StyledText style={styles.searchPlaceholderText}>
                      No teachers available
                    </StyledText>
                  </View>
                ) : (
                  <FlatList
                    data={allTeachers}
                    keyExtractor={item => item.id}
                    renderItem={renderSearchTeacherItem}
                    contentContainerStyle={styles.teacherList}
                  />
                )
              ) : searchResults.length === 0 ? (
                <View style={styles.searchPlaceholder}>
                  <Icon name="account-off" size={48} color="#ccc" />
                  <StyledText style={styles.searchPlaceholderText}>
                    No teachers found
                  </StyledText>
                </View>
              ) : (
                <>
                  <StyledText style={styles.searchResultsTitle}>
                    Search Results ({searchResults.length})
                  </StyledText>
                  <FlatList
                    data={searchResults}
                    keyExtractor={item => item.id}
                    renderItem={renderSearchTeacherItem}
                    contentContainerStyle={styles.teacherList}
                  />
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Chat view with Gifted Chat
  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.chatHeader}>
        <Pressable
          onPress={() => {
            setSelectedTeacher(null);
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
            setSelectedTeacher(null);
            navigation.setOptions({ headerShown: true });
          }}
          style={styles.teacherHeaderTouchable}
        >
          <Image
            source={{ uri: selectedTeacher.avatar }}
            style={styles.chatHeaderAvatar}
          />
          <View>
            <StyledText style={styles.chatHeaderName}>
              {selectedTeacher.name}
            </StyledText>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  selectedTeacher.online
                    ? styles.statusDotOnline
                    : styles.statusDotOffline,
                ]}
              />
              <StyledText style={styles.statusText}>
                {selectedTeacher.online ? 'Online' : 'Offline'}
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
                // childrenContainerStyle={styles.bubbleChildrenContainer}
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
    </KeyboardAvoidingView>
  );
};

export default ChatWithTeacherScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25,
    backgroundColor: '#F9FAFB',
  },
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
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dddddd',
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
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  teacherEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  teacherRole: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    marginTop: 2,
  },
  teacherLastText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
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
  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE6E9',
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
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  statusDotOffline: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  loadingMessagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMessagesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
});
