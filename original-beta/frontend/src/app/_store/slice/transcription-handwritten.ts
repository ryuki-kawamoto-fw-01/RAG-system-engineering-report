import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { getBase64Files } from '@/app/_utils/file';

export interface FileData {
  file: string;
  name: string;
  type: string;
}

export interface TranscriptionHandwrittenState {
  fileList: FileData[];
  revisionPrompt?: string;
}

export interface InitialState extends TranscriptionHandwrittenState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialTranscriptionHandwritten: TranscriptionHandwrittenState = {
  fileList: [],
  revisionPrompt: '',
};

export const initialState: InitialState = {
  ...initialTranscriptionHandwritten,
  id: '',
  result: '',
  feedbackAt: undefined,
};
export interface SetTranscriptionHandwritten {
  fileList?: FileList;
  revisionPrompt?: string;
}

export const transcriptionHandwrittenSlice = createSlice({
  name: 'transcriptionHandwritten',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<TranscriptionHandwrittenState>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
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

export const { setResult, setReset, add, setId, setFeedbackAt } =
  transcriptionHandwrittenSlice.actions;

export const setTranscriptionHandwritten = (payload: SetTranscriptionHandwritten) => {
  return async (dispatch: Dispatch) => {
    if (payload.fileList instanceof FileList) {
      const response: FileData[] = await getBase64Files(payload.fileList);
      dispatch(add({ ...payload, fileList: response }));
    } else {
      dispatch(add(payload as unknown as TranscriptionHandwrittenState));
    }
  };
};

export const transcriptionHandwrittenReducer = transcriptionHandwrittenSlice.reducer;
