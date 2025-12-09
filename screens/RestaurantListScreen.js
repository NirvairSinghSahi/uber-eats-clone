import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import { selectDeliveryAddress } from '../store/slices/cartSlice';
import { searchRestaurants, searchRestaurantsNearby } from '../services/googlePlacesService';

// Helper function to normalize category names for matching
const normalizeCategoryForMatching = (categoryName) => {
  const name = categoryName.toLowerCase().trim();
  const mappings = {
    'pizza': 'pizza',
    'pizzeria': 'pizza',
    'italian': 'italian',
    'burger': 'burgers',
    'burgers': 'burgers',
    'hamburger': 'burgers',
    'fast food': 'burgers',
    'fast_food': 'burgers',
    'american': 'burgers',
    'sushi': 'sushi',
    'japanese': 'sushi',
    'mexican': 'mexican',
    'taco': 'mexican',
    'burrito': 'mexican',
    'chinese': 'chinese',
    'indian': 'indian',
    'thai': 'thai',
    'seafood': 'seafood',
    'fish': 'seafood',
    'dessert': 'desserts',
    'desserts': 'desserts',
    'bakery': 'desserts',
    'ice cream': 'desserts',
    'cafe': 'cafe',
    'coffee': 'cafe',
  };
  
  if (mappings[name]) {
    return mappings[name];
  }
  
  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  return name;
};

const RestaurantListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const deliveryAddress = useAppSelector(selectDeliveryAddress);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const category = route.params?.category;

  useEffect(() => {
    loadRestaurants();
  }, [deliveryAddress, category]);

  const loadRestaurants = async () => {
    if (!deliveryAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let results = [];
      
      // If location has coordinates, use nearby search, otherwise use text search
      if (deliveryAddress.location && deliveryAddress.location.lat && deliveryAddress.location.lng) {
        results = await searchRestaurantsNearby(
          deliveryAddress.location.lat,
          deliveryAddress.location.lng
        );
      } else {
        results = await searchRestaurants(deliveryAddress.description || 'New York');
      }

      // Filter by category if provided
      if (category) {
        const categoryLower = category.toLowerCase();
        results = results.filter((restaurant) => {
          // Check restaurant name
          const name = (restaurant.name || '').toLowerCase();
          if (name.includes(categoryLower)) return true;

          // Check categories
          const categories = restaurant.categories || [];
          const categoryMatches = categories.some((cat) => {
            const catTitle = (cat.title || '').toLowerCase();
            const catAlias = (cat.alias || '').toLowerCase();
            // Normalize category names for matching (similar to categoryService)
            const normalizedCat = normalizeCategoryForMatching(catTitle || catAlias);
            const normalizedSearch = normalizeCategoryForMatching(categoryLower);
            return normalizedCat === normalizedSearch || 
                   catTitle.includes(categoryLower) || 
                   catAlias.includes(categoryLower);
          });
          if (categoryMatches) return true;

          // Special mappings for better matching
          const categoryMappings = {
            'pizza': ['pizza', 'pizzeria', 'italian'],
            'burgers': ['burger', 'fast food', 'fast_food', 'american'],
            'sushi': ['sushi', 'japanese'],
            'italian': ['italian', 'pizza', 'pasta'],
            'mexican': ['mexican', 'taco', 'burrito'],
            'chinese': ['chinese', 'asian'],
            'indian': ['indian', 'curry'],
            'thai': ['thai'],
            'seafood': ['seafood', 'fish'],
            'desserts': ['dessert', 'bakery', 'ice cream', 'cafe'],
          };

          const searchTerms = categoryMappings[categoryLower] || [categoryLower];
          return searchTerms.some((term) => {
            if (name.includes(term)) return true;
            return categories.some((cat) => {
              const catTitle = (cat.title || '').toLowerCase();
              const catAlias = (cat.alias || '').toLowerCase();
              return catTitle.includes(term) || catAlias.includes(term);
            });
          });
        });
      }

      setRestaurants(results);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/300' }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.reviewCount}>({item.review_count} reviews)</Text>
        </View>
        <Text style={styles.categories} numberOfLines={1}>
          {item.categories?.map((cat) => cat.title).join(', ')}
        </Text>
        {item.distance && (
          <Text style={styles.distance}>
            {(item.distance / 1609.34).toFixed(1)} mi away
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {category && (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>
            {category} Restaurants
          </Text>
        </View>
      )}
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {category ? `No ${category.toLowerCase()} restaurants found` : 'No restaurants found'}
            </Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: 16,
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
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  categoryHeader: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default RestaurantListScreen;

