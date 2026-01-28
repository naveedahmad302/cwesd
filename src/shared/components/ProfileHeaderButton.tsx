import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Text } from 'react-native';
import { ChevronDown, User, LogOut } from 'lucide-react-native';
import { ProfileService } from '../services/ProfileService';
import { createProfileService } from '../services/ProfileServiceFactory';
import { useAuth } from '../../features/auth/AuthContext';

interface ProfileHeaderButtonProps {
  onPress: () => void;
  userType?: 'student' | 'teacher';
  profileService?: ProfileService;
  navigation?: any; // Navigation prop for logout and chat navigation
  onTeacherSelect?: (teacher: any) => void; // Callback for teacher selection
}

const ProfileHeaderButton: React.FC<ProfileHeaderButtonProps> = ({ 
  onPress, 
  userType = 'student',
  profileService,
  navigation,
  onTeacherSelect
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout: authLogout, user } = useAuth(); // Get user data from AuthContext

  // Use provided service or create one based on userType
  const service = profileService || createProfileService(userType);

  // Load profiles when component mounts
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        console.log('Loading profiles for userType:', userType);
        const profileData = await service.getProfiles();
        console.log('Raw profile data:', profileData);
        console.log('Number of profiles received:', profileData.length);
        console.log('Profile details:', profileData.map((p: any, i: number) => ({ index: i, id: p.id, name: p.name, image: p.image })));
        setProfiles(profileData);
        console.log('Profiles loaded:', profileData.length);
      } catch (error) {
        console.error('Error loading profiles:', error);
        setProfiles([]); // Ensure empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [service]);

  const handlePress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleCloseDropdown = () => {
    setShowDropdown(false);
  };

  const handleTeacherSelect = (teacher: any) => {
    console.log('Teacher selected:', teacher);
    setShowDropdown(false);
    
    // Transform teacher data to match ChatWithTeacherScreen format
    const transformedTeacher = {
      id: teacher._id || teacher.id,
      name: teacher.name,
      subject: teacher.qualification || teacher.subject || 'No subject specified',
      avatar: teacher.picture || teacher.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s',
      online: Math.random() > 0.5, // Random online status for demo
      email: teacher.email,
      role: teacher.role || 'teacher'
    };

    console.log('Transformed teacher:', transformedTeacher);

    // Call the callback if provided
    if (onTeacherSelect) {
      console.log('Calling onTeacherSelect callback');
      onTeacherSelect(transformedTeacher);
    }

    // Navigate to chat screen if navigation is provided
    if (navigation) {
      console.log('Navigating to Chat with Teacher');
      navigation.navigate('Chat with Teacher', { teacher: transformedTeacher });
    } else {
      console.log('No navigation prop provided');
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      // Use AuthContext logout instead of service logout
      await authLogout();
      console.log('Logout successful');
      
      // Navigate to Login screen
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.profileImagePlaceholder}>
            {user?.picture ? (
              <Image 
                source={{ uri: user.picture }} 
                style={styles.profileImage}
              />
            ) : (
              <User size={20} color="#666" />
            )}
          </View>
          <ChevronDown size={16} color="#000" style={styles.chevron} />
        </View>
      </TouchableOpacity>
      
      {showDropdown && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTouchable} onPress={handleCloseDropdown} activeOpacity={1}>
            <View style={styles.dropdown}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Options */}
                {loading ? (
                  <View style={styles.loadingItem}>
                    <User size={20} color="#666" />
                    <Text style={styles.loadingText}>Loading profiles...</Text>
                  </View>
                ) : (
                  <>
                    {profiles.map((profile: any, index: number) => (
                      <TouchableOpacity 
                        key={profile.id} 
                        style={styles.profileItem}
                        onPress={() => {
                          // console.log('Profile item pressed:', profile.name);
                          handleTeacherSelect(profile);
                        }}
                        // onPressIn={() => console.log('Profile press in:', profile.name)}
                        // onPressOut={() => console.log('Profile press out:', profile.name)}
                      >
                        <View style={styles.profileImageContainer}>
                          <Image 
                            source={{ uri: profile.image || profile.picture }} 
                            style={styles.profileImage}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                
                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <LogOut size={20} color="#FF3B30" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#DFE6E9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  profileImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4E1',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 4,
    marginTop: 5,
  },
  // Dropdown styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  overlayTouchable: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    right: 17,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 0,
    maxHeight: 400, 
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  profileSubject: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    padding: 8,
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  loadingItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default ProfileHeaderButton;
