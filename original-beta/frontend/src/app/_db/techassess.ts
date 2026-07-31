'use server';
import { Container } from '@azure/cosmos';
import { TechassessModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function techassessDB(container: Container, params: Partial<TechassessModel>) {
  const { resource: techassess } = await container.items.create(params);
  return techassess;
}

export async function updateTechassessDB(container: Container, params: Partial<TechassessModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<TechassessModel>();

  if (!resource) {
    throw new Error(`Techassess with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
