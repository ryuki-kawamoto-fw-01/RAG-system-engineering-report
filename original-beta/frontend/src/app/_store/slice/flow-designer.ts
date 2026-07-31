import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FlowDesignerSchema } from '@/app/(dashboard)/flow-designer/_utils/schema';

export interface FlowDesignerState {
  id: string;
  text: string;
  type: string;
  consideration?: string;
  feedbackAt: undefined | Date;
  isCreated: boolean;
  isLoading: boolean;
  initialValues: FlowDesignerSchema | null;
}

export interface InitialState extends FlowDesignerState {
  result: string;
}

export const initialFlowDesigner: FlowDesignerState = {
  id: '',
  text: '',
  type: '',
  consideration: '',
  isCreated: false,
  isLoading: false,
  initialValues: null,
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialFlowDesigner,
  result: '',
};

export const flowDesignerSlice = createSlice({
  name: 'flowDesigner',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<FlowDesignerState>) => ({
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
    setText: (state, action: PayloadAction<string>) => ({
      ...state,
      text: action.payload,
    }),
    setType: (state, action: PayloadAction<string>) => ({
      ...state,
      type: action.payload,
    }),
    setConsideration: (state, action: PayloadAction<string>) => ({
      ...state,
      consideration: action.payload,
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
  setText,
  setType,
  setConsideration,
  setFeedbackAt,
  setLoading,
} = flowDesignerSlice.actions;

export const flowDesignerReducer = flowDesignerSlice.reducer;
export default flowDesignerSlice.reducer;
