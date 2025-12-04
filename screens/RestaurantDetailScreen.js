import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/cartSlice';
import { getRestaurantDetails } from '../services/googlePlacesService';
import { getRestaurantMenu } from '../services/menuApiService';

const RestaurantDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { restaurant: initialRestaurant } = route.params;
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentRestaurantId = useAppSelector((state) => state.cart.currentRestaurantId);

  useEffect(() => {
    loadRestaurantDetails();
  }, []);

  const loadRestaurantDetails = async () => {
    try {
      const placeId = initialRestaurant.place_id || initialRestaurant.id;
      const [details, menu] = await Promise.all([
        getRestaurantDetails(placeId).catch(() => ({})),
        getRestaurantMenu(initialRestaurant).catch(() => []),
      ]);
      
      setRestaurant({ ...initialRestaurant, ...details });
      setMenuItems(menu || []);
    } catch (error) {
      console.error('Error loading restaurant details:', error);
      setRestaurant(initialRestaurant);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (!restaurant) {
      console.error('Restaurant not loaded');
      return;
    }
    
    const restaurantId = restaurant.place_id || restaurant.id;
    
    // Check if adding from a different restaurant
    if (currentRestaurantId && currentRestaurantId !== restaurantId) {
      Alert.alert(
        'Different Restaurant',
        'Your cart contains items from another restaurant. Adding items from this restaurant will clear your current cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              const cartItem = {
                id: `${restaurantId}-${item.name}`,
                name: item.name,
                price: item.price || 10,
                restaurant: restaurant.name,
                restaurantId: restaurantId,
              };
              dispatch(addToCart(cartItem));
              Alert.alert('Added to Cart', `${item.name} has been added to your cart`);
            },
          },
        ]
      );
      return;
    }
    
    const cartItem = {
      id: `${restaurantId}-${item.name}`,
      name: item.name,
      price: item.price || 10,
      restaurant: restaurant.name,
      restaurantId: restaurantId,
      restaurantCoordinates: restaurant.coordinates ? {
        lat: restaurant.coordinates.latitude,
        lng: restaurant.coordinates.longitude,
      } : null,
    };
    
    dispatch(addToCart(cartItem));
    // Show feedback
    Alert.alert('Added to Cart', `${item.name} has been added to your cart`);
  };



  // Menu items are loaded from menuService based on restaurant type

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.image_url || 'https://via.placeholder.com/400' }}
          style={styles.headerImage}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{restaurant.name}</Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.rating}>{restaurant.rating}</Text>
          <Text style={styles.reviewCount}>({restaurant.review_count} reviews)</Text>
        </View>

        <Text style={styles.categories}>
          {restaurant.categories?.map((cat) => cat.title).join(' • ')}
        </Text>

        {restaurant.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.address}>
              {restaurant.location.display_address?.join(', ')}
            </Text>
          </View>
        )}

        {restaurant.hours && (
          <View style={styles.hoursContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.hours}>
              {restaurant.hours[0]?.is_open_now ? 'Open now' : 'Closed'}
            </Text>
          </View>
        )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Menu</Text>
              {menuItems && menuItems.length > 0 ? menuItems.map((item, index) => (
                <View key={index} style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                    <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )) : (
                <Text style={styles.emptyMenuText}>No menu items available.</Text>
              )}
            </View>

      </View>
    </ScrollView>
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
    color: '#000',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  categories: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  hours: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyMenuText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default RestaurantDetailScreen;

