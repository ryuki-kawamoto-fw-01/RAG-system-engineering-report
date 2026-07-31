'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  FilterFnOption,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
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
import { deleteQAs } from '../_actions/deleteQAs';
import { CATEGORY_ALL, CATEGORY_VALUES, SUB_CATEGORY_ALL, SUB_CATEGORY_MAP } from '../_constant';
import { QA, Category, SubCategory } from '../_type';
import DeleteQADialogButton from './delete-qa-dialog-button';
import QAForm from './qa-form';

type Props = {
  data: QA[];
};

export default function QATable({ data }: Props) {
  const { pageIndex } = useAppSelector((state) => state.pagination);
  const dispatch = useDispatch();
  const router = useRouter();

  // カテゴリフィルターの状態
  const [categoryFilter, setCategoryFilter] = useState<Category | typeof CATEGORY_ALL>(
    CATEGORY_ALL
  );
  // サブカテゴリフィルターの状態
  const [subCategoryFilter, setSubCategoryFilter] = useState<SubCategory | typeof SUB_CATEGORY_ALL>(
    SUB_CATEGORY_ALL
  );

  const [editingQA, setEditingQA] = useState<QA | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    dispatch(setReset());
  }, []);

  // サブカテゴリの選択肢をカテゴリに応じて動的に生成
  const subCategoryOptions =
    categoryFilter !== CATEGORY_ALL && SUB_CATEGORY_MAP[categoryFilter as Category]
      ? SUB_CATEGORY_MAP[categoryFilter as Category]
      : [];

  const columns: ColumnDef<QA>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Label className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-neutral-900/[4%]">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
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
      header: 'カテゴリー',
      cell: ({ row }) => <div>{row.getValue('category')}</div>,
    },
    {
      accessorKey: 'work_category',
      header: 'サブカテゴリー',
      cell: ({ row }) => <div>{row.getValue('work_category')}</div>,
    },
    {
      accessorKey: 'question',
      header: '質問',
      cell: ({ row }) => <div className="line-clamp-3 break-all">{row.getValue('question')}</div>,
      filterFn: 'customFilter' as FilterFnOption<QA>,
    },
    {
      accessorKey: 'answer',
      header: '回答',
      cell: ({ row }) => <div className="line-clamp-3 break-all">{row.getValue('answer')}</div>,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      customFilter: (row, columnId, filterValue) => {
        if (!filterValue) {
          return true;
        }
        const question = row.original.question || '';
        const answer = row.original.answer || '';
        return question.includes(filterValue) || answer.includes(filterValue);
      },
    },
    onRowSelectionChange: setRowSelection,
    state: {
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
  const columnWidths = ['w-[48px]', 'w-[150px]', 'w-[150px]', 'w-[300px]', 'w-[300px]'];

  // ページ総数
  const rowsNum = table.getFilteredRowModel().rows.length;
  const totalPages = Math.max(1, Math.ceil(rowsNum / table.getState().pagination.pageSize));

  const handleStartRegister = () => {
    setEditingQA({
      id: null,
      category: '',
      work_category: '',
      question: '',
      answer: '',
    });
  };

  const handleFinishEdit = () => {
    setEditingQA(null);
  };

  const handleDelete = async () => {
    // rowSelectionをQ&Aのidリストに変換
    const selectionIds = Object.keys(rowSelection).map(Number);
    const selectedQAs = data.filter((_, index) => selectionIds.includes(index));

    const res = await deleteQAs(selectedQAs);

    if (res.success) {
      toast.success(getMessage('I_F_00180', 'Q&A'));
      setRowSelection({});
    } else {
      toast.error(res.message ?? getMessage('E_F_00430', 'Q&A'));
    }
    router.refresh();
  };

  const handlePageChange = (page: number) => {
    table.setPagination({
      ...table.getState().pagination,
      pageIndex: page - 1,
    });

    dispatch(setPageIndex(page - 1));
  };

  // カテゴリフィルター
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value as Category | typeof CATEGORY_ALL);
    setSubCategoryFilter(SUB_CATEGORY_ALL);
    table.getColumn('category')?.setFilterValue(value === CATEGORY_ALL ? '' : value);
    table.getColumn('work_category')?.setFilterValue('');
  };

  // サブカテゴリフィルター
  const handleSubCategoryFilterChange = (value: string) => {
    setSubCategoryFilter(value as SubCategory | typeof SUB_CATEGORY_ALL);
    table.getColumn('work_category')?.setFilterValue(value === SUB_CATEGORY_ALL ? '' : value);
  };

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          Q&A登録
          <Help
            message={`よくある質問とその回答を登録する画面です。\n登録することで、文書検索画面にてよくある質問に対しての正確な回答が可能となります。`}
          />
        </Heading>
        <Button variant="secondary" size="sm" onClick={handleStartRegister}>
          <SvgAdd className="size-4" />
          <span>新規登録</span>
        </Button>
      </div>
      <div className="mt-1.5 flex items-center gap-x-2.5">
        <div className="space-y-1">
          <Label className="text-sm font-bold">カテゴリー</Label>
          <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="全てのカテゴリー" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={CATEGORY_ALL}>{CATEGORY_ALL}</SelectItem>
                {CATEGORY_VALUES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-bold">サブカテゴリー</Label>
          <Select
            value={subCategoryFilter}
            onValueChange={handleSubCategoryFilterChange}
            disabled={categoryFilter === CATEGORY_ALL}
          >
            <SelectTrigger>
              <SelectValue placeholder="サブカテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={SUB_CATEGORY_ALL}>{SUB_CATEGORY_ALL}</SelectItem>
                {subCategoryOptions.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-sm font-bold">キーワード</Label>
          <Input
            placeholder="質問や回答"
            value={(table.getColumn('question')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('question')?.setFilterValue(event.target.value)}
          />
        </div>
      </div>
      <div className="mb-1.5 mt-3 flex items-center gap-x-3">
        <DeleteQADialogButton
          handleDeleteQa={handleDelete}
          disabled={Object.keys(rowSelection).length === 0}
        />
        <div className="text-2xs text-neutral-500">
          {table.getFilteredSelectedRowModel().rows.length} /{' '}
          {table.getFilteredRowModel().rows.length} 選択中
        </div>
      </div>
      <Table>
        <TableHeader className="sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead key={header.id} className={columnWidths[index]}>
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                isChecked={row.getIsSelected()}
                className={columnWidths[index]}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    onClick={() => {
                      if (cell.column.id === 'select') {
                        return;
                      }
                      setEditingQA(cell.row.original);
                    }}
                    className={cn(
                      'cursor-pointer',
                      cell.column.id === 'select' && 'cursor-default'
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-[calc(100vh-300px)] text-center">
                該当するQ&Aが見つかりません。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-3"
      />

      {/* 登録＆編集フォーム */}
      <QAForm qa={editingQA} handleClose={handleFinishEdit} />
    </div>
  );
}
