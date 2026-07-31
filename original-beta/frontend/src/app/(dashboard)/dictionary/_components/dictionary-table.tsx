'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
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
import { deleteDictionaries } from '../_actions/deleteDictionaries';
import { CATEGORY_DEPARTMENT, CATEGORY_OPTIONS } from '../_constant';
import { Dictionary, SearchFieldFilter } from '../_type';
import DeleteDictionaryDialogButton from './delete-dictionary-dialog-button';
import DictionaryForm from './dictionary-form';

type Props = {
  data: Dictionary[];
};

export default function DictionaryTable({ data }: Props) {
  const { pageIndex } = useAppSelector((state) => state.pagination);
  const dispatch = useDispatch();
  const router = useRouter();
  const [editingDictionary, setEditingDictionary] = useState<Dictionary | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // キーワード検索
  const [searchFilter, setSearchFilter] = useState<SearchFieldFilter>({
    text: '',
    fields: {
      uniform_name: false,
      terms: false,
      description: false,
    },
  });

  useEffect(() => {
    dispatch(setReset());
  }, []);

  const columns: ColumnDef<Dictionary>[] = [
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
      accessorKey: 'uniform_name',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="統一名称"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => (
        <div className="line-clamp-3 break-all text-left">{row.getValue('uniform_name')}</div>
      ),
    },
    {
      accessorKey: 'terms',
      header: ({ column }) => {
        const sortStatus = column.getIsSorted();
        return (
          <SortDropdown
            label="通称"
            sortStatus={sortStatus}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => <div className="line-clamp-3 break-all">{row.getValue('terms')}</div>,
    },
    {
      accessorKey: 'category',
      header: 'カテゴリー',
      cell: ({ row }) => <div>{row.getValue('category')}</div>,
    },
    {
      accessorKey: 'description',
      header: '説明',
      cell: ({ row }) => <div className="line-clamp-3">{row.getValue('description')}</div>,
    },
  ];

  // 複数フィールドに対して検索
  const globalFilterFn = useCallback(
    (row: Row<Dictionary>, columnId: string, filterValue: SearchFieldFilter) => {
      const { text, fields } = filterValue;
      const searchValue = String(text).toLowerCase();

      if (!searchValue) return true;

      // 検索対象のフィールド
      if (
        fields.uniform_name &&
        String(row.original.uniform_name).toLowerCase().includes(searchValue)
      ) {
        return true;
      }
      if (fields.terms && String(row.original.terms).toLowerCase().includes(searchValue)) {
        return true;
      }
      if (
        fields.description &&
        String(row.original.description).toLowerCase().includes(searchValue)
      ) {
        return true;
      }

      return false;
    },
    []
  );

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
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter: searchFilter,
      pagination: {
        pageIndex,
        pageSize: 10,
      },
    },
  });
  // フィルターが変更されたら1ページ目に戻る
  useEffect(() => {
    if (columnFilters.length > 0 || searchFilter.text) {
      table.setPagination({
        ...table.getState().pagination,
        pageIndex: 0,
      });
      dispatch(setPageIndex(0));
    }
  }, [columnFilters, searchFilter, table, dispatch]);
  const columnWidths = ['w-[48px]', 'w-[180px]', 'w-[240px]', 'w-[180px]', 'w-[300px]'];

  const handleStartRegister = () => {
    setEditingDictionary({
      id: null,
      terms: '',
      uniform_name: '',
      category: CATEGORY_DEPARTMENT,
      description: '',
    });
  };

  const handleFinishEdit = () => {
    setEditingDictionary(null);
    setRowSelection({});
  };

  const handleDelete = async () => {
    // rowSelectionを辞書IDのリストに変換
    const selectionIds = Object.keys(rowSelection).map(Number);
    const selectedDictionaries = data.filter((_, index) => selectionIds.includes(index));

    const res = await deleteDictionaries(selectedDictionaries);

    if (res.success) {
      toast.success(getMessage('I_F_00180', '辞書'));

      setRowSelection({});
    } else {
      toast.error(res.message ?? getMessage('E_F_00430', '辞書'));
    }
    router.refresh();
  };

  // ページ総数
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
          辞書登録
          <Help
            message={`略語など表記ゆれした用語を登録する画面です。\n登録することで、文書検索画面にて表記ゆれした用語での検索が可能となります。`}
          />
        </Heading>
        <Button variant="secondary" size="sm" onClick={handleStartRegister}>
          <SvgAdd className="size-4 text-secondary-foreground" />
          新規登録
        </Button>
      </div>

      <div className="flex items-center gap-[10px]">
        <div className="space-y-1">
          <Label className="text-sm font-bold">カテゴリー</Label>
          <Select
            value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) =>
              table.getColumn('category')?.setFilterValue(value.replace('all', ''))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全てのカテゴリー" />
            </SelectTrigger>
            <SelectContent className="py-[7px] pl-4 pr-2">
              <SelectGroup>
                <SelectItem value="all">全てのカテゴリー</SelectItem>
                {CATEGORY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-1 flex-1 space-y-1">
          <div className="flex items-center gap-1">
            <Label className="mr-5 text-sm font-bold">キーワード</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Checkbox
                  id="uniform_name"
                  size="sm"
                  checked={searchFilter.fields.uniform_name}
                  onCheckedChange={(value) =>
                    setSearchFilter((prev) => ({
                      ...prev,
                      fields: {
                        ...prev.fields,
                        uniform_name: !!value,
                      },
                    }))
                  }
                />
                <Label htmlFor="uniform_name" className="ml-[7px] text-sm">
                  統一名称
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="terms"
                  size="sm"
                  checked={searchFilter.fields.terms}
                  onCheckedChange={(value) =>
                    setSearchFilter((prev) => ({
                      ...prev,
                      fields: {
                        ...prev.fields,
                        terms: !!value,
                      },
                    }))
                  }
                />
                <Label htmlFor="terms" className="ml-[7px] text-sm">
                  通称
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="description"
                  size="sm"
                  checked={searchFilter.fields.description}
                  onCheckedChange={(value) =>
                    setSearchFilter((prev) => ({
                      ...prev,
                      fields: {
                        ...prev.fields,
                        description: !!value,
                      },
                    }))
                  }
                />
                <Label htmlFor="description" className="ml-[7px] text-sm">
                  説明
                </Label>
              </div>
            </div>
          </div>
          <Input
            placeholder="統一名称や説明"
            className="w-full"
            value={searchFilter.text}
            onChange={(event) =>
              setSearchFilter((prev) => ({
                ...prev,
                text: event.target.value,
              }))
            }
          />
        </div>
      </div>
      <div className="mb-1.5 mt-3 flex items-center gap-x-3">
        <DeleteDictionaryDialogButton
          handleDeleteDictionary={handleDelete}
          disabled={Object.keys(rowSelection).length === 0}
        />
        <div className="text-2xs text-neutral-500">
          {table.getFilteredSelectedRowModel().rows.length} / {rowsNum} 選択中
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white">
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
          <TableBody className="overflow-auto">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="cursor-pointer"
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => setEditingDictionary(row.original)}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell key={cell.id}>
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
              <TableRow className="h-full">
                <TableCell colSpan={columns.length} className="h-[calc(100vh-300px)] text-center">
                  該当する辞書が見つかりません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-3"
      />

      {/* 登録＆編集フォーム */}
      <DictionaryForm dictionary={editingDictionary} handleClose={handleFinishEdit} />
    </div>
  );
}
