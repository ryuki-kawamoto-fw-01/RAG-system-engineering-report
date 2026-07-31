import { notFound } from 'next/navigation';
import { getPromptTemplates } from '@/app/(dashboard)/chat/[id]/_actions/getPromptTemplates';
import { getBanWords } from '@/app/(dashboard)/rag-chat/_actions/getBanWord';
import { TEMPLATE_PAGE_TYPE } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getChatThread } from './_actions/getChatThread';
import ChatThread from './_components/chat';
import { buildMessages } from './_utils';

export default async function Page({ params }: { params: { id: string } }) {
  const thread = await getChatThread(params.id);

  if (!thread) {
    notFound();
  }

  // チャットメッセージが0件の場合、テンプレートは取得しない
  let templates: PromptTemplate[] = [];
  if (thread.messages.length === 0) {
    templates = await getPromptTemplates(TEMPLATE_PAGE_TYPE.RAG);
  }

  // 禁止ワードを取得
  const { banWords } = await getBanWords();

  return (
    <ChatThread
      id={thread.id}
      initialMessages={buildMessages(thread.messages)}
      threadId={thread.id}
      templates={templates}
      banWords={banWords}
    />
  );
}
