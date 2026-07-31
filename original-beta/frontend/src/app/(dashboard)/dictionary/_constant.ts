// カテゴリー
export const CATEGORY_DEPARTMENT = '部署名と略称';
export const CATEGORY_CUSTOM = '社内独自の言い回し';
export const CATEGORY_PRODUCT = '製品の仕様と特徴';
export const CATEGORY_MANUFACTURE = '製造工程と手順';
export const CATEGORY_QA = '品質管理と検査方法';
export const CATEGORY_MATERIAL = '材料と部品の名称';
export const CATEGORY_SAFETY_SATELLITE = '安全基準と衛生管理';
export const CATEGORY_EQUIPMENT = '設備と機械の名称';
export const CATEGORY_PROJECT = '社内プロジェクトと施策';
export const CATEGORY_IT = 'ITシステムとツール';

export const CATEGORY_VALUES = [
  CATEGORY_DEPARTMENT,
  CATEGORY_CUSTOM,
  CATEGORY_PRODUCT,
  CATEGORY_MANUFACTURE,
  CATEGORY_QA,
  CATEGORY_MATERIAL,
  CATEGORY_SAFETY_SATELLITE,
  CATEGORY_EQUIPMENT,
  CATEGORY_PROJECT,
  CATEGORY_IT,
] as const;

export const CATEGORY_OPTIONS = [
  { value: CATEGORY_DEPARTMENT, label: CATEGORY_DEPARTMENT },
  { value: CATEGORY_CUSTOM, label: CATEGORY_CUSTOM },
  { value: CATEGORY_PRODUCT, label: CATEGORY_PRODUCT },
  { value: CATEGORY_MANUFACTURE, label: CATEGORY_MANUFACTURE },
  { value: CATEGORY_QA, label: CATEGORY_QA },
  { value: CATEGORY_MATERIAL, label: CATEGORY_MATERIAL },
  { value: CATEGORY_SAFETY_SATELLITE, label: CATEGORY_SAFETY_SATELLITE },
  { value: CATEGORY_EQUIPMENT, label: CATEGORY_EQUIPMENT },
  { value: CATEGORY_PROJECT, label: CATEGORY_PROJECT },
  { value: CATEGORY_IT, label: CATEGORY_IT },
] as const;
