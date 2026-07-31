'use server';
import { Container } from '@azure/cosmos';
import { TranscriptionHandwrittenModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function TranscriptionHandwrittenDB(
  container: Container,
  params: Partial<TranscriptionHandwrittenModel>
) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateTranscriptionHandwrittenDB(
  container: Container,
  params: Partial<TranscriptionHandwrittenModel>
) {
  const user = await getCurrentUser();

  const { resource } = await container
    .item(params.id!, user.id)
    .read<TranscriptionHandwrittenModel>();

  if (!resource) {
    throw new Error(`TranscriptionHandwritten with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
