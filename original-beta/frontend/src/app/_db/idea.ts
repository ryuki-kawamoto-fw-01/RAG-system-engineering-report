'use server';
import { Container } from '@azure/cosmos';
import { IdeaModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createIdeaDB(container: Container, params: Partial<IdeaModel>) {
  const { resource: idea } = await container.items.create(params);
  return idea;
}

export async function updateIdeaDB(container: Container, params: Partial<IdeaModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<IdeaModel>();

  if (!resource) {
    throw new Error(`Idea with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
