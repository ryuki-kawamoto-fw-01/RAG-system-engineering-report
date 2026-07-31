import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectCreateMail = createSelector(
  (state: RootState) => state.createMail,
  (state) => state
);
