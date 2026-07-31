import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CompanyAnalysisState {
  company_name: string;
  analytical_methods: string[];
  analysis_purpose?: string;
  business_name?: string;
  analysis_considerations?: string;
}

export interface InitialState extends CompanyAnalysisState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
  reanalysis_request?: string;
}

export const initialCompanyAnalys: CompanyAnalysisState = {
  company_name: '',
  analytical_methods: [],
  analysis_purpose: '',
  business_name: '',
  analysis_considerations: '',
};

export const initialState: InitialState = {
  ...initialCompanyAnalys,
  id: '',
  result: '',
  reanalysis_request: '',
  feedbackAt: undefined,
};

export const companyAnalysisSlice = createSlice({
  name: 'companyAnalysis',
  initialState,
  reducers: {
    setCompanyAnalysis: (state, action: PayloadAction<CompanyAnalysisState>) => ({
      ...state,
      ...action.payload,
    }),
    setReAnalysis: (state, action: PayloadAction<string>) => ({
      ...state,
      reanalysis_request: action.payload,
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

export const { setResult, setReset, setCompanyAnalysis, setReAnalysis, setId, setFeedbackAt } =
  companyAnalysisSlice.actions;
export const companyAnalysisReducer = companyAnalysisSlice.reducer;
