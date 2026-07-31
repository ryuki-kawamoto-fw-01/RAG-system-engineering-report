import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdviceConsultingSchema } from '@/app/(dashboard)/advice-consulting/_utils/schema';

export interface AdviceConsultingState {
  id: string;
  role: string;
  constraints: string;
  adviceInput: string;
  feedbackAt: undefined | Date;
  isCreated: boolean;
  initialValues: AdviceConsultingSchema | null;
}

export interface InitialState extends AdviceConsultingState {
  result: string;
}

export const initialAdviceConsulting: AdviceConsultingState = {
  id: '',
  role: '',
  constraints: '',
  adviceInput: '',
  isCreated: false,
  initialValues: null,
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialAdviceConsulting,
  result: '',
};

export const adviceConsultingSlice = createSlice({
  name: 'adviceConsulting',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<AdviceConsultingState>) => ({
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
    setRole: (state, action: PayloadAction<string>) => ({
      ...state,
      role: action.payload,
    }),
    setConstraints: (state, action: PayloadAction<string>) => ({
      ...state,
      constraints: action.payload,
    }),
    setAdviceInput: (state, action: PayloadAction<string>) => ({
      ...state,
      adviceInput: action.payload,
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
  setId,
  setRole,
  setConstraints,
  setAdviceInput,
  setFeedbackAt,
} = adviceConsultingSlice.actions;

export const adviceConsultingReducer = adviceConsultingSlice.reducer;
export default adviceConsultingSlice.reducer;
