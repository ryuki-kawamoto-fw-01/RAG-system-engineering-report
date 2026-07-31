import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  INDUSTRY_IT,
  SURVEY_ITEMS,
  surveyItemGroups,
} from '../../(dashboard)/corporate-survey/_constant';

export interface CorporateSurveyState {
  id?: string;
  surveyCompany?: string;
  selectedOptions?: string[];
  additionalConsideration?: string;
  feedbackAt?: undefined | Date;
}

export interface InitialState extends CorporateSurveyState {
  results?: string;
}

export const initialCorporateSurvey: CorporateSurveyState = {
  id: '',
  surveyCompany: '',
  selectedOptions: [],
  additionalConsideration: '',
  feedbackAt: undefined,
};

const loadState = () => {
  // サーバーサイドレンダリング時はlocalStorageが存在しないためチェック
  if (typeof window === 'undefined') {
    return {
      ...initialCorporateSurvey,
      selectedOptions: [],
    };
  }

  try {
    const previousSelectedIndustry = localStorage.getItem('selectedIndustry');
    const selectedIndustry = previousSelectedIndustry ? previousSelectedIndustry : INDUSTRY_IT;
    const defaultSelectedOptions = surveyItemGroups.flatMap((group) =>
      group.items.map((item) =>
        item === SURVEY_ITEMS.CHALLENGES.PROPOSALS
          ? `${item} 当社の業界：${selectedIndustry}`
          : item
      )
    );
    return {
      ...initialCorporateSurvey,
      selectedOptions: defaultSelectedOptions,
    };
  } catch (err) {
    console.error('Could not load state', err);
    return {
      ...initialCorporateSurvey,
      selectedOptions: [],
    };
  }
};

export const initialState: InitialState = loadState() || {
  results: '',
};

export const corporateSurveySlice = createSlice({
  name: 'corporateSurvey',
  initialState,
  reducers: {
    setCorporateSurvey: (state, action: PayloadAction<InitialState>) => ({
      ...state,
      ...action.payload,
    }),
    setResult: (state, action: PayloadAction<InitialState>) => ({
      ...state,
      ...action.payload,
      results: action.payload.results,
      feedbackAt: action.payload.feedbackAt,
    }),
    setId: (state, action: PayloadAction<string>) => ({
      ...state,
      id: action.payload,
    }),
    setFeedbackAt: (state, action: PayloadAction<Date>) => ({
      ...state,
      feedbackAt: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
      results: '',
    }),
  },
});

export const { setReset, setCorporateSurvey, setId, setFeedbackAt, setResult } =
  corporateSurveySlice.actions;
export const corporateSurveyReducer = corporateSurveySlice.reducer;
