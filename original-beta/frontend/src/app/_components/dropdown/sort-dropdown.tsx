// 昇降順のドロップダウンメニュー
import { SortDirection } from '@tanstack/react-table';
import SvgArrowDown from '../icon/button/ArrowDown';
import SvgArrowUp from '../icon/button/ArrowUp';
import SvgSort from '../icon/button/Sort';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

type SortDropdownProps = {
  label: string;
  sortStatus: false | SortDirection;
  handleUp: () => void;
  handleDown: () => void;
};

export default function SortDropdown({
  label,
  sortStatus,
  handleUp,
  handleDown,
}: SortDropdownProps) {
  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="group flex size-auto items-center">
            <span className="mr-1">{label}</span>
            {sortStatus === 'asc' ? (
              <SvgArrowUp className="size-4" />
            ) : sortStatus === 'desc' ? (
              <SvgArrowDown className="size-4" />
            ) : (
              <SvgSort className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-xl bg-white p-1.5 shadow-focus">
          <DropdownMenuItem
            onClick={() => handleUp()}
            className="h-9 cursor-pointer items-center justify-start pl-1 hover:rounded-xl hover:bg-slate-50"
          >
            <SvgArrowUp className="mr-1 size-4" />
            昇順
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDown()}
            className="h-9 cursor-pointer items-center justify-start pl-1 hover:rounded-xl hover:bg-slate-50"
          >
            <SvgArrowDown className="mr-1 size-4" />
            降順
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
