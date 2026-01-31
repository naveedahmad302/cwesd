import React, { useState } from 'react';
import { Users, Book, Video, FileText, GraduationCap } from 'lucide-react-native';
import Calendar from '../../shared/components/Calendar';
import AddEventModal from './components/AddEventModal';

interface EventData {
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  description: string;
  module: string;
  location: string;
}

const TeacherCalendarScreen = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Business Strategy Lecture',
      date: 'Tomorrow',
      time: '9:00 AM - 10:30 AM',
      icon: GraduationCap,
      color: '#E56B8C'
    },
    {
      id: '2',
      title: 'Student Project Reviews',
      date: 'Jan 27',
      time: '2:00 PM - 4:00 PM',
      icon: Users,
      color: '#8B5CF6'
    },
    {
      id: '3',
      title: 'Faculty Meeting',
      date: 'Jan 29',
      time: '3:00 PM - 4:30 PM',
      icon: Users,
      color: '#F97316'
    },
    {
      id: '4',
      title: 'Guest Speaker Session',
      date: 'Jan 31',
      time: '1:00 PM - 2:30 PM',
      icon: Video,
      color: '#10B981'
    },
    {
      id: '5',
      title: 'Grade Submissions Due',
      date: 'Feb 2, 2026',
      time: '5:00 PM',
      icon: FileText,
      color: '#F97316'
    }
  ]);

  const handleAddEvent = () => {
    setShowAddModal(true);
  };

  const handleAddEventSubmit = (eventData: EventData) => {
    const newEvent = {
      id: Date.now().toString(),
      title: eventData.title,
      date: 'Today',
      time: `${eventData.startTime} - ${eventData.endTime}`,
      icon: GraduationCap,
      color: '#E56B8C'
    };
    setEvents([newEvent, ...events]);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  return (
    <>
      <Calendar
        events={events}
        userType="teacher"
        title="Teacher Calendar"
        subtitle="Manage your teaching schedule and appointments"
        onAddEvent={handleAddEvent}
      />
      <AddEventModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onAddEvent={handleAddEventSubmit}
      />
    </>
  );
};

export default TeacherCalendarScreen;
