'use server';
import { Container } from '@azure/cosmos';
import { ProductionTechListModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createProductionTechListDB(
  container: Container,
  params: Partial<ProductionTechListModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateProductionTechListDB(
  container: Container,
  params: ProductionTechListModel
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<ProductionTechListModel>();

  if (!resource) {
    throw new Error(`productionTechList with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
