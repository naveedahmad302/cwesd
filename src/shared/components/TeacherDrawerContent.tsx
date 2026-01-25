import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import StyledText from './StyledText';
import { House, BookOpen, Users, FileCheck, HelpCircle, MessageSquare, Video, Calendar as CalendarIcon, User, Settings } from 'lucide-react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const TeacherDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { state } = props;

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <StyledText style={styles.headerTitle}>WTE Program</StyledText>
        <StyledText style={styles.headerSubtitle}>Teacher Portal</StyledText>
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Navigation</StyledText>
        {state.routes.filter(route => ['Dashboard', 'Manage Modules', 'Students', 'Grade Assignments', 'Quizzes'].includes(route.name)).map((route) => {
          const IconComponent = getIconComponent(route.name);
          return (
            <DrawerItem 
              key={route.key}
              label={route.name}
              onPress={() => props.navigation.navigate(route.name)} 
              icon={({ size, color }) => <View style={styles.iconContainer}><IconComponent color={state.routeNames[state.index] === route.name ? '#000000' : '#000000'} size={size} /></View>} 
              labelStyle={[styles.drawerLabel, state.routeNames[state.index] === route.name && styles.activeLabel]}
              style={[styles.drawerItem, state.routeNames[state.index] === route.name && styles.activeItem]}
              focused={state.routeNames[state.index] === route.name}
            />
          );
        })}
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Communication</StyledText>
        <DrawerItem 
          label="Chat" 
          onPress={() => props.navigation.navigate('Chat')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><MessageSquare color={props.state.routeNames[props.state.index] === 'Chat' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Chat' && styles.activeLabel]}
          style={[styles.drawerItem, props.state.routeNames[props.state.index] === 'Chat' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Chat'}
        />
        <DrawerItem 
          label="Schedule Webinar" 
          onPress={() => props.navigation.navigate('Schedule Webinar')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><Video color={props.state.routeNames[props.state.index] === 'Schedule Webinar' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Schedule Webinar' && styles.activeLabel]}
          style={[styles.drawerItem, props.state.routeNames[props.state.index] === 'Schedule Webinar' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Schedule Webinar'}
        />
        <DrawerItem 
          label="Calendar" 
          onPress={() => props.navigation.navigate('Calendar')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><CalendarIcon color={props.state.routeNames[props.state.index] === 'Calendar' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Calendar' && styles.activeLabel]}
          style={[styles.drawerItem, props.state.routeNames[props.state.index] === 'Calendar' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Calendar'}
        />
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Account</StyledText>
        <DrawerItem 
          label="Profile" 
          onPress={() => props.navigation.navigate('Profile')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><User color={props.state.routeNames[props.state.index] === 'Profile' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Profile' && styles.activeLabel]}
          style={[styles.drawerItem, props.state.routeNames[props.state.index] === 'Profile' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Profile'}
        />
        <DrawerItem 
          label="Settings" 
          onPress={() => props.navigation.navigate('Settings')} 
          icon={({ size, color }) => <View style={styles.iconContainer}><Settings color={props.state.routeNames[props.state.index] === 'Settings' ? '#000000' : '#000000'} size={size} /></View>} 
          labelStyle={[styles.drawerLabel, props.state.routeNames[props.state.index] === 'Settings' && styles.activeLabel]}
          style={[styles.drawerItem, props.state.routeNames[props.state.index] === 'Settings' && styles.activeItem]}
          focused={props.state.routeNames[props.state.index] === 'Settings'}
        />
      </View>
    </DrawerContentScrollView>
  );
};

// Helper function to get icon components for routes
const getIconComponent = (routeName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    'Dashboard': House,
    'Manage Modules': BookOpen,
    'Students': Users,
    'Grade Assignments': FileCheck,
    'Quizzes': HelpCircle
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
    color: '#000000',
    fontFamily: 'FiraCode-Regular',
    fontSize: 14,
    paddingVertical: 2,
    marginVertical: 0,
    lineHeight: 16,
  },
  drawerItem: {
    marginVertical: 0,
    paddingVertical: 0,
    minHeight: 46,
    height: 40,
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
  sectionContainer: {
    paddingTop: 20,
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

export default TeacherDrawerContent;
