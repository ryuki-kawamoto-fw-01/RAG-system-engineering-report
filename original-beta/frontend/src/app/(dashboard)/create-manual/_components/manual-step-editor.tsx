'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import SvgClose from '@/app/_components/icon/button/Close';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { Spinner } from '@/app/_components/ui/spinner';
import { Textarea } from '@/app/_components/ui/textarea';
import { useAppSelector } from '@/app/_store/hooks';
import { ManualStep } from '@/app/_store/slice/manual';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  step: ManualStep;
  frameUrls: string[];
  onUpdateDescription: (description: string) => void;
  onUpdateFrameIdx: (frameIdx: number) => void;
  onDeleteStep: () => void;
  shouldFocus?: boolean;
  onFocused?: () => void;
  className?: string;
  showDeleteButton?: boolean;
};

export default function ManualStepEditor({
  step,
  frameUrls,
  onUpdateDescription,
  onUpdateFrameIdx,
  onDeleteStep,
  shouldFocus = false,
  onFocused,
  className,
  showDeleteButton = true,
}: Props): JSX.Element {
  // ReduxからもframeUrlsを取得して、propsが空の場合の代替とする
  const reduxFrameUrls = useAppSelector((state) => state.manual.frameUrls);

  // propsのframeUrlsが空の場合、ReduxからframeUrlsを取得
  const effectiveFrameUrls = frameUrls && frameUrls.length > 0 ? frameUrls : reduxFrameUrls;

  const methods = useForm({
    defaultValues: {
      description: step.description,
    },
    mode: 'onChange',
  });

  // step.descriptionが変更された時にフォームをリセット
  useEffect(() => {
    methods.reset({
      description: step.description,
    });
  }, [step.description, methods]);
  const [isMainImageLoading, setIsMainImageLoading] = useState(true);
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<number, boolean>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // frameUrlsとstepの安全性チェック
  const safeFrameUrls = effectiveFrameUrls || [];
  const safeStep = step || { id: 0, frameIdx: 0, description: '' };
  const isValidFrameIdx = safeStep.frameIdx >= 0 && safeStep.frameIdx < safeFrameUrls.length;

  // フォーカス処理
  useEffect(() => {
    if (shouldFocus && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      containerRef.current.focus();
      onFocused?.();
    }
  }, [shouldFocus, onFocused]);

  // メイン画像が変更されたらローディング状態をリセット
  useEffect(() => {
    setIsMainImageLoading(true);
  }, [step.frameIdx, effectiveFrameUrls]);

  // サムネイル画像のローディング状態を初期化
  useEffect(() => {
    if (safeFrameUrls.length > 0) {
      const initialLoadingState: Record<number, boolean> = {};
      safeFrameUrls.forEach((_, index) => {
        initialLoadingState[index] = true;
      });
      setLoadingThumbnails(initialLoadingState);
    }
  }, [safeFrameUrls.length]);

  const handleDescriptionBlur = () => {
    const currentValue = methods.getValues('description');
    if (currentValue !== safeStep.description) {
      onUpdateDescription(currentValue);
    }
  };

  const handleFrameSelect = (idx: number) => {
    if (idx >= 0 && idx < safeFrameUrls.length) {
      // 画像切り替え時に即座にローディング状態に
      setIsMainImageLoading(true);
      onUpdateFrameIdx(idx);
    }
  };

  return (
    <FormProvider {...methods}>
      <div
        ref={containerRef}
        id={`step-editor-${step.id}`}
        className={cn(
          'relative flex gap-4 rounded-[20px] px-8 py-16 border border-gray-200 bg-white',
          className
        )}
        tabIndex={-1}
      >
        {/* 削除ボタン */}
        {showDeleteButton && (
          <Button
            type="button"
            variant="icon"
            size="icon"
            onClick={onDeleteStep}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="ステップを削除"
          >
            <SvgClose className="size-5" />
          </Button>
        )}
        {/* 左側: 画像 */}
        <div id={`image-area-${safeStep.id}`} className="w-1/2">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-300">
            {isValidFrameIdx ? (
              <>
                {isMainImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Spinner size="large" className="text-gray-400" />
                  </div>
                )}
                <Image
                  key={`main-${safeStep.id}-${safeStep.frameIdx}-${safeFrameUrls[safeStep.frameIdx]}`}
                  src={`/api/manual?url=${encodeURIComponent(safeFrameUrls[safeStep.frameIdx])}`}
                  alt={`手順${safeStep.id}の画像`}
                  fill
                  className="object-contain"
                  unoptimized
                  onLoad={() => setIsMainImageLoading(false)}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500">
                <div className="text-center">
                  <div className="text-sm">画像が見つかりません</div>
                  <div className="mt-1 text-xs">
                    frameIdx: {safeStep.frameIdx}, total: {safeFrameUrls.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側: 説明 + 代替画像 */}
        <div className="w-1/2 flex-1 space-y-4">
          {/* 説明 */}
          <div id={`description-area-${safeStep.id}`}>
            <Label htmlFor={`description-${safeStep.id}`} className="mb-2 block">
              説明テキスト編集
            </Label>
            <Textarea
              id={`description-${safeStep.id}`}
              {...methods.register('description')}
              onBlur={handleDescriptionBlur}
              className="min-h-[100px] resize-none"
              maxLength={20000}
              showCounter={true}
            />
          </div>

          {/* 代替画像（frameUrlsから選択） */}
          <div>
            <Label className="mb-2 block">他の画像に差し替え</Label>
            <div
              className="flex h-48 max-w-full gap-2 overflow-x-auto whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 p-3"
              ref={scrollAreaRef}
            >
              {safeFrameUrls.length > 0 ? (
                safeFrameUrls.map((imageUrl, index) => {
                  const isSelected = isValidFrameIdx && safeStep.frameIdx === index;
                  const isLoading = loadingThumbnails[index] !== false;
                  return (
                    <div
                      key={index}
                      className={`relative h-full shrink-0 cursor-pointer rounded border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => handleFrameSelect(index)}
                    >
                      {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-gray-100">
                          <Spinner size="small" className="text-gray-400" />
                        </div>
                      )}
                      <Image
                        key={`thumb-${safeStep.id}-${index}-${imageUrl}`}
                        src={`/api/manual?url=${encodeURIComponent(imageUrl)}`}
                        alt={`代替画像${index + 1}`}
                        width={200}
                        height={160}
                        className="size-full rounded object-cover"
                        tabIndex={isSelected ? 0 : -1}
                        unoptimized
                        onLoad={() => {
                          setLoadingThumbnails((prev) => ({ ...prev, [index]: false }));
                        }}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex h-48 w-full flex-col items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-500">
                  <div className="text-sm">代替画像がありません</div>
                  <div className="mt-1 text-xs text-gray-400">フレーム画像を読み込み中です</div>
                </div>
              )}
            </div>
          </div>
          <div className="text-2xs">左右にスクロールして、画像を選択してください。</div>
        </div>
      </div>
    </FormProvider>
  );
}
