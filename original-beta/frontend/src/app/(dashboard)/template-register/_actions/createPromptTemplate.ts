'use server';

import { z } from 'zod';
import { PromptTemplateErrors } from '@/app/_types/prompt-template';
import { Result } from '@/app/_types/result';
import { templateContainer } from '../../../../../cosmos';
import { PromptTemplateSchema } from '../_utils/schema';

type Response = Result<PromptTemplateErrors>;

export async function createPromptTemplate(
  data: z.infer<typeof PromptTemplateSchema>
): Promise<Response> {
  try {
    await templateContainer.items.create(data);

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}
