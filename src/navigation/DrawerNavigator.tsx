import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
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
      initialRouteName="Dashboard" // Set initial route to Dashboard
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        component={DashboardScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="home-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="My Modules" 
        component={MyModulesScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="book-open-page-variant-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="calendar-blank-outline" color={color} size={size} /></View> }}
      />
      <Drawer.Screen 
        name="Chat with Teacher" 
        component={ChatWithTeacherScreen} 
        options={{
          drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="chat-outline" color={color} size={size} /></View>,
          // drawerItemStyle: { backgroundColor: '#00FFC2' } // Highlight color
        }}
      />
      <Drawer.Screen 
        name="Certificates" 
        component={CertificatesScreen} 
        options={{ drawerIcon: ({ color, size }) => <View style={styles.iconContainer}><Icon name="certificate-outline" color={color} size={size} /></View> }}
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

const styles = StyleSheet.create({
  iconContainer: {
    marginLeft: -16,
  },
});

export default DrawerNavigator;

