import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../auth';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toast';

// Reusable Settings Item Component
interface SettingsItemProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ title, subtitle, children }) => (
  <View style={styles.settingsItem}>
    <View style={styles.settingsItemContent}>
      <StyledText style={styles.settingsItemTitle}>{title}</StyledText>
      {subtitle && (
        <StyledText style={styles.settingsItemSubtitle}>{subtitle}</StyledText>
      )}
    </View>
    {children}
  </View>
);

// Reusable Section Component
interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={24} color="#333" style={styles.sectionIcon} />
      <StyledText style={styles.sectionTitle}>{title}</StyledText>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Reusable Dropdown Component
interface DropdownProps {
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, onSelect }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setVisible(true)}
      >
        <StyledText style={styles.dropdownText}>{value}</StyledText>
        <Icon name="keyboard-arrow-down" size={24} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownModal}>
                <StyledText style={styles.dropdownModalTitle}>Select Option</StyledText>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownOption,
                      option === value && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(option);
                      setVisible(false);
                    }}
                  >
                    <StyledText
                      style={[
                        styles.dropdownOptionText,
                        option === value && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option}
                    </StyledText>
                    {option === value && (
                      <Icon name="check" size={20} color="#FF69B4" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// Reusable Action Button Component
interface ActionButtonProps {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  color = '#FF69B4',
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionButtonContent}>
      <View style={styles.actionButtonLeft}>
        <StyledText style={styles.actionButtonTitle}>{title}</StyledText>
        {subtitle && (
          <StyledText style={styles.actionButtonSubtitle}>{subtitle}</StyledText>
        )}
      </View>
      <View style={[styles.actionButtonIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={20} color="white" />
      </View>
    </View>
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const isMounted = useRef(true);

  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    courseUpdates: true,
    chatMessages: false,
    announcements: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'Students Only',
    showEmail: false,
    showProgress: true,
    allowMessages: true,
  });

  const [appearance, setAppearance] = useState({
    language: 'English',
    timezone: 'Eastern Time (ET)',
  });

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      if (isMounted.current) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (isMounted.current) {
        showErrorToast('Failed to logout. Please try again.', 'Error');
      }
    }
  };

  const handleExportData = () => {
    showInfoToast('Your data export will be prepared and sent to your email.', 'Export Data');
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => console.log('Settings reset') },
      ]
    );
  };

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteAccount = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDeleteAccount = () => {
    setIsDeleteModalVisible(false);
    console.log('Account deleted - Implement actual delete logic here');
    // TODO: Implement actual account deletion logic
    // showSuccessToast('Account deleted successfully', 'Success');
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalVisible(false);
  };

  const handleSaveAllSettings = () => {
    showSuccessToast('All your settings have been saved successfully.', 'Settings Saved');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <StyledText style={styles.title}>Settings</StyledText>

          {/* Notifications Section */}
          <Section title="Notifications" icon="notifications">
            <SettingsItem
              title="Email Notifications"
              subtitle="Receive email updates about your courses"
            >
              <Switch
                value={notifications.email}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, email: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={notifications.email ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
            <SettingsItem
              title="Push Notifications"
              subtitle="Get push notifications on your device"
            >
              <Switch
                value={notifications.push}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, push: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={notifications.push ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
            <SettingsItem
              title="Course Updates"
              subtitle="Notifications about new assignments and materials"
            >
              <Switch
                value={notifications.courseUpdates}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, courseUpdates: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={notifications.courseUpdates ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
            <SettingsItem
              title="Chat Messages"
              subtitle="New message notifications from teachers"
            >
              <Switch
                value={notifications.chatMessages}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, chatMessages: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={notifications.chatMessages ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
            <SettingsItem
              title="Announcements"
              subtitle="Important announcements from administration"
            >
              <Switch
                value={notifications.announcements}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, announcements: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={notifications.announcements ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
          </Section>

          {/* Privacy & Visibility Section */}
          <Section title="Privacy & Visibility" icon="security">
            <SettingsItem
              title="Profile Visibility"
              subtitle="Control who can see your profile"
            >
              <Dropdown
                value={privacy.profileVisibility}
                options={['Everyone', 'Students Only', 'Teachers Only', 'Private']}
                onSelect={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}
              />
            </SettingsItem>
            <SettingsItem
              title="Show Email Address"
              subtitle="Display email in your profile"
            >
              <Switch
                value={privacy.showEmail}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, showEmail: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={privacy.showEmail ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
            <SettingsItem
              title="Show Progress"
              subtitle="Allow others to see your course progress"
            >
              <Switch
                value={privacy.showProgress}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, showProgress: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={privacy.showProgress ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
            <SettingsItem
              title="Allow Messages"
              subtitle="Receive messages from other users"
            >
              <Switch
                value={privacy.allowMessages}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, allowMessages: value }))}
                trackColor={{ false: '#E5E5E5', true: '#FFB6C1' }}
                thumbColor={privacy.allowMessages ? '#FF69B4' : '#fff'}
              />
            </SettingsItem>
          </Section>

          {/* Appearance Section */}
          <Section title="Appearance" icon="visibility">
            <SettingsItem title="Language">
              <Dropdown
                value={appearance.language}
                options={['English', 'Spanish', 'French', 'German', 'Chinese']}
                onSelect={(value) => setAppearance(prev => ({ ...prev, language: value }))}
              />
            </SettingsItem>
            <SettingsItem title="Timezone">
              <Dropdown
                value={appearance.timezone}
                options={[
                  'Eastern Time (ET)',
                  'Central Time (CT)',
                  'Mountain Time (MT)',
                  'Pacific Time (PT)',
                  'UTC',
                ]}
                onSelect={(value) => setAppearance(prev => ({ ...prev, timezone: value }))}
              />
            </SettingsItem>
          </Section>

          {/* Data & Account Section */}
          <Section title="Data & Account" icon="settings">
            <ActionButton
              title="Export Your Data"
              subtitle="Download a copy of your personal data"
              icon="download"
              onPress={handleExportData}
            />
            <ActionButton
              title="Reset Settings"
              subtitle="Restore all settings to default values"
              icon="refresh"
              onPress={handleResetSettings}
              color="#666"
            />
            <ActionButton
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              icon="delete"
              onPress={handleDeleteAccount}
              color="#FF4444"
            />
          </Section>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#fff" style={styles.logoutIcon} />
            <StyledText style={styles.logoutText}>Logout</StyledText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save All Settings Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAllSettings}>
          <StyledText style={styles.saveButtonText}>Save All Settings</StyledText>
        </TouchableOpacity>
      </View>

      {/* Delete Account Confirmation Modal */}
      {/* <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
        confirmText="Yes, Delete Account"
        cancelText="Cancel"
        confirmColor="#FF4444"
        icon="warning"
        details={[
          "Profile information",
          "Course progress and certificates",
          "Chat messages and communications",
          "Settings and preferences",
          "All associated data"
        ]}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Extra padding for save button
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },

  // Section Styles
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Settings Item Styles
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingsItemContent: {
    flex: 1,
    marginRight: 16,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Dropdown Styles
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 150,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: '#FFF0F5',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownOptionTextSelected: {
    color: '#E56B8C',
    fontWeight: '500',
  },

  // Action Button Styles
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonLeft: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logout Button Styles
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Save Button Styles
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 20,
    paddingBottom: 30, // Extra padding for safe area
  },
  saveButton: {
    backgroundColor: '#E56B8C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
