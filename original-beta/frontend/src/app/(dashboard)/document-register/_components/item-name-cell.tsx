import React from 'react';
import FileDropdownMenu from './file-dropdown-menu';

type Props = {
  icon: React.ElementType;
  name: string;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
};

export default function ItemNameCell({
  icon: Icon,
  name,
  onClick,
  onRename,
  onDelete,
  onDownload,
}: Props) {
  return (
    <div className="flex w-full cursor-pointer items-center" onClick={onClick}>
      <Icon className="mr-2 inline size-6 shrink-0 text-gray-700 dark:text-gray-300" />
      <div className="flex h-6 w-full items-center justify-between gap-2 overflow-hidden p-0">
        <span className="min-w-0 flex-1 truncate text-base">{name}</span>
        <div className="shrink-0">
          <FileDropdownMenu onRename={onRename} onDelete={onDelete} onDownload={onDownload} />
        </div>
      </div>
    </div>
  );
}
