import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth';
import { Video, Plus, FileCheck, BookOpen, Users, MessageSquare, Clock, Calendar, MonitorPlay } from 'lucide-react-native';
import CourseCard from '../../shared/components/CourseCard';
import { apiClient, coursesAPI } from '../../services/api';

const TeacherDashboardScreen = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    pendingGrades: 0,
    unreadMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch teacher's courses
      let coursesData = [];
      try {
        const coursesResponse = await coursesAPI.getCourses();
        if (coursesResponse.data.success && coursesResponse.data.courses) {
          coursesData = coursesResponse.data.courses.map((course: any) => ({
            id: course._id,
            title: course.fullname,
            instructor: user?.name || 'Teacher',
            lessons: course.numSections || 0,
            duration: course.startDate && course.endDate ? 
              `${Math.ceil((new Date(course.endDate).getTime() - new Date(course.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks` : 
              'Unknown',
            level: course.shortname.includes('ADV') ? 'Advanced' : 
                   course.shortname.includes('INT') ? 'Intermediate' : 'Beginner',
            tags: [course.shortname],
            status: course.isActive ? 'in-progress' : 'not-started',
            progress: course.isActive ? Math.floor(Math.random() * 80) + 20 : 0,
            headerColor: course.isActive ? '#FF69B4' : '#9CA3AF',
          }));
        }
      } catch (coursesError) {
        console.log('Courses API not available, using fallback data');
        // Fallback sample data
        coursesData = [
          {
            id: '1',
            title: 'Introduction to React Native',
            instructor: user?.name || 'Teacher',
            lessons: 12,
            duration: '6 weeks',
            level: 'Intermediate',
            tags: ['Mobile Development', 'React'],
            status: 'in-progress' as const,
            progress: 75,
            headerColor: '#FF69B4',
          },
          {
            id: '2',
            title: 'Advanced JavaScript Concepts',
            instructor: user?.name || 'Teacher',
            lessons: 15,
            duration: '8 weeks',
            level: 'Advanced',
            tags: ['JavaScript', 'Programming'],
            status: 'in-progress' as const,
            progress: 60,
            headerColor: '#8B5CF6',
          },
        ];
      }
      setCourses(coursesData);

      // Fetch teacher statistics
      let statsData = {
        totalCourses: 0,
        activeCourses: 0,
        pendingGrades: 0,
        unreadMessages: 0
      };
      
      try {
        const statsResponse = await apiClient.get('/api/teacher/stats');
        statsData = {
          totalCourses: statsResponse.data.total_courses || 0,
          activeCourses: statsResponse.data.active_courses || 0,
          pendingGrades: statsResponse.data.pending_grades || 0,
          unreadMessages: statsResponse.data.unread_messages || 0
        };
      } catch (statsError) {
        console.log('Stats API not available, using fallback data');
        // Fallback stats based on courses data
        statsData = {
          totalCourses: coursesData.length,
          activeCourses: coursesData.filter((c: any) => c.status === 'in-progress').length,
          pendingGrades: 12,
          unreadMessages: 8
        };
      }
      
      setStats(statsData);

    } catch (error) {
      console.error('Error fetching teacher data:', error);
      // Set fallback data if API fails
      setStats({
        totalCourses: 0,
        activeCourses: 0,
        pendingGrades: 0,
        unreadMessages: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleWebinar = () => {
    // Navigate to webinar scheduling screen
    console.log('Navigate to schedule webinar');
  };

  const handleCreateModule = () => {
    // Navigate to module creation screen
    console.log('Navigate to create module');
  };

  const handleGradeAssignments = () => {
    // Navigate to grading screen
    console.log('Navigate to grade assignments');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.scheduleButton]}
          onPress={handleScheduleWebinar}
        >
          <Video color="white" size={20} />
          <Text style={styles.scheduleButtonText}>Schedule Webinar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleCreateModule}
        >
          <Plus color="black" size={20} />
          <Text style={styles.buttonText}>Create Module</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGradeAssignments}
        >
          <FileCheck color="black" size={20} />
          <Text style={styles.buttonText}>Grade Assignments</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>My Courses</Text>
          <Text style={styles.cardValue}>{stats.totalCourses}</Text>
        </View>
        <BookOpen color="black" size={40} />
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Active Courses</Text>
          <Text style={styles.cardValue}>{stats.activeCourses}</Text>
        </View>
        <Users color="black" size={40} />
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Pending Grades</Text>
          <Text style={styles.cardValue}>{stats.pendingGrades}</Text>
        </View>
        <FileCheck color="black" size={40} />
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Unread Messages</Text>
          <Text style={styles.cardValue}>{stats.unreadMessages}</Text>
        </View>
        <MessageSquare color="black" size={40} />
      </View>

      <View style={styles.coursesSection}>
        <Text style={styles.sectionTitle}>My Courses</Text>
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No courses found</Text>
            <Text style={styles.emptyStateSubtext}>Start by creating your first module</Text>
          </View>
        )}
      </View>

      <View style={styles.pendingAssignmentsSection}>
        <View style={styles.pendingAssignmentsCard}>
          <Text style={styles.sectionTitle}>Pending Assignments</Text>
          <View style={styles.titleDivider} />
          {[
            { id: '1', studentName: 'Sarah Johnson', assignmentTitle: 'Business Model Canvas', timeAgo: '2 hours ago' },
            { id: '2', studentName: 'Emily Davis', assignmentTitle: 'Market Research', timeAgo: '5 hours ago' },
            { id: '3', studentName: 'Maria Garcia', assignmentTitle: 'Business Model Canvas', timeAgo: '1 day ago' },
          ].map((assignment) => (
            <View key={assignment.id} style={styles.assignmentItem}>
              <View style={styles.assignmentContent}>
                <Text style={styles.studentName}>{assignment.studentName}</Text>
                <Text style={styles.assignmentTitle}>{assignment.assignmentTitle}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock color="#888888" size={14} />
                <Text style={styles.timeText}>{assignment.timeAgo}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllButtonText}>View All Assignments</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.upcomingWebinarsSection}>
        <View style={styles.upcomingWebinarsCard}>
        <Text style={styles.sectionTitle}>Upcoming Webinars</Text>
        <View style={styles.titleDivider} />
          {[
            { id: '1', title: 'React Native Advanced', date: '28 Jan', time: '2:00 PM', students: 45 },
            { id: '2', title: 'JavaScript Best Practices', date: '30 Jan', time: '3:00 PM', students: 32 },
            { id: '3', title: 'Mobile App Design', date: '2 Feb', time: '4:00 PM', students: 28 },
          ].map((webinar) => (
            <View key={webinar.id} style={styles.webinarItem}>
              <View style={styles.webinarContent}>
                <Text style={styles.webinarTitle}>{webinar.title}</Text>
                <View style={styles.webinarDateTime}>
                  <Calendar color="#888888" size={14} />
                  <Text style={styles.webinarDateText}>{webinar.date}</Text>
                  <Text style={styles.webinarTimeText}>{webinar.time}</Text>
                </View>
              </View>
              <View style={styles.webinarStudentsContainer}>
                <MonitorPlay color="#888888" size={14} />
                <Text style={styles.webinarStudentsText}>{webinar.students} Students</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.scheduleNewButton}>
            <Text style={styles.scheduleNewButtonText}>Schedule New Webinar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    width: '55%',
    padding: 10,  
    paddingHorizontal:15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scheduleButton: {
    backgroundColor: '#E56B8C',
    borderColor: '#E56B8C',
  },
  buttonText: {
    marginLeft: 10,
    color: 'black',
    fontSize: 16,
  },
  scheduleButtonText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
  },
  card: {
    padding: 25,
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    color: '#888888',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  coursesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  pendingAssignmentsSection: {
    marginTop: 20,
  },
  pendingAssignmentsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
  },
  titleDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
    width: '100%',
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius:12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 10,
  },
  assignmentContent: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 14,
    color: 'black',
  },
  timeContainer: {
    backgroundColor:'#F0F0FF',
    paddingHorizontal:8,
    paddingVertical:4,
    borderRadius:12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: 'black',
  },
  viewAllButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 15,
    borderColor:'#E0E0E0',
    borderWidth:1
  },
  viewAllButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  upcomingWebinarsSection: {
    marginTop: 20,
    paddingBottom:70
  },
  upcomingWebinarsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
  },
  webinarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius:12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 10,
  },
  webinarContent: {
    flex: 1,
  },
  webinarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  webinarDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webinarDateText: {
    fontSize: 14,
    color: 'black',
  },
  webinarTimeText: {
    fontSize: 14,
    color: 'black',
    marginLeft: 8,
  },
  webinarStudentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor:'#F0F0FF',
    paddingHorizontal:8,
    paddingVertical:4,
    borderRadius:12,
  },
  webinarStudentsText: {
    fontSize: 12,
    color: 'black',
  },
  scheduleNewButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 15,
    borderColor:'#E0E0E0',
    borderWidth:1
  },
  scheduleNewButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherDashboardScreen;
