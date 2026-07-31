import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';

export type CorporateSurvey = {
  surveyCompany: string;
  selectedOptions: string[];
  additionalConsideration: string;
};

export type CorporateSurveyResponse = {
  results: string;
  log: LLMserviceBackEndLog<'corporateSurvey'>;
  // references: string;
};

export type CorporateSurveyErrorResponse = {
  error: string;
};
