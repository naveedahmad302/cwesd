import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ListRenderItem, ActivityIndicator, Modal, ScrollView, BackHandler, Pressable } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userAPI, messagesAPI } from '../../services/api';
import { realtimeService } from '../../services/realtimeService';
import axios from 'axios';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Send, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { user, addRecentChatUser, recentChatUsers } = useAuth(); // Add recentChatUsers here
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [userId: string]: { time: string; text: string } }>({});
  const [persistentRecentChats, setPersistentRecentChats] = useState<string[]>([]); // For permanent storage

  // Get user ID at component level
  const userId = user?.id || (user as any)?._id;

  // Load persistent recent chats from AsyncStorage on mount
  useEffect(() => {
    const loadPersistentRecentChats = async () => {
      try {
        const stored = await AsyncStorage.getItem('persistentRecentChats_teacher');
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
  const saveRecentChatToStorage = async (userId: string) => {
    try {
      const updated = [userId, ...persistentRecentChats.filter(id => id !== userId)].slice(0, 10);
      setPersistentRecentChats(updated);
      await AsyncStorage.setItem('persistentRecentChats_teacher', JSON.stringify(updated));
    } catch (error) {
      // Handle error silently
    }
  };

  // Function to get recent chat users and add them to the top (using persistent storage)
  const getRecentChatUsers = useCallback(() => {
    if (!persistentRecentChats || persistentRecentChats.length === 0) {
      return [];
    }
    
    return persistentRecentChats.map(userId => {
      const user = allUsers.find(u => u._id === userId);
      return user ? { ...user, isRecentChat: true } : null;
    }).filter(Boolean);
  }, [persistentRecentChats, allUsers]);

  // Function to get non-recent users
  const getNonRecentUsers = useCallback(() => {
    const recentUserIds = persistentRecentChats || [];
    return users.filter(user => !recentUserIds.includes(user._id));
  }, [users, persistentRecentChats]);

  // Combine recent and non-recent users
  const sortedUsers = useMemo(() => {
    const recent = getRecentChatUsers();
    const nonRecent = getNonRecentUsers();
    return [...recent, ...nonRecent];
  }, [getRecentChatUsers, getNonRecentUsers]);

  // Check if users are coming from route params
  useEffect(() => {
    const routeUsers = (route.params as any)?.users;
    if (routeUsers) {
      setUsers(routeUsers);
      setAllUsers(routeUsers);
      setIsLoading(false);
    }
  }, [route.params]);

  // Load chat history when user is selected and start real-time polling
  useEffect(() => {
    if (selectedUser && user) {
      // Validate that we have valid IDs
      const userId = user?.id || (user as any)?._id;
      const selectedUserId = selectedUser?._id;

      if (!userId || !selectedUserId) {
        return;
      }

      const loadChatHistory = async () => {
        setIsLoadingMessages(true);
        try {
          const response = await messagesAPI.getChat(userId, selectedUserId);

          if (response.status === 200 && response.data) {
            const chatMessages = response.data.data.map((msg: any) => {
              const actualSenderId = msg.senderId._id;
              const actualReceiverId = msg.receiverId._id;

              const formattedMessage = {
                id: msg._id,
                text: msg.text,
                sender: actualSenderId === userId ? 'me' : 'user',
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: msg.read,
                edited: msg.edited,
                repliedTo: msg.repliedTo
              };

              return formattedMessage;
            });
            setMessages(chatMessages);
          } else {
            setMessages([]);
          }
        } catch (error: any) {
          if (error.response) {
            if (error.response.status === 500) {
              setMessages([]);
              setIsLoadingMessages(false);
              return;
            }
          }
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      };

      loadChatHistory();

      // Start real-time polling only if we have valid IDs
      if (userId && selectedUserId) {
        realtimeService.startPolling(userId, selectedUserId);

        const handleNewMessage = (msg: any) => {
          const actualSenderId = msg.senderId._id;
          const actualReceiverId = msg.receiverId._id;

          const formattedMessage: Message = {
            id: msg._id,
            text: msg.text,
            sender: actualSenderId === userId ? 'me' : 'user',
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: msg.read,
            edited: msg.edited,
            repliedTo: msg.repliedTo
          };

          setMessages(prev => {
            const exists = prev.some(m => m.id === formattedMessage.id);
            if (!exists) {
              return [...prev, formattedMessage];
            }
            return prev;
          });
        };

        realtimeService.on('newMessage', handleNewMessage);

        return () => {
          realtimeService.off('newMessage', handleNewMessage);
          realtimeService.stopPolling(`${userId}-${selectedUserId}`);
        };
      }
    }
  }, [selectedUser, user]);

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
    if (users.length > 0 && Object.keys(lastMessages).length === 0) {
      fetchLastMessagesForUsers(users);
    }
  }, [users]);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [studentsResponse, adminsResponse] = await Promise.all([
          userAPI.getStudents(),
          userAPI.getAdmins()
        ]);

        const students = studentsResponse.data.data.map((student: any) => ({
          _id: student._id,
          name: student.name,
          picture: student.picture,
          role: 'student' as const,
          presence: student.presence,
          isOnline: student.presence?.isOnline || student.isOnline || false,
          lastSeen: student.presence?.lastSeen || student.lastSeen || null,
          email: student.email,
          qualification: student.qualification
        }));

        const admins = adminsResponse.data.data.map((admin: any) => ({
          _id: admin._id,
          name: admin.name,
          picture: admin.picture,
          role: 'admin' as const,
          presence: admin.presence,
          isOnline: admin.presence?.isOnline || admin.isOnline || false,
          lastSeen: admin.presence?.lastSeen || admin.lastSeen || null,
          email: admin.email,
          qualification: admin.qualification
        }));

        const allUsersData = [...students, ...admins];
        setUsers(allUsersData);
        setAllUsers(allUsersData);

        await fetchLastMessagesForUsers(allUsersData);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching users:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Function to fetch last messages for all users
  const fetchLastMessagesForUsers = async (usersList: User[]) => {
    if (!userId) {
      return;
    }

    const lastMessagesData: { [userId: string]: { time: string; text: string } } = {};

    for (const userItem of usersList) {
      try {
        const response = await messagesAPI.getChat(userId, userItem._id);
        
        if (response.status === 200 && response.data) {
          if (response.data.data && response.data.data.length > 0) {
            const messages = response.data.data;
            const lastMessage = messages[messages.length - 1];

            lastMessagesData[userItem._id] = {
              time: new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: lastMessage.text
            };
          }
        }
      } catch (error) {
        // Don't add anything for errors
      }
    }

    setLastMessages(lastMessagesData);
  };

  const handleSend = useCallback(async () => {
    if (message.trim() === '' || !selectedUser || !user) return;

    const userId = user?.id || (user as any)?._id;
    const selectedUserId = selectedUser?._id;

    if (!userId || !selectedUserId) {
      return;
    }

    try {
      await realtimeService.sendMessage(
        userId,
        selectedUserId,
        message.trim()
      );
      
      // Only add to recent chat when message is successfully sent
      saveRecentChatToStorage(selectedUserId);
      setMessage('');
    } catch (error: any) {
      // Don't add to recent chat if message fails
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMessage('');
    }
  }, [message, selectedUser, user, saveRecentChatToStorage]); // Add saveRecentChatToStorage to dependency array

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
    <View style={styles.container}>
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <StyledText style={styles.emptyText}>No chat conversations available</StyledText>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Pressable
              onPress={() => {
                setSelectedUser(null);
                navigation.setOptions({ headerShown: true });
              }}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: pressed ? '#f0f0f0' : 'transparent' }
              ]}
            >
              <Icon name="arrow-left" size={24} color="#333" />
            </Pressable>
            <TouchableOpacity
              onPress={() => {
                setSelectedUser(null);
                navigation.setOptions({ headerShown: true });
              }}
              style={styles.teacherHeaderTouchable}
            >
              <Image source={{ uri: selectedUser.picture }} style={styles.chatHeaderAvatar} />
              <View>
                <StyledText style={styles.chatHeaderName}>{selectedUser.name}</StyledText>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: selectedUser.isOnline ? '#4CAF50' : '#9E9E9E' }]} />
                  <StyledText style={styles.statusText}>
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </StyledText>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            ListHeaderComponent={isLoadingMessages ? (
              <View style={styles.loadingMessagesContainer}>
                <ActivityIndicator size="small" color="#E56B8C" />
                <StyledText style={styles.loadingMessagesText}>Loading messages...</StyledText>
              </View>
            ) : null}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message ..."
              placeholderTextColor="black"
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Send size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
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
        <View style={styles.modalContainer}>
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
    paddingTop: 25,
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
  },
  // recentChatItem: {
  //   backgroundColor: '#e8f4fd',
  //   borderColor: '#4A90E2',
  // },
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
});

export default TeacherChatScreen;
