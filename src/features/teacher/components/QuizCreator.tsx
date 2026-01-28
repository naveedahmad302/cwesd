import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import StyledText from '../../../shared/components/StyledText';
import { Plus, X, Clock, Target, FileText, Save, Eye, EyeOff, ArrowLeft, ChevronDown, Calendar } from 'lucide-react-native';
import { quizzesAPI } from '../../../services/api';

interface QuizCreatorProps {
  visible: boolean;
  onClose: () => void;
  onQuizCreated: () => void;
  courses: string[];
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ visible, onClose, onQuizCreated, courses }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('2');
  const [totalPoints, setTotalPoints] = useState('0');
  const [pointsPerQuestion, setPointsPerQuestion] = useState('2');
  const [loading, setLoading] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [courseDropdownVisible, setCourseDropdownVisible] = useState(false);
  const [sectionDropdownVisible, setSectionDropdownVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [availableFrom, setAvailableFrom] = useState(new Date());
  const [availableUntil, setAvailableUntil] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isAvailableFromPicker, setIsAvailableFromPicker] = useState(true);
  const [publishImmediately, setPublishImmediately] = useState(false);

  const handleCreateQuiz = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a quiz title');
      return;
    }
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    try {
      setLoading(true);
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        course: selectedCourse,
        durationMinutes: Number(duration),
        maxAttempts: Number(maxAttempts),
        totalPoints: Number(totalPoints),
        pointsPerQuestion: Number(pointsPerQuestion),
        shuffleQuestions,
        shuffleOptions,
        showCorrectAnswers,
        allowReview,
        status: 'Draft',
        totalQuestions
      };

      const response = await quizzesAPI.createQuiz(quizData);

      if (response.data.success) {
        Alert.alert('Success', 'Quiz created successfully!');
        resetForm();
        onQuizCreated();
        onClose();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      Alert.alert('Error', 'Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedCourse('');
    setDuration('60');
    setMaxAttempts('2');
    setTotalPoints('0');
    setPointsPerQuestion('2');
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setShowCorrectAnswers(true);
    setAllowReview(true);
    setTotalQuestions(0);
    setAvailableFrom(new Date());
    setAvailableUntil(new Date());
    setSelectedSection('');
    setPublishImmediately(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleConfirmDateTime = (date: Date) => {
    if (isAvailableFromPicker) {
      setAvailableFrom(date);
    } else {
      setAvailableUntil(date);
    }
    setDatePickerVisible(false);
  };

  const showDatePicker = (isFrom: boolean) => {
    // For now, just show current date/time
    // TODO: Implement actual date picker
    const currentDate = new Date();
    if (isFrom) {
      setAvailableFrom(currentDate);
    } else {
      setAvailableUntil(currentDate);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/,/, '');
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose} disabled={loading}>
            <ArrowLeft size={20} color="#666" />
          </TouchableOpacity>
          <StyledText style={styles.title}>Quiz Summary</StyledText>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={loading}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


          <View style={styles.formSection}>
            <StyledText style={styles.sectionTitle}>Quiz Details</StyledText>

            <View style={styles.formGroup}>
              <StyledText style={styles.label}>Quiz Title *</StyledText>
              <TextInput
                style={styles.input}
                placeholder="Enter quiz title"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <StyledText style={styles.label}>Description</StyledText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter quiz description (optional)"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <StyledText style={styles.label}>Course *</StyledText>
              <View style={styles.dropdownsRow}>
                <View style={[styles.dropdownContainer, styles.halfWidthDropdown]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setCourseDropdownVisible(!courseDropdownVisible)}
                    disabled={loading}
                  >
                    <StyledText style={[
                      styles.dropdownButtonText,
                      !selectedCourse && styles.placeholderText
                    ]}>
                      {selectedCourse || 'Select a course'}
                    </StyledText>
                    <ChevronDown
                      size={16}
                      color="#666"
                      style={[styles.dropdownIcon, courseDropdownVisible && styles.dropdownIconRotated]}
                    />
                  </TouchableOpacity>

                  {courseDropdownVisible && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                        {courses.filter(course => course !== 'All Courses').map((course) => (
                          <TouchableOpacity
                            key={course}
                            style={[
                              styles.dropdownOption,
                              selectedCourse === course && styles.selectedDropdownOption
                            ]}
                            onPress={() => {
                              setSelectedCourse(course);
                              setCourseDropdownVisible(false);
                            }}
                            disabled={loading}
                          >
                            <StyledText style={[
                              styles.dropdownOptionText,
                              selectedCourse === course && styles.selectedDropdownOptionText
                            ]}>
                              {course}
                            </StyledText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={[styles.dropdownContainer, styles.halfWidthDropdown]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setSectionDropdownVisible(!sectionDropdownVisible)}
                    disabled={loading}
                  >
                    <StyledText style={[
                      styles.dropdownButtonText,
                      !selectedSection && styles.placeholderText
                    ]}>
                      {selectedSection || 'Select section'}
                    </StyledText>
                    <ChevronDown
                      size={16}
                      color="#666"
                      style={[styles.dropdownIcon, sectionDropdownVisible && styles.dropdownIconRotated]}
                    />
                  </TouchableOpacity>

                  {sectionDropdownVisible && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                        {['Section A', 'Section B', 'Section C', 'Section D'].map((section) => (
                          <TouchableOpacity
                            key={section}
                            style={[
                              styles.dropdownOption,
                              selectedSection === section && styles.selectedDropdownOption
                            ]}
                            onPress={() => {
                              setSelectedSection(section);
                              setSectionDropdownVisible(false);
                            }}
                            disabled={loading}
                          >
                            <StyledText style={[
                              styles.dropdownOptionText,
                              selectedSection === section && styles.selectedDropdownOptionText
                            ]}>
                              {section}
                            </StyledText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <StyledText style={styles.label}>Available From</StyledText>
                <TouchableOpacity style={styles.dateTimeInput} onPress={() => showDatePicker(true)} disabled={loading}>
                  <StyledText style={styles.dateTimeText}>
                    {formatDateTime(availableFrom)}
                  </StyledText>
                  <Calendar size={18} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <StyledText style={styles.label}>Available Until</StyledText>
                <TouchableOpacity style={styles.dateTimeInput} onPress={() => showDatePicker(false)} disabled={loading}>
                  <StyledText style={styles.dateTimeText}>
                    {formatDateTime(availableUntil)}
                  </StyledText>
                  <Calendar size={18} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <StyledText style={styles.label}>Duration (min) *</StyledText>
                <TextInput
                  style={styles.input}
                  placeholder="60"
                  placeholderTextColor="#999"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <StyledText style={styles.label}>Max Attempts *</StyledText>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  placeholderTextColor="#999"
                  value={maxAttempts}
                  onChangeText={setMaxAttempts}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.row}>


              <View style={[styles.formGroup, styles.halfWidth]}>
                <StyledText style={styles.label}>Points per Question *</StyledText>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  placeholderTextColor="#999"
                  value={pointsPerQuestion}
                  onChangeText={setPointsPerQuestion}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

            </View>
            <View style={styles.immediatQuiz}>
              <Switch
                value={publishImmediately}
                onValueChange={setPublishImmediately}
                disabled={loading}
                trackColor={{ false: '#e5e7eb', true: '#E56B8C' }}
                thumbColor={publishImmediately ? '#fff' : '#f4f3f4'}
              />
              <StyledText style={styles.settingLabel}>Publish quiz immediately</StyledText>
            </View>
          </View>

          {/* <View style={styles.separatorLine} /> */}

          <View style={styles.settingsSection}>
            <StyledText style={styles.sectionTitle}>Quiz Summary</StyledText>
            <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <StyledText style={styles.summaryLabel}>Total Questions</StyledText>
                <StyledText style={styles.summaryValue}>{totalQuestions}</StyledText>
              </View>
              <View style={styles.summaryItem}>
                <StyledText style={styles.summaryLabel}>Total Points</StyledText>
                <StyledText style={styles.summaryValue}>{totalPoints}</StyledText>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <StyledText style={styles.summaryLabel}>Duration</StyledText>
                <StyledText style={styles.summaryValue}>{duration} min</StyledText>
              </View>
              <View style={styles.summaryItem}>
                <StyledText style={styles.summaryLabel}>Max Attempts</StyledText>
                <StyledText style={styles.summaryValue}>{maxAttempts}</StyledText>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <StyledText style={styles.summaryLabel}>Points per Question</StyledText>
                <StyledText style={styles.summaryValue}>{pointsPerQuestion}</StyledText>
              </View>
              <View style={styles.summaryItem}>
                <StyledText style={styles.summaryLabel}>Status</StyledText>
                <StyledText style={styles.statusDraft}>Draft</StyledText>
              </View>
            </View>

          </View>
           <View style={styles.separatorLine} />
            <StyledText style={styles.sectionTitle}>Quiz Settings</StyledText>

            <View style={styles.settingItem}>
              <StyledText style={styles.settingLabel}>Shuffle Questions</StyledText>
              <Switch
                value={shuffleQuestions}
                onValueChange={setShuffleQuestions}
                disabled={loading}
                trackColor={{ false: '#e5e7eb', true: '#E56B8C' }}
                thumbColor={shuffleQuestions ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <StyledText style={styles.settingLabel}>Shuffle Options</StyledText>
              <Switch
                value={shuffleOptions}
                onValueChange={setShuffleOptions}
                disabled={loading}
                trackColor={{ false: '#e5e7eb', true: '#E56B8C' }}
                thumbColor={shuffleOptions ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <StyledText style={styles.settingLabel}>Show Correct Answers</StyledText>
              <Switch
                value={showCorrectAnswers}
                onValueChange={setShowCorrectAnswers}
                disabled={loading}
                trackColor={{ false: '#e5e7eb', true: '#E56B8C' }}
                thumbColor={showCorrectAnswers ? '#fff' : '#f4f3f4'}
              />
            </View>



            <View style={styles.settingItem}>
              <StyledText style={styles.settingLabel}>Allow Review</StyledText>
              <Switch
                value={allowReview}
                onValueChange={setAllowReview}
                disabled={loading}
                trackColor={{ false: '#e5e7eb', true: '#E56B8C' }}
                thumbColor={allowReview ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
          <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <ArrowLeft size={16} color="#666" />
            <StyledText style={styles.cancelButtonText}>Cancel</StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.previewButton]}
            disabled={loading}
          >
            <Eye size={16} color="#666" />
            <StyledText style={styles.previewButtonText}>Preview</StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateQuiz}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FileText size={16} color="#fff" />
                <StyledText style={styles.createButtonText}>Create Quiz</StyledText>
              </>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>

        
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  summarySection: {
    // backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 5,
    // marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'black',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  statusDraft: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formSection: {
    marginBottom: 20,
  },
  settingsSection: {
    marginBottom: 20,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: 'black',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  courseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectedCourseChip: {
    backgroundColor: '#E56B8C',
    borderColor: '#E56B8C',
  },
  courseChipText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  selectedCourseChipText: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  immediatQuiz: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 14,
    color: 'black',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'column',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  previewButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  createButton: {
    backgroundColor: '#E56B8C',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Dropdown styles
  dropdownsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  halfWidthDropdown: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: 'black',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedDropdownOption: {
    backgroundColor: '#E56B8C',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: 'black',
  },
  selectedDropdownOptionText: {
    color: '#fff',
  },
  // Date/Time picker styles
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 14,
    color: 'black',
    flex: 1,
  },
});

export default QuizCreator;
