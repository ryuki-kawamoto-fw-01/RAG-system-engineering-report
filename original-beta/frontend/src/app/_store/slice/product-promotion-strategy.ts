import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductPromotionStrategySchema } from '@/app/(dashboard)/product-promotion-strategy/_utils/schema';

export interface ProductPromotionStrategyState {
  id: string;
  productDescription: string;
  targetMarket: string;
  differentiationPoint: string;
  promotionTools: string;
  salesChannels: string;
  feedbackAt: undefined | Date;
  isCreated: boolean;
  initialValues: ProductPromotionStrategySchema | null;
}

export interface InitialState extends ProductPromotionStrategyState {
  result: string;
  isLoading: boolean;
}

export const initialProductPromotionStrategy: ProductPromotionStrategyState = {
  id: '',
  productDescription: '',
  targetMarket: '',
  differentiationPoint: '',
  promotionTools: '',
  salesChannels: '',
  isCreated: false,
  initialValues: null,
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialProductPromotionStrategy,
  result: '',
  isLoading: false,
};

export const productPromotionStrategySlice = createSlice({
  name: 'productPromotionStrategy',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<ProductPromotionStrategyState>) => ({
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
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
    setIsSubmitted: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isCreated: action.payload,
    }),
    setId: (state, action: PayloadAction<string>) => ({
      ...state,
      id: action.payload,
    }),
    setProductDescription: (state, action: PayloadAction<string>) => ({
      ...state,
      productDescription: action.payload,
    }),
    setTargetMarket: (state, action: PayloadAction<string>) => ({
      ...state,
      targetMarket: action.payload,
    }),
    setDifferentiationPoint: (state, action: PayloadAction<string>) => ({
      ...state,
      differentiationPoint: action.payload,
    }),
    setPromotionTools: (state, action: PayloadAction<string>) => ({
      ...state,
      promotionTools: action.payload,
    }),
    setSalesChannels: (state, action: PayloadAction<string>) => ({
      ...state,
      salesChannels: action.payload,
    }),
    setFeedbackAt: (state, action: PayloadAction<Date | undefined>) => ({
      ...state,
      feedbackAt: action.payload,
    }),
    setLoading: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isLoading: action.payload,
    }),
  },
});

export const {
  add,
  setResult,
  setReset,
  setIsSubmitted,
  setId,
  setProductDescription,
  setTargetMarket,
  setDifferentiationPoint,
  setPromotionTools,
  setSalesChannels,
  setFeedbackAt,
  setLoading,
} = productPromotionStrategySlice.actions;

export const productPromotionStrategyReducer = productPromotionStrategySlice.reducer;
export default productPromotionStrategySlice.reducer;
