import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import StyledText from './StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const TeacherDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { state, ...rest } = props;
  
  // Create a new state with filtered routes
  const mainRoutes = state.routes.filter(
    (route) => !['Profile', 'Settings', 'Chat', 'Schedule Webinar', 'Calendar'].includes(route.name)
  );
  
  const newState = {
    ...state,
    routes: mainRoutes,
    index: mainRoutes.findIndex(route => route.key === state.routes[state.index].key)
  };
  
  if (newState.index === -1) {
    newState.index = 0;
  }

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <StyledText style={styles.headerTitle}>WTE Program</StyledText>
        <StyledText style={styles.headerSubtitle}>Teacher Portal</StyledText>
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Navigation</StyledText>
        <DrawerItemList state={newState} {...rest} />
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Communication</StyledText>
        <DrawerItem 
          label="Chat" 
          onPress={() => props.navigation.navigate('Chat')} 
          icon={({ size }) => <View style={styles.iconContainer}><Icon name="chat-outline" color="#000000" size={size} /></View>} 
          labelStyle={styles.drawerLabel}
        />
        <DrawerItem 
          label="Schedule Webinar" 
          onPress={() => props.navigation.navigate('Schedule Webinar')} 
          icon={({ size }) => <View style={styles.iconContainer}><Icon name="video-outline" color="#000000" size={size} /></View>} 
          labelStyle={styles.drawerLabel}
        />
        <DrawerItem 
          label="Calendar" 
          onPress={() => props.navigation.navigate('Calendar')} 
          icon={({ size }) => <View style={styles.iconContainer}><Icon name="calendar-blank-outline" color="#000000" size={size} /></View>} 
          labelStyle={styles.drawerLabel}
        />
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Account</StyledText>
        <DrawerItem 
          label="Profile" 
          onPress={() => props.navigation.navigate('Profile')} 
          icon={({ size }) => <View style={styles.iconContainer}><Icon name="account-circle-outline" color="#000000" size={size} /></View>} 
          labelStyle={styles.drawerLabel}
        />
        <DrawerItem 
          label="Settings" 
          onPress={() => props.navigation.navigate('Settings')} 
          icon={({ size }) => <View style={styles.iconContainer}><Icon name="cog-outline" color="#000000" size={size} /></View>} 
          labelStyle={styles.drawerLabel}
        />
      </View>
    </DrawerContentScrollView>
  );
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
});

export default TeacherDrawerContent;
