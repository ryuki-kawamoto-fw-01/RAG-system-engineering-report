import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string; // ファイルパス（temp/create_mail/timestamp/xxx.msg形式）
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

export interface NewMailState {
  newMailTo: string;
  newMailFrom: string;
  newMailPurpose: string;
  newMailContent: string;
  newMailConsiderations?: string;
}

export interface ReplyMailState {
  activeTab: 'direct-input' | 'file-upload';
  replyMailTo: string;
  replyMailFrom: string;
  replyMailPurpose: string;
  receivedMailText: string;
  receivedMailFiles: FileReference[];
  replyMailContent: string;
  replyMailConsiderations?: string;
}
export interface CreateMailState extends NewMailState, ReplyMailState {}

export interface InitialState extends CreateMailState {
  id: string;
  createdSubject: string;
  createdContent: string;
  modify: string;
  feedbackAt: undefined | Date;
}

export const initialNewMail: NewMailState = {
  newMailTo: '',
  newMailFrom: '',
  newMailPurpose: '',
  newMailContent: '',
  newMailConsiderations: '',
};
export const initialReplyMail: ReplyMailState = {
  activeTab: 'direct-input',
  replyMailTo: '',
  replyMailFrom: '',
  replyMailPurpose: '',
  receivedMailText: '',
  receivedMailFiles: [],
  replyMailContent: '',
  replyMailConsiderations: '',
};

export const initialState: InitialState = {
  ...initialNewMail,
  ...initialReplyMail,
  id: '',
  createdSubject: '',
  createdContent: '',
  modify: '',
  feedbackAt: undefined,
};

export const createMailSlice = createSlice({
  name: 'createMail',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<CreateMailState>>) => ({
      ...state,
      ...action.payload,
    }),
    setModify: (state, action: PayloadAction<string>) => ({
      ...state,
      modify: action.payload,
    }),
    setCreatedSubject: (state, action: PayloadAction<string>) => ({
      ...state,
      createdSubject: action.payload,
    }),
    setCreatedContent: (state, action: PayloadAction<string>) => ({
      ...state,
      createdContent: action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{
        createdSubject: string;
        createdContent: string;
        feedbackAt: Date | undefined;
      }>
    ) => ({
      ...state,
      createdSubject: action.payload.createdSubject,
      createdContent: action.payload.createdContent,
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

export const {
  setResult,
  setReset,
  add,
  setModify,
  setCreatedSubject,
  setCreatedContent,
  setFeedbackAt,
  setId,
} = createMailSlice.actions;

export const setCreateMail = add;

export const CreateMailReducer = createMailSlice.reducer;
