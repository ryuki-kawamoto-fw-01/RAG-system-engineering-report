import { useFormContext } from 'react-hook-form';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { useAppSelector } from '@/app/_store/hooks';
import { selectFaqCreation } from '@/app/_store/selectors/faq-creation';
import { FaqcreationSchema } from '../util/schema';

export default function FaqCreateButton() {
  const {
    formState: { isSubmitting },
    watch,
  } = useFormContext<FaqcreationSchema>();

  const { faqResult } = useAppSelector(selectFaqCreation);

  // フォームの値を監視
  const formValues = watch();

  // 必須項目が入力されているか独自に確認
  const isTextValid = !!formValues.text?.trim();
  const isQuestionerPositionValid = !!formValues.questionerPosition?.trim();
  const isRespondentPositionValid = !!formValues.respondentPosition?.trim();

  // すべての必須項目が有効かどうか
  const isAllRequiredValid = isTextValid && isQuestionerPositionValid && isRespondentPositionValid;

  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={!isAllRequiredValid || isSubmitting}
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          <span>送信中</span>
        </>
      ) : faqResult ? (
        <span>再生成する</span>
      ) : (
        <span>作成する</span>
      )}
    </Button>
  );
}
