import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { StyledText } from '../../shared/components';
import { useAuth } from './AuthContext';
import { typography } from '../../theme/typography';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toast';


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

 const handleLogin = async () => {
  if (!email || !password) {
    showErrorToast('Please enter both email and password.', 'Validation Error');
    return;
  }

  try {
    setIsLoading(true);
    await login(email, password);
    
    showSuccessToast(`Welcome back`, 'Login Successful');

    // Navigation is handled by the AuthContext and AppNavigator
  } catch (error) {
    console.error('Login error:', error);
    showErrorToast('Incorrect credentials. Please try again.', 'Login Failed');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <StyledText style={styles.title}>Login</StyledText>
        <StyledText style={styles.subtitle}>Women Technical Entrepreneurship Program</StyledText>

        <StyledText style={styles.label}>Email</StyledText>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#A0A0A0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <StyledText style={styles.label}>Password</StyledText>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#A0A0A0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <StyledText style={styles.buttonText}>Login</StyledText>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <StyledText style={styles.footerText}>New student? </StyledText>
          <TouchableOpacity onPress={() => showInfoToast('Sign up feature coming soon!', 'Sign Up')}>
            <StyledText style={styles.linkText}>Sign up here</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.7,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FA', // Light lavender/pink background
  },
  card: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: '#1E1E1E',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    fontFamily: typography.primary,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#E91E63', // Pink button color
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#1E1E1E',
    fontSize: 14,
  },
  linkText: {
    color: '#E91E63', // Pink link color
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;


