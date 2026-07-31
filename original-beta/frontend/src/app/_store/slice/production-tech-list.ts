import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const INITIAL_PRODUCTION_TECH_LIST_LENGTH = 100;

export interface ProductionTechListState {
  activeTab: 'short' | 'long' | 'custom';
  category: string;
  focus: string;
  ProductionTechListLength: number;
  issues?: string;
}

export interface InitialState extends ProductionTechListState {
  id: string;
  answer: string;
  feedbackAt: undefined | Date;
  newProductionTechRequest?: string;
}

export const initialProductionTechList: ProductionTechListState = {
  activeTab: 'short',
  category: '',
  focus: '',
  ProductionTechListLength: INITIAL_PRODUCTION_TECH_LIST_LENGTH,
  issues: '',
};

export const initialState: InitialState = {
  ...initialProductionTechList,
  id: '',
  answer: '',
  newProductionTechRequest: '',
  feedbackAt: undefined,
};

export const productionTechListSlice = createSlice({
  name: 'productionTechList',
  initialState,
  reducers: {
    setProductionTechList: (state, action: PayloadAction<ProductionTechListState>) => ({
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

export const { setResult, setReset, setProductionTechList, setFeedbackAt, setId } =
  productionTechListSlice.actions;
export const productionTechListReducer = productionTechListSlice.reducer;
