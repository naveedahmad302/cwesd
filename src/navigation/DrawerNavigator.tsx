import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import MyModulesScreen from '../screens/MyModulesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ChatWithTeacherScreen from '../screens/ChatWithTeacherScreen';
import CertificatesScreen from '../screens/CertificatesScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Custom Drawer
import CustomDrawerContent from '../components/CustomDrawerContent';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Chat with Teacher" // Set initial route to the highlighted one
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveBackgroundColor: 'transparent',
        drawerInactiveBackgroundColor: 'transparent',
        drawerActiveTintColor: '#1E1E1E',
        drawerInactiveTintColor: '#1E1E1E',
        drawerLabelStyle: { marginLeft: -20, fontFamily: 'FiraCode-Regular' },
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="My Modules" 
        component={MyModulesScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="book-open-page-variant-outline" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="calendar-blank-outline" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="Chat with Teacher" 
        component={ChatWithTeacherScreen} 
        options={{
          drawerIcon: ({ color, size }) => <Icon name="chat-outline" color={color} size={size} />,
          drawerItemStyle: { backgroundColor: '#00FFC2' } // Highlight color
        }}
      />
      <Drawer.Screen 
        name="Certificates" 
        component={CertificatesScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="certificate-outline" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ drawerIcon: ({ color, size }) => <Icon name="chart-line" color={color} size={size} /> }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
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

export default DrawerNavigator;

