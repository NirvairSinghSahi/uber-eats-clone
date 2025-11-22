import axios from 'axios';
import { GOOGLE_PLACES_CONFIG } from '../config/api';

const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Helper function to get photo URL
const getPhotoUrl = (photoReference, maxWidth = 400) => {
  if (!photoReference) return null;
  return `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_CONFIG.apiKey}`;
};

// Search restaurants by location using Text Search
export const searchRestaurants = async (location, term = 'restaurants', limit = 20) => {
  try {
    const query = `${term} in ${location}`;
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/textsearch/json`, {
      params: {
        query: query,
        type: 'restaurant',
        key: GOOGLE_PLACES_CONFIG.apiKey,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // Transform Google Places data to match Yelp format for compatibility
    const restaurants = (response.data.results || []).slice(0, limit).map((place) => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      price: place.price_level ? '$'.repeat(place.price_level) : '$$',
      image_url: place.photos && place.photos.length > 0 
        ? getPhotoUrl(place.photos[0].photo_reference) 
        : null,
      categories: place.types
        ? place.types
            .filter(type => type !== 'restaurant' && type !== 'food' && type !== 'point_of_interest' && type !== 'establishment')
            .slice(0, 3)
            .map(type => ({
              alias: type,
              title: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            }))
        : [],
      location: {
        address1: place.formatted_address || '',
        display_address: place.formatted_address ? [place.formatted_address] : [],
      },
      coordinates: {
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      },
      distance: place.distance || null,
      place_id: place.place_id,
      opening_hours: place.opening_hours,
      is_closed: !place.opening_hours?.open_now,
    }));

    return restaurants;
  } catch (error) {
    console.error('Error searching restaurants:', error);
    throw error;
  }
};

// Get restaurant details by place_id
export const getRestaurantDetails = async (placeId) => {
  try {
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,opening_hours,photos,price_level,types,geometry,website,url',
        key: GOOGLE_PLACES_CONFIG.apiKey,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const place = response.data.result;

    // Transform to match Yelp format
    return {
      id: place.place_id,
      name: place.name,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      price: place.price_level ? '$'.repeat(place.price_level) : '$$',
      image_url: place.photos && place.photos.length > 0 
        ? getPhotoUrl(place.photos[0].photo_reference, 800) 
        : null,
      photos: place.photos?.map(photo => ({
        url: getPhotoUrl(photo.photo_reference, 800),
      })) || [],
      categories: place.types
        ? place.types
            .filter(type => type !== 'restaurant' && type !== 'food' && type !== 'point_of_interest' && type !== 'establishment')
            .slice(0, 3)
            .map(type => ({
              alias: type,
              title: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            }))
        : [],
      location: {
        address1: place.formatted_address || '',
        display_address: place.formatted_address ? [place.formatted_address] : [],
      },
      phone: place.formatted_phone_number || '',
      coordinates: {
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      },
      hours: place.opening_hours ? [{
        is_open_now: place.opening_hours.open_now || false,
        hours_type: 'REGULAR',
      }] : [],
      website: place.website || '',
      url: place.url || '',
    };
  } catch (error) {
    console.error('Error getting restaurant details:', error);
    throw error;
  }
};

// Get restaurant reviews by place_id
export const getRestaurantReviews = async (placeId) => {
  try {
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'reviews',
        key: GOOGLE_PLACES_CONFIG.apiKey,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // Transform Google reviews to match Yelp format
    const reviews = (response.data.result.reviews || []).map((review) => ({
      id: review.author_name + review.time,
      rating: review.rating,
      text: review.text,
      time_created: new Date(review.time * 1000).toISOString(),
      user: {
        name: review.author_name,
        image_url: review.profile_photo_url || null,
      },
    }));

    return reviews;
  } catch (error) {
    console.error('Error getting restaurant reviews:', error);
    throw error;
  }
};

// Search restaurants by coordinates (for nearby search)
export const searchRestaurantsNearby = async (latitude, longitude, radius = 5000, limit = 20) => {
  try {
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`, {
      params: {
        location: `${latitude},${longitude}`,
        radius: radius,
        type: 'restaurant',
        key: GOOGLE_PLACES_CONFIG.apiKey,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // Transform Google Places data to match Yelp format
    const restaurants = (response.data.results || []).slice(0, limit).map((place) => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      price: place.price_level ? '$'.repeat(place.price_level) : '$$',
      image_url: place.photos && place.photos.length > 0 
        ? getPhotoUrl(place.photos[0].photo_reference) 
        : null,
      categories: place.types
        ? place.types
            .filter(type => type !== 'restaurant' && type !== 'food' && type !== 'point_of_interest' && type !== 'establishment')
            .slice(0, 3)
            .map(type => ({
              alias: type,
              title: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            }))
        : [],
      location: {
        address1: place.vicinity || '',
        display_address: place.vicinity ? [place.vicinity] : [],
      },
      coordinates: {
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      },
      distance: place.distance || null,
      place_id: place.place_id,
      opening_hours: place.opening_hours,
      is_closed: !place.opening_hours?.open_now,
    }));

    return restaurants;
  } catch (error) {
    console.error('Error searching nearby restaurants:', error);
    throw error;
  }
};

export default {
  searchRestaurants,
  getRestaurantDetails,
  getRestaurantReviews,
  searchRestaurantsNearby,
};

