import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ListRenderItem } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Type definitions
interface Student {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'teacher' | 'student';
  time: string;
}

// Mock data for students
const STUDENTS = [
  { id: '1', name: 'John Smith', avatar: 'https://picsum.photos/seed/student1/200/200', online: true },
  { id: '2', name: 'Emily Johnson', avatar: 'https://picsum.photos/seed/student2/200/200', online: false },
  { id: '3', name: 'Michael Chen', avatar: 'https://picsum.photos/seed/student3/200/200', online: true },
];

const MESSAGES: Message[] = [
  { id: '1', text: 'Hello! How can I help you today?', sender: 'teacher', time: '10:30 AM' },
  { id: '2', text: 'I have a question about the assignment', sender: 'student', time: '10:32 AM' },
  { id: '3', text: 'Sure, what would you like to know?', sender: 'teacher', time: '10:33 AM' },
];

const TeacherChatScreen = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(MESSAGES);

  const handleSend = () => {
    if (message.trim() === '') return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'teacher',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const renderStudentItem: ListRenderItem<Student> = ({ item }) => (
    <TouchableOpacity 
      style={[styles.studentItem, selectedStudent?.id === item.id && styles.selectedStudent]}
      onPress={() => setSelectedStudent(item)}
    >
      <View style={styles.studentAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.studentAvatar} />
          {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.studentInfo}>
        <StyledText style={styles.studentName}>{item.name}</StyledText>
      </View>
      <Icon name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  const renderMessage: ListRenderItem<Message> = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'teacher' ? styles.teacherMessage : styles.studentMessage
    ]}>
      <StyledText style={styles.messageText}>{item.text}</StyledText>
      <StyledText style={styles.messageTime}>{item.time}</StyledText>
    </View>
  );

  return (
    <View style={styles.container}>
      {!selectedStudent ? (
        <View style={styles.studentListContainer}>
          <View style={styles.header}>
            <StyledText style={styles.headerTitle}>Select a Student</StyledText>
          </View>
          <FlatList
            data={STUDENTS}
            keyExtractor={item => item.id}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.studentList}
          />
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Image source={{ uri: selectedStudent.avatar }} style={styles.chatHeaderAvatar} />
            <View>
              <StyledText style={styles.chatHeaderName}>{selectedStudent.name}</StyledText>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: selectedStudent.online ? '#4CAF50' : '#9E9E9E' }]} />
                <StyledText style={styles.statusText}>
                  {selectedStudent.online ? 'Online' : 'Offline'}
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
  // Student List Styles
  studentListContainer: {
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
  studentList: {
    padding: 8,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedStudent: {
    backgroundColor: '#e3f2fd',
  },
  studentAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  studentAvatar: {
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
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
    marginRight: 12,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  teacherMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-start',
  },
  studentMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#00FFCC',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeacherChatScreen;
