'use server';
import { Container } from '@azure/cosmos';
import { DefectAnalysisReportModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createDefectAnalysisReportDB(
  container: Container,
  params: DefectAnalysisReportModel
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateDefectAnalysisReportDB(
  container: Container,
  params: DefectAnalysisReportModel
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<DefectAnalysisReportModel>();

  if (!resource) {
    throw new Error(`defectAnalysisReport with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
