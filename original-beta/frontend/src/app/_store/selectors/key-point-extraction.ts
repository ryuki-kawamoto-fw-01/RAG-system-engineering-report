import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectKeyPointExtraction = createSelector(
  (state: RootState) => state.keyPointExtraction,
  (state) => state
);
