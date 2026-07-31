import { Delete, Download, Edit, Ellipsis } from '@/app/_components/icon/button';
import { Button } from '@/app/_components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';

type FileDropdownMenuProps = {
  onRename?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
};

export default function FileDropdownMenu({
  onRename,
  onDownload,
  onDelete,
}: FileDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="icon" size="icon">
          <Ellipsis className="size-4 text-gray-700 dark:text-gray-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* 名前を変更 */}
        {onRename && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="h-9 cursor-pointer items-center justify-start pl-1 hover:rounded-xl hover:bg-slate-50"
          >
            <Edit className="mr-1 size-4" />
            名前を変更
          </DropdownMenuItem>
        )}

        {/* ダウンロード */}
        {onDownload && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <Download className="mr-1 size-4" />
            ダウンロード
          </DropdownMenuItem>
        )}

        {/* Divider */}
        {(onRename || onDownload) && onDelete && (
          <div className="my-1 h-px bg-gray-200 dark:bg-gray-600" />
        )}

        {/* 削除 */}
        {onDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Delete className="mr-1 size-4" />
            削除
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
