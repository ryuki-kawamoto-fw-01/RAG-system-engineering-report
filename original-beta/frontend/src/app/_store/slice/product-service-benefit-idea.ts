import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProductServiceBenefitIdeaState {
  id: string;
  product: string;
  features: string;
  consideration?: string;
  newIdeaRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends ProductServiceBenefitIdeaState {
  result: string;
}

export const initialProductServiceBenefitIdea: ProductServiceBenefitIdeaState = {
  id: '',
  product: '',
  features: '',
  consideration: '',
  newIdeaRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialProductServiceBenefitIdea,
  result: '',
};

export const productServiceBenefitIdeaSlice = createSlice({
  name: 'productServiceBenefitIdea',
  initialState,
  reducers: {
    setProductServiceBenefitIdea: (
      state,
      action: PayloadAction<ProductServiceBenefitIdeaState>
    ) => ({
      ...state,
      ...action.payload,
    }),
    setProductServiceBenefitNewIdeaRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newIdeaRequest: action.payload,
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

export const {
  setResult,
  setReset,
  setProductServiceBenefitIdea,
  setProductServiceBenefitNewIdeaRequest,
  setFeedbackAt,
  setId,
} = productServiceBenefitIdeaSlice.actions;
export const productServiceBenefitIdeaReducer = productServiceBenefitIdeaSlice.reducer;
