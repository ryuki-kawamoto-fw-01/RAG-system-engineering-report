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
import { CheckResult } from '@/app/_types/check-result';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../_components/ui/table';

type Props = {
  data: CheckResult[];
};

export const columns: ColumnDef<CheckResult>[] = [
  {
    accessorKey: 'checkStd',
    header: 'チェック基準',
    cell: ({ row }) => <Markdown>{row.getValue('checkStd')}</Markdown>,
  },
  {
    accessorKey: 'checkResultContent',
    header: 'チェック結果',
    cell: ({ row }) => <Markdown>{row.getValue('checkResultContent')}</Markdown>,
  },
];
export function CheckResultTable({ data }: Props) {
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

  return (
    <div className="w-full">
      <div>チェック結果一覧</div>
      <div className="rounded-md border">
        <Table id="checkResultTable">
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
                        width: index === 0 ? '600px' : index === 1 ? '600px' : 'auto',
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
