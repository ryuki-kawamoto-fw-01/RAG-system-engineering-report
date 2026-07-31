import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WallHittingState {
  id: string;
  theme: string;
  idea: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends WallHittingState {
  result: string;
}

export const initialWallHitting: WallHittingState = {
  id: '',
  theme: '',
  idea: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialWallHitting,
  result: '',
};

export const wallHittingSlice = createSlice({
  name: 'wallHitting',
  initialState,
  reducers: {
    setWallHitting: (state, action: PayloadAction<WallHittingState>) => ({
      ...state,
      ...action.payload,
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

export const { setResult, setReset, setWallHitting, setFeedbackAt, setId } =
  wallHittingSlice.actions;
export const wallHittingReducer = wallHittingSlice.reducer;
