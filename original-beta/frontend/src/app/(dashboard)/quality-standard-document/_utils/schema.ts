import { z } from 'zod';

export const qualityStandardDocumentSchema = z.object({
  product_name: z.string().min(1, '製品名を入力してください'),
  manufacturing_type: z.string().min(1, '製造業種を入力してください'),
  applicable_regulations: z.array(z.string()).min(1, '適用法規制を最低1つ入力してください'),
  product_specifications: z.string().min(1, '製品仕様を入力してください'),
  tolerance_requirements: z.string().min(1, '許容範囲要求を入力してください'),
  document_detail_level: z.enum(['summary', 'standard', 'detailed'], {
    required_error: '文書詳細レベルを選択してください',
  }),
  // 任意項目
  quality_characteristics: z.array(z.string()).optional(),
  existing_inspection_methods: z.array(z.string()).optional(),
  additional_considerations: z.string().optional(),
});

export type QualityStandardDocumentSchema = z.infer<typeof qualityStandardDocumentSchema>;
