'use server';
import { Container } from '@azure/cosmos';
import { MarkerResearchReportModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function marketresearchReportDB(
  container: Container,
  params: Partial<MarkerResearchReportModel>
) {
  const { resource: marketresearch } = await container.items.create(params);
  return marketresearch;
}

export async function updatemarketresearchReportDB(
  container: Container,
  params: Partial<MarkerResearchReportModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<MarkerResearchReportModel>();

  if (!resource) {
    throw new Error(`MarketResearch with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
