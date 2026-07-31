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
import { cn } from '@/app/_utils/tw-merge';
import { HiyariHatRegisterModel } from '../../../../../config';
import { deleteHiyariHats } from '../_actions/delete_hiyari_hat';
import DeleteHiyariHatButton from './delete-hiyari-hat-button';
import HiyariHatForm from './hiyari-hat-form';

const CATEGORY_ALL = 'all';

type Props = {
  data: HiyariHatRegisterModel[];
  error?: string;
};

function getUniqueCategories(data: HiyariHatRegisterModel[]): string[] {
  const set = new Set<string>();
  data.forEach((item) => {
    if (item.category) set.add(item.category);
  });
  return Array.from(set);
}

export default function HiyariHatTableWrapper({ data, error }: Props) {
  const { pageIndex } = useAppSelector((state) => state.pagination);
  const dispatch = useDispatch();
  const router = useRouter();
  const [editingHiyariHat, setEditingHiyariHat] = useState<HiyariHatRegisterModel | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    dispatch(setReset());
    // データ取得エラーがある場合はトースト表示
    if (error) {
      toast.error(error);
    }
  }, [dispatch, error]);

  // カテゴリー一覧をデータから動的取得
  const categories = getUniqueCategories(data);
  const categoryOptions = [
    { value: CATEGORY_ALL, label: 'すべて' },
    ...categories.map((category) => ({
      value: category,
      label: category,
    })),
  ];

  const columns: ColumnDef<HiyariHatRegisterModel>[] = [
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
      accessorKey: 'category',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="カテゴリー"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => <div>{row.getValue('category')}</div>,
    },
    {
      accessorKey: 'incident',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="ヒヤリハット事例"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate whitespace-pre-wrap">{row.getValue('incident')}</div>
      ),
    },
    {
      accessorKey: 'counterMeasure',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="対策"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate whitespace-pre-wrap">
          {row.getValue('counterMeasure')}
        </div>
      ),
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

  const columnWidths = ['w-[48px]', 'w-[150px]', 'w-[300px]', 'w-[300px]'];

  const handleStartRegister = () => {
    const emptyHiyariHat: HiyariHatRegisterModel = {
      id: '',
      category: '',
      incident: '',
      counterMeasure: '',
      isDeleted: undefined,
    };
    setEditingHiyariHat(emptyHiyariHat);
  };

  const handleFinishEdit = () => {
    setEditingHiyariHat(null);
  };

  const handleDelete = async () => {
    try {
      const selectionIds = Object.keys(rowSelection).map(Number);
      const selectedHiyariHats = data.filter((_, index) => selectionIds.includes(index));

      if (selectedHiyariHats.length === 0) {
        toast.error('削除対象が選択されていません');
        return;
      }

      const missingIds = selectedHiyariHats.filter(
        (item) => !item.id || item.id === '' || item.id === null || item.id === undefined
      );
      if (missingIds.length > 0) {
        toast.error(`IDが不正な行が${missingIds.length}件含まれています`);
        return;
      }

      const res = await deleteHiyariHats(selectedHiyariHats);

      if (res.success) {
        toast.success(res.message || 'ヒヤリハット登録データを削除しました');
        setRowSelection({});
      } else {
        // エラーメッセージを詳細に表示（改行を含む）
        const errorMsg = res.message ?? 'ヒヤリハット登録データの削除に失敗しました';
        console.error('削除エラー詳細:', res);

        // 長いエラーメッセージの場合は見やすく整形
        const formattedError =
          errorMsg.length > 150 ? errorMsg.split('. ').join('.\n\n') : errorMsg;

        toast.error(formattedError, {
          duration: 20000,
          style: {
            whiteSpace: 'pre-line',
            maxWidth: '700px',
            fontSize: '11px',
            lineHeight: '1.4',
          },
        });
      }
    } catch (error) {
      console.error('削除処理例外:', error);

      // クライアントサイドエラーの詳細情報
      const clientErrorInfo =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack?.substring(0, 400),
            }
          : { message: String(error) };

      const errorMsg = `削除処理中に例外発生:\n${JSON.stringify(clientErrorInfo, null, 2)}`;

      toast.error(errorMsg, {
        duration: 20000,
        style: {
          whiteSpace: 'pre-line',
          maxWidth: '700px',
          fontSize: '11px',
          lineHeight: '1.4',
        },
      });
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
          ヒヤリハット登録
          <Help
            message={`ヒヤリハット事例と対策を登録・管理する画面です。\n登録された情報はヒヤリハット検索で活用されます。`}
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
              table.getColumn('category')?.setFilterValue(value === CATEGORY_ALL ? '' : value)
            }
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-1">
          <Label className="text-sm font-bold">キーワード</Label>
          <Input
            placeholder="ヒヤリハット事例・対策"
            value={(table.getColumn('incident')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('incident')?.setFilterValue(event.target.value)}
          />
        </div>
      </div>

      <div className="mb-1.5 flex items-center gap-x-3">
        <DeleteHiyariHatButton
          disabled={Object.keys(rowSelection).length === 0}
          handleDeleteHiyariHat={handleDelete}
        />
        <div className="text-2xs text-neutral-500">
          {table.getFilteredSelectedRowModel().rows.length} / {rowsNum} 選択中
        </div>
      </div>

      <Table>
        <TableHeader className="dark:bg-dark-gray sticky top-0 bg-white">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => (
                <TableHead key={header.id} className={columnWidths[headerIndex]}>
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
                className={columnWidths[0]}
              >
                {row.getVisibleCells().map((cell, cellIndex) => (
                  <TableCell
                    key={cell.id}
                    onClick={() => {
                      if (cell.column.id === 'select') {
                        return;
                      }
                      setEditingHiyariHat(cell.row.original);
                    }}
                    className={cn(
                      'cursor-pointer',
                      cell.column.id === 'select' && 'cursor-default',
                      columnWidths[cellIndex]
                    )}
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
                該当するヒヤリハット登録が見つかりません。
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
      <HiyariHatForm hiyariHat={editingHiyariHat} handleClose={handleFinishEdit} />
    </div>
  );
}
