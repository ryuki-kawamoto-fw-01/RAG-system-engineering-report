import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';

export const title = '製造業向けアシスタントAI';
export const description = '製造業向けアシスタントAIは、製造業向けの生成AIツールです。';
export const version = '4.0.23';
export const assistantName = '製造業向けアシスタントAI';

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';
export const isProduction = process.env.NODE_ENV === 'production';

// type utility function.
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Cosmos DB

export type ChatThreadModel = {
  id: string;
  title?: string;
  titleResponseTime?: number;
  titleInputToken?: number;
  titleOutputToke?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  model?: string;
  userId: string;
  threadId?: string;
  userDepartmentName?: string;
  searchMethod?: string;
  userEmail?: string;
  userName?: string;
  departmentName?: string;
  selectedTemplateId?: string;
};

type RagChatModel = {
  contextualizedQueryTime?: number;
  contextualizedQuery?: string;
  dictionaryProcessingTime?: number;
  contexualizedQueryTime?: number;
  correctedQuery?: string;
  embeddingTime?: number;
  qaSearchTime?: number;
  documentSearchTime?: number;
  totalSearchTime?: number;
  answerGenerationTime?: number;
};

export type ChatMessageModel = Prettify<
  {
    id: string;
    threadId: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    createdAt: Date;
    deletedAt?: Date;
    model?: string;
    userId: string;
    userEmail: string;
    userName: string;
    departmentName?: string;
    userDepartmentName?: string;
    selectedTemplate?: string;
    selectedTemplateId?: string;
    selectedIndex?: string;
    category?: string;
    searchMethod?: string;
    imageUrl?: string;
    dictionaryId?: string[];
    refAns?: string[];
    refText?: string[];
    refText_qa?: string[];
    decideFuncCallProcessingTime?: number;
    searchProcessingTime?: number;
    chatProcessingTime?: number;
    responseTime?: number;
    totalApiTime?: number;
    inputTokens?: number;
    outputTokens?: number;
    userContentEmbeddingTokens?: number;
    feedbackType?: 0 | 1;
    feedbackOption1?: 0 | 1;
    feedbackOption2?: 0 | 1;
    feedbackOption3?: 0 | 1;
    feedbackOption4?: 0 | 1;
    feedbackOption5?: 0 | 1;
    feedbackOption6?: 0 | 1;
    feedbackText?: string;
    feedbackAt?: Date;
    searchResults?: Array<{ id: number; title: string; url: string; snippet: string }>;
    chatHistory?: Array<{
      role: string;
      content?: string;
      tool_calls?: Array<{
        id: string;
        function: {
          name: string;
          arguments: string;
        };
        type: string;
      }>;
      tool_call_id?: string;
    }>;
    log?: {
      logId: string;
      contextLog: {
        llm_name: string;
        llm_type: string;
        function_name?: string;
        tags: string[];
        input_type: string;
        input_value: {
          args: unknown[];
          kwargs: Record<string, unknown>;
        };
        output_type: string;
        token_usage: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
        successful: boolean;
        delay_time: number;
        output_value?: unknown;
      };
      traceLog: {
        trace_id: string;
        parent_run_id?: string;
        chat_history?: Array<{
          role: string;
          content: string;
        }>;
        flow_history?: Record<
          string,
          {
            logId: string;
            contextLog: {
              llm_name: string;
              llm_type: string;
              function_name?: string;
              tags: string[];
              input_type: string;
              input_value: unknown;
              output_type: string;
              token_usage: {
                prompt_tokens: number;
                completion_tokens: number;
                total_tokens: number;
              };
              successful: boolean;
              delay_time: number;
              output_value?: unknown;
            };
            traceLog: {
              trace_id: string;
              parent_run_id: string;
              chat_history: Array<{
                role: string;
                content: string;
              }>;
            };
          }
        >;
      };
    };
  } & RagChatModel
>;

export type CreatePromptModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  originalPrompt: string;
  outputForm: string;
  revisionPrompt?: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'prompt'>;
};

