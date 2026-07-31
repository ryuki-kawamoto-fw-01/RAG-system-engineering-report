import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectDesignDocumentReview = createSelector(
  (state: RootState) => state.designDocumentReview,
  (state) => state
);
