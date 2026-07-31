import { z } from 'zod';
import { modifiedSupposedQuestionSchema, supposedQuestionSchema } from './_utils/schema';

export type SupposedQuestion = {
  file: File;
  description: string;
  specialty: number;
  interest: number;
  intimacy: number;
  consideration?: string;
};

export type ModifiedSupposedQuestion = {
  content: string;
  description: string;
  temp_file: string;
};

export type SupposedQuestionErrors = z.inferFlattenedErrors<
  typeof supposedQuestionSchema
>['fieldErrors'];

export type ModifiedSupposedQuestionErrors = z.inferFlattenedErrors<
  typeof modifiedSupposedQuestionSchema
>['fieldErrors'];