export type IdeaModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  ideationSubject: string;
  ideationRole: string;
  ideationCount: number;
  ideationConsideration?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type ErrorAnalysisModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  programmingLanguage: string;
  errorMessage: string;
  considerations: string;
  explanation: string;
  solutionAndExample: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'error-analysis'>;
};

export type QualityReportModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  companyName: string;
  manufacturingType: string;
  currentProcessOverview: string;
  qualityDataManagement: string;
  qualityHistoryData: string;
  qualityIssues: string[];
  analysisPeriod: string;
  improvementGoals: string;
  evaluationMetrics: string[];
  additional_considerations?: string;
  report_detail_level: 'standard' | 'detailed' | 'summary';
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'qualityReport'>;
};

export type CorporateSurveyModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  surveyCompany: string;
  selectedOptions: string[];
  additionalConsideration: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'corporateSurvey'>;
};

export type CreateCreateMinutesModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  meetingPurpose: string;
  inputForm: string;
  revisionPrompt: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'minutes'>;
};

export type CompanyAnalysisModel = {
  id?: string;
  userId?: string;
  useName?: string;
  userEmail?: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  company_name?: string;
  analytical_methods?: string[];
  analysis_purpose?: string;
  business_name?: string;
  analysis_considerations?: string;
  existing_analysis?: string;
  reanalysis_request?: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'companyAnalysis'>;
};

export type SupposedQuestionModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  description: string;
  specialty: string;
  interest: string;
  intimacy: string;
  qa_list: string;
  inputForm: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'supposedQuestion'>;
};

export type TalkScriptModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  purpose: string;
  specialty: string;
  interest: string;
  intimacy: string;
  considerations: string;
  modify: string;
  inputForm: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'talkScript'>;
};

export type TextCorrectionModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  type: string;
  documentType: string;
  checkpoints: string;
  additionalConsiderations: string;
  pointsOfCriticism: string;
  originalText: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'textCorrection'>;
};
export type TranslationModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  considerations: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'translation'>;
};
export type NewMailModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  mode: 'newMail';
  mailTo: string;
  mailFrom: string;
  mailPurpose: string;
  mailContent: string;
  mailConsiderations?: string;
  modify: string;
  subject: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'mail'>;
};

export type ReplyMailModel = Omit<NewMailModel, 'mode' | 'subject'> & {
  mode: 'replyMail';
  type?: string;
  reception: string;
};

export type ProductionTechListModel = {
  id?: string;
  userId?: string;
  useName?: string;
  userEmail?: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  category?: string;
  focus?: string;
  issues?: string;
  answer?: string;
  result?: string;
  newProductionTechRequest?: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'productionTechList'>;
};

export type SummaryModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  type: 'short' | 'long' | 'custom';
  summaryLength: string;
  content: string;
  consideration: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'summary'>;
};

export type NeedsSurveyModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  industry: string;
  purpose: string;
  product: string;
  persona: string;
  additionalConsiderations?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type BrainstormingModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  theme: string;
  expert1: string;
  expert2: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type SalesForecastModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  productName: string;
  productCategory: string[];
  productCategoryOther?: string;
  features: string;
  useCase: string;
  analysisPriorities: string[];
  targetIndustry: string[];
  targetIndustryOther: string;
  targetCustomers: string[];
  targetCustomersOther: string;
  targetRegions: string[];
  targetRegionsOther: string;
  marketData: string;
  competingProducts: string;
  revisionPrompt: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'sales-forecast'>;
};

export type QualityStandardDocumentModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  product_name: string;
  manufacturing_type: string;
  applicable_regulations: string[];
  product_specifications: string;
  tolerance_requirements: string;
  document_detail_level: 'summary' | 'standard' | 'detailed';
  quality_characteristics: string[];
  existing_inspection_methods: string[];
  additional_considerations: string;
  result: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'quality-standard-document'>;
};

export type DefectAnalysisReportModel = {
  id?: string;
  userId?: string;
  useName?: string;
  userEmail?: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  productName: string;
  defectDescription: string;
  occurenceCondition: string;
  usageEnvironment: string;
  impactScope: string;
  defectData: string;
  consideration: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'defectAnalysisReport'>;
};

