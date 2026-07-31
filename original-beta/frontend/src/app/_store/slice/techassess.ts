import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TechassessInput = {
  field?: string;
  region?: string;
  companySize?: string;
  industryIssues?: string;
  granularity?: string;
  purpose?: string;
  // 必要に応じて項目を追加
};

export type TechassessState = {
  techassessResult: string;
  techassessInput: TechassessInput;
  techassessId: string;
  techassessFeedbackAt?: Date;
};

const initialState: TechassessState = {
  techassessResult: '',
  techassessInput: {},
  techassessId: '',
  techassessFeedbackAt: undefined,
};

const techassessSlice = createSlice({
  name: 'techassess',
  initialState,
  reducers: {
    setTechassessResult(state, action: PayloadAction<string>) {
      state.techassessResult = action.payload;
    },
    updateTechassessInput(state, action: PayloadAction<{ input: TechassessInput }>) {
      state.techassessInput = action.payload.input;
    },
    setTechassessId(state, action: PayloadAction<string>) {
      state.techassessId = action.payload;
    },
    setTechassessFeedbackAt(state, action: PayloadAction<Date>) {
      state.techassessFeedbackAt = action.payload;
    },
    resetTechassess(state) {
      state.techassessResult = '';
      state.techassessInput = {};
      state.techassessId = '';
      state.techassessFeedbackAt = undefined;
    },
  },
});

export const techassessReducer = techassessSlice.reducer;
export const {
  setTechassessResult,
  updateTechassessInput,
  setTechassessId,
  setTechassessFeedbackAt,
  resetTechassess,
} = techassessSlice.actions;
