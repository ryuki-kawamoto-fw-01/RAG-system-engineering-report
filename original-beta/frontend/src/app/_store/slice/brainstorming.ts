import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BrainstormingState {
  id: string;
  theme: string;
  expert1: string;
  expert2: string;
  count: number;
  newRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends BrainstormingState {
  result: string;
}

export const initialBrainstorming: BrainstormingState = {
  id: '',
  theme: '',
  expert1: '',
  expert2: '',
  count: 1,
  newRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialBrainstorming,
  result: '',
};

export const brainstormingSlice = createSlice({
  name: 'brainstorming',
  initialState,
  reducers: {
    setBrainstorming: (state, action: PayloadAction<BrainstormingState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newRequest: action.payload,
    }),
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

export const { setResult, setReset, setBrainstorming, setNewRequest, setFeedbackAt, setId } =
  brainstormingSlice.actions;
export const brainstormingReducer = brainstormingSlice.reducer;
