import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MarketResearchReportSchema } from '@/app/(dashboard)/market-research-report/_utils/schema';

export interface MarketResearchReportState {
  id: string;
  market: string;
  competitor: string;
  target: string;
  purpose: string;
  consideration?: string;
  fixReportRequest?: string;
  feedbackAt: undefined | Date;
  isCreated: boolean;
  initialValues: MarketResearchReportSchema | null;
}

export interface InitialState extends MarketResearchReportState {
  result: string;
}

export const initialMarketResearchReport: MarketResearchReportState = {
  id: '',
  market: '',
  competitor: '',
  target: '',
  purpose: '',
  consideration: '',
  fixReportRequest: '',
  feedbackAt: undefined,
  isCreated: false,
  initialValues: null,
};

export const initialState: InitialState = {
  ...initialMarketResearchReport,
  result: '',
};

export const MarketResearchReportSlice = createSlice({
  name: 'MarketResearchReport',
  initialState,
  reducers: {
    setMarketResearchReport: (state, action: PayloadAction<MarketResearchReportState>) => ({
      ...state,
      ...action.payload,
    }),
    setIsCreated: (state, action: PayloadAction<boolean>) => {
      state.isCreated = action.payload;
    },
    setFixReportRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      fixReportRequest: action.payload,
    }),
    setResult: (state, action: PayloadAction<{ result: string; feedbackAt?: Date }>) => ({
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
    setInitialValues: (state, action: PayloadAction<MarketResearchReportSchema>) => {
      state.initialValues = action.payload;
    },
  },
});

export const {
  setResult,
  setReset,
  setMarketResearchReport,
  setFixReportRequest,
  setFeedbackAt,
  setId,
  setIsCreated,
  setInitialValues,
} = MarketResearchReportSlice.actions;
export const MarketResearchReportReducer = MarketResearchReportSlice.reducer;
