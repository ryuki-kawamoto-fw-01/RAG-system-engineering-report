import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MarketingStrategyState {
  id: string;
  MarketSize: string;
  GrowthRate: string;
  KeyPlayer: string;
  Competitors: string;
  CustomerAttributes: string;
  PurchasingBehavior: string;
  count: number;
  newRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends MarketingStrategyState {
  result: string;
}

export const initialMarketingStrategy: MarketingStrategyState = {
  id: '',
  MarketSize: '',
  GrowthRate: '',
  KeyPlayer: '',
  Competitors: '',
  CustomerAttributes: '',
  PurchasingBehavior: '',
  count: 1,
  newRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialMarketingStrategy,
  result: '',
};

export const marketingStrategySlice = createSlice({
  name: 'marketingStrategy',
  initialState,
  reducers: {
    setMarketingStrategy: (state, action: PayloadAction<MarketingStrategyState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newRequest: action.payload,
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
  },
});

export const { setResult, setReset, setMarketingStrategy, setNewRequest, setFeedbackAt, setId } =
  marketingStrategySlice.actions;
export const marketingStrategyReducer = marketingStrategySlice.reducer;
