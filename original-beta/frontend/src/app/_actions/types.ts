import { ChatMessageModel } from '../../../config';
import { LLMserviceBackEndLog } from '../_types/logs/llm-services';

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  message: string;
};

export type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;

export type CreateMinutesResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;

export type TextCorrectionResponse =
  | {
      points_of_criticism: string;
      original_text: string;
      corrected_text: string;
      success: true;
      log?: LLMserviceBackEndLog<'textCorrection'>;
    }
  | ErrorResponse;

export type CVEResponse =
  | {
      cve_chat: string;
      cve_report: string;
      success: true;
    }
  | ErrorResponse;

export type SourceCodeCreationResponse =
  | {
      chat: string;
      source_code: string;
      success: true;
    }
  | ErrorResponse;

export type AzureResponse =
  | {
      answer: string;
      success: true;
    }
  | {
      message: string;
      success: false;
    };

export type ChatResponse = {
  answer: string;
  receivedFileText?: string;
  threadTitle?: string;
  titleResponseTime?: number;
  titleInputToken?: number;
  titleOutputToken?: number;
  recommend?: string[];
} & ChatMessageModel;

export type DeepResearchResponse = {
  content: string;
  searchResults: { title: string; url: string }[];
} & ChatMessageModel;

export type SendChatResponseData = {
  content: string;
  searchResults: Array<{ id: number; title: string; url: string; snippet: string }>;
  receivedFileText?: string;
  refAns?: string[];
  refText?: string[];
  threadTitle?: string;
  recommend?: string[];
};

export type SendDeepResearchResponseData = {
  content: string;
  searchResults: Array<{ title: string; url: string }>;
};

export type TalkScriptResponse =
  | {
      content: string;
      success: true;
      log?: LLMserviceBackEndLog<'talkScript'>;
    }
  | ErrorResponse;

export type NewMailResponse =
  | {
      subject: string;
      content: string;
      success: true;
      log: LLMserviceBackEndLog<'newMail'>;
    }
  | ErrorResponse;

export type ReplyMailResponse =
  | {
      content: string;
      success: true;
      log: LLMserviceBackEndLog<'replyMail'>;
    }
  | ErrorResponse;

export type Brainstorming =
  | {
      content: string;
      success: true;
      log: LLMserviceBackEndLog<'brainstorming'>;
    }
  | ErrorResponse;

export type QualityReportResponse =
  | {
      report: string;
      company_name: string;
      manufacturing_type: string;
      report_detail_level: 'basic' | 'detailed';
      success: true;
      log: LLMserviceBackEndLog<'qualityReport'>;
    }
  | ErrorResponse;
export type KeyPointExtractionResponse =
  | {
      key_point_extraction_result: string;
      success: true;
      log?: LLMserviceBackEndLog<'keyPointExtraction'>;
    }
  | ErrorResponse;

export type NewProductIdeaResponse =
  | {
      content?: string;
      chat: string;
      success: true;
      message?: string;
    }
  | ErrorResponse;

export type TranscriptionHandwrittenResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;
export type DesignDocumentReviewResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;

export type MarketingStrategyResponse =
  | {
      content: string;
      success: true;
      log: LLMserviceBackEndLog<'marketingstrategy'>;
    }
  | ErrorResponse;
export type CreateDesignDocument =
  | {
      content: string;
      success: true;
      log: LLMserviceBackEndLog<'createDesignDocument'>;
    }
  | ErrorResponse;
