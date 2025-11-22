import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDeliveryAddress, selectDeliveryAddress } from '../store/slices/cartSlice';
import { selectSavedAddresses, loadSavedAddresses } from '../store/slices/savedAddressesSlice';
import { searchRestaurants, searchRestaurantsNearby } from '../services/googlePlacesService';
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const deliveryAddress = useAppSelector(selectDeliveryAddress);
  const savedAddresses = useAppSelector(selectSavedAddresses);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    // Load addresses for the current user
    if (user?.uid) {
      dispatch(loadSavedAddresses(user.uid));
    } else {
      // If no user, try to load from local storage
      dispatch(loadSavedAddresses(null));
    }
  }, [dispatch, user?.uid]);

  useEffect(() => {
    if (deliveryAddress) {
      loadRestaurants(deliveryAddress);
    }
  }, [deliveryAddress]);

  const loadRestaurants = async (location) => {
    setLoading(true);
    try {
      // If location has coordinates, use nearby search, otherwise use text search
      if (location.location && location.location.lat && location.location.lng) {
        const results = await searchRestaurantsNearby(
          location.location.lat,
          location.location.lng
        );
        setRestaurants(results);
      } else {
        const results = await searchRestaurants(location.description || location);
        setRestaurants(results);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (data, details = null) => {
    if (details) {
      const address = {
        description: data.description,
        location: {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        },
      };
      // Only set as delivery address, don't save automatically
      dispatch(setDeliveryAddress(address));
      setSearchLocation(data.description);
      setShowSavedAddresses(false);
      // Navigate to restaurant list after selecting address
      navigation.navigate('RestaurantList');
    }
  };

  const handleSelectSavedAddress = (address) => {
    dispatch(setDeliveryAddress(address));
    setShowSavedAddresses(false);
    navigation.navigate('RestaurantList');
  };

  const renderRestaurantCard = (restaurant) => (
    <TouchableOpacity
      key={restaurant.id}
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant })}
    >
      <Image
        source={{ uri: restaurant.image_url || 'https://via.placeholder.com/300' }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{restaurant.rating}</Text>
          <Text style={styles.reviewCount}>
            ({restaurant.review_count} reviews)
          </Text>
        </View>
        <Text style={styles.categories} numberOfLines={1}>
          {restaurant.categories?.map((cat) => cat.title).join(', ')}
        </Text>
        {restaurant.distance && (
          <Text style={styles.distance}>
            {(restaurant.distance / 1609.34).toFixed(1)} mi away
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Uber Eats</Text>
          <Text style={styles.headerSubtitle}>Discover restaurants near you</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={32} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchLabel}>Delivery Address</Text>
          {savedAddresses.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowSavedAddresses(!showSavedAddresses)}
              style={styles.savedAddressesButton}
            >
              <Ionicons 
                name={showSavedAddresses ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#000" 
              />
              <Text style={styles.savedAddressesButtonText}>
                {showSavedAddresses ? 'Hide' : 'Show'} Saved ({savedAddresses.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showSavedAddresses && savedAddresses.length > 0 && (
          <View style={styles.savedAddressesList}>
            {savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.savedAddressItem}
                onPress={() => handleSelectSavedAddress(address)}
              >
                <Ionicons name="location" size={20} color="#000" />
                <Text style={styles.savedAddressText} numberOfLines={1}>
                  {address.description}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.manageAddressesButton}
              onPress={() => navigation.getParent()?.navigate('Profile', { screen: 'SavedAddresses' })}
            >
              <Text style={styles.manageAddressesText}>Manage Saved Addresses</Text>
            </TouchableOpacity>
          </View>
        )}

        <GooglePlacesAutocomplete
          placeholder="Enter delivery address"
          onPress={handlePlaceSelect}
          query={{
            key: GOOGLE_PLACES_CONFIG.apiKey,
            language: 'en',
            types: 'address', // Search for addresses worldwide
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
          filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
          nearbyPlacesAPI="GooglePlacesSearch"
          GooglePlacesSearchQuery={{
            rankby: 'distance',
          }}
        />
      </View>

      {deliveryAddress ? (
        <View style={styles.content}>
          <View style={styles.addressSelectedContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.addressSelectedTitle}>Address Selected!</Text>
            <Text style={styles.addressSelectedText}>{deliveryAddress.description}</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('RestaurantList')}
            >
              <Text style={styles.browseButtonText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.welcomeContainer}>
          <Ionicons name="location-outline" size={64} color="#ccc" />
          <Text style={styles.welcomeText}>Enter your delivery address to get started</Text>
          <Text style={styles.welcomeSubtext}>We'll show you restaurants near you</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    color: '#000',
  },
  restaurantsList: {
    paddingHorizontal: 16,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#000',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categories: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  distance: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  addressSelectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  addressSelectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  addressSelectedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  browseButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  savedAddressesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  savedAddressesButtonText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
    fontWeight: '600',
  },
  savedAddressesList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    maxHeight: 200,
  },
  savedAddressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  savedAddressText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
  manageAddressesButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 4,
  },
  manageAddressesText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
});

export default HomeScreen;

