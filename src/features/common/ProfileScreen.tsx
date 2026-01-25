import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userAPI } from '../../services/api';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

// Types for profile data
interface ProfileData {
  _id: string;
  name: string;
  email: string;
  fatherName: string;
  age: number;
  qualification: string;
  contactNumber: string;
  address: string;
  permanentAddress: string;
  profilePicture: string;
  cnicPicFront: string;
  cnicPicBack: string;
  role: string;
  moodleCreatedAt: string | null;
  moodleSyncStatus: string;
  moodleSyncError: string | null;
  moodleLastSyncAttempt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Reusable Profile Section Component
interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <StyledText style={styles.sectionTitle}>{title}</StyledText>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Reusable Identity Document Component
interface IdentityDocumentProps {
  imageUrl: string;
  isVerified?: boolean;
}

const IdentityDocument: React.FC<IdentityDocumentProps> = ({ imageUrl, isVerified = true }) => (
  <View style={styles.documentContainer}>
    <View style={styles.documentImageContainer}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.documentImage}
        resizeMode="cover"
      />
    </View>
    <StyledText style={styles.verifiedText}>
      {isVerified ? '✓ Verified Document' : 'Pending Verification'}
    </StyledText>
  </View>
);

// Reusable Profile Item Component
interface ProfileItemProps {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ 
  label, 
  value, 
  editable = false, 
  onChangeText,
  multiline = false 
}) => (
  <View style={styles.profileItem}>
    <StyledText style={styles.profileLabel}>{label}</StyledText>
    {editable ? (
      <TextInput
        style={[styles.profileValue, styles.profileInput, multiline && styles.profileInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    ) : (
      <StyledText style={styles.profileValue}>{value}</StyledText>
    )}
  </View>
);

const ProfileScreen: React.FC = () => {
  // State for profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    _id: '',
    name: '',
    email: '',
    fatherName: '',
    age: 0,
    qualification: '',
    contactNumber: '',
    address: '',
    permanentAddress: '',
    profilePicture: '',
    cnicPicFront: '',
    cnicPicBack: '',
    role: '',
    moodleCreatedAt: null,
    moodleSyncStatus: '',
    moodleSyncError: null,
    moodleLastSyncAttempt: null,
    createdAt: '',
    updatedAt: '',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [tempProfileData, setTempProfileData] = useState<ProfileData>(profileData);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from storage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Get full user data from API or use stored data
          const fullProfileData: ProfileData = {
            _id: userData._id || '',
            name: userData.name || '',
            email: userData.email || '',
            fatherName: userData.fatherName || '',
            age: userData.age || 0,
            qualification: userData.qualification || '',
            contactNumber: userData.contactNumber || '',
            address: userData.address || '',
            permanentAddress: userData.permanentAddress || '',
            profilePicture: userData.picture || '',
            cnicPicFront: userData.cnicPicFront || '',
            cnicPicBack: userData.cnicPicBack || '',
            role: userData.role || '',
            moodleCreatedAt: userData.moodleCreatedAt || null,
            moodleSyncStatus: userData.moodleSyncStatus || '',
            moodleSyncError: userData.moodleSyncError || null,
            moodleLastSyncAttempt: userData.moodleLastSyncAttempt || null,
            createdAt: userData.createdAt || '',
            updatedAt: userData.updatedAt || '',
          };
          setProfileData(fullProfileData);
          setTempProfileData(fullProfileData);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        showErrorToast('Failed to load profile data', 'Error');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Handle edit action
  const handleEditProfile = async () => {
    if (isEditMode) {
      // Save changes to database
      try {
        setIsLoading(true);
        
        // Prepare data for API (only send editable fields)
        const updateData = {
          name: tempProfileData.name,
          fatherName: tempProfileData.fatherName,
          age: tempProfileData.age,
          qualification: tempProfileData.qualification,
          contactNumber: tempProfileData.contactNumber,
          address: tempProfileData.address,
          permanentAddress: tempProfileData.permanentAddress,
        };

        // Call API to update profile
        const response = await userAPI.updateProfile(profileData._id, updateData);
        
        if (response.data) {
          // Update local state with new data
          const updatedProfileData = { ...profileData, ...tempProfileData };
          setProfileData(updatedProfileData);
          
          // Update AsyncStorage with new data
          await AsyncStorage.setItem('user', JSON.stringify(updatedProfileData));
          
          setIsEditMode(false);
          showSuccessToast('Profile updated successfully in database', 'Success');
        }
      } catch (error) {
        console.error('Failed to update profile:', error);
        showErrorToast('Failed to update profile. Please try again.', 'Error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Enter edit mode
      setTempProfileData(profileData);
      setIsEditMode(true);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setTempProfileData(profileData);
    setIsEditMode(false);
  };

  // Update temp profile data
  const updateTempProfileData = (field: keyof ProfileData, value: string | number) => {
    setTempProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.containerTwo}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <StyledText style={styles.loadingText}>Loading profile...</StyledText>
        </View>
      ) : (
        <>
      {/* Header with Edit Button */}
      <View style={styles.header}>
        <StyledText style={styles.headerTitle}>Profile Information</StyledText>
        <View style={styles.headerButtonsContainer}>
          {isEditMode && (
            <TouchableOpacity onPress={handleCancelEdit} style={[styles.headerEditButton, styles.cancelButton]}>
              <Icon name="close-outline" size={20} color="#666" />
              <StyledText style={[styles.headerEditButtonText, styles.cancelButtonText]}>Cancel</StyledText>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleEditProfile} style={[styles.headerEditButton, isEditMode && styles.saveButton]}>
            <Icon name={isEditMode ? "check-outline" : "pencil-outline"} size={20} color={isEditMode ? "white" : "black"} />
            <StyledText style={[styles.headerEditButtonText, isEditMode && styles.saveButtonText]}>
              {isEditMode ? 'Save' : 'Edit'}
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header Section */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ 
              uri: profileData.profilePicture || 'https://via.placeholder.com/120x120/4A90E2/FFFFFF?text=Profile' 
            }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>
        <StyledText style={styles.profileName}>{profileData.name}</StyledText>
        <StyledText style={styles.profileEmail}>{profileData.email}</StyledText>
      </View>

      {/* Profile Information Section */}
      {/* <ProfileSection title="Profile Information">
        <ProfileItem label="Email" value={profileData.email} />
      </ProfileSection> */}

      {/* Personal Information Section */}
      <ProfileSection title="Personal Information">
        <ProfileItem 
          label="Name" 
          value={isEditMode ? tempProfileData.name : profileData.name}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('name', text)}
        />
        <ProfileItem 
          label="Father's Name" 
          value={isEditMode ? tempProfileData.fatherName : profileData.fatherName}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('fatherName', text)}
        />
        <ProfileItem 
          label="Age" 
          value={isEditMode ? tempProfileData.age.toString() : profileData.age.toString()}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('age', parseInt(text) || 0)}
        />
        <ProfileItem 
          label="Qualification" 
          value={isEditMode ? tempProfileData.qualification : profileData.qualification}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('qualification', text)}
        />
      </ProfileSection>

      {/* Contact Information Section */}
      <ProfileSection title="Contact Information">
        <ProfileItem 
          label="Email" 
          value={isEditMode ? tempProfileData.email : profileData.email}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('email', text)}
        />
        <ProfileItem 
          label="Phone Number" 
          value={isEditMode ? tempProfileData.contactNumber : profileData.contactNumber}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('contactNumber', text)}
        />
        <ProfileItem 
          label="Address" 
          value={isEditMode ? tempProfileData.address : profileData.address}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('address', text)}
          multiline={true}
        />
        <ProfileItem 
          label="Permanent Address" 
          value={isEditMode ? tempProfileData.permanentAddress : profileData.permanentAddress}
          editable={isEditMode}
          onChangeText={(text) => updateTempProfileData('permanentAddress', text)}
          multiline={true}
        />
      </ProfileSection>

      {/* Identity Documents Section */}
      <ProfileSection title="Identity Documents">
        <View style={styles.documentsContainer}>
          <View style={styles.documentWithTitleContainer}>
            <StyledText style={styles.documentTitle}>CNIC Front</StyledText>
            <IdentityDocument
              imageUrl={profileData.cnicPicFront || 'https://via.placeholder.com/300x200/f0f0f0/666666?text=CNIC+Front'}
              isVerified={true}
            />
          </View>
          <View style={styles.documentWithTitleContainer}>
            <StyledText style={styles.documentTitle}>CNIC Back</StyledText>
            <IdentityDocument
              imageUrl={profileData.cnicPicBack || 'https://via.placeholder.com/300x200/f0f0f0/666666?text=CNIC+Back'}
              isVerified={true}
            />
          </View>
        </View>
      </ProfileSection>
        </>
      )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius:16,
    // borderWidth:2,
    // borderColor:'black',
    color:'black',
    marginBottom:16,
  },
  containerTwo:{
    flex:1,
    backgroundColor:'#FFFFFF',
    borderRadius:16,
    margin:16,
    borderWidth:1,
    borderColor:'#DFE6E9',
  },
  
  // Header Styles
  header: {
    
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e9ecef',
    borderRadius:16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  headerEditButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'black',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
  cancelButtonText: {
    color: '#666',
  },
  
  // Profile Header Styles
  profileHeader: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e9ecef',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e9ecef',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#000000',
  },

  // Section Styles
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
  },
  sectionHeader: {
    paddingTop:25,
    marginBottom: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  sectionContent: {
    gap: 12,
  },

  // Profile Item Styles
  profileItem: {
    paddingVertical: 8,
  },
  profileLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    textAlign: 'left',
  },
  profileInput: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    textAlign: 'left',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  profileInputMultiline: {
    textAlign: 'left',
    minHeight: 60,
  },

  // Identity Document Styles
  documentsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
  },
  documentWithTitleContainer: {
    marginBottom: 16,
  },
  documentContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'left',
  },
  documentImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default ProfileScreen;