export type CrisisManagementScenariosModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  industry: string;
  businessSize: string;
  businessContent: string;
  selectedOptions: string[];
  additionalContents?: string;
  additionalConsiderations?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type RiskAssessmentModel = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  workerInfo: string;
  machineInfo: string;
  workerCountAndPlacement: string;
  processDetails: string;
  currentMeasures: string;
  createdAt: Date;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'riskAssessment'>;
};

export type JudgeModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  ideationFunction: string;
  ideationUse: string;
  ideationMarket: string;
  ideationCountry: string;
  newJudgeRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'judge'>;
};

export type KeyPointExtractionModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  type: string;
  additionalConsiderations: string;
  keyPointExtractionResult: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'keyPointExtraction'>;
};

export type TroubleShootingGuideModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  type: string;
  createdAt: Date;
  productSpecification: string;
  productName: string;
  productPurpose: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'troubleShooting'>;
};

export type HiyariHatRegisterModel = {
  id: string;
  category: string;
  incident: string;
  counterMeasure: string;
  isDeleted?: boolean;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
};

export type MarkerResearchReportModel = {
  id: string;
  userId: string;
  createdAt: Date;
  title: string | undefined;
  marketForm: string;
  competitorForm: string;
  targetForm: string;
  purposeForm: string;
  considerationForm: string;
  fixReportRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'report'>;
};

export type CodeExplanationModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  programmingLanguage: string;
  code: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'codeExplanation'>;
};

export type NewProductProposalModel = {
  id: string;
  userId: string;
  createdAt: Date;
  title: string | undefined;
  nameForm: string;
  marketForm: string;
  targetForm: string;
  conceptForm: string;
  comparisonPointsForm: string;
  considerationForm: string;
  fixProposalRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'report'>;
};

export type ProductServiceBenefitIdeaModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  Product: string;
  Features: string;
  Consideration?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'productServiceBenefitIdea'>;
};

export type TranscriptionHandwrittenModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  inputForm: string;
  revisionPrompt: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'transcriptionHandwritten'>;
};

export type TaskBreakdownModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  task: string;
  consideration: string;
  revisionPrompt: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'taskBreakdown'>;
};

export type DesignDocumentReviewModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  reviewPurpose: string;
  priorityPoint: string;
  consideration: string;
  inputForm: string;
  revisionPrompt: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'design-document-review'>;
};

export type TechnologyTrainingModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  technology: string;
  learningLevel: string;
  studyTime: number;
  consideration?: string;
  fixTrainingRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'training'>;
};

export type ScheduleModel = {
  id: string;
  userId: string;
  createdAt: Date;
  scheduleworkForm: string;
  title: string | undefined;
  considerationForm: string;
  startdateForm: string;
  enddateForm: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
};

export type IncidentReportModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  incidentDateTime: string;
  incidentLocation: string;
  reporter: string;
  yearsOfService: string;
  workExperience: string;
  jobDescription: string;
  disasterType: string;
  manualAvailability?: string;
  complianceStatus?: string;
  manualLastUpdated?: Date;
  equipmentName: string;
  installationYear: string;
  lastInspectionDate: string;
  maintenanceHistory: string;
  equipmentMalfunctionHistory: string;
  type: string;
  additionalConsiderations: string;
  keyPointExtractionResult: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'incidentReport'>;
};

export type TextCheckModel = {
  id: string;
  userId: string;
  type: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  textInput: string;
  checkContent1: string;
  checkContent2?: string;
  checkContent3?: string;
  outputForm?: string;
  evaluation: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'textCheck'>;
};

export type CatchphraseModel = {
  id: string;
  userId: string;
  type: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  productName: string;
  productInformation: string;
  targetCustomer: string;
  competitor: string;
  consideration?: string;
  fileConsideration?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type BusinessPlanModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  businessName: string;
  businessPurpose: string;
  targetMarket: string;
  businessModel: string;
  competitiveAdvantage: string;
  financialProjection: string;
  answer: string;
  result: string;
  newBusinessPlanRequest: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'businessplan'>;
};

