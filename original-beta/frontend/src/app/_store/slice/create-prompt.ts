import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreatePromptState {
  originalPrompt: string;
  revisionPrompt: string;
}

export interface InitialState extends CreatePromptState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialCreatePrompt: CreatePromptState = {
  originalPrompt: '',
  revisionPrompt: '',
};

export const initialState: InitialState = {
  ...initialCreatePrompt,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const createPromptSlice = createSlice({
  name: 'createPrompt',
  initialState,
  reducers: {
    setCreatePrompt: (state, action: PayloadAction<CreatePromptState>) => ({
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
    setRevisionPrompt: (state, action: PayloadAction<string>) => ({
      ...state,
      revisionPrompt: action.payload,
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

export const { setResult, setReset, setCreatePrompt, setId, setRevisionPrompt, setFeedbackAt } =
  createPromptSlice.actions;
export const createPromptReducer = createPromptSlice.reducer;
