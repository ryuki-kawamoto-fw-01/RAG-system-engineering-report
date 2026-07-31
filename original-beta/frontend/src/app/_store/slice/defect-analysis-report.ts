import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DefectAnalysisReportState {
  productName: string;
  defectDescription: string;
  occurenceCondition: string;
  usageEnvironment: string;
  impactScope: string;
  defectData: string;
  consideration?: string;
}

export interface InitialState extends DefectAnalysisReportState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
  modify?: string;
}

export const initialDefectAnalysisReport: DefectAnalysisReportState = {
  productName: '',
  defectDescription: '',
  occurenceCondition: '',
  usageEnvironment: '',
  impactScope: '',
  defectData: '',
  consideration: '',
};

export const initialState: InitialState = {
  ...initialDefectAnalysisReport,
  id: '',
  result: '',
  modify: '',
  feedbackAt: undefined,
};

export const defectAnalysisReportSlice = createSlice({
  name: 'defectAnalysisReport',
  initialState,
  reducers: {
    setDefectAnalysisReport: (state, action: PayloadAction<DefectAnalysisReportState>) => ({
      ...state,
      ...action.payload,
    }),
    setReAnalysis: (state, action: PayloadAction<string>) => ({
      ...state,
      modify: action.payload,
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
    setClearInfo: () => initialState,
  },
});

export const {
  setDefectAnalysisReport,
  setReAnalysis,
  setResult,
  setId,
  setFeedbackAt,
  setClearInfo,
} = defectAnalysisReportSlice.actions;

export const defectAnalysisReportReducer = defectAnalysisReportSlice.reducer;
export default defectAnalysisReportSlice.reducer;
