import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Spinner } from '@/app/_components/icon/decorative';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/image-generation';
import { fixImage } from '../_actions/fixImage';
import { FixImageSchema, fixImageSchema } from '../_utils/schema';
import FixImageRequestForm from './fix-image-request-form';
import ImageResultArea from './image-result-area';

type Props = {
  className?: string;
};

export default function ImageResult({ className }: Props) {
  const { fixImageRequest, resultBase64, blobName, id, feedbackAt, size, format } = useAppSelector(
    (state) => ({
      fixImageRequest: state.imageGeneration.fixImageRequest,
      resultBase64: state.imageGeneration.resultBase64,
      blobName: state.imageGeneration.blobName,
      id: state.imageGeneration.id,
      feedbackAt: state.imageGeneration.feedbackAt,
      size: state.imageGeneration.size,
      format: state.imageGeneration.format,
    })
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<FixImageSchema>({
    resolver: zodResolver(fixImageSchema),
    values: {
      fixImageRequest,
      result: resultBase64, // 画面表示用にbase64データを保持
    } as FixImageSchema,
  });

  const {
    formState: { isValid, isSubmitting },
  } = form;

  const handleFixImage = async (e: FixImageSchema) => {
    try {
      // blobNameがない場合はエラー
      if (!blobName) {
        toast.error('画像のBlob情報が見つかりません');
        return;
      }

      const response = await fixImage(blobName, e.fixImageRequest!, id, size, format);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(
          setResult({
            resultUrl: response.answerUrl,
            resultBase64: response.answerBase64,
            blobName: response.blobName, // 新しいblobNameを保存
            feedbackAt,
          })
        );
        toast.success(getMessage('I_F_00040', '作成結果'));
      }
      return response;
    } catch {
      toast.error('画像の修正に失敗しました');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFixImage)}
        className={cn('flex h-full flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            {/* アイデア作成結果エリア */}
            <ImageResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
            {/* 追加で生成AIに依頼するエリア */}
            <FixImageRequestForm className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={!isValid || isSubmitting}
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              修正中です
            </>
          ) : (
            '修正する'
          )}
        </Button>
      </form>
    </Form>
  );
}
