import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StyledText from '../../shared/components/StyledText';
import CourseCard from '../../shared/components/CourseCard';
import CourseListItem from '../../shared/components/CourseListItem';
import { useGetCoursesQuery } from '../../store/api';
import { Course } from '../../types/course';
import { Loading, ErrorWithRetry, NoDataFound } from '../../shared/components';
import { globalStyles } from '../../utils/globalStyles';

const headerColors = ['#C27AFF', '#FDC700', '#7AB8FE', '#E56B8C', '#4ECDC4'];

function transformCourseData(apiCourse: Course) {
  const randomColor =
    headerColors[Math.floor(Math.random() * headerColors.length)];
  return {
    id: apiCourse._id,
    title: apiCourse.fullname,
    instructor: 'Instructor',
    lessons: Math.floor(Math.random() * 10) + 1,
    duration: apiCourse.startDate
      ? new Date(apiCourse.startDate).toLocaleDateString()
      : 'Ongoing',
    level: apiCourse.format === 'topics' ? 'Beginner' : 'Advanced',
    tags: [apiCourse.shortname],
    status: (apiCourse.visible ? 'in-progress' : 'Locked') as
      | 'in-progress'
      | 'Locked',
    completedDate: apiCourse.endDate
      ? `Ends ${new Date(apiCourse.endDate).toLocaleDateString()}`
      : 'Ongoing',
    progress: apiCourse.visible ? Math.floor(Math.random() * 80) + 20 : 0,
    headerColor: randomColor,
    moodleId: apiCourse.moodleId,
  };
}

