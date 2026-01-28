import React from 'react';

import { AuthProvider } from './src/features/auth';

import { AppNavigator } from './src/shared/navigation';

import { Toast } from 'react-native-toast-message/lib/src/Toast';


const App = () => {

  return (
    <AuthProvider>

      <AppNavigator />

      <Toast />

    </AuthProvider>

  );

};



export default App;

