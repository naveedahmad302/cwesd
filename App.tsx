import React from 'react';
import { AppNavigator } from './src/shared/navigation';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/utils';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <AppNavigator />
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
};

export default App;
