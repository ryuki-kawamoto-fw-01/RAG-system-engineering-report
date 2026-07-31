import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectTextCheck = createSelector(
  (state: RootState) => state.textCheck,
  (state) => state
);
