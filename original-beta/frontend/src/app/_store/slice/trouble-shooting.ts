import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export interface TroubleShootingGuideState {
  productSpecificationText?: string;
  productSpecificationFiles?: FileReference[];
  productName: string;
  productPurpose: string;
}

export interface TroubleShootingGuideInitialState extends TroubleShootingGuideState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

const initialTroubleShootingGuideState: TroubleShootingGuideState = {
  productSpecificationText: '',
  productSpecificationFiles: [],
  productName: '',
  productPurpose: '',
};

export interface SetTroubleShooting {
  productSpecificationFiles?: FileList | FileReference[];
  productName?: string;
  productPurpose?: string;
  productSpecificationText?: string;
}

const initialState: TroubleShootingGuideInitialState = {
  ...initialTroubleShootingGuideState,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const troubleShootingGuideSlice = createSlice({
  name: 'troubleShootingGuideSlice',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<TroubleShootingGuideState>>) => ({
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

export const { add, setResult, setId, setFeedbackAt, setReset } = troubleShootingGuideSlice.actions;
export const setTroubleShooting = add;
export const troubleShootingGuideReducer = troubleShootingGuideSlice.reducer;
