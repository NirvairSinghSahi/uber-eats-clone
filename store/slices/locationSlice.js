import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  selectedLocation: null,
  loading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setSelectedLocation: (state, action) => {
      state.selectedLocation = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setCurrentLocation, setSelectedLocation, setLoading, setError, clearError } = locationSlice.actions;

export default locationSlice.reducer;

