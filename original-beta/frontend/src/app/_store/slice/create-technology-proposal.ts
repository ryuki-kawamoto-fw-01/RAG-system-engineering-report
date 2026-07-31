import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreateTechnologyProposalState {
  id: string;
  technologyName: string;
  market: string;
  current_issues: string;
  consideration?: string;
  modify?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends CreateTechnologyProposalState {
  result: string;
}

export const initialCreateTechnologyProposal: CreateTechnologyProposalState = {
  id: '',
  technologyName: '',
  market: '',
  current_issues: '',
  consideration: '',
  modify: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialCreateTechnologyProposal,
  result: '',
};

export const createTechnologyProposalSlice = createSlice({
  name: 'createTechnologyProposal',
  initialState,
  reducers: {
    setCreateTechnologyProposal: (state, action: PayloadAction<CreateTechnologyProposalState>) => ({
      ...state,
      ...action.payload,
    }),
    setModify: (state, action: PayloadAction<string>) => ({
      ...state,
      modify: action.payload,
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

export const { setResult, setReset, setCreateTechnologyProposal, setModify, setFeedbackAt, setId } =
  createTechnologyProposalSlice.actions;
export const createTechnologyProposalReducer = createTechnologyProposalSlice.reducer;
