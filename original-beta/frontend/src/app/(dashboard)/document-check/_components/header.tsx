// ヘッダー行
export const header = ['チェック基準', '引用元'];
export const headerMapping: { [key: string]: string } = {
  チェック基準: 'checkDtls',
  引用元: 'source',
};
export type RowType = {
  [key: string]: string; // 任意の文字列キーを許容
  チェック基準: string;
  引用元: string;
};
