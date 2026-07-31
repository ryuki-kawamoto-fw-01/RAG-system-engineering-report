import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface JudgeIdeaState {
  id: string;
  function: string;
  use: string;
  market: string;
  country: string;
  newJudgeRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends JudgeIdeaState {
  result: string;
}

export const initialCreateIdea: JudgeIdeaState = {
  id: '',
  function: '',
  use: '',
  market: '',
  country: '',
  newJudgeRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialCreateIdea,
  result: '',
};

export const judgeIdeaSlice = createSlice({
  name: 'judgeIdea',
  initialState,
  reducers: {
    setJudgeIdea: (state, action: PayloadAction<JudgeIdeaState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewJudgeIdeaRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newJudgeIdeaRequest: action.payload,
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

export const { setResult, setReset, setJudgeIdea, setNewJudgeIdeaRequest, setFeedbackAt, setId } =
  judgeIdeaSlice.actions;
export const judgeIdeaReducer = judgeIdeaSlice.reducer;
