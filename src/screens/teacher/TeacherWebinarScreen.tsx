import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import WebinarCard from '../../shared/components/WebinarCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGetWebinarsQuery } from '../../store/api';
import ScheduleWebinarModal from './components/ScheduleWebinarModal';

const TeacherWebinarScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [webinarForm, setWebinarForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    meetLink: '',
    courseId: '',
    sectionId: '',
  });
  
  const { data: webinarsData, isLoading, error, refetch } = useGetWebinarsQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getWebinarStatus = (start: string, end: string): 'upcoming' | 'live' | 'completed' => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'live';
    return 'completed';
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const handleStartWebinar = (webinarId: string, meetLink: string) => {
    console.log('Starting webinar:', webinarId, 'Meet link:', meetLink);
    // You can use Linking.openURL(meetLink) to open the meet link
    // or navigate to a webinar screen within the app
  };

  const handleScheduleWebinar = () => {
    setShowScheduleModal(true);
  };

  const handleCloseModal = () => {
    setShowScheduleModal(false);
    // Reset form
    setWebinarForm({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      meetLink: '',
      courseId: '',
      sectionId: '',
    });
  };

  const handleCreateWebinar = () => {
    // TODO: Implement webinar creation API call
    console.log('Creating webinar:', webinarForm);
    handleCloseModal();
    refetch(); // Refresh the webinars list
  };

  const webinars = webinarsData?.webinars || [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E56B8C" />
          <StyledText style={styles.loadingText}>Loading webinars...</StyledText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#E56B8C" />
          <StyledText style={styles.errorText}>Failed to load webinars</StyledText>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <StyledText style={styles.retryButtonText}>Retry</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E56B8C']} />
        }
      >
        <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleWebinar}>
          <Icon name="plus" size={20} color="#fff" />
          <StyledText style={styles.scheduleButtonText}>Schedule Webinar</StyledText>
        </TouchableOpacity>
        
        {webinars.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="video-off-outline" size={64} color="#9CA3AF" />
            <StyledText style={styles.emptyText}>No webinars scheduled</StyledText>
            <StyledText style={styles.emptySubtext}>Tap "Schedule Webinar" to create your first webinar</StyledText>
          </View>
        ) : (
          webinars.map((webinar) => {
            const status = getWebinarStatus(webinar.start, webinar.end);
            const { date, time } = formatDateTime(webinar.start);
            
            return (
              <WebinarCard
                key={webinar._id}
                title={webinar.title}
                date={date}
                time={time}
                participants={webinar.presentCount}
                status={status}
                onStartWebinar={() => handleStartWebinar(webinar._id, webinar.meetLink)}
              />
            );
          })
        )}
      </ScrollView>
      
      <ScheduleWebinarModal
        visible={showScheduleModal}
        onClose={handleCloseModal}
        onCreate={handleCreateWebinar}
        form={webinarForm}
        setForm={setWebinarForm}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scheduleButton: {
    marginTop: 30,
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    gap: 12,
    width: 230,
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
