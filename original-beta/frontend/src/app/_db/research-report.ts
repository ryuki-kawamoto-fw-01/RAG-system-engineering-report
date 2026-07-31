'use server';
import { Container } from '@azure/cosmos';
import { ResearchReportModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function researchReportDB(container: Container, params: Partial<ResearchReportModel>) {
  const { resource: report } = await container.items.create(params);
  return report;
}

export async function updateResearchReportDB(
  container: Container,
  params: Partial<ResearchReportModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<ResearchReportModel>();

  if (!resource) {
    throw new Error(`Research report with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
