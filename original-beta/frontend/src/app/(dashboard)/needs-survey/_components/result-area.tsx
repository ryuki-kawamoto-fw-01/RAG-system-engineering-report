'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setFeedbackAt } from '@/app/_store/slice/needs-survey';
import { Button } from '../../../_components/ui/button';
import { Label } from '../../../_components/ui/label';
import { Textarea } from '../../../_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

type Props = {
  className?: string;
};

export default function ResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.needsSurvey);
  console.log('ResultArea レンダリング時の状態:', { result, id, feedbackAt });
  const [preEditContent, setPreEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log('useEffect内のresult変更検知:', result);
    // resultがundefinedやnullの場合も空文字列を設定
    setPreEditContent(result || '');
  }, [result]);

  // 初期化時にも設定
  useEffect(() => {
    setPreEditContent(result || '');
  }, []);

  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // デフォルトのフォーム送信動作を防ぐ
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success('作成結果をクリップボードにコピーしました');
    }
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setPreEditContent(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: preEditContent, feedbackAt }));
    setIsEditing(false);
  };

  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  // resultが表形式JSONか判定し、テーブルデータを返す
  function parseTableResult(
    resultStr: string | undefined
  ): { headers: string[]; rows: { label: string; values: string[] }[] } | null {
    if (!resultStr) return null;
    try {
      const obj = JSON.parse(resultStr) as {
        headers: string[];
        rows: { label: string; values: unknown[] }[];
      };
      if (
        obj &&
        Array.isArray(obj.headers) &&
        Array.isArray(obj.rows) &&
        obj.rows.every(
          (row: { label: string; values: unknown[] }) =>
            typeof row.label === 'string' && Array.isArray(row.values)
        )
      ) {
        return obj as { headers: string[]; rows: { label: string; values: string[] }[] };
      }
    } catch {
      // パース失敗はnull
    }
    return null;
  }

  const tableData = parseTableResult(result);

  // tableDataをCSVでダウンロード
  const downloadTableAsCSV = () => {
    if (!tableData) return;
    const csvHeader = ['項目', ...tableData.headers]
      .map((h) => `"${h.replace(/"/g, '""')}"`)
      .join(',');
    const csvRows = tableData.rows.map((row) =>
      [
        `"${row.label.replace(/"/g, '""')}"`,
        ...row.values.map((cell) => `"${(cell || '-').replace(/"/g, '""')}"`),
      ].join(',')
    );
    const csvContent = '\uFEFF' + [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'needs_survey_table.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('表データをCSVでダウンロードしました');
  };

  // tableDataをHTMLテーブル形式でクリップボードにコピー
  const handleCopyTable = () => {
    if (!tableData) return;
    // HTMLテーブルを生成
    let htmlTable = `<table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">`;
    htmlTable += '<thead><tr><th style="text-align: left; font-weight: bold;">項目</th>';
    tableData.headers.forEach((header) => {
      htmlTable += `<th style="text-align: left; font-weight: bold;">${header}</th>`;
    });
    htmlTable += '</tr></thead><tbody>';
    tableData.rows.forEach((row) => {
      htmlTable += '<tr>';
      htmlTable += `<td style="text-align: left; font-weight: bold;">${row.label}</td>`;
      row.values.forEach((cell) => {
        htmlTable += `<td style="text-align: left;">${cell}</td>`;
      });
      htmlTable += '</tr>';
    });
    htmlTable += '</tbody></table>';

    navigator.clipboard.write([
      new window.ClipboardItem({
        'text/html': new Blob([htmlTable], { type: 'text/html' }),
      }),
    ]);
    toast.success('表データを表形式でコピーしました');
  };

  return (
    <div className={className}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="needsSurvey"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="needsSurvey"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <TooltipProvider>
              {/* tableDataがある場合のみCSVダウンロードボタンを表示 */}
              {tableData && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="icon" size="icon" onClick={downloadTableAsCSV}>
                      <SvgDownload className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>表データをCSVでダウンロード</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    onClick={handleEdit}
                    disabled={!result}
                  >
                    <SvgEdit className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>編集</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center gap-x-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="tertiary" size="sm" onClick={handleCancel}>
                    <SvgClose className="size-4" />
                    キャンセル
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>編集前に戻す</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="secondary" size="sm" onClick={handleSave}>
                    <SvgSave className="size-4" />
                    保存
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>編集内容を保存</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      <div className="relative flex h-full max-h-[400px] flex-col overflow-hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon"
                onClick={tableData && !isEditing ? handleCopyTable : copyResult}
                className="absolute right-1 top-1 z-50"
                disabled={!result}
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {tableData && !isEditing ? (
          <div className="h-full overflow-auto rounded border border-gray-200 bg-white p-2 pr-10">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="whitespace-nowrap border bg-gray-50 p-2" />
                  {tableData.headers.map((header, idx) => (
                    <th key={idx} className="whitespace-nowrap border bg-gray-50 px-2 py-5">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <th className="z-5 sticky left-0 whitespace-nowrap border bg-gray-50 px-2 py-5 text-left">
                      {row.label}
                    </th>
                    {row.values.map((cell, cIdx) => (
                      <td key={cIdx} className="border px-2 py-5">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Textarea
            onChange={(e) => {
              setPreEditContent(e.target.value);
            }}
            value={preEditContent}
            placeholder="ここにニーズ調査結果が表示されます"
            readOnly={!isEditing}
            className="size-full"
          />
        )}
      </div>
    </div>
  );
}
