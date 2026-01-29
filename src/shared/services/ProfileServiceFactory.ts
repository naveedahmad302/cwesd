import { ProfileService, Profile } from './ProfileService';
import { userAPI, authAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  async getProfiles(recentChatUsers?: string[]): Promise<Profile[]> {
    try {
      console.log('StudentProfileService: Fetching teachers...');
      const response = await userAPI.getTeachers();
      console.log('StudentProfileService: API response:', response);

      if (!response.data || !response.data.data) {
        console.log('StudentProfileService: No data in response');
        return [];
      }

      // Get persistent recent chats for students using overridden method
      const persistentRecentChats = await this.getPersistentRecentChats();
      console.log('StudentProfileService: Loaded recent chats:', persistentRecentChats);
      console.log('StudentProfileService: Recent chats length:', persistentRecentChats.length);

      const profiles = response.data.data.map((user: any) => {
        console.log('StudentProfileService: Processing teacher:', user);
        const isRecent = persistentRecentChats ? persistentRecentChats.includes(user._id) : false;
        console.log('StudentProfileService: Teacher', user.name, 'isRecentChat:', isRecent, 'teacherId:', user._id);
        return {
          id: user._id,
          name: user.name,
          image: user.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s',
          // Add additional fields for teacher selection
          _id: user._id,
          picture: user.picture,
          email: user.email,
          role: user.role,
          qualification: user.qualification || 'Teacher',
          isRecentChat: isRecent
        };
      });

      console.log('StudentProfileService: Transformed profiles:', profiles);
      console.log('StudentProfileService: Total profiles before limit:', profiles.length);

      // Sort profiles: recent chat users first (in order of AsyncStorage), then by name
      profiles.sort((a: Profile, b: Profile) => {
        // If both are recent chats, sort by AsyncStorage order
        if (a.isRecentChat && b.isRecentChat) {
          const aIndex = persistentRecentChats.indexOf(a.id);
          const bIndex = persistentRecentChats.indexOf(b.id);
          return aIndex - bIndex;
        }
        // If only a is recent chat, a comes first
        if (a.isRecentChat && !b.isRecentChat) return -1;
        // If only b is recent chat, b comes first
        if (!a.isRecentChat && b.isRecentChat) return 1;
        // If neither are recent chats, sort by name
        return a.name.localeCompare(b.name);
      });

      console.log('StudentProfileService: Final sorted profiles:', profiles.length);
      console.log('StudentProfileService: Recent chat users count:', profiles.filter((p: Profile) => p.isRecentChat).length);

      // Return only 4 profiles
      const finalProfiles = profiles.slice(0, 4);
      console.log('StudentProfileService: Returning 4 profiles:', finalProfiles.map((p: Profile) => ({ name: p.name, role: p.role, isRecentChat: p.isRecentChat })));

      return finalProfiles;
    } catch (error) {
      console.error('StudentProfileService: Error fetching teachers:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Override to use student-specific AsyncStorage key
  async getPersistentRecentChats(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem('persistentRecentChats_student');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('StudentProfileService: Error loading recent chats:', error);
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
  
  async getProfiles(recentChatUsers?: string[]): Promise<Profile[]> {
    try {
      console.log('TeacherProfileService: Fetching students and admins...');
      
      // Get persistent recent chats first
      const persistentRecentChats = await this.getPersistentRecentChats();
      console.log('TeacherProfileService: Persistent recent chats:', persistentRecentChats);
      
      // Step 1: Get all students and admins first
      const [studentsResponse, adminsResponse] = await Promise.all([
        userAPI.getStudents(),
        userAPI.getAdmins()
      ]);
      
      console.log('TeacherProfileService: Students API response:', studentsResponse.data);
      console.log('TeacherProfileService: Admins API response:', adminsResponse.data);
      
      // Step 2: Process students with enhanced data
      const students = studentsResponse.data?.success && studentsResponse.data?.data 
        ? studentsResponse.data.data.map((user: any) => ({
            id: user._id,
            name: user.name,
            image: user.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s',
            _id: user._id,
            picture: user.picture,
            email: user.email,
            role: user.role || 'student',
            qualification: user.qualification || 'Student',
            isRecentChat: persistentRecentChats ? persistentRecentChats.includes(user._id) : false
          }))
        : [];
      
      // Step 3: Process admins with enhanced data
      const admins = adminsResponse.data?.success && adminsResponse.data?.data
        ? adminsResponse.data.data.map((user: any) => ({
            id: user._id,
            name: user.name,
            image: user.picture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s',
            _id: user._id,
            picture: user.picture,
            email: user.email,
            role: user.role || 'admin',
            qualification: user.qualification || 'Administrator',
            isRecentChat: persistentRecentChats ? persistentRecentChats.includes(user._id) : false
          }))
        : [];
      
      // Step 4: Combine all profiles
      let allProfiles = [...students, ...admins];
      console.log('TeacherProfileService: Combined profiles before recent chat check:', allProfiles.length);
      
      // Step 5: Sort profiles: recent chat users first (in order of AsyncStorage), then by name
      allProfiles.sort((a, b) => {
        // If both are recent chats, sort by AsyncStorage order
        if (a.isRecentChat && b.isRecentChat) {
          const aIndex = persistentRecentChats.indexOf(a.id);
          const bIndex = persistentRecentChats.indexOf(b.id);
          return aIndex - bIndex;
        }
        // If only a is recent chat, a comes first
        if (a.isRecentChat && !b.isRecentChat) return -1;
        // If only b is recent chat, b comes first
        if (!a.isRecentChat && b.isRecentChat) return 1;
        // If neither are recent chats, sort by name
        return a.name.localeCompare(b.name);
      });
      
      console.log('TeacherProfileService: Final sorted profiles:', allProfiles.length);
      console.log('TeacherProfileService: Recent chat users count:', allProfiles.filter(p => p.isRecentChat).length);
      
      // Step 6: Return only 4 profiles
      const finalProfiles = allProfiles.slice(0, 4);
      console.log('TeacherProfileService: Returning 4 profiles:', finalProfiles.map(p => ({ name: p.name, role: p.role, isRecentChat: p.isRecentChat })));
      
      return finalProfiles;
    } catch (error) {
      console.error('TeacherProfileService: Error fetching students and admins:', error);
      // Return empty array if API fails
      return [];
    }
  }
  
  // Override to use teacher-specific AsyncStorage key
  async getPersistentRecentChats(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem('persistentRecentChats_teacher');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('TeacherProfileService: Error loading recent chats:', error);
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
