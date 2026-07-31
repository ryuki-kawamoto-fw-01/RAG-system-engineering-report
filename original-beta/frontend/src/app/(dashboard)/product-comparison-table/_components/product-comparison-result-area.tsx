'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppSelector } from '@/app/_store/hooks';
import { selectProductComparison } from '@/app/_store/selectors/product-comparison';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

// 新しいデータ形式に合わせたインターフェース
interface TableData {
  headers: string[];
  rows: string[][];
}

interface ComparisonResponse {
  table: TableData;
}

type Props = {
  className?: string;
};

export default function ProductComparisonResultArea({ className }: Props) {
  const { ProductComparisonResult } = useAppSelector(selectProductComparison);
  const [parsedData, setParsedData] = useState<ComparisonResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    // JSONとしてパースを試みる
    if (ProductComparisonResult) {
      try {
        // JSON文字列をJavaScriptオブジェクトに変換
        const parsedData = JSON.parse(ProductComparisonResult);

        // 期待する形式かチェック
        if (
          parsedData &&
          parsedData.table &&
          Array.isArray(parsedData.table.headers) &&
          Array.isArray(parsedData.table.rows)
        ) {
          setParsedData(parsedData);
          setParseError(null);
        } else {
          setParseError('予期しない形式のデータです。table構造が見つかりません。');
          setParsedData(null);
        }
      } catch (error) {
        console.error('JSON解析エラー:', error);
        setParseError('JSON形式ではないためテーブル表示できません');
        setParsedData(null);
      }
    } else {
      setParsedData(null);
      setParseError(null);
    }
  }, [ProductComparisonResult]);

  const handleCopy = () => {
    if (!parsedData || !parsedData.table) {
      toast.error(getMessage('E_F_00170', 'データ'));
      return;
    }

    const { headers, rows } = parsedData.table;

    // HTMLテーブルを作成
    let htmlTable = `
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
    `;

    // ヘッダー行の追加
    headers.forEach((header) => {
      htmlTable += `<th style="text-align: left; font-weight: bold;">${header}</th>`;
    });

    htmlTable += `
          </tr>
        </thead>
        <tbody>
    `;

    // データ行の追加
    rows.forEach((row) => {
      htmlTable += `<tr>`;
      row.forEach((cell, cellIndex) => {
        // 最初の列（比較項目）は太字に
        if (cellIndex === 0) {
          htmlTable += `<td style="text-align: left; font-weight: bold;">${cell}</td>`;
        } else {
          htmlTable += `<td style="text-align: left;">${cell}</td>`;
        }
      });
      htmlTable += `</tr>`;
    });

    htmlTable += `
        </tbody>
      </table>
    `;

    // テキスト形式のデータも用意（フォールバック用）
    const plainTextRows: string[] = [];

    // ヘッダー行をタブ区切りで追加
    plainTextRows.push(headers.join('\t'));

    // データ行をタブ区切りで追加
    rows.forEach((row) => {
      plainTextRows.push(row.join('\t'));
    });

    const plainText = plainTextRows.join('\n');

    try {
      // クリップボードに両方のフォーマットでコピー
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlTable], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      toast.success(getMessage('I_F_00050', '比較表(表形式)'));
    } catch {
      // 高度なAPIがサポートされていない場合は、プレーンテキストでフォールバック
      navigator.clipboard.writeText(plainText);
      toast.success(getMessage('I_F_00050', '比較表(テキスト形式)'));
    }
  };

  // データをCSVとして出力する
  const exportRowsAsCSV = () => {
    if (!parsedData || !parsedData.table) {
      toast.error(getMessage('E_F_00360', 'データ'));
      return;
    }

    const { headers, rows } = parsedData.table;

    // CSVヘッダー
    const csvHeader = headers.map((header) => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';

    // CSVデータ行
    const csvRows = rows.map((row) =>
      row.map((cell) => `"${(cell || '-').replace(/"/g, '""')}"`).join(',')
    );

    const csvData = csvRows.join('\n');

    // UTF-8 with BOMを使用してExcelでの文字化けを防止
    const csvContent = '\uFEFF' + csvHeader + csvData; // BOMを追加

    // Blobオブジェクトの作成
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

    // ファイルのダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(getMessage('I_F_00130', '比較表'));
  };

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base">検索結果</Label>
        <div className="flex items-center">
          {parsedData && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleCopy}>
                    <SvgCopy className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>比較表を表形式でコピー</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {parsedData && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={exportRowsAsCSV}>
                    <Download className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>比較表をCSVとして出力</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* 結果表示エリア */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {parsedData ? (
          <div className="h-full overflow-x-auto">
            <Table className="w-full table-fixed border-collapse border border-neutral-100">
              <TableHeader>
                <TableRow className="border border-neutral-100">
                  {/* ヘッダー行を動的に生成 */}
                  {parsedData.table.headers.map((header, index) => (
                    <TableHead
                      key={index}
                      className={`${index === 0 ? 'w-[15%] bg-neutral-50' : 'bg-white'} border border-neutral-100 `}
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* データ行を動的に生成 */}
                {parsedData.table.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="border border-neutral-100">
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className={`${cellIndex === 0 ? '!bg-neutral-50 font-medium' : 'whitespace-pre-wrap'} border border-neutral-100 bg-white`}
                      >
                        {cell || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* プレースホルダー表示を上部に配置 - FormControlを使わない */}
            <div className="mt-4">
              <div className="flex h-72 items-center justify-center rounded-md border bg-gray-50 p-4">
                <p className="text-muted-foreground text-center">
                  ここに生成された製品比較表が表示されます
                </p>
              </div>
            </div>

            {/* エラーがある場合は下部に表示 */}
            {parseError && (
              <div className="mt-6 text-center">
                <p className="text-red-500">{parseError}</p>
                <p className="mt-2">JSONテキスト:</p>
                <div className="mt-1 max-h-[300px] overflow-auto rounded border p-2 text-left">
                  <pre className="text-xs">{ProductComparisonResult}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
