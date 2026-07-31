'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import Markdown from '@/app/_components/ui/markdown';
import MermaidChart from '@/app/_components/ui/mermaid';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setFeedbackAt } from '@/app/_store/slice/new-product-proposal';
import { getMessage } from '@/app/_utils/message';
import { Button } from '../../../_components/ui/button';
import { Card } from '../../../_components/ui/card';
import { Label } from '../../../_components/ui/label';
import { Textarea } from '../../../_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';
import { parseAnswer } from './parseAnswer';

export default function NewProductProposalResultArea() {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.newproductProposal);
  const [preEditContent, setPreEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreEditContent(result);
  }, [result]);

  const copyResult = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!resultRef.current) return;

    // HTMLを複製してSVG→PNG変換
    const tempDiv = resultRef.current.cloneNode(true) as HTMLDivElement;
    const svgElements = tempDiv.querySelectorAll('svg');
    const promises: Promise<void>[] = [];

    svgElements.forEach((svg) => {
      // 幅・高さを安全に取得
      let width = 0;
      let height = 0;

      // 1. 属性値を直接取得
      const widthAttr = svg.getAttribute('width');
      const heightAttr = svg.getAttribute('height');
      if (widthAttr && !isNaN(Number(widthAttr))) width = Number(widthAttr);
      if (heightAttr && !isNaN(Number(heightAttr))) height = Number(heightAttr);

      // 2. baseVal.value（絶対値の場合のみ）
      if (!width && svg.width && svg.width.baseVal && svg.width.baseVal.unitType === 1) {
        width = svg.width.baseVal.value;
      }
      if (!height && svg.height && svg.height.baseVal && svg.height.baseVal.unitType === 1) {
        height = svg.height.baseVal.value;
      }

      // 3. getBoundingClientRect
      if (!width || !height) {
        const rect = svg.getBoundingClientRect();
        if (!width) width = rect.width;
        if (!height) height = rect.height;
      }

      // 4. デフォルト値
      if (!width) width = 500;
      if (!height) height = 300;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      const img = new window.Image();
      img.width = width;
      img.height = height;

      const promise = new Promise<void>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const pngDataUrl = canvas.toDataURL('image/png');
            const imgElem = document.createElement('img');
            imgElem.src = pngDataUrl;
            imgElem.width = width;
            imgElem.height = height;
            svg.parentNode?.replaceChild(imgElem, svg);
          }
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
      promises.push(promise);
    });

    await Promise.all(promises);

    const plainText = tempDiv.innerText || tempDiv.textContent || '';
    const htmlContent = tempDiv.innerHTML;

    if (navigator.clipboard && navigator.clipboard.write) {
      const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
      });

      navigator.clipboard
        .write([clipboardItem])
        .then(() => toast.success(getMessage('I_F_00050', '作成結果')))
        .catch(() => {
          navigator.clipboard
            .writeText(plainText)
            .then(() => toast.success(getMessage('I_F_00050', '作成結果')))
            .catch(() => toast.error('コピーに失敗しました'));
        });
    } else {
      navigator.clipboard
        .writeText(plainText)
        .then(() => toast.success(getMessage('I_F_00050', '作成結果')))
        .catch(() => toast.error('コピーに失敗しました'));
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
    dispatch(setResult(preEditContent));
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
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `新製品企画書_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className="h-full">
      <div className="mb-2 flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="newproductProposal"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="newproductProposal"
              messageId={id}
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
                  <p>新製品企画書をダウンロード</p>
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
                type="button"
                variant="icon"
                size="icon"
                onClick={copyResult}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!isEditing ? (
          <Card className="h-full max-h-[80vh] overflow-auto">
            <div ref={resultRef} className="min-h-[120px] bg-white p-4">
              {parseAnswer(result).map((block, idx) =>
                block.type === 'mermaid' ? (
                  <MermaidChart key={idx} chart={block.content} id={`mermaidChart-${idx}`} />
                ) : (
                  <Markdown key={idx}>{block.content}</Markdown>
                )
              )}
            </div>
          </Card>
        ) : (
          <Textarea
            onChange={(e) => {
              setPreEditContent(e.target.value);
            }}
            value={preEditContent}
            placeholder="ここに生成された企画書が表示されます"
            readOnly={!isEditing}
            className="h-full max-h-[600px] overflow-auto"
          />
        )}
      </div>
    </div>
  );
}
