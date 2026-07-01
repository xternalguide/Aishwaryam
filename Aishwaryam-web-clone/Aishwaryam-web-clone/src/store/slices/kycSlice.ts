import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface KycState {
  status: 'None' | 'Pending' | 'Approved' | 'Rejected' | string;
  panNumber: string | null;
  documentType: string | null;
  rejectionReason: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: KycState = {
  status: 'None',
  panNumber: null,
  documentType: null,
  rejectionReason: null,
  isLoading: false,
  error: null,
};

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    setKycStatus(state, action: PayloadAction<{ status: string; panNumber?: string; documentType?: string; rejectionReason?: string | null }>) {
      const { status, panNumber, documentType, rejectionReason } = action.payload;
      state.status = status;
      if (panNumber !== undefined) state.panNumber = panNumber;
      if (documentType !== undefined) state.documentType = documentType;
      state.rejectionReason = rejectionReason || null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearKyc(state) {
      state.status = 'None';
      state.panNumber = null;
      state.documentType = null;
      state.rejectionReason = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setKycStatus, setLoading, setError, clearKyc } = kycSlice.actions;
export default kycSlice.reducer;
