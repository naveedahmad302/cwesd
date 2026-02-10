import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Text,
} from 'react-native';
import StyledText from '../../../shared/components/StyledText';
import { X, Plus, Trash2, GripVertical, Check, AlertCircle, ChevronDown, CircleCheckBig } from 'lucide-react-native';
import { useUpdateQuestionMutation, useAddQuestionMutation, useDeleteQuestionMutation } from '../../../store/api/quizzesApi';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  _id: string;
  questionText: string;
  type: 'multiple_options' | 'true_false' | 'short_answer';
  options: Option[];
  points: number;
  explanation: string;
  order: number;
  isNew?: boolean;
}

interface QuizQuestionEditorProps {
  question: QuizQuestion;
  index: number;
  onUpdate: (questionId: string, updatedQuestion: Partial<QuizQuestion>) => void;
  onDelete: (questionId: string) => void;
  onAddQuestion?: () => void;
  quizId?: string;
  getQuestionData?: () => QuizQuestion; // New prop to expose question data
}

const QuizQuestionEditor: React.FC<QuizQuestionEditorProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
  onAddQuestion,
  quizId,
  getQuestionData,
}) => {
  const [editedQuestion, setEditedQuestion] = useState<QuizQuestion>(question);
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const questionTypes = [
    { value: 'multiple_options', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'short_answer', label: 'Short Answer' },
  ];

  const handleUpdateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // For multiple_options and true/false questions, ensure only one option is correct
    if ((editedQuestion.type === 'multiple_options' || editedQuestion.type === 'true_false') && field === 'isCorrect' && value === true) {
      newOptions.forEach((option, i) => {
        if (i !== index) {
          option.isCorrect = false;
        }
      });
    }
    
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  const handleAddOption = () => {
    // For true/false questions, don't allow adding more options
    if (editedQuestion.type === 'true_false' || editedQuestion.type === 'short_answer') {
      return;
    }
    
    setEditedQuestion({
      ...editedQuestion,
      options: [...editedQuestion.options, { text: '', isCorrect: false }],
    });
  };

  const handleRemoveOption = (index: number) => {
    // For true/false and short_answer questions, don't allow removing options
    if (editedQuestion.type === 'true_false' || editedQuestion.type === 'short_answer') {
      return;
    }
    
    // For multiple_options, ensure at least 2 options remain
    const minOptions = editedQuestion.type === 'multiple_options' ? 2 : 2;
    if (editedQuestion.options.length > minOptions) {
      const newOptions = editedQuestion.options.filter((_, i) => i !== index);
      setEditedQuestion({ ...editedQuestion, options: newOptions });
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            // Check if this is a new question (has temporary ID)
            const isNewQuestion = question._id.startsWith('temp_');
            
            if (isNewQuestion) {
              onDelete(question._id);
              showSuccessToast('Question deleted successfully!', 'Success');
            } else {
              // Call API for existing questions
              const result = await deleteQuestion(question._id).unwrap();
              
              if (result.success) {
                onDelete(question._id);
                showSuccessToast('Question deleted successfully!', 'Success');
              } else {
                showErrorToast('Failed to delete question', 'Error');
              }
            }
          } catch (error) {
            console.error('Error deleting question:', error);
            showErrorToast('Failed to delete question. Please try again.', 'Error');
          } finally {
            setIsLoading(false);
          }
        }}
      ]
    );
  };

  // Function to get current question data for parent to save
  const getQuestionDataInternal = useCallback(() => {
    return editedQuestion;
  }, [editedQuestion]);

  // Handle question type change
  const handleTypeChange = (newType: 'multiple_options' | 'true_false' | 'short_answer') => {
    setIsLoading(true);
    let newOptions = [...editedQuestion.options];
    
    // Initialize options based on type
    if (newType === 'true_false') {
      newOptions = [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false }
      ];
    } else if (newType === 'multiple_options') {
      // Ensure only one correct option for multiple choice
      const correctIndex = newOptions.findIndex(opt => opt.isCorrect);
      newOptions = newOptions.map((opt, index) => ({
        ...opt,
        isCorrect: index === correctIndex
      }));
      
      // Ensure at least 2 options for multiple choice
      if (newOptions.length < 2) {
        while (newOptions.length < 2) {
          newOptions.push({ text: '', isCorrect: false });
        }
      }
    } else if (newType === 'short_answer') {
      // For short answer, no options needed
      newOptions = [];
    }
    
    setEditedQuestion({
      ...editedQuestion,
      type: newType,
      options: newOptions
    });
    setShowTypeDropdown(false);
    setTimeout(() => setIsLoading(false), 300); // Small delay for visual feedback
  };

  // Expose the function to parent via callback
  useEffect(() => {
    if (getQuestionData) {
      getQuestionData(getQuestionDataInternal);
    }
  }, [getQuestionData, getQuestionDataInternal]);

  // Always show editable view
  return (
    <View style={styles.questionContainer}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingSpinner}>
            <StyledText style={styles.loadingText}>Loading...</StyledText>
          </View>
        </View>
      )}
      {index === 0 && onAddQuestion && (
        <View style={styles.addQuestionContainer}>
          <TouchableOpacity style={styles.addQuestionButton} onPress={onAddQuestion}>
            <Plus size={16} color="#3F79FD" />
            <Text style={styles.addQuestionButtonText}>Add Question</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.editHeader}>
        <View style={styles.editTitleContainer}>
          <StyledText style={styles.editTitle}>Q{index + 1}</StyledText>
          <View style={styles.typeSelectorContainer}>
            <TouchableOpacity
              style={styles.typeSelector}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <StyledText style={styles.typeSelectorText}>
                {questionTypes.find(type => type.value === editedQuestion.type)?.label || 'Select Type'}
              </StyledText>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
            
            {showTypeDropdown && (
              <View style={styles.dropdownContainer}>
                {questionTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.dropdownItem,
                      editedQuestion.type === type.value && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleTypeChange(type.value as 'multiple_options' | 'true_false' | 'short_answer')}
                  >
                    <StyledText style={[
                      styles.dropdownItemText,
                      editedQuestion.type === type.value && styles.dropdownItemTextSelected
                    ]}>
                      {type.label}
                    </StyledText>
                    {editedQuestion.type === type.value && (
                      <Check size={16} color="black" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.editContent} showsVerticalScrollIndicator={false}>
        

        <View style={styles.inputGroup}>
          <StyledText style={styles.label}>Question Text</StyledText>
          <TextInput
            style={styles.textInput}
            value={editedQuestion.questionText}
            onChangeText={(text) => setEditedQuestion({ ...editedQuestion, questionText: text })}
            placeholder="Enter your question..."
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.sectionHeader}>
            <StyledText style={styles.label}>
              {editedQuestion.type === 'true_false' ? 'Answer Options' : editedQuestion.type === 'short_answer' ? 'Answer' : 'Options'}
            </StyledText>
            {editedQuestion.type !== 'true_false' && editedQuestion.type !== 'short_answer' && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddOption}>
                <Plus size={16} color="#3F79FD" />
                <StyledText style={styles.addButtonText}>Add Option</StyledText>
              </TouchableOpacity>
            )}
          </View>

          {editedQuestion.type !== 'short_answer' && editedQuestion.options.map((option, index) => (
            <View key={index} style={styles.optionInput}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => {
                  if (editedQuestion.type === 'multiple_options') {
                    handleUpdateOption(index, 'isCorrect', !option.isCorrect);
                  } else {
                    handleUpdateOption(index, 'isCorrect', true);
                  }
                }}
              >
                <View style={[
                  styles.radioCircle,
                  option.isCorrect && styles.radioCircleSelected
                ]}>
                  {option.isCorrect && <CircleCheckBig size={12} color="#00A63E" />}
                </View>
              </TouchableOpacity>

              {editedQuestion.type !== 'true_false' && editedQuestion.type !== 'short_answer' ? (
                <TextInput
                  style={[styles.optionTextInput, option.isCorrect && styles.correctOptionInput]}
                  value={option.text}
                  onChangeText={(text) => handleUpdateOption(index, 'text', text)}
                  placeholder={`Option ${index + 1}`}
                />
              ) : editedQuestion.type === 'short_answer' ? (
                <View style={styles.shortAnswerLabel}>
                  <StyledText style={styles.shortAnswerText}>
                    Short answer question - no options needed
                  </StyledText>
                </View>
              ) : (
                <View style={styles.trueFalseLabel}>
                  <StyledText style={styles.trueFalseText}>
                    {option.text}
                  </StyledText>
                </View>
              )}

              {editedQuestion.type !== 'true_false' && editedQuestion.type !== 'short_answer' && (
                <TouchableOpacity
                  style={styles.removeOptionButton}
                  onPress={() => handleRemoveOption(index)}
                  disabled={editedQuestion.options.length <= 2}
                >
                  <Trash2 
                    size={16} 
                    color={editedQuestion.options.length <= 2 ? '#9CA3AF' : '#EF4444'} 
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <StyledText style={styles.label}>Explanation</StyledText>
          <TextInput
            style={styles.textInput}
            value={editedQuestion.explanation}
            onChangeText={(text) => setEditedQuestion({ ...editedQuestion, explanation: text })}
            placeholder="Explain the correct answer..."
            multiline
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <StyledText style={styles.label}>Points</StyledText>
            <TextInput
              style={styles.numberInput}
              value={editedQuestion.points.toString()}
              onChangeText={(text) => setEditedQuestion({ ...editedQuestion, points: parseInt(text) || 0 })}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <StyledText style={styles.label}>Order</StyledText>
            <TextInput
              style={styles.numberInput}
              value={editedQuestion.order.toString()}
              onChangeText={(text) => setEditedQuestion({ ...editedQuestion, order: parseInt(text) || 1 })}
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    backgroundColor: '#3F79FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3F79FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctOption: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  explanationContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  typeText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    flex: 1,
    minWidth: 0,
  },
  editTitle: {
    // backgroundColor:'#00FFCC',
    borderWidth:1,
    borderColor:'#d1d1d1ff',
    borderRadius:100,
    width: 40,
    height:30,
    textAlign: 'center',
    textAlignVertical: 'center',
    // lineHeight: 36,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  editContent: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#3F79FD',
    fontWeight: '500',
  },
  optionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dragHandle: {
    padding: 4,
  },
  correctSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  optionTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  correctOptionInput: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  removeOptionButton: {
    padding: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  editActions: {
    
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3F79FD',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  addQuestionContainer: {
    marginBottom: 16,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#3F79FD',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  addQuestionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3F79FD',
  },
  typeSelectorContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
    minWidth: 0,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 5,
    backgroundColor: '#fff',
  },
  typeSelectorText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#00FFCC',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    // color: '#3F79FD',
    fontWeight: '500',
  },
  radioButton: {
    padding: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    // borderColor: '#3F79FD',
    // backgroundColor: '#F0F9FF',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3F79FD',
  },
  checkboxButton: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3F79FD',
    borderColor: '#3F79FD',
  },
  trueFalseLabel: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  trueFalseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  shortAnswerLabel: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  shortAnswerText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 12,
  },
  loadingSpinner: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default QuizQuestionEditor;
