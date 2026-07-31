'use server';
import { Container } from '@azure/cosmos';
import { TalkScriptModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createTalkScriptDB(container: Container, params: Partial<TalkScriptModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateTalkScriptDB(container: Container, params: Partial<TalkScriptModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<TalkScriptModel>();

  if (!resource) {
    throw new Error(`talkScript with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
