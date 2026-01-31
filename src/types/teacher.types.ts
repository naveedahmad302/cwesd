export interface TeacherStatsResponse {
  success?: boolean;
  totalCourses?: number;
  activeCourses?: number;
  pendingGrades?: number;
  unreadMessages?: number;
  total_courses?: number;
  active_courses?: number;
  pending_grades?: number;
  unread_messages?: number;
  [key: string]: unknown;
}
