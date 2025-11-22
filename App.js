// IMPORTANT: Import this FIRST to suppress notifications warnings before expo-notifications loads
import './utils/suppressNotificationsWarning';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { store } from './store/store';
import { initializeAuth } from './store/slices/authSlice';
import { loadSettingsFromStorage } from './store/slices/settingsSlice';
import AppNavigator from './navigation/AppNavigator';

// Initialize auth listener and settings
const AuthListener = () => {
  const dispatch = store.dispatch;

  useEffect(() => {
    // Initialize auth
    const unsubscribe = dispatch(initializeAuth());
    
    // Load settings
    dispatch(loadSettingsFromStorage());

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - could navigate to order details
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      notificationListener.remove();
      responseListener.remove();
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

