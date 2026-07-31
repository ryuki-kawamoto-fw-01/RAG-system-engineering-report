import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string; // ファイルパス（temp/talk_script/timestamp/xxx.pptx形式）
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

export interface TalkScriptState {
  files: FileReference[] | FileList;
  purpose: string;
  partnerCharacteristics: number[];
  considerations?: string;
  modify?: string;
}

export interface InitialState extends TalkScriptState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialTalkScript: TalkScriptState = {
  files: [],
  purpose: '',
  partnerCharacteristics: [50, 50, 50],
  considerations: '',
  modify: '',
};

export const initialState: InitialState = {
  ...initialTalkScript,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const talkScriptSlice = createSlice({
  name: 'talkScript',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<TalkScriptState>>) => ({
      ...state,
      ...action.payload,
    }),
    setModify: (state, action: PayloadAction<string>) => ({
      ...state,
      modify: action.payload,
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

export const { setResult, setReset, add, setModify, setFeedbackAt, setId } =
  talkScriptSlice.actions;

export const setTalkScript = add;

export const talkScriptReducer = talkScriptSlice.reducer;
