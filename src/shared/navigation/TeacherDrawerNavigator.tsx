import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import { House, BookOpen, Users, ClipboardCheck, FileCheck, HelpCircle, MessageSquare, Video, Calendar as CalendarIcon, User, PanelLeft } from 'lucide-react-native';

// Teacher Screens
import { TeacherDashboardScreen } from '../../features/teacher';
import { TeacherModulesScreen } from '../../features/teacher';
import { TeacherStudentsScreen } from '../../features/teacher';
import { TeacherCalendarScreen } from '../../features/teacher';
import { TeacherGradesScreen } from '../../features/teacher';
import { TeacherQuizzesScreen } from '../../features/teacher';
import { TeacherChatScreen } from '../../features/teacher';
import { TeacherWebinarScreen } from '../../features/teacher';
import { ProfileScreen } from '../../features/common';

// Custom Drawer
import { TeacherDrawerContent } from '../components';
import ProfileHeaderButton from '../components/ProfileHeaderButton';

const Drawer = createDrawerNavigator();

const TeacherDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <TeacherDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F9FAFB',
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
          elevation: 0,
        },
        headerTintColor: 'black',
        headerTitleStyle: {
          fontFamily: 'FiraCode-Regular',
        },
        headerLeft: () => (
          <PanelLeft 
            size={24} 
            color="black" 
            style={{ marginLeft: 17 }}
            onPress={() => navigation.openDrawer()}
          />
        ),
        headerRight: () => (
          <ProfileHeaderButton 
            onPress={() => navigation.navigate('Profile')}
            userType="teacher"
            navigation={navigation}
          />
        ),
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
          marginHorizontal: 10,
          marginVertical: 0,
          paddingHorizontal:10,
        },
        drawerStyle: {
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
          elevation: 0,
        },
      })}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={TeacherDashboardScreen} 
        options={{ 
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => <House color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Manage Modules" 
        component={TeacherModulesScreen} 
        options={{ 
          drawerLabel: 'Manage Modules',
          drawerIcon: ({ color, size }) => <BookOpen color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Students" 
        component={TeacherStudentsScreen} 
        options={{ 
          drawerLabel: 'Students',
          drawerIcon: ({ color, size }) => <Users color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Grade Assignments" 
        component={TeacherGradesScreen} 
        options={{ 
          drawerLabel: 'Grade Assignments',
          drawerIcon: ({ color, size }) => <FileCheck  color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Quizzes" 
        component={TeacherQuizzesScreen} 
        options={{ 
          drawerLabel: 'Quizzes',
          drawerIcon: ({ color, size }) => <HelpCircle color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Chat" 
        component={TeacherChatScreen} 
        options={{ 
          drawerLabel: 'Chat',
          drawerIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Schedule Webinar" 
        component={TeacherWebinarScreen} 
        options={{ 
          drawerLabel: 'Schedule Webinar',
          drawerIcon: ({ color, size }) => <Video color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Calendar" 
        component={TeacherCalendarScreen} 
        options={{ 
          drawerLabel: 'Calendar',
          drawerIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
});

export default TeacherDrawerNavigator;
