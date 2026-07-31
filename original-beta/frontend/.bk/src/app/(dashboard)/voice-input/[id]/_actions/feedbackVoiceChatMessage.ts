'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { voiceMessageContainer } from '../../../../../../cosmos';
import { Message } from '../../_utils/schema';

type Response = Result;

export default async function feedbackVoiceChatMessage(
  id: string,
  feedbackType: 0 | 1,
  feedbackOptions: string[],
  feedbackText: string
): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resource: message } = await voiceMessageContainer.item(id, user.id).read<Message>();
    const ftype = feedbackType;
    // feedbackOptionsにXXXが含まれている場合、変数foption1に1を代入
    let foption1 = 0;
    let foption2 = 0;
    let foption3 = 0;
    let foption4 = 0;
    let foption5 = 0;
    let foption6 = 0;

    if (feedbackOptions.includes('1')) {
      foption1 = 1;
    }
    if (feedbackOptions.includes('2')) {
      foption2 = 1;
    }
    if (feedbackOptions.includes('3')) {
      foption3 = 1;
    }
    if (feedbackOptions.includes('4')) {
      foption4 = 1;
    }
    if (feedbackOptions.includes('5')) {
      foption5 = 1;
    }
    if (feedbackOptions.includes('6')) {
      foption6 = 1;
    }

    const ftext = feedbackText;

    if (!message) {
      throw new Error(`Message with id ${id} not found`);
    }

    if (message.feedbackType !== undefined) {
      throw new Error(`Message with id ${id} is already fed back`);
    }

    await voiceMessageContainer.items.upsert({
      ...message,
      feedbackType: ftype,
      feedbackOption1: foption1,
      feedbackOption2: foption2,
      feedbackOption3: foption3,
      feedbackOption4: foption4,
      feedbackOption5: foption5,
      feedbackOption6: foption6,
      feedbackText: ftext,
      feedbackAt: new Date(),
    });

    revalidatePath('/voice-input');

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
