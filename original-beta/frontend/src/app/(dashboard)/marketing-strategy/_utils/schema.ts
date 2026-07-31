import * as z from 'zod';

// ブレインストーミングのスキーマ
export const marketingstrategySchema = z.object({
  // 市場規模（必須）
  MarketSize: z.string().min(1, {
    message: 'ターゲット市場と市場規模を入力してください。',
  }),
  // 成長率（必須）
  GrowthRate: z.string().min(1, {
    message: '直近や将来的な予測成長率を入力してください。',
  }),
  // 主要プレイヤー（必須）
  KeyPlayer: z.string().min(1, {
    message: 'ターゲット市場の主要プレイヤーを入力してください。',
  }),
  // 競合製品の特徴や価格（必須）
  Competitors: z.string().min(1, {
    message: '競合製品の具体的な特徴や価格を入力してください。',
  }),
  // 顧客属性（必須）
  CustomerAttributes: z.string().min(1, {
    message: '年代や所得などの顧客属性を入力してください。',
  }),
  // 購買行動や嗜好（必須）
  PurchasingBehavior: z.string().min(1, {
    message: '顧客の購買行動や嗜好を入力してください。',
  }),
});

export const newMarketingStrategySchema = z.object({
  newRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

// マーケティング戦略比較スキーマの型
export type MarketingStrategySchema = z.infer<typeof marketingstrategySchema>;
export type NewMarketingStrategySchema = z.infer<typeof newMarketingStrategySchema>;
