import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import StyledText from './StyledText';
import { HelpCircle, FileText, Video, CircleCheckBig, BookOpen, ExternalLink, Check, Upload, Clock, Calendar } from 'lucide-react-native';
import { assignmentsAPI, transformSubmissionData } from '../../services/api';
import * as DocumentPicker from '@react-native-documents/picker';

export interface ContentDetailAction {
  id: string;
  title: string;
  type: 'primary' | 'secondary';
  onPress: () => void;
  icon?: React.ReactNode;
}

export interface SubmittedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  uri?: string;
}

export interface ContentDetailCardProps {
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'lecture';
  actions: ContentDetailAction[];
  // For static usage (like your example)
  submissionStatus?: 'new' | 'submitted' | 'draft';
  submittedFiles?: SubmittedFile[];
  submissionDate?: string;
  lastModifiedDate?: string;
  // For dynamic API usage
  moodleId?: string;
  sectionNumber?: string;
  instance?: string;
  assignmentId?: string; // Add assignment ID for request body
  useDynamicData?: boolean;
}

const ContentDetailCard: React.FC<ContentDetailCardProps> = ({ 
  title, 
  description, 
  type, 
  actions,
  submissionStatus = 'new',
  submittedFiles = [],
  submissionDate,
  lastModifiedDate,
  moodleId,
  sectionNumber,
  instance,
  assignmentId,
  useDynamicData = false
}) => {
  const [dynamicSubmissionData, setDynamicSubmissionData] = useState({
    submissionStatus: 'new' as 'new' | 'submitted' | 'draft',
    submittedFiles: [] as SubmittedFile[],
    submissionDate: '',
    lastModifiedDate: '',
  });
  const [rawSubmissionData, setRawSubmissionData] = useState<any>(null); // Store raw API response
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch submission data when using dynamic data
  useEffect(() => {
    if (useDynamicData && moodleId && sectionNumber && instance && type === 'assignment') {
      fetchSubmissionData();
    }
  }, [useDynamicData, moodleId, sectionNumber, instance, type]);

  const fetchSubmissionData = async () => {
    if (!moodleId || !sectionNumber || !instance) {
      console.log('Missing required parameters:', { moodleId, sectionNumber, instance });
      return;
    }

    console.log('Fetching submission data with:', { moodleId, sectionNumber, instance });
    setIsLoading(true);
    try {
      const response = await assignmentsAPI.getMySubmission(moodleId, sectionNumber, instance);
      console.log('API response:', response.data);
      
      // Store raw API response for later reference
      setRawSubmissionData(response.data);
      
      const transformedData = transformSubmissionData(response.data);
      console.log('Transformed data:', transformedData);
      setDynamicSubmissionData(transformedData);
    } catch (error: any) {
      console.error('Error fetching submission data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Handle different error scenarios
      if (error.response?.status === 500) {
        console.log('Server error - using default submission status');
        // Keep default values on server error
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        console.log('Network error - using default submission status');
        // Keep default values on network error
      } else if (error.response?.status === 404) {
        console.log('No submission found - using default submission status');
        // This is expected for new assignments
      } else {
        console.log('Other error - using default submission status');
      }
      
      // In all error cases, keep default values (new assignment)
      setDynamicSubmissionData({
        submissionStatus: 'new',
        submittedFiles: [],
        submissionDate: '',
        lastModifiedDate: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentPicker = async () => {
    try {
      console.log('=== STARTING DOCUMENT PICKER ===');
      
      const result = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const pickedFile = result[0];
        
        console.log('=== PICKER RAW RESULTS ===');
        console.log('PICKER uri:', pickedFile.uri);
        console.log('PICKER name:', pickedFile.name);
        console.log('PICKER type:', pickedFile.type);
        
        // For content:// URIs, we need to handle them differently
        let fileUri = pickedFile.uri;
        let fileData: any = {
          uri: fileUri,
          type: pickedFile.type || 'application/pdf',
          name: pickedFile.name || 'document.pdf',
        };
        
        // If it's a content:// URI, try to read it as a blob first
        if (fileUri.startsWith('content://')) {
          console.log('=== HANDLING CONTENT:// URI ===');
          try {
            // Read the file using fetch to get the actual file data
            const response = await fetch(fileUri);
            const blob = await response.blob();
            
            console.log('=== BLOB CREATED ===');
            console.log('Blob size:', blob.size);
            console.log('Blob type:', blob.type);
            
            // Create a File object from the blob for FormData
            const fileName = pickedFile.name || 'document.pdf';
            const file = new File([blob], fileName, { type: blob.type });
            
            // Use the File object instead of URI for FormData
            fileData = file;
            console.log('=== FILE OBJECT CREATED ===');
            
          } catch (conversionError: any) {
            console.error('Content conversion failed:', conversionError);
            // Fallback to original URI method
            console.log('=== FALLBACK TO ORIGINAL URI ===');
          }
        }
        
        console.log('=== FINAL UPLOAD DATA ===');
        console.log('Upload data type:', typeof fileData);
        console.log('Upload data:', fileData instanceof File ? 'File object' : 'URI object');
        
        const newFile: SubmittedFile = {
          id: Date.now().toString(),
          name: pickedFile.name || 'Unknown File',
          size: formatFileSize(pickedFile.size || 0),
          type: pickedFile.type || 'application/pdf',
          uri: fileUri,
        };

        console.log('=== NORMALIZED FILE OBJECT ===');
        console.log('File object:', {
          id: newFile.id,
          name: newFile.name,
          type: newFile.type,
          uri: newFile.uri,
        });

        // Show success message for file selection
        Alert.alert('File Selected', `File "${pickedFile.name}" selected successfully!`);
        
        // Update the submitted files immediately for better UX
        const updatedFiles = [...currentSubmittedFiles, newFile];
        
        if (useDynamicData) {
          setDynamicSubmissionData(prev => ({
            ...prev,
            submittedFiles: updatedFiles,
            lastModifiedDate: new Date().toLocaleDateString(),
          }));
        }

        // Submit the assignment with the file data
        await submitAssignment([newFile], fileData);
      }
    } catch (error: any) {
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('User cancelled document picker');
      } else {
        console.error('Document picker error:', error);
        Alert.alert('Error', `Failed to pick document: ${error.message}`);
      }
    }
  };

  const submitAssignment = async (files: SubmittedFile[], fileData?: any) => {
    console.log('Submitting assignment with:', { moodleId, sectionNumber, instance, files: files.length });
    
    // Check if submission is allowed based on current status
    if (currentSubmissionStatus === 'submitted' && !isLoading) {
      Alert.alert(
        'Already Submitted', 
        'This assignment has already been submitted. You may need to edit the existing submission instead of creating a new one.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh to show current submission status
              fetchSubmissionData();
            }
          }
        ]
      );
      return;
    }
    
    if (!moodleId || !sectionNumber || !instance) {
      console.log('Missing required parameters for submission');
      Alert.alert('Demo Mode', 'File selected successfully. In production, this would be submitted to the server.');
      // Simulate successful submission in demo mode
      if (useDynamicData) {
        setDynamicSubmissionData(prev => ({
          ...prev,
          submissionStatus: 'submitted',
          submissionDate: new Date().toLocaleDateString(),
          lastModifiedDate: new Date().toLocaleDateString(),
        }));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for file upload - exactly like Postman form-data
      const formData = new FormData();
      
      // Add file (required field)
      if (files.length > 0) {
        const file = files[0];
        
        console.log('=== PRE-UPLOAD FILE VALIDATION ===');
        console.log('File URI before upload:', file.uri);
        console.log('File name:', file.name);
        console.log('File type:', file.type);
        console.log('File data type:', typeof fileData);
        
        // // Use the fileData if available (File object), otherwise use URI method
        // if (fileData instanceof File) {
        //   console.log('=== USING FILE OBJECT ===');
        //   formData.append('file', fileData, fileData.name);
        // } else {
          console.log('=== USING URI METHOD ===');
          // React Native file upload format - works with both file:// and content://
          formData.append('file', {
            uri: file.uri,
            type: file.type,
            name: file.name,  
          } as any);
        // }
        
        console.log('=== FILE ADDED TO FORMDATA ===');
      }

      // Add required form fields (exactly matching Postman)
      formData.append('displayName', `Assignment Submission - ${new Date().toLocaleDateString()}`);
      
      // Debug: Log FormData structure
      console.log('=== FORM DATA STRUCTURE ===');
      console.log('displayName:', `Assignment Submission - ${new Date().toLocaleDateString()}`);
      console.log('File details:', files.length > 0 ? {
        name: files[0].name,
        type: files[0].type,
        uri: files[0].uri
      } : 'No file');
      console.log('FormData ready for upload (Postman style)');
      
      console.log('Submitting to API...');
      
      // Determine the submission strategy based on current status
      let response;
      if (currentSubmissionStatus === 'draft') {
        // Edit existing draft - just update the draft
        console.log('11111 Editing existing draft...', formData);
        
        response = await assignmentsAPI.draftAssignment(moodleId, sectionNumber, instance, formData);
        console.log('2222 Draft updated response:', response.data);
        
        if (response.data?.success) {
          Alert.alert('Success', 'Draft updated successfully!');
          // Refresh the submission data to show updated draft
          fetchSubmissionData();
        } else {
          throw new Error(response.data?.message || 'Failed to update draft');
        }
      } else if (currentSubmissionStatus === 'new' && currentSubmittedFiles.length === 0) {
        // Check if there's an existing submission by looking at the raw API data
        const hasExistingSubmission = rawSubmissionData?.hasSubmission === true;
        
        if (hasExistingSubmission) {
          // Existing submission - draft first, then submit
          console.log('Existing submission detected, creating draft first...');
          try {
            const draftResponse = await assignmentsAPI.draftAssignment(moodleId, sectionNumber, instance, formData);
            console.log('Draft response:', draftResponse.data);
            
            if (draftResponse.data?.success) {
              // Now submit the draft
              response = await assignmentsAPI.submitAssignment(moodleId, sectionNumber, instance, formData);
            } else {
              throw new Error(draftResponse.data?.message || 'Failed to create draft');
            }
          } catch (draftError: any) {
            console.error('Draft API error details:', {
              status: draftError.response?.status,
              statusText: draftError.response?.statusText,
              data: draftError.response?.data,
              message: draftError.message,
              code: draftError.code
            });
            
            // Try to get more detailed error info
            if (draftError.response?.data) {
              console.error('Server error response:', JSON.stringify(draftError.response.data, null, 2));
            }
            
            throw draftError;
          }
        } else {
          // Truly new submission - use submit directly
          console.log('New submission, submitting directly...');
          response = await assignmentsAPI.submitAssignment(moodleId, sectionNumber, instance, formData);
        }
      } else {
        // Existing submission - draft first, then submit
        console.log('Creating draft first...');
        const draftResponse = await assignmentsAPI.draftAssignment(moodleId, sectionNumber, instance, formData);
        console.log('Draft response:', draftResponse.data);
        
        if (draftResponse.data?.success) {
          // Now submit the draft
          response = await assignmentsAPI.submitAssignment(moodleId, sectionNumber, instance, formData);
        } else {
          throw new Error(draftResponse.data?.message || 'Failed to create draft');
        }
      }
      
      console.log('Submission response:', response.data);
      
      // Handle API response according to your specified format
      if (response.data?.success) {
        const { data } = response.data;
        console.log('Submission successful:', data);
        
        // Update local state with API response
        if (useDynamicData) {
          setDynamicSubmissionData(prev => ({
            ...prev,
            submissionStatus: data.status || 'submitted',
            submissionDate: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : new Date().toLocaleDateString(),
            lastModifiedDate: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : new Date().toLocaleDateString(),
          }));
        }

        Alert.alert('Success', response.data.message || 'Assignment submitted successfully!');
        
        // Refresh submission data to get latest state
        fetchSubmissionData();
      } else {
        // Check if it's a submission restriction error
        if (response.data?.message?.includes('already submitted') || 
            response.data?.message?.includes('cannot submit')) {
          Alert.alert(
            'Submission Not Allowed', 
            response.data.message || 'This assignment has already been submitted and cannot be submitted again. You may need to edit the existing submission.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Refresh to show current submission status
                  fetchSubmissionData();
                }
              }
            ]
          );
        } else {
          throw new Error(response.data?.message || 'Submission failed');
        }
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      console.error('Submission error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Check different error scenarios
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        Alert.alert(
          'Demo Mode', 
          'Server is not available. File selected successfully for demo purposes.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Simulate successful submission in demo mode
                if (useDynamicData) {
                  setDynamicSubmissionData(prev => ({
                    ...prev,
                    submissionStatus: 'submitted',
                    submissionDate: new Date().toLocaleDateString(),
                    lastModifiedDate: new Date().toLocaleDateString(),
                  }));
                }
              }
            }
          ]
        );
      } else if (error.response?.status === 500) {
        Alert.alert(
          'Demo Mode', 
          'Server error occurred. File selected successfully for demo purposes.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Simulate successful submission in demo mode
                if (useDynamicData) {
                  setDynamicSubmissionData(prev => ({
                    ...prev,
                    submissionStatus: 'submitted',
                    submissionDate: new Date().toLocaleDateString(),
                    lastModifiedDate: new Date().toLocaleDateString(),
                  }));
                }
              }
            }
          ]
        );
      } else if (error.response?.status === 400) {
        Alert.alert('Error', error.response?.data?.message || 'Invalid file format or size. Please check your submission.');
      } else if (error.response?.status === 401) {
        Alert.alert('Error', 'You are not authorized to submit this assignment.');
      } else if (error.response?.status === 403) {
        Alert.alert('Error', 'Assignment submission is not allowed at this time.');
      } else if (error.response?.status === 404) {
        Alert.alert('Error', 'Assignment not found. Please refresh and try again.');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to submit assignment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Use dynamic data if enabled, otherwise use static props
  const currentSubmissionStatus = useDynamicData ? dynamicSubmissionData.submissionStatus : submissionStatus;
  const currentSubmittedFiles = useDynamicData ? dynamicSubmissionData.submittedFiles : submittedFiles;
  const currentSubmissionDate = useDynamicData ? dynamicSubmissionData.submissionDate : submissionDate;
  const currentLastModifiedDate = useDynamicData ? dynamicSubmissionData.lastModifiedDate : lastModifiedDate;
  const getIcon = () => {
    switch (type) {
      case 'quiz':
        return <HelpCircle size={48} color="#E56B8C" />;
      case 'assignment':
        return <FileText size={48} color="#E56B8C" />;
      case 'lecture':
        return <Video size={48} color="#E56B8C" />;
      default:
        return <FileText size={48} color="#E56B8C" />;
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'quiz':
        return '#FFE5E5';
      case 'assignment':
        return '#FFF4E5';
      case 'lecture':
        return '#E5F5E5';
      default:
        return '#E5F3FF';
    }
  };

  const primaryActions = actions.filter(action => action.type === 'primary');
  const secondaryActions = actions.filter(action => action.type === 'secondary');
  const isAssignment = type === 'assignment';

  // Override the submit assignment action to use document picker
  const enhancedActions = actions.map(action => {
    if (action.id === 'submit' && isAssignment) {
      // Change button text and behavior based on submission status
      const isDraft = currentSubmissionStatus === 'draft';
      const isSubmitted = currentSubmissionStatus === 'submitted';
      
      return {
        ...action,
        title: isDraft ? 'Edit Assignment' : isSubmitted ? 'View Submission' : action.title,
        onPress: isSubmitted ? () => {
          // For submitted assignments, just show the submission details
          console.log('Viewing submitted assignment');
        } : handleDocumentPicker,
      };
    }
    return action;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Icon Section */}
        <View style={[styles.iconContainer, { backgroundColor: getIconBackground() }]}>
          {getIcon()}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <StyledText style={styles.title}>{title}</StyledText>
          <StyledText style={styles.description}>{description}</StyledText>
        </View>

        {isAssignment && (
          <View style={styles.actionsContainer}>
            {enhancedActions.filter(action => action.type === 'primary' && action.id !== 'open-moodle' && action.id !== 'mark-complete').map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.assignmentButton,
                  index === 0 ? styles.primaryButton : styles.whiteButton,
                ]}
                onPress={action.onPress}
                disabled={isSubmitting}
              >
                {action.icon && <View style={styles.buttonIcon}>{action.icon}</View>}
                <StyledText
                  style={index === 0 ? styles.primaryButtonText : styles.whiteButtonText}
                >
                  {isSubmitting && action.id === 'submit' ? 
                    (currentSubmissionStatus === 'draft' ? 'Updating...' : 'Submitting...') : 
                    action.title
                  }
                </StyledText>
                {isSubmitting && action.id === 'submit' && (
                  <ActivityIndicator size="small" color="#ffffff" style={styles.buttonLoading} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Assignment Submission Card */}
        {isAssignment && (
          <View style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <StyledText style={styles.submissionTitle}>My Submission</StyledText>
              {isLoading && (
                <ActivityIndicator size="small" color="#E56B8C" style={styles.loadingIndicator} />
              )}
            </View>
            
            {!isLoading && (
              <>
                {currentSubmissionStatus === 'submitted' ? (
                  // Submitted Design - Based on your screenshot
                  <View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>Status:</StyledText>
                      <View style={[styles.badge, styles.submittedBadge]}>
                        <StyledText style={styles.submittedBadgeText}>submitted</StyledText>
                      </View>
                    </View>
                    
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>Actions:</StyledText>
                      <StyledText style={styles.noActionsText}>-</StyledText>
                    </View>
                    
                    {currentSubmittedFiles && currentSubmittedFiles.length > 0 && (
                      <View style={styles.submittedFilesSection}>
                        <StyledText style={styles.submissionLabel}>Submitted Files:</StyledText>
                        {currentSubmittedFiles.map((file) => (
                          <View key={file.id} style={styles.fileItem}>
                            <View style={styles.fileInfo}>
                              <FileText size={16} color="#6B7280" />
                              <View style={styles.fileDetails}>
                                <StyledText style={styles.fileName}>{file.name}</StyledText>
                                <StyledText style={styles.fileMeta}>{file.size} • {file.type}</StyledText>
                              </View>
                            </View>
                            {file.url && (
                              <TouchableOpacity 
                                style={styles.externalLinkIcon}
                                onPress={() => {
                                  // Handle file download/view
                                  console.log('Opening file:', file.url);
                                }}
                              >
                                <ExternalLink size={16} color="#6B7280" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={styles.datesRow}>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>Created:</StyledText>
                        <StyledText style={styles.dateValue}>{currentSubmissionDate || '29/01/2026'}</StyledText>
                      </View>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>Modified:</StyledText>
                        <StyledText style={styles.dateValue}>{currentLastModifiedDate || '29/01/2026'}</StyledText>
                      </View>
                    </View>
                  </View>
                ) : currentSubmissionStatus === 'draft' ? (
                  // Draft Design - For assignments that have been drafted but not submitted
                  <View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>Status:</StyledText>
                      <View style={[styles.badge, styles.draftBadge]}>
                        <StyledText style={styles.draftBadgeText}>draft</StyledText>
                      </View>
                    </View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>Actions:</StyledText>
                      <View style={[styles.badge, styles.actionBadge]}>
                        <StyledText style={styles.actionBadgeText}>Can Edit</StyledText>
                      </View>
                    </View>
                    
                    {currentSubmittedFiles && currentSubmittedFiles.length > 0 && (
                      <View style={styles.submittedFilesSection}>
                        <StyledText style={styles.submissionLabel}>Draft Files:</StyledText>
                        {currentSubmittedFiles.map((file) => (
                          <View key={file.id} style={styles.fileItem}>
                            <View style={styles.fileInfo}>
                              <FileText size={16} color="#6B7280" />
                              <View style={styles.fileDetails}>
                                <StyledText style={styles.fileName}>{file.name}</StyledText>
                                <StyledText style={styles.fileMeta}>{file.size} • {file.type}</StyledText>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={styles.datesRow}>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>Created:</StyledText>
                        <StyledText style={styles.dateValue}>{currentSubmissionDate || '30/01/2026'}</StyledText>
                      </View>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>Modified:</StyledText>
                        <StyledText style={styles.dateValue}>{currentLastModifiedDate || '30/01/2026'}</StyledText>
                      </View>
                    </View>
                  </View>
                ) : (
                  // New/Not Submitted Design - Current design
                  <View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>Status:</StyledText>
                      <View style={[styles.badge, styles.statusBadge]}>
                        <StyledText style={styles.badgeText}>new</StyledText>
                      </View>
                    </View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>Actions:</StyledText>
                      <View style={[styles.badge, styles.actionBadge]}>
                        <StyledText style={styles.actionBadgeText}>Can Edit</StyledText>
                      </View>
                    </View>
                    
                    <View style={styles.datesRow}>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>Created:</StyledText>
                        <StyledText style={styles.dateValue}>30/01/2026</StyledText>
                      </View>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>Modified:</StyledText>
                        <StyledText style={styles.dateValue}>30/01/2026</StyledText>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* External Action Buttons - Outside the card */}
      {isAssignment && (
        <View style={styles.externalActionsContainer}>
          {/* Open in Moodle Button */}
          <TouchableOpacity
            style={[styles.externalActionButton, styles.primaryExternalButton]}
            onPress={() => {
              const openMoodleAction = actions.find(action => action.id === 'open-moodle');
              if (openMoodleAction) {
                openMoodleAction.onPress();
              }
            }}
          >
            <View style={styles.buttonIcon}>
              <ExternalLink size={16} color="#ffffff" />
            </View>
            <StyledText style={styles.primaryButtonText}>
              Open in Moodle
            </StyledText>
          </TouchableOpacity>
          
          {/* Mark Complete Button */}
          <TouchableOpacity
            style={[styles.externalActionButton, styles.whiteExternalButton]}
            onPress={() => {
              const markCompleteAction = actions.find(action => action.id === 'mark-complete');
              if (markCompleteAction) {
                markCompleteAction.onPress();
              }
            }}
          >
            <View style={styles.buttonIcon}>
              <CircleCheckBig  size={16} color="#111827" />
            </View>
            <StyledText style={styles.whiteButtonText}>
              Mark Complete
            </StyledText>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
  },
  assignmentActionsRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  assignmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 8,
    // borderWidth: 1,
    minWidth: 156,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
    // elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#E56B8C',
    shadowColor: '#E56B8C',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  whiteButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  whiteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: 'black',
  },
  secondaryButton: {
    backgroundColor: '#E56B8C',
    borderWidth: 1,
    borderColor: '#E56B8C',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  externalActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  externalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: '100%',
  },
  primaryExternalButton: {
    backgroundColor: '#E56B8C',
    shadowColor: '#E56B8C',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  whiteExternalButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DFE6E9',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  submissionCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#DFE6E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  submissionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  submissionInfo: {
    marginBottom: 16,
  },
  submissionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  submissionInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  submissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E56B8C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  submissionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  submissionLabel: {
    fontSize: 14,
    color: '#374151',
  },
  badge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
  },
  actionBadge: {
    backgroundColor: '#FEF3C7',
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateColumn: {
    flexDirection: 'column',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 12,
    color: '#111827',
  },
  // Submitted Design Styles
  submittedBadge: {
    backgroundColor: '#D1FAE5',
  },
  submittedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  // Draft Design Styles
  draftBadge: {
    backgroundColor: '#FEF3C7',
  },
  draftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  noActionsText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  submittedFilesSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 8,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  externalLinkIcon: {
    padding: 4,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  buttonLoading: {
    marginLeft: 8,
  },
});

export default ContentDetailCard;
