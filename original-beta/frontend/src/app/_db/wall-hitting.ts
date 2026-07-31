'use server';
import { Container } from '@azure/cosmos';
import { WallHittingModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function wallHittingDB(container: Container, params: Partial<WallHittingModel>) {
  const { resource: wallhitting } = await container.items.create(params);
  return wallhitting;
}

export async function updateWallHittingDB(container: Container, params: Partial<WallHittingModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<WallHittingModel>();

  if (!resource) {
    throw new Error(`WallHitting with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
