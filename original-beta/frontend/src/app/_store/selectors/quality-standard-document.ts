import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectQualityStandardDocument = createSelector(
  (state: RootState) => state.qualityStandardDocument,
  (qualityStandardDocument) => qualityStandardDocument
);
