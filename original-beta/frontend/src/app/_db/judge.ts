'use server';
import { Container } from '@azure/cosmos';
import { JudgeModel } from '../../../config';
import { getCurrentUser } from '../_utils/auth';

export async function judgeIdeaDB(container: Container, params: Partial<JudgeModel>) {
  const { resource: judge } = await container.items.create(params);
  return judge;
}

export async function updateJudgeIdeaDB(container: Container, params: Partial<JudgeModel>) {
  const user = await getCurrentUser();

  const { resource } = await container.item(params.id!, user.id).read<JudgeModel>();

  if (!resource) {
    throw new Error(`Judge with id ${params.id} not found`);
  }

  await container.items.upsert({
    ...resource,
    ...params,
  });

  return resource;
}
