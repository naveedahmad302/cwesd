import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ListRenderItem, ActivityIndicator, Modal, ScrollView } from 'react-native';
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Teacher[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

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
          online: Math.random() > 0.5 // Random online status for demo
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
        <StyledText style={styles.teacherSubject}>{item.subject}</StyledText>
      </View>
      <Icon name="plus" size={24} color="#00A67E" />
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
            <TouchableOpacity 
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.closeButton}
            >
             
            </TouchableOpacity>
            <StyledText style={styles.modalTitle}>Message a Teachers</StyledText>
            <View style={styles.placeholder} />
             <Icon name="close" size={24} color="#333" />
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
    padding: 16,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
