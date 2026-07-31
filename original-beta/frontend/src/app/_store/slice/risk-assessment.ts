import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RiskAssessmentState {
  id: string;
  // 労働者情報
  workerInfo: string;
  // 使用する機械
  machineInfo: string;
  // 作業員の人数と配置
  workerCountAndPlacement: string;
  // 工程の詳細
  processDetails: string;
  // 現状の対策内容
  currentMeasures: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends RiskAssessmentState {
  result: string;
}

export const initialRiskAssessment: RiskAssessmentState = {
  id: '',
  workerInfo: '',
  machineInfo: '',
  workerCountAndPlacement: '',
  processDetails: '',
  currentMeasures: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialRiskAssessment,
  result: '',
};

export const riskAssessmentSlice = createSlice({
  name: 'riskAssessmentSlice',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<RiskAssessmentState>) => ({
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

export const { add, setResult, setId, setFeedbackAt, setReset } = riskAssessmentSlice.actions;
export const riskAssessmentReducer = riskAssessmentSlice.reducer;
