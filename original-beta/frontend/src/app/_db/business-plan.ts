'use server';
import { Container } from '@azure/cosmos';
import { BusinessPlanModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createBusinessPlanDB(
  container: Container,
  params: Partial<BusinessPlanModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateBusinessPlanDB(
  container: Container,
  params: Partial<BusinessPlanModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<BusinessPlanModel>();

  if (!resource) {
    throw new Error(`businessPlan with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
