import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const INITIAL_SUMMARY_LENGTH = 100;

export interface SummaryState {
  activeTab: 'short' | 'long' | 'custom';
  content: string;
  summaryLength: number;
  consideration?: string;
}

export interface InitialState extends SummaryState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialSummary: SummaryState = {
  activeTab: 'short',
  content: '',
  summaryLength: INITIAL_SUMMARY_LENGTH,
  consideration: '',
};

export const initialState: InitialState = {
  ...initialSummary,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const summarySlice = createSlice({
  name: 'summary',
  initialState,
  reducers: {
    setSummary: (state, action: PayloadAction<SummaryState>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{ result: string; feedbackAt: Date | undefined }>
    ) => ({
      ...state,
      result: action.payload.result,
      feedbackAt: action.payload.feedbackAt,
    }),
    setId: (state, action: PayloadAction<string>) => ({
      ...state,
      id: action.payload,
    }),
    setFeedbackAt: (state, action: PayloadAction<Date>) => ({
      ...state,
      feedbackAt: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setResult, setReset, setSummary, setFeedbackAt, setId } = summarySlice.actions;
export const summaryReducer = summarySlice.reducer;
