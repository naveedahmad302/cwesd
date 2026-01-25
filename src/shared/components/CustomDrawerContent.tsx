import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import StyledText from './StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { User, House, BookOpen, Calendar, Award, ChartColumn, Settings, MessageSquare } from 'lucide-react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';


const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { state } = props;

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <StyledText style={styles.headerTitle}>WTE Program</StyledText>
        <StyledText style={styles.headerSubtitle}>Student Dashboard</StyledText>
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Quick Access</StyledText>
        {state.routes.filter(route => ['Dashboard', 'CourseContent', 'Calendar', 'Chat with Teacher', 'Certificates'].includes(route.name)).map((route) => {
          const IconComponent = getIconComponent(route.name);
          return (
            <DrawerItem 
              key={route.key}
              label={formatRouteName(route.name)}
              onPress={() => props.navigation.navigate(route.name)} 
              icon={({ size, color }) => <View style={styles.iconContainer}><IconComponent color={state.routeNames[state.index] === route.name ? '#000000' : '#000000'} size={size} /></View>} 
              labelStyle={[styles.drawerLabel, state.routeNames[state.index] === route.name && styles.activeLabel]}
              style={[state.routeNames[state.index] === route.name && styles.activeItem]}
              focused={state.routeNames[state.index] === route.name}
            />
          );
        })}
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Resources</StyledText>
        <DrawerItem 
          label={formatRouteName('Analytics')} 
          onPress={() => props.navigation.navigate('Analytics')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><ChartColumn color={props.state.routeNames[props.state.index] === 'Analytics' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Analytics' && styles.activeLabel]}
          style={[props.state.routeNames[props.state.index] === 'Analytics' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Analytics'}
        />
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Account</StyledText>
        <DrawerItem 
          label={formatRouteName('Profile')} 
          onPress={() => props.navigation.navigate('Profile')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><User color={props.state.routeNames[props.state.index] === 'Profile' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Profile' && styles.activeLabel]}
          style={[props.state.routeNames[props.state.index] === 'Profile' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Profile'}
        />
        <DrawerItem 
          label={formatRouteName('Settings')} 
          onPress={() => props.navigation.navigate('Settings')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><Settings color={props.state.routeNames[props.state.index] === 'Settings' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Settings' && styles.activeLabel]}
          style={[props.state.routeNames[props.state.index] === 'Settings' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Settings'}
        />
      </View>
    </DrawerContentScrollView>
  );
};

// Helper function to format route names for display
const formatRouteName = (routeName: string) => {
  const nameMap: { [key: string]: string } = {
    'Dashboard': 'Dashboard',
    'CourseContent': 'Course Content',
    'Calendar': 'Calendar',
    'Chat with Teacher': 'Chat with Teacher',
    'Certificates': 'Certificates',
    'Analytics': 'Analytics',
    'Profile': 'Profile',
    'Settings': 'Settings'
  };
  return nameMap[routeName] || routeName;
};

// Helper function to get icon components for routes
const getIconComponent = (routeName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    'Dashboard': House,
    'CourseContent': BookOpen,
    'Calendar': Calendar,
    'Chat with Teacher': MessageSquare,
    'Certificates': Award
  };
  return iconMap[routeName] || House;
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    
  },
  iconContainer: {
    marginLeft: 0,
  },
  drawerLabel: {
    // marginLeft: 20,
    color: '#000000',
    fontFamily: 'FiraCode-Regular',
    fontSize: 14,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
  sectionContainer: {
    paddingTop:20,
    // paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  activeLabel: {
    color: 'black',
    fontWeight: 'bold',
  },
  activeItem: {
    backgroundColor: '#00FFCC',
    borderRadius: 8,
  },
});

export default CustomDrawerContent;

