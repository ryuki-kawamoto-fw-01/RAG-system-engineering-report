'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';
import Markdown from '@/app/_components/ui/markdown';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Textarea } from '@/app/_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setReport as setReportSlice } from '@/app/_store/slice/source-code-creation';
import { getMessage } from '@/app/_utils/message';

type Props = {
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  isEditing?: boolean;
};

export function SourceCodeReport({
  onEdit,
  onCancel,
  onSave,
  isEditing: externalIsEditing,
}: Props) {
  const dispatch = useAppDispatch();
  const { report } = useAppSelector((state) => state.sourceCodeCreation);

  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [editableReport, setEditableReport] = useState('');
  const setReport = useCallback((report: string) => dispatch(setReportSlice(report)), [dispatch]);

  // isEditingはprops優先、なければ内部state
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  useEffect(() => {
    setEditableReport(report);
  }, [report]);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    toast.success(getMessage('I_F_00050', 'ソースコード'));
  };

  const handleDownload = (report: string) => {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'source-code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setInternalIsEditing(true);
    }
  };

  const handleSave = () => {
    setReport(editableReport);
    if (onSave) {
      onSave();
    } else {
      setInternalIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditableReport(report);
    if (onCancel) {
      onCancel();
    } else {
      setInternalIsEditing(false);
    }
  };

  return (
    <div
      className={`flex min-w-[560px] flex-col overflow-hidden ${isEditing ? 'w-full' : 'min-w-[560px]'}`}
    >
      <div className="flex items-end justify-between border border-neutral-100 bg-neutral-0 px-5 py-3">
        <Heading level={3}>ソースコード</Heading>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      onClick={() => handleDownload(report)}
                    >
                      <SvgDownload className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ソースコードをダウンロード</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="icon" size="icon" onClick={handleEdit}>
                      <SvgEdit className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ソースコードを手動で編集</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      <div className="flex h-full grow flex-col overflow-hidden p-0">
        {isEditing ? (
          <Textarea
            value={editableReport}
            onChange={(e) => setEditableReport(e.target.value)}
            className="size-full resize-none bg-neutral-0 shadow"
          />
        ) : (
          <ScrollArea className="overflow-y size-full bg-neutral-0 px-5 py-3 shadow">
            <div className="flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="icon" size="icon" onClick={handleCopy}>
                      <SvgCopy className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>レポートをコピー</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Markdown>{report}</Markdown>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
