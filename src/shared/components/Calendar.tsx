import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, Plus } from 'lucide-react-native';
import StyledText from './StyledText';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  icon: any;
  color: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  userType?: 'student' | 'teacher';
  title?: string;
  subtitle?: string;
  onAddEvent?: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  userType = 'student',
  title = 'Calendar',
  subtitle = 'Manage your schedule and upcoming events',
  onAddEvent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Filter events for the current day
  const getCurrentDayEvents = () => {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return events.filter(event => {
      // Extract date part and compare with today
      const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return eventDate === todayString;
    });
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

      // Dates with events - this would be dynamic based on events prop
      const hasEvent = [23, 24, 26, 28, 30].includes(day);

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

  const renderEventItem = (event: CalendarEvent) => {
    const IconComponent = event.icon;
    return (
      <View key={event.id} style={styles.eventItem}>
        <View style={[styles.iconContainer, { backgroundColor: event.color }]}>
          <IconComponent size={20} color="#fff" />
        </View>
        <View style={styles.eventContent}>
          <StyledText style={styles.eventTitle}>{event.title}</StyledText>
          <StyledText style={styles.eventDateTime}>{event.date} • {event.time}</StyledText>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <StyledText style={styles.title}>Calendar</StyledText>
          <StyledText style={styles.subtitle}>{subtitle}</StyledText>
        </View>
        {onAddEvent && (
          <TouchableOpacity style={styles.addButton} onPress={onAddEvent}>
            <Plus size={20} color="#fff" />
            <StyledText style={styles.addButtonText}>Add Event</StyledText>
          </TouchableOpacity>
        )}
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
          <CalendarIcon size={20} color="black" />
          <StyledText style={styles.currentDayTitle}>{formatDate(new Date())}</StyledText>
        </View>
        {getCurrentDayEvents().length > 0 ? (
          <View style={styles.eventsList}>
            {getCurrentDayEvents().map(renderEventItem)}
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <CalendarIcon size={48} color="#ccc" />
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
        <View style={styles.eventsList}>
          {events.map(renderEventItem)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
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
  currentDaySection: {
    margin: 20,
    marginTop: 10,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 12,
    textAlign: 'center',
  },
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
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  eventDateTime: {
    fontSize: 14,
    color: '#666',
  },
});

export default Calendar;
