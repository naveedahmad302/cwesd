import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import StyledText from '../components/StyledText';
import { LoginScreenProps } from '../navigation/AppNavigator';
import { typography } from '../theme/typography';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    navigation.navigate('Home');
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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <StyledText style={styles.buttonText}>Login</StyledText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <StyledText style={styles.footerText}>New student? </StyledText>
          <TouchableOpacity onPress={() => Alert.alert('Sign Up', 'Sign up feature coming soon!')}>
            <StyledText style={styles.linkText}>Sign up here</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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


