import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ListRenderItem } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Type definitions
interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'teacher';
  time: string;
}

// Mock data for teachers
const TEACHERS = [
  { id: '1', name: 'Dr. Sarah Johnson', subject: 'Mathematics', avatar: 'data:image/jpeg;base64,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', online: true },
  { id: '2', name: 'Prof. Michael Chen', subject: 'Physics', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbHmkXbcUTvBZcGdm8sgealgfrD6sno8DEIQ&s', online: true },
  { id: '3', name: 'Dr. Emily Wilson', subject: 'Computer Science', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmUafSaFgZl4haVLyw9ocWSnlyCcYCH8avngcEE8xcJw&s', online: false },
  { id: '4', name: 'Prof. David Kim', subject: 'Biology', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmUafSaFgZl4haVLyw9ocWSnlyCcYCH8avngcEE8xcJw&s', online: true },
];

const MESSAGES: Message[] = [
  { id: '1', text: 'Hello, how can I help you today?', sender: 'teacher', time: '10:30 AM' },
  { id: '2', text: 'I need help with the calculus assignment', sender: 'me', time: '10:32 AM' },
  { id: '3', text: 'Which part are you having trouble with?', sender: 'teacher', time: '10:33 AM' },
];

const ChatWithTeacherScreen = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(MESSAGES);

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
          <FlatList
            data={TEACHERS}
            keyExtractor={item => item.id}
            renderItem={renderTeacherItem}
            contentContainerStyle={styles.teacherList}
          />
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
});

export default ChatWithTeacherScreen;
