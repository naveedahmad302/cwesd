import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { House, BookOpen, Calendar, MessageSquare, Award, ChartColumn, User, PanelLeft } from 'lucide-react-native';


// Student Screens
import { DashboardScreen } from '../../features/student';
import { CalendarScreen } from '../../features/student';
import { ChatWithTeacherScreen } from '../../features/student';
import { CertificatesScreen } from '../../features/student';
import { AnalyticsScreen } from '../../features/student';
import { ProfileScreen } from '../../features/common';
import { SettingsScreen } from '../../features/common';
import CourseNavigator from './CourseNavigator';
import CourseDetailScreen from '../../features/student/CourseDetailScreen';

// Custom Drawer
import { CustomDrawerContent } from '../components';
import ProfileHeaderButton from '../components/ProfileHeaderButton';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard" 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        component={DashboardScreen} 
        options={{ 
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Drawer.Screen 
        name="CourseContent" 
        component={CourseNavigator} 
        options={{ 
          drawerLabel: 'Course Content',
          drawerIcon: ({ color, size }) => <BookOpen color={color} size={size}  />

        }}
      />
      <Drawer.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ 
          drawerLabel: 'Calendar',
          drawerIcon: ({ color, size }) => <Calendar color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Chat with Teacher" 
        component={ChatWithTeacherScreen} 
        options={{
          drawerLabel: 'Chat with Teacher',
          drawerIcon: ({ color, size }) => <MessageSquare  color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Certificates" 
        component={CertificatesScreen} 
        options={{ 
          drawerLabel: 'Certificates',
          drawerIcon: ({ color, size }) => <Award  color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ 
          drawerLabel: 'Analytics',
          drawerIcon: ({ color, size }) => <ChartColumn color={color} size={size} />
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
          options={{ drawerIcon: ({ color, size }) => <User  color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="cog-outline" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen} 
        options={{ 
          drawerLabel: () => null, // Hide from drawer
          drawerItemStyle: { display: 'none' }, // Hide from drawer
          title: 'Course Detail'
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginLeft: -16,
  },
});

export default DrawerNavigator;

