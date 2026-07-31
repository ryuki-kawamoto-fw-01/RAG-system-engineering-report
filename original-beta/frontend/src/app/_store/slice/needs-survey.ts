import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NeedsSurveyState {
  id: string;
  industry: string;
  purpose: string;
  product: string;
  persona: string;
  additionalConsiderations?: string;
  newRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends NeedsSurveyState {
  result: string;
}

export const initialNeedsSurvey: NeedsSurveyState = {
  id: '',
  industry: '',
  purpose: '',
  product: '',
  persona: '',
  additionalConsiderations: '',
  newRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialNeedsSurvey,
  result: '',
};

export const needsSurveySlice = createSlice({
  name: 'needsSurvey',
  initialState,
  reducers: {
    setNeedsSurvey: (state, action: PayloadAction<NeedsSurveyState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newRequest: action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{ result: string; feedbackAt?: Date | undefined }>
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

export const { setResult, setReset, setNeedsSurvey, setNewRequest, setFeedbackAt, setId } =
  needsSurveySlice.actions;
export const needsSurveyReducer = needsSurveySlice.reducer;
