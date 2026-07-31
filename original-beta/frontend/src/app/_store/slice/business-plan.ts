import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const INITIAL_BUSINESS_PLAN_LENGTH = 100;

export interface BusinessPlanState {
  activeTab: 'short' | 'long' | 'custom';
  businessName: string;
  businessPurpose: string;
  targetMarket: string;
  businessModel: string;
  competitiveAdvantage: string;
  financialProjection: string;
  businessPlanLength: number;
}

export interface InitialState extends BusinessPlanState {
  id: string;
  answer: string;
  feedbackAt: undefined | Date;
  newBusinessPlanRequest?: string;
}

export const initialBusinessPlan: BusinessPlanState = {
  activeTab: 'short',
  businessName: '',
  businessPurpose: '',
  targetMarket: '',
  businessModel: '',
  competitiveAdvantage: '',
  financialProjection: '',
  businessPlanLength: INITIAL_BUSINESS_PLAN_LENGTH,
};

export const initialState: InitialState = {
  ...initialBusinessPlan,
  id: '',
  answer: '',
  newBusinessPlanRequest: '',
  feedbackAt: undefined,
};

export const businessPlanSlice = createSlice({
  name: 'businessPlan',
  initialState,
  reducers: {
    setBusinessPlan: (state, action: PayloadAction<BusinessPlanState>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{ answer: string; feedbackAt: Date | undefined }>
    ) => ({
      ...state,
      answer: action.payload.answer,
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

export const { setResult, setReset, setBusinessPlan, setFeedbackAt, setId } =
  businessPlanSlice.actions;
export const businessPlanReducer = businessPlanSlice.reducer;
