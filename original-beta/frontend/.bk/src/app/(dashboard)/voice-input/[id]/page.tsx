import { MessageRole } from 'rt-client';
import PageLayout from '@/app/_components/layout/page-layout';
import { getCurrentUser } from '@/app/_utils/auth';
import { getChatThread } from './_actions/getChatThread';
import ChatPageClientBoundary from './_components/chat-page-client-boundary';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  // チャット履歴の読み込み
  const thread = await getChatThread(params.id);

  const initialMessages = thread.messages.map((msg) => ({
    id: msg.id,
    threadId: msg.threadId,
    userId: msg.userId,
    role: msg.role as MessageRole,
    content: msg.content,
    chatHistory: msg.chatHistory,
    createdAt: msg.createdAt,
    feedbackAt: msg.feedbackAt,
  }));

  return (
    <PageLayout className="relative pb-1 pt-1.5">
      <ChatPageClientBoundary
        userId={user.id}
        threadId={thread.id}
        initialMessages={initialMessages}
      />
    </PageLayout>
  );
}
