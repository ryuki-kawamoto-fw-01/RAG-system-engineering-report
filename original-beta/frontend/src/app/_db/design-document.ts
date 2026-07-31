'use server';
import { Container } from '@azure/cosmos';
import { CreateDesignDocumentModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function designDocumentDB(
  container: Container,
  params: Partial<CreateDesignDocumentModel>
) {
  const { resource: designDoc } = await container.items.create(params);
  return designDoc;
}

export async function updateDesignDocumentDB(
  container: Container,
  params: Partial<CreateDesignDocumentModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<CreateDesignDocumentModel>();

  if (!resource) {
    throw new Error(`Create Design Document with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