const DashboardScreen = () => {
  const [isCardView, setIsCardView] = useState(true);
  const [selectedTab, setSelectedTab] = useState('All Modules');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: coursesResponse,
    isLoading: loading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useGetCoursesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const courses = useMemo(() => {
    const raw = coursesResponse?.courses ?? coursesResponse?.courses;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((c: Course) => transformCourseData(c));
  }, [coursesResponse]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    if (selectedTab === 'In Progress') {
      filtered = filtered.filter(course => course.status === 'in-progress');
    } else if (selectedTab === 'Completed') {
      filtered = filtered.filter(
        course => (course as { status: string }).status === 'completed',
      );
    } else if (selectedTab === 'Upcoming Events') {
      filtered = filtered.filter(
        course => course.status === 'Locked' || course.progress === 0,
      );
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course =>
          course.title.toLowerCase().includes(q) ||
          course.instructor.toLowerCase().includes(q) ||
          course.tags.some((tag: string) => tag.toLowerCase().includes(q)) ||
          course.level.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [courses, searchQuery, selectedTab]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const tabs = ['All Modules', 'In Progress', 'Completed', 'Upcoming Events'];
  const milestones = [
    { title: 'Getting Started', subtitle: 'First Module', completed: true },
    { title: 'Foundation', subtitle: '2 Modules', completed: true },
    {
      title: 'Intermediate',
      subtitle: '4 Modules',
      completed: false,
      number: '4',
    },
    { title: 'Advanced', subtitle: '5 Modules', completed: false, number: '5' },
    {
      title: 'Mastery',
      subtitle: 'All Complete',
      completed: false,
      number: '6',
    },
  ];
  const completedCount = milestones.filter(m => m.completed).length;

  if (loading) {
    return <Loading isLoading={loading} overlay={false} />;
  }

  if (isError) {
    return (
      <ErrorWithRetry
        message={(queryError as any)?.message ?? 'Failed to load courses'}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={globalStyles.scrollContentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || isFetching}
          onRefresh={onRefresh}
          colors={['#E56B8C']}
        />
      }
    >
      <View style={styles.learningJourneyContainer}>
        <View style={styles.header}>
          <StyledText style={styles.title}>Learning Journey</StyledText>
          <StyledText style={styles.progress}>
            {completedCount}/6 Milestones
          </StyledText>
        </View>

        {milestones?.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesScrollContainer}
          >
            {milestones?.map((milestone, index) => (
              <View key={index} style={styles.milestoneWrapper}>
                <View style={styles.milestoneContent}>
                  <View
                    style={[
                      styles.circle,

                      milestone.completed
                        ? styles.completedCircle
                        : styles.pendingCircle,
                    ]}
                  >
                    {milestone.completed ? (
                      <View style={styles.checkmark}>
                        <Icon name="emoji-events" size={16} color="#fff" />
                      </View>
                    ) : (
                      <StyledText style={styles.numberText}>
                        {milestone.number}
                      </StyledText>
                    )}
                  </View>
                  <StyledText
                    style={[
                      styles.milestoneTitle,
                      milestone.completed
                        ? styles.completedText
                        : styles.pendingText,
                    ]}
                  >
                    {milestone.title}
                  </StyledText>
                  <StyledText style={styles.milestoneSubtitle}>
                    {milestone.subtitle}
                  </StyledText>
                </View>

                {index < milestones.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      milestone.completed
                        ? styles.completedConnector
                        : styles.pendingConnector,
                    ]}
                  />
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <NoDataFound
            icon={<Icon name="emoji-events" size={48} color="#ccc" />}
            message="No milestones found"
            onAction={onRefresh}
          />
        )}
      </View>

      <View style={styles.moduleNavigationContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <StyledText style={styles.dropdownText}>{selectedTab}</StyledText>
          <Icon
            name={showDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownContainer}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.dropdownItem,
                  selectedTab === tab && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setSelectedTab(tab);
                  setShowDropdown(false);
                }}
              >
                <StyledText
                  style={[
                    styles.dropdownItemText,
                    selectedTab === tab && styles.dropdownItemTextSelected,
                  ]}
                >
                  {tab}
                </StyledText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.moduleControls}>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[styles.toggleButton, isCardView && styles.activeToggle]}
              onPress={() => setIsCardView(true)}
            >
              <Icon
                name="grid-view"
                size={20}
                color={isCardView ? '#fff' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isCardView && styles.activeToggle]}
              onPress={() => setIsCardView(false)}
            >
              <Icon
                name="view-list"
                size={20}
                color={!isCardView ? '#fff' : '#666'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.searchAndModuleContainer}>
            <StyledText style={styles.moduleCount}>
              {filteredCourses.length} modules
            </StyledText>
            <View style={styles.searchBar}>
              <Icon
                name="search"
                size={16}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search modules ..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.coursesContainer}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => {
            const cardCourse = {
              ...course,
              status: course.status as
                | 'in-progress'
                | 'Locked'
                | 'completed'
                | 'not-started',
            };
            const listCourse = {
              ...course,
              status: (course.status === 'Locked'
                ? 'not-started'
                : course.status) as 'in-progress' | 'completed' | 'not-started',
            };
            return isCardView ? (
              <CourseCard key={course.id} course={cardCourse} />
            ) : (
              <CourseListItem key={course.id} course={listCourse} />
            );
          })
        ) : (
          <NoDataFound
            icon={<Icon name="school" size={48} color="#ccc" />}
            message={
              searchQuery
                ? `No courses found matching "${searchQuery}" in ${selectedTab.toLowerCase()}`
                : `No courses in ${selectedTab.toLowerCase()}`
            }
            onAction={onRefresh}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F8F9FA',
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
  learningJourneyContainer: {
    // backgroundColor: '#f8f9fa',
    // borderRadius: 12,
    // padding: 20,
    // marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  progress: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  milestonesScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  milestoneWrapper: {
    alignItems: 'center',
    position: 'relative',
    minWidth: 100,
    marginRight: 20,
  },
  milestoneContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedCircle: {
    backgroundColor: '#E56B8C',
  },
  pendingCircle: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  completedText: {
    color: '#1a1a1a',
  },
  pendingText: {
    color: '#999',
  },
  milestoneSubtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  connector: {
    position: 'absolute',
    height: 2,
    top: 20,
    left: '50%',
    right: '-50%',
    zIndex: 1,
  },
  completedConnector: {
    backgroundColor: '#E56B8C',
  },
  pendingConnector: {
    backgroundColor: '#ddd',
  },
  moduleNavigationContainer: {
    marginTop: 30,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E56B8C',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#fff',
  },
  moduleControls: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  searchAndModuleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    justifyContent: 'space-between',
    width: '100%',
  },
  moduleCount: {
    fontSize: 14,
    color: 'black',
    fontWeight: '500',
  },
  searchAndToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
  },
  searchBar: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderColor: '#E0E7E9',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    width: 200,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    fontSize: 14,
    color: 'black',
    flex: 1,
  },
  toggleButtons: {
    flexDirection: 'row',
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeToggle: {
    backgroundColor: '#E56B8C',
  },
  coursesContainer: {
    marginTop: 20,
  },
});

export default DashboardScreen;
