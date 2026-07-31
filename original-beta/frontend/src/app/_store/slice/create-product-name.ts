import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreateProductNameState {
  id: string;
  subject: string;
  role: string;
  convention: string;
  newProductNameRequest: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends CreateProductNameState {
  result: string;
}

export const initialCreateProductName: CreateProductNameState = {
  id: '',
  subject: '',
  role: '',
  convention: '',
  newProductNameRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialCreateProductName,
  result: '',
  newProductNameRequest: '',
};

export const createProductNameSlice = createSlice({
  name: 'createProductName',
  initialState,
  reducers: {
    setCreateProductName: (state, action: PayloadAction<CreateProductNameState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewProductNameRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newProductNameRequest: action.payload,
    }),
    setResult: (state, action: PayloadAction<string>) => ({
      ...state,
      result: action.payload,
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
  setCreateProductName,
  setNewProductNameRequest,
  setFeedbackAt,
  setId,
} = createProductNameSlice.actions;
export const createProductNameReducer = createProductNameSlice.reducer;
