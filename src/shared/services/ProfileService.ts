import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Profile {
  id: string;
  name: string;
  image: string;
  _id?: string;
  picture?: string;
  email?: string;
  role?: string;
  qualification?: string;
  isRecentChat?: boolean;
}

export abstract class ProfileService {
  abstract getProfiles(recentChatUsers?: string[]): Promise<Profile[]>;
  abstract getDisplayName(): string;
  abstract logout(): Promise<boolean>;

  // Get persistent recent chat users from AsyncStorage
  async getPersistentRecentChats(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem('persistentRecentChats');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }
  
  // Common functionality
  async getProfileById(id: string): Promise<Profile | undefined> {
    const profiles = await this.getProfiles();
    return profiles.find(profile => profile.id === id);
  }
  
  async hasMultipleProfiles(): Promise<boolean> {
    const profiles = await this.getProfiles();
    return profiles.length > 1;
  }
  
  async getDefaultProfile(): Promise<Profile> {
    const profiles = await this.getProfiles();
    return profiles[0];
  }

  // Get recent chat users from AuthContext (better approach than AsyncStorage)
  async getRecentChatUsers(): Promise<string[]> {
    try {
      // Try to get from AuthContext (this will be called from the component)
      // We'll pass the recent chat users from the component to avoid circular dependencies
      console.log('getRecentChatUsers called - should be overridden by component');
      return [];
    } catch (error: any) {
      console.error('Error getting recent chat users:', error);
      return [];
    }
  }
}
