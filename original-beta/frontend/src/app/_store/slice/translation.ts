import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileData {
  file: string;
  name: string;
  type: string;
}

export interface TranslationState {
  inputText: string;
  sourceLanguage: string;
  targetLanguage: string;
  considerations?: string;
}

export interface InitialState extends TranslationState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialTranslation: TranslationState = {
  inputText: '',
  sourceLanguage: 'auto',
  targetLanguage: 'auto',
  considerations: '',
};

export const initialState: InitialState = {
  ...initialTranslation,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const translationSlice = createSlice({
  name: 'translation',
  initialState,
  reducers: {
    setTranslation: (state, action: PayloadAction<TranslationState>) => ({
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
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setResult, setReset, setTranslation, setFeedbackAt, setId } =
  translationSlice.actions;
export const translationReducer = translationSlice.reducer;
