// Delivery Time Service - Calculates accurate delivery times using Google Distance Matrix API
// Falls back to estimated time if API is unavailable

import axios from 'axios';
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const GOOGLE_DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

/**
 * Calculate delivery time using Google Distance Matrix API
 * @param {Object} origin - { lat, lng } coordinates of restaurant
 * @param {Object} destination - { lat, lng } coordinates of delivery address
 * @returns {Promise<Object>} { duration: number (minutes), distance: number (km), error: string }
 */
export const calculateDeliveryTime = async (origin, destination) => {
  // If no API key or missing coordinates, return fallback estimate
  if (!GOOGLE_PLACES_CONFIG.apiKey || 
      !origin?.lat || !origin?.lng || 
      !destination?.lat || !destination?.lng) {
    return {
      duration: 35, // Default 35 minutes
      distance: null,
      error: null,
      source: 'estimated'
    };
  }

  try {
    const response = await axios.get(GOOGLE_DISTANCE_MATRIX_URL, {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving', // Can be 'driving', 'walking', 'bicycling', 'transit'
        units: 'metric',
        key: GOOGLE_PLACES_CONFIG.apiKey,
        traffic_model: 'best_guess', // Use best_guess for traffic estimation
        departure_time: 'now', // Use current time for traffic-aware routing
      },
      timeout: 5000,
    });

    if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]?.status === 'OK') {
      const element = response.data.rows[0].elements[0];
      const durationInSeconds = element.duration_in_traffic?.value || element.duration.value;
      const distanceInMeters = element.distance.value;
      
      // Convert to minutes and kilometers
      const durationMinutes = Math.ceil(durationInSeconds / 60);
      const distanceKm = (distanceInMeters / 1000).toFixed(2);
      
      // Add buffer time for restaurant preparation (15-20 minutes)
      const preparationTime = 18;
      const totalDeliveryTime = durationMinutes + preparationTime;

      return {
        duration: totalDeliveryTime,
        distance: parseFloat(distanceKm),
        error: null,
        source: 'api'
      };
    } else {
      // API returned error, use fallback
      console.log('Distance Matrix API error:', response.data.status);
      return {
        duration: 35,
        distance: null,
        error: response.data.status,
        source: 'estimated'
      };
    }
  } catch (error) {
    console.log('Error calculating delivery time:', error.message);
    // Fallback to estimated time
    return {
      duration: 35,
      distance: null,
      error: error.message,
      source: 'estimated'
    };
  }
};

/**
 * Estimate delivery time based on distance (fallback method)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Estimated delivery time in minutes
 */
export const estimateDeliveryTimeFromDistance = (distanceKm) => {
  if (!distanceKm) return 35;
  
  // Average delivery speed: 30 km/h
  const averageSpeed = 30;
  const travelTimeMinutes = Math.ceil((distanceKm / averageSpeed) * 60);
  
  // Add preparation time
  const preparationTime = 18;
  
  return travelTimeMinutes + preparationTime;
};

export default {
  calculateDeliveryTime,
  estimateDeliveryTimeFromDistance,
};

