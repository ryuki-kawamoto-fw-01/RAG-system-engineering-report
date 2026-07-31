import { z } from 'zod';

export const productPromotionStrategySchema = z.object({
  productDescription: z.string().min(1, '商品・サービスの概要を入力してください'),
  targetMarket: z.string().min(1, 'ターゲット市場を入力してください'),
  differentiationPoint: z.string().min(1, '差別化ポイントを入力してください'),
  promotionTools: z.string().min(1, '販促ツールを入力してください'),
  salesChannels: z.string().min(1, '販売チャネルを入力してください'),
});

export type ProductPromotionStrategySchema = z.infer<typeof productPromotionStrategySchema>;
