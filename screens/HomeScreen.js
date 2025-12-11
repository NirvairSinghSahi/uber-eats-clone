import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDeliveryAddress, selectDeliveryAddress, clearCart, clearDeliveryAddress } from '../store/slices/cartSlice';
import { logoutUser } from '../store/slices/authSlice';
import { GOOGLE_PLACES_CONFIG } from '../config/api';
import { getSavedAddresses, getDefaultAddress, saveAddress } from '../services/addressService';
import { extractCategoriesFromRestaurants, getDefaultCategories } from '../services/categoryService';
import { searchRestaurants, searchRestaurantsNearby } from '../services/googlePlacesService';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const deliveryAddress = useAppSelector(selectDeliveryAddress);
  const user = useAppSelector((state) => state.auth.user);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [restaurantCategories, setRestaurantCategories] = useState(getDefaultCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);


  useEffect(() => {
    if (user?.uid) {
      loadSavedAddresses();
      loadDefaultAddress();
    }
  }, [user]);

  // Load categories when delivery address changes
  useEffect(() => {
    if (deliveryAddress) {
      loadCategories();
    } else {
      // Reset to default categories when no address
      setRestaurantCategories(getDefaultCategories());
    }
  }, [deliveryAddress]);

  // Reload addresses when screen comes into focus (after saving or deleting)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        loadSavedAddresses();
        // Check if current delivery address still exists in saved addresses
        if (deliveryAddress) {
          getSavedAddresses(user.uid).then((addresses) => {
            const addressExists = addresses.some(
              (addr) => addr.description === deliveryAddress.description
            );
            if (!addressExists) {
              dispatch(clearDeliveryAddress());
            }
          }).catch(console.error);
        }
      } else {
        // If user is not logged in, clear delivery address if it was from saved addresses
        if (deliveryAddress) {
          dispatch(clearDeliveryAddress());
        }
      }
    }, [user, deliveryAddress, dispatch])
  );

  const loadSavedAddresses = async () => {
    if (!user?.uid) return;
    setLoadingAddresses(true);
    try {
      const addresses = await getSavedAddresses(user.uid);
      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadDefaultAddress = async () => {
    if (!user?.uid || deliveryAddress) return;
    try {
      const defaultAddr = await getDefaultAddress(user.uid);
      if (defaultAddr) {
        dispatch(setDeliveryAddress({
          description: defaultAddr.description,
          location: defaultAddr.location,
        }));
      }
    } catch (error) {
      console.error('Error loading default address:', error);
    }
  };

  const handlePlaceSelect = async (data, details = null) => {
    if (details) {
      const address = {
        description: data.description,
        location: {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        },
      };
      dispatch(setDeliveryAddress(address));
      
      // Optionally save address if user is logged in (only if not already saved)
      if (user?.uid) {
        try {
          // Check if address already exists
          const addressExists = savedAddresses.some(
            (addr) => addr.description === address.description
          );
          
          if (!addressExists) {
            // Try to save as Home first, if Home doesn't exist
            const homeExists = savedAddresses.some(addr => addr.label === 'Home');
            const labelToUse = homeExists ? 'Other' : 'Home';
            
            await saveAddress(user.uid, {
              ...address,
              label: labelToUse,
              isDefault: savedAddresses.length === 0,
            });
            await loadSavedAddresses();
          }
        } catch (error) {
          console.error('Error saving address:', error);
          // If Home already exists, try saving as Other
          if (error.message && error.message.includes('Home')) {
            try {
              await saveAddress(user.uid, {
                ...address,
                label: 'Other',
                isDefault: savedAddresses.length === 0,
              });
              await loadSavedAddresses();
            } catch (retryError) {
              console.error('Error saving address as Other:', retryError);
            }
          }
        }
      }
      
      // Navigate to restaurant list after selecting address
      navigation.navigate('RestaurantList');
    }
  };

  const handleSelectSavedAddress = (address) => {
    dispatch(setDeliveryAddress({
      description: address.description,
      location: address.location,
    }));
    navigation.navigate('RestaurantList');
  };

  const loadCategories = async () => {
    if (!deliveryAddress) return;

    setLoadingCategories(true);
    try {
      let restaurants = [];
      
      // Load restaurants to extract categories
      if (deliveryAddress.location && deliveryAddress.location.lat && deliveryAddress.location.lng) {
        restaurants = await searchRestaurantsNearby(
          deliveryAddress.location.lat,
          deliveryAddress.location.lng,
          5000, // 5km radius
          50   // Get more restaurants for better category extraction
        );
      } else {
        restaurants = await searchRestaurants(
          deliveryAddress.description || 'New York',
          'restaurants',
          50
        );
      }

      // Extract categories from loaded restaurants
      const categories = extractCategoriesFromRestaurants(restaurants);
      
      if (categories.length > 0) {
        setRestaurantCategories(categories);
      } else {
        // Fallback to default if no categories found
        setRestaurantCategories(getDefaultCategories());
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to default categories on error
      setRestaurantCategories(getDefaultCategories());
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategoryPress = (category) => {
    if (deliveryAddress) {
      // Navigate to restaurant list with category filter
      // Use originalName for better matching
      navigation.navigate('RestaurantList', { category: category.originalName || category.name });
    } else {
      Alert.alert(
        'Address Required',
        'Please select a delivery address first to browse restaurants.',
        [{ text: 'OK' }]
      );
    }
  };


  const handleLogout = () => {
    // If user is not logged in (guest), navigate to login
    if (!user || !user.uid) {
      navigation.navigate('Login');
      return;
    }

    // If user is logged in, show sign out confirmation
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Clear cart when logging out
            dispatch(clearCart());
            // Clear delivery address
            dispatch(clearDeliveryAddress());
            // Logout user
            await dispatch(logoutUser());
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Uber Eats</Text>
          <Text style={styles.headerSubtitle}>Discover restaurants near you</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.profileButton}
          >
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons 
              name={user && user.uid ? "log-out-outline" : "enter-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>
          {deliveryAddress ? 'Change address or search' : 'Search for a city or restaurant'}
        </Text>

        <GooglePlacesAutocomplete
          placeholder="Enter city or restaurant name"
          onPress={handlePlaceSelect}
          query={{
            key: GOOGLE_PLACES_CONFIG.apiKey,
            language: GOOGLE_PLACES_CONFIG.language,
          }}
          fetchDetails={true}
          enablePoweredByContainer={false}
          debounce={400}
          minLength={2}
          returnKeyType="search"
          listViewDisplayed="auto"
          renderDescription={(row) => row.description}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.textInputContainer,
            textInput: styles.textInput,
            listView: styles.listView,
            row: styles.autocompleteRow,
            separator: styles.autocompleteSeparator,
          }}
          GooglePlacesDetailsQuery={{
            fields: 'geometry,formatted_address,address_components',
          }}
        />
      </View>

      {/* Selected Address Display (only under search bar) */}
      {deliveryAddress && (
        <View style={styles.selectedAddressContainer}>
          <View style={styles.selectedAddressCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <View style={styles.selectedAddressInfo}>
              <Text style={styles.selectedAddressLabel}>Delivery Address</Text>
              <Text style={styles.selectedAddressText} numberOfLines={2}>
                {deliveryAddress.description}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('RestaurantList')}
            >
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>Browse by Category</Text>
            {loadingCategories && (
              <Text style={styles.categoriesLoadingText}>Loading...</Text>
            )}
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            nestedScrollEnabled={true}
          >
            {restaurantCategories.map((item, index) => (
              <TouchableOpacity
                key={item.originalName || item.name || index}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={32} color={item.color} />
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
                {item.count > 0 && (
                  <Text style={styles.categoryCount}>{item.count}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Saved Addresses Section */}
        <View style={styles.savedAddressesSection}>
          <View style={styles.savedAddressesHeader}>
            <Text style={styles.savedAddressesTitle}>Saved Addresses</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SavedAddresses')}
            >
              <Text style={styles.manageAddressesText}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          {savedAddresses.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.savedAddressesList}
              nestedScrollEnabled={true}
            >
              {savedAddresses
                .filter(address => address.description !== deliveryAddress?.description)
                .map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.savedAddressCard}
                    onPress={() => handleSelectSavedAddress(address)}
                  >
                    <Ionicons
                      name={(address.label || 'Other') === 'Home' ? 'home' : (address.label || 'Other') === 'Work' ? 'briefcase' : 'location'}
                      size={20}
                      color="#000"
                    />
                    <Text style={styles.savedAddressLabel} numberOfLines={1}>
                      {address.label || 'Other'}
                    </Text>
                    {address.isDefault && (
                      <View style={styles.defaultIndicator}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyAddressesContainer}>
              <Text style={styles.emptyAddressesText}>No saved addresses yet</Text>
            </View>
          )}
        </View>

        {!deliveryAddress && (
          <View style={styles.welcomeContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.welcomeText}>Enter your delivery address to get started</Text>
            <Text style={styles.welcomeSubtext}>We'll show you restaurants near you</Text>
          </View>
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  autocompleteContainer: {
    flex: 0,
    zIndex: 1,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 300,
  },
  autocompleteRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  autocompleteSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  content: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 24,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesSection: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  categoriesLoadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 90,
    position: 'relative',
  },
  categoryIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryCount: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  savedAddressesSection: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  savedAddressesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedAddressesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  manageAddressesText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  savedAddressesList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  savedAddressCard: {
    width: 100,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
    position: 'relative',
  },
  savedAddressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: 6,
    textAlign: 'center',
  },
  defaultIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  currentAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginHorizontal: 16,
  },
  currentAddressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currentAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  emptyAddressesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyAddressesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  selectedAddressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedAddressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedAddressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default HomeScreen;

