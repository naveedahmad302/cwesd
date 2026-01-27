import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import { BookOpen, Activity, CheckCircle, Clock } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CourseCard from '../../shared/components/CourseCard';
import { coursesAPI } from '../../services/api';
import { Course, CoursesResponse } from '../../types/course';

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

const CourseContentScreen: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCardView, setIsCardView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Transform API course data to match component interface
  const transformCourseData = (apiCourse: Course) => {
    const headerColors = ['#C27AFF', '#FDC700', '#7AB8FE', '#E56B8C', '#4ECDC4'];
    const randomColor = headerColors[Math.floor(Math.random() * headerColors.length)];
    
    return {
      id: apiCourse._id,
      title: apiCourse.fullname,
      instructor: 'Instructor', // API doesn't provide instructor info
      lessons: Math.floor(Math.random() * 10) + 1, // Random lessons since not in API
      duration: apiCourse.startDate ? new Date(apiCourse.startDate).toLocaleDateString() : 'Ongoing',
      level: apiCourse.format === 'topics' ? 'Beginner' : 'Advanced',
      tags: [apiCourse.shortname],
      status: apiCourse.visible ? 'in-progress' as const : 'Locked' as const,
      completedDate: apiCourse.endDate ? `Ends ${new Date(apiCourse.endDate).toLocaleDateString()}` : 'Ongoing',
      progress: apiCourse.visible ? Math.floor(Math.random() * 80) + 20 : 0,
      headerColor: randomColor,
      moodleId: apiCourse.moodleId, // Include moodleId from API
    };
  };

  // Filter courses based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        course.level.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [courses, searchQuery]);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getCourses();
        if (response.data.success) {
          const transformedCourses = response.data.courses.map(transformCourseData);
          setCourses(transformedCourses);
          setFilteredCourses(transformedCourses);
        } else {
          setError('Failed to load courses');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Calculate course statistics
  const enrolledCount = courses.length;
  const activeCount = courses.filter(course => course.status === 'in-progress').length;
  const completedCount = courses.filter(course => course.status === 'completed').length;
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#E56B8C" />
        <StyledText style={styles.errorText}>{error}</StyledText>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
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