export type ResearchReportModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  subject: string;
  purpose: string;
  method: string;
  researchresult: string;
  references: string;
  consideration?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type ProductAARRRModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  product_service: string;
  product_service_content: string;
  additionalConsiderations?: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'product-aarrr'>;
};

export type WallHittingModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  theme: string;
  idea: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'hitting'>;
};
export type MarketingStrategyModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  MarketSize: string;
  GrowthRate: string;
  KeyPlayer: string;
  Competitors: string;
  CustomerAttributes: string;
  PurchasingBehavior: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'marketing-strategy'>;
};

export type TechnologyProposalModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  technologyName: string;
  market: string;
  current_Issues: string;
  consideration?: string;
  modify: string;
  result: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'technologyProposal'>;
};

export type AdviceReactModel = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  adviceInput: string;
  createdAt: Date;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'adviceReact'>;
};

export type AdviceConsultingModel = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  role: string;
  constraints: string;
  adviceInput: string;
  createdAt: Date;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'adviceConsulting'>;
};

export type CreateDesignDocumentModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  product: string;
  purpose: string;
  feature: string;
  additionalConsiderations?: string;
  newIdeaRequest: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type ProductPromotionStrategyModel = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  productDescription: string;
  targetMarket: string;
  differentiationPoint: string;
  promotionTools: string;
  salesChannels: string;
  createdAt: Date;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'productPromotionStrategy'>;
};

export type FlowDesignerModel = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  text: string;
  type: string;
  consideration?: string;
  createdAt: Date;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log?: LLMserviceBackEndLog<'flowDesigner'>;
};

export type ImageModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  imageContent: string;
  imageSize: string;
  imageFormat: string;
  fixImageRequest: string;
  outputForm: string;
  blobName?: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'idea'>;
};

export type TechassessModel = {
  id: string;
  userId: string;
  useName: string;
  userEmail: string;
  userDepartmentName?: string | null;
  createdAt: Date;
  field: string;
  region: string;
  companySize: string;
  industryIssues: string;
  granularity: string;
  purpose: string;
  outputForm: string;
  feedbackType?: 0 | 1;
  feedbackOption1?: 0 | 1;
  feedbackOption2?: 0 | 1;
  feedbackOption3?: 0 | 1;
  feedbackOption4?: 0 | 1;
  feedbackOption5?: 0 | 1;
  feedbackOption6?: 0 | 1;
  feedbackText?: string;
  feedbackAt?: Date;
  log: LLMserviceBackEndLog<'techassess'>;
};

// Parameters

// TODO: 共通で使う定数はconfig.tsにまとめる
export const MODEL_GPT_52 = 'gpt-5.2';
export const MODEL_GPT_52_REASONING = 'gpt-5.2-reasoning';
export const MODEL_GPT_41 = 'gpt-4.1';
export const MODEL_VALUES = [MODEL_GPT_52, MODEL_GPT_52_REASONING, MODEL_GPT_41] as const;
export const DEFAULT_MODEL = MODEL_GPT_52;
export type ModelValue = (typeof MODEL_VALUES)[number];

export const models = [
  {
    value: MODEL_GPT_52,
    label: 'GPT-5.2',
    description:
      '「史上最も賢く、最速で、最も役立つ」大規模言語モデルです。幅広い分野で最高性能を発揮します。（学習データ:~2024/10）',
  },
  {
    value: MODEL_GPT_52_REASONING,
    label: 'GPT-5.2(推論)',
    description:
      '難易度の高い専門的タスクや深い推論が必要な場面に最適化したモデルです。複雑な科学・数学・医療・コーディング問題において、網羅的かつ高精度な回答を提供します。（学習データ:~2024/10）',
  },
  {
    value: MODEL_GPT_41,
    label: 'GPT-4.1',
    description:
      'GPT-5.2以前の主流モデルです。GPT-5.2の速度が遅いと感じた場合にご使用ください。（学習データ:~2024/05/31）',
  },
];

