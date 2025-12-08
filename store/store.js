import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // We're now storing only serializable user data, but keep this for safety
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

