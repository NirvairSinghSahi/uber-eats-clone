// Distance Service - Calculates travel time and distance using Google Distance Matrix API
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

/**
 * Calculate travel time and distance between two points
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @param {string} mode - 'driving', 'walking', 'bicycling', 'transit' (default: 'driving')
 * @returns {Promise<Object>} { duration: number (seconds), distance: number (meters), durationText: string, distanceText: string }
 */
export const calculateTravelTime = async (origin, destination, mode = 'driving') => {
  try {
    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      throw new Error('Invalid origin or destination coordinates');
    }

    if (!GOOGLE_PLACES_CONFIG.apiKey || GOOGLE_PLACES_CONFIG.apiKey === 'your-google-places-api-key') {
      console.warn('Google Places API key not configured, using default travel time');
      // Return default estimate: 15 minutes
      return {
        duration: 900, // 15 minutes in seconds
        distance: 5000, // 5 km in meters
        durationText: '15 mins',
        distanceText: '5.0 km',
      };
    }

    const url = `${DISTANCE_MATRIX_API_URL}?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=${mode}&key=${GOOGLE_PLACES_CONFIG.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0] && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        return {
          duration: element.duration.value, // in seconds
          distance: element.distance.value, // in meters
          durationText: element.duration.text,
          distanceText: element.distance.text,
        };
      } else {
        console.warn('Distance Matrix API returned status:', element.status);
        // Return default estimate
        return {
          duration: 900,
          distance: 5000,
          durationText: '15 mins',
          distanceText: '5.0 km',
        };
      }
    } else {
      console.warn('Distance Matrix API error:', data.status);
      // Return default estimate
      return {
        duration: 900,
        distance: 5000,
        durationText: '15 mins',
        distanceText: '5.0 km',
      };
    }
  } catch (error) {
    console.error('Error calculating travel time:', error);
    // Return default estimate on error
    return {
      duration: 900,
      distance: 5000,
      durationText: '15 mins',
      distanceText: '5.0 km',
    };
  }
};

/**
 * Calculate estimated delivery time based on restaurant and delivery coordinates
 * @param {Object} restaurantCoordinates - { lat, lng }
 * @param {Object} deliveryCoordinates - { lat, lng }
 * @returns {Promise<number>} Estimated delivery time in milliseconds
 */
export const getEstimatedDeliveryTime = async (restaurantCoordinates, deliveryCoordinates) => {
  try {
    if (!restaurantCoordinates || !deliveryCoordinates) {
      // Default: 20 minutes total (prep + travel)
      return 20 * 60 * 1000; // 20 minutes in milliseconds
    }

    const travelInfo = await calculateTravelTime(restaurantCoordinates, deliveryCoordinates, 'driving');
    
    // Total time = preparation time (5-10 mins) + travel time
    const prepTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const travelTime = travelInfo.duration * 1000; // Convert seconds to milliseconds
    
    return prepTime + travelTime;
  } catch (error) {
    console.error('Error getting estimated delivery time:', error);
    // Default: 20 minutes
    return 20 * 60 * 1000;
  }
};

export default {
  calculateTravelTime,
  getEstimatedDeliveryTime,
};

