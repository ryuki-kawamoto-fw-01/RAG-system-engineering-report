'use server';
import { Container } from '@azure/cosmos';
import { DesignDocumentReviewModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function designDocumentReviewDB(
  container: Container,
  params: Partial<DesignDocumentReviewModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateDesignDocumentReviewDB(
  container: Container,
  params: Partial<DesignDocumentReviewModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<DesignDocumentReviewModel>();

  if (!resource) {
    throw new Error(`DesignDocumentReview with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
