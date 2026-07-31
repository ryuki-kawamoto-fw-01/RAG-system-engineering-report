import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ANALYSIS_PRIORITIES,
  PRODUCT_CATEGORY,
  INDUSTRY_GROUP,
  CUSTOMER_GROUPS,
  REGION_GROUPS,
} from '@/app/(dashboard)/sales-forecast/_constant';

// ユーティリティ: 全選択肢を配列で取得
const PRODUCT_CATEGORY_WITHOUT_OTHER = PRODUCT_CATEGORY.filter((c) => c !== 'その他');
const ALL_INDUSTRY = INDUSTRY_GROUP.filter((c) => c !== 'その他の対象業界');
const ALL_CUSTOMERS = CUSTOMER_GROUPS.flatMap((g) => g.options);
const ALL_REGIONS = REGION_GROUPS.flatMap((g) => g.options);

export interface SalesForecastState {
  productName: string;
  productCategory: string[];
  productCategoryOther: string;
  features: string;
  useCase: string;
  analysisPriorities: string[];
  targetIndustry: string[];
  targetIndustryOther: string;
  targetCustomers: string[];
  targetCustomersOther: string;
  targetRegions: string[];
  targetRegionsOther: string;
  marketData: string;
  competingProducts: string;
  result: string;
  id: string;
  feedbackAt?: Date;
  revisionPrompt?: string;
}

export const initialState: SalesForecastState = {
  productName: '',
  productCategory: [...PRODUCT_CATEGORY_WITHOUT_OTHER],
  productCategoryOther: '',
  features: '',
  useCase: '',
  analysisPriorities: [...ANALYSIS_PRIORITIES],
  targetIndustry: [...ALL_INDUSTRY],
  targetIndustryOther: '',
  targetCustomers: [...ALL_CUSTOMERS],
  targetCustomersOther: '',
  targetRegions: [...ALL_REGIONS],
  targetRegionsOther: '',
  marketData: '',
  competingProducts: '',
  result: '',
  id: '',
  feedbackAt: undefined,
  revisionPrompt: '',
};

export const salesForecastSlice = createSlice({
  name: 'sales-forecast',
  initialState,
  reducers: {
    add: (state, action: PayloadAction<SalesForecastState>) => {
      // フォームの入力値が変わった時に保存
      return {
        ...state,
        ...action.payload,
      };
    },
    setResult: (
      state,
      action: PayloadAction<{ result: string; feedbackAt?: Date | undefined }>
    ) => ({
      ...state,
      result: action.payload.result,
      feedbackAt: action.payload.feedbackAt,
    }),
    setId: (state, action: PayloadAction<string>) => ({
      ...state,
      id: action.payload,
    }),
    setFeedbackAt: (state, action: PayloadAction<Date>) => ({
      ...state,
      feedbackAt: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setResult, setReset, add, setId, setFeedbackAt } = salesForecastSlice.actions;

export const salesForecastReducer = salesForecastSlice.reducer;
