import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '../../shared/components/StyledText';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <StyledText style={styles.text}>Profile Screen</StyledText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default ProfileScreen;
