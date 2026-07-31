'use server';
import { Container } from '@azure/cosmos';
import { CrisisManagementScenariosModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function crisisManagementScenariosDB(
  container: Container,
  params: Partial<CrisisManagementScenariosModel>
) {
  const { resource: designDoc } = await container.items.create(params);
  return designDoc;
}

export async function updateCrisisManagementScenariosDB(
  container: Container,
  params: Partial<CrisisManagementScenariosModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container
    .item(params.id!, user.id)
    .read<CrisisManagementScenariosModel>();

  if (!resource) {
    throw new Error(`Crisis-Management-Scenarios with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
