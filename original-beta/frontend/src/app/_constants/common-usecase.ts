// ユースケースレイアウト
export const LAYOUT_LEFT_ONLY = 'left-only';
export const LAYOUT_RIGHT_ONLY = 'right-only';
export const LAYOUT_TWO_COLUMNS = 'two-columns';
export const LAYOUT_VALUES = [LAYOUT_LEFT_ONLY, LAYOUT_RIGHT_ONLY, LAYOUT_TWO_COLUMNS] as const;
export type LayoutType = (typeof LAYOUT_VALUES)[number];
