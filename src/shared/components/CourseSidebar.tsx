import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import StyledText from './StyledText';
import { X, BookOpen, FileText, Video, Users, MessageSquare } from 'lucide-react-native';
import { useGetQuizzesQuery, useLazyGetCourseSectionsQuery } from '../../store/api';
import ContentCard, { ContentItem } from './ContentCard';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  modname: string;
  course: {
    _id: string;
    moodleId: number;
    fullname: string;
    shortname: string;
    idnumber: string;
    categoryId: number;
    visible: boolean;
    startDate: string;
    summary: string;
    summaryFormat: number;
    format: string;
    numSections: number;
    isActive: boolean;
    enrolledCohorts: string[];
    enrolledUsers: string[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  sectionNumber: number;
  createdBy: string;
  visible: number;
  availableFrom: string;
  availableUntil: string;
  maxAttempts: number;
  defaultPointsPerQuestion: number;
  durationMinutes: number;
  totalPoints: number;
  submittedBy: Array<{
    id: string;
    marksObtained: number;
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Assignment {
  id: number;
  name: string;
  modname: string;
  instance: number;
  visible: number;
  url: string;
  indent: number;
}

interface CourseSection {
  sectionNumber: number;
  name: string;
  summary: string | null;
  visible: number;
  moduleCount: number;
  modules: Assignment[];
}

interface CourseSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onQuizClick?: (quiz: Quiz) => void;
  onAssignmentClick?: (assignment: Assignment) => void;
  onLectureClick?: (lecture: Assignment) => void;
  courseId?: string;
  moodleId?: string;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ 
  isVisible, 
  onClose, 
  onQuizClick, 
  onAssignmentClick, 
  onLectureClick,
  courseId,
  moodleId
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<Assignment[]>([]);
  const { data: quizzesResponse, isLoading: loadingQuizzes } = useGetQuizzesQuery(undefined, { skip: !courseId });
  const [getCourseSections, { isLoading: loadingAssignments }] = useLazyGetCourseSectionsQuery();

  const quizzes = useMemo(() => {
    if (!courseId || !quizzesResponse) return [];
    const raw = (quizzesResponse as any)?.data ?? quizzesResponse?.data ?? quizzesResponse?.quizzes ?? quizzesResponse;
    const quizData = Array.isArray(raw) ? raw : [];
    return quizData.filter((quiz: any) => {
      const matchesCourseId = quiz.course && quiz.course._id === courseId;
      const matchesMoodleId = quiz.course && quiz.course.moodleId === parseInt(moodleId || '0', 10);
      return matchesCourseId || matchesMoodleId;
    });
  }, [courseId, moodleId, quizzesResponse]);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isQuizSubmitted = (quiz: Quiz) => {
    // Check if the current user has submitted this quiz
    // For now, we'll check if there are any submissions in the submittedBy array
    // In a real implementation, you'd check against the current user ID
    const hasSubmissions = quiz.submittedBy && Array.isArray(quiz.submittedBy) && quiz.submittedBy.length > 0;
    console.log(`Quiz ${quiz.title} submission check:`, {
      submittedBy: quiz.submittedBy,
      hasSubmissions: hasSubmissions,
      submissionCount: quiz.submittedBy ? quiz.submittedBy.length : 0
    });
    return hasSubmissions;
  };

  // Calculate quiz submission stats
  const quizStats = {
    total: quizzes.length,
    submitted: quizzes.filter(quiz => isQuizSubmitted(quiz)).length,
    notSubmitted: quizzes.filter(quiz => !isQuizSubmitted(quiz)).length
  };

  const fetchCourseContent = useCallback(async () => {
    if (!moodleId) return;
    try {
      const result = await getCourseSections(moodleId).unwrap();
      if (result.success && result.data?.sections) {
        const sections = result.data.sections;
        const allAssignments: Assignment[] = [];
        const allLectures: Assignment[] = [];
        sections.forEach((section: CourseSection) => {
          section.modules.forEach((module: Assignment) => {
            if (module.modname === 'assign') allAssignments.push(module);
            else if (module.modname === 'resource') allLectures.push(module);
          });
        });
        setAssignments(allAssignments);
        setLectures(allLectures);
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
    }
  }, [moodleId, getCourseSections]);

  useEffect(() => {
    if (isVisible && (courseId || moodleId)) {
      fetchCourseContent();
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -400,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, courseId, moodleId, slideAnim, fadeAnim, fetchCourseContent]);

  const handleQuizPress = (quiz: Quiz) => {
    if (onQuizClick) {
      onQuizClick(quiz);
    }
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    if (onAssignmentClick) {
      onAssignmentClick(assignment);
    }
  };

  const handleLecturePress = (lecture: Assignment) => {
    if (onLectureClick) {
      onLectureClick(lecture);
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View 
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <StyledText style={styles.sidebarTitle}>Course Content</StyledText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Sidebar Items */}
        <ScrollView 
          style={styles.sidebarContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Lectures Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Lectures</StyledText>
            </View>
            {loadingAssignments ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#007AFF" />
                <StyledText style={styles.loadingText}>Loading lectures...</StyledText>
              </View>
            ) : lectures.length > 0 ? (
              lectures.map((lecture) => {
                const contentItem: ContentItem = {
                  id: lecture.id.toString(),
                  title: lecture.name,
                  subtitle: 'Lecture',
                  type: 'lecture',
                  isCompleted: false, // You might want to track completion status
                  onPress: () => handleLecturePress(lecture),
                };
                return <ContentCard key={lecture.id} item={contentItem} />;
              })
            ) : (
              <View style={styles.emptyContent}>
                <Video size={24} color="#C7C7CC" />
                <StyledText style={styles.emptyText}>No lectures available</StyledText>
              </View>
            )}
          </View>

          {/* Quizzes Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#8E8E93" />
              <View style={styles.sectionTitleContainer}>
                <StyledText style={styles.sectionTitle}>Quizzes</StyledText>
                {quizStats.total > 0 && (
                  <StyledText style={styles.quizCounter}>
                    {quizStats.submitted}/{quizStats.total}
                  </StyledText>
                )}
              </View>
            </View>
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => {
                const contentItem: ContentItem = {
                  id: quiz._id,
                  title: quiz.title,
                  subtitle: `Quiz • ${quiz.totalPoints} points`,
                  type: 'quiz',
                  isCompleted: isQuizSubmitted(quiz),
                  points: quiz.totalPoints,
                  duration: quiz.durationMinutes,
                  onPress: () => handleQuizPress(quiz),
                };
                return <ContentCard key={quiz._id} item={contentItem} />;
              })
            ) : (
              <View style={styles.emptyContent}>
                <FileText size={24} color="#C7C7CC" />
                <StyledText style={styles.emptyText}>No quizzes available</StyledText>
              </View>
            )}
          </View>

          {/* Assignments Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Assignments</StyledText>
            </View>
            {loadingAssignments ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#007AFF" />
                <StyledText style={styles.loadingText}>Loading assignments...</StyledText>
              </View>
            ) : assignments.length > 0 ? (
              assignments.map((assignment) => {
                const contentItem: ContentItem = {
                  id: assignment.id.toString(),
                  title: assignment.name,
                  subtitle: 'Assignment',
                  type: 'assignment',
                  isCompleted: true, // You might want to track completion status
                  onPress: () => handleAssignmentPress(assignment),
                };
                return <ContentCard key={assignment.id} item={contentItem} />;
              })
            ) : (
              <View style={styles.emptyContent}>
                <FileText size={24} color="#C7C7CC" />
                <StyledText style={styles.emptyText}>No assignments available</StyledText>
              </View>
            )}
          </View>

          {/* Discussions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Discussions</StyledText>
            </View>
            <View style={styles.discussionItem}>
              <View style={styles.discussionContent}>
                <View style={styles.discussionHeader}>
                  <MessageSquare size={16} color="#007AFF" />
                  <View style={styles.dot} />
                  <StyledText style={styles.discussionTitle}>Announcements</StyledText>
                </View>
                <StyledText style={styles.discussionSubtitle}>Forum</StyledText>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: '#F9FAFB',
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 0 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    // elevation: 10,
    zIndex: 9999,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  quizCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  discussionItem: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  discussionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  discussionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
});

export default CourseSidebar;
