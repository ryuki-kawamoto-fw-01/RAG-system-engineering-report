import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreateIdeaState {
  id: string;
  subject: string;
  role: string;
  count: number;
  consideration?: string;
  newIdeaRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends CreateIdeaState {
  result: string;
}

export const initialCreateIdea: CreateIdeaState = {
  id: '',
  subject: '',
  role: '',
  count: 1,
  consideration: '',
  newIdeaRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialCreateIdea,
  result: '',
};

export const createIdeaSlice = createSlice({
  name: 'createIdea',
  initialState,
  reducers: {
    setCreateIdea: (state, action: PayloadAction<CreateIdeaState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewIdeaRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newIdeaRequest: action.payload,
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

export const { setResult, setReset, setCreateIdea, setNewIdeaRequest, setFeedbackAt, setId } =
  createIdeaSlice.actions;
export const createIdeaReducer = createIdeaSlice.reducer;
