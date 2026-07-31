import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Label } from '@/app/_components/ui/label';
import Markdown from '@/app/_components/ui/markdown';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Textarea } from '@/app/_components/ui/textarea';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt, setResult } from '@/app/_store/slice/corporate-survey';
import { getMessage } from '@/app/_utils/message';
import { Button } from '../../../_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

// Web検索対応時にコメントアウトを外す
// interface CorporateInformationAreaProps {
//   isReferencesPanelOpen?: boolean;
//   setIsReferencesPanelOpen?: (isOpen: boolean) => void;
// }

export default function CorporateInformationArea(): JSX.Element {
  // Web検索対応時にコメントアウトを外す
  // {
  //   isReferencesPanelOpen: propsPanelOpen,
  //   setIsReferencesPanelOpen: propsPanelSetter,
  // }: CorporateInformationAreaProps

  const { results, id, feedbackAt } = useAppSelector((state) => state.corporateSurvey);
  const dispatch = useAppDispatch();

  // 情報元表示
  // Web検索対応時にコメントアウトを外す
  // const [localPanelOpen, setLocalPanelOpen] = useState(false);
  // const isReferencesPanelOpen = propsPanelOpen !== undefined ? propsPanelOpen : localPanelOpen;
  // const setIsReferencesPanelOpen = propsPanelSetter || setLocalPanelOpen;
  const [isEditing, setIsEditing] = useState(false);

  const [textareaContent, setTextareaContent] = useState('');

  // Web検索対応時にコメントアウトを外す
  // const openReferencesPanel = () => setIsReferencesPanelOpen(true);
  // const closeReferencesPanel = () => setIsReferencesPanelOpen(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textareaContent);
    toast.success(getMessage('I_F_00050', '調査結果'));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTextareaContent(results ?? '');
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ results: textareaContent, feedbackAt }));
    setIsEditing(false);
  };

  function downloadMessage() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const element = document.createElement('a');
    const file = new Blob([textareaContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `企業調査_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  useEffect(() => {
    setTextareaContent(results ?? '');
  }, [results]);

  return (
    <div className="flex h-full">
      <div className="flex size-full flex-col transition-all duration-300">
        <div className="mb-1 flex min-h-8 items-end justify-between">
          <Label className="text-base">調査結果</Label>
          {!isEditing ? (
            <div className="flex items-center">
              {/*
                // Web検索対応時にコメントアウトを外す
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="tertiary"
                        className="w-[85px] pl-3 pr-3.5 text-sm"
                        onClick={openReferencesPanel}
                      >
                        <SvgSource className="size-4" />
                        情報元
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white">
                      <p>調査結果の情報元を表示</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider> */}

              <FeedbackGoodButton
                source="corporateSurvey"
                messageId={id as string}
                isSubmitted={!!feedbackAt}
                handleSubmit={handleSubmit}
              />
              <FeedbackBadButton
                source="corporateSurvey"
                messageId={id as string}
                isSubmitted={!!feedbackAt}
                handleSubmit={handleSubmit}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="icon" size="icon" onClick={downloadMessage}>
                      <SvgDownload className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>企業調査をダウンロード</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="icon" size="icon" onClick={handleEdit}>
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

        <div className="relative h-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="icon"
                  size="icon"
                  onClick={handleCopy}
                  className="absolute right-1 top-1 z-10"
                >
                  <SvgCopy className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>コピー</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isEditing ? (
            <Textarea
              value={textareaContent}
              onChange={(e) => setTextareaContent(e.target.value)}
              className="size-full"
            />
          ) : (
            <ScrollArea className="size-full rounded-lg border bg-white px-4 pb-12 pt-2 shadow">
              {results ? (
                <Markdown>{results}</Markdown>
              ) : (
                <span className="text-base text-gray-400">
                  ここに生成された企業調査が表示されます
                </span>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
      {/* //Web検索対応時にコメントアウトを外す
      <ReferencesSlidePanel isOpen={isReferencesPanelOpen} onClose={closeReferencesPanel} /> */}
    </div>
  );
}
