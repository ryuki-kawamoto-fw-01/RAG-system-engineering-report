'use server';

import { Container } from '@azure/cosmos';
import { ProductPromotionStrategyModel } from '../../../config';

export async function productPromotionStrategyDB(
  container: Container,
  params: Partial<ProductPromotionStrategyModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}
