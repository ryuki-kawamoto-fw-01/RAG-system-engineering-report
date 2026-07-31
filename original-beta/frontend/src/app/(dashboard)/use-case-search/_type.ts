import { z } from 'zod';
import {
  STATUS_VALUES,
  VALUE_PROPOSITION_VALUES,
  BUSINESS_DOMAIN_VALUES,
  CATEGORY_VALUES,
  CLASSIFICATION_VALUES,
  ORIGIN_VALUES,
  DEVELOPMENT_DEPARTMENT_VALUES,
} from './_constant';
import { UseCaseSchema } from './_utils/schema';

// ステータス型
export type Status = (typeof STATUS_VALUES)[number];

// 提供価値型
export type ValueProposition = (typeof VALUE_PROPOSITION_VALUES)[number];

// 業務領域型
export type BusinessDomain = (typeof BUSINESS_DOMAIN_VALUES)[number];

// カテゴリー型
export type Category = (typeof CATEGORY_VALUES)[number];

// 区分型
export type Classification = (typeof CLASSIFICATION_VALUES)[number];

// 検討元型
export type Origin = (typeof ORIGIN_VALUES)[number];

// 開発部署型
export type DevelopmentDepartment = (typeof DEVELOPMENT_DEPARTMENT_VALUES)[number];

// ユースケース型
export type UseCase = {
  id: string | null;
  status: Status | '';
  value_proposition: ValueProposition | '';
  business_domain: BusinessDomain | '';
  category: Category | '';
  classification: Classification | '';
  use_case_name: string;
  overview: string;
  origin: Origin | '';
  development_department: DevelopmentDepartment | '';
  deletedAt?: number;
  isDeleted?: boolean;
};

// エラー型
export type UseCaseErrors = z.inferFlattenedErrors<typeof UseCaseSchema>['fieldErrors'];
