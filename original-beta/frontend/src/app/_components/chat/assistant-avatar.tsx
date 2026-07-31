import { cn } from '@/app/_utils/tw-merge';
import { assistantName } from '../../../../config';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type Props = {
  className?: string;
};

export default function AssistantAvatar({ className = '' }: Props) {
  return (
    <Avatar className={cn('size-8 bg-slate-200 font-bold', className)}>
      <AvatarImage src="/images/assistant.png" alt="アシスタントアイコン" />
      <AvatarFallback>{assistantName.at(0)}</AvatarFallback>
    </Avatar>
  );
}
