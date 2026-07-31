import Link from 'next/link';
import { MouseEvent } from 'react';
import { Thread } from '@/app/(dashboard)/voice-input/_utils/schema';
import SvgDelete from '@/app/_components/icon/button/Delete';
import SvgEllipsis from '@/app/_components/icon/button/Ellipsis';
import { Button } from '@/app/_components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { formatDate } from '@/app/_utils/date';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  threads: Thread[];
  basePath?: string;
  deleteThread: (id: string) => void;
  className?: string;
};

export default function VoiceThreadList({ threads, deleteThread, className }: Props) {
  const handleDeleteClick = (event: MouseEvent, id: string) => {
    event.stopPropagation();

    deleteThread(id);
  };

  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      {threads.length > 0 && (
        <div>
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/voice-input/${thread.id}`}
              className="flex w-full items-center gap-x-1 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
            >
              <div className="flex-1 truncate">
                <p className="truncate text-3xs text-neutral-400">
                  {formatDate(new Date(thread.updatedAt), 'YYYY/MM/DD HH:mm')}
                </p>
                <span className="flex-1 truncate text-sm">{thread.title}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="icon"
                    size="icon-sm"
                    className="shrink-0  hover:bg-inherit focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <SvgEllipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem>
                    <div
                      onClick={(e) => handleDeleteClick(e, thread.id)}
                      className="flex items-center gap-x-1"
                    >
                      <SvgDelete className="size-4" />
                      <span>削除</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
