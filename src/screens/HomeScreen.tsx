import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '../components/StyledText';
import { HomeScreenProps } from '../navigation/AppNavigator';

const HomeScreen: React.FC<HomeScreenProps> = () => {
  return (
    <View style={styles.container}>
      <StyledText style={styles.text}>Welcome to My App!</StyledText>
    </View>
  );
}

export default HomeScreen;

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