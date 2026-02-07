import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput, Dimensions } from 'react-native';
import { useAppSelector } from '../../store';
import { Video, Plus, FileCheck, BookOpen, Users, MessageSquare, Clock, Calendar, MonitorPlay, Search } from 'lucide-react-native';
import CourseCard from '../../shared/components/CourseCard';
import ScheduleWebinarModal from './components/ScheduleWebinarModal';
import { useGetCoursesQuery, useGetTeacherStatsQuery } from '../../store/api';
import { useGetEventsQuery, useLazyGetEventsQuery } from '../../store/api';
import { useGetAssignmentsQuery, useLazyGetAssignmentsQuery } from '../../store/api/moodleApi';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;

const TeacherDashboardScreen = () => {
  const user = useAppSelector(state => state.user.user);
  const {
    data: coursesResponse,
    isLoading: coursesLoading,
    isFetching: coursesFetching,
    refetch: refetchCourses,
  } = useGetCoursesQuery();
  const {
    data: statsResponse,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useGetTeacherStatsQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWebinarModal, setShowWebinarModal] = useState(false);
  const [webinarForm, setWebinarForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '60',
    meetLink: '',
    courseId: '',
    sectionId: ''
  });
  const [sections, setSections] = useState([
    { id: '1', name: 'Section 1' },
    { id: '2', name: 'Section 2' },
    { id: '3', name: 'Section 3' },
  ]);

  const courses = useMemo(() => {
    const raw = coursesResponse?.courses || [];
    return raw.map((course: any) => ({
      id: course._id,
      moodleId: course.moodleId, // Add moodleId for API calls
      title: course.fullname,
      instructor: user?.name || 'Teacher',
      lessons: course.numSections || 0,
      duration: course.startDate && course.endDate
        ? `${Math.ceil((new Date(course.endDate).getTime() - new Date(course.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks`
        : 'Unknown',
      level: course.shortname?.includes('ADV') ? 'Advanced' : course.shortname?.includes('INT') ? 'Intermediate' : 'Beginner',
      tags: [course.shortname],
      status: (course.isActive ? 'in-progress' : 'not-started') as 'in-progress' | 'not-started' | 'completed' | 'Locked',
      progress: course.isActive ? Math.floor(Math.random() * 80) + 20 : 0,
      headerColor: course.isActive ? '#FF69B4' : '#9CA3AF',
    }));
  }, [coursesResponse, user?.name]);

  // Use lazy queries for dynamic data fetching
  const [getEvents] = useLazyGetEventsQuery();
  const [getAssignments] = useLazyGetAssignmentsQuery();
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Fetch events and assignments for all courses
  useEffect(() => {
    const fetchAllData = async () => {
      if (courses.length === 0) return;
      
      try {
        setEventsLoading(true);
        setAssignmentsLoading(true);
        
        // Fetch events for all courses
        const eventsPromises = courses.map((course: any) => 
          getEvents({ courseId: course.moodleId.toString() }).unwrap()
        );
        const eventsResults = await Promise.all(eventsPromises);
        const allEventsData = eventsResults.flatMap((result: any) => result.events || []);
        setAllEvents(allEventsData);
        
        // Fetch assignments for all courses
        const assignmentsPromises = courses.map((course: any) => 
          getAssignments({ 
            courseId: course.moodleId.toString(), 
            sectionNumber: '0', 
            courseIds: course.moodleId.toString(), 
            includenotenrolled: true 
          }).unwrap()
        );
        const assignmentsResults = await Promise.all(assignmentsPromises);
        console.log('Assignments API Results:', assignmentsResults);
        const allAssignmentsData = assignmentsResults.flatMap((result: any) => result.data?.courses || []);
        console.log('All Assignments Data:', allAssignmentsData);
        setAllAssignments(allAssignmentsData);
        
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setEventsLoading(false);
        setAssignmentsLoading(false);
      }
    };

    fetchAllData();
  }, [courses, getEvents, getAssignments]);
  
  const isLoading = coursesLoading || statsLoading || eventsLoading || assignmentsLoading;
  const isFetching = coursesFetching || statsFetching;

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) {
      return courses;
    }
    return courses.filter((course: any) => 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [courses, searchQuery]);

  const totalAssignments = useMemo(() => {
    return allAssignments.reduce((total: number, course: any) => {
      return total + (course.assignments?.length || 0);
    }, 0);
  }, [allAssignments]);
  const upcomingWebinars = useMemo(() => {
    const events = allEvents || [];
    const now = new Date();
    return events
      .filter((event: any) => new Date(event.start) > now) // Only future events
      .map((event: any) => ({
        id: event._id || event.id,
        title: event.title,
        date: new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        students: Math.floor(Math.random() * 50) + 10, // Placeholder until we have enrollment data
        meetLink: event.meetLink,
      }));
  }, [allEvents]);

  const stats = useMemo(() => {
    const raw = statsResponse;
    if (raw && (raw.totalCourses != null || raw.total_courses != null)) {
      return {
        totalCourses: raw.totalCourses ?? raw.total_courses ?? 0,
        activeCourses: raw.activeCourses ?? raw.active_courses ?? 0,
        totalAssignments: raw.totalAssignments ?? raw.total_assignments ?? totalAssignments,
        upcomingWebinars: upcomingWebinars.length,
        pendingGrades: raw.pendingGrades ?? raw.pending_grades ?? 0,
        unreadMessages: raw.unreadMessages ?? raw.unread_messages ?? 0,
      };
    }
    // Calculate from courses if no stats API
    const activeCoursesCount = courses.filter((c: any) => c.status === 'in-progress').length;
    return {
      totalCourses: courses.length,
      activeCourses: activeCoursesCount,
      totalAssignments: totalAssignments,
      upcomingWebinars: upcomingWebinars.length,
      pendingGrades: 0, // Will be implemented with grades API
      unreadMessages: 0, // Will be implemented with messages API
    };
  }, [statsResponse, courses, upcomingWebinars]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCourses(), 
      refetchStats()
    ]);
    // Trigger refetch of events and assignments through useEffect
    if (courses.length > 0) {
      try {
        setEventsLoading(true);
        setAssignmentsLoading(true);
        
        // Fetch events for all courses
        const eventsPromises = courses.map((course: any) => 
          getEvents({ courseId: course.moodleId.toString() }).unwrap()
        );
        const eventsResults = await Promise.all(eventsPromises);
        const allEventsData = eventsResults.flatMap((result: any) => result.events || []);
        setAllEvents(allEventsData);
        
        // Fetch assignments for all courses
        const assignmentsPromises = courses.map((course: any) => 
          getAssignments({ 
            courseId: course.moodleId.toString(), 
            sectionNumber: '0', 
            courseIds: course.moodleId.toString(), 
            includenotenrolled: true 
          }).unwrap()
        );
        const assignmentsResults = await Promise.all(assignmentsPromises);
        const allAssignmentsData = assignmentsResults.flatMap((result: any) => result.data?.courses || []);
        setAllAssignments(allAssignmentsData);
        
      } catch (error) {
        console.error('Error refreshing course data:', error);
      } finally {
        setEventsLoading(false);
        setAssignmentsLoading(false);
      }
    }
    setRefreshing(false);
  }, [refetchCourses, refetchStats, courses, getEvents, getAssignments]);

  const handleScheduleWebinar = () => {
    console.log('handleScheduleWebinar called');
    setShowWebinarModal(true);
    console.log('showWebinarModal set to true');
  };

  const handleCloseWebinarModal = () => {
    setShowWebinarModal(false);
    setWebinarForm({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '60',
      meetLink: '',
      courseId: '',
      sectionId: ''
    });
  };

  const handleCreateWebinar = () => {
    // TODO: Implement webinar creation API call
    console.log('Creating webinar:', webinarForm);
    handleCloseWebinarModal();
  };

  const handleCreateModule = () => {
    // Navigate to module creation screen
    console.log('Navigate to create module');
  };

  const handleGradeAssignments = () => {
    // Navigate to grading screen
    console.log('Navigate to grade assignments');
  };

  const renderCourseItem = useCallback(({ item }: { item: any }) => (
    <CourseCard key={item.id} course={item} />
  ), []);

  const renderAssignmentItem = useCallback(({ item }: { item: any }) => (
    <View key={item.id} style={styles.assignmentItem}>
      <View style={styles.assignmentContent}>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={styles.assignmentTitle}>{item.assignmentTitle}</Text>
      </View>
      <View style={styles.timeContainer}>
        <Clock color="#888888" size={14} />
        <Text style={styles.timeText}>{item.timeAgo}</Text>
      </View>
    </View>
  ), []);

  const renderWebinarItem = useCallback(({ item }: { item: any }) => (
    <View key={item.id} style={styles.webinarItem}>
      <View style={styles.webinarContent}>
        <Text style={styles.webinarTitle}>{item.title}</Text>
        <View style={styles.webinarDateTime}>
          <Calendar color="#888888" size={14} />
          <Text style={styles.webinarDateText}>{item.date}</Text>
          <Text style={styles.webinarTimeText}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.webinarStudentsContainer}>
        <Users color="#888888" size={14} />
        <Text style={styles.webinarStudentsText}>{item.students} Students</Text>
      </View>
    </View>
  ), []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <>
    <FlatList
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} colors={['#E56B8C']} />
      }
      data={[
        { type: 'header' },
        
        { type: 'stats' },
        { type: 'teachingHeader' },
        { type: 'courses', data: filteredCourses },
        { type: 'webinars', data: upcomingWebinars },
      ]}
      renderItem={({ item }) => {
        switch (item.type) {
          case 'header':
            return (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.scheduleButton]}
                  onPress={handleScheduleWebinar}
                >
                  <Video color="white" size={20} />
                  <Text style={styles.scheduleButtonText}>Schedule Webinar</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity 
                  style={styles.button}
                  onPress={handleCreateModule}
                >
                  <Plus color="black" size={20} />
                  <Text style={styles.buttonText}>Create Module</Text>
                </TouchableOpacity> */}
                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleGradeAssignments}
                >
                  <FileCheck color="black" size={20} />
                  <Text style={styles.buttonText}>Grade Assignments</Text>
                </TouchableOpacity>
              </View>
            );
          
          case 'stats':
            return (
              <View style={styles.statsContainer}>
                <View style={styles.card}>
                  <View>
                    <Text style={styles.cardTitle}>My Courses</Text>
                    <Text style={styles.cardValue}>{stats.totalCourses}</Text>
                  </View>
                  {/* <BookOpen color="black" size={40} /> */}
                </View>

                <View style={styles.card}>
                  <View>
                    <Text style={styles.cardTitle}>Active Courses</Text>
                    <Text style={styles.cardValue}>{stats.activeCourses}</Text>
                  </View>
                  {/* <Users color="black" size={40} /> */}
                </View>

                <View style={styles.card}>
                  <View>
                    <Text style={styles.cardTitle}>Total Assignment</Text>
                    <Text style={styles.cardValue}>{stats.totalAssignments || 0}</Text>
                  </View>
                  {/* <FileCheck color="black" size={40} /> */}
                </View>

                <View style={styles.card}>
                  <View>
                    <Text style={styles.cardTitle}>Upcoming Webinars</Text>
                    <Text style={styles.cardValue}>{stats.upcomingWebinars || 0}</Text>
                  </View>
                  {/* <MessageSquare color="black" size={40" /> */}
                </View>
              </View>
            );
          case 'teachingHeader':
            return (
              <View style={styles.teachingHeaderContainer}>
                <View style={styles.teachingHeaderTop}>
                  <View style={styles.teachingHeaderLeft}>
                    <Text style={styles.teachingHeaderTitle}>My Teaching Modules</Text>
                    <Text style={styles.moduleCountLabel}>{courses.length} modules</Text>
                  </View>
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllButtonText}>View All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                  <Search size={16} color="black" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search my modules..."
                    placeholderTextColor="black"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
            );
          case 'courses':
            return (
              <View style={styles.coursesSection}>
                <Text style={styles.sectionTitle}>
                  {searchQuery.trim() ? `Search Results (${filteredCourses.length})` : 'My Courses'}
                </Text>
                {item.data && item.data.length > 0 ? (
                  <FlatList
                    data={item.data}
                    renderItem={renderCourseItem}
                    keyExtractor={(course) => course.id}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {searchQuery.trim() ? 'No modules found matching your search' : 'No courses found'}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      {searchQuery.trim() ? 'Try adjusting your search terms' : 'Start by creating your first module'}
                    </Text>
                  </View>
                )}
              </View>
            );
          
          case 'assignments':
            return (
              <View style={styles.pendingAssignmentsSection}>
                <View style={styles.pendingAssignmentsCard}>
                  <Text style={styles.sectionTitle}>Pending Assignments</Text>
                  <View style={styles.titleDivider} />
                  <FlatList
                    data={item.data}
                    renderItem={renderAssignmentItem}
                    keyExtractor={(assignment) => assignment.id}
                    scrollEnabled={false}
                  />
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllButtonText}>View All Assignments</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          
          case 'webinars':
            return (
              <View style={styles.upcomingWebinarsSection}>
                <View style={styles.upcomingWebinarsCard}>
                  <Text style={styles.sectionTitle}>Upcoming Webinars</Text>
                  <View style={styles.titleDivider} />
                  <FlatList
                    data={item.data}
                    renderItem={renderWebinarItem}
                    keyExtractor={(webinar) => webinar.id}
                    scrollEnabled={false}
                  />
                </View>
              </View>
            );
          
          default:
            return null;
        }
      }}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    />
    
    {/* Schedule Webinar Modal */}
    <ScheduleWebinarModal
      visible={showWebinarModal}
      onClose={handleCloseWebinarModal}
      onCreate={handleCreateWebinar}
      form={webinarForm}
      setForm={setWebinarForm}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: isSmallScreen ? 14 : 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: isSmallScreen ? 0 : 20,
  },
  button: {
    width: isSmallScreen ? '68%' : isMediumScreen ? '49%' : '50%',
    padding: isSmallScreen ? 8 : 10,
    paddingHorizontal: isSmallScreen ? 12 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    marginLeft: 10,
    color: 'black',
    fontSize: isSmallScreen ? 14 : 16,
  },
  scheduleButton: {
    backgroundColor: '#E56B8C',
  },
  scheduleButtonText: {
    marginLeft: 10,
    color: 'white',
    fontSize: isSmallScreen ? 14 : 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: isSmallScreen ? 0 : 20,
  },
  card: {
    width: isSmallScreen ? '48%' : '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 11 : 13,
    color: '#888888',
  },
  cardValue: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: 'black',
  },
  coursesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  teachingHeaderContainer: {
    // backgroundColor: 'white',
    borderRadius: 12,
    // padding: 20,
    marginBottom: 20,
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  teachingHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  teachingHeaderLeft: {
    flex: 1,
  },
  teachingHeaderTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  moduleCountLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#888888',
  },
  viewAllButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewAllButtonText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: isSmallScreen ? 12 : 15,
    // paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    paddingLeft: 10,
    flex: 1,
    fontSize: isSmallScreen ? 14 : 16,
    color: 'black',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 30 : 40,
  },
  emptyStateText: {
    fontSize: isSmallScreen ? 16 : 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: isSmallScreen ? 12 : 14,
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
    padding: isSmallScreen ? 12 : 15,
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
    paddingVertical: isSmallScreen ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  assignmentContent: {
    flex: 1,
  },
  studentName: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  assignmentTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: isSmallScreen ? 10 : 12,
    color: 'black',
  },
  upcomingWebinarsSection: {
    marginTop: 20,
    paddingBottom: isSmallScreen ? 50 : 70
  },
  upcomingWebinarsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: isSmallScreen ? 12 : 15,
  },
  webinarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  webinarContent: {
    flex: 1,
  },
  webinarTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  webinarDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webinarDateText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    marginLeft: 4,
  },
  webinarTimeText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    marginLeft: 8,
  },
  webinarStudentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webinarStudentsText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    marginLeft: 4,
  },
  scheduleNewButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 15,
    borderColor:'#E0E0E0',
    borderWidth:1,
  },
  scheduleNewButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default TeacherDashboardScreen;
