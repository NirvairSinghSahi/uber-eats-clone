import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const SAVED_ADDRESSES_KEY = 'savedAddresses';

const initialState = {
  addresses: [],
  loading: false,
};

const savedAddressesSlice = createSlice({
  name: 'savedAddresses',
  initialState,
  reducers: {
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    addAddress: (state, action) => {
      const newAddress = {
        ...action.payload,
        id: action.payload.id || `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
      };
      
      // Check if address already exists (by description)
      const exists = state.addresses.some(
        (addr) => addr.description === newAddress.description
      );
      
      if (!exists) {
        state.addresses.push(newAddress);
      }
    },
    removeAddress: (state, action) => {
      state.addresses = state.addresses.filter(
        (addr) => addr.id !== action.payload
      );
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

// Async thunks for Firestore persistence (per user)
export const loadSavedAddresses = (userId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    
    if (!userId) {
      // If no user, try to load from AsyncStorage as fallback
      const stored = await AsyncStorage.getItem(SAVED_ADDRESSES_KEY);
      if (stored) {
        const addresses = JSON.parse(stored);
        dispatch(setAddresses(addresses));
      }
      return;
    }

    // Load from Firestore
    const addressesRef = collection(db, 'savedAddresses');
    const q = query(addressesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const addresses = [];
    querySnapshot.forEach((docSnap) => {
      addresses.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    // Sort by savedAt (newest first)
    addresses.sort((a, b) => {
      const timeA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
      const timeB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
      return timeB - timeA;
    });

    dispatch(setAddresses(addresses));
    
    // Also cache in AsyncStorage for offline access
    await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch (error) {
    console.error('Error loading saved addresses:', error);
    // Fallback to AsyncStorage if Firestore fails
    try {
      const stored = await AsyncStorage.getItem(SAVED_ADDRESSES_KEY);
      if (stored) {
        const addresses = JSON.parse(stored);
        dispatch(setAddresses(addresses));
      }
    } catch (storageError) {
      console.error('Error loading from AsyncStorage fallback:', storageError);
    }
  } finally {
    dispatch(setLoading(false));
  }
};

export const saveAddressToStorage = (address, userId) => async (dispatch, getState) => {
  let newAddress;
  try {
    newAddress = {
      ...address,
      id: address.id || `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      savedAt: new Date().toISOString(),
    };
    
    // Add to Redux state first
    dispatch(addAddress(newAddress));
    
    if (userId) {
      // Save to Firestore
      const addressRef = doc(db, 'savedAddresses', newAddress.id);
      await setDoc(addressRef, {
        userId,
        description: newAddress.description,
        location: newAddress.location,
        savedAt: newAddress.savedAt,
      });
    }
    
    // Also save to AsyncStorage as backup
    const { savedAddresses } = getState();
    await AsyncStorage.setItem(
      SAVED_ADDRESSES_KEY,
      JSON.stringify(savedAddresses.addresses)
    );
  } catch (error) {
    console.error('Error saving address:', error);
    // Revert Redux state on error
    if (newAddress && newAddress.id) {
      dispatch(removeAddress(newAddress.id));
    }
    throw error;
  }
};

export const deleteAddressFromStorage = (addressId, userId) => async (dispatch, getState) => {
  try {
    // Remove from Redux state
    dispatch(removeAddress(addressId));
    
    if (userId) {
      // Delete from Firestore
      const addressRef = doc(db, 'savedAddresses', addressId);
      await deleteDoc(addressRef);
    }
    
    // Update AsyncStorage
    const { savedAddresses } = getState();
    await AsyncStorage.setItem(
      SAVED_ADDRESSES_KEY,
      JSON.stringify(savedAddresses.addresses)
    );
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

export const { setAddresses, addAddress, removeAddress, setLoading } = savedAddressesSlice.actions;

// Selectors
export const selectSavedAddresses = (state) => state.savedAddresses.addresses;
export const selectSavedAddressesLoading = (state) => state.savedAddresses.loading;

export default savedAddressesSlice.reducer;

