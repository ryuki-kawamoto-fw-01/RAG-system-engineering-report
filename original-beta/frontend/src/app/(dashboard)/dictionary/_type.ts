import { z } from 'zod';
import { dictionarySchema } from './_actions/_schema';
import { CATEGORY_VALUES } from './_constant';

export type Category = (typeof CATEGORY_VALUES)[number];

export type Dictionary = {
  id: string | null;
  terms: string;
  uniform_name: string;
  category: Category;
  description: string;
  deletedAt?: number;
};

// キーワード検索
export type SearchFieldFilter = {
  text: string;
  fields: {
    uniform_name: boolean;
    terms: boolean;
    description: boolean;
  };
};

export type DictionaryErrors = z.inferFlattenedErrors<typeof dictionarySchema>['fieldErrors'];
