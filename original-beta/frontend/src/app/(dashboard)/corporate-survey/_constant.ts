// 調査大カテゴリー
export const CATEGORIES = {
  BASIC_INFO: '基本情報',
  FINANCIAL_INFO: '財務情報',
  CHALLENGES: '課題',
  OTHER: 'その他',
};

// 調査項目
export const SURVEY_ITEMS = {
  BASIC_INFO: {
    INDUSTRY: '業界（業種）',
    HEADQUARTERS: '本社所在地',
    COMPANY_OVERVIEW: '企業概要',
    MAIN_BUSINESS: '主要事業',
    MAIN_PRODUCTS: '主要製品',
    EMPLOYEES_COUNT: '従業員数',
    MIDTERM_PLAN: '中期経営計画',
    MAIN_CLIENTS: '主な取引先',
    PARTNER_COMPANIES: '提携企業',
    COMPETITORS: '競合企業',
    WEBSITE: '企業サイトURL',
  },
  FINANCIAL_INFO: {
    REVENUE: '売上高',
    PROFITS: '過去3年の利益',
  },
  CHALLENGES: {
    INDUSTRY_CHALLENGES: '調査企業の業界課題',
    PROPOSALS: '調査企業の業界課題を解決する当社からの提案例',
  },
  OTHER: {
    NEWS: '調査企業に関するニュースリリース',
  },
};

// 調査項目リスト
export const surveyItemGroups = [
  {
    name: CATEGORIES.BASIC_INFO,
    items: Object.values(SURVEY_ITEMS.BASIC_INFO),
  },
  {
    name: CATEGORIES.FINANCIAL_INFO,
    items: Object.values(SURVEY_ITEMS.FINANCIAL_INFO),
  },
  {
    name: CATEGORIES.CHALLENGES,
    items: Object.values(SURVEY_ITEMS.CHALLENGES),
  },
  {
    name: CATEGORIES.OTHER,
    items: Object.values(SURVEY_ITEMS.OTHER),
  },
];

// 業界定数
export const INDUSTRY_IT = 'IT';
const INDUSTRY_AGRICULTURE_FORESTRY = '農業・林業';
const INDUSTRY_FISHERIES = '漁業';
const INDUSTRY_MINING = '鉱業、採石業、砂利採取業';
const INDUSTRY_CONSTRUCTION = '建設業';
const INDUSTRY_MANUFACTURING = '製造業';
const INDUSTRY_ENERGY = '電気・ガス・熱供給・水道業';
const INDUSTRY_TRANSPORTATION = '運送業、郵便業';
const INDUSTRY_WHOLESALE_RETAIL = '卸売業、小売業';
const INDUSTRY_FINANCE_INSURANCE = '金融業、保険業';
const INDUSTRY_REAL_ESTATE = '不動産業、物質賃貸業';
const INDUSTRY_RESEARCH_TECH_SERVICES = '学術研究・専門・技術サービス業';
const INDUSTRY_HOSPITALITY = '宿泊業、飲食サービス業';
const INDUSTRY_LIFESTYLE_ENTERTAINMENT = '生活関連サービス業、娯楽業';
const INDUSTRY_EDUCATION = '教育・学習支援業';
const INDUSTRY_HEALTHCARE_WELFARE = '医療、福祉';
const INDUSTRY_COMPOSITE_SERVICES = '複合サービス業';
const INDUSTRY_PUBLIC = '公務';
const INDUSTRY_OTHER = 'その他';

// 業界リスト
export const industries = [
  INDUSTRY_IT,
  INDUSTRY_AGRICULTURE_FORESTRY,
  INDUSTRY_FISHERIES,
  INDUSTRY_MINING,
  INDUSTRY_CONSTRUCTION,
  INDUSTRY_MANUFACTURING,
  INDUSTRY_ENERGY,
  INDUSTRY_TRANSPORTATION,
  INDUSTRY_WHOLESALE_RETAIL,
  INDUSTRY_FINANCE_INSURANCE,
  INDUSTRY_REAL_ESTATE,
  INDUSTRY_RESEARCH_TECH_SERVICES,
  INDUSTRY_HOSPITALITY,
  INDUSTRY_LIFESTYLE_ENTERTAINMENT,
  INDUSTRY_EDUCATION,
  INDUSTRY_HEALTHCARE_WELFARE,
  INDUSTRY_COMPOSITE_SERVICES,
  INDUSTRY_PUBLIC,
  INDUSTRY_OTHER,
];
