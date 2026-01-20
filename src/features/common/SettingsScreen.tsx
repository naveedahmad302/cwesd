import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../auth';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';

const SettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const isMounted = useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to Login screen and reset the navigation stack
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
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <StyledText style={styles.title}>Settings</StyledText>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="logout" size={24} color="#fff" style={styles.icon} />
          <StyledText style={styles.logoutText}>Logout</StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
});

export default SettingsScreen;