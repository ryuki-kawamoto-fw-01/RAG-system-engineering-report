// カテゴリー
export const CATEGORY_ALL = '全てのカテゴリー';
export const CATEGORY_BUSINESS = 'ビジネス全般';
export const CATEGORY_PLANNING = '企画';
export const CATEGORY_SALES = '営業';
export const CATEGORY_MARKETING = '販売';
export const CATEGORY_SUPPLY = '調達';
export const CATEGORY_DESIGN = '設計';
export const CATEGORY_RESEARCH = '研究開発';
export const CATEGORY_PRODUCTION = '製造';
export const CATEGORY_IT = 'IT';
export const CATEGORY_QUALITY = '品質保証';
export const CATEGORY_SAFETY = '安全';
export const CATEGORY_TRAINING = '教育、訓練';
export const CATEGORY_AI_MODEL = '推論モデル';
export const CATEGORY_SYSTEM_DEVELOPMENT = 'システム開発'; // 製品化には加えないため、最後に削除
export const CATEGORY_OTHERS = 'その他';

export const CATEGORY_VALUES = [
  CATEGORY_BUSINESS,
  CATEGORY_PLANNING,
  CATEGORY_SALES,
  CATEGORY_MARKETING,
  CATEGORY_SUPPLY,
  CATEGORY_DESIGN,
  CATEGORY_RESEARCH,
  CATEGORY_PRODUCTION,
  CATEGORY_IT,
  CATEGORY_QUALITY,
  CATEGORY_SAFETY,
  CATEGORY_TRAINING,
  CATEGORY_AI_MODEL,
  CATEGORY_SYSTEM_DEVELOPMENT, // 製品化には加えないため、最後に削除
  CATEGORY_OTHERS,
] as const;

export const CATEGORY_OPTIONS = [
  { value: CATEGORY_BUSINESS, label: CATEGORY_BUSINESS },
  { value: CATEGORY_PLANNING, label: CATEGORY_PLANNING },
  { value: CATEGORY_SALES, label: CATEGORY_SALES },
  { value: CATEGORY_MARKETING, label: CATEGORY_MARKETING },
  { value: CATEGORY_SUPPLY, label: CATEGORY_SUPPLY },
  { value: CATEGORY_DESIGN, label: CATEGORY_DESIGN },
  { value: CATEGORY_RESEARCH, label: CATEGORY_RESEARCH },
  { value: CATEGORY_PRODUCTION, label: CATEGORY_PRODUCTION },
  { value: CATEGORY_QUALITY, label: CATEGORY_QUALITY },
  { value: CATEGORY_SAFETY, label: CATEGORY_SAFETY },
  { value: CATEGORY_IT, label: CATEGORY_IT },
  { value: CATEGORY_TRAINING, label: CATEGORY_TRAINING },
  { value: CATEGORY_AI_MODEL, label: CATEGORY_AI_MODEL },
  { value: CATEGORY_SYSTEM_DEVELOPMENT, label: CATEGORY_SYSTEM_DEVELOPMENT }, // 製品化には加えないため、最後に削除
  { value: CATEGORY_OTHERS, label: CATEGORY_OTHERS },
] as const;

export const TEMPLATE_PAGE_TYPE = {
  CHAT: 'chat',
  RAG: 'rag',
  AGENT: 'agent',
} as const;
