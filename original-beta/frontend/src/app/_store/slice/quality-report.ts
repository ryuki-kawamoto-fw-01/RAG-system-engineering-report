import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QualityReportFormState {
  company_name: string;
  manufacturing_type: string;
  current_process_overview: string;
  quality_data_management: string;
  quality_history_data: string;
  quality_issues: string[];
  analysis_period: string;
  improvement_goals: string;
  evaluation_metrics: string[];
  additional_considerations: string;
  report_detail_level: 'standard' | 'detailed' | 'summary';
}

export interface QualityReportState extends QualityReportFormState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialQualityReportForm: QualityReportFormState = {
  company_name: '',
  manufacturing_type: '',
  current_process_overview: '',
  quality_data_management: '',
  quality_history_data: '',
  quality_issues: [],
  analysis_period: '',
  improvement_goals: '',
  evaluation_metrics: [],
  additional_considerations: '',
  report_detail_level: 'standard',
};

export const initialState: QualityReportState = {
  ...initialQualityReportForm,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const qualityReportSlice = createSlice({
  name: 'qualityReport',
  initialState,
  reducers: {
    setQualityReport: (state, action: PayloadAction<Partial<QualityReportFormState>>) => ({
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

export const { setQualityReport, setResult, setId, setFeedbackAt, setReset } =
  qualityReportSlice.actions;

export const qualityReportReducer = qualityReportSlice.reducer;

export default qualityReportSlice;
