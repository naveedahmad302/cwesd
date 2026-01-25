import { ProfileService, Profile } from './ProfileService';
import { userAPI, authAPI } from '../../services/api';

export class StudentProfileService extends ProfileService {
  private static instance: StudentProfileService;
  
  private constructor() {
    super();
  }
  
  static getInstance(): StudentProfileService {
    if (!StudentProfileService.instance) {
      StudentProfileService.instance = new StudentProfileService();
    }
    return StudentProfileService.instance;
  }
  
  async getProfiles(): Promise<Profile[]> {
    try {
      const response = await userAPI.getTeachers();
      const profiles = response.data.data.map((user: any) => ({
        id: user._id,
        name: user.name,
        image: user.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s'
      }));
      
      // Limit to maximum 4 profiles
      return profiles.slice(0, 4);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      // Return empty array if API fails
      return [];
    }
  }
  
  getDisplayName(): string {
    return 'Student';
  }

  async logout(): Promise<boolean> {
    try {
      await authAPI.logout();
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
}

export class TeacherProfileService extends ProfileService {
  private static instance: TeacherProfileService;
  
  private constructor() {
    super();
  }
  
  static getInstance(): TeacherProfileService {
    if (!TeacherProfileService.instance) {
      TeacherProfileService.instance = new TeacherProfileService();
    }
    return TeacherProfileService.instance;
  }
  
  async getProfiles(): Promise<Profile[]> {
    try {
      // Get both students and admins for teachers
      const [studentsResponse, adminsResponse] = await Promise.all([
        userAPI.getStudents(),
        userAPI.getAdmins()
      ]);
      
      const students = studentsResponse.data.data.map((user: any) => ({
        id: user._id,
        name: user.name,
        image: user.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s'
      }));
      
      const admins = adminsResponse.data.data.map((user: any) => ({
        id: user._id,
        name: user.name,
        image: user.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s'
      }));
      
      // Combine students and admins, then limit to maximum 4 profiles
      return [...students, ...admins].slice(0, 4);
    } catch (error) {
      console.error('Error fetching students and admins:', error);
      // Return empty array if API fails
      return [];
    }
  }
  
  getDisplayName(): string {
    return 'Teacher';
  }

  async logout(): Promise<boolean> {
    try {
      await authAPI.logout();
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
}

// Factory function to get the appropriate service
export function createProfileService(userType: 'student' | 'teacher'): ProfileService {
  switch (userType) {
    case 'student':
      return StudentProfileService.getInstance();
    case 'teacher':
      return TeacherProfileService.getInstance();
    default:
      return StudentProfileService.getInstance();
  }
}
