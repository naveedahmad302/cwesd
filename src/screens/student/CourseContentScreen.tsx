import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import { BookOpen, Activity, CheckCircle, Clock } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CourseCard from '../../shared/components/CourseCard';
import { useGetCoursesQuery } from '../../store/api';
import { Course } from '../../types/course';

interface CourseStatsCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
}


const CourseStatsCard: React.FC<CourseStatsCardProps> = ({ title, count, icon }) => {
  return (
    <View style={styles.card}>
      <View>
        <StyledText style={styles.cardTitle}>{title}</StyledText>
        <StyledText style={styles.cardCount}>{count}</StyledText>
      </View>
      {icon}
    </View>
  );
};

const headerColors = ['#C27AFF', '#FDC700', '#7AB8FE', '#E56B8C', '#4ECDC4'];

function transformCourseData(apiCourse: Course) {
  const randomColor = headerColors[Math.floor(Math.random() * headerColors.length)];
  return {
    id: apiCourse._id,
    title: apiCourse.fullname,
    instructor: 'Instructor',
    lessons: Math.floor(Math.random() * 10) + 1,
    duration: apiCourse.startDate ? new Date(apiCourse.startDate).toLocaleDateString() : 'Ongoing',
    level: apiCourse.format === 'topics' ? 'Beginner' : 'Advanced',
    tags: [apiCourse.shortname],
    status: (apiCourse.visible ? 'in-progress' : 'Locked') as 'in-progress' | 'Locked',
    completedDate: apiCourse.endDate ? `Ends ${new Date(apiCourse.endDate).toLocaleDateString()}` : 'Ongoing',
    progress: apiCourse.visible ? Math.floor(Math.random() * 80) + 20 : 0,
    headerColor: randomColor,
    moodleId: apiCourse.moodleId,
  };
}

const CourseContentScreen: React.FC = () => {
  const [isCardView, setIsCardView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: coursesResponse,
    isLoading: loading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useGetCoursesQuery();

  const courses = useMemo(() => {
    const raw = (coursesResponse as any)?.courses ?? coursesResponse?.courses;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((c: Course) => transformCourseData(c));
  }, [coursesResponse]);

  const filteredCourses = useMemo(() => {
    if (searchQuery.trim() === '') return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(course =>
      course.title.toLowerCase().includes(q) ||
      course.instructor.toLowerCase().includes(q) ||
      course.tags.some((tag: string) => tag.toLowerCase().includes(q)) ||
      course.level.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const errorMessage = isError && queryError
    ? (queryError as { data?: { message?: string }; message?: string })?.data?.message ?? (queryError as { message?: string })?.message ?? 'Failed to load courses'
    : null;

  const enrolledCount = courses.length;
  const activeCount = courses.filter(course => course.status === 'in-progress').length;
  const completedCount = courses.filter(course => (course as { status: string }).status === 'completed').length;
  const inProgressCount = courses.filter(course => course.status === 'in-progress').length;

  const courseStats = [
    {
      title: 'Enrolled Courses',
      count: enrolledCount,
      icon: <BookOpen size={24} color="#333" />,
    },
    {
      title: 'Active Courses',
      count: activeCount,
      icon: <Activity size={24} color="#333" />,
    },
    {
      title: 'Completed',
      count: completedCount,
      icon: <CheckCircle size={24} color="#333" />,
    },
    {
      title: 'In Progress',
      count: inProgressCount,
      icon: <Clock size={24} color="#333" />,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FFCC" />
        <StyledText style={styles.loadingText}>Loading courses...</StyledText>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#E56B8C" />
        <StyledText style={styles.errorText}>{errorMessage}</StyledText>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <StyledText style={styles.retryText}>Retry</StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} colors={['#E56B8C']} />
      }
    >
      {/* Course Statistics Cards */}
      <View style={styles.statsSection}>
        <StyledText style={styles.sectionTitle}>Course Overview</StyledText>
        {courseStats.map((stat, index) => (
          <CourseStatsCard
            key={index}
            title={stat.title}
            count={stat.count}
            icon={stat.icon}
          />
        ))}
      </View>

      {/* Search and View Toggle */}
      <View style={styles.controlsSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses ..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.toggleButtons}>
          <TouchableOpacity 
            style={[styles.toggleButton, isCardView && styles.activeToggle]}
            onPress={() => setIsCardView(true)}
          >
            <Icon name="grid-view" size={20} color={isCardView ? '#fff' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, !isCardView && styles.activeToggle]}
            onPress={() => setIsCardView(false)}
          >
            <Icon name="view-list" size={20} color={!isCardView ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Course Cards */}
      <View style={styles.coursesSection}>
        <StyledText style={styles.sectionTitle}>All Courses ({filteredCourses.length})</StyledText>
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <View style={styles.noCoursesContainer}>
            <Icon name="school" size={48} color="#ccc" />
            <StyledText style={styles.noCoursesText}>
              {searchQuery ? 'No courses found matching your search' : 'No courses available'}
            </StyledText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', 
  },
  contentContainer: {
    padding: 16,
    gap: 24, // Space between sections
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E56B8C',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#E56B8C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Section Styles
  statsSection: {
    gap: 16,
  },
  controlsSection: {
    gap: 16,
  },
  coursesSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  // Stats Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3, // For Android shadow
  },
  cardTitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  // Search and Controls
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#333',
  },
  // Course Cards Section
  noCoursesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCoursesText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default CourseContentScreen;
