import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export interface ProductCatchphraseState {
  id: string;
  name: string;
  information: string;
  target: string;
  competitor: string;
  consideration?: string;
  fileConsideration?: string;
  fileList?: FileReference[];
  feedbackAt: undefined | Date;
}

export interface InitialState extends ProductCatchphraseState {
  result: string;
}

export const initialProductCatchphrase: ProductCatchphraseState = {
  id: '',
  name: '',
  information: '',
  target: '',
  competitor: '',
  consideration: '',
  fileConsideration: '',
  fileList: [],
  feedbackAt: undefined,
};

export const initialState: InitialState = {
  ...initialProductCatchphrase,
  result: '',
};

export interface SetProductCatchphrase {
  name: string;
  information: string;
  target: string;
  competitor: string;
  consideration?: string;
  fileConsideration?: string;
  fileList?: FileList;
}

export const productCatchphraseSlice = createSlice({
  name: 'productCatchphrase',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<ProductCatchphraseState>>) => ({
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

export const { setResult, setReset, add, setFeedbackAt, setId } = productCatchphraseSlice.actions;

export const setProductCatchphrase = add;

export const productCatchphraseReducer = productCatchphraseSlice.reducer;
