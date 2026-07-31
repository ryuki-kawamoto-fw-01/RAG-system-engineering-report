'use server';
import { Container } from '@azure/cosmos';
import { ProductServiceBenefitIdeaModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createIdeaDB(
  container: Container,
  params: Partial<ProductServiceBenefitIdeaModel>
) {
  const { resource: idea } = await container.items.create(params);
  return idea;
}

export async function updateIdeaDB(
  container: Container,
  params: Partial<ProductServiceBenefitIdeaModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container
    .item(params.id!, user.id)
    .read<ProductServiceBenefitIdeaModel>();

  if (!resource) {
    throw new Error(`Product Service Benefit Idea with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
