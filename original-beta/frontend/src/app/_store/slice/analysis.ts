import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnalysisMessage } from '@/app/(dashboard)/analysis/_action/sendAnalysis';

export interface AnalysisState {
  chatMessages: AnalysisMessage[];
}

export const initialState: AnalysisState = {
  chatMessages: [],
};

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setAnalysis: (state, action: PayloadAction<AnalysisState>) => ({
      ...state,
      ...action.payload,
    }),
    setChatMessages: (state, action: PayloadAction<AnalysisMessage[]>) => ({
      ...state,
      chatMessages: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setReset, setAnalysis, setChatMessages } = analysisSlice.actions;
export const analysisReducer = analysisSlice.reducer;
