'use server';
import { Container } from '@azure/cosmos';
import { CompanyAnalysisModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createCompanyAnalysisDB(container: Container, params: CompanyAnalysisModel) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateCompanyAnalysisDB(container: Container, params: CompanyAnalysisModel) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<CompanyAnalysisModel>();

  if (!resource) {
    throw new Error(`companyAnalysis with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
