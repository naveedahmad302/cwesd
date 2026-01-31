import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  House,
  BookOpen,
  Calendar,
  MessageSquare,
  Award,
  ChartColumn,
  User,
  PanelLeft,
} from 'lucide-react-native';

// Student Screens
import { DashboardScreen } from '../../screens/student';
import { CalendarScreen } from '../../screens/student';
import { ChatWithTeacherScreen } from '../../screens/student';
import { CertificatesScreen } from '../../screens/student';
import { AnalyticsScreen } from '../../screens/student';
import { ProfileScreen } from '../../screens/common';
import CourseContentScreen from '../../screens/student/CourseContentScreen';
import CourseDetailScreen from '../../screens/student/CourseDetailScreen';

// Custom Drawer
import { CustomDrawerContent } from '../components';
import ProfileHeaderButton from '../components/ProfileHeaderButton';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={props => <CustomDrawerContent {...props} />}
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
            userType="student"
            navigation={navigation}
          />
        ),
        drawerActiveBackgroundColor: 'black',
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
          paddingHorizontal: 10,
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
        component={DashboardScreen}
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="CourseContent"
        component={CourseContentScreen}
        options={{
          drawerLabel: 'Course Content',
          drawerIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          drawerLabel: 'Calendar',
          drawerIcon: ({ color, size }) => (
            <Calendar color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Chat with Teacher"
        component={ChatWithTeacherScreen}
        options={{
          drawerLabel: 'Chat with Teacher',
          drawerIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Certificates"
        component={CertificatesScreen}
        options={{
          drawerLabel: 'Certificates',
          drawerIcon: ({ color, size }) => <Award color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          drawerLabel: 'Analytics',
          drawerIcon: ({ color, size }) => (
            <ChartColumn color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{
          drawerLabel: () => null, // Hide from drawer
          drawerItemStyle: { display: 'none' }, // Hide from drawer
          title: 'Course Detail',
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
