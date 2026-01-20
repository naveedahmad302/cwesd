import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../auth';

const TeacherProfileScreen = () => {
  const { user, logout } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.profileInfo}>
        <Text>Name: {user?.name}</Text>
        <Text>Email: {user?.email || 'N/A'}</Text>
        <Text>Role: {user?.role}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default TeacherProfileScreen;
