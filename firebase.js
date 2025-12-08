import { initializeApp } from 'firebase/app'; //Initializes the Firebase app with your config
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; //(Stores user authentication state locally)
import { getFirestore } from 'firebase/firestore'; //(Returns the database connection to read/write data)
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; //AsyncStorage for React Native
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// Your web app's Firebase configuration
// Replace these values with your actual Firebase config from .env file
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || "your-api-key",
  authDomain: FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: FIREBASE_APP_ID || "your-app-id"
};

// Validate Firebase config
const validateConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => 
    !firebaseConfig[field] || firebaseConfig[field].includes('your-')
  );
  
  if (missingFields.length > 0) {
    console.error(
      '❌ Firebase configuration error: Missing or using placeholder values for:',
      missingFields.join(', '),
      '\n\nPlease create a .env file in the root directory with your Firebase config:\n',
      'FIREBASE_API_KEY=your_actual_key\n',
      'FIREBASE_AUTH_DOMAIN=your_actual_domain\n',
      'FIREBASE_PROJECT_ID=your_actual_project_id\n',
      'FIREBASE_STORAGE_BUCKET=your_actual_bucket\n',
      'FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id\n',
      'FIREBASE_APP_ID=your_actual_app_id\n'
    );
    throw new Error('Firebase configuration is incomplete. Please check your .env file.');
  }
};

validateConfig();

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.error('Error code:', error.code);
  console.error('Full error:', error);
  console.error('\nCurrent config values:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
  });
  console.error('\nPlease verify:');
  console.error('1. Your .env file exists in the root directory');
  console.error('2. All Firebase config values are set (no placeholders)');
  console.error('3. You have restarted Expo server after changing .env');
  console.error('4. Your Firebase project is properly set up in Firebase Console');
  throw error;
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firebase services
export const db = getFirestore(app);

export default app;

