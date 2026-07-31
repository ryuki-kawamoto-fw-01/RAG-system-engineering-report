import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdviceReactSchema } from '@/app/(dashboard)/advice-react/_utils/schema';

export interface AdviceReactState {
  id: string;
  adviceInput: string;
  feedbackAt: undefined | Date;
  isCreated: boolean;
  initialValues: AdviceReactSchema | null;
}

export interface InitialState extends AdviceReactState {
  result: string;
}

export const initialAdviceReact: AdviceReactState = {
  id: '',
  adviceInput: '',
  isCreated: false,
  initialValues: null,
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialAdviceReact,
  result: '',
};

export const adviceReactSlice = createSlice({
  name: 'adviceReact',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<AdviceReactState>) => ({
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
      isSubmitted: action.payload,
    }),
    setIsSubmitting: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isSubmitting: action.payload,
    }),
    setContent: (state, action: PayloadAction<string>) => ({
      ...state,
      content: action.payload,
    }),
    setId: (state, action: PayloadAction<string>) => ({
      ...state,
      id: action.payload,
    }),
    setFeedbackAt: (state, action: PayloadAction<Date>) => ({
      ...state,
      feedbackAt: action.payload,
    }),
  },
});

export const {
  add,
  setResult,
  setReset,
  setIsSubmitted,
  setIsSubmitting,
  setContent,
  setId,
  setFeedbackAt,
} = adviceReactSlice.actions;
export const adviceReactReducer = adviceReactSlice.reducer;
