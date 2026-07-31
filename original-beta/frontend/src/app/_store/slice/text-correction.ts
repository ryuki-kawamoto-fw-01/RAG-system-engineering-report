import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { checkpointGroups } from '@/app/(dashboard)/text-correction/_utils/schema';
import { uploadFile } from '@/app/_actions/uploadFile';

export interface FileReference {
  name: string; // ファイル名（text_correction/timestamp/xxx.pdf形式）
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

export interface TextCorrectionState {
  fileList?: FileReference[];
  text?: string;
  documentType: string;
  checkpoints: string[];
  additionalConsiderations?: string;
}

export interface InitialState extends TextCorrectionState {
  id: string;
  pointsOfCriticism: string;
  originalText: string;
  correctedText: string;
  feedbackAt: undefined | Date;
}

export const initialTextCorrection: TextCorrectionState = {
  fileList: undefined,
  text: '',
  documentType: '',
  checkpoints: checkpointGroups.flatMap((group) => group.items),
  additionalConsiderations: '',
};

export const initialState: InitialState = {
  ...initialTextCorrection,
  id: '',
  pointsOfCriticism: '',
  originalText: '',
  correctedText: '',
  feedbackAt: undefined,
};

export interface SetTextCorrection {
  fileList?: FileList | FileReference[];
  text?: string;
  documentType: string;
  checkpoints: string[];
  additionalConsiderations?: string;
}

export const textCorrectionSlice = createSlice({
  name: 'textCorrection',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Partial<TextCorrectionState>>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (
      state,
      action: PayloadAction<{
        pointsOfCriticism: string;
        originalText: string;
        correctedText: string;
      }>
    ) => ({
      ...state,
      ...action.payload,
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

export const { setResult, setReset, add, setFeedbackAt, setId } = textCorrectionSlice.actions;

export const setTextCorrection = (payload: SetTextCorrection) => {
  return async (dispatch: Dispatch) => {
    if (payload.fileList instanceof FileList) {
      const timestamp = new Date().getTime();

      const uploadPromises = Array.from(payload.fileList).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', `temp/text_correction/${timestamp}/${file.name}`);
        formData.append('type', file.type);

        const response = await uploadFile(formData);
        if (response.success) {
          return {
            name: response.filename,
            type: file.type,
            size: file.size,
          };
        }
        throw new Error(`Failed to upload file: ${file.name}`);
      });

      const fileReferences: FileReference[] = await Promise.all(uploadPromises);
      dispatch(add({ ...payload, fileList: fileReferences }));
    } else {
      dispatch(add(payload as unknown as TextCorrectionState));
    }
  };
};

export const textCorrectionReducer = textCorrectionSlice.reducer;
