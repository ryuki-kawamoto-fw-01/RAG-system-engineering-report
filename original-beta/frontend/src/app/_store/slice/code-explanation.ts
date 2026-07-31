import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CodeExplanationInput {
  programmingLanguage: string;
  code: string;
}

export interface InitialCodeExplanationState extends CodeExplanationInput {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialCodeExplanationState: InitialCodeExplanationState = {
  id: '',
  programmingLanguage: '',
  code: '',
  result: '',
  feedbackAt: undefined,
};

export const CodeExplanationSlice = createSlice({
  name: 'CodeExplanation',
  initialState: initialCodeExplanationState,
  reducers: {
    add: (state, action: PayloadAction<CodeExplanationInput>) => ({
      ...state,
      ...action.payload,
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
    reset: (state) => ({
      ...state,
      ...initialCodeExplanationState,
    }),
  },
});

export const { add, setResult, setId, setFeedbackAt, reset } = CodeExplanationSlice.actions;
export const codeExplanationReducer = CodeExplanationSlice.reducer;
