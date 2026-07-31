import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QualityStandardDocumentState {
  product_name: string;
  manufacturing_type: string;
  applicable_regulations: string[];
  product_specifications: string;
  quality_characteristics: string[];
  tolerance_requirements: string;
  existing_inspection_methods: string[];
  additional_considerations: string;
  document_detail_level: 'summary' | 'standard' | 'detailed';
}

export interface InitialState extends QualityStandardDocumentState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialQualityStandardDocument: QualityStandardDocumentState = {
  product_name: '',
  manufacturing_type: '',
  applicable_regulations: [],
  product_specifications: '',
  quality_characteristics: [],
  tolerance_requirements: '',
  existing_inspection_methods: [],
  additional_considerations: '',
  document_detail_level: 'standard',
};

export const initialState: InitialState = {
  ...initialQualityStandardDocument,
  id: '',
  result: '',
  feedbackAt: undefined,
};

export const qualityStandardDocumentSlice = createSlice({
  name: 'qualityStandardDocument',
  initialState,
  reducers: {
    setQualityStandardDocument: (
      state,
      action: PayloadAction<Partial<QualityStandardDocumentState>>
    ) => {
      Object.assign(state, action.payload);
    },
    setResult: (state, action: PayloadAction<{ result: string; feedbackAt: Date | undefined }>) => {
      state.result = action.payload.result;
      state.feedbackAt = action.payload.feedbackAt;
    },
    setId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    setFeedbackAt: (state, action: PayloadAction<Date>) => {
      state.feedbackAt = action.payload;
    },
    resetQualityStandardDocument: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setQualityStandardDocument,
  setId,
  setResult,
  setFeedbackAt,
  resetQualityStandardDocument,
} = qualityStandardDocumentSlice.actions;

// セレクタ
export const selectQualityStandardDocument = (state: { qualityStandardDocument: InitialState }) =>
  state.qualityStandardDocument;

export const selectQualityStandardDocumentId = (state: { qualityStandardDocument: InitialState }) =>
  state.qualityStandardDocument.id;

export const selectQualityStandardDocumentResult = (state: {
  qualityStandardDocument: InitialState;
}) => state.qualityStandardDocument.result;

export const selectQualityStandardDocumentFeedbackAt = (state: {
  qualityStandardDocument: InitialState;
}) => state.qualityStandardDocument.feedbackAt;

export const qualityStandardDocumentReducer = qualityStandardDocumentSlice.reducer;
