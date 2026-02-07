import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Dimensions } from 'react-native';
import { useAppSelector } from '../../store';
import { BookOpen, Search } from 'lucide-react-native';
import CourseCard from '../../shared/components/CourseCard';
import { useGetCoursesQuery } from '../../store/api';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const TeacherCoursesScreen = () => {
  const user = useAppSelector(state => state.user.user);
  const {
    data: coursesResponse,
    isLoading: coursesLoading,
    isFetching: coursesFetching,
    refetch: refetchCourses,
  } = useGetCoursesQuery();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const courses = React.useMemo(() => {
    const raw = (coursesResponse as any)?.courses ?? coursesResponse?.courses;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((course: any) => ({
      id: course._id,
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

  const filteredCourses = React.useMemo(() => {
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchCourses();
    setRefreshing(false);
  }, [refetchCourses]);

  const data = React.useMemo(() => [
    { type: 'stats' },
    { type: 'search' },
    ...filteredCourses.map(course => ({ type: 'course', data: course }))
  ], [filteredCourses]);

  const renderStatsItem = React.useCallback(() => (
    <View style={styles.statsContainer}>
      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>My Courses</Text>
          <Text style={styles.cardValue}>{courses.length}</Text>
        </View>
        {/* <BookOpen color="black" size={40} /> */}
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Active Courses</Text>
          <Text style={styles.cardValue}>{courses.filter(c => c.status === 'in-progress').length}</Text>
        </View>
        {/* <Users color="black" size={40} /> */}
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Total Sections</Text>
          <Text style={styles.cardValue}>0</Text>
        </View>
        {/* <FileCheck color="black" size={40" /> */}
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Students</Text>
          <Text style={styles.cardValue}>0</Text>
        </View>
        {/* <MessageSquare color="black" size={40" /> */}
      </View>
    </View>
  ), [courses]);

  const renderSearchItem = React.useCallback(() => (
    <View style={styles.searchSection}>
      <Text style={styles.sectionTitle}>Course Management</Text>
      <View style={styles.searchContainer}>
        <Search size={16} color="black" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor="black"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  ), [searchQuery, setSearchQuery]);

  const renderCourseItem = React.useCallback(({ item }: { item: any }) => (
    <CourseCard key={item.id} course={item} />
  ), []);

  const renderItem = React.useCallback(({ item }: { item: any }) => {
    switch (item.type) {
      case 'stats':
        return renderStatsItem();
      case 'search':
        return renderSearchItem();
      case 'course':
        return renderCourseItem({ item: item.data });
      default:
        return null;
    }
  }, [renderStatsItem, renderSearchItem, renderCourseItem]);

  if (coursesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.coursesList}
        refreshControl={
          <RefreshControl refreshing={refreshing || coursesFetching} onRefresh={onRefresh} colors={['#E56B8C']} />
        }
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${item.data?.id || index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: isSmallScreen ? 15 : 20 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() ? 'No courses found matching your search' : 'No courses found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery.trim() ? 'Try adjusting your search terms' : 'Start by creating your first course'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? 0 : 20,
    paddingVertical: 20,
    gap: isSmallScreen ? 10 : 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: isSmallScreen ? 15 : 20,
    width: isSmallScreen ? '47%' : '23%',
    minHeight: isSmallScreen ? 60 : 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchSection: {
    paddingHorizontal: isSmallScreen ? 0 : 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? 15 : 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: isSmallScreen ? 12 : 15,
    // paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    paddingLeft: 10,
    flex: 1,
    fontSize: isSmallScreen ? 14 : 16,
    color: 'black',
  },
  coursesList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: isSmallScreen ? 14 : 16,
    color: '#666',
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default TeacherCoursesScreen;
