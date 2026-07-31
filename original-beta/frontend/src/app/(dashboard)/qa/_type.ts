import { z } from 'zod';
import {
  CATEGORY_VALUES,
  SUB_CATEGORY_VALUES_HR,
  SUB_CATEGORY_VALUES_GENERAL,
  SUB_CATEGORY_VALUES_LEGAL,
  SUB_CATEGORY_VALUES_AUDIT,
  SUB_CATEGORY_VALUES_FINANCE,
  SUB_CATEGORY_VALUES_PR,
  SUB_CATEGORY_VALUES_PROCUREMENT,
  SUB_CATEGORY_VALUES_EDUCATION,
  SUB_CATEGORY_VALUES_IT,
  SUB_CATEGORY_VALUES_WELFARE,
  SUB_CATEGORY_VALUES_PRODUCTION,
  SUB_CATEGORY_VALUES_QUALITY,
  SUB_CATEGORY_VALUES_OTHER,
} from './_constant';
import { QASchema } from './_utils/schema';

// カテゴリー型
export type Category = (typeof CATEGORY_VALUES)[number];

// サブカテゴリー型（全カテゴリのサブカテゴリーをまとめた型）
export type SubCategory =
  | (typeof SUB_CATEGORY_VALUES_HR)[number]
  | (typeof SUB_CATEGORY_VALUES_GENERAL)[number]
  | (typeof SUB_CATEGORY_VALUES_LEGAL)[number]
  | (typeof SUB_CATEGORY_VALUES_AUDIT)[number]
  | (typeof SUB_CATEGORY_VALUES_FINANCE)[number]
  | (typeof SUB_CATEGORY_VALUES_PR)[number]
  | (typeof SUB_CATEGORY_VALUES_PROCUREMENT)[number]
  | (typeof SUB_CATEGORY_VALUES_EDUCATION)[number]
  | (typeof SUB_CATEGORY_VALUES_IT)[number]
  | (typeof SUB_CATEGORY_VALUES_WELFARE)[number]
  | (typeof SUB_CATEGORY_VALUES_PRODUCTION)[number]
  | (typeof SUB_CATEGORY_VALUES_QUALITY)[number]
  | (typeof SUB_CATEGORY_VALUES_OTHER)[number];

// QA型
export type QA = {
  id: string | null;
  question: string;
  answer: string;
  category: Category | '';
  work_category: SubCategory | '';
  deletedAt?: number;
  isDeleted?: string;
};

// エラー型
export type QAErrors = z.inferFlattenedErrors<typeof QASchema>['fieldErrors'];
