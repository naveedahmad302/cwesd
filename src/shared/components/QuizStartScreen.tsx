import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StyledText from './StyledText';
import { HelpCircle, Clock, Target, Award, CirclePlay, ChevronRight, Menu } from 'lucide-react-native';
import CourseSidebar from './CourseSidebar';
import QuizScreen from './QuizScreen';
import { quizzesAPI } from '../../services/api';
import { useAuth } from '../../features/auth/AuthContext';
import { showErrorToast } from '../../utils/toast';

interface QuizStartScreenProps {
  title: string;
  description: string;
  duration?: number;
  points?: number;
  questions?: number;
  maxAttempts?: number;
  availableFrom?: string;
  availableUntil?: string;
  quizId?: string;
  onStartQuiz: () => void;
  onClose: () => void;
  courseId?: string;
  moodleId?: string;
  onNavigateToQuiz?: (quiz: any) => void;
  onNavigateToAssignment?: (assignment: any) => void;
  onNavigateToLecture?: (lecture: any) => void;
}

interface QuizApiQuestionOption {
  text: string;
  isCorrect: boolean;
}

interface QuizApiQuestion {
  questionText: string;
  options: QuizApiQuestionOption[];
  points?: number;
}

interface QuizApiResponse {
  title: string;
  description: string;
  durationMinutes: number;
  totalPoints: number;
  defaultPointsPerQuestion?: number;
  maxAttempts?: number;
  availableFrom?: string;
  availableUntil?: string;
  questionCount?: number;
  questions: QuizApiQuestion[];
  submittedBy?: Array<{ id?: string; _id?: string }>;
}

