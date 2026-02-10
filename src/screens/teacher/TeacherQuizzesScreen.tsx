import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import { Plus, Search, Eye, User, ChevronDown, FileText, SquarePen ,Trash2, Check} from 'lucide-react-native';
import { useGetCoursesQuery, useGetQuizzesQuery, useDeleteQuizMutation } from '../../store/api';
import { useUpdateQuizMutation } from '../../store/api/quizzesApi';
import QuizCreator from './components/QuizCreator';
import { Loading } from '../../shared/components';
import { ConfirmationModal } from '../../utils/toast';

const TeacherQuizzesScreen = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<any>(null);
  const [questionsMode, setQuestionsMode] = useState(false);

  const { data: coursesResponse } = useGetCoursesQuery();
  const [deleteQuiz] = useDeleteQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const {
    data: quizzesResponse,
    isLoading: loading,
    isFetching,
    isError,
    error: quizzesError,
    refetch,
  } = useGetQuizzesQuery();

  const courses = useMemo(() => {
    const raw = (coursesResponse as any)?.courses ?? coursesResponse?.courses;
    const list = Array.isArray(raw) ? raw : [];
    const names = list.map((c: any) => c.shortname).filter(Boolean);
    return ['All Courses', ...names];
  }, [coursesResponse]);

  const quizzes = useMemo(() => {
    const raw = (quizzesResponse as any)?.data ?? quizzesResponse?.data ?? quizzesResponse?.quizzes ?? quizzesResponse;
    return Array.isArray(raw) ? raw : [];
  }, [quizzesResponse]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDeleteQuiz = useCallback((quizId: string, quizTitle: string) => {
    setQuizToDelete(quizId);
    setDeleteModalVisible(true);
  }, []);

  const confirmDeleteQuiz = useCallback(async () => {
    if (!quizToDelete) return;
    
    try {
      await deleteQuiz(quizToDelete).unwrap();
      setDeleteModalVisible(false);
      setQuizToDelete(null);
      await refetch();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setDeleteModalVisible(false);
      setQuizToDelete(null);
    }
  }, [deleteQuiz, quizToDelete, refetch]);

  const cancelDeleteQuiz = useCallback(() => {
    setDeleteModalVisible(false);
    setQuizToDelete(null);
  }, []);

  const handleEditQuiz = useCallback((quiz: any) => {
    setQuizToEdit(quiz);
    setEditMode(true);
    setShowQuizCreator(true);
  }, []);

  const handleCloseQuizCreator = useCallback(() => {
    setShowQuizCreator(false);
    setEditMode(false);
    setQuizToEdit(null);
    setQuestionsMode(false);
  }, []);

  const handleQuizSaved = useCallback(() => {
    setShowQuizCreator(false);
    setEditMode(false);
    setQuizToEdit(null);
    setQuestionsMode(false);
    refetch();
  }, [refetch]);

  const handleQuestionsComplete = useCallback(() => {
    setQuestionsMode(false);
    setEditMode(false);
    setQuizToEdit(null);
    setShowQuizCreator(false);
    refetch();
  }, [refetch]);

  const handleSaveAndContinue = useCallback(() => {
    setQuestionsMode(true);
  }, []);

  const handleTransitionToQuestions = useCallback(() => {
    setQuestionsMode(true);
  }, []);

  const errorMessage = isError && quizzesError
    ? (quizzesError as { data?: { message?: string }; message?: string })?.data?.message ?? (quizzesError as { message?: string })?.message ?? 'Failed to fetch quizzes'
    : null;

  const filteredQuizzes = useMemo(() => quizzes.filter((quiz: any) => {
    const matchesCourse = selectedCourse === 'All Courses' || quiz.course?.shortname === selectedCourse;
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  }), [quizzes, selectedCourse, searchQuery]);

  // Calculate dynamic stats
  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter((quiz: any) => quiz.visible === 1).length;
  const totalSubmissions = quizzes.reduce((sum, quiz: any) => sum + (quiz.submittedBy?.length || 0), 0);
  const uniqueCourses = courses.length > 1 ? courses.length - 1 : 0; // Subtract 1 for "All Courses"

  // Transform quiz data for display
  const transformQuizData = (quiz: any) => ({
    id: quiz._id,
    title: quiz.title,
    submissions: quiz.submittedBy?.length || 0,
    points: quiz.totalPoints || 0,
    course: quiz.course?.shortname || 'Unknown Course',
    description: quiz.description,
    duration: quiz.durationMinutes,
    maxAttempts: quiz.maxAttempts
  });

  if (loading) {
    return <Loading isLoading={loading} overlay={false} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} colors={['#E56B8C']} />
        }
      >
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <StyledText style={styles.errorText}>{errorMessage}</StyledText>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <StyledText style={styles.retryText}>Retry</StyledText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* <StyledText style={styles.title}>Quizzes</StyledText>
            <StyledText style={styles.subtitle}>Manage quizzes and assessments</StyledText>
             */}
            <View style={styles.statsContainer}>
              <View style={styles.card}>
                <View>
                  <StyledText style={styles.cardTitle}>Total Quizzes</StyledText>
                  <StyledText style={styles.cardValue}>{totalQuizzes}</StyledText>
                </View>
              </View>

              <View style={styles.card}>
                <View>
                  <StyledText style={styles.cardTitle}>Published</StyledText>
                  <StyledText style={styles.cardValue}>{publishedQuizzes}</StyledText>
                </View>
              </View>

              <View style={styles.card}>
                <View>
                  <StyledText style={styles.cardTitle}>Total Submissions</StyledText>
                  <StyledText style={styles.cardValue}>{totalSubmissions}</StyledText>
                </View>
              </View>

              <View style={styles.card}>
                <View>
                  <StyledText style={styles.cardTitle}>Courses</StyledText>
                  <StyledText style={styles.cardValue}>{uniqueCourses}</StyledText>
                </View>
              </View>
            </View>
        
        {/*  Design Section - All Quizzes */}
        <View style={styles.allQuizzesSection}>
          <View style={styles.headerRow}>
            <StyledText style={styles.allQuizzesTitle}>All Quizzes ({filteredQuizzes.length})</StyledText>
            <TouchableOpacity style={styles.createQuizButton} onPress={() => setShowQuizCreator(true)}>
              <Plus size={16} color="#fff" />
              <StyledText style={styles.createQuizText}> Create Quiz</StyledText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchFilterRow}>
            <View style={styles.searchContainer}>
              <Search size={20} color="black" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search quizzes..."
                placeholderTextColor="black"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
              <StyledText style={styles.dropdownText}>{selectedCourse}</StyledText>
              <ChevronDown size={16} color="#333" style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            {dropdownVisible && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={true}>
                  {courses.map((course, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownOption,
                        selectedCourse === course && styles.selectedOption
                      ]}
                      onPress={() => {
                        setSelectedCourse(course);
                        setDropdownVisible(false);
                      }}
                    >
                      <StyledText style={[
                        styles.dropdownOptionText,
                        selectedCourse === course && styles.selectedOptionText
                      ]}>
                        {course}
                      </StyledText>
                      {selectedCourse === course && <Check size={16} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <View style={styles.quizCardsContainer}>
            {filteredQuizzes.map((quiz: any) => {
              const transformedQuiz = transformQuizData(quiz);
              return (
                <View key={transformedQuiz.id} style={styles.quizCard}>
                  <View style={styles.quizCardHeader}>
                    <View style={styles.quizTypeLabel}>
                      <FileText size={14} color="#3F79FD" />
                      <StyledText style={styles.quizTypeText}>Quiz</StyledText>
                    </View>
                    <View style={styles.quizCardActions}>
                      <TouchableOpacity onPress={() => handleEditQuiz(quiz)}>
                        <SquarePen size={20} color="black" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity onPress={() => handleDeleteQuiz(transformedQuiz.id, transformedQuiz.title)}>
                        <Trash2 size={20} color="black" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <StyledText style={styles.quizCardTitle}>{transformedQuiz.title}</StyledText>
                  <View style={styles.quizStatsRow}>
                    <View style={styles.statItem}>
                      <User size={14} color="black" />
                      <StyledText style={styles.statText}>{transformedQuiz.submissions} submission</StyledText>
                    </View>
                    <View style={styles.statItem}>
                      <StyledText style={styles.statText}>{transformedQuiz.points} pts</StyledText>
                    </View>
                  </View>
                  <View style={styles.quizFooter}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <User size={16} color="#6b7280" />
                      </View>
                      <StyledText style={styles.courseName}>{transformedQuiz.course}</StyledText>
                    </View>
                    {/* <Eye size={20} color="#6b7280" /> */}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

          </>
        )}
      </ScrollView>
      
      <QuizCreator
        visible={showQuizCreator}
        onClose={handleCloseQuizCreator}
        onQuizCreated={handleQuizSaved}
        editMode={editMode}
        quizData={quizToEdit}
        questionsMode={questionsMode}
        onQuestionsComplete={handleTransitionToQuestions}
      />
      
      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={cancelDeleteQuiz}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#E53E3E"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 13,
    color: '#888888',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 15,
  },
  // New Design Styles
  allQuizzesSection: {
    // marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  allQuizzesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E56B8C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createQuizText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchFilterRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent:'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: 'black',
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 102,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 270,
    maxHeight: 250,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedOption: {
    backgroundColor: '#E56B8C',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  quizCardsContainer: {
    gap: 12,
  },
  quizCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizCardActions: {
    flexDirection: 'row',
    gap: 20,
  },
  quizTypeLabel: {
    borderRadius:5,
    paddingHorizontal:15,
    paddingVertical:5,
    backgroundColor:'#F7F7FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quizTypeText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  quizCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  quizStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: 'black',
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseName: {
    fontSize: 14,
    color: 'black',
  },
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E56B8C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TeacherQuizzesScreen;
