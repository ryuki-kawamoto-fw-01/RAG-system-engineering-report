import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ErrorAnalysisState {
  id: string;
  programmingLanguage: string;
  errorMessage: string;
  considerations: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends ErrorAnalysisState {
  result: {
    explanation: string;
    solutionAndExample: string;
  };
}

export const initialErrorAnalysis: ErrorAnalysisState = {
  id: '',
  programmingLanguage: '',
  errorMessage: '',
  considerations: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialErrorAnalysis,
  result: {
    explanation: '',
    solutionAndExample: '',
  },
};

export const errorAnalysisSlice = createSlice({
  name: 'errorAnalysis',
  initialState,
  reducers: {
    setErrorAnalysis: (state, action: PayloadAction<ErrorAnalysisState>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{
        result: { explanation: string; solutionAndExample: string };
        feedbackAt: Date | undefined;
      }>
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

export const { setResult, setReset, setErrorAnalysis, setFeedbackAt, setId } =
  errorAnalysisSlice.actions;
export const errorAnalysisReducer = errorAnalysisSlice.reducer;
