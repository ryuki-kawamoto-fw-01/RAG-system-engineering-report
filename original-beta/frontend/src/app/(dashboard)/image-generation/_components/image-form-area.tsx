'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult, setId } from '../../../_store/slice/image-generation';
import { imageGeneration } from '../_actions/imageGeneration';
import { ImageGenerationSchema, imageGenerationSchema } from '../_utils/schema';
import ImageContentForm from './image-content-form';
import ImageFormatForm from './image-format-form';
import ImageGenerationButton from './image-generation-button';
import ImageSizeForm from './image-size-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function ImageFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { resultUrl, resultBase64, fixImageRequest, ...defaultValues } = useAppSelector(
    (state) => state.imageGeneration
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<ImageGenerationSchema>({
    resolver: zodResolver(imageGenerationSchema),
    values: defaultValues,
  });

  const handleImageGeneration = async (e: ImageGenerationSchema) => {
    try {
      const id = uniqueId();
      const response = await imageGeneration(id, e.content, e.size, e.format);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(
          setResult({
            resultUrl: response.answerUrl,
            resultBase64: response.answerBase64,
            blobName: response.blobName,
            feedbackAt: undefined,
          })
        );
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);

        return response;
      }
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleImageGeneration)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 画像内容入力フォーム */}
          <ImageContentForm />
          {/* 画像サイズ入力フォーム */}
          <ImageSizeForm />
          {/* 画像形式入力フォーム */}
          <ImageFormatForm />
          {/* アイデア作成ボタン */}
          <ImageGenerationButton />
        </div>
      </form>
    </Form>
  );
}
