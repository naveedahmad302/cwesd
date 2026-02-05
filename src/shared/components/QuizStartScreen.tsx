import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StyledText from './StyledText';
import { HelpCircle, Clock, Target, Award, CirclePlay, ChevronRight, Menu } from 'lucide-react-native';
import CourseSidebar from './CourseSidebar';
import QuizScreen from './QuizScreen';
import QuizResultsScreen from './QuizResultsScreen';
import { useGetQuizByIdQuery, useStartAttemptMutation, useSubmitQuizMutation } from '../../store/api';
import { useAppSelector } from '../../store';
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
  maxAttempts = 2,
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
  const user = useAppSelector(state => state.user.user);
  const { data: quizResponse, isLoading: isLoadingQuiz, isFetching, refetch } = useGetQuizByIdQuery(quizId!, { skip: !quizId });
  const [startAttempt] = useStartAttemptMutation();
  const [submitQuiz] = useSubmitQuizMutation();
  const [isStarting, setIsStarting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const quizData = (quizResponse as any)?.data ?? quizResponse?.data ?? quizResponse ?? null;

  React.useEffect(() => {
    navigation.setOptions({ headerShown: !quizStarted });
    return () => navigation.setOptions({ headerShown: true });
  }, [navigation, quizStarted]);

  React.useEffect(() => {
    console.log('=== QUIZ DATA DEBUG ===');
    console.log('quizResponse:', quizResponse);
    console.log('isLoadingQuiz:', isLoadingQuiz);
    console.log('quizData:', quizData);
    console.log('mappedQuestions.length:', mappedQuestions?.length || 0);
    console.log('=====================');
  }, [quizResponse, quizData, isLoadingQuiz, mappedQuestions]);

  React.useEffect(() => {
    if (quizResponse === undefined && !isLoadingQuiz && quizId) setQuizError('Unable to load quiz details.');
  }, [quizId, quizResponse, isLoadingQuiz]);

  const mappedQuestions = useMemo(() => {
    const questions = (quizData?.questions ?? []) as QuizApiQuestion[];
    return questions.map((question: QuizApiQuestion, index: number) => {
      const correctAnswerIndex = question.options.findIndex((option: QuizApiQuestionOption) => option.isCorrect);
      return {
        id: index + 1,
        question: question.questionText,
        options: question.options.map((option: QuizApiQuestionOption) => option.text),
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
    // If max attempts were reached via API, use maxAttemptsValue
    if (maxAttemptsReached) {
      return maxAttemptsValue;
    }
    
    // If we have a current attempt with attemptNumber, use that
    if (currentAttempt?.attemptNumber) {
      return currentAttempt.attemptNumber;
    }
    
    // Count user's submissions from submittedBy array
    if (!user?.id || !quizData?.submittedBy) {
      return 0;
    }
    
    const userSubmissions = quizData.submittedBy.filter((submission: any) => {
      const submissionId = submission.id || submission._id;
      return submissionId === user.id;
    });
    
    console.log('User submissions found:', userSubmissions.length);
    console.log('User ID:', user.id);
    console.log('SubmittedBy array:', quizData.submittedBy);
    
    return userSubmissions.length;
  }, [maxAttemptsReached, maxAttemptsValue, currentAttempt?.attemptNumber, quizData?.submittedBy, user?.id]);
  const hasReachedMaxAttempts = maxAttemptsValue > 0 && attemptsUsed >= maxAttemptsValue;

  React.useEffect(() => {
    if (hasReachedMaxAttempts && !quizStarted && !showResults) {
      showErrorToast(
        `You have used all ${maxAttemptsValue} attempts for this quiz. View your results below.`, 
        'Maximum Attempts Reached'
      );
      setShowResults(true);
    }
  }, [hasReachedMaxAttempts, maxAttemptsValue, quizStarted, showResults]);

  // Check attempt availability by calling the attempt API immediately
  React.useEffect(() => {
    if (!quizId || !user?.id || quizStarted || showResults) {
      console.log('Skipping attempt check - missing data or already started');
      return;
    }

    console.log('=== CHECKING ATTEMPT AVAILABILITY ===');
    console.log('quizId:', quizId);
    console.log('user.id:', user.id);

    const checkAttempt = async () => {
      try {
        console.log('Making attempt API call...');
        const result = await startAttempt({ quizId, studentId: user.id }).unwrap() as any;
        console.log('API SUCCESS:', result);
        
        if (result?.success && result?.data) {
          setCurrentAttempt(result.data);
          console.log('Attempt available:', result.data.attemptNumber);
        }
      } catch (error: any) {
        console.log('API ERROR:', error);
        console.log('Error status:', error?.status);
        console.log('Error data:', error?.data);
        
        // Handle the max attempts error
        const errorMessage = error?.data?.message || error?.message || '';
        if (errorMessage.includes('Maximum attempts')) {
          console.log('MAXIMUM ATTEMPTS REACHED - Setting state and showing results');
          setMaxAttemptsReached(true);
          showErrorToast(
            `Maximum attempts reached. View your results below.`, 
            'Maximum Attempts Reached'
          );
          setShowResults(true);
        } else {
          console.log('Different error - not max attempts');
        }
      }
    };

    checkAttempt();
  }, [quizId, user?.id, quizStarted, showResults]);

  const handleStartQuiz = async () => {
    console.log('=== START QUIZ DEBUG ===');
    console.log('quizId:', quizId);
    console.log('user.id:', user?.id);
    console.log('hasReachedMaxAttempts:', hasReachedMaxAttempts);
    console.log('maxAttemptsValue:', maxAttemptsValue);
    console.log('attemptsUsed:', attemptsUsed);
    console.log('currentAttempt:', currentAttempt);
    console.log('isStarting:', isStarting);
    console.log('isLoadingQuiz:', isLoadingQuiz);
    console.log('mappedQuestions.length:', mappedQuestions?.length || 0);
    console.log('quizData:', quizData);
    console.log('========================');

    if (!quizId || !user?.id) {
      Alert.alert('Unable to start quiz', 'Missing quiz or student information.');
      return;
    }

    if (hasReachedMaxAttempts) {
      showErrorToast(
        `You have already used all ${maxAttemptsValue} attempts. View your results below.`, 
        'Maximum Attempts Reached'
      );
      setShowResults(true);
      return;
    }

    // If we already have a valid attempt from the availability check, use it
    if (currentAttempt && currentAttempt.attemptNumber) {
      console.log('Using pre-checked attempt:', currentAttempt);
      setQuizStarted(true);
      onStartQuiz();
      return;
    }

    // Otherwise, try to start a new attempt (fallback)
    setIsStarting(true);

    try {
      const result = await startAttempt({ quizId, studentId: user.id }).unwrap() as any;
      console.log('Quiz attempt started:', result);
      
      // Store the attempt data
      if (result?.success && result?.data) {
        setCurrentAttempt(result.data);
        console.log(`Attempt ${result.data.attemptNumber} started for quiz ${result.data.quizId}`);
        console.log('API Response attempt data:', result.data);
      }
      
      setQuizStarted(true);
      onStartQuiz();
    } catch (error) {
      console.error('Failed to start quiz attempt:', error);
      
      // Check if it's a max attempts error
      if ((error as any)?.data?.message?.includes('Maximum attempts')) {
        showErrorToast(
          `Maximum attempts (${maxAttemptsValue}) reached. View your results below.`, 
          'Maximum Attempts Reached'
        );
        setShowResults(true);
      } else {
        Alert.alert('Unable to start quiz', 'Please try again.');
      }
      setIsStarting(false);
    }
  };

  const handleQuizSubmit = async (answers: Array<{questionId: string; selectedOptions: number[]}>) => {
    if (!quizId || !user?.id) {
      Alert.alert('Unable to submit quiz', 'Missing quiz or student information.');
      setQuizStarted(false);
      setIsStarting(false);
      return;
    }

    try {
      console.log('Submitting quiz answers:', answers);
      console.log('Current attempt:', currentAttempt);
      
      const result = await submitQuiz({ quizId, studentId: user.id, answers }).unwrap() as any;
      console.log('Quiz submitted successfully:', result);
      
      // Update current attempt with submission data if available
      if (result?.success && result?.data) {
        setCurrentAttempt(result.data);
      }
      
      // Refetch quiz data to update attempts count
      await refetch();
      
      // Show success message and then show results
      Alert.alert(
        'Quiz Submitted',
        'Your quiz has been submitted successfully!',
        [{ 
          text: 'OK', 
          onPress: () => {
            setQuizStarted(false);
            setShowResults(true);
            setIsStarting(false);
          }
        }]
      );
    } catch (error: any) {
      console.error('Failed to submit quiz:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to submit quiz. Please try again.';
      Alert.alert('Submission Failed', errorMessage);
      setIsStarting(false);
    }
  };

  const handleQuizClose = () => {
    // Reset quiz state
    setQuizStarted(false);
    setIsStarting(false);
    setCurrentAttempt(null);
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

  const handleRetakeQuiz = () => {
    setShowResults(false);
    handleStartQuiz();
  };

  return (
    <View style={styles.safeArea}>
      {/* Show QuizScreen when quiz is started */}
      {quizStarted ? (
        <QuizScreen
          quizId={quizId!}
          onSubmit={handleQuizSubmit}
          onClose={handleQuizClose}
          courseId={courseId}
          moodleId={moodleId}
          studentId={user?.id}
        />
      ) : showResults ? (
        <QuizResultsScreen
          title={quizData?.title ?? title}
          description={quizData?.description ?? description}
          totalPoints={totalPointsValue}
          marksObtained={(() => {
            // Find the user's submissions in the submittedBy array
            const userSubmissions = quizData?.submittedBy?.filter((submission: any) => {
              const submissionId = submission.id || submission._id;
              return submissionId === user?.id;
            }) || [];
            
            if (userSubmissions.length === 0) {
              return 0;
            }
            
            // Get the latest submission (highest marks or last one)
            const latestSubmission = userSubmissions.reduce((latest: any, current: any) => {
              // Prefer higher marks, if equal prefer the later one (by array order)
              if (current.marksObtained > latest.marksObtained) {
                return current;
              }
              return latest;
            }, userSubmissions[0]);
            
            console.log('User submissions:', userSubmissions);
            console.log('Latest submission:', latestSubmission);
            
            return latestSubmission?.marksObtained || 0;
          })()}
          duration={durationValue}
          maxAttempts={maxAttemptsValue}
          attemptsUsed={attemptsUsed}
          currentAttempt={currentAttempt}
          questions={questionCountValue}
          availableFrom={availableFromValue}
          availableTo={availableUntilValue}
          onRetakeQuiz={attemptsUsed < maxAttemptsValue ? handleRetakeQuiz : undefined}
          onNavigateToQuiz={handleQuizClick}
          onNavigateToAssignment={handleAssignmentClick}
          onNavigateToLecture={handleLectureClick}
          courseId={courseId}
          moodleId={moodleId}
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

          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} colors={['#E56B8C']} />
            }
          >
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
                    <StyledText style={styles.infoTitle}>Attempts</StyledText>
                    <StyledText style={styles.infoValue}>
                      {attemptsUsed} of {maxAttemptsValue} used
                    </StyledText>
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

            {/* Attempts Warning */}
            {hasReachedMaxAttempts ? (
              <View style={styles.maxAttemptsWarning}>
                <StyledText style={styles.maxAttemptsWarningText}>
                  You have reached the maximum of {maxAttemptsValue} attempts. View your results below.
                </StyledText>
              </View>
            ) : attemptsUsed === 1 && (
              <View style={styles.attemptsWarning}>
                <StyledText style={styles.attemptsWarningText}>
                  You have 1 attempt remaining. Make it count!
                </StyledText>
              </View>
            )}

            {/* Start Button */}
            <View style={styles.startContainer}>
              <TouchableOpacity
                style={[styles.startButton, isStarting && styles.startButtonDisabled]}
                onPress={handleStartQuiz}
                disabled={isStarting || isLoadingQuiz || hasReachedMaxAttempts}
              >
                <CirclePlay size={20} color="#FFFFFF" />
                <StyledText style={styles.startButtonText}>
                  {hasReachedMaxAttempts
                    ? `All ${maxAttemptsValue} attempts used`
                    : isLoadingQuiz
                      ? 'Loading...'
                      : isStarting
                        ? 'Starting...'
                        : attemptsUsed === 0
                          ? 'Start Quiz (Attempt 1)'
                          : `Retake Quiz (Attempt ${attemptsUsed + 1})`}
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
  attemptsWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  attemptsWarningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  maxAttemptsWarning: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  maxAttemptsWarningText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default QuizStartScreen;
