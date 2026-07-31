import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CrisisManagementScenariosState {
  id: string;
  industry: string;
  businessSize: string;
  businessContent: string;
  selectedOptions: string[];
  additionalContents?: string;
  additionalConsiderations?: string;
  count: number;
  newRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends CrisisManagementScenariosState {
  result: string;
}

export const initialCrisisManagementScenarios: CrisisManagementScenariosState = {
  id: '',
  industry: '',
  businessSize: '',
  businessContent: '',
  selectedOptions: [],
  additionalContents: '',
  additionalConsiderations: '',
  count: 1,
  newRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialCrisisManagementScenarios,
  result: '',
};

export const crisisManagementScenariosSlice = createSlice({
  name: 'crisisManagementScenarios',
  initialState,
  reducers: {
    setCrisisManagementScenarios: (
      state,
      action: PayloadAction<Partial<CrisisManagementScenariosState>>
    ) => ({
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

export const {
  setResult,
  setReset,
  setCrisisManagementScenarios,
  setNewRequest,
  setFeedbackAt,
  setId,
} = crisisManagementScenariosSlice.actions;
export const crisisManagementScenariosReducer = crisisManagementScenariosSlice.reducer;
