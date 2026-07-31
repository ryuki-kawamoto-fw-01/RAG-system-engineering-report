import { ErrorResponse } from '../../_actions/types';

export type SearchCheckCadResponse =
  | {
      success: true;
      answerList: string[];
      sourceList: string[];
    }
  | (ErrorResponse & {
      message: string;
    });

export type DesignDocumentReviewResponse =
  | {
      success: true;
      answerList: string[];
    }
  | (ErrorResponse & {
      message: string;
    });
