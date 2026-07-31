'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFnOption,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import ReactMarkdown from 'react-markdown';
import { useDispatch } from 'react-redux';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import SortDropdown from '@/app/_components/dropdown/sort-dropdown';
import SvgAdd from '@/app/_components/icon/button/Add';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { Label } from '@/app/_components/ui/label';
import { Pagination } from '@/app/_components/ui/pagination';
import { CATEGORY_ALL, CATEGORY_OPTIONS } from '@/app/_constants/prompt-template';
import { useAppSelector } from '@/app/_store/hooks';
import { setPageIndex, setReset } from '@/app/_store/slice/pagination';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';
import { Checkbox } from '../../../_components/ui/checkbox';
import { Input } from '../../../_components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../_components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../_components/ui/table';
import { deletePromptTemplates } from '../_actions/deletePromptTemplates';
import DeleteTemplateDialogButton from './delete-template-dialog-button';
import TemplateForm from './template-form';

export function PromptTemplateTable({ data }: { data: PromptTemplate[] }) {
  const { pageIndex } = useAppSelector((state) => state.pagination);
  const dispatch = useDispatch();
  const router = useRouter();

  const [editingTemplate, setEditingTemplate] = React.useState<PromptTemplate | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  React.useEffect(() => {
    dispatch(setReset());
  }, []);

  const columns: ColumnDef<PromptTemplate>[] = [
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
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <SortDropdown
            label="タイトル"
            sortStatus={column.getIsSorted()}
            handleUp={() => column.toggleSorting(false)}
            handleDown={() => column.toggleSorting(true)}
          />
        );
      },
      cell: ({ row }) => {
        return <div className="line-clamp-3 break-all">{row.getValue('title')}</div>;
      },
      filterFn: 'customFilter' as FilterFnOption<PromptTemplate>,
    },
    {
      accessorKey: 'category',
      header: 'カテゴリー',
      cell: ({ row }) => <div>{row.getValue('category')}</div>,
    },
    {
      accessorKey: 'content',
      header: 'プロンプト',
      cell: ({ row }) => <div>{row.getValue('content')}</div>,
    },
  ];

  const tables = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    filterFns: {
      customFilter: (row, columnId, filterValue) => {
        if (!filterValue) {
          return true;
        }

        const title = row.original.title || '';
        const content = row.original.content || '';
        return title.includes(filterValue) || content.includes(filterValue);
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize: 10,
      },
    },
  });

  // フィルターが変更されたら1ページ目に戻る
  React.useEffect(() => {
    if (columnFilters.length > 0) {
      tables.setPagination({
        ...tables.getState().pagination,
        pageIndex: 0,
      });
      dispatch(setPageIndex(0));
    }
  }, [columnFilters, tables, dispatch]);
  // 列の幅を定義
  const columnWidths = ['w-[48px]', 'w-[200px]', 'w-[200px]', 'w-auto'];

  const handleStartRegister = () => {
    setEditingTemplate({
      title: '',
      category: '',
      content: '',
    });
  };

  const handleFinishEdit = () => {
    setEditingTemplate(null);
  };

  const handleDelete = async () => {
    // rowSelectionをテンプレートIDのリストに変換
    const selectionIds = Object.keys(rowSelection).map(Number);
    const selectedTemplateIds = data
      .filter((_, index) => selectionIds.includes(index))
      .map((template) => template.id!);

    const res = await deletePromptTemplates(selectedTemplateIds);

    if (res.success) {
      toast.success(getMessage('I_F_00180', 'プロンプト'));
      // 選択を初期化
      setRowSelection({});
    } else {
      toast.error(res.message ?? getMessage('E_F_00430', 'プロンプト'));
    }

    router.refresh();
  };

  // データの総ページ数
  const filteredRowsLength = tables.getFilteredRowModel().rows.length;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRowsLength / tables.getState().pagination.pageSize)
  );

  // ページ変更
  const handlePageChange = (page: number) => {
    tables.setPagination({
      ...tables.getState().pagination,
      pageIndex: page - 1,
    });

    dispatch(setPageIndex(page - 1));
  };

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          プロンプト登録
          <Help
            message={`プロンプトをテンプレートとして保存する画面です。\n登録することで、チャット画面・文書検索画面でテンプレートを呼び出すことが可能となります。\n※プロンプト：入力欄に打ち込む生成AIへの指示文。`}
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
          <Select
            value={(tables.getColumn('category')?.getFilterValue() as string) ?? CATEGORY_ALL}
            onValueChange={(value) =>
              tables.getColumn('category')?.setFilterValue(value.replace(CATEGORY_ALL, ''))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全てのカテゴリー" />
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
        <div className="flex-1 space-y-1">
          <Label className="text-sm font-bold">キーワード</Label>
          <Input
            placeholder="タイトルまたは内容"
            value={(tables.getColumn('title')?.getFilterValue() as string) ?? ''}
            onChange={(event) => tables.getColumn('title')?.setFilterValue(event.target.value)}
          />
        </div>
      </div>
      <div className="mb-1.5 mt-3 flex items-center gap-x-3">
        <DeleteTemplateDialogButton
          handleDeleteQa={handleDelete}
          disabled={Object.keys(rowSelection).length === 0}
        />
        <div className="text-2xs text-neutral-500">
          {tables.getFilteredSelectedRowModel().rows.length} /{' '}
          {tables.getFilteredRowModel().rows.length} 選択中
        </div>
      </div>
      <Table className="w-full table-fixed">
        <TableHeader className="sticky top-0">
          {tables.getHeaderGroups().map((headerGroup) => (
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
          {tables.getRowModel().rows?.length ? (
            tables.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    onClick={() => {
                      if (cell.column.id === 'select') {
                        return;
                      }

                      setEditingTemplate(cell.row.original);
                    }}
                    className={cn(
                      'cursor-pointer',
                      columnWidths[index],
                      cell.column.id === 'select' && 'cursor-default'
                    )}
                  >
                    {cell.column.id === 'content' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkBreaks, remarkGfm]}
                        className="line-clamp-3"
                      >
                        {cell.getValue() as string}
                      </ReactMarkdown>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-[calc(100vh-300px)] text-center">
                該当するテンプレートが見つかりません。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        currentPage={tables.getState().pagination.pageIndex + 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-3"
      />

      {/* 登録＆編集フォーム */}
      {editingTemplate !== null && (
        <TemplateForm template={editingTemplate} handleClose={handleFinishEdit} />
      )}
    </div>
  );
}
