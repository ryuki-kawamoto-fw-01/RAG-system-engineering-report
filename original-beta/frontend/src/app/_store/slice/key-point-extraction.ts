import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string; // ファイルパス（temp/key_point_extraction/timestamp/xxx.pdf形式）
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

export interface KeyPointExtractionState {
  fileList: FileReference[];
  text?: string;
  additionalConsiderations?: string;
}

export interface InitialState extends KeyPointExtractionState {
  id: string;
  keyPointExtractionResult: string;
  feedbackAt: undefined | Date;
}

export const initialKeyPointExtraction: KeyPointExtractionState = {
  fileList: [],
  text: '',
  additionalConsiderations: '',
};

export const initialState: InitialState = {
  ...initialKeyPointExtraction,
  id: '',
  keyPointExtractionResult: '',
  feedbackAt: undefined,
};

export const keyPointExtractionSlice = createSlice({
  name: 'keyPointExtraction',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<KeyPointExtractionState>>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{
        keyPointExtractionResult: string;
        feedbackAt?: Date;
      }>
    ) => ({
      ...state,
      ...action.payload,
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

export const { setResult, setReset, add, setFeedbackAt, setId } = keyPointExtractionSlice.actions;

export const setKeyPointExtraction = add;

export const keyPointExtractionReducer = keyPointExtractionSlice.reducer;
