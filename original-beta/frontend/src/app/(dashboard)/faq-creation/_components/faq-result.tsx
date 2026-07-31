'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { Checkbox } from '@/app/_components/ui/checkbox';
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
import { selectFaqCreation } from '@/app/_store/selectors/faq-creation';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

// FAQアイテムの型定義
interface FaqItem {
  category: string;
  subcategory: string;
  question: string;
  answer: string;
}

type Props = {
  className?: string;
};

export default function FaqResultDisplay({ className }: Props) {
  const { faqResult } = useAppSelector(selectFaqCreation);
  const [parsedFaqs, setParsedFaqs] = useState<FaqItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // JSONとしてパースを試みる
    if (faqResult) {
      try {
        // JSON文字列をJavaScriptオブジェクトの配列に変換
        const parsedData = JSON.parse(faqResult);
        // 配列形式かどうかを検証
        if (Array.isArray(parsedData)) {
          setParsedFaqs(parsedData);
          // 選択状態をリセット
          setSelectedRows({});
          setSelectAll(false);
          setParseError(null);
        } else {
          setParseError('結果がJSON配列ではありません');
          setParsedFaqs([]);
        }
      } catch {
        setParseError('JSON形式ではないためテーブル表示できません');
        setParsedFaqs([]);
      }
    } else {
      setParsedFaqs([]);
      setParseError(null);
    }
  }, [faqResult]);

  // 全選択の状態が変更されたときの処理
  useEffect(() => {
    const newSelectedRows: Record<number, boolean> = {};
    parsedFaqs.forEach((_, index) => {
      newSelectedRows[index] = selectAll;
    });
    setSelectedRows(newSelectedRows);
  }, [selectAll, parsedFaqs]);

  const handleCopy = () => {
    if (parsedFaqs.length === 0) {
      toast.error(getMessage('E_F_00170', 'データ'));
      return;
    }

    // 選択されている行だけをコピーするか、全行をコピーするか確認
    const faqs =
      Object.keys(selectedRows).length > 0
        ? parsedFaqs.filter((_, index) => selectedRows[index])
        : parsedFaqs;

    if (faqs.length === 0) {
      toast.error(getMessage('E_F_00260', 'コピーする行'));
      return;
    }

    // HTMLテーブルを作成
    const htmlTable = `
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; font-weight: bold;">カテゴリ</th>
            <th style="text-align: left; font-weight: bold;">サブカテゴリ</th>
            <th style="text-align: left; font-weight: bold;">質問</th>
            <th style="text-align: left; font-weight: bold;">回答</th>
          </tr>
        </thead>
        <tbody>
          ${faqs
            .map(
              (faq) => `
            <tr>
              <td style="text-align: left; font-weight: bold;">${faq.category}</td>
              <td style="text-align: left;">${faq.subcategory}</td>
              <td style="text-align: left;">${faq.question}</td>
              <td style="text-align: left; white-space: pre-wrap;">${faq.answer}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    // テキスト形式のデータも用意（フォールバック用）
    const header = ['カテゴリ', 'サブカテゴリ', '質問', '回答'].join('\t');
    const rows = faqs.map((faq) => {
      return [faq.category, faq.subcategory, faq.question, faq.answer].join('\t');
    });
    const plainText = [header, ...rows].join('\n');

    try {
      // クリップボードに両方のフォーマットでコピー
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlTable], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);

      toast.success(getMessage('I_F_00050', `${faqs.length}件のFAQ(表形式)`));
    } catch {
      // 高度なAPIがサポートされていない場合は、プレーンテキストでフォールバック
      navigator.clipboard.writeText(plainText);
      toast.success(getMessage('I_F_00050', `${faqs.length}件のFAQ(テキスト形式)`));
    }
  };

  // 行の選択状態を切り替える
  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 全選択の状態を切り替える
  const toggleSelectAll = () => {
    setSelectAll((prev) => !prev);
  };

  // 選択された行のデータをCSVとして出力する
  const exportSelectedRowsAsCSV = () => {
    // 選択された行を抽出
    const selectedFaqs = parsedFaqs.filter((_, index) => selectedRows[index]);

    if (selectedFaqs.length === 0) {
      toast.error(getMessage('E_F_00260', 'エクスポートする行'));
      return;
    }

    // CSVヘッダー
    const csvHeader = 'カテゴリ,サブカテゴリ,質問,回答\n';

    // CSVデータ作成
    const csvData = selectedFaqs
      .map((faq) => {
        // CSVの仕様に基づきダブルクォートでエスケープ
        const escapedCategory = `"${faq.category.replace(/"/g, '""')}"`;
        const escapedSubcategory = `"${faq.subcategory.replace(/"/g, '""')}"`;
        const escapedQuestion = `"${faq.question.replace(/"/g, '""')}"`;
        const escapedAnswer = `"${faq.answer.replace(/"/g, '""')}"`;

        return `${escapedCategory},${escapedSubcategory},${escapedQuestion},${escapedAnswer}`;
      })
      .join('\n');

    // UTF-8 with BOMを使用してExcelでの文字化けを防止
    const csvContent = '\uFEFF' + csvHeader + csvData; // BOMを追加

    // Blobオブジェクトの作成
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

    // ファイルのダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'faq_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(getMessage('I_F_00130', `${selectedFaqs.length}件のFAQ`));
  };

  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">FAQ作成結果</Label>
        <div className="flex items-center">
          {parsedFaqs.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleCopy}>
                    <SvgCopy className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>FAQ作成結果を表形式でコピー</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {parsedFaqs.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    onClick={exportSelectedRowsAsCSV}
                  >
                    <Download className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>選択した行をCSVとして出力</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-2">
        {parsedFaqs.length > 0 ? (
          <div className="h-full overflow-x-auto">
            <Table className="w-full table-fixed border-collapse border border-neutral-100">
              <TableHeader>
                <TableRow>
                  {/* 出力判定カラムをスマートに改善 - チェックボックスのみ表示しツールチップでラベル表示 */}
                  <TableHead className="sticky left-0 z-10 w-[60px] bg-neutral-50 text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex h-full items-center justify-center">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={toggleSelectAll}
                              id="select-all"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>出力判定（全選択/解除）</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="w-[15%] bg-neutral-50">カテゴリ</TableHead>
                  <TableHead className="w-[15%] bg-neutral-50">サブカテゴリ</TableHead>
                  <TableHead className="w-1/4 bg-neutral-50">質問</TableHead>
                  <TableHead className="w-[45%] bg-neutral-50">回答</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedFaqs.map((faq, index) => (
                  <TableRow key={index} className="!bg-white hover:!bg-white">
                    {/* 出力判定チェックボックス - 固定列、こちらもラベルを削除 */}
                    <TableCell className="sticky left-0 z-10 text-center">
                      <Checkbox
                        checked={!!selectedRows[index]}
                        onCheckedChange={() => toggleRowSelection(index)}
                        id={`row-${index}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{faq.category}</TableCell>
                    <TableCell>{faq.subcategory}</TableCell>
                    <TableCell>{faq.question}</TableCell>
                    <TableCell className="whitespace-pre-wrap">{faq.answer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            {parseError ? (
              <div className="text-center">
                <p className="text-red-500">{parseError}</p>
                <p className="mt-2">JSONテキスト:</p>
                <div className="mt-1 max-h-[300px] overflow-auto rounded border p-2 text-left">
                  <pre className="text-xs">{faqResult}</pre>
                </div>
              </div>
            ) : (
              <p>ここに生成されたFAQが表示されます</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
