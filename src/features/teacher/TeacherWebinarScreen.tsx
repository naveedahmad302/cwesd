import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import WebinarCard from '../../shared/components/WebinarCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Webinar {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: number;
  status: 'upcoming' | 'live' | 'completed';
}

const TeacherWebinarScreen = () => {
  // Mock data - replace with actual data from your API
  const webinars: Webinar[] = [
    {
      id: '1',
      title: 'Market Analysis Workshop',
      date: 'Jan 16, 2026',
      time: '10:00 AM',
      participants: 28,
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Advanced Trading Strategies',
      date: 'Jan 18, 2026',
      time: '2:00 PM',
      participants: 45,
      status: 'upcoming',
    },
    {
      id: '3',
      title: 'Risk Management Basics',
      date: 'Jan 20, 2026',
      time: '11:00 AM',
      participants: 32,
      status: 'upcoming',
    },
  ];

  const handleStartWebinar = (webinarId: string) => {
    console.log('Starting webinar:', webinarId);
    // Implement webinar start logic here
  };

  const handleScheduleWebinar = () => {
    console.log('Schedule new webinar');
    // Implement schedule webinar logic here
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleWebinar}>
          <Icon name="plus" size={20} color="#fff" />
          <StyledText style={styles.scheduleButtonText}>Schedule Webinar</StyledText>
        </TouchableOpacity>
        
        {/* <StyledText style={styles.sectionTitle}>Upcoming Webinars</StyledText> */}
        
        {webinars.map((webinar) => (
          <WebinarCard
            key={webinar.id}
            title={webinar.title}
            date={webinar.date}
            time={webinar.time}
            participants={webinar.participants}
            status={webinar.status}
            onStartWebinar={() => handleStartWebinar(webinar.id)}
          />
        ))}
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
  scheduleButton: {
    marginTop: 30,
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    gap: 12,
    width:230
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
});

export default TeacherWebinarScreen;
