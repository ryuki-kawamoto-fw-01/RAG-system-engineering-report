'use server';
import { Container } from '@azure/cosmos';
import { SalesForecastModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createSalesForecastDB(
  container: Container,
  params: Partial<SalesForecastModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateSalesForecastDB(
  container: Container,
  params: Partial<SalesForecastModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<SalesForecastModel>();

  if (!resource) {
    throw new Error(`SalesForecast with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
