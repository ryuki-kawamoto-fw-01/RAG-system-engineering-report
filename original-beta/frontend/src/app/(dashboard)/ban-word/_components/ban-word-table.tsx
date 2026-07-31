'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import SortDropdown from '@/app/_components/dropdown/sort-dropdown';
import SvgAdd from '@/app/_components/icon/button/Add';
import { Button } from '@/app/_components/ui/button';
import { Checkbox } from '@/app/_components/ui/checkbox';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Pagination } from '@/app/_components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { useAppSelector } from '@/app/_store/hooks';
import { setPageIndex, setReset } from '@/app/_store/slice/pagination';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { deleteBanWords } from '../_actions/deleteBanWords';
import { CATEGORY_ALL, CATEGORY_CONFIDENTIAL, CATEGORY_OPTIONS } from '../_constant';
import { BanWord } from '../_type';
import BanWordForm from './ban-word-form';
import DeleteBanWordButton from './delete-ban-word-button';

type Props = {
  data: BanWord[];
};

export default function BanWordTable({ data }: Props) {
  const { pageIndex } = useAppSelector((state) => state.pagination);
  const dispatch = useDispatch();
  const router = useRouter();
  const [editingBanWord, setEditingBanWord] = useState<BanWord | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    dispatch(setReset());
  }, []);

  const columns: ColumnDef<BanWord>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Label className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-neutral-900/[4%]">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </Label>
      ),
      cell: ({ row }) => (
        <Label className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-neutral-900/[4%]">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </Label>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'banWord',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="禁止ワード"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <div className="line-clamp-3 break-all text-left">{row.getValue('banWord')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'カテゴリー',
      cell: ({ row }) => <div>{row.getValue('category')}</div>,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize: 10,
      },
    },
  });
  // フィルターが変更されたら1ページ目に戻る
  useEffect(() => {
    if (columnFilters.length > 0) {
      table.setPagination({
        ...table.getState().pagination,
        pageIndex: 0,
      });
      dispatch(setPageIndex(0));
    }
  }, [columnFilters, table, dispatch]);

  const columnWidths = ['w-[48px]', 'w-auto', 'w-auto'];

  const handleStartRegister = () => {
    setEditingBanWord({
      id: null,
      banWord: '',
      category: CATEGORY_CONFIDENTIAL,
    });
  };

  const handleFinishEdit = () => {
    setEditingBanWord(null);
    setRowSelection({});
  };

  const handleDelete = async () => {
    const selectionIds = Object.keys(rowSelection).map(Number);
    const selectedBanWords = data.filter((_, index) => selectionIds.includes(index));

    const res = await deleteBanWords(selectedBanWords);

    if (res.success) {
      toast.success(getMessage('I_F_00180', '禁止ワード'));
      setRowSelection({});
    } else {
      toast.error(res.message ?? getMessage('E_F_00430', '禁止ワード'));
    }
    router.refresh();
  };

  const rowsNum = table.getFilteredRowModel().rows.length;
  const totalPages = Math.max(1, Math.ceil(rowsNum / table.getState().pagination.pageSize));

  // ページ変更
  const handlePageChange = (page: number) => {
    table.setPagination({
      ...table.getState().pagination,
      pageIndex: page - 1,
    });

    dispatch(setPageIndex(page - 1));
  };

  return (
    <div className="flex size-full flex-col">
      <div className="flex w-full items-center justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          禁止ワード登録
          <Help
            message={`チャット画面や文書検索画面にて送信できない単語（禁止ワード）を登録する画面です。\n登録することで、暴力的な事象など好ましくない事柄の検索をブロックすることが可能となります。`}
          />
        </Heading>
        <Button variant="secondary" size="sm" onClick={handleStartRegister}>
          <SvgAdd className="size-4 text-secondary-foreground" />
          新規登録
        </Button>
      </div>
      <div className="flex items-center gap-x-1 py-2">
        <div className="space-y-1">
          <Label className="text-sm font-bold">カテゴリー</Label>
          <Select
            value={(table.getColumn('category')?.getFilterValue() as string) ?? CATEGORY_ALL}
            onValueChange={(value) =>
              table.getColumn('category')?.setFilterValue(value.replace(CATEGORY_ALL, ''))
            }
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={CATEGORY_ALL}>{CATEGORY_ALL}</SelectItem>
                {CATEGORY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-1">
          <Label className="text-sm font-bold">キーワード</Label>
          <Input
            placeholder="禁止ワード"
            value={(table.getColumn('banWord')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('banWord')?.setFilterValue(event.target.value)}
          />
        </div>
      </div>
      <div className="mb-1.5 flex items-center gap-x-3">
        <DeleteBanWordButton
          disabled={Object.keys(rowSelection).length === 0}
          handleDeleteBanWord={handleDelete}
        />
        <div className="text-2xs text-neutral-500">
          {table.getFilteredSelectedRowModel().rows.length} / {rowsNum} 選択中
        </div>
      </div>
      <Table>
        <TableHeader className="dark:bg-dark-gray sticky top-0 bg-white">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => (
                <TableHead key={header.id} className={columnWidths[index]}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => setEditingBanWord(row.original)}
              >
                {row.getVisibleCells().map((cell, cellIndex) => (
                  <TableCell
                    key={cell.id}
                    className={cn('cursor-pointer', columnWidths[cellIndex])}
                  >
                    {cellIndex === 0 ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-[calc(100vh-280px)] text-center">
                該当する禁止ワードが見つかりません。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2">
        <Pagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-3"
        />
      </div>

      {/* 登録＆編集フォーム */}
      <BanWordForm banWord={editingBanWord} handleClose={handleFinishEdit} />
    </div>
  );
}
