import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import StyledText from './StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { state, ...rest } = props;
  const newState = { ...state };
  // Manually filter out the screens that are not part of the main list
  newState.routes = newState.routes.filter(item => 
    !['Analytics', 'Profile', 'Settings'].includes(item.name)
  );

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <StyledText style={styles.headerTitle}>WTE Program</StyledText>
        <StyledText style={styles.headerSubtitle}>Student Dashboard</StyledText>
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Quick Access</StyledText>
        <DrawerItemList state={newState} {...rest} />
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Resources</StyledText>
        <DrawerItem 
          label="Analytics" 
          onPress={() => props.navigation.navigate('Analytics')} 
          icon={({ color, size }) => <Icon name="chart-line" color={color} size={size} />} 
          labelStyle={styles.drawerLabel}
        />
      </View>

      <View style={styles.sectionContainer}>
        <StyledText style={styles.sectionTitle}>Account</StyledText>
        <DrawerItem 
          label="Profile" 
          onPress={() => props.navigation.navigate('Profile')} 
          icon={({ color, size }) => <Icon name="account-circle-outline" color={color} size={size} />} 
          labelStyle={styles.drawerLabel}
        />
        <DrawerItem 
          label="Settings" 
          onPress={() => props.navigation.navigate('Settings')} 
          icon={({ color, size }) => <Icon name="cog-outline" color={color} size={size} />} 
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
  },
  headerTitle: {
  drawerLabel: {
    marginLeft: -20,
    fontFamily: 'FiraCode-Regular',
    fontSize: 14,
  },
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 10,
  },
});

export default CustomDrawerContent;

