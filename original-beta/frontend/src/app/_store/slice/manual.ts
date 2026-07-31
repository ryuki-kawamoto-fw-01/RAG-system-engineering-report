import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManualStep {
  id: number;
  frameIdx: number;
  description: string;
}

export interface ManualState {
  file: string[];
  ext: string;
  similarityThreshold: number;
  steps: ManualStep[];
  frameUrls: string[];
  result?: {
    wordFileURL?: string;
    markdownFileURL?: string;
    excelFileURL?: string;
  };
  isEditing: boolean;
  totalFrames?: number;
  manualId?: string;
  llmOutputUrl?: string;
  containerName?: string;
  folderPath?: string;
  blobFolderName?: string;
}

export const initialState: ManualState = {
  file: [],
  ext: '',
  similarityThreshold: -2.0,
  steps: [],
  frameUrls: [],
  isEditing: false,
};

export const manualSlice = createSlice({
  name: 'manual',
  initialState,
  reducers: {
    setManual: (state, action: PayloadAction<Partial<ManualState>>) => ({
      ...state,
      ...action.payload,
    }),
    setReset: (state) => ({
      ...state,
      file: [],
      ext: '',
      similarityThreshold: -2.0,
      steps: [],
      frameUrls: initialState.frameUrls,
      result: undefined,
      isEditing: false,
    }),
  },
});

export const { setReset, setManual } = manualSlice.actions;
export const manualReducer = manualSlice.reducer;
