import { createSlice } from '@reduxjs/toolkit';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSavedAddresses, setAddresses } from './savedAddressesSlice';

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearError, logout } = authSlice.actions;

// Helper function to extract serializable user data
const extractUserData = (user) => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    // Don't store tokens or other non-serializable data
  };
};

// Thunk actions
let isInitialLoad = true;

export const initializeAuth = () => async (dispatch) => {
  try {
    // Clear persisted user data first
    await AsyncStorage.removeItem('user');
    
    // Sign out any existing session to force login screen on app start
    // This ensures users always see the login screen first
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (signOutError) {
      // Ignore errors if user is already signed out
      console.log('No user to sign out or sign out failed:', signOutError);
    }
    
    // Set user to null and loading to false to show login screen
    dispatch(setUser(null));
    dispatch(setLoading(false));
    
    // Set up listener for future auth changes (after manual login)
    // Use a flag to ignore the initial callback if it's a restored session
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // On initial load, ignore any restored user session
      if (isInitialLoad) {
        isInitialLoad = false;
        if (user) {
          // If there's a restored user, sign them out
          try {
            await signOut(auth);
            await AsyncStorage.removeItem('user');
          } catch (error) {
            console.log('Error signing out restored user:', error);
          }
          dispatch(setUser(null));
          return;
        }
      }
      
      // After initial load, handle normal auth state changes
      const userData = extractUserData(user);
      dispatch(setUser(userData));
      if (userData) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        // Load saved addresses for the user
        dispatch(loadSavedAddresses(userData.uid));
      } else {
        await AsyncStorage.removeItem('user');
        // Clear saved addresses when user logs out
        dispatch(setAddresses([]));
      }
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error initializing auth:', error);
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = extractUserData(userCredential.user);
    dispatch(setUser(userData));
    return { success: true, user: userData };
  } catch (error) {
    dispatch(setError(error.message));
    return { success: false, error: error.message };
  } finally {
    dispatch(setLoading(false));
  }
};

export const signup = (email, password, name) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userData = extractUserData(userCredential.user);
    dispatch(setUser(userData));
    // You can add user profile data to Firestore here
    return { success: true, user: userData };
  } catch (error) {
    dispatch(setError(error.message));
    return { success: false, error: error.message };
  } finally {
    dispatch(setLoading(false));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem('user');
    dispatch(logout());
    return { success: true };
  } catch (error) {
    dispatch(setError(error.message));
    return { success: false, error: error.message };
  }
};

export default authSlice.reducer;

