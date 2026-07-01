import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { SessionManager, OnboardingStage } from '../../utils/SessionManager';

interface AuthState {
  userId: string | null;
  phoneNumber: string | null;
  onboardingStage: OnboardingStage;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  userId: SessionManager.getUserId(),
  phoneNumber: SessionManager.getPhoneNumber(),
  onboardingStage: SessionManager.getOnboardingStage(),
  token: SessionManager.getToken(),
  isAuthenticated: !!SessionManager.getToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ userId: string; token: string; refreshToken: string }>) {
      const { userId, token, refreshToken } = action.payload;
      state.userId = userId;
      state.token = token;
      state.isAuthenticated = true;
      SessionManager.saveSession(userId, token, refreshToken);
    },
    setPhoneNumber(state, action: PayloadAction<string>) {
      state.phoneNumber = action.payload;
      SessionManager.savePhoneNumber(action.payload);
    },
    setOnboardingStage(state, action: PayloadAction<OnboardingStage>) {
      state.onboardingStage = action.payload;
      SessionManager.saveOnboardingStage(action.payload);
    },
    clearSession(state) {
      state.userId = null;
      state.phoneNumber = null;
      state.onboardingStage = OnboardingStage.NONE;
      state.token = null;
      state.isAuthenticated = false;
      SessionManager.clearSession();
    },
  },
});

export const { setSession, setPhoneNumber, setOnboardingStage, clearSession } = authSlice.actions;
export default authSlice.reducer;
