'use server';
import { Container } from '@azure/cosmos';
import { ErrorAnalysisModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createErrorAnalysisDB(
  container: Container,
  params: Partial<ErrorAnalysisModel>
) {
  const { resource: errorAnalysis } = await container.items.create(params);
  return errorAnalysis;
}

export async function updateErrorAnalysisDB(
  container: Container,
  params: Partial<ErrorAnalysisModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<ErrorAnalysisModel>();

  if (!resource) {
    throw new Error(`Error analysis with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
