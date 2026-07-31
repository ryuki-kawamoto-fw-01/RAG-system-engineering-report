import { useEffect } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/app/_components/icon/decorative';
import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select,
} from '@/app/_components/ui/select';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { useAppSelector, useAppDispatch } from '@/app/_store/hooks';
import { setManual, ManualStep } from '@/app/_store/slice/manual';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';
import { ALLOWED_FILE_TYPES, DOWNLOAD_OPTIONS, MAX_FILE_SIZE } from '../_utils/_const';
import { CreateManualSchema } from '../_utils/schema';
import FileDropArea from './file-drop-area-upload-blob';

type Props = {
  className?: string;
  setIsSubmitting: (isSubmitting: boolean) => void;
  steps: ManualStep[];
  frameUrls: string[];
  isSaving: boolean;
  isDownloading: boolean;
  setIsDownloading: (downloading: boolean) => void;
  // switchLayout: (layout: LayoutType) => void;
};

export default function CreateManualForm({
  className,
  setIsSubmitting,
  steps,
  frameUrls,
  isSaving,
  isDownloading,
  setIsDownloading,
  // switchLayout,
}: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const manualState = useAppSelector((state) => state.manual);
  const {
    control,
    formState: { isValid, isSubmitting },
    getValues,
    watch,
  } = useFormReduxContext<CreateManualSchema>({
    setRedux: setManual,
  });

  const extValue = watch('ext');

  useEffect(() => {
    setIsSubmitting(isSubmitting);
  }, [isSubmitting, setIsSubmitting]);

  // 編集開始
  const handleEdit = () => {
    const editData = {
      ...manualState,
      steps,
      frameUrls,
      isEditing: true,
    };
    dispatch(setManual(editData));
  };

  // ダウンロード
  const handleDownload = async (selectedExt?: string) => {
    if (isDownloading || isSaving) return; // ダウンロード中または保存中は重複実行を防止

    try {
      setIsDownloading(true);

      if (!manualState.result) {
        toast.error('ダウンロード可能なファイルがありません');
        return;
      }

      const { wordFileURL, markdownFileURL, excelFileURL } = manualState.result;

      // 選択された形式または元の形式に基づいてURLを決定
      const extToUse = selectedExt || manualState.ext || '.xlsx'; // デフォルトはExcel
      let url: string | undefined;
      let fileExtension: string;

      switch (extToUse) {
        case '.docx':
          url = wordFileURL;
          fileExtension = 'docx';
          break;
        case '.md':
          url = markdownFileURL;
          fileExtension = 'md';
          break;
        case '.xlsx':
        default:
          url = excelFileURL;
          fileExtension = 'xlsx';
          break;
      }

      if (!url) {
        toast.error(`選択された形式（${extToUse}）のファイルが利用できません`);
        return;
      }

      // ファイル名を適切に設定
      const fileName = url.split('/').pop()?.split('?')[0] || `manual.${fileExtension}`;
      await downloadExcelFile(url, fileName);
    } catch {
      toast.error('ダウンロードに失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  // ダウンロード用のヘルパー関数
  const downloadExcelFile = async (extFileUrl: string, fileName: string) => {
    try {
      const apiUrl = `/api/manual?url=${encodeURIComponent(extFileUrl)}`;
      const fileResponse = await fetch(apiUrl);
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success(getMessage('I_F_00130', 'ファイル'));
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(getMessage('E_F_00360', 'ファイル'));
    }
  };

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
        <FormItem>
          <RequiredLabel>動画ファイル</RequiredLabel>
          <FileDropArea
            name="file"
            accept={ALLOWED_FILE_TYPES}
            maxSize={MAX_FILE_SIZE}
            setRedux={setManual}
          />
        </FormItem>
        {/**
          <FormField
            control={control}
            name="similarityThreshold"
            render={({ field }) => (
              <FormItem>
                <OptionalLabel>
                  <span>手順イメージの枚数</span>
                </OptionalLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                  }}
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SIMILARITY_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={String(value)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        */}
        <FormField
          control={control}
          name="ext"
          render={({ field }) => {
            const displayValue =
              DOWNLOAD_OPTIONS.find((opt) => opt.value === (field.value || extValue || '.xlsx'))
                ?.label || 'Excel';
            return (
              <FormItem>
                <OptionalLabel>
                  <span>出力ファイル形式</span>
                </OptionalLabel>
                <Select
                  value={field.value || '.xlsx'}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue>{displayValue}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DOWNLOAD_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      {/* 3つのボタンを横並びで配置 */}
      <div className="flex justify-center gap-4">
        <Button
          type="submit"
          variant="secondary"
          disabled={!isValid || isSubmitting}
          className="w-full max-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              <span>作成中です</span>
            </>
          ) : (
            <span>作成する</span>
          )}
        </Button>

        <Button
          type="button"
          onClick={() => handleDownload(getValues('ext'))}
          disabled={isDownloading || !manualState.result}
          variant="secondary"
          className="w-full max-w-[180px]"
        >
          {isDownloading ? 'ダウンロード中...' : 'ダウンロード'}
        </Button>

        <Button
          type="button"
          onClick={handleEdit}
          disabled={!manualState.result || !steps || steps.length === 0}
          variant="secondary"
          className="w-full max-w-[180px]"
        >
          マニュアル編集
        </Button>
      </div>
    </div>
  );
}
