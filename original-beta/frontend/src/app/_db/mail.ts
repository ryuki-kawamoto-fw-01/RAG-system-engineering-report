'use server';
import { Container } from '@azure/cosmos';
import { NewMailModel, ReplyMailModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function createNewMailDB(container: Container, params: Partial<NewMailModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function createReplyMailDB(container: Container, params: Partial<ReplyMailModel>) {
  const { resource } = await container.items.create(params);
  return resource;
}

export async function updateNewMailDB(container: Container, params: Partial<NewMailModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<NewMailModel>();

  if (!resource) {
    throw new Error(`newMail with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}

export async function updateReplyMailDB(container: Container, params: Partial<ReplyMailModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<ReplyMailModel>();

  if (!resource) {
    throw new Error(`replyMail with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
