import { createSelector } from '@reduxjs/toolkit';
import { getBase64ToFiles } from '@/app/_utils/file';
import { RootState } from '../store';

export const selectTranscriptionHandwritten = createSelector(
  (state: RootState) => {
    return {
      ...state.transcriptionHandwritten,
      fileList: getBase64ToFiles(state.transcriptionHandwritten.fileList),
    };
  },
  (state) => state
);
