import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectCreateMinutes = createSelector(
  (state: RootState) => state.createMinutes,
  (state) => state
);
