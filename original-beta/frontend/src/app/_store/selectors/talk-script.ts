import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectTalkScript = createSelector(
  (state: RootState) => state.talkScript,
  (state) => state
);
