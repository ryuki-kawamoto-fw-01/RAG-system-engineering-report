import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TechnologyTrendResearchState {
  id: string;
  field: string;
  range: string;
  area: string;
  format?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends TechnologyTrendResearchState {
  result: string;
}

export const initialTechnologyTrendResearch: TechnologyTrendResearchState = {
  id: '',
  field: '',
  range: '',
  area: '',
  format: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialTechnologyTrendResearch,
  result: '',
};

export const technologytrendResearchSlice = createSlice({
  name: 'technologytrendResearch',
  initialState,
  reducers: {
    setTechnologyTrendResearch: (state, action: PayloadAction<TechnologyTrendResearchState>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (state, action: PayloadAction<string>) => ({
      ...state,
      result: action.payload,
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

export const { setResult, setReset, setTechnologyTrendResearch, setFeedbackAt, setId } =
  technologytrendResearchSlice.actions;
export const technologytrendResearchReducer = technologytrendResearchSlice.reducer;
