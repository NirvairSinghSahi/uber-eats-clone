import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  deliveryAddress: null,
  currentRestaurantId: null, // Track which restaurant items are from
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      
      // If cart has items from a different restaurant, clear the cart first
      if (state.currentRestaurantId && state.currentRestaurantId !== item.restaurantId) {
        state.items = [];
      }
      
      // Set the current restaurant ID
      state.currentRestaurantId = item.restaurantId;
      
      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.id !== itemId);
      } else {
        const item = state.items.find((i) => i.id === itemId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.currentRestaurantId = null;
    },
    setDeliveryAddress: (state, action) => {
      state.deliveryAddress = action.payload;
    },
    clearDeliveryAddress: (state) => {
      state.deliveryAddress = null;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setDeliveryAddress, clearDeliveryAddress } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectDeliveryAddress = (state) => state.cart.deliveryAddress;
export const selectCartTotal = (state) => {
  return state.cart.items.reduce((total, item) => {
    return total + (item.price || 0) * item.quantity;
  }, 0);
};
export const selectCartItemCount = (state) => {
  return state.cart.items.reduce((count, item) => count + item.quantity, 0);
};
export const selectCurrentRestaurantId = (state) => state.cart.currentRestaurantId;

export default cartSlice.reducer;

