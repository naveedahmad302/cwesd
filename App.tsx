import React from 'react';
import { AuthProvider } from './src/features/auth';
import { AppNavigator } from './src/shared/navigation';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/utils/toast';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
      <Toast config={toastConfig} />
    </AuthProvider>
  );
};

export default App;
