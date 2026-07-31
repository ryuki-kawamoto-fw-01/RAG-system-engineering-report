import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';

export interface FileReference {
  name: string; // Blob Storageのパス: temp/design_document_review/timestamp/xxx.pdf
  type: string; // MIMEタイプ: application/pdf
  size: number; // ファイルサイズ: 1234567
}

export interface DesignDocumentReviewState {
  fileList: FileReference[];
  reviewPurpose?: string;
  priorityPoint?: string;
  consideration?: string;
}

export interface InitialState extends DesignDocumentReviewState {
  id: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialDesignDocumentReview: DesignDocumentReviewState = {
  fileList: [],
  reviewPurpose: '',
  priorityPoint: '',
  consideration: '',
};

export const initialState: InitialState = {
  ...initialDesignDocumentReview,
  id: '',
  result: '',
  feedbackAt: undefined,
};
export interface SetDesignDocumentReview {
  fileList?: FileList;
  reviewPurpose?: string;
  priorityPoint?: string;
  consideration?: string;
}

export const designDocumentReview = createSlice({
  name: 'designDocumentReview',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<DesignDocumentReviewState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
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

export const { setResult, setReset, add, setId, setFeedbackAt } = designDocumentReview.actions;

export const setDesignDocumentReview = (payload: Partial<DesignDocumentReviewState>) => {
  return async (dispatch: Dispatch) => {
    dispatch(add(payload));
  };
};

export const designDocumentReviewReducer = designDocumentReview.reducer;
