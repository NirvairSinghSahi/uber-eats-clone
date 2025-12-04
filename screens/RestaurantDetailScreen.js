import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/cartSlice';
import { getRestaurantDetails, getRestaurantReviews } from '../services/googlePlacesService';
import { getRestaurantMenu } from '../services/menuApiService';

const RestaurantDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { restaurant: initialRestaurant } = route.params;
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [reviews, setReviews] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const currentRestaurantId = useAppSelector((state) => state.cart.currentRestaurantId);

  useEffect(() => {
    loadRestaurantDetails();
  }, []);

  const loadRestaurantDetails = async () => {
    try {
      // Use place_id if available, otherwise use id
      const placeId = initialRestaurant.place_id || initialRestaurant.id;
      const [details, reviewsData] = await Promise.all([
        getRestaurantDetails(placeId),
        getRestaurantReviews(placeId),
      ]);
      // Merge details with initial restaurant to preserve all data
      const mergedRestaurant = { ...initialRestaurant, ...details };
      setRestaurant(mergedRestaurant);
      setReviews(reviewsData);
      
      // Load menu - tries API first, then falls back to generated
      try {
        const menu = await getRestaurantMenu(mergedRestaurant);
        setMenuItems(menu || []);
      } catch (error) {
        console.error('Error loading menu:', error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error loading restaurant details:', error);
      // Fallback to initial restaurant data if API call fails
      setRestaurant(initialRestaurant);
      // Still try to load menu from initial restaurant
      try {
        const menu = await getRestaurantMenu(initialRestaurant);
        setMenuItems(menu || []);
      } catch (menuError) {
        console.error('Error loading menu from initial restaurant:', menuError);
        setMenuItems([]);
      }
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


  // Menu Item Card Component with Animation (defined inside to access styles)
  const MenuItemCard = ({ item, index, onAddToCart }) => {
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemSlideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.spring(itemSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, [itemFadeAnim, itemSlideAnim, index]);

    return (
      <Animated.View
        style={[
          styles.menuItem,
          {
            opacity: itemFadeAnim,
            transform: [{ translateX: itemSlideAnim }],
          },
        ]}
      >
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToCart(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </Animated.View>
    );
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
                <MenuItemCard
                  key={index}
                  item={item}
                  index={index}
                  onAddToCart={handleAddToCart}
                />
              )) : (
                <Text style={styles.emptyMenuText}>No menu items available.</Text>
              )}
            </View>

        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.slice(0, 3).map((review, index) => (
              <View key={index} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={{ uri: review.user.image_url || 'https://via.placeholder.com/40' }}
                    style={styles.reviewAvatar}
                  />
                  <View style={styles.reviewUserInfo}>
                    <Text style={styles.reviewUserName}>{review.user.name}</Text>
                    <View style={styles.reviewRating}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}
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
  review: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noMenuText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default RestaurantDetailScreen;

