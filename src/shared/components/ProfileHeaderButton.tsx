import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Text } from 'react-native';
import { ChevronDown, User, LogOut, GraduationCap, Shield, MessageCircle } from 'lucide-react-native';
import { createProfileService } from '../services/ProfileServiceFactory';
import { useAuth } from '../../features/auth/AuthContext';

interface ProfileHeaderButtonProps {
  onPress: () => void;
  userType?: 'student' | 'teacher';
  navigation?: any; // Navigation prop for logout and chat navigation
  onTeacherSelect?: (teacher: any) => void; // Callback for teacher selection
}

const ProfileHeaderButton: React.FC<ProfileHeaderButtonProps> = ({ 
  onPress, 
  userType = 'student',
  navigation,
  onTeacherSelect
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout: authLogout, user } = useAuth(); // Remove recentChatUsers and addRecentChatUser

  // Use created service based on userType
  const service = createProfileService(userType);

  // Load profiles when component mounts and when dropdown is opened
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        console.log('ProfileHeaderButton: Loading profiles...');
        
        // Service now handles persistent recent chats internally
        const profileData = await service.getProfiles();
        console.log(`ProfileHeaderButton: Loaded ${profileData.length} profiles`);
        console.log('ProfileHeaderButton: Profile data with recent chat info:', profileData.map(p => ({ 
          name: p.name, 
          isRecentChat: p.isRecentChat,
          id: p.id 
        })));
          
        setProfiles(profileData);
      } catch (error) {
        console.error('ProfileHeaderButton: Error loading profiles:', error);
        setProfiles([]); // Ensure empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [service, userType]);

  // Refresh profiles when dropdown is opened
  useEffect(() => {
    if (showDropdown) {
      const loadProfiles = async () => {
        try {
          console.log('ProfileHeaderButton: Refreshing profiles when dropdown opened...');
          const profileData = await service.getProfiles();
          console.log('ProfileHeaderButton: Refreshed profiles:', profileData.map(p => ({ 
            name: p.name, 
            isRecentChat: p.isRecentChat,
            id: p.id 
          })));
          setProfiles(profileData);
        } catch (error) {
          console.error('ProfileHeaderButton: Error refreshing profiles:', error);
        }
      };
      loadProfiles();
    }
  }, [showDropdown, service]);

  const handlePress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleCloseDropdown = () => {
    setShowDropdown(false);
  };

  const handleTeacherSelect = (profile: any) => {
    setShowDropdown(false);
    
    // Transform profile data to match ChatWithTeacherScreen format
    const transformedProfile = {
      id: profile._id || profile.id,
      name: profile.name,
      subject: profile.qualification || profile.subject || 'No subject specified',
      avatar: profile.picture || profile.image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s',
      online: Math.random() > 0.5, // Random online status for demo
      email: profile.email,
      role: profile.role || 'student'
    };

    // Call the callback if provided
    if (onTeacherSelect) {
      onTeacherSelect(transformedProfile);
    }

    // Navigate to chat screen if navigation is provided
    if (navigation) {
      navigation.navigate('Chat with Teacher', { teacher: transformedProfile });
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      // Use AuthContext logout instead of service logout
      await authLogout();
      
      // Navigate to Login screen
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      // Handle logout error silently
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
                    {/* <Text style={styles.loadingText}>Loading profiles...</Text> */}
                  </View>
                ) : (
                  <>
                    {profiles.map((profile: any, index: number) => (
                      <TouchableOpacity 
                        key={profile.id || index} 
                        style={[
                          styles.profileItem,
                          profile.isRecentChat && styles.recentChatProfileItem
                        ]}
                        onPress={() => {
                          handleTeacherSelect(profile);
                        }}
                      >
                        <View style={styles.profileImageContainer}>
                          <Image 
                            source={{ uri: profile.image || profile.picture }} 
                            style={styles.profileImage}
                          />
                          {/* {profile.isRecentChat && (
                            <View style={styles.recentChatIndicator}>
                              <MessageCircle size={8} color="#fff" />
                            </View>
                          )} */}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                
                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <LogOut size={20} color="#FF3B30" />
                  {/* <Text style={styles.logoutText}>Logout</Text> */}
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
    maxWidth: 60,
    maxHeight: 300, 
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    minHeight: 50,
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
  recentChatProfileItem: {
    backgroundColor: '#E8F4FD',
    borderColor: '#4A90E2',
  },
  recentChatIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentChatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  recentChatText: {
    fontSize: 10,
    color: '#4A90E2',
    fontWeight: '500',
  },
  profileRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileRole: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  loadingItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default ProfileHeaderButton;
