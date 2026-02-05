import type { AssignmentSubmissionResponse } from '../types/moodle.types';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export interface TransformedSubmissionData {
  submissionStatus: 'new' | 'submitted' | 'draft';
  submittedFiles: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    url?: string;
  }>;
  submissionDate: string;
  lastModifiedDate: string;
}

/** Transform Moodle assignment submission API response for UI. */
export function transformSubmissionData(
  apiResponse: AssignmentSubmissionResponse | null | undefined
): TransformedSubmissionData {
  if (!apiResponse?.success) {
    return {
      submissionStatus: 'new',
      submittedFiles: [],
      submissionDate: '',
      lastModifiedDate: '',
    };
  }

  const { lastAttempt, submittedFiles: topLevelFiles } = apiResponse;
  const submittedFiles: TransformedSubmissionData['submittedFiles'] = [];

  // Process top-level submittedFiles array (from your API response)
  if (topLevelFiles && Array.isArray(topLevelFiles) && topLevelFiles.length > 0) {
    topLevelFiles.forEach((file: { filename: string; filesize: number; mimetype?: string; fileurl: string }) => {
      submittedFiles.push({
        id: file.filename || `file-${Date.now()}`,
        name: decodeURIComponent(file.filename), // Decode URL-encoded filenames
        size: formatFileSize(file.filesize),
        type: file.mimetype || 'application/octet-stream',
        url: file.fileurl,
      });
    });
  }

  // Also process nested plugin files (fallback)
  if (lastAttempt?.submission?.plugins) {
    lastAttempt.submission.plugins.forEach((plugin: { type?: string; fileareas?: Array<{ files?: Array<{ filename: string; filesize: number; mimetype?: string; fileurl: string }> }> }) => {
      if (plugin.type === 'file' && plugin.fileareas) {
        plugin.fileareas.forEach((filearea) => {
          if (filearea.files?.length) {
            filearea.files.forEach((file) => {
              // Avoid duplicates by checking if file already exists
              const existingFile = submittedFiles.find(f => f.url === file.fileurl);
              if (!existingFile) {
                submittedFiles.push({
                  id: file.filename || `file-${Date.now()}`,
                  name: decodeURIComponent(file.filename), // Decode URL-encoded filenames
                  size: formatFileSize(file.filesize),
                  type: file.mimetype || 'application/octet-stream',
                  url: file.fileurl,
                });
              }
            });
          }
        });
      }
    });
  }

  const submissionDate = lastAttempt?.submission?.timecreated
    ? new Date(lastAttempt.submission.timecreated * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const lastModifiedDate = lastAttempt?.submission?.timemodified
    ? new Date(lastAttempt.submission.timemodified * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  console.log('=== TRANSFORM SUBMISSION DATA ===');
  console.log('Original API response:', apiResponse);
  console.log('Transformed submittedFiles:', submittedFiles);
  console.log('Submission status:', apiResponse.status);
  console.log('================================');

  return {
    submissionStatus: (apiResponse.status as 'new' | 'submitted' | 'draft') || 'new',
    submittedFiles,
    submissionDate,
    lastModifiedDate,
  };
}
