import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ResearchReportState {
  id: string;
  subject: string;
  purpose: string;
  count: number;
  method: string;
  researchresult: string;
  references: string;
  consideration?: string;
  newRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends ResearchReportState {
  result: string;
}

export const initialResearchReport: ResearchReportState = {
  id: '',
  subject: '',
  purpose: '',
  count: 1,
  method: '',
  researchresult: '',
  references: '',
  consideration: '',
  newRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialResearchReport,
  result: '',
};

export const researchReportSlice = createSlice({
  name: 'researchReport',
  initialState,
  reducers: {
    setResearchReport: (state, action: PayloadAction<ResearchReportState>) => ({
      ...state,
      ...action.payload,
    }),
    setNewRequest: (state, action: PayloadAction<string>) => ({
      ...state,
      newRequest: action.payload,
    }),
    setResult: (state, action: PayloadAction<string>) => ({
      ...state,
      result: action.payload,
      feedbackAt: undefined,
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

export const { setResult, setReset, setResearchReport, setNewRequest, setFeedbackAt, setId } =
  researchReportSlice.actions;
export const researchReportReducer = researchReportSlice.reducer;