const QuizStartScreen: React.FC<QuizStartScreenProps> = ({
  title,
  description,
  duration = 60,
  points = 100,
  questions = 10,
  maxAttempts = 3,
  availableFrom,
  availableUntil,
  quizId,
  onStartQuiz,
  onClose,
  courseId,
  moodleId,
  onNavigateToQuiz,
  onNavigateToAssignment,
  onNavigateToLecture
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizData, setQuizData] = useState<QuizApiResponse | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: !quizStarted });
    return () => navigation.setOptions({ headerShown: true });
  }, [navigation, quizStarted]);

  React.useEffect(() => {
    if (!quizId) {
      return;
    }

    const fetchQuiz = async () => {
      try {
        setIsLoadingQuiz(true);
        setQuizError(null);
        const response = await quizzesAPI.getQuizById(quizId);
        setQuizData(response.data?.data ?? null);
      } catch (error) {
        setQuizError('Unable to load quiz details.');
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const mappedQuestions = useMemo(() => {
    return (quizData?.questions ?? []).map((question, index) => {
      const correctAnswerIndex = question.options.findIndex(option => option.isCorrect);
      return {
        id: index + 1,
        question: question.questionText,
        options: question.options.map(option => option.text),
        correctAnswer: correctAnswerIndex,
        points: question.points,
      };
    });
  }, [quizData]);

  const totalPointsValue = quizData?.totalPoints ?? points ?? 0;
  const durationValue = quizData?.durationMinutes ?? duration ?? 0;
  const questionCountValue = quizData?.questionCount ?? quizData?.questions?.length ?? questions ?? 0;
  const maxAttemptsValue = quizData?.maxAttempts ?? maxAttempts ?? 0;
  const availableFromValue = quizData?.availableFrom ?? availableFrom;
  const availableUntilValue = quizData?.availableUntil ?? availableUntil;
  const defaultPointsPerQuestion = quizData?.defaultPointsPerQuestion ?? undefined;
  const attemptsUsed = useMemo(() => {
    if (!user?.id) {
      return 0;
    }
    return (quizData?.submittedBy ?? []).filter((attempt) => {
      const attemptId = attempt?.id ?? attempt?._id;
      return attemptId === user.id;
    }).length;
  }, [quizData?.submittedBy, user?.id]);
  const hasReachedMaxAttempts = maxAttemptsValue > 0 && attemptsUsed >= maxAttemptsValue;

  React.useEffect(() => {
    if (hasReachedMaxAttempts && !quizStarted) {
      showErrorToast(`Maximum attempt (${maxAttemptsValue}) reached.`, 'Attempt limit reached');
    }
  }, [hasReachedMaxAttempts, maxAttemptsValue, quizStarted]);

  const handleStartQuiz = async () => {
    if (!quizId || !user?.id) {
      Alert.alert('Unable to start quiz', 'Missing quiz or student information.');
      return;
    }

    if (hasReachedMaxAttempts) {
      showErrorToast(`You can only attempt this quiz ${maxAttemptsValue} times.`, 'Attempt limit reached');
      return;
    }

    setIsStarting(true);

    try {
      await quizzesAPI.startAttempt(quizId, user.id);
      setQuizStarted(true);
      onStartQuiz();
    } catch (error) {
      Alert.alert('Unable to start quiz', 'Please try again.');
      setIsStarting(false);
    }
  };

  const handleQuizSubmit = async (answers: number[]) => {
    // Calculate score
    let correctAnswers = 0;
    answers.forEach((answer, index) => {
      if (answer === mappedQuestions[index]?.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = mappedQuestions.length ? (correctAnswers / mappedQuestions.length) * 100 : 0;
    console.log('Quiz score:', score);

    if (!quizId || !user?.id) {
      Alert.alert('Unable to submit quiz', 'Missing quiz or student information.');
      setQuizStarted(false);
      setIsStarting(false);
      return;
    }

    try {
      await quizzesAPI.submitQuiz(quizId, user.id, answers);
    } catch (error) {
      Alert.alert('Unable to submit quiz', 'Please try again.');
    } finally {
      // Reset quiz state after completion
      setQuizStarted(false);
      setIsStarting(false);
    }
  };

  const handleQuizClose = () => {
    // Reset quiz state
    setQuizStarted(false);
    setIsStarting(false);
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
    }
  };

  const handleAssignmentClick = (assignment: any) => {
    setShowSidebar(false);
    if (onNavigateToAssignment) {
      onNavigateToAssignment(assignment);
    }
  };

  const handleLectureClick = (lecture: any) => {
    setShowSidebar(false);
    if (onNavigateToLecture) {
      onNavigateToLecture(lecture);
    }
  };

  return (
    <View style={styles.safeArea}>
      {/* Show QuizScreen when quiz is started */}
      {quizStarted ? (
        <QuizScreen
          title={quizData?.title ?? title}
          questions={mappedQuestions}
          duration={durationValue}
          totalPoints={totalPointsValue}
          defaultPointsPerQuestion={defaultPointsPerQuestion}
          onSubmit={handleQuizSubmit}
          onClose={handleQuizClose}
        />
      ) : (
        <>
          {/* Header with Menu */}
          <TouchableOpacity style={styles.header} onPress={handleHeaderClick}>
            <View style={styles.menuButton}>
              <Menu size={17} color="#000" />
            </View>
            <StyledText style={styles.headerTitle}>Course Content</StyledText>
          </TouchableOpacity>

          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Icon Section */}
            <View style={styles.iconContainer}>
              <HelpCircle size={64} color="#E56B8C" />
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              <StyledText style={styles.title}>{quizData?.title ?? title}</StyledText>
              <StyledText style={styles.description}>{quizData?.description ?? description}</StyledText>
              {quizError && <StyledText style={styles.errorText}>{quizError}</StyledText>}
            </View>

            {/* Quiz Info Cards */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoCard}>
                  {/* <View style={styles.infoIcon}>
                    <Clock size={20} color="#E56B8C" />
                  </View> */}
                  <View style={styles.infoContent}>
                    <StyledText style={styles.infoTitle}>Duration</StyledText>
                    <StyledText style={styles.infoValue}>{durationValue} minutes</StyledText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  {/* <View style={styles.infoIcon}>
                    <Target size={20} color="#E56B8C" />
                  </View> */}
                  <View style={styles.infoContent}>
                    <StyledText style={styles.infoTitle}>Questions</StyledText>
                    <StyledText style={styles.infoValue}>{questionCountValue} questions</StyledText>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCard}>
                  {/* <View style={styles.infoIcon}>
                    <Award size={20} color="#E56B8C" />
                  </View> */}
                  <View style={styles.infoContent}>
                    <StyledText style={styles.infoTitle}>Total Points</StyledText>
                    <StyledText style={styles.infoValue}>{totalPointsValue} points</StyledText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  {/* <View style={styles.infoIcon}>
                    <HelpCircle size={20} color="#E56B8C" />
                  </View> */}
                  <View style={styles.infoContent}>
                    <StyledText style={styles.infoTitle}>Max Attempts</StyledText>
                    <StyledText style={styles.infoValue}>{maxAttemptsValue} attempts</StyledText>
                  </View>
                </View>
              </View>

              {(availableFrom || availableUntil) && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoCard, styles.fullWidthCard]}>
                    <View style={styles.infoIcon}>
                      <Clock size={20} color="#E56B8C" />
                    </View>
                    <View style={styles.infoContent}>
                      <StyledText style={styles.infoTitle}>Available Time</StyledText>
                      <StyledText style={styles.infoValue}>
                        {availableFromValue && availableUntilValue 
                          ? `${new Date(availableFromValue).toLocaleDateString()} - ${new Date(availableUntilValue).toLocaleDateString()}`
                          : availableFromValue 
                            ? `From: ${new Date(availableFromValue).toLocaleDateString()}`
                            : availableUntilValue 
                              ? `Until: ${new Date(availableUntilValue).toLocaleDateString()}`
                              : 'Not specified'
                        }
                      </StyledText>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Start Button */}
            <View style={styles.startContainer}>
              <TouchableOpacity
                style={[styles.startButton, isStarting && styles.startButtonDisabled]}
                onPress={handleStartQuiz}
                disabled={isStarting || isLoadingQuiz || !mappedQuestions.length || hasReachedMaxAttempts}
              >
                <CirclePlay size={20} color="#FFFFFF" />
                <StyledText style={styles.startButtonText}>
                  {hasReachedMaxAttempts
                    ? 'Attempt limit reached'
                    : isLoadingQuiz
                      ? 'Loading...'
                      : isStarting
                        ? 'Starting...'
                        : 'Start Quiz'}
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
          
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  infoContainer: {
    marginBottom: 32,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fullWidthCard: {
    flex: undefined,
    width: '100%',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructionsContainer: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  instructionList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  startContainer: {
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E56B8C',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default QuizStartScreen;
