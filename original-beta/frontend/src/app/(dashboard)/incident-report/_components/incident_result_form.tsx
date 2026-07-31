import { useRef } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectIncidentReport } from '@/app/_store/selectors/incident-report';
import { setIncidentReportResult, setFeedbackAt } from '@/app/_store/slice/incident-report';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  className?: string;
};

export default function IncidentReportResultDisplay({ className }: Props) {
  const dispatch = useAppDispatch();
  const { incidentReportResult = '', id, feedbackAt } = useAppSelector(selectIncidentReport) ?? {};
  // フィードバック送信
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };
  const textRef = useRef<HTMLTextAreaElement>(null);

  // コピー
  const handleCopy = async () => {
    if (incidentReportResult) {
      await navigator.clipboard.writeText(incidentReportResult);
      toast.success('コピーしました');
      // eslint-disable-next-line no-console
      console.log('[IncidentReportResultDisplay] コピー内容:', incidentReportResult);
    }
  };

  // ダウンロード
  const handleDownload = () => {
    if (!incidentReportResult) return;
    const blob = new Blob([incidentReportResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incident_report.txt';
    a.click();
    URL.revokeObjectURL(url);
    // eslint-disable-next-line no-console
    console.log('[IncidentReportResultDisplay] ダウンロード内容:', incidentReportResult);
  };

  if (!incidentReportResult) {
    // eslint-disable-next-line no-console
    console.log('[IncidentReportResultDisplay] レポート未作成');
    return (
      <div className={cn('mt-10 text-center text-gray-400', className)}>
        労働災害報告書はまだ作成されていません。
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col transition-all duration-300', className)}>
      <div className="flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        <div className="flex items-center gap-2">
          {/* フィードバックボタン */}
          <FeedbackGoodButton
            source="incidentReport"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <FeedbackBadButton
            source="incidentReport"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <Button
            type="button"
            variant="icon"
            size="icon"
            onClick={handleDownload}
            title="ダウンロード"
          >
            <SvgDownload className="size-5" />
          </Button>
          <Button type="button" variant="icon" size="icon" onClick={handleCopy} title="コピー">
            <SvgCopy className="size-5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <textarea
          ref={textRef}
          value={incidentReportResult}
          onChange={(e) => dispatch(setIncidentReportResult(e.target.value))}
          className="resize-vertical mt-1 flex-1 rounded border p-2 text-sm text-gray-800"
          style={{ minHeight: '500px' }}
        />
      </div>
    </div>
  );
}
