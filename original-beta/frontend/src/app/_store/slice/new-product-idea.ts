import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export interface ChatHistory {
  role: 'user' | 'assistant';
  chat: string;
}

export interface NewProductIdeaState {
  fileList?: FileReference[];
  text?: string;
  ideaDirection: string;
  additionalConsiderations?: string;
  chat: string;
  chatHistory: ChatHistory[];
  isSubmitted?: boolean;
  isSubmitting?: boolean;
  filePlainList?: FileReference[];
}

export interface InitialState extends NewProductIdeaState {
  content: string;
  formAccordionValue?: string;
}

export const initialNewProductIdea: NewProductIdeaState = {
  fileList: undefined,
  text: '',
  ideaDirection: '',
  additionalConsiderations: '',
  chat: '',
  chatHistory: [],
  isSubmitted: true,
  isSubmitting: false,
  filePlainList: undefined,
};

export const initialState: InitialState = {
  ...initialNewProductIdea,
  content: '',
  formAccordionValue: 'form',
};

export interface SetNewProductIdea {
  fileList?: FileList;
  text?: string;
  ideaDirection: string;
  additionalConsiderations?: string;
  chat: string;
  chatHistory: ChatHistory[];
}

export const newProductIdea = createSlice({
  name: 'newProductIdea',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<NewProductIdeaState>>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (state, action: PayloadAction<string>) => ({
      ...state,
      content: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
    setChat: (state, action: PayloadAction<string>) => ({
      ...state,
      chat: action.payload,
    }),
    setChatHistory: (state, action: PayloadAction<ChatHistory[]>) => ({
      ...state,
      chatHistory: action.payload,
    }),
    setIsSubmitted: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isSubmitted: action.payload,
    }),
    setIsSubmitting: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isSubmitting: action.payload,
    }),
    setContent: (state, action: PayloadAction<string>) => ({
      ...state,
      content: action.payload,
    }),
    setFilePlainList: (state, action: PayloadAction<FileReference[]>) => ({
      ...state,
      filePlainList: action.payload,
    }),
    setFormAccordionValue: (state, action: PayloadAction<string | undefined>) => ({
      ...state,
      formAccordionValue: action.payload,
    }),
  },
});

export const {
  setResult,
  setReset,
  add,
  setChat,
  setChatHistory,
  setIsSubmitted,
  setIsSubmitting,
  setContent,
  setFilePlainList,
  setFormAccordionValue,
} = newProductIdea.actions;

export const setNewProductIdea = add;

export const newProductIdeaReducer = newProductIdea.reducer;
