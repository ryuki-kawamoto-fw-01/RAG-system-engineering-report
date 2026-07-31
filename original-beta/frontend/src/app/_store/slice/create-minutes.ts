import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';

export interface FileReference {
  name: string; // temp/create_minutes/timestamp/xxx.pdf
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

export interface CreateMinutesState {
  fileList: FileReference[];
  meetingPurpose?: string;
  revisionPrompt?: string;
}

export interface InitialState extends CreateMinutesState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialCreateMinutes: CreateMinutesState = {
  fileList: [],
  meetingPurpose: '',
  revisionPrompt: '',
};

export const initialState: InitialState = {
  ...initialCreateMinutes,
  id: '',
  result: '',
  feedbackAt: undefined,
};
export interface SetCreateMinutes {
  fileList?: FileList;
  meetingPurpose?: string;
  revisionPrompt?: string;
}

export const createMinutesSlice = createSlice({
  name: 'createMinutes',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<CreateMinutesState>>) => {
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

export const { setResult, setReset, add, setId, setFeedbackAt } = createMinutesSlice.actions;

export const setCreateMinutes = (payload: SetCreateMinutes) => {
  return async (dispatch: Dispatch) => {
    dispatch(add(payload as unknown as CreateMinutesState));
  };
};

export const createMinutesReducer = createMinutesSlice.reducer;
