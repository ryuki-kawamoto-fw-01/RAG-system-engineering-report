import { createSelector } from '@reduxjs/toolkit';
import { getBase64ToFiles } from '@/app/_utils/file';
import { RootState } from '../store';

export const selectFaqCreation = createSelector(
  (state: RootState) => ({
    ...state.faqCreation,
    fileList: state.faqCreation.fileList ? getBase64ToFiles(state.faqCreation.fileList) : undefined,
  }),
  (state) => state
);
