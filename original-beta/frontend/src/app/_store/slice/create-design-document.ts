import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DesignDocumentState {
  id: string;
  product: string;
  purpose: string;
  feature: string;
  count: number;
  additionalConsiderations?: string;
  newRequest?: string;
  feedbackAt: undefined | Date;
}

export interface InitialState extends DesignDocumentState {
  result: string;
}

export const initialDesignDocument: DesignDocumentState = {
  id: '',
  product: '',
  purpose: '',
  feature: '',
  count: 1,
  additionalConsiderations: '',
  newRequest: '',
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialDesignDocument,
  result: '',
};

export const designDocumentSlice = createSlice({
  name: 'designDocument',
  initialState,
  reducers: {
    setDesignDocument: (state, action: PayloadAction<DesignDocumentState>) => ({
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

export const { setResult, setReset, setDesignDocument, setNewRequest, setFeedbackAt, setId } =
  designDocumentSlice.actions;
export const designDocumentReducer = designDocumentSlice.reducer;
