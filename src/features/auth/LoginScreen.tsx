import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { StyledText } from '../../shared/components';
import { useAuth } from './AuthContext';
import { typography } from '../../theme/typography';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});
  const { login } = useAuth();

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      
      if (savedRememberMe === 'true' && savedEmail) {
        setEmail(savedEmail);
        if (savedPassword) {
          setPassword(savedPassword);
        }
        setRememberMe(true);
      } else {
        // Set default demo credentials for testing
        setEmail('itzjedrick@gmail.com');
      }
    } catch (error) {
      console.error('Failed to load saved credentials:', error);
      setEmail('itzjedrick@gmail.com');
    }
  };

  const validateForm = () => {
    const newErrors: {email?: string, password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.multiRemove(['savedEmail', 'savedPassword', 'rememberMe']);
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  };

 const handleLogin = async () => {
  // Clear previous errors
  setErrors({});
  
  // Validate form
  if (!validateForm()) {
    return;
  }

  try {
    setIsLoading(true);
    
    // Save credentials if remember me is checked
    await saveCredentials();
    
    // Attempt login
    await login(email, password);
    
    showSuccessToast(`Welcome back!`, 'Login Successful');

    // Navigation is handled by the AuthContext and AppNavigator
  } catch (error: any) {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showErrorToast(errorMessage, 'Login Failed');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <ImageBackground 
      source={require('../../assets/icons/bg-img.png')}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <StyledText style={styles.title}>Sign In</StyledText>
          <StyledText style={styles.subtitle}>Enter your ID and Password to continue</StyledText>

          <StyledText style={styles.label}>User ID</StyledText>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="demo@gmail.com"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors({...errors, email: undefined});
              }
            }}
          />
          {errors.email && <StyledText style={styles.errorText}>{errors.email}</StyledText>}

          <StyledText style={styles.label}>Password</StyledText>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="••••••••"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors({...errors, password: undefined});
              }
            }}
          />
          {errors.password && <StyledText style={styles.errorText}>{errors.password}</StyledText>}

          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={styles.checkbox} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <StyledText style={styles.checkmark}>✓</StyledText>}
              </View>
            </TouchableOpacity>
            <StyledText style={styles.checkboxLabel}>Remember Me</StyledText>
          </View>

          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={() => showInfoToast('Forgot password feature coming soon!', 'Forgot Password')}
          >
            <StyledText style={styles.forgotPasswordText}>Forgot Password?</StyledText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              isLoading && styles.buttonDisabled,
              (!email || !password) && styles.buttonDisabled
            ]} 
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <StyledText style={styles.buttonText}>
                {email && password ? 'Login' : 'Enter Credentials'}
              </StyledText>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <StyledText style={styles.footerText}>Don't have an Account? </StyledText>
            <TouchableOpacity onPress={() => showInfoToast('Sign up feature coming soon!', 'Sign Up')}>
              <StyledText style={styles.linkText}>Sign up</StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.7,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  card: {
    width: '90%',
   
    borderRadius: 20,
    padding: 14,
    
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 32,
    textAlign: 'left',
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
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    fontFamily: typography.primary,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 16,
    marginLeft: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#E56B8C',
    borderColor: '#E56B8C',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1E1E1E',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#E56B8C',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#E56B8C',
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
    color: '#E56B8C',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;


