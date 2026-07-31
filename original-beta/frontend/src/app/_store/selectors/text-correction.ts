import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectTextCorrection = createSelector(
  (state: RootState) => state.textCorrection,
  (state) => state
);
