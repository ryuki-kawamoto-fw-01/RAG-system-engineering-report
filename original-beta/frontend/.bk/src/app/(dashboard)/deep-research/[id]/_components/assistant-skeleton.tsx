import { Skeleton } from '@/app/_components/ui/skeleton';

export default function AssistantSkeleton() {
  return (
    <div className="flex items-start space-x-4">
      <Skeleton className="bg-assistant-light size-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="bg-assistant-light h-4 w-[200px]" />
        <Skeleton className="bg-assistant-light h-[100px] w-[400px] rounded-xl" />
        <div className="text-xs text-gray-400">回答の生成には数十秒かかる場合がございます</div>
      </div>
    </div>
  );
}
