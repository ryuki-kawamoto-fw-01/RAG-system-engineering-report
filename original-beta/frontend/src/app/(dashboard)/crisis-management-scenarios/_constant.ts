// カテゴリ
export const CATEGORIES = { RISK_CATEGPORY: '一括設定' };

// 調査項目
export const RISK_ITEMS = {
  RISK_CATEGPORY: {
    INDUSTRY: '設備・技術的リスク',
    HEADQUARTERS: '自然災害・環境リスク',
    COMPANY_OVERVIEW: '品質・製品リスク',
    MAIN_BUSINESS: '人的・労的リスク',
    MAIN_PRODUCTS: '物流リスク',
    EMPLOYEES_COUNT: '経営・法務・社会的リスク',
  },
};

// 調査項目リスト
export const surveyItemGroups = [
  {
    name: CATEGORIES.RISK_CATEGPORY,
    items: Object.values(RISK_ITEMS.RISK_CATEGPORY),
  },
];
