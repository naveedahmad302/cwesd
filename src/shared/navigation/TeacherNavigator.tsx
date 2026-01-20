import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherDrawerNavigator from './TeacherDrawerNavigator';

const Stack = createNativeStackNavigator();

const TeacherNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherDrawer" component={TeacherDrawerNavigator} />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;
