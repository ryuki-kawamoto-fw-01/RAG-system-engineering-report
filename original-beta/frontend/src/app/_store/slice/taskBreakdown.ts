import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TaskBreakdownState {
  task: string;
  consideration?: string;
  result: string;
  id: string;
  feedbackAt?: Date;
  revisionPrompt?: string;
}

export const initialState: TaskBreakdownState = {
  task: '',
  consideration: '',
  result: '',
  id: '',
  feedbackAt: undefined,
  revisionPrompt: '',
};

export const taskBreakdownSlice = createSlice({
  name: 'taskBreakdown',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<TaskBreakdownState>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    setResult: (state, action: PayloadAction<{ result: string; feedbackAt?: Date }>) => ({
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

export const { setResult, setReset, add, setId, setFeedbackAt } = taskBreakdownSlice.actions;

export const taskBreakdownReducer = taskBreakdownSlice.reducer;
