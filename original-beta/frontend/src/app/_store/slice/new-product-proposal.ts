import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NewProductProposalSchema } from '@/app/(dashboard)/new-product-proposal/_utils/schema';

export interface NewProductProposalState {
  id: string;
  name: string;
  market: string;
  target: string;
  concept: string;
  comparisonPoints: string;
  consideration?: string;
  fixProposalRequest?: string;
  feedbackAt: undefined | Date;
  isCreated: boolean;
  initialValues: NewProductProposalSchema | null;
}

export interface InitialState extends NewProductProposalState {
  result: string;
}

export const initialNewProductProposal: NewProductProposalState = {
  id: '',
  name: '',
  market: '',
  target: '',
  concept: '',
  comparisonPoints: '',
  consideration: '',
  fixProposalRequest: '',
  feedbackAt: undefined,
  isCreated: false,
  initialValues: null,
};

export const initialState: InitialState = {
  ...initialNewProductProposal,
  result: '',
};

export const NewProductProposalSlice = createSlice({
  name: 'NewProductProposal',
  initialState,
  reducers: {
    setNewProductProposal: (state, action: PayloadAction<NewProductProposalState>) => ({
      ...state,
      ...action.payload,
    }),
    setIsCreated: (state, action: PayloadAction<boolean>) => {
      state.isCreated = action.payload;
    },
    setFixProposalRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      fixProposalRequest: action.payload,
    }),
    setResult: (state, action: PayloadAction<string>) => ({
      ...state,
      result: action.payload,
      feedbackAt: undefined,
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
    setInitialValues: (state, action: PayloadAction<NewProductProposalSchema>) => {
      state.initialValues = action.payload;
    },
  },
});

export const {
  setResult,
  setReset,
  setNewProductProposal,
  setFixProposalRequest,
  setFeedbackAt,
  setId,
  setIsCreated,
  setInitialValues,
} = NewProductProposalSlice.actions;
export const NewProductProposalReducer = NewProductProposalSlice.reducer;
