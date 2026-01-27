import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ChevronLeft, ChevronRight, Clock, Circle, CircleDot } from 'lucide-react-native';
import { typography } from '../../theme/typography';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
}

interface QuizScreenProps {
  title: string;
  questions: Question[];
  duration: number;
  onSubmit: (answers: number[]) => void;
  onClose: () => void;
  timeRemaining?: number;
  totalPoints?: number;
  defaultPointsPerQuestion?: number;
}

const QuizScreen: React.FC<QuizScreenProps> = ({
  title,
  questions,
  duration,
  onSubmit,
  onClose,
  timeRemaining = duration * 60, // Convert minutes to seconds
  totalPoints,
  defaultPointsPerQuestion
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionPoints = currentQuestion?.points ?? defaultPointsPerQuestion ?? 0;

  // Timer effect
  React.useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitting) {
      handleSubmitQuiz();
    }
  }, [timeLeft, isSubmitting]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = () => {
    Alert.alert(
      'Submit Quiz',
      'Are you sure you want to submit your answers?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => {
            setIsSubmitting(true);
            onSubmit(selectedAnswers);
          },
        },
      ]
    );
  };

  const getProgressPercentage = () => {
    const answered = selectedAnswers.filter(answer => answer !== -1).length;
    return (answered / questions.length) * 100;
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered = selectedAnswers.every(answer => answer !== -1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>None</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <ChevronLeft size={18} color="#111827" />
          <Text style={styles.closeButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressCount}>
              {selectedAnswers.filter(answer => answer !== -1).length} / {questions.length} answered
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressPercentage()}%` }
              ]}
            />
          </View>
        </View>
        <View style={styles.infoPills}>
          <View style={styles.infoPill}>
            <Clock size={16} color={timeLeft < 60 ? "#EF4444" : "#111827"} />
            <Text style={styles.infoPillText}>{formatTime(timeLeft)}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>Points: {totalPoints ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Question Number */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionBadge}>
              <Text style={styles.questionBadgeText}>{currentQuestionIndex + 1}</Text>
            </View>
            <View style={styles.questionHeaderText}>
              <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
              <View style={styles.questionMetaRow}>
                <Text style={styles.questionPoints}>{currentQuestionPoints} points</Text>
                <View style={styles.questionTag}>
                  <Text style={styles.questionTagText}>Single Choice</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOption
                ]}
                onPress={() => handleSelectOption(index)}
                activeOpacity={0.7}
              >
                <View style={styles.optionRadio}>
                  {selectedAnswers[currentQuestionIndex] === index ? (
                    <CircleDot size={16} color="#E56B8C" />
                  ) : (
                    <Circle size={16} color="#9CA3AF" />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.previousButton,
            currentQuestionIndex === 0 && styles.disabledButton
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft size={20} color={currentQuestionIndex === 0 ? "#9CA3AF" : "#374151"} />
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.disabledButtonText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.submitButton,
              !allQuestionsAnswered && styles.disabledButton
            ]}
            onPress={handleSubmitQuiz}
            disabled={!allQuestionsAnswered || isSubmitting}
          >
            <Text style={[
              styles.navButtonText,
              styles.submitButtonText,
              (!allQuestionsAnswered || isSubmitting) && styles.disabledButtonText
            ]}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, styles.submitButtonText]}>Next</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:50,
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: typography.primary,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: typography.primary,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  closeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: typography.primary,
  },
  infoRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: typography.primary,
  },
  progressCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: typography.primary,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E56B8C',
    borderRadius: 999,
  },
  infoPills: {
    flexDirection: 'row',
    gap: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  infoPillText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: typography.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCE7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E56B8C',
    fontFamily: typography.primary,
  },
  questionHeaderText: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: typography.primary,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionPoints: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: typography.primary,
  },
  questionTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    fontFamily: typography.primary,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#E56B8C',
    backgroundColor: '#FFF5F7',
  },
  optionRadio: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    fontFamily: typography.primary,
  },
  selectedOptionText: {
    color: '#E56B8C',
    fontWeight: '600',
    fontFamily: typography.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'center',
  },
  nextButton: {
    backgroundColor: '#E56B8C',
  },
  submitButton: {
    backgroundColor: '#E56B8C',
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.primary,
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default QuizScreen;
