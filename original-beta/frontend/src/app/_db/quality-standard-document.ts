'use server';
import { Container } from '@azure/cosmos';
import { QualityStandardDocumentModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createQualityStandardDocumentDB(
  container: Container,
  params: Partial<QualityStandardDocumentModel>
) {
  const { resource: qualityStandardDocument } = await container.items.create(params);
  return qualityStandardDocument;
}

export async function updateQualityStandardDocumentDB(
  container: Container,
  params: Partial<QualityStandardDocumentModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container
    .item(params.id!, user.id)
    .read<QualityStandardDocumentModel>();

  if (!resource) {
    throw new Error(`Quality Standard Document with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
