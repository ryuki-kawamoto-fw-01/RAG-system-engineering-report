import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreateScheduleState {
  id: string;
  newSchedulework: string;
  newSchedulestartdate: Date;
  newScheduleenddate: Date;
  newScheduleConsiderations?: string;
  newScheduleRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends CreateScheduleState {
  result: string;
}

export const initialCreateSchedule: CreateScheduleState = {
  id: '',
  newSchedulework: '',
  newSchedulestartdate: new Date(),
  newScheduleenddate: new Date(),
  newScheduleConsiderations: '',
  newScheduleRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialCreateSchedule,
  result: '',
};

export const createScheduleSlice = createSlice({
  name: 'createSchedule',
  initialState,
  reducers: {
    setCreateSchedule: (state, action: PayloadAction<CreateScheduleState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewScheduleRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newScheduleRequest: action.payload,
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
  setCreateSchedule,
  setNewScheduleRequest,
  setFeedbackAt,
  setId,
} = createScheduleSlice.actions;
export const createScheduleReducer = createScheduleSlice.reducer;
