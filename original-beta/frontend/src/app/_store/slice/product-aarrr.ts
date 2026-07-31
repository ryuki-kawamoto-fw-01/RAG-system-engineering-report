import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProductAARRRState {
  product_service: string;
  product_service_content: string;
  additionalConsiderations: string;
}

export interface InitialState extends ProductAARRRState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialProductAARRR: ProductAARRRState = {
  product_service: '',
  product_service_content: '',
  additionalConsiderations: '',
};

export const initialState: InitialState = {
  ...initialProductAARRR,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const productAARRRSlice = createSlice({
  name: 'productAARRR',
  initialState,
  reducers: {
    setProductAARRR: (state, action: PayloadAction<ProductAARRRState>) => ({
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
    clearState: () => initialState,
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setProductAARRR, setResult, setId, setFeedbackAt, clearState, setReset } =
  productAARRRSlice.actions;

export const productAARRRReducer = productAARRRSlice.reducer;
