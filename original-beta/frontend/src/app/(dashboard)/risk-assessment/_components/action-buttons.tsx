import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import { Button } from '@/app/_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt } from '@/app/_store/slice/risk-assessment';
import { getMessage } from '@/app/_utils/message';

type ParsedData = {
  table: {
    headers: string[];
    rows: string[][];
  };
};

export default function ActionButtons(): JSX.Element {
  const { result, id, feedbackAt } = useAppSelector((state) => state.riskAssessment);
  const dispatch = useAppDispatch();
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  useEffect(() => {
    if (result) {
      const parsedData: ParsedData = JSON.parse(result);
      setParsedData(parsedData);
    }
  }, [result]);

  function downloadCSV() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;

    if (!parsedData || !parsedData.table) {
      toast.error('出力するデータがありません');
      return;
    }
    const { headers, rows } = parsedData.table;
    const csvHeader = headers.map((header) => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';
    const csvRows = rows.map((row) =>
      row
        .map((cell) => {
          const cellStr =
            typeof cell === 'string'
              ? cell
              : cell !== null && cell !== undefined
                ? String(cell)
                : '-';
          return `"${cellStr.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvData = csvRows.join('\n');
    const csvContent = '\uFEFF' + csvHeader + csvData;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = `リスクアセスメントシート_${timestamp}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success(getMessage('I_F_00130', 'リスクアセスメントシート'));
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  const handleCopy = async () => {
    if (!parsedData || !parsedData.table) {
      toast.error('コピーするデータがありません');
      return;
    }

    const { headers, rows } = parsedData.table;
    let htmlTable = `<table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;"><thead><tr style="background-color: #f3f4f6;">`;
    headers.forEach((header) => {
      htmlTable += `<th style="text-align: left; font-weight: bold;">${header}</th>`;
    });
    htmlTable += `</tr></thead><tbody>`;
    rows.forEach((row) => {
      htmlTable += `<tr>`;
      row.forEach((cell, cellIndex) => {
        htmlTable += `<td style="text-align: left;${cellIndex === 0 ? ' font-weight: bold;' : ''}">${cell}</td>`;
      });
      htmlTable += `</tr>`;
    });
    htmlTable += `</tbody></table>`;

    const plainTextRows: string[] = [];
    plainTextRows.push(headers.join('\t'));
    rows.forEach((row) => {
      plainTextRows.push(row.join('\t'));
    });
    const plainText = plainTextRows.join('\n');

    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          'text/html': new Blob([htmlTable], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      toast.success('リスクアセスメントシートを表形式でコピーしました');
    } catch {
      await navigator.clipboard.writeText(plainText);
      toast.success('リスクアセスメントシートをテキスト形式でコピーしました');
    }
  };

  return (
    <div className="flex items-center">
      <FeedbackGoodButton
        source="risk-assessment"
        messageId={id as string}
        isSubmitted={!!feedbackAt}
        handleSubmit={handleSubmit}
      />
      <FeedbackBadButton
        source="risk-assessment"
        messageId={id as string}
        isSubmitted={!!feedbackAt}
        handleSubmit={handleSubmit}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="icon" size="icon" onClick={handleCopy}>
              <SvgCopy className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>コピー</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="icon" size="icon" onClick={downloadCSV}>
              <SvgDownload className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>CSVをダウンロード</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
