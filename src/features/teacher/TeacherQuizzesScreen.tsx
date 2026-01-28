import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import { FileCheck, TrendingUp, Users, BarChart, Plus, Search, Eye, User, ChevronDown, Check, MoreVertical, FileText } from 'lucide-react-native';
import { quizzesAPI, coursesAPI } from '../../services/api';
import QuizCreator from './components/QuizCreator';

const TeacherQuizzesScreen = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState(['All Courses']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuizCreator, setShowQuizCreator] = useState(false);

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getCourses();
      console.log('Courses API Response:', response.data);
      
      if (response.data?.success && Array.isArray(response.data?.courses)) {
        const courseList = response.data.courses
          .map((course: any) => course.shortname)
          .filter(Boolean);
        setCourses(['All Courses', ...courseList]);
      } else {
        console.warn('Unexpected courses API response format:', response.data);
        // Keep default courses if API fails
        setCourses(['All Courses']);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      // Keep default courses if API fails
      setCourses(['All Courses']);
    }
  };

  // Fetch quizzes from API
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizzesAPI.getQuizzes();
      if (response.data.success) {
        setQuizzes(response.data.data);
      } else {
        setError('Failed to fetch quizzes');
      }
    } catch (err) {
      setError('Error loading quizzes');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
  }, []);

  // Filter quizzes based on selected course and search query
  const filteredQuizzes = quizzes.filter((quiz: any) => {
    const matchesCourse = selectedCourse === 'All Courses' || quiz.course?.shortname === selectedCourse;
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E56B8C" />
            <StyledText style={styles.loadingText}>Loading quizzes...</StyledText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <StyledText style={styles.errorText}>{error}</StyledText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchQuizzes}>
              <StyledText style={styles.retryText}>Retry</StyledText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* <StyledText style={styles.title}>Quizzes</StyledText>
            <StyledText style={styles.subtitle}>Manage quizzes and assessments</StyledText>
             */}
            <View style={styles.cardsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <StyledText style={styles.statTitle}>Total Quizzes</StyledText>
                  <StyledText style={styles.statNumber}>{totalQuizzes}</StyledText>
                </View>
                <FileCheck size={24} color="#3b82f6" />
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <StyledText style={styles.statTitle}>Published</StyledText>
                  <StyledText style={styles.statNumber}>{publishedQuizzes}</StyledText>
                </View>
                <TrendingUp size={24} color="#10b981" />
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <StyledText style={styles.statTitle}>Total Submissions</StyledText>
                  <StyledText style={styles.statNumber}>{totalSubmissions}</StyledText>
                </View>
                <Users size={24} color="#8b5cf6" />
              </View>

              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <StyledText style={styles.statTitle}>Courses</StyledText>
                  <StyledText style={styles.statNumber}>{uniqueCourses}</StyledText>
                </View>
                <BarChart size={24} color="#f97316" />
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
              </View>
            )}
          </View>
          
          <View style={styles.quizCardsContainer}>
            {filteredQuizzes.map((quiz: any) => {
              const transformedQuiz = transformQuizData(quiz);
              return (
                <TouchableOpacity key={transformedQuiz.id} style={styles.quizCard}>
                  <View style={styles.quizCardHeader}>
                    <View style={styles.quizTypeLabel}>
                      <FileText size={14} color="#3F79FD" />
                      <StyledText style={styles.quizTypeText}>Quiz</StyledText>
                    </View>
                    <MoreVertical size={20} color="#6b7280" />
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
                    <Eye size={20} color="#6b7280" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

          </>
        )}
      </ScrollView>
      
      <QuizCreator
        visible={showQuizCreator}
        onClose={() => setShowQuizCreator(false)}
        onQuizCreated={() => {
          setShowQuizCreator(false);
          fetchQuizzes();
        }}
        courses={courses}
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
  cardsContainer: {
    flexDirection: 'column',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  // New Design Styles
  allQuizzesSection: {
    marginTop: 30,
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
    minWidth: 370,
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
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
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
