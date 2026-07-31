import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectIncidentReport = createSelector(
  (state: RootState) => state.incidentReport,
  (state) => state
);
