import { z } from 'zod';

export const QualityReportSchema = z.object({
  company_name: z
    .string()
    .min(1, { message: '企業名を入力してください' })
    .max(100, { message: '企業名は100文字以内で入力してください' }),
  manufacturing_type: z
    .string()
    .min(1, { message: '製造業種を入力してください' })
    .max(100, { message: '製造業種は100文字以内で入力してください' }),
  current_process_overview: z
    .string()
    .min(1, { message: '現在のプロセス概要を入力してください' })
    .max(500, { message: '現在のプロセス概要は500文字以内で入力してください' }),
  quality_data_management: z
    .string()
    .min(1, { message: '品質データ管理方法を入力してください' })
    .max(500, { message: '品質データ管理方法は500文字以内で入力してください' }),
  quality_history_data: z
    .string()
    .min(1, { message: '品質履歴データを入力してください' })
    .max(500, { message: '品質履歴データは500文字以内で入力してください' }),
  quality_issues: z
    .array(z.string())
    .min(1, { message: '品質課題を少なくとも1つ選択してください' }),
  analysis_period: z
    .string()
    .min(1, { message: '分析期間を入力してください' })
    .max(100, { message: '分析期間は100文字以内で入力してください' }),
  improvement_goals: z
    .string()
    .min(1, { message: '改善目標を入力してください' })
    .max(500, { message: '改善目標は500文字以内で入力してください' }),
  evaluation_metrics: z
    .array(z.string())
    .min(1, { message: '評価指標を少なくとも1つ選択してください' }),
  additional_considerations: z
    .string()
    .max(500, { message: '追加考慮事項は500文字以内で入力してください' })
    .optional(),
  report_detail_level: z.enum(['standard', 'detailed', 'summary'], {
    errorMap: () => ({ message: 'レポート詳細レベルを選択してください' }),
  }),
});

export type QualityReportInput = z.infer<typeof QualityReportSchema>;

// 製造業種の選択肢
export const MANUFACTURING_TYPE_OPTIONS = [
  '自動車部品製造',
  '自動車・輸送機器',
  '電子・電気機器',
  '機械・重工業',
  '化学・素材',
  '食品・飲料',
  '医薬品・医療機器',
  '繊維・アパレル',
  '金属・鉄鋼',
  '精密機器',
  'その他製造業',
];

// 品質課題の選択肢
export const QUALITY_ISSUES_OPTIONS = [
  '不良率の増加傾向',
  '納期遅延の発生',
  '顧客満足度の低下',
  '品質検査の効率性',
  '製造プロセスの標準化',
  'サプライヤー品質管理',
  '顧客クレーム対応',
  'トレーサビリティの確保',
  '品質基準の遵守',
  '継続的改善の実施',
  '従業員教育・訓練',
  'コスト削減と品質のバランス',
];

// 評価指標の選択肢
export const EVALUATION_METRICS_OPTIONS = [
  '不良率',
  '顧客満足度',
  '納期遵守率',
  'コスト削減率',
  '品質コスト',
  '検査効率',
  'クレーム件数',
  '歩留まり率',
  '再作業率',
  '設備稼働率',
];

// レポート詳細レベルの選択肢
export const REPORT_DETAIL_LEVEL_OPTIONS = [
  { value: 'standard', label: '標準レポート' },
  { value: 'detailed', label: '詳細レポート' },
  { value: 'summary', label: 'サマリーレポート' },
];