export const SEARCH_METHOD_SEMANTIC_HYBRID = 'semantic-hybrid-search';
export const SEARCH_METHOD_KEYWORD = 'keyword-search';
export const SEARCH_METHOD_AGENTIC_RETRIEVAL = 'agentic-retrieval';
export const SEARCH_METHOD_VALUES = [
  SEARCH_METHOD_SEMANTIC_HYBRID,
  SEARCH_METHOD_KEYWORD,
  SEARCH_METHOD_AGENTIC_RETRIEVAL,
] as const;
export type SearchMethodValue = (typeof SEARCH_METHOD_VALUES)[number];

export const searchMethods = [
  {
    value: SEARCH_METHOD_SEMANTIC_HYBRID,
    label: '精度重視検索',
    description:
      '複数の検索手法を組み合わせて検索を行います。ユーザーの意図に合致した精度の高い結果を提供します。',
  },
  {
    value: SEARCH_METHOD_KEYWORD,
    label: '速度重視検索',
    description: 'キーワードに基づいて検索を行います。高速な処理で、簡単な情報取得に適しています。',
  },
  {
    value: SEARCH_METHOD_AGENTIC_RETRIEVAL,
    label: 'AIおまかせ検索',
    description:
      'AIエージェントが複数の検索手法を自律的に判断・実行し、最適な情報を提供する高度な検索手法です。',
  },
];

// Feedback

export const goodFeedbackOptions = [
  { id: '1', label: '正しい回答であり、十分な情報を入手することができた' },
  { id: '2', label: '回答は正しいが、もう少し情報が欲しかった' },
  { id: '3', label: '回答速度が速かった' },
  { id: '4', label: '今回の使い方は他の利用者にも推奨したいものだった' },
  { id: '5', label: '今回の使い方は自分くらいしか思いつかないものだった' },
  { id: '6', label: 'その他' },
];

export const badFeedbackOptions = [
  { id: '1', label: '回答されなかった' },
  { id: '2', label: '回答されたが、情報が間違っていた' },
  { id: '3', label: '情報は正しいが、欲しい情報ではなかった' },
  { id: '4', label: '回答速度が遅かった' },
  { id: '5', label: '機能が不足しており改善要望がある' },
  { id: '6', label: 'その他' },
];

export const languages = [
  { value: '英語', label: '英語' },
  { value: '日本語', label: '日本語' },
  { value: 'スペイン語', label: 'スペイン語' },
  { value: 'フランス語', label: 'フランス語' },
  { value: 'ドイツ語', label: 'ドイツ語' },
  { value: '中国語', label: '中国語' },
  { value: '韓国語', label: '韓国語' },
  { value: 'タイ語', label: 'タイ語' },
  { value: 'トルコ語', label: 'トルコ語' },
  { value: 'ポルトガル語', label: 'ポルトガル語' },
  { value: 'ロシア語', label: 'ロシア語' },
  { value: 'インドネシア語', label: 'インドネシア語' },
  { value: 'アラビア語', label: 'アラビア語' },
];

export const goodFeedbacktext =
  '特に気に入った点・もっとこうしてほしい点があれば教えてください。【任意】';
export const badFeedbacktext =
  '問題を改善し、より良いサービスをご提供するために、どのような回答を期待していたのか教えてください。【任意】';

// Fileプレビューの上限サイズ
export const MAX_CSV_VIEW_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_VIEW_SIZE = 50 * 1024 * 1024; // 50MB

// ユーザーに表示されるエラーメッセージ
export const DB_ERROR_MSG = 'データの保存に失敗しました。システム管理者にお問い合わせください。';
export const CHAT_API_ERROR_MSG =
  'メッセージの送信に失敗しました。少し時間を置いてから再度お試しください。それでも解決しない場合は、システム管理者にお問い合わせください。';
export const USER_ERROR_MSG =
  'ユーザー情報に誤りがあります。再読み込みをして再度お試しください。それでも解決しない場合は、システム管理者にお問い合わせください。';
export const INPUT_ERROR_MSG =
  '入力内容に誤りがあります。再度入力してください。それでも解決しない場合はページを再度読み込んでから試してください。';
