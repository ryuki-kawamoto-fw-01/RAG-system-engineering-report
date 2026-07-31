'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  templates: PromptTemplate[];
  className?: string;
  handleTextUpdate: (text: string) => void;
};

export default function ChatTemplates({ templates, className = '', handleTextUpdate }: Props) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2', className)}>
      {templates.map((template) => (
        <ChatTemplateItem key={template.id} template={template} onClick={handleTextUpdate} />
      ))}
    </div>
  );
}

type ChatTemplateItemProps = {
  template: PromptTemplate;
  onClick: (text: string) => void;
};

function ChatTemplateItem({ template, onClick }: ChatTemplateItemProps) {
  const handleClick = () => {
    onClick(template.content);
  };

  return (
    <Card
      className="cursor-pointer rounded-md border transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
          {template.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-400">{template.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
