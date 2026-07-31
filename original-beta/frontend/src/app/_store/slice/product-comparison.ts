import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProductComparisonState {
  // productを products配列に変更
  products: string[];
  purpose: string;
  additionalConsiderations: string;
  ProductComparisonResult: string;
}

export const initialProductComparison: ProductComparisonState = {
  // 初期値を2つの空の製品に変更
  products: ['', ''],
  purpose: '',
  additionalConsiderations: '',
  ProductComparisonResult: '',
};

export interface UpdateProductComparisonInput {
  // 入力インターフェースも配列に変更
  products?: string[];
  purpose?: string;
  additionalConsiderations?: string;
}

export const productComparisonSlice = createSlice({
  name: 'productComparison',
  initialState: initialProductComparison,
  reducers: {
    updateProductComparisonInput: (state, action: PayloadAction<UpdateProductComparisonInput>) => ({
      ...state,
      ...action.payload,
    }),
    setProductComparisonResult: (state, action: PayloadAction<string>) => ({
      ...state,
      ProductComparisonResult: action.payload,
    }),
    resetProductComparison: (state) => ({
      ...state,
      ...initialProductComparison,
    }),
  },
});

export const { updateProductComparisonInput, setProductComparisonResult, resetProductComparison } =
  productComparisonSlice.actions;

export const productComparReducer = productComparisonSlice.reducer;
