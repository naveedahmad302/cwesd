import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ListRenderItem, ActivityIndicator, Modal, ScrollView } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userAPI, messagesAPI } from '../../services/api';
import { realtimeService } from '../../services/realtimeService';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Send } from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';

// Type definitions
interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  online: boolean;
  email: string;
  role: string;
}

// API response type
interface TeacherApiResponse {
  _id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  qualification: string;
  // ... other fields from API that we might not need
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'teacher';
  time: string;
  read?: boolean;
  edited?: boolean;
  deleted?: boolean;
  repliedTo?: string | null;
}


const MESSAGES: Message[] = [
  { id: '1', text: 'Hello, how can I help you today?', sender: 'teacher', time: '10:30 AM' },
  { id: '2', text: 'I need help with the calculus assignment', sender: 'me', time: '10:32 AM' },
  { id: '3', text: 'Which part are you having trouble with?', sender: 'teacher', time: '10:33 AM' },
];

const ChatWithTeacherScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Teacher[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

  // Load chat history when teacher is selected and start real-time polling
  useEffect(() => {
    if (selectedTeacher && user) {
      console.log('🔍 Debug - User object:', user);
      console.log('🔍 Debug - Selected teacher object:', selectedTeacher);
      console.log('🔍 Debug - User ID:', user?.id);
      console.log('🔍 Debug - Teacher ID:', selectedTeacher?.id);
      console.log('🔍 Debug - User keys:', user ? Object.keys(user) : 'user is null');
      console.log('🔍 Debug - User _id:', (user as any)?._id); // Check if _id exists instead of id
      
      // Validate that we have valid IDs
      const userId = user?.id || (user as any)?._id; // Fallback to _id if id is missing
      const teacherId = selectedTeacher?.id;
      
      if (!userId || !teacherId) {
        console.error('❌ Invalid user IDs:', { 
          userId: userId, 
          teacherId: teacherId,
          userKeys: user ? Object.keys(user) : 'user is null/undefined',
          teacherKeys: selectedTeacher ? Object.keys(selectedTeacher) : 'teacher is null/undefined',
          user: user,
          selectedTeacher: selectedTeacher
        });
        return;
      }

      console.log('✅ Validated IDs:', { userId, teacherId });

      const loadChatHistory = async () => {
        setIsLoadingMessages(true);
        try {
          console.log(`📥 Loading chat history for user ${userId} and teacher ${teacherId}`);
          const response = await messagesAPI.getChat(userId, teacherId);
          
          if (response.status === 200 && response.data) {
            const chatMessages = response.data.data.map((msg: any) => {
              console.log('🔍 Raw message from server:', {
                fullMessage: msg,
                messageId: msg._id,
                messageText: msg.text,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                senderIdObject: typeof msg.senderId,
                receiverIdObject: typeof msg.receiverId,
                allKeys: Object.keys(msg),
                allValues: Object.values(msg)
              });
              
              // Extract the actual ID from the senderId object
              const actualSenderId = msg.senderId._id;
              const actualReceiverId = msg.receiverId._id;
              
              console.log('🔍 Message debug:', {
                actualSenderId: actualSenderId,
                actualReceiverId: actualReceiverId,
                userId: userId,
                teacherId: teacherId,
                isMe: actualSenderId === userId,
                isTeacher: actualSenderId === teacherId,
                senderIdMatchesUser: actualSenderId === userId,
                senderIdMatchesTeacher: actualSenderId === teacherId
              });
              
              const formattedMessage = {
                id: msg._id,
                text: msg.text,
                sender: actualSenderId === userId ? 'me' : 'teacher',
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: msg.read,
                edited: msg.edited,
                repliedTo: msg.repliedTo
              };
              
              console.log('🔍 Formatted message from history:', {
                id: formattedMessage.id,
                text: formattedMessage.text,
                sender: formattedMessage.sender,
                time: formattedMessage.time,
                originalSender: actualSenderId
              });
              
              return formattedMessage;
            });
            console.log(`✅ Loaded ${chatMessages.length} messages`);
            setMessages(chatMessages);
          } else {
            console.warn('⚠️ Unexpected response format:', response);
            setMessages(MESSAGES);
          }
        } catch (error: any) {
          console.error('❌ Failed to load chat history:', error);
          
          // Log more details about the error
          if (error.response) {
            console.error('❌ Error response:', {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data
            });
            
            // If we get a 500 error, don't keep trying
            if (error.response.status === 500) {
              console.error('❌ Server error - using fallback messages');
              setMessages(MESSAGES);
              setIsLoadingMessages(false);
              return;
            }
          }
          
          // Use mock messages if API fails
          setMessages(MESSAGES);
        } finally {
          setIsLoadingMessages(false);
        }
      };

      loadChatHistory();

      // Start real-time polling only if we have valid IDs
      if (userId && teacherId) {
        console.log(`🔄 Starting polling for ${userId} -> ${teacherId}`);
        realtimeService.startPolling(userId, teacherId, 3000);

        // Listen for new messages
        const handleNewMessage = (msg: any) => {
          console.log('🔍 Raw new message from server:', {
            fullMessage: msg,
            messageId: msg._id,
            messageText: msg.text,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            senderIdObject: typeof msg.senderId,
            receiverIdObject: typeof msg.receiverId,
            allKeys: Object.keys(msg),
            allValues: Object.values(msg)
          });
          
          // Extract the actual ID from the senderId object
          const actualSenderId = msg.senderId._id;
          const actualReceiverId = msg.receiverId._id;
          
          console.log('🔍 New message debug:', {
            actualSenderId: actualSenderId,
            actualReceiverId: actualReceiverId,
            userId: userId,
            teacherId: teacherId,
            isMe: actualSenderId === userId,
            isTeacher: actualSenderId === teacherId,
            senderIdMatchesUser: actualSenderId === userId,
            senderIdMatchesTeacher: actualSenderId === teacherId
          });
          
          const formattedMessage: Message = {
            id: msg._id,
            text: msg.text,
            sender: actualSenderId === userId ? 'me' : 'teacher',
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: msg.read,
            edited: msg.edited,
            repliedTo: msg.repliedTo
          };
          
          console.log('🔍 Formatted new message:', {
            id: formattedMessage.id,
            text: formattedMessage.text,
            sender: formattedMessage.sender,
            time: formattedMessage.time,
            originalSender: actualSenderId
          });
          
          setMessages(prev => {
            // Check if message already exists
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
          realtimeService.stopPolling(`${userId}-${teacherId}`);
        };
      }
    }
  }, [selectedTeacher, user]);

  // Hide/show header based on teacher selection
  useFocusEffect(
    React.useCallback(() => {
      if (selectedTeacher) {
        navigation.setOptions({ headerShown: false });
      } else {
        navigation.setOptions({ headerShown: true });
      }
    }, [selectedTeacher, navigation])
  );

  // Fetch teachers from API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await userAPI.getTeachers();
        // Handle the nested response structure
        const teachersData = response.data.data || [];
        
        // Transform API response to match our Teacher interface
        const transformedTeachers = teachersData.map((teacher: TeacherApiResponse) => ({
          id: teacher._id,
          name: teacher.name,
          subject: teacher.qualification || 'No subject specified',
          avatar: teacher.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s',
          online: Math.random() > 0.5, // Random online status for demo
          email: teacher.email,
          role: teacher.role
        }));
        
        setTeachers(transformedTeachers);
        setAllTeachers(transformedTeachers); // Set all teachers for search
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleSend = useCallback(async () => {
    if (message.trim() === '' || !selectedTeacher || !user) return;
    
    // Validate user IDs before sending
    const userId = user?.id || (user as any)?._id; // Fallback to _id if id is missing
    const teacherId = selectedTeacher?.id;
    
    if (!userId || !teacherId) {
      console.error('Cannot send message - invalid user IDs:', { 
        userId: userId, 
        teacherId: teacherId 
      });
      return;
    }
    
    try {
      console.log(`Sending message from ${userId} to ${teacherId}: "${message.trim()}"`);
      await realtimeService.sendMessage(
        userId,
        teacherId,
        message.trim()
      );
      setMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // If we get a 500 error, show a fallback message locally
        if (error.response.status === 500) {
          console.error('❌ Server error - message not sent, showing locally only');
        }
      }
      
      // Fallback to local message if API fails
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMessage('');
    }
  }, [message, selectedTeacher, user]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = allTeachers.filter(teacher =>
        teacher.name.toLowerCase().includes(query.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderTeacherItem: ListRenderItem<Teacher> = ({ item }) => (
    <TouchableOpacity 
      style={[styles.teacherItem, selectedTeacher?.id === item.id && styles.selectedTeacher]}
      onPress={() => setSelectedTeacher(item)}
    >
      <View style={styles.teacherAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.teacherAvatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.teacherInfo}>
        <StyledText style={styles.teacherName}>{item.name}</StyledText>
        <StyledText style={styles.teacherSubject}>{item.subject}</StyledText>
      </View>
      <Icon name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

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
        {/* <StyledText style={styles.teacherSubject}>{item.subject}</StyledText> */}
        <StyledText style={styles.teacherEmail}>{item.email}</StyledText>
        <StyledText style={styles.teacherRole}>{item.role}</StyledText>
      </View>
      {/* <Icon name="plus" size={24} color="#00A67E" /> */}
    </TouchableOpacity>
  );

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    console.log('🔍 Render message debug:', {
      messageId: item.id,
      text: item.text,
      sender: item.sender,
      isMe: item.sender === 'me',
      isTeacher: item.sender === 'teacher'
    });
    
    return (
    <View style={[
      styles.messageContainer,
      item.sender === 'me' ? styles.myMessageContainer : styles.teacherMessageContainer
    ]}>
      {item.sender === 'teacher' && (
        <Image 
          source={{ uri: selectedTeacher?.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s' }} 
          style={styles.messageAvatar} 
        />
      )}
      <View style={styles.messageContentWrapper}>
        <StyledText style={[
          styles.senderLabel,
          item.sender === 'me' ? styles.mySenderLabel : styles.teacherSenderLabel
        ]}>
          {item.sender === 'me' ? 'You' : selectedTeacher?.name}
        </StyledText>
        <View style={[
          styles.messageBubble,
          item.sender === 'me' ? styles.myMessage : styles.teacherMessage
        ]}>
          <StyledText style={[
            styles.messageText,
            item.sender === 'me' && styles.myMessageText
          ]}>{item.text}</StyledText>
        </View>
        <StyledText style={[
          styles.messageTime,
          item.sender === 'me' ? styles.myMessageTime : styles.teacherMessageTime
        ]}>{item.time}</StyledText>
      </View>
      {item.sender === 'me' && (
        <Image 
          source={{ uri: user?.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s' }} 
          style={styles.messageAvatar} 
        />
      )}
    </View>
    );
  };

  return (
    <View style={styles.container}>
      {!selectedTeacher ? (
        <View style={styles.teacherListContainer}>
          <View style={styles.header}>
            {/* <StyledText style={styles.headerTitle}>Select a Teacher</StyledText> */}
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
              <StyledText style={styles.loadingText}>Loading teachers...</StyledText>
            </View>
          ) : (
            <FlatList
              data={teachers}
              keyExtractor={item => item.id}
              renderItem={renderTeacherItem}
              contentContainerStyle={styles.teacherList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="account-search" size={48} color="#ccc" />
                  <StyledText style={styles.emptyText}>No teachers available</StyledText>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedTeacher(null)} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Image source={{ uri: selectedTeacher.avatar }} style={styles.chatHeaderAvatar} />
            <View>
              <StyledText style={styles.chatHeaderName}>{selectedTeacher.name}</StyledText>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: selectedTeacher.online ? '#4CAF50' : '#9E9E9E' }]} />
                <StyledText style={styles.statusText}>
                  {selectedTeacher.online ? 'Online' : 'Offline'}
                </StyledText>
              </View>
            </View>
          </View>
          
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            ListHeaderComponent={isLoadingMessages ? (
              <View style={styles.loadingMessagesContainer}>
                <ActivityIndicator size="small" color="#00A67E" />
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
            <StyledText style={styles.modalTitle}>Message a Teachers</StyledText>
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
            <StyledText style={styles.searchSectionTitle}>Select a teacher to start a new conversation.</StyledText>
            <View style={styles.searchInputContainer}>
              <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
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
              // Show all teachers when no search query
              allTeachers.length === 0 ? (
                <View style={styles.searchPlaceholder}>
                  <Icon name="account-off" size={48} color="#ccc" />
                  <StyledText style={styles.searchPlaceholderText}>
                    No teachers available
                  </StyledText>
                </View>
              ) : (
                <View style={styles.resultsList}>
                  {/* <StyledText style={styles.allTeachersTitle}>All Teachers</StyledText> */}
                  <FlatList
                    data={allTeachers}
                    keyExtractor={item => item.id}
                    renderItem={renderSearchTeacherItem}
                    contentContainerStyle={styles.teacherList}
                  />
                </View>
              )
            ) : searchResults.length === 0 ? (
              <View style={styles.searchPlaceholder}>
                <Icon name="account-off" size={48} color="#ccc" />
                <StyledText style={styles.searchPlaceholderText}>
                  No teachers found
                </StyledText>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <StyledText style={styles.searchResultsTitle}>
                  Search Results ({searchResults.length})
                </StyledText>
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id}
                  renderItem={renderSearchTeacherItem}
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
  // Teacher List Styles
  teacherListContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  teacherList: {
    padding: 8,
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
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
  teacherSubject: {
    fontSize: 14,
    color: 'black',
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
    padding:16,
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
  teacherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    // marginTop: -1,
  },
  messageContentWrapper: {
    maxWidth: '100%',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  mySenderLabel: {
    color: '#666',
    textAlign: 'right',
  },
  teacherSenderLabel: {
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
    // borderTopRightRadius: 4,
  },
  teacherMessage: {
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
  teacherMessageTime: {
    color: '#666',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom:30,
    // paddingTop:30,
    // paddingVertical:0,
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
    borderWidth:1,
    borderColor:'#ddddddff'
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
    
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
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
  allTeachersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
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
    // backgroundColor: '#F9FAFB',
    // borderWidth: 1,
    // borderColor: '#e0e0e0',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
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

export default ChatWithTeacherScreen;
