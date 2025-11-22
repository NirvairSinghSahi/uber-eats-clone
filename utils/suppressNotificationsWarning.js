// Suppress expo-notifications warnings/errors on Android in Expo Go
// This needs to be imported BEFORE expo-notifications to catch the errors
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  // Helper function to check if message should be suppressed
  const shouldSuppress = (message) => {
    if (!message || typeof message !== 'string') return false;
    return message.includes('expo-notifications') && 
           ((message.includes('Android Push notifications') || 
             message.includes('remote notifications') ||
             message.includes('not fully supported')) && 
            (message.includes('Expo Go') || 
             message.includes('SDK 53') || 
             message.includes('development build') ||
             message.includes('dev-client')));
  };
  
  console.error = (...args) => {
    // Check all arguments for the notification error message
    const fullMessage = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg && typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    // Suppress the specific Expo Go push notification error
    if (shouldSuppress(fullMessage)) {
      // Silently ignore - we're only using local notifications which work in Expo Go
      return;
    }
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    // Check all arguments for the notification warning message
    const fullMessage = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg && typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    // Suppress the specific Expo Go push notification warning
    if (shouldSuppress(fullMessage)) {
      // Silently ignore - we're only using local notifications which work in Expo Go
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Also suppress if logged via console.log (some versions might use this)
  console.log = (...args) => {
    const fullMessage = args.map(arg => String(arg)).join(' ');
    if (shouldSuppress(fullMessage)) {
      return;
    }
    originalLog.apply(console, args);
  };
}

