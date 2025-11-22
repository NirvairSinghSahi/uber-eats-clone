// Menu API Service - Fetches real restaurant menu data using Yelp API
// Falls back to generated menus if API is unavailable or fails
// Note: Uses Spoonacular API backend but configured as Yelp API

import axios from 'axios';
import { YELP_CONFIG } from '../config/api';
import { getRestaurantMenu as getGeneratedMenu } from './menuService';

const YELP_BASE_URL = YELP_CONFIG.baseUrl;

/**
 * Search for menu items by restaurant name using Yelp API
 * @param {string} restaurantName - Name of the restaurant
 * @param {string} cuisine - Cuisine type (optional)
 * @returns {Promise<Array>} Array of menu items
 */
export const searchMenuItems = async (restaurantName, cuisine = null) => {
  // If API key is not configured, return null to trigger fallback
  if (!YELP_CONFIG.apiKey || YELP_CONFIG.apiKey === 'your-yelp-api-key') {
    return null;
  }

  try {
    // Search for menu items using Yelp API (Spoonacular backend)
    const response = await axios.get(`${YELP_BASE_URL}/food/menuItems/search`, {
      params: {
        query: restaurantName,
        number: 20, // Get up to 20 items
        apiKey: YELP_CONFIG.apiKey,
      },
      timeout: 5000, // 5 second timeout
    });

    if (response.data && response.data.menuItems && response.data.menuItems.length > 0) {
      // Transform Yelp API menu items to our format
      return response.data.menuItems.map((item) => ({
        name: item.title || item.name || 'Menu Item',
        price: item.price ? parseFloat(item.price) : null,
        description: item.description || item.restaurantChain || '',
        image: item.image || null,
        id: item.id?.toString() || null,
      })).filter(item => item.name && item.name !== 'Menu Item');
    }

    return null;
  } catch (error) {
    console.log('Yelp API error (will use generated menu):', error.message);
    return null;
  }
};

/**
 * Get menu items by restaurant chain name
 * @param {string} chainName - Restaurant chain name
 * @returns {Promise<Array>} Array of menu items
 */
export const getChainMenuItems = async (chainName) => {
  if (!YELP_CONFIG.apiKey || YELP_CONFIG.apiKey === 'your-yelp-api-key') {
    return null;
  }

  try {
    const response = await axios.get(`${YELP_BASE_URL}/food/restaurants/search`, {
      params: {
        query: chainName,
        apiKey: YELP_CONFIG.apiKey,
      },
      timeout: 5000,
    });

    // If we get restaurant data, we can search for their menu items
    if (response.data && response.data.restaurants && response.data.restaurants.length > 0) {
      const restaurantId = response.data.restaurants[0].id;
      // Search for menu items from this restaurant
      return await searchMenuItems(chainName);
    }

    return null;
  } catch (error) {
    console.log('Spoonacular chain search error:', error.message);
    return null;
  }
};

/**
 * Get menu items for a restaurant using multiple strategies
 * 1. Try Yelp API with restaurant name
 * 2. Try Yelp API with cuisine type
 * 3. Fall back to generated menu based on restaurant data
 * 
 * @param {Object} restaurant - Restaurant object with name, categories, etc.
 * @returns {Promise<Array>} Array of menu items
 */
export const getRestaurantMenuFromAPI = async (restaurant) => {
  if (!restaurant) {
    return null;
  }

  const restaurantName = restaurant.name || '';
  const cuisine = restaurant.categories?.[0]?.title || restaurant.categories?.[0]?.alias || null;

  // Strategy 1: Search by restaurant name
  let menuItems = await searchMenuItems(restaurantName);
  if (menuItems && menuItems.length > 0) {
    console.log(`✅ Found ${menuItems.length} menu items from Yelp API for ${restaurantName}`);
    return menuItems;
  }

  // Strategy 2: Search by cuisine type if restaurant name didn't work
  if (cuisine) {
    menuItems = await searchMenuItems(cuisine);
    if (menuItems && menuItems.length > 0) {
      console.log(`✅ Found ${menuItems.length} menu items from Yelp API for ${cuisine} cuisine`);
      return menuItems;
    }
  }

  // Strategy 3: Fall back to generated menu
  console.log(`⚠️ No menu items found from Yelp API for ${restaurantName}, using generated menu`);
  return null;
};

/**
 * Main function to get restaurant menu - tries API first, then falls back to generated
 * @param {Object} restaurant - Restaurant object
 * @returns {Promise<Array>} Array of menu items
 */
export const getRestaurantMenu = async (restaurant) => {
  // Try to get menu from API
  const apiMenuItems = await getRestaurantMenuFromAPI(restaurant);
  
  if (apiMenuItems && apiMenuItems.length > 0) {
    // Add prices if missing (use average prices based on item type)
    return apiMenuItems.map(item => {
      if (!item.price || item.price === 0) {
        // Estimate price based on item name/description
        item.price = estimatePrice(item.name, item.description);
      }
      return item;
    });
  }

  // Fall back to generated menu
  return getGeneratedMenu(restaurant);
};

/**
 * Estimate price for menu items that don't have prices
 * @param {string} name - Item name
 * @param {string} description - Item description
 * @returns {number} Estimated price
 */
const estimatePrice = (name, description) => {
  const text = `${name} ${description}`.toLowerCase();
  
  // Price estimation based on item type
  if (text.includes('pizza')) return 14.99;
  if (text.includes('burger')) return 13.99;
  if (text.includes('pasta') || text.includes('spaghetti')) return 16.99;
  if (text.includes('salad')) return 11.99;
  if (text.includes('soup')) return 7.99;
  if (text.includes('appetizer') || text.includes('starter')) return 8.99;
  if (text.includes('dessert') || text.includes('cake') || text.includes('ice cream')) return 7.99;
  if (text.includes('drink') || text.includes('beverage') || text.includes('soda')) return 3.99;
  if (text.includes('entree') || text.includes('main')) return 18.99;
  
  // Default price
  return 12.99;
};

export default {
  getRestaurantMenu,
  searchMenuItems,
  getChainMenuItems,
};

