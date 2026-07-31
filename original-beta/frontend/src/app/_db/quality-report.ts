'use server';
import { Container } from '@azure/cosmos';
import { QualityReportModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createQualityReportDB(
  container: Container,
  params: Partial<QualityReportModel>
) {
  const { resource: qualityReport } = await container.items.create(params);
  return qualityReport;
}

export async function updateQualityReportDB(
  container: Container,
  params: Partial<QualityReportModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<QualityReportModel>();

  if (!resource) {
    throw new Error(`Quality report with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
