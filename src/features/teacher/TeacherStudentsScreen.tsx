import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import StyledText from '../../shared/components/StyledText';

const TeacherStudentsScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <StyledText style={styles.title}>Students</StyledText>
        <StyledText style={styles.subtitle}>Manage your students</StyledText>
        
        <View style={styles.card}>
          <StyledText style={styles.cardTitle}>Student List</StyledText>
          <StyledText style={styles.cardText}>View and manage all enrolled students</StyledText>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
});

export default TeacherStudentsScreen;
