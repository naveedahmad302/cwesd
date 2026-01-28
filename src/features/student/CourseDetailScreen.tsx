import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import StyledText from '../../shared/components/StyledText';
import CourseSidebar from '../../shared/components/CourseSidebar';
import ContentDetailCard, { ContentDetailAction } from '../../shared/components/ContentDetailCard';
import QuizStartScreen from '../../shared/components/QuizStartScreen';
import QuizResultsScreen from '../../shared/components/QuizResultsScreen';
import { MessageSquare, ExternalLink, Menu, CircleCheckBig, HelpCircle } from 'lucide-react-native';

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as { course: any };
  console.log('CourseDetailScreen - route.params:', route.params);
  console.log('CourseDetailScreen - course:', course);
  
  // Add error handling for missing course data
  if (!course) {
    console.error('CourseDetailScreen: No course data provided');
    return (
      <View style={styles.errorContainer}>
        <StyledText style={styles.errorText}>Course data not found</StyledText>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <StyledText style={styles.backButtonText}>Go Back</StyledText>
        </TouchableOpacity>
      </View>
    );
  }
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    type: 'quiz' | 'assignment' | 'lecture';
    title: string;
    description: string;
    data?: any; // Store the original data for each content type
  } | null>(null);

  const handleHeaderClick = () => {
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };

  const handleOpenContent = () => {
    // Handle opening course content
    console.log('Opening course content for:', course.title);
  };

  const handleOpenInMoodle = () => {
    // Handle opening in Moodle
    console.log('Opening in Moodle:', course.title);
  };

  const handleMarkComplete = () => {
    // Handle marking as complete
    console.log('Marking as complete:', course.title);
  };

  const handleQuizClick = (quiz: any) => {
    setSelectedContent({
      type: 'quiz',
      title: quiz.title,
      description: 'Take this quiz to test your knowledge',
      data: quiz
    });
  };

  const handleAssignmentClick = (assignment: any) => {
    setSelectedContent({
      type: 'assignment',
      title: assignment.name,
      description: 'Complete this assignment to demonstrate your understanding',
      data: assignment
    });
  };

  const handleLectureClick = (lecture: any) => {
    setSelectedContent({
      type: 'lecture',
      title: lecture.name,
      description: 'Watch this lecture to learn the key concepts',
      data: lecture
    });
  };

  const isQuizSubmitted = (quiz: any) => {
    // Check if the current user has submitted this quiz
    // For now, we'll check if there are any submissions
    // In a real implementation, you'd check against the current user ID
    return quiz.submittedBy && quiz.submittedBy.length > 0;
  };

  const getCurrentUserSubmission = (quiz: any) => {
    // Get the current user's submission
    // For now, we'll return the first submission
    // In a real implementation, you'd filter by current user ID
    return quiz.submittedBy && quiz.submittedBy.length > 0 ? quiz.submittedBy[0] : null;
  };

  const handleStartQuiz = () => {
    console.log('Starting quiz:', selectedContent?.title);
    // Handle quiz start logic here
  };

  const handleRetakeQuiz = () => {
    console.log('Retaking quiz:', selectedContent?.title);
    // Handle quiz retake logic here
    // This would typically reset the quiz state and show QuizStartScreen again
  };

  const handleBackToAnnouncements = () => {
    setSelectedContent(null);
  };

  const getQuizActions = (): ContentDetailAction[] => {
    const baseActions: ContentDetailAction[] = [
      {
        id: 'open-moodle',
        title: 'Open in Moodle',
        type: 'primary',
        onPress: handleOpenInMoodle,
        icon: <ExternalLink size={16} color="#ffffff" />
      },
      {
        id: 'mark-complete',
        title: 'Mark Complete',
        type: 'primary',
        onPress: handleMarkComplete,
        icon: <CircleCheckBig size={16} color="#111827" />
      }
    ];

    if (!selectedContent) return baseActions;

    switch (selectedContent.type) {
      case 'quiz':
        return [
          {
            id: 'open',
            title: 'Open Content',
            type: 'primary',
            onPress: handleOpenContent
          },
          {
            id: 'submit',
            title: 'Submit Quiz',
            type: 'primary',
            onPress: () => console.log('Submit quiz')
          },
          ...baseActions
        ];
      case 'assignment':
        return [
          {
            id: 'open',
            title: 'Open Content',
            type: 'primary',
            onPress: handleOpenContent,
            icon: <ExternalLink size={16} color="#ffffff" />
          },
          {
            id: 'submit',
            title: 'Submit Assignment',
            type: 'primary',
            onPress: () => console.log('Submit assignment'),
            icon: <MessageSquare size={16} color="#111827" />
          },
          ...baseActions
        ];
      case 'lecture':
        return [
          {
            id: 'open',
            title: 'Open Content',
            type: 'primary',
            onPress: handleOpenContent
          },
          {
            id: 'download',
            title: 'Download',
            type: 'primary',
            onPress: () => console.log('Download lecture')
          },
          ...baseActions
        ];
      default:
        return baseActions;
    }
  };

  return (
    <View style={styles.container}>
      {selectedContent && selectedContent.type === 'quiz' ? (
        // Check if quiz is submitted
        isQuizSubmitted(selectedContent.data) ? (
          // Show QuizResultsScreen for submitted quizzes
          <QuizResultsScreen
            title={selectedContent.title}
            description={selectedContent.description}
            totalPoints={selectedContent.data?.totalPoints}
            marksObtained={getCurrentUserSubmission(selectedContent.data)?.marksObtained || 0}
            duration={selectedContent.data?.durationMinutes}
            maxAttempts={selectedContent.data?.maxAttempts}
            attemptsUsed={selectedContent.data?.submittedBy?.length || 0}
            onClose={handleBackToAnnouncements}
            onRetakeQuiz={handleRetakeQuiz}
            onNavigateToQuiz={handleQuizClick}
            onNavigateToAssignment={handleAssignmentClick}
            onNavigateToLecture={handleLectureClick}
            courseId={course?.id}
            moodleId={course?.moodleId?.toString()}
          />
        ) : (
          // Show QuizStartScreen for unsubmitted quizzes
          <QuizStartScreen
            title={selectedContent.title}
            description={selectedContent.description}
            duration={selectedContent.data?.durationMinutes}
            points={selectedContent.data?.totalPoints}
            questions={10} // Default number of questions
            maxAttempts={selectedContent.data?.maxAttempts}
            availableFrom={selectedContent.data?.availableFrom}
            availableUntil={selectedContent.data?.availableUntil}
            quizId={selectedContent.data?._id ?? selectedContent.data?.id}
            onStartQuiz={handleStartQuiz}
            onClose={handleBackToAnnouncements}
            onNavigateToQuiz={handleQuizClick}
            onNavigateToAssignment={handleAssignmentClick}
            onNavigateToLecture={handleLectureClick}
            courseId={course?.id}
            moodleId={course?.moodleId?.toString()}
          />
        )
      ) : (
        // Show normal CourseDetailScreen content
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <TouchableOpacity style={styles.header} onPress={handleHeaderClick}>
            <View style={styles.menuButton}>
              <Menu size={17} color="#000" />
            </View>
            <StyledText style={styles.title}>Course Content</StyledText>
          </TouchableOpacity>

          {/* Content Card - Either Announcements or Content Detail */}
          {selectedContent ? (
            <ContentDetailCard
              title={selectedContent.title}
              description={selectedContent.description}
              type={selectedContent.type}
              actions={getQuizActions()}
            />
          ) : (
            <View style={styles.announcementsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <MessageSquare size={32} color="#E56B8C" />
                </View>
                <View style={styles.headerContent}>
                  <StyledText style={styles.cardTitle}>Announcements</StyledText>
                  <StyledText style={styles.cardSubtitle}>
                    Join the discussion with your classmates
                  </StyledText>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.openContentButton}
                onPress={handleOpenContent}
              >
                <ExternalLink strokeWidth={1.75} size={20} color="#fff" style={styles.buttonIcon} />
                <StyledText style={styles.openContentText}>Open Content</StyledText>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons - Only show when not viewing content detail */}
          {!selectedContent && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.moodleButton}
                onPress={handleOpenInMoodle}
              >
                <ExternalLink size={20} color="#fff" style={styles.buttonIcon} />
                <StyledText style={styles.moodleButtonText}>Open in Moodle</StyledText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={handleMarkComplete}
              >
                <CircleCheckBig strokeWidth={1.75} size={20} color="black" style={styles.buttonIcon} />
                <StyledText style={styles.completeButtonText}>Mark Complete</StyledText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Sidebar - Show for assignments and lectures, hide for quizzes */}
      {(!selectedContent || selectedContent.type !== 'quiz') && (
        <CourseSidebar 
          isVisible={showSidebar} 
          onClose={handleCloseSidebar}
          onQuizClick={handleQuizClick}
          onAssignmentClick={handleAssignmentClick}
          onLectureClick={handleLectureClick}
          courseId={course?.id}
          moodleId={course?.moodleId?.toString()} // Use actual moodleId from course
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor:'#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 8,
    margin: 20,
    // paddingTop: 60,
    // backgroundColor: '#fff',
    // borderWidth: 1,
    // borderColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#e0e0e0ff',
    width: '51%',
  },
  menuButton: {
    marginRight: 10,
    padding: 4,
    
  },
  title: {
    fontSize: 17,
    // fontWeight: 'bold',
    color: '#212529',
  },
  announcementsCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    
  },
  cardHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
    textAlign: 'center',
  },
  openContentButton: {
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  openContentText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  moodleButton: {
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  moodleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  completeButton: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#e6e6e6ff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    shadowColor: '#00000055',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#E56B8C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CourseDetailScreen;
