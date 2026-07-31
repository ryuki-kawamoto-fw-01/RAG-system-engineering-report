import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PastQA {
  question: string;
  chat: string;
  source_code: string;
}

export interface SourceCodeCreationState {
  messages: Message[];
  inputMessage: string;
  pastQA: PastQA[];
  report: string;
}

export const initialState: SourceCodeCreationState = {
  messages: [],
  inputMessage: '',
  pastQA: [],
  report: '',
};

export const sourceCodeCreationSlice = createSlice({
  name: 'sourceCodeCreation',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => ({
      ...state,
      messages: action.payload,
    }),
    setPastQA: (state, action: PayloadAction<PastQA[]>) => ({
      ...state,
      pastQA: action.payload,
    }),
    setInputMessage: (state, action: PayloadAction<string>) => ({
      ...state,
      inputMessage: action.payload,
    }),
    setReport: (state, action: PayloadAction<string>) => ({
      ...state,
      report: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setReset, setInputMessage, setMessages, setPastQA, setReport } =
  sourceCodeCreationSlice.actions;
export const sourceCodeCreationReducer = sourceCodeCreationSlice.reducer;
