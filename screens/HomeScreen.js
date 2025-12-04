import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDeliveryAddress, selectDeliveryAddress } from '../store/slices/cartSlice';
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const deliveryAddress = useAppSelector(selectDeliveryAddress);


  const handlePlaceSelect = (data, details = null) => {
    if (details) {
      const address = {
        description: data.description,
        location: {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        },
      };
      dispatch(setDeliveryAddress(address));
      // Navigate to restaurant list after selecting address
      navigation.navigate('RestaurantList');
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Uber Eats</Text>
          <Text style={styles.headerSubtitle}>Discover restaurants near you</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search for a city or restaurant</Text>

        <GooglePlacesAutocomplete
          placeholder="Enter city or restaurant name"
          onPress={handlePlaceSelect}
          query={{
            key: GOOGLE_PLACES_CONFIG.apiKey,
            language: 'en',
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
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
});

export default HomeScreen;

