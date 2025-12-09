import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './store/store';
import { initializeAuth } from './store/slices/authSlice';
import AppNavigator from './navigation/AppNavigator';

// Suppress Firestore BloomFilter warning (harmless, known issue in Firestore v11.x)
LogBox.ignoreLogs([
  'BloomFilter error',
  'BloomFilterError',
  '@firebase/firestore: Firestore',
]);

// Initialize auth listener
const AuthListener = () => {
  const dispatch = store.dispatch;

  useEffect(() => {
    // Initialize auth
    const unsubscribe = dispatch(initializeAuth());

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [dispatch]);

  return null;
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthListener />
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

