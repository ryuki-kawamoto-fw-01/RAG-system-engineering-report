'use server';
import { Container } from '@azure/cosmos';
import { TechnologyTrainingModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function technologyTrainingDB(
  container: Container,
  params: Partial<TechnologyTrainingModel>
) {
  const { resource: technologytraining } = await container.items.create(params);
  return technologytraining;
}

export async function updateTechnologyTrainingDB(
  container: Container,
  params: Partial<TechnologyTrainingModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<TechnologyTrainingModel>();

  if (!resource) {
    throw new Error(`TechnologyTraining with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
