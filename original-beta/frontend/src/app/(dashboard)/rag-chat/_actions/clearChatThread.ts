'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { ChatThreadModel, ChatMessageModel } from '../../../../../config';
import { ragThreadContainer, ragMessageContainer } from '../../../../../cosmos';

type Response = Result;

export default async function clearChatThread(id: string): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resource: thread } = await ragThreadContainer.item(id, user.id).read<ChatThreadModel>();

    if (!thread) {
      return {
        success: false,
        message: getMessage('E_F_00010', '問い合わせ', '問い合わせ'),
      };
    }

    if (thread.deletedAt !== undefined) {
      return {
        success: false,
        message: getMessage('E_F_00020', '問い合わせ', '問い合わせ'),
      };
    }

    // スレッドの論理削除
    const deletedAt = new Date();

    await ragThreadContainer.items.upsert({
      ...thread,
      deletedAt,
    });

    // ragMessageContainerの該当スレッドの全メッセージも論理削除
    const query = {
      query: 'SELECT * FROM c WHERE c.threadId = @threadId',
      parameters: [{ name: '@threadId', value: id }],
    };
    const { resources: messages } = await ragMessageContainer.items
      .query<ChatMessageModel>(query)
      .fetchAll();
    for (const message of messages) {
      await ragMessageContainer.items.upsert({
        ...message,
        deletedAt,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  } finally {
    // ページのリロードを行う
    revalidatePath('/rag-chat');
  }
}
