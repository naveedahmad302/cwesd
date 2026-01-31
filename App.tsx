import React from 'react';
import { AppNavigator } from './src/shared/navigation';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/utils';
import { StatusBar } from 'react-native';

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <AppNavigator />
      <Toast config={toastConfig} />
    </>
  );
};

export default App;
