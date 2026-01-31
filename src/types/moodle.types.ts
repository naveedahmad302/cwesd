export interface MoodleSection {
  id: number;
  name: string;
  summary?: string;
  modules?: unknown[];
  sectionNumber?: number;
  [key: string]: unknown;
}

export type MoodleSectionsResponse = MoodleSection[];

/** Backend response for GET /moodle/courses/:moodleId/sections */
export interface MoodleCourseSectionsApiResponse {
  success: boolean;
  data: {
    sections: Array<{
      sectionNumber: number;
      name: string;
      summary: string | null;
      visible: number;
      moduleCount: number;
      modules: Array<{
        id: number;
        name: string;
        modname: string;
        instance: number;
        visible: number;
        url: string;
        indent: number;
      }>;
    }>;
  };
}

export interface AssignmentSubmissionResponse {
  success?: boolean;
  status?: 'new' | 'submitted' | 'draft';
  lastAttempt?: {
    submission?: {
      timecreated?: number;
      timemodified?: number;
      plugins?: Array<{
        type: string;
        fileareas?: Array<{
          files?: Array<{
            filename: string;
            filesize: number;
            mimetype: string;
            fileurl: string;
          }>;
        }>;
      }>;
    };
  };
  [key: string]: unknown;
}
