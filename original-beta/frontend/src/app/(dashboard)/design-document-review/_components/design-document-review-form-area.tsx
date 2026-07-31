import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setId, setResult } from '@/app/_store/slice/design-document-review';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { designDocumentReview } from '../_actions/designDocumentReview';
import { designDocumentReviewSchema, DesignDocumentReviewSchema } from '../_utils/schema';
import ActionButtons from './action-button';
import ConsiderationForm from './consideration-form';
import DesignDocumentUploadForm from './design-document-upload-form';
import PriorityReviewPointForm from './priority-review-point-form';
import ReviewPurposeForm from './review-purpose-form';

type Props = {
  className?: string;
  switchLayout: (layout: LayoutType) => void;
};

export default function DesignDocumentReviewFormArea({ className, switchLayout }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.designDocumentReview);
  const dispatch = useAppDispatch();
  const form = useFormRedux<DesignDocumentReviewSchema>({
    resolver: zodResolver(designDocumentReviewSchema),
    values: defaultValues,
  });
  // 直前のidやresultを記憶
  function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return ref.current;
  }

  const prevId = usePrevious(defaultValues.id);

  useEffect(() => {
    // idが変わった（リセットされた）ときだけreset
    if (prevId && prevId !== defaultValues.id) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.id]);

  const handleDesignDocumentReview = async (e: DesignDocumentReviewSchema) => {
    try {
      const formData = new FormData();
      formData.append('fileList', JSON.stringify(e.fileList));
      formData.append('reviewPurpose', e.reviewPurpose ?? '');
      formData.append('priorityPoint', e.priorityPoint ?? '');
      formData.append('consideration', e.consideration ?? '');
      const id = uniqueId();
      const response = await designDocumentReview(id, formData);

      if (response.success) {
        const designDocumentReview = response.content;
        dispatch(setResult({ result: designDocumentReview, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', 'フィードバック結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error design-document review:', error);
      toast.error(getMessage('E_F_00110', 'フィードバック結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleDesignDocumentReview)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 設計書アップロードフォーム */}
          <DesignDocumentUploadForm />
          {/* レビュー目的入力フォーム */}
          <ReviewPurposeForm />
          {/* 特に見てほしい箇所入力フォーム */}
          <PriorityReviewPointForm />
          {/* 考慮事項入力フォーム */}
          <ConsiderationForm />
          {/* アイデア作成ボタン */}
          <ActionButtons />
        </div>
      </form>
    </Form>
  );
}
