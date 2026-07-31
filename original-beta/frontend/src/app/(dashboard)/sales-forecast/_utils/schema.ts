import * as z from 'zod';
import {
  ANALYSIS_PRIORITIES,
  PRODUCT_CATEGORY,
  INDUSTRY_GROUP,
  CUSTOMER_GROUPS,
  REGION_GROUPS,
} from '../_constant';

// 「その他」以外を抽出
const PRODUCT_CATEGORY_WITHOUT_OTHER = PRODUCT_CATEGORY.filter((c) => c !== 'その他');
const ALL_INDUSTRY = INDUSTRY_GROUP.filter((c) => c !== 'その他の対象業界');
const ALL_CUSTOMERS = CUSTOMER_GROUPS.flatMap((g) => g.options);
const ALL_REGIONS = REGION_GROUPS.flatMap((g) => g.options);

export const salesForecastSchema = z.object({
  // 製品情報
  productName: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  productCategory: z.array(z.string()).default([...PRODUCT_CATEGORY_WITHOUT_OTHER]),
  productCategoryOther: z.string().optional().default(''),
  features: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  useCase: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  // 分析重視ポイント
  analysisPriorities: z.array(z.string()).default([...ANALYSIS_PRIORITIES]),
  // 対象市場
  targetIndustry: z.array(z.string()).default([...ALL_INDUSTRY]),
  targetIndustryOther: z.string().optional().default(''),
  targetCustomers: z.array(z.string()).default([...ALL_CUSTOMERS]),
  targetCustomersOther: z.string().optional().default(''),
  targetRegions: z.array(z.string()).default([...ALL_REGIONS]),
  targetRegionsOther: z.string().optional().default(''),
  // 市場データと競合情報
  marketData: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  competingProducts: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export const fixSalesForecastSchema = z.object({
  result: z.string().min(1),
  revisionPrompt: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type SalesForecastSchema = z.infer<typeof salesForecastSchema>;
export type FixSalesForecastSchema = z.infer<typeof fixSalesForecastSchema>;
