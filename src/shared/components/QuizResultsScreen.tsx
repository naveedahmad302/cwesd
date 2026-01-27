import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CircleCheckBig, CirclePlay, Menu } from 'lucide-react-native';
import CourseSidebar from './CourseSidebar';
import { showErrorToast } from '../../utils/toast';

interface QuizData {
  title: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Passed';
  marks: string;
  duration: string;
  totalPoints: number;
  questions: number;
  maxAttempts: number;
  attemptsUsed?: number;
  availableFrom: string;
  availableTo: string;
  percentage?: number;
}

interface QuizResultsScreenProps {
  title?: string;
  description?: string;
  totalPoints?: number;
  marksObtained?: number;
  duration?: number;
  maxAttempts?: number;
  attemptsUsed?: number;
  questions?: number;
  availableFrom?: string;
  availableTo?: string;
  onClose?: () => void;
  onRetakeQuiz?: () => void;
  onNavigateToQuiz?: (quiz: any) => void;
  onNavigateToAssignment?: (assignment: any) => void;
  onNavigateToLecture?: (lecture: any) => void;
  courseId?: string;
  moodleId?: string;
  passingScore?: number;
}

const QuizScreen: React.FC<QuizResultsScreenProps> = ({
  title,
  description,
  totalPoints,
  marksObtained,
  duration,
  maxAttempts,
  attemptsUsed,
  questions,
  availableFrom,
  availableTo,
  onClose,
  onRetakeQuiz,
  onNavigateToQuiz,
  onNavigateToAssignment,
  onNavigateToLecture,
  courseId,
  moodleId,
  passingScore = 60
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Calculate percentage and determine status
  const percentage = marksObtained && totalPoints ? Math.round((marksObtained / totalPoints) * 100) : 0;
  const hasPassed = percentage >= passingScore;
  
  const quizData: QuizData = {
    title: title || 'Quiz Results',
    description: description || `You scored ${percentage}%${hasPassed ? ' and passed' : ' - try again'}!`,
    status: marksObtained !== undefined && totalPoints !== undefined 
      ? (hasPassed ? 'Passed' : 'Completed') 
      : 'Pending',
    marks: marksObtained !== undefined && totalPoints !== undefined ? `${marksObtained}/${totalPoints}` : '0/0',
    duration: duration ? `${duration} minutes` : 'Not specified',
    totalPoints: totalPoints || 0,
    questions: questions || 0,
    maxAttempts: maxAttempts || 1,
    attemptsUsed: attemptsUsed || 0,
    availableFrom: availableFrom || 'Not specified',
    availableTo: availableTo || 'Not specified',
    percentage: percentage,
  };

  const handleRetakeQuiz = () => {
    if ((quizData.attemptsUsed || 0) >= quizData.maxAttempts) {
      showErrorToast(`Maximum attempt (${quizData.maxAttempts}) reached.`, 'Attempt limit reached');
      return;
    }
    if (onRetakeQuiz) {
      onRetakeQuiz();
    } else {
      console.log('Retake Quiz pressed');
    }
  };

  const handleHeaderClick = () => {
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };

  const handleQuizClick = (quiz: any) => {
    setShowSidebar(false);
    if (onNavigateToQuiz) {
      onNavigateToQuiz(quiz);
    } else {
      Alert.alert(
        'Navigate to Quiz',
        `Would navigate to quiz: ${quiz.title}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleAssignmentClick = (assignment: any) => {
    setShowSidebar(false);
    if (onNavigateToAssignment) {
      onNavigateToAssignment(assignment);
    } else {
      Alert.alert(
        'Navigate to Assignment',
        `Would navigate to assignment: ${assignment.name}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleLectureClick = (lecture: any) => {
    setShowSidebar(false);
    if (onNavigateToLecture) {
      onNavigateToLecture(lecture);
    } else {
      Alert.alert(
        'Navigate to Lecture',
        `Would navigate to lecture: ${lecture.name}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Menu */}
      <TouchableOpacity style={styles.header} onPress={handleHeaderClick}>
        <View style={styles.menuButton}>
          <Menu size={17} color="#000" />
        </View>
        <Text style={styles.headerTitle}>Course Content</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.questionIcon}>
            <Text style={styles.iconText}>?</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{quizData.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{quizData.description}</Text>

        {/* Status Card */}
        <View style={[
          styles.statusCard,
          { 
            backgroundColor: quizData.status === 'Passed' ? '#e8f5e9' : 
                           quizData.status === 'Failed' ? '#ffebee' : '#fff3e0',
            borderColor: quizData.status === 'Passed' ? '#4caf50' : 
                         quizData.status === 'Failed' ? '#f44336' : '#ff9800'
          }
        ]}>
          <View style={styles.statusContent}>
            <View style={[
              styles.checkmarkContainer,
              { 
                backgroundColor: quizData.status === 'Passed' ? '#4caf50' : 
                               quizData.status === 'Failed' ? '#f44336' : '#ff9800'
              }
            ]}>
              <CircleCheckBig size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.statusText}>{quizData.status}</Text>
              {quizData.percentage !== undefined && (
                <Text style={styles.percentageText}>{quizData.percentage}%</Text>
              )}
            </View>
          </View>
          <Text style={styles.marksText}>{quizData.marks}</Text>
        </View>

        {/* Duration and Total Points */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{quizData.duration}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Points</Text>
            <Text style={styles.infoValue}>{quizData.totalPoints}</Text>
          </View>
        </View>

        {/* Questions and Max Attempts */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Questions</Text>
            <Text style={styles.infoValue}>{quizData.questions}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Attempts</Text>
            <Text style={styles.infoValue}>{quizData.attemptsUsed}/{quizData.maxAttempts}</Text>
          </View>
        </View>

        {/* Available Date Range */}
        <View style={styles.availableSection}>
          <Text style={styles.infoLabel}>Available</Text>
          <Text style={styles.dateRangeText}>
            {quizData.availableFrom} - {quizData.availableTo}
          </Text>
        </View>

        {/* Retake Quiz Button - Show always, but disable when no attempts left */}
        <TouchableOpacity
          style={[
            styles.retakeButton,
            (quizData.attemptsUsed || 0) >= quizData.maxAttempts && styles.retakeButtonDisabled
          ]}
          onPress={handleRetakeQuiz}
          disabled={(quizData.attemptsUsed || 0) >= quizData.maxAttempts}
          activeOpacity={0.7}
        >
          <CirclePlay size={20} color={(quizData.attemptsUsed || 0) >= quizData.maxAttempts ? '#999' : '#fff'} />
          <Text style={[
            styles.retakeButtonText,
            (quizData.attemptsUsed || 0) >= quizData.maxAttempts && styles.retakeButtonTextDisabled
          ]}>
            {(quizData.attemptsUsed || 0) >= quizData.maxAttempts ? 'Attempt limit reached' : 'Retake Quiz'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
      
      {/* Course Sidebar */}
      <CourseSidebar 
        isVisible={showSidebar} 
        onClose={handleCloseSidebar}
        onQuizClick={handleQuizClick}
        onAssignmentClick={handleAssignmentClick}
        onLectureClick={handleLectureClick}
        courseId={courseId}
        moodleId={moodleId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:12,
  },
  header: {
    backgroundColor:'#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 8,
    margin: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0ff',
    width: '51%',
  },
  menuButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    color: '#212529',
    fontFamily: 'FiraCode-Regular',
  },
  scrollContent: {
    padding: 20,
    // paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  questionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fce4ec',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ec407a',
  },
  iconText: {
    fontSize: 32,
    color: '#ec407a',
    fontWeight: '600',
    fontFamily: 'FiraCode-Regular',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'FiraCode-Regular',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 21,
    marginBottom: 20,
    textAlign: 'left',
    fontFamily: 'FiraCode-Regular',
  },
  statusCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4dba519f',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    // backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkmark: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'FiraCode-Regular',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'FiraCode-Regular',
  },
  marksText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'FiraCode-Regular',
  },
  infoSection: {
    // backgroundColor: '#f5f5f5',
    
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  infoItem: {
    padding:10,
    // borderWidth:1,
    borderRadius:8,
    backgroundColor:'#F9FAFB',
    // borderColor:'#ddd',
    flex: 1,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
    fontFamily: 'FiraCode-Regular',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'FiraCode-Regular',
  },
  availableSection: {
    backgroundColor: '#F9FAFB',
    borderRadius:8,
    padding:10,
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
    fontFamily: 'FiraCode-Regular',
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'FiraCode-Regular',
    marginTop: 2,
  },
  noAttemptsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noAttemptsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'FiraCode-Regular',
  },
  retakeButton: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  retakeButtonIcon: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
    fontWeight: '600',
    fontFamily: 'FiraCode-Regular',
  },
  retakeButtonText: {
    paddingLeft:10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'FiraCode-Regular',
  },
  retakeButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  retakeButtonTextDisabled: {
    color: '#999',
  },
});

export default QuizScreen;
