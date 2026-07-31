import { TEMPLATE_PAGE_TYPE } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getCurrentUser } from '@/app/_utils/auth';
import { getBanWords } from '../_actions/getBanWord';
import { getChatThread } from './_actions/getChatThread';
import { getPromptTemplates } from './_actions/getPromptTemplates';
import ChatThread from './_components/chat';

export default async function Page({ params }: { params: { id: string } }) {
  const thread = await getChatThread(params.id);
  const user = await getCurrentUser();

  // チャットメッセージが0件の場合、テンプレートは取得しない
  let templates: PromptTemplate[] = [];
  if (thread.messages.length === 0) {
    templates = await getPromptTemplates(TEMPLATE_PAGE_TYPE.CHAT);
  }

  // 禁止ワードを取得
  const { banWords } = await getBanWords();

  return (
    <ChatThread
      id={thread.id}
      initialMessages={thread.messages}
      userId={user.id}
      userName={user.name}
      threadId={thread.id}
      templates={templates}
      banWords={banWords}
    />
  );
}
