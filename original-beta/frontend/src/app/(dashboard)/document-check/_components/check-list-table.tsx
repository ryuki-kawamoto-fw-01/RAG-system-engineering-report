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
import { Image } from 'lucide-react';
import * as React from 'react';

import { useEffect, useState, useRef } from 'react';
import SvgClose from '@/app/_components/icon/button/Close';
import Markdown from '@/app/_components/ui/markdown';
import { CheckList } from '@/app/_types/check-list';
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
import { Textarea } from '../../../_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';
import { checkProcs } from '../_actions/check-proc';

import UploadFileDialogButton from './check-upload-dialog-button';
import { header } from './header';
import { outputColumns } from './output-columns';

type Props = {
  data: CheckList[];
  fetchCheckList: (checkList: CheckList[]) => void;
  fetchContent: (checkList: string) => void;
};

export const columns: ColumnDef<CheckList>[] = [
  {
    accessorKey: 'checkDtls',
    header: 'チェック内容',
    cell: ({ row }) => <Markdown>{row.getValue('checkDtls')}</Markdown>,
  },
  {
    accessorKey: 'checkDeleteFlg',
    header: 'チェック削除',
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

export function CheckListTable({ data, fetchCheckList, fetchContent }: Props) {
  // const [displayFileName, setDisplayFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const [rowSelection, setRowSelection] = React.useState<{ [key: string]: boolean }>({});
  const [tableData, setTableData] = useState<CheckList[]>(data); // テーブルデータの状態を追加

  const tables = useReactTable({
    data: tableData,
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
  const [documentDescription, setDocumentDescription] = useState<string>('');
  const [imageSrcData, setimageSrcData] = useState<string | ''>('');
  const [fileName, setFileName] = useState<string | ''>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      setTableData(data);
    }
  }, [data]);

  const checkProc = async () => {
    setIsLoading(true);
    const checkCriteriaList: string[] = [];
    tableData.map((item) => {
      checkCriteriaList.push(item.checkDtls);
    });

    const res = await checkProcs(checkCriteriaList, documentDescription, imageSrcData);
    handleDeleteImage();
    let strCheckResult: string = '';
    if (res.success) {
      for (let i = 0; i < res.answerList.length; i++) {
        // const n = i + 1;
        strCheckResult += checkCriteriaList[i] + '\n';
        strCheckResult += '\n';
        strCheckResult += res.answerList[i] + '\n';
        strCheckResult += '\n';
      }
    }
    setIsLoading(false);
    fetchContent(strCheckResult);
  };
  const handleDelete = () => {
    const newData = tableData.filter((_, index) => !rowSelection[index]);
    setTableData(newData); // 新しいデータでテーブルを更新
    setRowSelection({}); // 選択状態をリセット

    // 親コンポーネントに新しいチェックリストを渡す
    fetchCheckList(newData);
  };

  const allDelete = () => {
    // ダイアログで確認
    if (confirm('全ての項目を削除しますか？')) {
      setTableData([]); // テーブルデータを空にする
      setRowSelection({}); // 選択状態をリセット

      // 親コンポーネントに新しいチェックリストを渡す
      fetchCheckList([]);
    } else {
      return;
    }
  };

  // Blob URLをData URLに変換する関数
  const convertBlobURLToDataURL = (blobURL: string): Promise<string> => {
    return fetch(blobURL)
      .then((response) => response.blob())
      .then((blob) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });
  };

  // 画像ファイル選択
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      setFileName(fileName);
      const blobUrl = window.URL.createObjectURL(file);
      convertBlobURLToDataURL(blobUrl).then((dataURL) => {
        setimageSrcData(dataURL);
      });
      // ファイル選択後に input 要素の値をリセット
      event.target.value = '';
    }
  };

  // ファイル取得
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  //　画像ファイル消去
  const handleDeleteImage = () => {
    setimageSrcData('');
  };

  const convertToCSV = (checkList: CheckList[]): string => {
    // データ行を動的に生成
    const rows = checkList.map((row) =>
      outputColumns.map((column) => {
        let cell = row[column as keyof CheckList];
        if (typeof cell === 'string') {
          // ダブルクォートをエスケープ
          cell = cell.replace(/"/g, '""');
          // カンマや改行を含む場合はダブルクォートで囲む
          if (cell.includes(',') || cell.includes('\n')) {
            cell = `"${cell}"`;
          }
        }
        return cell;
      })
    );
    // CSVコンテンツを生成
    const csvContent = [header, ...rows].map((e) => e.join(',')).join('\n');
    return csvContent;
  };

  //　設計書内容消去
  const handleDeleteDocumentDescription = () => {
    setDocumentDescription('');
  };

  const csvOutPut = async () => {
    // UTF-8 with BOMを使用してWindowsでの文字化けを防止
    const csvContent = '\uFEFF' + convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);

    link.download = `test.csv`;
    link.click();
  };

  // ローカルストレージからデータを読み取る関数
  const loadDataFromLocalStorage = () => {
    const checkList = localStorage.getItem('checkList');
    console.log('チェックリスト:' + checkList);
    if (checkList !== null) {
      setTableData(JSON.parse(checkList)); // ローカルストレージからデータを取得
      fetchCheckList(JSON.parse(checkList)); // 親コンポーネントに新しいチェックリストを渡す
      localStorage.removeItem('checkList');
    } else {
      setTableData(data); // 初期データを設定
    }
  };

  return (
    <div>
      <div className="my-5">
        ■設計書記載内容
        <div className="mt-3">
          <Button
            className="ml-0"
            variant="outline"
            size="sm"
            onClick={handleDeleteDocumentDescription}
            disabled={documentDescription === ''}
          >
            入力値消去
          </Button>
        </div>
        <div className="relative w-[30%]">
          <Textarea
            id="chapterTitle"
            className="mt-2 min-h-[100px] resize-none border-black text-left text-base dark:border-white"
            value={documentDescription}
            onChange={(e) => setDocumentDescription(e.target.value)}
          />
          {/* <input {...getInputProps()} /> */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  onClick={handleButtonClick}
                  className="absolute bottom-1 right-2 p-0"
                >
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white">
                <p>画像添付</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
        </div>
        {imageSrcData && (
          <div className="mt-2 flex items-center">
            <span className="text-muted-foreground mr-2 text-sm">添付画像:</span>
            <span className="text-sm font-medium">{fileName}</span>
            {/* <img className="border" src={imageSrcData} alt="添付画像" width={150} />*/}
            <img src={imageSrcData} alt="file" className="size-20" />
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="ml-1"
              onClick={handleDeleteImage}
            >
              <SvgClose className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="w-full">
        <div className="mb-2 flex items-center">
          ■チェック一覧
          <Button
            className="ml-2"
            variant="outline"
            size="sm"
            onClick={checkProc}
            disabled={isLoading}
          >
            {isLoading ? 'チェック実行中' : 'チェック実行'}
          </Button>
          <Button
            className="ml-3"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={Object.keys(rowSelection).length === 0}
          >
            選択した項目を削除
          </Button>
          <Button
            className="ml-4"
            variant="outline"
            size="sm"
            onClick={allDelete}
            disabled={tableData.length === 0}
          >
            全ての項目を削除
          </Button>
          <Button
            className="ml-4"
            variant="outline"
            size="sm"
            onClick={csvOutPut}
            disabled={Object.keys(rowSelection).length === 0}
          >
            CSV出力
          </Button>
          <div className="ml-4">
            <UploadFileDialogButton
              onReload={() => {
                loadDataFromLocalStorage();
              }}
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table id="checkListTable">
            <TableHeader>
              {tables.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                  <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
