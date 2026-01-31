import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useAppSelector } from '../../store';
import { LoginScreen } from '../../screens/auth';
import SplashScreen from '../components/SplashScreen';
import StudentNavigator from './StudentNavigator';
import TeacherNavigator from './TeacherNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Student: undefined;
  Teacher: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

export type AuthStackParamList = {
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthStackScreen = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

const AppNavigator = () => {
  const user = useAppSelector(state => state.user.user);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 3 seconds then switch to login
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash && !user && (
          <Stack.Screen name="Splash" component={SplashScreen} />
        )}
        {!user && <Stack.Screen name="Login" component={AuthStackScreen} />}
        {user && user.role === 'teacher' && (
          <Stack.Screen name="Teacher" component={TeacherNavigator} />
        )}
        {user && user.role === 'student' && (
          <Stack.Screen name="Student" component={StudentNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
