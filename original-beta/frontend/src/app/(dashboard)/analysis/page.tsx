import PageLayout from '@/app/_components/layout/page-layout';
import ChatThread from './_components/chat';

export default function Page() {
  return (
    <PageLayout className="relative pb-1 pt-1.5">
      <ChatThread />
    </PageLayout>
  );
}
