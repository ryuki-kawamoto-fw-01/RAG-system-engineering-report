import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { getBase64Files } from '@/app/_utils/file';

// ファイルデータの型定義
export interface FileData {
  file: string;
  name: string;
  type: string;
}

// FAQ作成の状態
export interface FaqCreationState {
  fileList?: FileData[];
  text?: string;
  documentType: string;
  checkpoints: string[];
  additionalConsiderations?: string;
  questionerPosition?: string;
  respondentPosition?: string;
  faqResult: string; // 生成されたFAQ結果
}

// 初期状態
export const initialState: FaqCreationState = {
  fileList: undefined,
  text: '',
  documentType: 'FAQ',
  checkpoints: ['一般的なFAQ'],
  additionalConsiderations: '',
  questionerPosition: '',
  respondentPosition: '',
  faqResult: '',
};

// 入力用の型定義
export interface SetFaqCreation {
  fileList?: FileList;
  text?: string;
  documentType: string;
  checkpoints: string[];
  additionalConsiderations?: string;
  questionerPosition?: string;
  respondentPosition?: string;
}

export const faqCreationSlice = createSlice({
  name: 'faqCreation',
  initialState,
  reducers: {
    updateFaqInput: (state, action: PayloadAction<Partial<FaqCreationState>>) => ({
      ...state,
      ...action.payload,
    }),
    setFaqResult: (state, action: PayloadAction<string>) => ({
      ...state,
      faqResult: action.payload,
    }),
    resetFaqCreation: () => initialState,
  },
});

export const { updateFaqInput, setFaqResult, resetFaqCreation } = faqCreationSlice.actions;

// 非同期アクション - ファイルリストを含む場合にBase64エンコード
export const setFaqCreation = (payload: SetFaqCreation) => {
  return async (dispatch: Dispatch) => {
    if (payload.fileList instanceof FileList) {
      const response: FileData[] = await getBase64Files(payload.fileList);
      dispatch(
        updateFaqInput({
          ...payload,
          fileList: response,
        })
      );
    } else {
      // ESLintルールを一時的に無効化
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fileList, ...restPayload } = payload;
      dispatch(updateFaqInput(restPayload));
    }
  };
};

export const FaqCreationReducer = faqCreationSlice.reducer;
