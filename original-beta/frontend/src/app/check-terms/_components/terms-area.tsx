import { ScrollArea } from '@radix-ui/react-scroll-area';
import Markdown from '@/app/_components/ui/markdown';
import { TERMS } from '@/app/_constants/terms';

function TermsArea() {
  return (
    <ScrollArea className="mb-3 h-3/5 w-1/2 overflow-auto rounded-[20px] border bg-neutral-0 px-[30px] py-5">
      <Markdown>{TERMS}</Markdown>
    </ScrollArea>
  );
}
export default TermsArea;
