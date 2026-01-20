import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '../../shared/components/StyledText';

const CalendarScreen = () => {
  return (
    <View style={styles.container}>
      <StyledText style={styles.text}>Calendar Screen</StyledText>
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

export default CalendarScreen;
