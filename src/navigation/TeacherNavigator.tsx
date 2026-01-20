import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherModulesScreen from '../screens/teacher/TeacherModulesScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

const Stack = createNativeStackNavigator();

const TeacherNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TeacherDashboard" 
        component={TeacherDashboardScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TeacherModules" 
        component={TeacherModulesScreen} 
        options={{ title: 'My Modules' }}
      />
      <Stack.Screen 
        name="TeacherProfile" 
        component={TeacherProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;
