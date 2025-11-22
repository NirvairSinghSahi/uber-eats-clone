import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectDeliveryAddress, setDeliveryAddress } from '../store/slices/cartSlice';
import { 
  selectSavedAddresses, 
  loadSavedAddresses, 
  saveAddressToStorage, 
  deleteAddressFromStorage 
} from '../store/slices/savedAddressesSlice';
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const SavedAddressesScreen = () => {
  const dispatch = useAppDispatch();
  const currentAddress = useAppSelector(selectDeliveryAddress);
  const savedAddresses = useAppSelector(selectSavedAddresses);
  const user = useAppSelector((state) => state.auth.user);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Load addresses for the current user
    if (user?.uid) {
      dispatch(loadSavedAddresses(user.uid));
    } else {
      // If no user, try to load from local storage
      dispatch(loadSavedAddresses(null));
    }
  }, [dispatch, user?.uid]);

  const handleAddAddress = (data, details = null) => {
    if (details) {
      const address = {
        description: data.description,
        location: {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        },
      };

      dispatch(saveAddressToStorage(address, user?.uid))
        .then(() => {
          Alert.alert('Success', 'Address saved successfully!');
          setShowAddModal(false);
        })
        .catch((error) => {
          console.error('Error saving address:', error);
          Alert.alert('Error', 'Failed to save address. Please try again.');
        });
    }
  };

  const handleSelectAddress = (address) => {
    dispatch(setDeliveryAddress(address));
    Alert.alert('Success', 'Delivery address updated');
  };

  const handleDeleteAddress = (addressToDelete) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteAddressFromStorage(addressToDelete.id, user?.uid))
              .then(() => {
                // If deleting current address, clear it from Redux
                if (currentAddress && currentAddress.description === addressToDelete.description) {
                  dispatch(setDeliveryAddress(null));
                }
                Alert.alert('Success', 'Address deleted');
              })
              .catch((error) => {
                console.error('Error deleting address:', error);
                Alert.alert('Error', 'Failed to delete address. Please try again.');
              });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
      </View>

      <ScrollView style={styles.content}>
        {savedAddresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <Text style={styles.emptySubtext}>
              Add addresses for faster checkout
            </Text>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {savedAddresses.map((address) => {
              const isCurrentAddress = currentAddress && 
                currentAddress.description === address.description;
              
              return (
                <View key={address.id} style={[
                  styles.addressCard,
                  isCurrentAddress && styles.currentAddressCard
                ]}>
                  <View style={styles.addressInfo}>
                    <Ionicons 
                      name="location" 
                      size={24} 
                      color={isCurrentAddress ? "#4CAF50" : "#000"} 
                    />
                    <View style={styles.addressDetails}>
                      <Text style={styles.addressText}>{address.description}</Text>
                      {isCurrentAddress && (
                        <Text style={styles.currentLabel}>Current delivery address</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.addressActions}>
                    {!isCurrentAddress && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSelectAddress(address)}
                      >
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteAddress(address)}
                    >
                      <Ionicons name="trash-outline" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#000" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </TouchableOpacity>

      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <GooglePlacesAutocomplete
                placeholder="Enter address to save"
                onPress={handleAddAddress}
                query={{
                  key: GOOGLE_PLACES_CONFIG.apiKey,
                  language: 'en',
                  types: 'address',
                }}
                fetchDetails={true}
                enablePoweredByContainer={false}
                debounce={400}
                minLength={2}
                returnKeyType="search"
                listViewDisplayed="auto"
                styles={{
                  container: styles.autocompleteContainer,
                  textInputContainer: styles.textInputContainer,
                  textInput: styles.textInput,
                  listView: styles.listView,
                  row: styles.autocompleteRow,
                }}
                GooglePlacesDetailsQuery={{
                  fields: 'geometry,formatted_address,address_components',
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addressesList: {
    padding: 16,
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  currentAddressCard: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  addressInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  addressDetails: {
    marginLeft: 12,
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  currentLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 0,
  },
  textInput: {
    height: 44,
    color: '#000',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
  },
  autocompleteRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default SavedAddressesScreen;
