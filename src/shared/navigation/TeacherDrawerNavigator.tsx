import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Teacher Screens
import { TeacherDashboardScreen } from '../../features/teacher';
import { TeacherModulesScreen } from '../../features/teacher';
import { TeacherStudentsScreen } from '../../features/teacher';
import { TeacherCalendarScreen } from '../../features/teacher';
import { TeacherGradesScreen } from '../../features/teacher';
import { TeacherQuizzesScreen } from '../../features/teacher';
import { TeacherChatScreen } from '../../features/teacher';
import { TeacherWebinarScreen } from '../../features/teacher';
import { TeacherProfileScreen } from '../../features/teacher';
import { SettingsScreen } from '../../features/common';

// Custom Drawer
import { TeacherDrawerContent } from '../components';

const Drawer = createDrawerNavigator();

const TeacherDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <TeacherDrawerContent {...props} />}
      screenOptions={{
        drawerActiveBackgroundColor: '#00FFCC',
        drawerInactiveBackgroundColor: 'transparent',
        drawerActiveTintColor: '#0C0C1D',
        drawerInactiveTintColor: '#1E1E1E',
        drawerLabelStyle: { 
          marginLeft: -2, 
          fontFamily: 'FiraCode-Regular',
          paddingVertical: 0, 
          marginVertical: 0,  
          lineHeight: 10,     
        },
        drawerItemStyle: {
          borderRadius: 8, 
          marginHorizontal: 0,
          marginVertical: 0,
          paddingHorizontal:10,
        },
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={TeacherDashboardScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="home-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Manage Modules" 
        component={TeacherModulesScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="book-education-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Students" 
        component={TeacherStudentsScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="account-group-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Grade Assignments" 
        component={TeacherGradesScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="clipboard-check-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Quizzes" 
        component={TeacherQuizzesScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="help-circle-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Chat" 
        component={TeacherChatScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="chat-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Schedule Webinar" 
        component={TeacherWebinarScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="video-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Calendar" 
        component={TeacherCalendarScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="calendar-blank-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={TeacherProfileScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="account-circle-outline" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="cog-outline" color={color} size={size} /> }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginLeft: -16,
  },
});

export default TeacherDrawerNavigator;
