import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

import { persistConfig } from './persist-config';
import { adviceConsultingReducer } from './slice/advice-consulting';
import { adviceReactReducer } from './slice/advice-react';
import { analysisReducer } from './slice/analysis';
import { brainstormingReducer } from './slice/brainstorming';
import { businessPlanReducer } from './slice/business-plan';
import { codeExplanationReducer } from './slice/code-explanation';
import { companyAnalysisReducer } from './slice/company-analysis';
import { corporateSurveyReducer } from './slice/corporate-survey';
import { designDocumentReducer } from './slice/create-design-document';
import { createIdeaReducer } from './slice/create-idea';
import { CreateMailReducer } from './slice/create-mail';
import { createMinutesReducer } from './slice/create-minutes';
import { createProductNameReducer } from './slice/create-product-name';
import { createPromptReducer } from './slice/create-prompt';
import { createScheduleReducer } from './slice/create-schedule';
import { createTechnologyProposalReducer } from './slice/create-technology-proposal';
import { crisisManagementScenariosReducer } from './slice/crisis-management-scenarios';
import { cveSearchReducer } from './slice/cve-search';
import { defectAnalysisReportReducer } from './slice/defect-analysis-report';
import { designDocumentReviewReducer } from './slice/design-document-review';
import { errorAnalysisReducer } from './slice/error-analysis';
import { FaqCreationReducer } from './slice/faq-creation';
import { flowDesignerReducer } from './slice/flow-designer';
import { imageGenerationReducer } from './slice/image-generation';
import { incidentReportReducer } from './slice/incident-report';
import { judgeIdeaReducer } from './slice/judge-idea';
import { keyPointExtractionReducer } from './slice/key-point-extraction';
import { manualReducer } from './slice/manual';
import { MarketResearchReportReducer } from './slice/market-research-report';
import { marketingStrategyReducer } from './slice/marketingstrategy';
import { modelReducer } from './slice/model';
import { needsSurveyReducer } from './slice/needs-survey';
import { newProductIdeaReducer } from './slice/new-product-idea';
import { NewProductProposalReducer } from './slice/new-product-proposal';
import { paginationReducer } from './slice/pagination';
import { productAARRRReducer } from './slice/product-aarrr';
import { productCatchphraseReducer } from './slice/product-catchphrase';
import { productComparReducer } from './slice/product-comparison';
import { productPromotionStrategyReducer } from './slice/product-promotion-strategy';
import { productServiceBenefitIdeaReducer } from './slice/product-service-benefit-idea';
import { productionTechListReducer } from './slice/production-tech-list';
import { qualityReportReducer } from './slice/quality-report';
import { qualityStandardDocumentReducer } from './slice/quality-standard-document';
import { researchReportReducer } from './slice/research-report';
import { riskAssessmentReducer } from './slice/risk-assessment';
import { salesForecastReducer } from './slice/sales-forecast';
import { sourceCodeCreationReducer } from './slice/source-code-creation';
import { summaryReducer } from './slice/summary';
import { SupposedQuestionReducer } from './slice/supposed-question';
import { talkScriptReducer } from './slice/talk-script';
import { taskBreakdownReducer } from './slice/taskBreakdown';
import { techassessReducer } from './slice/techassess';
import { technologyTrainingReducer } from './slice/technology-training';
import { technologytrendResearchReducer } from './slice/technology-trend-research';
import { termSummaryReducer } from './slice/term-summary';
import { textCheckReducer } from './slice/text-check';
import { textCorrectionReducer } from './slice/text-correction';
import { transcriptionHandwrittenReducer } from './slice/transcription-handwritten';
import { translationReducer } from './slice/translation';
import { troubleShootingGuideReducer } from './slice/trouble-shooting';
import { wallHittingReducer } from './slice/wall-hitting';
const combinedReducers = combineReducers({
  createMinutes: createMinutesReducer,
  companyAnalysis: companyAnalysisReducer,
  createIdea: createIdeaReducer,
  judgeIdea: judgeIdeaReducer,
  supposedQuestion: SupposedQuestionReducer,
  textCorrection: textCorrectionReducer,
  translation: translationReducer,
  designDocument: designDocumentReducer,
  taskBreakdown: taskBreakdownReducer,
  talkScript: talkScriptReducer,
  summary: summaryReducer,
  keyPointExtraction: keyPointExtractionReducer,
  createMail: CreateMailReducer,
  cveSearch: cveSearchReducer,
  analysis: analysisReducer,
  corporateSurvey: corporateSurveyReducer,
  createPrompt: createPromptReducer,
  errorAnalysis: errorAnalysisReducer,
  qualityReport: qualityReportReducer,
  qualityStandardDocument: qualityStandardDocumentReducer,
  defectAnalysisReport: defectAnalysisReportReducer,
  pagination: paginationReducer,
  needsSurvey: needsSurveyReducer,
  productComparison: productComparReducer,
  faqCreation: FaqCreationReducer,
  flowDesigner: flowDesignerReducer,
  imageGeneration: imageGenerationReducer,
  createProductName: createProductNameReducer,
  technologytrendResearch: technologytrendResearchReducer,
  technologyTraining: technologyTrainingReducer,
  textCheck: textCheckReducer,
  productServiceBenefitIdea: productServiceBenefitIdeaReducer,
  marketresearchReport: MarketResearchReportReducer,
  newProductIdea: newProductIdeaReducer,
  brainstorming: brainstormingReducer,
  productAARRR: productAARRRReducer,
  riskAssessment: riskAssessmentReducer,
  crisisManagementScenarios: crisisManagementScenariosReducer,
  productionTechList: productionTechListReducer,
  troubleShootingGuide: troubleShootingGuideReducer,
  salesForecast: salesForecastReducer,
  codeExplanation: codeExplanationReducer,
  transcriptionHandwritten: transcriptionHandwrittenReducer,
  designDocumentReview: designDocumentReviewReducer,
  createSchedule: createScheduleReducer,
  sourceCodeCreation: sourceCodeCreationReducer,
  incidentReport: incidentReportReducer,
  termSummary: termSummaryReducer,
  productCatchphrase: productCatchphraseReducer,
  productPromotionStrategy: productPromotionStrategyReducer,
  businessPlan: businessPlanReducer,
  researchReport: researchReportReducer,
  wallHitting: wallHittingReducer,
  marketingstrategy: marketingStrategyReducer,
  newproductProposal: NewProductProposalReducer,
  createTechnologyProposal: createTechnologyProposalReducer,
  techassess: techassessReducer,
  adviceReact: adviceReactReducer,
  adviceConsulting: adviceConsultingReducer,
  manual: manualReducer,
  model: modelReducer,
});

const rootReducer = (
  state: ReturnType<typeof combinedReducers> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: { type: string; payload?: any }
) => {
  return combinedReducers(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
  devTools: process.env.NODE_ENV !== 'production',
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppStore = typeof store;
