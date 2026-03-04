import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../features/productsSlice';
import ordersReducer from '../features/ordersSlice';
import authReducer from '../features/authSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    orders: ordersReducer,
    auth: authReducer
  }
});
