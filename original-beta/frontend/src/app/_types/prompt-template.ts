import { z } from 'zod';
import { PromptTemplateSchema } from '../(dashboard)/template-register/_utils/schema';
import { CATEGORY_VALUES } from '../_constants/prompt-template';

export type Category = (typeof CATEGORY_VALUES)[number];

export type PromptTemplate = {
  id?: string;
  title: string;
  category: Category | '';
  description?: string;
  content: string;
  icon?: string;
  deletedAt?: number;
};

export type PromptTemplateErrors = z.inferFlattenedErrors<
  typeof PromptTemplateSchema
>['fieldErrors'];
