import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectSupposedQuestion = createSelector(
  (state: RootState) => ({
    ...state.supposedQuestion,
    // fileはFileReferenceの配列として返す（base64変換不要）
    file: state.supposedQuestion.file,
  }),
  (state) => state
);
