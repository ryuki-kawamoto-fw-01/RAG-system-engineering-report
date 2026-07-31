import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export interface TextCheckState {
  id: string;
  text: string;
  content1: string;
  content2?: string;
  content3?: string;
  fileList?: FileReference[];
  feedbackAt: undefined | Date;
}

export interface InitialState extends TextCheckState {
  evaluation: string;
  correctedText: string;
}

export const initialTextCheck: TextCheckState = {
  id: '',
  text: '',
  content1: '',
  content2: '',
  content3: '',
  fileList: [],
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialTextCheck,
  evaluation: '',
  correctedText: '',
};

export interface SetTextCheck {
  text: string;
  content1: string;
  content2?: string;
  content3?: string;
  fileList?: FileList;
}

export const textCheckSlice = createSlice({
  name: 'textCheck',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<TextCheckState>>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{
        evaluation: string;
        correctedText: string;
        feedbackAt: Date | undefined;
      }>
    ) => ({
      ...state,
      evaluation: action.payload.evaluation,
      correctedText: action.payload.correctedText,
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

export const { setResult, setReset, add, setFeedbackAt, setId } = textCheckSlice.actions;

export const setTextCheck = add;

export const textCheckReducer = textCheckSlice.reducer;
