import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const INITIAL_SUMMARY_LENGTH = 100;

export interface SummaryState {
  content: string;
  domain: string;
  consideration?: string;
}

export interface InitialState extends SummaryState {
  termSummaryResult: string;
  termExplanation: string;
}

export const initialSummary: SummaryState = {
  content: '',
  domain: '',
  consideration: '',
};

export const initialState: InitialState = {
  ...initialSummary,
  termSummaryResult: '',
  termExplanation: '',
};

export const termSummarySlice = createSlice({
  name: 'termSummary',
  initialState,
  reducers: {
    setSummary: (state, action: PayloadAction<SummaryState>) => ({
      ...state,
      ...action.payload,
    }),
    setTermSummaryResult: (state, action: PayloadAction<string>) => ({
      ...state,
      termSummaryResult: action.payload,
    }),
    setTermExplanation: (state, action: PayloadAction<string>) => ({
      ...state,
      termExplanation: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setTermSummaryResult, setTermExplanation, setReset, setSummary } =
  termSummarySlice.actions;
export const termSummaryReducer = termSummarySlice.reducer;
