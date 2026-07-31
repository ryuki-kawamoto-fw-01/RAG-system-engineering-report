import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectNewProductIdea = createSelector(
  (state: RootState) => state.newProductIdea,
  (state) => state
);
