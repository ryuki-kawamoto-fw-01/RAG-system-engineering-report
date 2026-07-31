import { z } from 'zod';
import { banWordSchema } from './_actions/_schema';
import { CATEGORY_VALUES } from './_constant';

export type Category = (typeof CATEGORY_VALUES)[number];

export type BanWord = {
  id: string | null;
  banWord: string;
  category: Category;
  deletedAt?: number;
};

export type BanWordErrors = z.inferFlattenedErrors<typeof banWordSchema>['fieldErrors'];
