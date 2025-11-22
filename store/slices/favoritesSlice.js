import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  restaurants: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      const restaurant = action.payload;
      const exists = state.restaurants.find((r) => r.id === restaurant.id);
      if (!exists) {
        state.restaurants.push(restaurant);
      }
    },
    removeFavorite: (state, action) => {
      const restaurantId = action.payload;
      state.restaurants = state.restaurants.filter(
        (r) => r.id !== restaurantId && r.place_id !== restaurantId
      );
    },
    toggleFavorite: (state, action) => {
      const restaurant = action.payload;
      // Check by both id and place_id
      const index = state.restaurants.findIndex((r) => 
        r.id === restaurant.id || 
        r.place_id === restaurant.place_id ||
        (restaurant.id && r.id === restaurant.id) ||
        (restaurant.place_id && r.place_id === restaurant.place_id)
      );
      if (index >= 0) {
        state.restaurants.splice(index, 1);
      } else {
        state.restaurants.push(restaurant);
      }
    },
    clearFavorites: (state) => {
      state.restaurants = [];
    },
  },
});

export const { addFavorite, removeFavorite, toggleFavorite, clearFavorites } = favoritesSlice.actions;

// Selectors
export const selectFavorites = (state) => state.favorites.restaurants;
export const selectIsFavorite = (state, restaurantId) => {
  if (!restaurantId) return false;
  return state.favorites.restaurants.some((r) => 
    r.id === restaurantId || r.place_id === restaurantId
  );
};

export default favoritesSlice.reducer;

