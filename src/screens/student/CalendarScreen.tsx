import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl, ActivityIndicator, Linking, AppState, AppStateStatus } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, Bell, Users, Book, Upload, Video, FileText, Clock4, ExternalLink } from 'lucide-react-native';
import StyledText from '../../shared/components/StyledText';
import { useGetEventsQuery } from '../../store/api';
import type { Event } from '../../store/api/eventsApi';

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  // For demo purposes, using courseId '6'. In production, this should come from user context or navigation params
  const courseId = '6';
  const { data: eventsData, isLoading, error, refetch } = useGetEventsQuery({ courseId });
  
  const [refreshing, setRefreshing] = useState(false);

  // Handle app state changes to prevent crashes when returning from external apps
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come back from background/inactive state (e.g., returning from Google Meet)
        // Refresh data to ensure everything is in a consistent state
        refetch();
      }
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [refetch]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Safe URL opening function with error handling
  const openGoogleMeetLink = useCallback(async (meetLink: string) => {
    try {
      // Validate the URL before opening
      if (!meetLink || typeof meetLink !== 'string') {
        console.error('Invalid Google Meet link provided');
        return;
      }

      // Check if it's a valid Google Meet URL
      if (!meetLink.includes('meet.google.com')) {
        console.error('URL is not a valid Google Meet link:', meetLink);
        return;
      }

      // Open the URL directly (canOpenURL check often fails for external apps)
      console.log('Opening Google Meet link:', meetLink);
      await Linking.openURL(meetLink);
    } catch (error) {
      console.error('Error opening Google Meet link:', error);
      // Try opening in browser as fallback
      try {
        console.log('Attempting to open in browser as fallback');
        await Linking.openURL(meetLink);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  }, []);

  // Add error boundaries for additional safety
  const handleEventPress = useCallback((event: Event) => {
    try {
      // Additional safety check before opening link
      if (event.meetLink && event.meetLink.includes('meet.google.com')) {
        openGoogleMeetLink(event.meetLink);
      }
    } catch (error) {
      console.error('Error handling event press:', error);
    }
  }, [openGoogleMeetLink]);

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date for event display
  const formatEventDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Format date and time for event display
  const formatEventDateTime = (isoString: string) => {
    const eventDate = new Date(isoString);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();
    
    if (isToday) {
      // For today's events, show only time
      return formatTime(isoString);
    } else {
      // For other events, show date and time
      return `${formatEventDate(isoString)} • ${formatTime(isoString)}`;
    }
  };

  // Get events from API or empty array
  const events = useMemo(() => {
    return eventsData?.events || [];
  }, [eventsData]);

  // Filter events for the current day
  const getCurrentDayEvents = () => {
    const today = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === today.toDateString();
    });
  };

  // Get upcoming events (future events)
  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10); // Limit to 10 upcoming events
  };

  // Get days in month that have events
  const getDaysWithEvents = () => {
    return events.reduce((days, event) => {
      const eventDate = new Date(event.start);
      if (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      ) {
        days.add(eventDate.getDate());
      }
      return days;
    }, new Set<number>());
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const selectDate = (day: number) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const daysWithEvents = getDaysWithEvents();

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === new Date().getDate() && 
        currentDate.getMonth() === new Date().getMonth() && 
        currentDate.getFullYear() === new Date().getFullYear();
      
      const isSelected = 
        day === selectedDate.getDate() && 
        currentDate.getMonth() === selectedDate.getMonth() && 
        currentDate.getFullYear() === selectedDate.getFullYear();

      const hasEvent = daysWithEvents.has(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            isSelected && styles.selectedCell
          ]}
          onPress={() => selectDate(day)}
        >
          <StyledText style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedText,
            hasEvent && !isSelected && { fontWeight: '700' }
          ]}>
            {day}
          </StyledText>
          {hasEvent && !isSelected && <View style={styles.eventDot} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderEventItem = (event: Event, isCurrentDay: boolean = false) => {
    // Choose icon and color based on event title or type
    let IconComponent = Video;
    let color = '#00C950'; // Default green (Webinar)
    let eventType = 'Webinar'; // Default event type
    
    if (event.title.toLowerCase().includes('class') || event.title.toLowerCase().includes('live')) {
      IconComponent = Video;
      color = '#8B5CF6'; // Purple for Class
      eventType = 'Class';
    } else if (event.title.toLowerCase().includes('workshop')) {
      IconComponent = Book;
      color = '#000000'; // Black for Workshop
      eventType = 'Workshop';
    } else if (event.title.toLowerCase().includes('webinar')) {
      IconComponent = Book;
      color = '#00C950'; // Green for Webinar
      eventType = 'Webinar';
    } else if (event.title.toLowerCase().includes('assignment')) {
      IconComponent = Upload;
      color = '#EF4444'; // Red for Assignment
      eventType = 'Assignment';
    } else if (event.title.toLowerCase().includes('deadline') || event.title.toLowerCase().includes('due')) {
      IconComponent = Upload;
      color = '#EC4899'; // Pink for Deadline
      eventType = 'Deadline';
    } else if (event.title.toLowerCase().includes('quiz')) {
      IconComponent = FileText;
      color = '#FBBF24'; // Yellow for Quiz
      eventType = 'Quiz';
    } else if (event.title.toLowerCase().includes('exam') || event.title.toLowerCase().includes('test')) {
      IconComponent = FileText;
      color = '#F97316'; // Orange for Exam
      eventType = 'Exam';
    } else if (event.title.toLowerCase().includes('meeting') || event.title.toLowerCase().includes('sync')) {
      IconComponent = Users;
      color = '#007AFF'; // Blue for Meeting
      eventType = 'Meeting';
    }
    
    return (
      <View key={event.id} style={[
        styles.eventItem,
        isCurrentDay ? styles.currentDayEventItem : styles.otherEventItem
      ]}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Video size={20} color="#fff" />
        </View>
        <View style={styles.eventContent}>
          <View style={styles.eventTitleRow}>
            <StyledText style={styles.eventTitle}>{event.title}</StyledText>
            {isCurrentDay && (
              <View style={[styles.eventTypeTag, { backgroundColor: color }]}>
                <StyledText style={styles.eventTypeTagText}>{eventType}</StyledText>
              </View>
            )}
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Clock4 size={15} color="black" style={{marginRight: 10}} />
            <StyledText style={styles.eventDateTime}>
              {formatEventDateTime(event.start)} - {formatTime(event.end)}
            </StyledText>
          </View>
          {event.meetLink && isCurrentDay && (
            <TouchableOpacity 
              style={styles.joinMeetingTag}
              onPress={() => handleEventPress(event)}
            >
              <Video size={15} color="black" style={{marginRight: 8}} />
              <StyledText style={styles.joinMeetingTagText}>Join Meeting</StyledText>
              <ExternalLink size={10} color="#155DFC" style={{marginLeft: 5}} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E56B8C']} />
      }
    >
      <View style={styles.header}>
        <StyledText style={styles.title}>Calendar</StyledText>
        <StyledText style={styles.subtitle}>Manage your schedule and upcoming events</StyledText>
      </View>

      <View style={styles.calendarContainer}>
        {/* Month/Year Display */}
        <View style={styles.monthYearDisplay}>
          <StyledText style={styles.monthYearText}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </StyledText>
        </View>

        {/* Navigation Controls */}
        <View style={styles.navigationControls}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navArrowButton}>
            <ChevronLeft size={20} color="#000" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <StyledText style={styles.todayButtonText}>Today</StyledText>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navArrowButton}>
            <ChevronRight size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Days of Week */}
        <View style={styles.daysOfWeek}>
          {daysOfWeek.map(day => (
            <View key={day} style={styles.dayOfWeekCell}>
              <StyledText style={styles.dayOfWeekText}>{day}</StyledText>
            </View>
          ))}
        </View>

        {/* Calendar Days Grid */}
        <View style={styles.daysGrid}>
          {renderCalendarDays()}
        </View>
      </View>

      

      {/* Current Day's Events Section */}
      <View style={styles.currentDaySection}>
        <View style={styles.currentDayHeader}>
          <Calendar size={20} color="black" />
          <StyledText style={styles.currentDayTitle}>{formatDate(new Date())}</StyledText>
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#E56B8C" />
            <StyledText style={styles.loadingText}>Loading events...</StyledText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <StyledText style={styles.errorText}>Failed to load events</StyledText>
          </View>
        ) : getCurrentDayEvents().length > 0 ? (
          <View style={styles.eventsList}>
            {getCurrentDayEvents().map((event) => renderEventItem(event, true))}
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <Calendar size={48} color="#ccc" />
            <StyledText style={styles.noEventsText}>No events scheduled</StyledText>
          </View>
        )}
      </View>

      {/* Upcoming Events Section */}
      <View style={styles.upcomingSection}>
        <View style={styles.upcomingHeader}>
          <Bell size={20} color="black" />
          <StyledText style={styles.upcomingTitle}>Upcoming Events</StyledText>
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#E56B8C" />
            <StyledText style={styles.loadingText}>Loading events...</StyledText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <StyledText style={styles.errorText}>Failed to load events</StyledText>
          </View>
        ) : getUpcomingEvents().length > 0 ? (
          <View style={styles.eventsList}>
            {getUpcomingEvents().map((event) => renderEventItem(event, false))}
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <Bell size={48} color="#ccc" />
            <StyledText style={styles.noEventsText}>No upcoming events</StyledText>
          </View>
        )}
      </View>
      {/* Event Types Legend */}
      <View style={styles.eventTypesContainer}>
        <StyledText style={styles.eventTypesTitle}>Event Types</StyledText>
        <View style={styles.eventTypesGrid}>
          <View style={styles.eventTypeColumn}>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#10B981' }]} />
              <StyledText style={styles.eventTypeText}>Webinar</StyledText>
            </View>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#FBBF24' }]} />
              <StyledText style={styles.eventTypeText}>Quiz</StyledText>
            </View>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#EC4899' }]} />
              <StyledText style={styles.eventTypeText}>Deadline</StyledText>
            </View>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#F97316' }]} />
              <StyledText style={styles.eventTypeText}>Exam</StyledText>
            </View>
          </View>
          <View style={styles.eventTypeColumn}>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#EF4444' }]} />
              <StyledText style={styles.eventTypeText}>Assignment</StyledText>
            </View>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#007AFF' }]} />
              <StyledText style={styles.eventTypeText}>Meeting</StyledText>
            </View>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#8B5CF6' }]} />
              <StyledText style={styles.eventTypeText}>Class</StyledText>
            </View>
            <View style={styles.eventTypeItem}>
              <View style={[styles.eventTypeDot, { backgroundColor: '#000000' }]} />
              <StyledText style={styles.eventTypeText}>Workshop</StyledText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  joinMeetingTag:{
    // justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    
  },
  joinMeetingTagText:{
    color: '#155DFC',
    textDecorationLine: 'underline',
    fontSize: 12,
    fontWeight: '600',
  },
  joinMeetingIcon: {
    marginRight: 20,
  },
  dateTimeIcon: {
    marginRight: 8,
  },
  meetingTagIcon: {
    marginRight: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  calendarContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthYearDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYearText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  navArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  todayButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 30,
    paddingVertical: 5,
    borderRadius: 8,
  },
  todayButtonText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 14,
  },
  daysOfWeek: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayOfWeekText: {
    fontSize: 14,
    color: 'black',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (screenWidth - 80) / 7,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  todayCell: {
    backgroundColor: '#00FFCC',
    borderRadius: 8,
    color: '#000',
  },
  selectedCell: {
    backgroundColor: '#E56B8C',
    borderRadius: 0,
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  todayText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E56B8C',
  },
  // Current Day Events Section
  currentDaySection: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120, // Minimum height for the section
  },
  currentDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentDayTitle: {
    
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    // fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  // Upcoming Events Section
  upcomingSection: {
    margin: 20,
    marginTop: 10,
    marginBottom: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  eventsList: {
    gap: 12,
    borderRadius: 12,
    
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  currentDayEventItem: {
    borderRadius: 8,
    backgroundColor: '#FEFBF2',
    borderColor: '#FAE8B5',
    borderWidth: 1,
  },
  otherEventItem: {
    backgroundColor: '#fff',
    borderWidth: 0,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    // backgroundColor: '#FEFBF2',
    borderRadius: 12,
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  eventTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  eventTypeTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  eventDateTime: {
    fontSize: 14,
    color: 'black',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
    minHeight: 80,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 80,
  },
  errorText: {
    fontSize: 14,
    color: '#F97316',
    textAlign: 'center',
  },
  // Event Types Legend Styles
  eventTypesContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTypesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  eventTypesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventTypeColumn: {
    flex: 1,
    gap: 12,
  },
  eventTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default CalendarScreen;
