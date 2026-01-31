// /**
//  * @format
//  */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */

// Polyfill DOMException for React Native (required by RTK Query timeout signals)
if (typeof global.DOMException === 'undefined') {
    global.DOMException = class DOMException extends Error {
        constructor(message, name) {
            super(message);
            this.name = name || 'DOMException';
            this.code = 0;
        }
    };
}

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { ActivityIndicator, AppRegistry, View, StyleSheet } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import { store, persistor } from './src/store';

const LoadingView = () => (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );

function HeadlessCheck({ isHeadless }) {
    // local state
    const navigationRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    // App has been launched in the background by iOS, ignore
    if (isHeadless) {
        return null;
    }
    if (isLoading) {
        return <LoadingView />;
    }

    return (
        <Provider store={store}>
            <PersistGate
                loading={
                    <LoadingView />
                }
                persistor={persistor}
            >
                <SafeAreaProvider>
                    <App {...{ navigationRef }} />
                </SafeAreaProvider>
            </PersistGate>
        </Provider>
    );
}

const styles = StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

// Enable react-native-screens
enableScreens();

AppRegistry.registerComponent(appName, () => HeadlessCheck);