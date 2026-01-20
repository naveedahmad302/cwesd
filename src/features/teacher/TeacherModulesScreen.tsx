import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../auth';

const TeacherModulesScreen = () => {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Modules</Text>
      <Text>Welcome, {user?.name}!</Text>
      {/* Add teacher modules listing here */}
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
});

export default TeacherModulesScreen;
