'use server';
import { Container } from '@azure/cosmos';
import { ProductAARRRModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createProductAARRRDB(
  container: Container,
  params: Partial<ProductAARRRModel>
) {
  const { resource: productAARRR } = await container.items.create(params);
  return productAARRR;
}

export async function updateProductAARRRDB(
  container: Container,
  params: Partial<ProductAARRRModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<ProductAARRRModel>();

  if (!resource) {
    throw new Error(`ProductAARRR with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
