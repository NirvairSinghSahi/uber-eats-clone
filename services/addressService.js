// Address Service - Manages saved addresses for users
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Save an address for a user
 * @param {string} userId - User ID
 * @param {Object} address - Address object with description, location, label, etc.
 * @returns {Promise<string>} Address document ID
 */
export const saveAddress = async (userId, address) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const label = address.label || 'Other';
    
    // If trying to save a "Home" address, check if one already exists
    if (label === 'Home') {
      const existingAddresses = await getSavedAddresses(userId);
      const existingHome = existingAddresses.find(addr => addr.label === 'Home');
      
      if (existingHome) {
        throw new Error('You can only have one "Home" address. Please delete the existing one first or use a different label.');
      }
    }

    const addressData = {
      userId,
      description: address.description,
      location: address.location || null,
      label: label, // 'Home', 'Work', 'Other'
      isDefault: address.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await unsetOtherDefaults(userId);
    }

    const docRef = await addDoc(collection(db, 'savedAddresses'), addressData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving address:', error);
    throw error;
  }
};

/**
 * Get all saved addresses for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of saved addresses
 */
export const getSavedAddresses = async (userId) => {
  try {
    if (!userId) {
      return [];
    }

    const q = query(
      collection(db, 'savedAddresses'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const addresses = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        label: data.label || 'Other', // Ensure label always has a value
      };
    });

    // Sort: default first, then by label (Home, Work, Other), then by creation date
    addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      const labelOrder = { Home: 1, Work: 2, Other: 3 };
      const aOrder = labelOrder[a.label] || 3;
      const bOrder = labelOrder[b.label] || 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return addresses;
  } catch (error) {
    console.error('Error getting saved addresses:', error);
    return [];
  }
};

/**
 * Update an address
 * @param {string} addressId - Address document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export const updateAddress = async (addressId, updates) => {
  try {
    const addressRef = doc(db, 'savedAddresses', addressId);
    
    // Get the address to check userId
    const allAddresses = await getDocs(collection(db, 'savedAddresses'));
    const addressDoc = allAddresses.docs.find(d => d.id === addressId);
    
    if (!addressDoc) {
      throw new Error('Address not found');
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await unsetOtherDefaults(addressDoc.data().userId, addressId);
    }

    await updateDoc(addressRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating address:', error);
    return false;
  }
};

/**
 * Delete an address
 * @param {string} addressId - Address document ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAddress = async (addressId) => {
  try {
    await deleteDoc(doc(db, 'savedAddresses', addressId));
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
};

/**
 * Set an address as default
 * @param {string} userId - User ID
 * @param {string} addressId - Address document ID
 * @returns {Promise<boolean>} Success status
 */
export const setDefaultAddress = async (userId, addressId) => {
  try {
    // Unset all other defaults
    await unsetOtherDefaults(userId, addressId);
    
    // Set this one as default
    const addressRef = doc(db, 'savedAddresses', addressId);
    await updateDoc(addressRef, {
      isDefault: true,
      updatedAt: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Error setting default address:', error);
    return false;
  }
};

/**
 * Get default address for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Default address or null
 */
export const getDefaultAddress = async (userId) => {
  try {
    const addresses = await getSavedAddresses(userId);
    return addresses.find((addr) => addr.isDefault) || addresses[0] || null;
  } catch (error) {
    console.error('Error getting default address:', error);
    return null;
  }
};

/**
 * Helper function to unset other default addresses
 * @param {string} userId - User ID
 * @param {string} excludeAddressId - Address ID to exclude from update
 */
const unsetOtherDefaults = async (userId, excludeAddressId = null) => {
  try {
    const q = query(
      collection(db, 'savedAddresses'),
      where('userId', '==', userId),
      where('isDefault', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs
      .filter((doc) => doc.id !== excludeAddressId)
      .map((doc) =>
        updateDoc(doc.ref, {
          isDefault: false,
          updatedAt: new Date().toISOString(),
        })
      );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error unsetting other defaults:', error);
  }
};

export default {
  saveAddress,
  getSavedAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
};

