import { useEffect, useRef } from 'react';
import SvgClose from '@/app/_components/icon/button/Close';
import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // referenceSource: string;
}

// type Reference = {
//   title: string;
//   url: string;
//   snippet: string;
// };

export default function ReferencesSlidePanel({ isOpen, onClose }: Props): JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // web search使用箇所をコメントアウト

  // const parseReferences = (source: string): Reference[] => {
  //   const references: Reference[] = [];
  //   const entries = source.split('title:');

  //   entries.forEach((entry) => {
  //     if (!entry.trim()) return;

  //     const urlMatch = entry.match(/url:\s*(.*?)\s*snippet:/);
  //     const snippetMatch = entry.match(/snippet:\s*(.*?)(?=\s*title:|$)/);
  //     const titleMatch = entry.match(/^(.*?)(?=\s*url:)/);

  //     if (urlMatch && snippetMatch && titleMatch) {
  //       references.push({
  //         title: titleMatch[1].trim(),
  //         url: urlMatch[1].trim(),
  //         snippet: snippetMatch[1].trim().replace(/<\/?b>/g, ''),
  //       });
  //     }
  //   });
  // const references = parseReferences(referenceSource);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-[400px] bg-white shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      ref={panelRef}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <Heading level={5}>情報元</Heading>

          <Button
            type="button"
            variant="icon"
            size="sm"
            className="cursor-pointer"
            onClick={onClose}
          >
            <SvgClose className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="whitespace-pre-wrap text-base">現在、最新情報は取得できません。</div>
          {/* {references.map((reference, index) => (
            <div key={index} className="space-y-1">
              <Link
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                ・{reference.title}
              </Link>
              <p className="pl-3 text-base text-gray-600">{reference.snippet}</p>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
}
