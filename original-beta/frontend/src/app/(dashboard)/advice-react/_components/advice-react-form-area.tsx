import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setId, setResult } from '@/app/_store/slice/advice-react';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createAdviceReact } from '../_actions/adviceReact';
import { adviceReactSchema, AdviceReactSchema } from '../_utils/schema';
import AdviceInputForm from './advice-form';
import AdviceReactSubmitButton from './submit-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};
export default function AdviceReactFormArea({ switchLayout, className }: Props) {
  const { ...defaultValues } = useAppSelector((state) => state.adviceReact);
  const dispatch = useAppDispatch();
  const form = useFormRedux<AdviceReactSchema>({
    resolver: zodResolver(adviceReactSchema),
    values: defaultValues,
  });
  const onSubmit = async (e: AdviceReactSchema) => {
    try {
      const id = uniqueId();
      const response = await createAdviceReact(id, e.adviceInput);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.result, feedbackAt: undefined }));
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
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* アドバイスをもらいたいこと */}
          <AdviceInputForm />
          <AdviceReactSubmitButton />
        </div>
      </form>
    </Form>
  );
}
