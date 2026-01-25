import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CourseContentScreen } from '../../features/student';
import CourseDetailScreen from '../../features/student/CourseDetailScreen';

const Stack = createNativeStackNavigator();

const CourseNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CourseContent" component={CourseContentScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
    </Stack.Navigator>
  );
};

export default CourseNavigator;
