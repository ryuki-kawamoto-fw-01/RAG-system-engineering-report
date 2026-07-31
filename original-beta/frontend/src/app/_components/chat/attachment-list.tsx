import { FileList } from '@/app/(dashboard)/chat/[id]/_components/chat-utils';
import { formatFileSize } from '@/app/_utils/file';
import { cn } from '@/app/_utils/tw-merge';
import SvgClose from '../icon/button/Close';
import SvgTextFile from '../icon/button/TextFile';
import { Button } from '../ui/button';

type Props = {
  files: FileList;
  handleDelete: () => void;
  className?: string;
};

export default function AttachmentList({ files, handleDelete, className }: Props) {
  return (
    <div className={cn('flex gap-x-3 overflow-x-auto', className)}>
      {files.map(({ file, url }) => (
        <div
          key={file.name}
          className="flex h-12 w-[200px] flex-none items-center gap-x-1.5 rounded-lg border border-slate-200 bg-white px-1.5"
        >
          {file && file.type.startsWith('image/') ? (
            <img
              src={url}
              alt={`チャット添付画像(${file.name})`}
              className="size-9 rounded object-contain"
            />
          ) : (
            <div className="size-9 rounded bg-sky-100">
              <SvgTextFile />
            </div>
          )}
          <div className="flex flex-1 flex-col text-2xs">
            <div className="flex items-center justify-between gap-x-1">
              <span className="line-clamp-1 flex-1">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="size-4 shrink-0"
              >
                <SvgClose />
              </Button>
            </div>
            <span className="text-neutral-500">{formatFileSize(file.size)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
