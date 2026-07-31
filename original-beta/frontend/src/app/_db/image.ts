'use server';
import { Container } from '@azure/cosmos';
import { ImageModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function imageGenerationDB(container: Container, params: Partial<ImageModel>) {
  const { resource: image } = await container.items.create(params);
  return image;
}

export async function updateImageDB(container: Container, params: Partial<ImageModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<ImageModel>();

  if (!resource) {
    throw new Error(`Image with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
