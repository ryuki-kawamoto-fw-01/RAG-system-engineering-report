'use client';
import './styles.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { toast } from 'sonner';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgSave from '@/app/_components/icon/button/Save';
import { Button } from '@/app/_components/ui/button';
import { Form } from '@/app/_components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import TextLink from '@/app/_components/ui/text-link';
import { MessageKey } from '@/app/_constants/messages';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setManual, ManualStep } from '@/app/_store/slice/manual';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import { createManual } from './_actions/createManual';
import { pollStatus } from './_actions/pollStatus';
import { saveManual } from './_actions/saveManual';
import { Alert, AlertDescription, AlertTitle } from './_components/alert';
import CreateManualForm from './_components/contents-form';
import ManualStepEditor from './_components/manual-step-editor';
import Title from './_components/title';
import { createManualSchema, CreateManualSchema } from './_utils/schema';

export default function Layout() {
  const dispatch = useAppDispatch();
  const manualState = useAppSelector((state) => state.manual);
  const {
    steps: initialSteps = [],
    frameUrls = [],
    isEditing = false,
    ...defaultValues
  } = manualState;
  const [steps, setSteps] = useState(initialSteps);
  const [isSaving, setIsSaving] = useState(false); // 保存中状態
  const [isDownloading, setIsDownloading] = useState(false); // ダウンロード中状態
  const [focusStepId, setFocusStepId] = useState<number | null>(null); // フォーカスするステップID
  const [persistentError, setPersistentError] = useState<string | null>(null); // 永続的エラーメッセージ

  // Redux状態変更の監視
  useEffect(() => {
    // Reduxの状態が変更されたときにローカル状態を同期
    setSteps(manualState.steps || []);
  }, [manualState]);

  // steps配列の変更を監視
  useEffect(() => {}, [steps]);

  // frameUrls配列の変更を監視
  useEffect(() => {}, [frameUrls]);

  // isEditing状態の変更を監視
  useEffect(() => {}, [isEditing]);

  // ステップ説明更新
  const handleUpdateDescription = (idx: number, description: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], description };
      return next;
    });
  };
  // フレームインデックス更新
  const handleUpdateFrameIdx = (idx: number, frameIdx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], frameIdx };
      return next;
    });
  };

  // ステップ削除
  const handleDeleteStep = (idx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next.splice(idx, 1);
      // ステップIDを再割り当て
      return next.map((step, index) => ({ ...step, id: index + 1 }));
    });
  };

  // ステップ追加
  const handleAddStep = (insertIdx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      // 最初のステップのframeIdxを使用、ないときは0
      const defaultFrameIdx = next.length > 0 ? next[0].frameIdx : 0;
      // 一意なIDを生成
      const newStepId = Date.now();
      const newStep: ManualStep = {
        id: newStepId,
        frameIdx: defaultFrameIdx,
        description: '',
      };
      next.splice(insertIdx, 0, newStep);
      // ステップIDを再割り当て（表示用の連番）
      const updatedSteps = next.map((step, index) => ({ ...step, id: index + 1 }));
      // 新しいステップにフォーカスを設定
      setTimeout(() => {
        setFocusStepId(insertIdx + 1);
      }, 100);
      return updatedSteps;
    });
  };
  // 編集キャンセル
  const handleCancel = () => {
    setSteps(initialSteps);
    setPersistentError(null); // エラーをクリア
    dispatch(setManual({ ...defaultValues, steps: initialSteps, frameUrls, isEditing: false }));
  };
  // ダウンロード
  const handleDownload = async (selectedExt?: string) => {
    if (isDownloading || !manualState.result) return;

    try {
      setIsDownloading(true);
      toast.info('ダウンロードを開始します...');

      const ext = selectedExt || form.getValues('ext') || '.xlsx';
      const downloadUrl =
        ext === '.docx'
          ? manualState.result.wordFileURL
          : ext === '.md'
            ? manualState.result.markdownFileURL
            : manualState.result.excelFileURL;

      if (!downloadUrl) {
        throw new Error('ダウンロード用のファイルURLが見つかりません');
      }

      const response = await fetch(`/api/manual?url=${encodeURIComponent(downloadUrl)}`);
      if (!response.ok) {
        throw new Error('ファイルのダウンロードに失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = downloadUrl.split('/').pop()?.split('?')[0] || `manual${ext}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ダウンロードが完了しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ダウンロードに失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  // 保存
  const handleSave = async () => {
    if (isSaving) return; // 保存中は重複実行を防止

    try {
      setIsSaving(true);
      toast.info('マニュアルを保存中...');

      // バックエンドAPIでマニュアルを保存
      const saveResponse = await saveManual({
        manualId: manualState.manualId || `manual_${Date.now()}`,
        steps,
        frameUrls,
        containerName: manualState.containerName,
        folderPath: manualState.folderPath,
        blobFolderName: manualState.blobFolderName,
        llmOutputUrl: manualState.llmOutputUrl,
        wordFileURL: manualState.result?.wordFileURL,
        markdownFileURL: manualState.result?.markdownFileURL,
        excelFileURL: manualState.result?.excelFileURL,
      });

      // 保存が成功したことを確認
      if (!saveResponse.success) {
        throw new Error(saveResponse.message || 'マニュアルの保存に失敗しました');
      }

      // 更新されたファイルURLを取得（ファイルが更新された場合のみ）
      const updatedResult = {
        wordFileURL: saveResponse.updatedFiles?.wordFileURL || manualState.result?.wordFileURL,
        markdownFileURL:
          saveResponse.updatedFiles?.markdownFileURL || manualState.result?.markdownFileURL,
        excelFileURL: saveResponse.updatedFiles?.excelFileURL || manualState.result?.excelFileURL,
        // 保存タイムスタンプを追加してファイルの更新を追跡
        lastUpdated: Date.now(),
      };

      // ローカル状態も更新（更新されたファイルURLを含む）
      dispatch(
        setManual({
          ...manualState,
          ...defaultValues,
          steps,
          frameUrls,
          isEditing: true, // 編集モードは保持
          result: updatedResult,
        })
      );

      // 短い待機でファイル生成処理の完了を確実にする
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('マニュアルを保存しました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'マニュアルの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const [, setIsSubmitting] = useState(false);

  const form = useFormRedux<CreateManualSchema>({
    resolver: zodResolver(createManualSchema),
    values: {
      ...Object.fromEntries(
        Object.entries(defaultValues).filter(([key]) => {
          return Object.keys(createManualSchema.shape).includes(key);
        })
      ),
      ext: '.xlsx',
    } as CreateManualSchema,
  });

  const { handleSubmit } = form;
  const extValue = form.watch('ext');

  const handleContentsSend = async (e: CreateManualSchema) => {
    try {
      setPersistentError(null); // エラーをクリア

      // 通常モード: 実際のAPI呼び出し
      const response = await createManual(e.file[0]!, e.similarityThreshold!);
      const poll = await pollStatus(response.url);

      // バックエンドからのエラーチェック
      if (poll.output?.error || poll.output?.error_type) {
        const errorMsg = poll.output.error_type
          ? getMessage(poll.output.error_type as MessageKey)
          : getMessage('E_F_00110', 'マニュアル');
        setPersistentError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // 編集画面用データが存在する場合、状態に保存
      if (poll.output.editingData) {
        const editingData = poll.output.editingData;

        // editingDataから直接stepsデータを取得
        try {
          const stepsData = editingData.steps || [];
          const keyframesUrls = editingData.keyframesUrls || [];

          // 動画から画像を抽出できない場合のエラーチェック
          if (!keyframesUrls || keyframesUrls.length === 0) {
            const errorMsg =
              '動画から画像を抽出できませんでした。動画ファイルの形式や内容を確認してください。';
            setPersistentError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          // stepsが空の場合のエラーチェック
          if (!stepsData || stepsData.length === 0) {
            const errorMsg =
              'マニュアルの手順を生成できませんでした。動画の内容を確認してください。';
            setPersistentError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          // 状態管理に編集用データを保存
          const manualData = {
            steps: stepsData,
            frameUrls: keyframesUrls,
            totalFrames: keyframesUrls.length,
            manualId: `manual_${Date.now()}`,
            isEditing: false,
            result: {
              wordFileURL: poll.output.wordFileURL,
              markdownFileURL: poll.output.markdownFileURL,
              excelFileURL: poll.output.excelFileURL,
            },
            ...editingData,
          };

          dispatch(setManual(manualData));

          toast.success('マニュアル作成が完了しました。編集画面で内容を確認・修正できます。');
        } catch (processingError) {
          console.error(processingError);
          const errorMsg = '編集データの処理中にエラーが発生しました。';
          setPersistentError(errorMsg);
          toast.error(errorMsg);
          return;
        }
      } else {
        // editingDataが存在しない場合もエラーとして扱う
        const errorMsg =
          '動画から画像を抽出できませんでした。動画ファイルの形式や内容を確認してください。';
        setPersistentError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    } catch (error) {
      console.error(error);
      // const errorMsg = getMessage('E_F_00110', '作成結果');
      const errorMsg = 'マニュアルの作成に失敗しました。';
      setPersistentError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <PageLayout>
      <div className="overflow-auto">
        <Form {...form}>
          <form onSubmit={handleSubmit(handleContentsSend)} className="flex flex-col">
            <Title onReset={() => setPersistentError(null)} />
            {/* エラーバナー表示 */}
            {persistentError && (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="size-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription className="flex items-start justify-between">
                  <span className="flex-1">{persistentError}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 size-6 p-0"
                    onClick={() => setPersistentError(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {/* <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" /> */}
            <div className="flex flex-1 gap-x-10">
              {/* マニュアル未作成または編集モードOFFの場合、作成フォームを表示 */}
              {!isEditing && (
                <div className="flex w-full flex-col gap-4">
                  <div className="flex gap-4">
                    {/* 作成フォーム */}
                    <div className="flex-1">
                      <CreateManualForm
                        className={cn('w-full pt-[11px]')}
                        setIsSubmitting={setIsSubmitting}
                        steps={steps}
                        frameUrls={frameUrls}
                        isSaving={isSaving}
                        isDownloading={isDownloading}
                        setIsDownloading={setIsDownloading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 編集モードの場合、編集画面を表示 */}
              {isEditing && steps && steps.length > 0 && (
                <div className="flex w-full flex-col">
                  <TextLink
                    href=""
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancel();
                    }}
                    className="my-2"
                    showIcon={false}
                  >
                    <ChevronLeft className="size-4" />
                    戻る
                  </TextLink>
                  <div className="mb-4 text-sm">
                    画像を別のレコードのものへ差し替えることができます。変更後に保存してください。
                    <br />
                    ダウンロードする際は、必ず編集内容を保存してから実行してください。
                  </div>
                  <div className="mb-4 flex items-center justify-between">
                    {/* ファイル形式選択 */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">出力ファイル形式:</label>
                      <Select
                        value={extValue || form.getValues('ext') || '.xlsx'}
                        onValueChange={(value) => {
                          form.setValue('ext', value, { shouldDirty: true, shouldValidate: true });
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>
                            {extValue === '.docx'
                              ? 'Word'
                              : extValue === '.md'
                                ? 'Markdown'
                                : 'Excel'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=".xlsx">Excel</SelectItem>
                          <SelectItem value=".docx">Word</SelectItem>
                          <SelectItem value=".md">Markdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        variant="secondary"
                        className="max-w-[180px] text-sm"
                      >
                        <SvgSave className="size-4" />
                        {isSaving ? '保存中...' : '入力内容を保存'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDownload(form.getValues('ext'))}
                        disabled={
                          isDownloading ||
                          isSaving ||
                          (!manualState.result?.wordFileURL &&
                            !manualState.result?.markdownFileURL &&
                            !manualState.result?.excelFileURL)
                        }
                        variant="secondary"
                        className="max-w-[180px] text-sm"
                      >
                        <SvgDownload className="size-4" />
                        {isDownloading ? 'ダウンロード中...' : 'ダウンロード'}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex-1">
                    {steps.map((step, idx) => (
                      <div key={`step-${step.id}-${idx}`} className="relative">
                        {/* 上部の追加ボタン */}
                        <div className="mb-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleAddStep(idx)}
                            className="flex size-8 items-center justify-center rounded-full bg-primary text-white"
                            title="ステップを追加"
                          >
                            <svg
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>

                        <ManualStepEditor
                          step={step}
                          frameUrls={frameUrls}
                          onUpdateDescription={(description) =>
                            handleUpdateDescription(idx, description)
                          }
                          onUpdateFrameIdx={(frameIdx) => handleUpdateFrameIdx(idx, frameIdx)}
                          onDeleteStep={() => handleDeleteStep(idx)}
                          shouldFocus={focusStepId === step.id}
                          onFocused={() => setFocusStepId(null)}
                          className={idx === steps.length - 1 ? '' : 'mb-4'}
                          showDeleteButton={steps.length > 1}
                        />

                        {/* 最後のステップの場合は下部にも追加ボタンを表示 */}
                        {idx === steps.length - 1 && (
                          <div className="mt-2 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleAddStep(steps.length)}
                              className="flex size-8 items-center justify-center rounded-full bg-primary text-white"
                              title="ステップを追加"
                            >
                              <svg
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
}
