import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDeliveryAddress, clearDeliveryAddress } from '../store/slices/cartSlice';
import { 
  getSavedAddresses, 
  saveAddress, 
  deleteAddress, 
  setDefaultAddress,
  updateAddress 
} from '../services/addressService';
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const ADDRESS_LABELS = ['Home', 'Work', 'Other'];

const SavedAddressesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentAddress = useAppSelector((state) => state.cart.deliveryAddress);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const preselectedLabel = route.params?.preselectedLabel;
  const [selectedLabel, setSelectedLabel] = useState(preselectedLabel || 'Home');
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadAddresses();
      if (preselectedLabel) {
        setShowAddForm(true);
      }
    }
  }, [user, preselectedLabel]);

  const loadAddresses = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const savedAddresses = await getSavedAddresses(user.uid);
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = async (data, details = null) => {
    if (!details || !user?.uid) return;

    const address = {
      description: data.description,
      location: {
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
      },
      label: selectedLabel,
      isDefault: addresses.length === 0, // First address is default
    };

    try {
      await saveAddress(user.uid, address);
      await loadAddresses();
      setShowAddForm(false);
      setSelectedAddress(null);
      Alert.alert('Success', 'Address saved successfully!');
    } catch (error) {
      const errorMessage = error.message || 'Failed to save address';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSelectAddress = (address) => {
    dispatch(setDeliveryAddress({
      description: address.description,
      location: address.location,
    }));
    navigation.goBack();
  };

  const handleSetDefault = async (addressId) => {
    if (!user?.uid) return;
    
    try {
      await setDefaultAddress(user.uid, addressId);
      await loadAddresses();
      Alert.alert('Success', 'Default address updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if this is the current delivery address
              const addressToDelete = addresses.find(addr => addr.id === addressId);
              const isCurrentAddress = currentAddress && 
                addressToDelete && 
                currentAddress.description === addressToDelete.description;
              
              await deleteAddress(addressId);
              const updatedAddresses = await getSavedAddresses(user.uid);
              
              // If this was the current delivery address, clear it
              if (isCurrentAddress) {
                dispatch(clearDeliveryAddress());
              }
              
              // If all addresses are deleted, clear the delivery address
              if (updatedAddresses.length === 0 && currentAddress) {
                dispatch(clearDeliveryAddress());
              }
              
              await loadAddresses();
              Alert.alert('Success', 'Address deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const getLabelIcon = (label) => {
    switch (label) {
      case 'Home':
        return 'home';
      case 'Work':
        return 'briefcase';
      default:
        return 'location';
    }
  };

  const getLabelColor = (label) => {
    switch (label) {
      case 'Home':
        return '#4CAF50';
      case 'Work':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addFormContainer}>
          <Text style={styles.formTitle}>Add New Address</Text>
          
          <View style={styles.labelSelector}>
            {ADDRESS_LABELS.map((label) => {
              // Check if Home address already exists
              const homeExists = label === 'Home' && addresses.some(addr => addr.label === 'Home');
              const isDisabled = homeExists;
              
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.labelOption,
                    selectedLabel === label && styles.labelOptionActive,
                    isDisabled && styles.labelOptionDisabled,
                    { borderColor: getLabelColor(label) },
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      setSelectedLabel(label);
                    } else {
                      Alert.alert(
                        'Home Address Exists',
                        'You can only have one "Home" address. Please delete the existing one first or choose "Work" or "Other".'
                      );
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Ionicons
                    name={getLabelIcon(label)}
                    size={20}
                    color={
                      isDisabled
                        ? '#ccc'
                        : selectedLabel === label
                        ? '#fff'
                        : getLabelColor(label)
                    }
                  />
                  <Text
                    style={[
                      styles.labelOptionText,
                      selectedLabel === label && styles.labelOptionTextActive,
                      isDisabled && styles.labelOptionTextDisabled,
                    ]}
                  >
                    {label}
                  </Text>
                  {isDisabled && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <GooglePlacesAutocomplete
            placeholder="Search for an address"
            onPress={handlePlaceSelect}
            query={{
              key: GOOGLE_PLACES_CONFIG.apiKey,
              language: GOOGLE_PLACES_CONFIG.language,
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            debounce={400}
            minLength={2}
            styles={{
              container: styles.autocompleteContainer,
              textInputContainer: styles.textInputContainer,
              textInput: styles.textInput,
              listView: styles.listView,
            }}
          />
        </View>
      )}

      <ScrollView style={styles.content}>
        {addresses.length === 0 && !showAddForm ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <Text style={styles.emptySubtext}>
              Add an address to get started
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addFirstButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressInfo}>
                  <View
                    style={[
                      styles.labelBadge,
                      { backgroundColor: `${getLabelColor(address.label || 'Other')}20` },
                    ]}
                  >
                    <Ionicons
                      name={getLabelIcon(address.label || 'Other')}
                      size={16}
                      color={getLabelColor(address.label || 'Other')}
                    />
                    <Text
                      style={[
                        styles.labelText,
                        { color: getLabelColor(address.label || 'Other') },
                      ]}
                    >
                      {address.label || 'Other'}
                    </Text>
                  </View>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressActions}>
                  {!address.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Ionicons name="star-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteAddress(address.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.addressDescription}>{address.description}</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectAddress(address)}
              >
                <Text style={styles.selectButtonText}>Use This Address</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  addButton: {
    padding: 4,
  },
  addFormContainer: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  labelSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  labelOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  labelOptionActive: {
    backgroundColor: '#000',
  },
  labelOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  labelOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 6,
  },
  labelOptionTextActive: {
    color: '#fff',
  },
  labelOptionTextDisabled: {
    color: '#ccc',
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textInput: {
    height: 44,
    color: '#000',
    fontSize: 16,
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  addressDescription: {
    fontSize: 14,
    color: '#000',
    marginBottom: 12,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SavedAddressesScreen;

