export interface Course {
  _id: string;
  moodleId: number;
  fullname: string;
  shortname: string;
  idnumber: string;
  categoryId: number;
  visible: boolean;
  startDate: string;
  endDate?: string;
  summary: string;
  summaryFormat: number;
  format: string;
  numSections: number;
  isActive: boolean;
  enrolledCohorts: string[];
  enrolledUsers: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CoursesResponse {
  success: boolean;
  total: number;
  courses: Course[];
}

export interface CourseCardProps {
  course: {
    id: string;
    title: string;
    instructor: string;
    lessons: number;
    duration: string;
    level: string;
    tags: string[];
    quizScore?: string;
    grade?: string;
    status: 'completed' | 'in-progress' | 'not-started' | 'Locked';
    completedDate?: string;
    progress: number;
    headerColor?: string;
  };
}
