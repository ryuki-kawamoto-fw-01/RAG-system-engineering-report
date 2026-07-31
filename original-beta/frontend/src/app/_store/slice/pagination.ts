import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PaginationState {
  pageIndex: number;
}

export const initialState: PaginationState = {
  pageIndex: 0,
};

export const PaginationSlice = createSlice({
  name: 'pagination',
  initialState,
  reducers: {
    setPageIndex: (state, action: PayloadAction<number>) => ({
      ...state,
      pageIndex: action.payload,
    }),
    setReset: (state) => ({
      ...state,
      ...initialState,
    }),
  },
});

export const { setPageIndex, setReset } = PaginationSlice.actions;
export const paginationReducer = PaginationSlice.reducer;
