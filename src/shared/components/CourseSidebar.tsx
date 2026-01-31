import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import StyledText from './StyledText';
import { X, BookOpen, FileText, Video, Users, MessageSquare } from 'lucide-react-native';
import { quizzesAPI, courseSectionsAPI } from '../../services/api';
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<Assignment[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
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

  useEffect(() => {
    console.log('CourseSidebar useEffect triggered:', { isVisible, courseId, moodleId });
    if (isVisible) {
      if (courseId) {
        console.log('Calling fetchQuizzes and fetchCourseContent');
        fetchQuizzes();
        fetchCourseContent();
      } else {
        console.log('No courseId provided');
      }
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
  }, [isVisible, courseId, slideAnim, fadeAnim]);

  const fetchQuizzes = async () => {
    if (!courseId) return;
    
    try {
      setLoadingQuizzes(true);
      console.log('Fetching quizzes for courseId:', courseId, 'moodleId:', moodleId);
      const response = await quizzesAPI.getQuizzes();
      console.log('Quizzes API response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        // The API returns actual quiz data in response.data.data array
        const quizData = response.data.data;
        console.log('Raw quiz data from API:', quizData);
        console.log('Number of quizzes received:', quizData.length);
        
        // Log each quiz's submittedBy status before filtering
        quizData.forEach((quiz: any, index: number) => {
          console.log(`Quiz ${index + 1} - ${quiz.title}:`, {
            _id: quiz._id,
            submittedBy: quiz.submittedBy,
            submittedByLength: quiz.submittedBy ? quiz.submittedBy.length : 0,
            course: {
              _id: quiz.course?._id,
              moodleId: quiz.course?.moodleId
            }
          });
        });
        
        // Filter quizzes by courseId
        const courseQuizzes = quizData.filter((quiz: any) => {
          const matchesCourseId = quiz.course && quiz.course._id === courseId;
          const matchesMoodleId = quiz.course && quiz.course.moodleId === parseInt(moodleId || '0');
          console.log(`Quiz ${quiz.title}: courseId=${matchesCourseId}, moodleId=${matchesMoodleId}`);
          console.log(`  - Quiz course._id: ${quiz.course?._id}`);
          console.log(`  - Quiz course.moodleId: ${quiz.course?.moodleId}`);
          console.log(`  - Looking for courseId: ${courseId}`);
          console.log(`  - Looking for moodleId: ${moodleId}`);
          return matchesCourseId || matchesMoodleId;
        });
        
        console.log('Filtered quizzes for course:', courseQuizzes);
        console.log('CourseId being used for filtering:', courseId);
        console.log('MoodleId being used for filtering:', moodleId);
        
        if (courseQuizzes.length > 0) {
          setQuizzes(courseQuizzes);
          console.log('Set quizzes state with:', courseQuizzes.length, 'quizzes');
          
          // Log the final quiz data that will be used
          courseQuizzes.forEach((quiz: any, index: number) => {
            console.log(`Final Quiz ${index + 1} - ${quiz.title}:`, {
              submittedBy: quiz.submittedBy,
              submittedByLength: quiz.submittedBy ? quiz.submittedBy.length : 0
            });
          });
        } else {
          console.log('No quizzes found for course:', courseId);
          console.log('Available course IDs in quizzes:', quizData.map(q => q.course._id));
          console.log('Available moodle IDs in quizzes:', quizData.map(q => q.course.moodleId));
          setQuizzes([]);
        }
      } else {
        console.log('Invalid API response structure:', response.data);
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchCourseContent = async () => {
    console.log('fetchCourseContent called with moodleId:', moodleId);
    if (!moodleId) {
      console.log('No moodleId provided, returning');
      return;
    }
    
    try {
      setLoadingAssignments(true);
      console.log('Making API call to:', `/api/moodle/courses/${moodleId}/sections`);
      const response = await courseSectionsAPI.getCourseSections(moodleId);
      console.log('API response received:', response.data);
      
      if (response.data.success) {
        const sections = response.data.data.sections;
        console.log('Sections found:', sections);
        
        const allAssignments: Assignment[] = [];
        const allLectures: Assignment[] = [];
        // Note: We're not adding quizzes from course sections anymore since we have real quiz API
        
        sections.forEach((section: CourseSection) => {
          console.log(`Processing section ${section.sectionNumber}:`, section.modules);
          section.modules.forEach((module: Assignment) => {
            if (module.modname === 'assign') {
              allAssignments.push(module);
              console.log('Found assignment:', module.name);
            } else if (module.modname === 'resource') {
              allLectures.push(module);
              console.log('Found lecture:', module.name);
            }
            // Note: We're not processing 'quiz' modules from course sections anymore
          });
        });
        
        console.log('Final counts - Assignments:', allAssignments.length, 'Lectures:', allLectures.length);
        
        setAssignments(allAssignments);
        setLectures(allLectures);
        // Note: We're not setting quizzes here anymore to avoid overwriting real quiz data
      } else {
        console.log('API response was not successful');
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

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
    width: 400,
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
