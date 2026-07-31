'use client';

import SvgBulb from '@/app/_components/icon/decorative/Bulb';
import SvgCaution from '@/app/_components/icon/decorative/Caution';
import SvgDocument from '@/app/_components/icon/decorative/Document';
import SvgGraph from '@/app/_components/icon/decorative/Graph';
import SvgPencil from '@/app/_components/icon/decorative/Pencil';
import SvgScale from '@/app/_components/icon/decorative/Scale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { cn } from '@/app/_utils/tw-merge';
import SvgCode from '../icon/decorative/Code';

type Props = {
  templates: PromptTemplate[];
  className?: string;
  handleTextUpdate: (text: string, id: string) => void;
};

export default function ChatTemplates({ templates, className = '', handleTextUpdate }: Props) {
  return (
    <div className={cn('flex gap-3 flex-wrap justify-center sm:justify-start', className)}>
      {templates.map((template) => (
        <ChatTemplateItem key={template.id} template={template} onClick={handleTextUpdate} />
      ))}
    </div>
  );
}

type ChatTemplateItemProps = {
  template: PromptTemplate;
  onClick: (text: string, id: string) => void;
};

function ChatTemplateItem({ template, onClick }: ChatTemplateItemProps) {
  const handleClick = () => {
    onClick(template.content, template.id!);
  };

  return (
    <Card
      className="h-[110px] w-full max-w-[230px] cursor-pointer rounded-lg border border-neutral-100 bg-white px-4 py-3 shadow-none transition-all duration-300 hover:bg-neutral-50 sm:max-w-[calc((100%-12px)/2)] md:max-w-[calc((100%-24px)/2)]"
      onClick={handleClick}
    >
      <CardHeader className="p-0">
        <CardTitle className="flex h-[42px] items-center gap-x-2.5 text-base font-bold">
          <TemplateIcon name={template.icon ?? ''} className="shrink-0" />
          <span className="truncate">{template.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-1 p-0">
        <CardDescription className="line-clamp-2 text-xs font-normal text-neutral-500">
          {template.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

type TemplateIconProps = {
  name: string;
  className?: string;
};
function TemplateIcon({ name, className }: TemplateIconProps) {
  const IconComp = (() => {
    switch (name) {
      case 'pencil':
        return SvgPencil;
      case 'bulb':
        return SvgBulb;
      case 'graph':
        return SvgGraph;
      case 'code':
        return SvgCode;
      case 'caution':
        return SvgCaution;
      case 'scale':
        return SvgScale;
      default:
        return SvgDocument;
    }
  })();

  return <IconComp className={cn('size-8', className)} />;
}
