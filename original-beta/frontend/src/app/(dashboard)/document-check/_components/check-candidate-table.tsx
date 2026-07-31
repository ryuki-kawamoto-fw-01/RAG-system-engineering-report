import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  // getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import Markdown from '@/app/_components/ui/markdown';
import { Button } from '../../../_components/ui/button';
import { Checkbox } from '../../../_components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../_components/ui/table';
import { CheckCad } from '../../../_types/check-candidate';
import { CheckList } from '../../../_types/check-list';
import { addCheckLists } from '../_actions/add-check-list';

type Props = {
  data: CheckCad[];
  existingCheckList: CheckList[];
  fetchContent: (checkList: CheckList[]) => void;
};

export const columns: ColumnDef<CheckCad>[] = [
  {
    accessorKey: 'checkDtls',
    header: 'チェック内容',
    cell: ({ row }) => <Markdown>{row.getValue('checkDtls')}</Markdown>,
  },
  {
    accessorKey: 'checkAddFlg',
    header: 'チェック追加',
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: 'source',
    header: '引用元',
    cell: ({ row }) => <div>{row.getValue('source')}</div>,
  },
];
export function CheckCadTable({ data, existingCheckList, fetchContent }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    srNo: true,
    correctFlg: true,
    content: true,
    pageParagraph: true,
    correspondingSpec: true,
    source: true,
  });
  const [rowSelection, setRowSelection] = React.useState({});

  const tables = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const addCheckList = async () => {
    // 選択された行のインデックスを取得
    const selectionIds = Object.keys(rowSelection).map(Number);

    // 選択されたデータのIDを取得
    const selectedCheckListIds = data
      .filter((_, index) => selectionIds.includes(index)) // 選択されたデータのみ
      .map((checklist) => checklist.id!);

    // 既存のチェックリストがない場合
    if (existingCheckList.length === 0) {
      const newCheckList = await addCheckLists(data, selectedCheckListIds);
      console.log('チェックリスト：' + newCheckList);
      fetchContent(newCheckList);
    } else {
      const existingCheckDtls = existingCheckList.map((item) => item.checkDtls);
      const uniqueData = data.filter((item) => !existingCheckDtls.includes(item.checkDtls));

      if (uniqueData.length !== 0) {
        // uniqueDataに基づいて選択されたデータのIDを取得
        const selectedUniqueCheckListIds = uniqueData
          .filter((item) => selectionIds.includes(data.indexOf(item))) // dataのインデックスを使用
          .map((checklist) => checklist.id!);

        const uniqueCheckList = await addCheckLists(data, selectedUniqueCheckListIds);
        const newCheckList = existingCheckList.concat(uniqueCheckList);
        console.log('チェックリスト：' + newCheckList);
        fetchContent(newCheckList);
      } else {
        console.log('全てのチェック候補が既存のチェックリストに含まれているため、追加できません。');
      }
    }
    setRowSelection({}); // 選択状態をリセット
  };

  return (
    <div className="w-full">
      <div>
        ■チェック候補一覧
        <Button
          className="mb-2 ml-2"
          variant="outline"
          size="sm"
          disabled={Object.keys(rowSelection).length === 0}
          onClick={addCheckList}
        >
          チェック一覧に追加
        </Button>
      </div>
      <div className="rounded-md border">
        <Table id="checkCadTable">
          <TableHeader>
            {tables.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {tables.getRowModel().rows?.length ? (
              tables.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getAllCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width:
                          index === 0
                            ? '600px'
                            : index === 1
                              ? '60px'
                              : index === 2
                                ? '100px'
                                : 'auto',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
