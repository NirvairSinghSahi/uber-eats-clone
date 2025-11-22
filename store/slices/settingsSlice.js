// Settings Slice - Manages user preferences for notifications and email updates
import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  notifications: true,
  emailUpdates: false,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setEmailUpdates: (state, action) => {
      state.emailUpdates = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    loadSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { setNotifications, setEmailUpdates, setLoading, setError, loadSettings } = settingsSlice.actions;

// Thunk to load settings from AsyncStorage
export const loadSettingsFromStorage = () => async (dispatch) => {
  try {
    const settingsJson = await AsyncStorage.getItem('userSettings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      dispatch(loadSettings(settings));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// Thunk to save settings to AsyncStorage
export const saveSettings = (settings) => async (dispatch) => {
  try {
    await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    dispatch(setNotifications(settings.notifications));
    dispatch(setEmailUpdates(settings.emailUpdates));
  } catch (error) {
    console.error('Error saving settings:', error);
    dispatch(setError(error.message));
  }
};

export default settingsSlice.reducer;

