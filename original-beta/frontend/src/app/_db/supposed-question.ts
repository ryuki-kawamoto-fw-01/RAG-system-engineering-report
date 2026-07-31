'use server';
import { Container } from '@azure/cosmos';
import { SupposedQuestionModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createSupposedQuestionDB(
  container: Container,
  params: Partial<SupposedQuestionModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateSupposedQuestionDB(
  container: Container,
  params: Partial<SupposedQuestionModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<SupposedQuestionModel>();

  if (!resource) {
    throw new Error(`SupposedQuestion with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
