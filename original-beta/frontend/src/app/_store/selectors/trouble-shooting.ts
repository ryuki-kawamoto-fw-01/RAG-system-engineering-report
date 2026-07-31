import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectTroubleShooting = createSelector(
  (state: RootState) => state.troubleShootingGuide,
  (state) => state
);
