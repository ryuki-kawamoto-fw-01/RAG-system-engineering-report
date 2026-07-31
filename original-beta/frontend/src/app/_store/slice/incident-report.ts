import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IncidentReportInput {
  incidentDateTime?: string;
  incidentLocation?: string;
  reporter?: string;
  yearsOfService?: string;
  workExperience?: string;
  jobDescription?: string;
  disasterType?: string;
  manualAvailability?: 'あり' | 'なし';
  complianceStatus?: '完全遵守' | '一部遵守' | '未遵守';
  manualLastUpdated?: Date | null;
  equipmentName?: string;
  installationYear?: string;
  lastInspectionDate?: string;
  maintenanceHistory?: string;
  equipmentMalfunctionHistory?: string;
}

export interface IncidentReportState {
  incidentReportResult: string;
  incidentReportInput: IncidentReportInput;
  id: string;
  feedbackAt: Date | null;
}

const initialState: IncidentReportState = {
  incidentReportResult: '',
  incidentReportInput: {},
  id: '',
  feedbackAt: null,
};

const incidentReportSlice = createSlice({
  name: 'incidentReport',
  initialState,
  reducers: {
    setIncidentReportResult(state, action: PayloadAction<string>) {
      state.incidentReportResult = action.payload;
    },
    setIncidentReportId(state, action: PayloadAction<string>) {
      state.id = action.payload;
    },
    updateIncidentReportInput(state, action: PayloadAction<{ input: IncidentReportInput }>) {
      state.incidentReportInput = action.payload.input;
    },
    resetIncidentReport(state) {
      state.incidentReportResult = '';
      state.incidentReportInput = {};
      state.id = '';
      state.feedbackAt = null;
    },
    setFeedbackAt(state, action: PayloadAction<Date | null>) {
      state.feedbackAt = action.payload;
    },
  },
});

export const incidentReportReducer = incidentReportSlice.reducer;
export const {
  setIncidentReportResult,
  setIncidentReportId,
  updateIncidentReportInput,
  resetIncidentReport,
  setFeedbackAt,
} = incidentReportSlice.actions;
