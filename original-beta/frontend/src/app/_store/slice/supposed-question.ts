import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';

export interface FileData {
  file: string;
  name: string;
  type: string;
}

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export interface SupposedQuestionState {
  file: FileReference[];
  description: string;
  specialty: number;
  interest: number;
  intimacy: number;
  consideration?: string;
}

export interface InitialState extends SupposedQuestionState {
  id: string;
  modified?: string;
  temp_file?: string;
  result: string;
  feedbackAt: undefined | Date;
}

export const initialSupposedQuestion: SupposedQuestionState = {
  file: [],
  description: '',
  specialty: 50,
  interest: 50,
  intimacy: 50,
  consideration: '',
};

export const initialState: InitialState = {
  ...initialSupposedQuestion,
  id: '',
  result: '',
  modified: '',
  temp_file: '',
  feedbackAt: undefined,
};
export interface SetSupposedQuestion extends Omit<SupposedQuestionState, 'file'> {
  file: FileList;
}

export const supposedQuestionSlice = createSlice({
  name: 'supposedQuestion',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<SupposedQuestionState>>) => ({
      ...state,
      ...action.payload,
    }),
    setModified: (state, action: PayloadAction<string>) => ({
      ...state,
      modified: action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{ result?: string; temp_file?: string; feedbackAt: Date | undefined }>
    ) => ({
      ...state,
      result: action.payload.result ?? '',
      temp_file: action.payload.temp_file ?? '',
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

export const { setResult, setReset, add, setModified, setId, setFeedbackAt } =
  supposedQuestionSlice.actions;

export const setSupposedQuestion = (payload: SetSupposedQuestion) => {
  return async (dispatch: Dispatch) => {
    dispatch(add(payload as unknown as SupposedQuestionState));
  };
};

export const SupposedQuestionReducer = supposedQuestionSlice.reducer;
