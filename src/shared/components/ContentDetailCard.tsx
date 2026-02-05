import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import StyledText from './StyledText';
import {
  HelpCircle,
  FileText,
  Video,
  CircleCheckBig,
  ExternalLink,
} from 'lucide-react-native';
import {
  useLazyGetMySubmissionQuery,
  useDraftAssignmentMutation,
  useSubmitAssignmentMutation,
  useLazyGetCourseSectionContentsQuery,
} from '../../store/api';
import { transformSubmissionData } from '../../utils/moodle';
import * as DocumentPicker from '@react-native-documents/picker';
import { getMimeTypeFromPath } from '../../utils/mimeTypes';

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
  assignmentId?: string; // Add assignment ID for request body (module id from contents API)
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
  assignmentId, // Module id from contents API
  useDynamicData = false,
}) => {
  const [dynamicSubmissionData, setDynamicSubmissionData] = useState({
    submissionStatus: 'new' as 'new' | 'submitted' | 'draft',
    submittedFiles: [] as SubmittedFile[],
    submissionDate: '',
    lastModifiedDate: '',
  });
  const [rawSubmissionData, setRawSubmissionData] = useState<unknown>(null);
  const [getMySubmission, { isLoading, isUninitialized }] =
    useLazyGetMySubmissionQuery();
  const [getCourseSectionContents] = useLazyGetCourseSectionContentsQuery();
  const [draftAssignment] = useDraftAssignmentMutation();
  const [submitAssignmentMutation] = useSubmitAssignmentMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // Track which file is being downloaded
  const isLoadingSubmission =
    isLoading || (isUninitialized === false && isLoading);

  // Function to find assignment module ID from contents API
  const findAssignmentModuleId = async () => {
    if (!moodleId || !sectionNumber || !instance) {
      console.log('Missing parameters for finding assignment module ID');
      return null;
    }

    try {
      console.log('=== FETCHING COURSE CONTENTS ===');
      console.log('Course ID:', moodleId);
      console.log('Section Number:', sectionNumber);
      console.log('Looking for instance:', instance);

      const contentsResponse = await getCourseSectionContents({
        courseId: moodleId,
        sectionNumber: sectionNumber,
      }).unwrap();

      console.log('Contents response:', contentsResponse);

      if (contentsResponse?.success && contentsResponse?.data?.modules) {
        const assignmentModule = contentsResponse.data.modules.find(
          (module: any) => 
            module.modname === 'assign' && 
            module.instance.toString() === instance.toString()
        );

        if (assignmentModule) {
          console.log('=== FOUND ASSIGNMENT MODULE ===');
          console.log('Module ID:', assignmentModule.id);
          console.log('Module Name:', assignmentModule.name);
          console.log('Instance:', assignmentModule.instance);
          return assignmentModule.id.toString();
        } else {
          console.log('Assignment module not found for instance:', instance);
          return null;
        }
      } else {
        console.log('Invalid contents response');
        return null;
      }
    } catch (error) {
      console.error('Error fetching course contents:', error);
      return null;
    }
  };

  const fetchSubmissionData = useCallback(async () => {
    if (!moodleId || !sectionNumber || !instance) {
      console.log('Missing required parameters:', {
        moodleId,
        sectionNumber,
        instance,
      });
      return;
    }

    console.log('Fetching submission data with:', {
      moodleId,
      sectionNumber,
      instance,
    });
    console.log('=== MY-SUBMISSION API REQUEST ===');
    console.log('URL:', `/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/my-submission`);
    console.log('=== END MY-SUBMISSION REQUEST ===');
    try {
      const data = await getMySubmission({
        moodleId,
        sectionNumber,
        instance,
      }).unwrap();
      console.log('API response:', data);

      setRawSubmissionData(data);
      const transformedData = transformSubmissionData(
        data as import('../../types/moodle.types').AssignmentSubmissionResponse,
      );
      console.log('Transformed data:', transformedData);
      setDynamicSubmissionData(transformedData);
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { message?: string };
        message?: string;
        code?: string;
      };
      console.error('Error fetching submission data:', error);
      console.error('Error details:', {
        status: err?.status,
        data: err?.data,
        message: err?.message,
        code: err?.code,
      });

      // Specific network error handling
      if (err?.message?.includes('Network request failed')) {
        console.log('🌐 NETWORK ERROR: Unable to reach the API server');
        console.log('Possible causes:');
        console.log('1. Server is down or not responding');
        console.log('2. No internet connection');
        console.log('3. API endpoint URL is incorrect');
        console.log('4. CORS or firewall issues');
      }

      if (err?.status === 500) {
        console.log('Server error - using default submission status');
      } else if (
        err?.code === 'FETCH_ERROR' ||
        err?.message?.includes('Network')
      ) {
        console.log('Network error - using default submission status');
      } else if (err?.status === 404) {
        console.log('No submission found - using default submission status');
      } else {
        console.log('Other error - using default submission status');
      }

      setDynamicSubmissionData({
        submissionStatus: 'new',
        submittedFiles: [],
        submissionDate: '',
        lastModifiedDate: '',
      });
    }
  }, [moodleId, sectionNumber, instance, getMySubmission]);

  // Fetch submission data when using dynamic data
  useEffect(() => {
    if (
      useDynamicData &&
      moodleId &&
      sectionNumber &&
      instance &&
      type === 'assignment'
    ) {
      fetchSubmissionData();
    }
  }, [
    useDynamicData,
    moodleId,
    sectionNumber,
    instance,
    type,
    fetchSubmissionData,
  ]);

  const handleDocumentPicker = async () => {
    try {
      // Add a small delay to ensure any previous UI operations are complete
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      
      const result = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const pickedFile = result[0];

        // For content:// URIs, we need to handle them differently
        let fileUri = pickedFile.uri;
        let fileData: any = {
          uri: fileUri,
          type:
            pickedFile.type ||
            getMimeTypeFromPath(pickedFile.uri || pickedFile.name || ''),
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
        console.log(
          'Upload data:',
          fileData instanceof File ? 'File object' : 'URI object',
        );

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

        // Update the submitted files immediately for better UX
        const updatedFiles = [...currentSubmittedFiles, newFile];

        if (useDynamicData) {
          setDynamicSubmissionData(prev => ({
            ...prev,
            submittedFiles: updatedFiles,
            lastModifiedDate: new Date().toLocaleDateString(),
          }));
        }

        // Save the assignment as draft with the file data
        await saveDraftAssignment([newFile], fileData);
      }
    } catch (error: any) {
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('User cancelled document picker');
      } else if (error.message && error.message.includes('Current activity is null')) {
        console.error('Activity null error:', error);
        Alert.alert(
          'Error',
          'Unable to open file picker. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                // Retry after a short delay
                setTimeout(() => {
                  handleDocumentPicker();
                }, 500);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        console.error('Document picker error:', error);
        Alert.alert('Error', `Failed to pick document: ${error.message}`);
      }
    }
  };

  const saveDraftAssignment = async (files: SubmittedFile[], fileData?: any) => {
    console.log('Saving draft assignment with:', {
      moodleId,
      sectionNumber,
      instance,
      files: files.length,
    });

    // Find the assignment module ID from contents API
    const moduleAssignmentId = await findAssignmentModuleId();
    const finalAssignmentId = assignmentId || moduleAssignmentId;
    
    console.log('Using assignment ID:', {
      prop: assignmentId,
      fromAPI: moduleAssignmentId,
      final: finalAssignmentId,
    });

    if (!moodleId || !sectionNumber || !instance) {
      console.log('Missing required parameters for draft');
      Alert.alert(
        'Demo Mode',
        'File selected successfully. In production, this would be saved as a draft.',
      );
      // Simulate successful draft save in demo mode
      if (useDynamicData) {
        setDynamicSubmissionData(prev => ({
          ...prev,
          submissionStatus: 'draft',
          lastModifiedDate: new Date().toLocaleDateString(),
        }));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add file (required field)
      if (files.length > 0) {
        const file = files[0];
        formData.append('file', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
      }

      // Add required form fields
      formData.append(
        'displayName',
        `Assignment Draft - ${new Date().toLocaleDateString()}`,
      );
      
      // Add assignment ID if available (module id from contents API)
      if (finalAssignmentId) {
        formData.append('id', finalAssignmentId);
        console.log('Added assignment ID to draft FormData:', finalAssignmentId);
      }
      
      // Also add instance for compatibility
      if (instance) {
        formData.append('instance', instance);
      }

      console.log('Saving draft to API...');
      const payload = { moodleId, sectionNumber, instance, data: formData };
      const result = await draftAssignment(payload).unwrap();

      console.log('Draft save response:', result);

      if (result?.success) {
        if (useDynamicData) {
          setDynamicSubmissionData(prev => ({
            ...prev,
            submissionStatus: 'draft',
            lastModifiedDate: new Date().toLocaleDateString(),
          }));
        }

        Alert.alert(
          'Success',
          'Assignment saved as draft successfully!',
        );
        fetchSubmissionData();
      } else {
        throw new Error(result?.message || 'Failed to save draft');
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { message?: string };
        message?: string;
        code?: string;
      };
      console.error('Draft save error:', error);

      if (err?.code === 'FETCH_ERROR' || err?.message?.includes('Network')) {
        Alert.alert(
          'Demo Mode',
          'Server is not available. File saved as draft for demo purposes.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (useDynamicData) {
                  setDynamicSubmissionData(prev => ({
                    ...prev,
                    submissionStatus: 'draft',
                    lastModifiedDate: new Date().toLocaleDateString(),
                  }));
                }
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          (err?.data as { message?: string })?.message ||
            'Failed to save draft. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFinalAssignment = async () => {
    // Show confirmation dialog before final submission
    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit this assignment? You will not be able to make changes after submission.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            await submitAssignment(currentSubmittedFiles, null);
          },
        },
      ]
    );
  };

  const submitAssignment = async (files: SubmittedFile[], fileData?: any) => {
    console.log('Submit assignment called with:', {
      moodleId,
      sectionNumber,
      instance,
      files: files.length,
    });

    // Find the assignment module ID from contents API
    const moduleAssignmentId = await findAssignmentModuleId();
    const finalAssignmentId = assignmentId || moduleAssignmentId;
    
    console.log('Using assignment ID for submission:', {
      prop: assignmentId,
      fromAPI: moduleAssignmentId,
      final: finalAssignmentId,
    });

    // Check if we have the required parameters
    if (!moodleId || !sectionNumber || !instance) {
      console.log('Missing required parameters for submission');
      Alert.alert(
        'Demo Mode',
        'File selected successfully. In production, this would be submitted to the server.',
      );
      return;
    }

    if (!finalAssignmentId) {
      Alert.alert('Error', 'Assignment ID not found. Cannot submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      // According to the API specification, we only need to send the assignment ID
      const payload = { 
        moodleId, 
        sectionNumber, 
        instance,
        data: { id: finalAssignmentId }
      };
      
      console.log('=== SUBMISSION PAYLOAD ===');
      console.log('Sending payload:', payload);
      console.log('Assignment ID:', finalAssignmentId);
      console.log('=== END PAYLOAD ===');
      
      const result = await submitAssignmentMutation(payload).unwrap();
      console.log('Assignment submitted successfully:', result);

      if (result?.success) {
        const data = result.data as
          | { status?: string; submittedAt?: string }
          | undefined;
        console.log('Submission successful:', data);

        if (useDynamicData && data) {
          setDynamicSubmissionData(prev => ({
            ...prev,
            submissionStatus:
              (data.status as 'new' | 'submitted' | 'draft') || 'submitted',
            submissionDate: data.submittedAt
              ? new Date(data.submittedAt).toLocaleDateString()
              : new Date().toLocaleDateString(),
            lastModifiedDate: data.submittedAt
              ? new Date(data.submittedAt).toLocaleDateString()
              : new Date().toLocaleDateString(),
          }));
        }

        Alert.alert(
          'Success',
          result.message || 'Assignment submitted successfully!',
        );
        fetchSubmissionData();
      } else {
        if (
          result?.message?.includes('already submitted') ||
          result?.message?.includes('cannot submit')
        ) {
          Alert.alert(
            'Submission Not Allowed',
            result.message ||
              'This assignment has already been submitted and cannot be submitted again. You may need to edit the existing submission.',
            [{ text: 'OK', onPress: () => fetchSubmissionData() }],
          );
        } else {
          throw new Error(result?.message || 'Submission failed');
        }
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { message?: string };
        message?: string;
        code?: string;
      };
      console.error('Submission error:', error);
      console.error('Submission error details:', {
        status: err?.status,
        data: err?.data,
        message: err?.message,
        code: err?.code,
      });

      if (err?.code === 'FETCH_ERROR' || err?.message?.includes('Network')) {
        Alert.alert(
          'Demo Mode',
          'Server is not available. Assignment selected successfully for demo purposes.',
        );
      } else {
        Alert.alert(
          'Error',
          err?.data?.message || err?.message || 'Failed to submit assignment',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSubmissionStatus = () => {
    const currentData = useDynamicData ? dynamicSubmissionData : {
      submissionStatus,
      submittedFiles,
      submissionDate,
      lastModifiedDate,
    };

    if (currentData.submissionStatus === 'submitted') {
      return (
        <View style={styles.submissionStatus}>
          <CircleCheckBig size={16} color="#10b981" />
          <StyledText style={styles.submissionText}>
            Submitted on {currentData.submissionDate}
          </StyledText>
        </View>
      );
    }

    if (currentData.submissionStatus === 'draft') {
      return (
        <View style={styles.submissionStatus}>
          <StyledText style={styles.draftText}>
            Draft last modified: {currentData.lastModifiedDate}
          </StyledText>
        </View>
      );
    }

    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Use dynamic data if enabled, otherwise use static props
  const currentSubmissionStatus = useDynamicData
    ? dynamicSubmissionData.submissionStatus
    : submissionStatus;
  const currentSubmittedFiles = useDynamicData
    ? dynamicSubmissionData.submittedFiles
    : submittedFiles;
  const currentSubmissionDate = useDynamicData
    ? dynamicSubmissionData.submissionDate
    : submissionDate;
  const currentLastModifiedDate = useDynamicData
    ? dynamicSubmissionData.lastModifiedDate
    : lastModifiedDate;
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

  // const primaryActions = actions.filter(action => action.type === 'primary');
  // const secondaryActions = actions.filter(
  //   action => action.type === 'secondary',
  // );
  const isAssignment = type === 'assignment';

  // Override the submit assignment action to use document picker
  const enhancedActions = actions.map(action => {
    if (action.id === 'submit' && isAssignment) {
      // Change button text and behavior based on submission status
      const isDraft = currentSubmissionStatus === 'draft';
      const isSubmitted = currentSubmissionStatus === 'submitted';

      return {
        ...action,
        title: isDraft
          ? 'Edit Assignment'
          : isSubmitted
          ? 'View Submission'
          : 'Upload Assignment',
        onPress: isSubmitted
          ? () => {
              // For submitted assignments, just show the submission details
              console.log('Viewing submitted assignment');
            }
          : isDraft
          ? handleDocumentPicker
          : handleDocumentPicker,
      };
    }
    return action;
  });

  // Add final submit action for draft assignments
  const finalSubmitAction: ContentDetailAction = {
    id: 'final-submit',
    title: 'Submit Assignment',
    type: 'primary',
    onPress: submitFinalAssignment,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Icon Section */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getIconBackground() },
          ]}
        >
          {getIcon()}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <StyledText style={styles.title}>{title}</StyledText>
          <StyledText style={styles.description}>{description}</StyledText>
        </View>

        {isAssignment && (
          <View style={styles.actionsContainer}>
            {enhancedActions
              .filter(
                action =>
                  action.type === 'primary' &&
                  action.id !== 'open-moodle' &&
                  action.id !== 'mark-complete',
              )
              .map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.assignmentButton,
                    index === 0 ? styles.primaryButton : styles.whiteButton,
                  ]}
                  onPress={action.onPress}
                  disabled={isSubmitting}
                >
                  {action.icon && (
                    <View style={styles.buttonIcon}>{action.icon}</View>
                  )}
                  <StyledText
                    style={
                      index === 0
                        ? styles.primaryButtonText
                        : styles.whiteButtonText
                    }
                  >
                    {isSubmitting && action.id === 'submit'
                      ? currentSubmissionStatus === 'draft'
                        ? 'Updating...'
                        : 'Uploading...'
                      : action.title}
                  </StyledText>
                  {isSubmitting && action.id === 'submit' && (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                      style={styles.buttonLoading}
                    />
                  )}
                </TouchableOpacity>
              ))}
            
            {/* Show final submit button for draft assignments */}
            {currentSubmissionStatus === 'draft' && (
              <TouchableOpacity
                style={[styles.assignmentButton, styles.finalSubmitButton]}
                onPress={finalSubmitAction.onPress}
                disabled={isSubmitting}
              >
                <View style={styles.buttonIcon}>
                  <CircleCheckBig size={16} color="#ffffff" />
                </View>
                <StyledText style={styles.primaryButtonText}>
                  {isSubmitting ? 'Submitting...' : finalSubmitAction.title}
                </StyledText>
                {isSubmitting && (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                    style={styles.buttonLoading}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Assignment Submission Card */}
        {isAssignment && (
          <View style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <StyledText style={styles.submissionTitle}>
                My Submission
              </StyledText>
              {isLoadingSubmission && (
                <ActivityIndicator
                  size="small"
                  color="#E56B8C"
                  style={styles.loadingIndicator}
                />
              )}
            </View>

            {!isLoadingSubmission && (
              <>
                {currentSubmissionStatus === 'submitted' ? (
                  // Submitted Design 
                  <View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>
                        Status:
                      </StyledText>
                      <View style={[styles.badge, styles.submittedBadge]}>
                        <StyledText style={styles.submittedBadgeText}>
                          submitted
                        </StyledText>
                      </View>
                    </View>

                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>
                        Actions:
                      </StyledText>
                      <StyledText style={styles.noActionsText}>-</StyledText>
                    </View>

                    {currentSubmittedFiles &&
                      currentSubmittedFiles.length > 0 && (
                        <View style={styles.submittedFilesSection}>
                          <StyledText style={styles.submissionLabel}>
                            Submitted Files:
                          </StyledText>
                          {currentSubmittedFiles.map(file => (
                            <View key={file.id} style={styles.fileItem}>
                              <View style={styles.fileInfo}>
                                <FileText size={16} color="#6B7280" />
                                <View style={styles.fileDetails}>
                                  <StyledText style={styles.fileName}>
                                    {file.name}
                                  </StyledText>
                                  <StyledText style={styles.fileMeta}>
                                    {file.size} • {file.type}
                                  </StyledText>
                                </View>
                              </View>
                              {file.url && (
                                <TouchableOpacity
                                  style={styles.externalLinkIcon}
                                  onPress={async () => {
                                    // Handle file download/view
                                    console.log('Opening file:', file.url);
                                    
                                    // Create download link from your API response
                                    const downloadUrl = file.url;
                                    
                                    // Set loading state for this specific file
                                    setIsDownloading(file.id);
                                    
                                    try {
                                      // Use React Native Linking to open/download the file
                                      const supported = await Linking.canOpenURL(downloadUrl);
                                      
                                      if (supported) {
                                        console.log('Opening URL:', downloadUrl);
                                        // Show success message
                                        Alert.alert('Download Started', `Downloading ${file.name}...`);
                                        await Linking.openURL(downloadUrl);
                                      } else {
                                        console.log('Cannot open URL:', downloadUrl);
                                        // Fallback: try to open in browser anyway
                                        Alert.alert('Download Started', `Opening ${file.name}...`);
                                        await Linking.openURL(downloadUrl);
                                      }
                                    } catch (err) {
                                      console.error('Error opening URL:', err);
                                      // Show error to user
                                      Alert.alert('Download Error', 'Unable to download the file. Please try again.');
                                    } finally {
                                      // Clear loading state
                                      setIsDownloading(null);
                                    }
                                  }}
                                  disabled={isDownloading === file.id}
                                >
                                  {isDownloading === file.id ? (
                                    <ActivityIndicator size="small" color="#6B7280" />
                                  ) : (
                                    <ExternalLink size={16} color="#6B7280" />
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}

                    <View style={styles.datesRow}>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>
                          Created:
                        </StyledText>
                        <StyledText style={styles.dateValue}>
                          {currentSubmissionDate || '29/01/2026'}
                        </StyledText>
                      </View>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>
                          Modified:
                        </StyledText>
                        <StyledText style={styles.dateValue}>
                          {currentLastModifiedDate || '29/01/2026'}
                        </StyledText>
                      </View>
                    </View>
                  </View>
                ) : currentSubmissionStatus === 'draft' ? (
                  // Draft Design - For assignments that have been drafted but not submitted
                  <View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>
                        Status:
                      </StyledText>
                      <View style={[styles.badge, styles.draftBadge]}>
                        <StyledText style={styles.draftBadgeText}>
                          draft
                        </StyledText>
                      </View>
                    </View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>
                        Actions:
                      </StyledText>
                      <View style={[styles.badge, styles.actionBadge]}>
                        <StyledText style={styles.actionBadgeText}>
                          Ready to Submit
                        </StyledText>
                      </View>
                    </View>

                    {currentSubmittedFiles &&
                      currentSubmittedFiles.length > 0 && (
                        <View style={styles.submittedFilesSection}>
                          <StyledText style={styles.submissionLabel}>
                            Draft Files:
                          </StyledText>
                          {currentSubmittedFiles.map(file => (
                            <View key={file.id} style={styles.fileItem}>
                              <View style={styles.fileInfo}>
                                <FileText size={16} color="#6B7280" />
                                <View style={styles.fileDetails}>
                                  <StyledText style={styles.fileName}>
                                    {file.name}
                                  </StyledText>
                                  <StyledText style={styles.fileMeta}>
                                    {file.size} • {file.type}
                                  </StyledText>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                    <View style={styles.datesRow}>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>
                          Created:
                        </StyledText>
                        <StyledText style={styles.dateValue}>
                          {currentSubmissionDate || '30/01/2026'}
                        </StyledText>
                      </View>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>
                          Modified:
                        </StyledText>
                        <StyledText style={styles.dateValue}>
                          {currentLastModifiedDate || '30/01/2026'}
                        </StyledText>
                      </View>
                    </View>
                    
                    <View style={styles.draftNotice}>
                      <StyledText style={styles.draftNoticeText}>
                        💡 Your assignment is saved as draft. Click "Submit Assignment" button below to submit it.
                      </StyledText>
                    </View>
                  </View>
                ) : (
                  // New/Not Submitted Design - Current design
                  <View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>
                        Status:
                      </StyledText>
                      <View style={[styles.badge, styles.statusBadge]}>
                        <StyledText style={styles.badgeText}>new</StyledText>
                      </View>
                    </View>
                    <View style={styles.submissionRow}>
                      <StyledText style={styles.submissionLabel}>
                        Actions:
                      </StyledText>
                      <View style={[styles.badge, styles.actionBadge]}>
                        <StyledText style={styles.actionBadgeText}>
                          Can Edit
                        </StyledText>
                      </View>
                    </View>

                    <View style={styles.datesRow}>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>
                          Created:
                        </StyledText>
                        <StyledText style={styles.dateValue}>
                          30/01/2026
                        </StyledText>
                      </View>
                      <View style={styles.submissionRow}>
                        <StyledText style={styles.dateLabel}>
                          Modified:
                        </StyledText>
                        <StyledText style={styles.dateValue}>
                          30/01/2026
                        </StyledText>
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
              const openMoodleAction = actions.find(
                action => action.id === 'open-moodle',
              );
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
              const markCompleteAction = actions.find(
                action => action.id === 'mark-complete',
              );
              if (markCompleteAction) {
                markCompleteAction.onPress();
              }
            }}
          >
            <View style={styles.buttonIcon}>
              <CircleCheckBig size={16} color="#111827" />
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
  finalSubmitButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
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
  draftNotice: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  draftNoticeText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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
