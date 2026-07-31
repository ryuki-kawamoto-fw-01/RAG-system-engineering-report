import { ScrollArea } from '@radix-ui/react-scroll-area';
import PageLayout from '@/app/_components/layout/page-layout';
import Markdown from '@/app/_components/ui/markdown';
import { TERMS } from '@/app/_constants/terms';
function TermsOfServicePage() {
  return (
    <PageLayout className="flex items-center justify-center px-[60px] py-10">
      <ScrollArea className="h-full max-w-[1006px] overflow-auto rounded-[20px] bg-neutral-0 px-10 py-8">
        <label className="mb-4 text-3xl font-bold">利用規約</label>
        <Markdown>{TERMS}</Markdown>
      </ScrollArea>
    </PageLayout>
  );
}
export default TermsOfServicePage;
