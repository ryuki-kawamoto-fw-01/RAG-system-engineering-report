export interface ProductPromotionStrategyRequest {
  productDescription: string;
  targetMarket: string;
  differentiationPoint: string;
  promotionTools: string;
  salesChannels: string;
}

export interface ProductPromotionStrategyResult {
  strategy: string;
}
