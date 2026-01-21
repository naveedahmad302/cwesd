import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ListRenderItem, ActivityIndicator } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userAPI } from '../../services/api';
import axios from 'axios';

// Type definitions
interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  online: boolean;
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
}


const MESSAGES: Message[] = [
  { id: '1', text: 'Hello, how can I help you today?', sender: 'teacher', time: '10:30 AM' },
  { id: '2', text: 'I need help with the calculus assignment', sender: 'me', time: '10:32 AM' },
  { id: '3', text: 'Which part are you having trouble with?', sender: 'teacher', time: '10:33 AM' },
];

const ChatWithTeacherScreen = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch teachers from API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await userAPI.getTeachers();
        // Handle the nested response structure
        const teachersData = response.data.data || [];
        
        // Transform API response to match our Teacher interface
        const transformedTeachers: Teacher[] = teachersData.map((teacher: TeacherApiResponse) => ({
          id: teacher._id,
          name: teacher.name,
          subject: teacher.qualification || 'Teacher', // Use qualification as subject
          avatar: teacher.picture || 'https://via.placeholder.com/50',
          online: Math.random() > 0.5, // Random online status since API doesn't provide it
        }));
        
        setTeachers(transformedTeachers);
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

  const handleSend = () => {
    if (message.trim() === '') return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
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

  const renderMessage: ListRenderItem<Message> = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'me' ? styles.myMessage : styles.teacherMessage
    ]}>
      <StyledText style={styles.messageText}>{item.text}</StyledText>
      <StyledText style={styles.messageTime}>{item.time}</StyledText>
    </View>
  );

  return (
    <View style={styles.container}>
      {!selectedTeacher ? (
        <View style={styles.teacherListContainer}>
          <View style={styles.header}>
            <StyledText style={styles.headerTitle}>Select a Teacher</StyledText>
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
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Icon name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Teacher List Styles
  teacherListContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#666',
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
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
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
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
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
    borderRadius: 20,
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
    borderRadius: 20,
    backgroundColor: '#00A67E',
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
});

export default ChatWithTeacherScreen;
