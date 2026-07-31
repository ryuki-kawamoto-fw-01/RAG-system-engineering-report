import { z } from 'zod';

export const USE_CASE_NAME_MAX_LENGTH = 100;
export const OVERVIEW_MAX_LENGTH = 1000;

export const UseCaseSchema = z.object({
  status: z.string().min(1, 'ステータスを選択してください'),
  value_proposition: z.string().optional(),
  business_domain: z.string().min(1, '業務領域を選択してください'),
  category: z.string().optional(),
  classification: z.string().min(1, '区分を選択してください'),
  use_case_name: z
    .string()
    .min(1, 'ユースケース名を入力してください')
    .max(
      USE_CASE_NAME_MAX_LENGTH,
      `ユースケース名は${USE_CASE_NAME_MAX_LENGTH}文字以内で入力してください`
    ),
  overview: z
    .string()
    .min(1, '概要を入力してください')
    .max(OVERVIEW_MAX_LENGTH, `概要は${OVERVIEW_MAX_LENGTH}文字以内で入力してください`),
  origin: z.string().min(1, '検討元を選択してください'),
  development_department: z.string().min(1, '開発部署を選択してください'),
});
