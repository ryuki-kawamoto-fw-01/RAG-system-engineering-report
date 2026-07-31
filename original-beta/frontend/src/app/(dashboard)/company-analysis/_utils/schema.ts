import * as z from 'zod';

export const analysis: { id: string; label: string }[] = [
  { id: 'swot', label: 'SWOT分析' },
  { id: 'fiveforce', label: '5フォース分析' },
  { id: 'pest', label: 'PEST分析' },
  { id: 'valueChain', label: 'バリューチェーン分析' },
  { id: 'threec', label: '3C分析' },
  { id: 'fourp', label: '4P分析' },
];

export type AnalysisId = (typeof analysis)[number]['id'];

export const companyAnalysisSchema = z
  .object({
    company_name: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
    analytical_methods: z.array(z.string()).refine((value) => value.length > 0),
    analysis_purpose: z.string().optional(),
    business_name: z.string().optional(),
    analysis_considerations: z.string().optional(),
    reanalysis_request: z.string().optional(),
  })
  .superRefine(({ analytical_methods, business_name }, ctx) => {
    const isBusinessName = analytical_methods.some(
      (data) => data === 'fiveforce' || data === 'pest'
    );
    if (isBusinessName && !business_name) {
      ctx.addIssue({
        path: ['business_name'],
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: false,
      });
    }
  });

export const companyReAnalysisSchema = z.object({
  analytical_methods: z.array(z.string()).refine((value) => value.length > 0),
  result: z.string().min(1),
  reanalysis_request: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type CompanyAnalysisSchema = z.infer<typeof companyAnalysisSchema>;
export type CompanyReAnalysisSchema = z.infer<typeof companyReAnalysisSchema>;
