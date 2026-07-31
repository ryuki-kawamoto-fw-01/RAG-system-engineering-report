'use server';
import { Container } from '@azure/cosmos';
import { TaskBreakdownModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createTaskBreakdownDB(
  container: Container,
  params: Partial<TaskBreakdownModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateTaskBreakdownDB(
  container: Container,
  params: Partial<TaskBreakdownModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<TaskBreakdownModel>();

  if (!resource) {
    throw new Error(`TaskBreakdown with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
