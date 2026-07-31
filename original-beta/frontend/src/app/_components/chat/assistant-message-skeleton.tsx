import { Skeleton } from '@/app/_components/ui/skeleton';
import AssistantAvatar from './assistant-avatar';

export default function AssistantMessageSkeleton() {
  return (
    <div className="flex gap-x-2">
      <AssistantAvatar />
      <div className="w-full max-w-screen-sm space-y-2 rounded-xl bg-white px-5 py-3">
        <Skeleton className="h-2 bg-neutral-100" />
        <Skeleton className="h-2 bg-neutral-100" />
        <Skeleton className="h-2 w-28 bg-neutral-100" />
      </div>
    </div>
  );
}
