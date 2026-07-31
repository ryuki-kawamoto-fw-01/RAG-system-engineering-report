'use server';
import { Container } from '@azure/cosmos';
import { CreateCreateMinutesModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createCreateMinutesDB(
  container: Container,
  params: Partial<CreateCreateMinutesModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateCreateMinutesDB(
  container: Container,
  params: Partial<CreateCreateMinutesModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<CreateCreateMinutesModel>();

  if (!resource) {
    throw new Error(`CreateMinute with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
