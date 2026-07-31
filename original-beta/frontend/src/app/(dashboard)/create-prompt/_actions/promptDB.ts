'use server';

import { createPromptDB, updatePromptDB } from '@/app/_db/create-prompt';
import { getCurrentUser } from '@/app/_utils/auth';
import { CreatePromptModel } from '../../../../../config';
import { promptContainer } from '../../../../../cosmos';

type CreatePrompt = CreatePromptModel;

export async function createPrompt(data: CreatePrompt) {
  const user = await getCurrentUser();

  await createPromptDB(promptContainer, {
    ...data,
    userId: user.id,
  });
}

export async function updatePrompt(data: Partial<CreatePrompt>) {
  const user = await getCurrentUser();

  await updatePromptDB(promptContainer, {
    ...data,
    userId: user.id,
  });
}
