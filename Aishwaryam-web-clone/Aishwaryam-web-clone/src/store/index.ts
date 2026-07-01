import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import kycReducer from './slices/kycSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kyc: kycReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom typed hooks for Redux to ensure compile-time Type safety
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
