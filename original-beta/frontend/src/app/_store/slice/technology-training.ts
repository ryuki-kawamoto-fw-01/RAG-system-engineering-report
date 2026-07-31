import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TechnologyTrainingState {
  id: string;
  technology: string;
  level: string;
  time: number;
  consideration?: string;
  fixTrainingRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends TechnologyTrainingState {
  result: string;
}

export const initialTechnologyTraining: TechnologyTrainingState = {
  id: '',
  technology: '',
  level: '',
  time: 1,
  consideration: '',
  fixTrainingRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialTechnologyTraining,
  result: '',
};

export const technologyTrainingSlice = createSlice({
  name: 'technologyTraining',
  initialState,
  reducers: {
    setTechnologyTraining: (state, action: PayloadAction<TechnologyTrainingState>) => ({
      ...state,
      ...action.payload,
    }),
    setFixTrainingRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      fixTrainingRequest: action.payload,
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

export const {
  setResult,
  setReset,
  setTechnologyTraining,
  setFixTrainingRequest,
  setFeedbackAt,
  setId,
} = technologyTrainingSlice.actions;
export const technologyTrainingReducer = technologyTrainingSlice.reducer;
