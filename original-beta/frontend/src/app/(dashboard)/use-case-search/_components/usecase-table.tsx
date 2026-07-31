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
import Link from 'next/link';
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
import { deleteUseCases } from '../_actions/deleteUseCases';
import {
  ALL_STATUSES,
  ALL_BUSINESS_DOMAINS,
  ALL_CATEGORIES,
  STATUS_VALUES,
  BUSINESS_DOMAIN_VALUES,
  CATEGORY_VALUES,
} from '../_constant';
import { UseCase, Status, BusinessDomain, Category } from '../_type';
import { getUseCaseUrl, isUseCaseImplemented } from '../_utils/usecase-mapping';
import DeleteUseCaseDialogButton from './delete-usecase-dialog-button';
import UseCaseForm from './usecase-form';

type Props = {
  data: UseCase[];
};

export default function UseCasesTable({ data }: Props) {
  const { pageIndex } = useAppSelector((state) => state.pagination);
  const dispatch = useDispatch();
  const router = useRouter();

  // フィルターの状態
  const [statusFilter, setStatusFilter] = useState<Status | typeof ALL_STATUSES>(ALL_STATUSES);
  const [businessDomainFilter, setBusinessDomainFilter] = useState<
    BusinessDomain | typeof ALL_BUSINESS_DOMAINS
  >(ALL_BUSINESS_DOMAINS);
  const [categoryFilter, setCategoryFilter] = useState<Category | typeof ALL_CATEGORIES>(
    ALL_CATEGORIES
  );

  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    dispatch(setReset());
  }, [dispatch]);

  // ハンドラー関数
  const handleStartRegister = () => {
    setEditingUseCase({
      id: null,
      status: '',
      value_proposition: '',
      business_domain: '',
      category: '',
      classification: '',
      use_case_name: '',
      overview: '',
      origin: '',
      development_department: '',
      isDeleted: false,
    });
  };

  const handleFinishEdit = () => {
    setEditingUseCase(null);
  };

  const handleStatusFilterChange = (value: Status | typeof ALL_STATUSES) => {
    setStatusFilter(value);
  };

  const handleBusinessDomainFilterChange = (
    value: BusinessDomain | typeof ALL_BUSINESS_DOMAINS
  ) => {
    setBusinessDomainFilter(value);
  };

  const handleCategoryFilterChange = (value: Category | typeof ALL_CATEGORIES) => {
    setCategoryFilter(value);
  };

  const handlePageChange = (page: number) => {
    table.setPagination({
      ...table.getState().pagination,
      pageIndex: page - 1,
    });
    dispatch(setPageIndex(page - 1));
  };

  // 削除ハンドラ
  const handleDeleteUseCases = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUseCases = selectedRows.map((row) => row.original);

    const result = await deleteUseCases(selectedUseCases);

    if (result.success) {
      toast.success(getMessage('I_F_00180', 'ユースケース'));
      setRowSelection({});
      router.refresh();
    } else {
      toast.error(getMessage('E_F_00410', 'ユースケース'));
    }
  };

  // カスタムフィルター関数
  const statusFilterFn: FilterFnOption<UseCase> = (row, columnId, filterValue) => {
    if (filterValue === ALL_STATUSES) return true;
    return row.getValue(columnId) === filterValue;
  };

  const businessDomainFilterFn: FilterFnOption<UseCase> = (row, columnId, filterValue) => {
    if (filterValue === ALL_BUSINESS_DOMAINS) return true;
    return row.getValue(columnId) === filterValue;
  };

  const categoryFilterFn: FilterFnOption<UseCase> = (row, columnId, filterValue) => {
    if (filterValue === ALL_CATEGORIES) return true;
    return row.getValue(columnId) === filterValue;
  };

  // テーブルのカラム幅定義
  const columnWidths = [
    'w-[48px]', // select (qaと同じ)
    'w-[120px]', // status
    'w-[150px]', // business_domain
    'w-[120px]', // category
    'w-[250px]', // use_case_name
    'w-[300px]', // overview (qaと同じ)
  ];

  // テーブルのカラム定義
  const columns: ColumnDef<UseCase>[] = [
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
      accessorKey: 'status',
      header: 'ステータス',
      filterFn: statusFilterFn,
      cell: ({ row }) => <div>{row.getValue('status')}</div>,
    },
    {
      accessorKey: 'business_domain',
      header: '業務領域',
      filterFn: businessDomainFilterFn,
      cell: ({ row }) => <div>{row.getValue('business_domain')}</div>,
    },
    {
      accessorKey: 'category',
      header: 'カテゴリー',
      filterFn: categoryFilterFn,
      cell: ({ row }) => <div>{row.getValue('category') || '-'}</div>,
    },
    {
      accessorKey: 'use_case_name',
      header: 'ユースケース名',
      filterFn: 'customFilter' as FilterFnOption<UseCase>,
      cell: ({ row }) => {
        const useCaseName = row.getValue('use_case_name') as string;
        const url = getUseCaseUrl(useCaseName);
        const isImplemented = isUseCaseImplemented(useCaseName);

        if (isImplemented && url) {
          return (
            <Link
              href={url}
              className="line-clamp-3 break-all text-blue-600 transition-colors hover:text-blue-800 hover:underline"
              title={`${useCaseName}（クリックして${useCaseName}画面へ移動）`}
            >
              {useCaseName}
            </Link>
          );
        }

        return (
          <div className="line-clamp-3 break-all text-gray-400" title={`${useCaseName}`}>
            {useCaseName}
          </div>
        );
      },
    },
    {
      accessorKey: 'overview',
      header: '概要',
      cell: ({ row }) => (
        <div className="line-clamp-3 break-all" title={row.getValue('overview')}>
          {row.getValue('overview')}
        </div>
      ),
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
        const useCaseName = row.original.use_case_name || '';
        const overview = row.original.overview || '';
        return useCaseName.includes(filterValue) || overview.includes(filterValue);
      },
    },
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageIndex,
        pageSize: 10,
      },
    },
  });

  // フィルター適用
  useEffect(() => {
    table.getColumn('status')?.setFilterValue(statusFilter);
  }, [statusFilter, table]);

  useEffect(() => {
    table.getColumn('business_domain')?.setFilterValue(businessDomainFilter);
  }, [businessDomainFilter, table]);

  useEffect(() => {
    table.getColumn('category')?.setFilterValue(categoryFilter);
  }, [categoryFilter, table]);

  // ページネーション用の総ページ数計算
  const totalPages =
    Math.ceil(table.getFilteredRowModel().rows.length / table.getState().pagination.pageSize) || 1;

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          ユースケース検索
          <Help message="システムに登録されているユースケースを検索・管理する画面です。各ユースケースの詳細情報を確認し、新規登録や編集が可能です。" />
        </Heading>
        {/* 新規登録ボタン - 一時的に非表示 */}
        <Button variant="secondary" size="sm" onClick={handleStartRegister} className="hidden">
          <SvgAdd className="size-4" />
          <span>新規登録</span>
        </Button>
      </div>
      <div className="mt-1.5 flex items-center gap-x-2.5">
        <div className="space-y-1">
          <Label className="text-sm font-bold">ステータス</Label>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="全てのステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_STATUSES}>{ALL_STATUSES}</SelectItem>
                {STATUS_VALUES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-bold">業務領域</Label>
          <Select value={businessDomainFilter} onValueChange={handleBusinessDomainFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="全ての業務領域" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_BUSINESS_DOMAINS}>{ALL_BUSINESS_DOMAINS}</SelectItem>
                {BUSINESS_DOMAIN_VALUES.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-bold">カテゴリー</Label>
          <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="全てのカテゴリー" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_CATEGORIES}>{ALL_CATEGORIES}</SelectItem>
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
          <Label className="text-sm font-bold">キーワード検索</Label>
          <Input
            placeholder="ユースケース名や概要で検索..."
            value={(table.getColumn('use_case_name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('use_case_name')?.setFilterValue(event.target.value)
            }
          />
        </div>
      </div>
      <div className="mb-1.5 mt-3 flex items-center gap-x-3">
        {/* 削除ボタン - 一時的に非表示 */}
        <div className="hidden">
          <DeleteUseCaseDialogButton
            handleDeleteUseCases={handleDeleteUseCases}
            disabled={Object.keys(rowSelection).length === 0}
          />
        </div>
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
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={cn(
                  'hover:bg-neutral-50',
                  row.getIsSelected() && 'bg-blue-50 hover:bg-blue-100'
                )}
                onDoubleClick={() => setEditingUseCase(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn('py-3', cell.column.id === 'select' && 'w-[50px]')}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                該当するユースケースが見つかりません。
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
      <UseCaseForm
        useCase={editingUseCase}
        onClose={handleFinishEdit}
        onSuccess={() => {
          handleFinishEdit();
          router.refresh();
        }}
      />
    </div>
  );
}
