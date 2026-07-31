import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectProductCatchphrase = createSelector(
  (state: RootState) => state.productCatchphrase,
  (state) => state
);
