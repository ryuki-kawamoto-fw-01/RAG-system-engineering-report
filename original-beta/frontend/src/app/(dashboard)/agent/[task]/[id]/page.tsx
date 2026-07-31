import { notFound } from 'next/navigation';
import { getBanWords } from '@/app/_actions/chat/getBanWord';
import { getPromptTemplates } from '@/app/_actions/chat/getPromptTemplates';
import { TEMPLATE_PAGE_TYPE } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { buildMessages } from '@/app/_utils/build-messages';
import { getChatThread } from './_actions/getChatThread';
import ChatThread from './_components/chat';

export default async function Page({ params }: { params: { id: string } }) {
  const thread = await getChatThread(params.id);
  const containerName = process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME;
  if (!containerName) {
    throw new Error('Container name is not defined');
  }

  if (!thread) {
    notFound();
  }

  // タスクメッセージが0件の場合、テンプレートは取得しない
  let templates: PromptTemplate[] = [];
  if (thread.messages.length === 0) {
    templates = await getPromptTemplates(TEMPLATE_PAGE_TYPE.AGENT);
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
      defaultAgentSteps={thread.thread.agentSteps}
      containerName={containerName}
    />
  );
}
