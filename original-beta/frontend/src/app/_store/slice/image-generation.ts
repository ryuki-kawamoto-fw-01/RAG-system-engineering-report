import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ImageGenerationState {
  id: string;
  content: string;
  size: string;
  format: string;
  fixImageRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends ImageGenerationState {
  resultUrl: string;
  resultBase64: string;
  blobName?: string; // blob_name を追加
}

export const initialImageGeneration: ImageGenerationState = {
  id: '',
  content: '',
  size: '',
  format: '',
  fixImageRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialImageGeneration,
  resultUrl: '',
  resultBase64: '',
  blobName: undefined,
};

export const imageGenerationSlice = createSlice({
  name: 'imageGeneration',
  initialState,
  reducers: {
    setImageGeneration: (state, action: PayloadAction<ImageGenerationState>) => ({
      ...state,
      ...action.payload,
    }),
    setFixImageRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      fixImageRequest: action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{
        resultUrl: string;
        resultBase64: string;
        blobName?: string; // blob_name を追加
        feedbackAt: Date | undefined;
      }>
    ) => ({
      ...state,
      resultUrl: action.payload.resultUrl,
      resultBase64: action.payload.resultBase64,
      blobName: action.payload.blobName,
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

export const { setResult, setReset, setImageGeneration, setFixImageRequest, setFeedbackAt, setId } =
  imageGenerationSlice.actions;
export const imageGenerationReducer = imageGenerationSlice.reducer;
