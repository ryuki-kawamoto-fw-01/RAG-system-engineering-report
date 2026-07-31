'use server';
import { Container } from '@azure/cosmos';
import { CreatePromptModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createPromptDB(container: Container, params: CreatePromptModel) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updatePromptDB(container: Container, params: Partial<CreatePromptModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<CreatePromptModel>();

  if (!resource) {
    throw new Error(`prompt with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
