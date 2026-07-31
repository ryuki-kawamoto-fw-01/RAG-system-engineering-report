import { getBanWords } from '@/app/(dashboard)/chat/_actions/getBanWord';
import PageLayout from '@/app/_components/layout/page-layout';
import { TEMPLATE_PAGE_TYPE } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getChatThread } from './_actions/getChatThread';
import { getPromptTemplates } from './_actions/getPromptTemplates';
import ChatThread from './_components/chat';

export default async function Page({ params }: { params: { id: string } }) {
  const thread = await getChatThread(params.id);

  // チャットメッセージが0件の場合、テンプレートは取得しない
  let templates: PromptTemplate[] = [];
  if (thread.messages.length === 0) {
    templates = await getPromptTemplates(TEMPLATE_PAGE_TYPE.CHAT);
  }

  // 禁止ワードを取得
  const { banWords } = await getBanWords();

  return (
    <PageLayout className="relative pb-1 pt-1.5">
      <ChatThread
        id={thread.id}
        initialMessages={thread.messages}
        threadId={thread.id}
        templates={templates}
        banWords={banWords}
      />
    </PageLayout>
  );
}
