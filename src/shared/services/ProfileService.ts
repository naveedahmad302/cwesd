export interface Profile {
  id: string;
  name: string;
  image: string;
}

export abstract class ProfileService {
  abstract getProfiles(): Promise<Profile[]>;
  abstract getDisplayName(): string;
  abstract logout(): Promise<boolean>;
  
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
}
