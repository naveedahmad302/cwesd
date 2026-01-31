import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { ChevronDown, User, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '../../store';
import {
  useLogoutMutation,
  useGetTeachersQuery,
  useGetStudentsQuery,
  useGetAdminsQuery,
} from '../../store/api';
import { performCompleteLogout } from '../../utils/logout';
import type { ApiUser } from '../../types/users.types';

const DEFAULT_AVATAR =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoWq-wtc1cASC4c3MngI7FHK3BJPb3bw1rg&s';

interface ProfileItem {
  id: string;
  _id: string;
  name: string;
  image: string;
  picture?: string;
  email?: string;
  role: string;
  qualification?: string;
  isRecentChat: boolean;
}

interface ProfileHeaderButtonProps {
  onPress: () => void;
  userType?: 'student' | 'teacher';
  navigation?: any;
  onTeacherSelect?: (teacher: any) => void;
}

function mapToProfile(user: ApiUser, isRecentChat: boolean): ProfileItem {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    image: user.picture || DEFAULT_AVATAR,
    picture: user.picture,
    email: user.email,
    role: user.role || 'student',
    qualification: user.qualification,
    isRecentChat,
  };
}

const ProfileHeaderButton: React.FC<ProfileHeaderButtonProps> = ({
  onPress,
  userType = 'student',
  navigation,
  onTeacherSelect,
}) => {
  const user = useAppSelector(state => state.user.user);
  const [logoutMutation] = useLogoutMutation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentChatIds, setRecentChatIds] = useState<string[]>([]);

  const storageKey =
    userType === 'student'
      ? 'persistentRecentChats_student'
      : 'persistentRecentChats_teacher';

  const { data: teachersData, isLoading: teachersLoading, refetch: refetchTeachers } =
    useGetTeachersQuery(undefined, {
      skip: userType !== 'student',
    });
  const { data: studentsData, isLoading: studentsLoading, refetch: refetchStudents } =
    useGetStudentsQuery(undefined, {
      skip: userType !== 'teacher',
    });
  const { data: adminsData, isLoading: adminsLoading, refetch: refetchAdmins } = useGetAdminsQuery(
    undefined,
    {
      skip: userType !== 'teacher',
    },
  );

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        setRecentChatIds(stored ? JSON.parse(stored) : []);
      } catch {
        setRecentChatIds([]);
      }
    };
    load();
  }, [storageKey, showDropdown]);

  // Refetch users when dropdown opens so list is fresh
  useEffect(() => {
    if (showDropdown) {
      if (userType === 'student') refetchTeachers();
      else {
        refetchStudents();
        refetchAdmins();
      }
    }
  }, [showDropdown, userType, refetchTeachers, refetchStudents, refetchAdmins]);

  const profiles = useMemo((): ProfileItem[] => {
    if (userType === 'student') {
      const raw = (teachersData as any)?.data ?? teachersData?.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      return list
        .map((u: ApiUser) => mapToProfile(u, recentChatIds.includes(u._id)))
        .sort((a, b) => {
          if (a.isRecentChat && b.isRecentChat)
            return recentChatIds.indexOf(a.id) - recentChatIds.indexOf(b.id);
          if (a.isRecentChat) return -1;
          if (b.isRecentChat) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 4);
    }
    const studentsRaw = (studentsData as any)?.data ?? studentsData?.data ?? [];
    const adminsRaw = (adminsData as any)?.data ?? adminsData?.data ?? [];
    const students = Array.isArray(studentsRaw) ? studentsRaw : [];
    const admins = Array.isArray(adminsRaw) ? adminsRaw : [];
    const combined = [
      ...students.map((u: ApiUser) =>
        mapToProfile(u, recentChatIds.includes(u._id)),
      ),
      ...admins.map((u: ApiUser) =>
        mapToProfile(u, recentChatIds.includes(u._id)),
      ),
    ];
    return combined
      .sort((a, b) => {
        if (a.isRecentChat && b.isRecentChat)
          return recentChatIds.indexOf(a.id) - recentChatIds.indexOf(b.id);
        if (a.isRecentChat) return -1;
        if (b.isRecentChat) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 4);
  }, [userType, teachersData, studentsData, adminsData, recentChatIds]);

  const loading =
    (userType === 'student' && teachersLoading) ||
    (userType === 'teacher' && (studentsLoading || adminsLoading));

  const handlePress = () => {
    onPress?.();
    setShowDropdown(prev => !prev);
  };

  const handleTeacherSelect = (profile: ProfileItem) => {
    setShowDropdown(false);
    const transformed = {
      id: profile._id || profile.id,
      name: profile.name,
      subject: profile.qualification || 'No subject specified',
      avatar: profile.picture || profile.image || DEFAULT_AVATAR,
      online: Math.random() > 0.5,
      email: profile.email,
      role: profile.role || 'student',
    };
    onTeacherSelect?.(transformed);
    navigation?.navigate('Chat with Teacher', { teacher: transformed });
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await logoutMutation().unwrap();
    } catch {
      // still clear local state
    }
    await performCompleteLogout({ callLogoutApi: false });
    navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
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
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={() => setShowDropdown(false)}
            activeOpacity={1}
          >
            <View style={styles.dropdown}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {loading ? (
                  <View style={styles.loadingItem}>
                    <User size={20} color="#666" />
                  </View>
                ) : (
                  profiles.map((profile, index) => (
                    <TouchableOpacity
                      key={profile.id || index}
                      style={[
                        styles.profileItem,
                        profile.isRecentChat && styles.recentChatProfileItem,
                      ]}
                      onPress={() => handleTeacherSelect(profile)}
                    >
                      <View style={styles.profileImageContainer}>
                        <Image
                          source={{ uri: profile.image || profile.picture }}
                          style={styles.profileImage}
                        />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
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
  chevron: { marginLeft: 4, marginTop: 5 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  overlayTouchable: { flex: 1 },
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
  profileImageContainer: { alignItems: 'center', justifyContent: 'center' },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  recentChatProfileItem: { backgroundColor: '#E8F4FD', borderColor: '#4A90E2' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 8,
  },
  loadingItem: { alignItems: 'center', justifyContent: 'center', padding: 20 },
});

export default ProfileHeaderButton;
