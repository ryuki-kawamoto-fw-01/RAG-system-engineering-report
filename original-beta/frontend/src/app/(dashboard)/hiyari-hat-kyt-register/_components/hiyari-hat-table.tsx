'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { cn } from '@/app/_utils/tw-merge';
import { HiyariHatRegisterModel } from '../../../../../config';
import DeleteHiyariHatDialogButton from './delete-hiyari-hat-dialog-button';

type Props = {
  data: HiyariHatRegisterModel[];
  onEdit: (item: HiyariHatRegisterModel) => void;
  onDelete: (items: HiyariHatRegisterModel[]) => void;
};

export default function HiyariHatTable({ data, onEdit, onDelete }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item.id)));
    }
  };

  //const handleDeleteSelected = () => {
  //  setDeleteDialogOpen(true);
  //};

  const handleConfirmDelete = () => {
    const selectedItems = data.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length > 0) {
      onDelete(selectedItems);
      setSelectedIds(new Set());
    }
    // setDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 flex items-center gap-2">
        <DeleteHiyariHatDialogButton
          handleDeleteHiyariHat={handleConfirmDelete}
          disabled={selectedIds.size === 0}
        />
        <span className="text-xs text-neutral-500">
          {selectedIds.size} / {data.length} 選択中
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={selectedIds.size === data.length && data.length > 0}
                onChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>カテゴリー</TableHead>
            <TableHead>ヒヤリハット事例</TableHead>
            <TableHead>対策</TableHead>
            {/* 操作列は表示しない */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow
                key={item.id}
                className={cn('cursor-pointer')}
                onClick={(e) => {
                  // チェックボックス経由や1列目（チェックボックスセル）クリックは無視
                  const target = e.target as HTMLElement;
                  // 1列目（チェックボックスセル）かinputの場合は無視
                  const cell = (e.target as HTMLElement).closest('td');
                  if (
                    target.tagName === 'INPUT' ||
                    (cell && (cell as HTMLTableCellElement).cellIndex === 0)
                  ) {
                    return;
                  }
                  onEdit(item);
                }}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => {
                      e.stopPropagation(); // 行クリックを発火させない
                      handleSelect(item.id);
                    }}
                  />
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.incident}</TableCell>
                <TableCell>{item.counterMeasure}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-4 text-center text-sm text-neutral-500">
                データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
