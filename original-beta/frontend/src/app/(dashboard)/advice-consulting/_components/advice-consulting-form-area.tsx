import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setId, setResult } from '@/app/_store/slice/advice-consulting';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createAdviceConsulting } from '../_actions/adviceConsulting';
import { adviceConsultingSchema, AdviceConsultingSchema } from '../_utils/schema';
import AdviceInputForm from './advice-input-form';
import ConstraintsForm from './constraints-form';
import RoleForm from './role-form';
import AdviceConsultingSubmitButton from './submit-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function AdviceConsultingFormArea({ switchLayout, className }: Props) {
  const { ...defaultValues } = useAppSelector((state) => state.adviceConsulting);
  const dispatch = useAppDispatch();
  const form = useFormRedux<AdviceConsultingSchema>({
    resolver: zodResolver(adviceConsultingSchema),
    values: defaultValues,
  });

  const onSubmit = async (e: AdviceConsultingSchema) => {
    try {
      const id = uniqueId();
      const response = await createAdviceConsulting(id, e.role, e.constraints, e.adviceInput);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.result, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', 'アドバイス結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
        return response;
      }
    } catch {
      toast.error(getMessage('E_F_00110', 'アドバイス結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 役割・立場 */}
          <RoleForm />
          {/* 制約・条件 */}
          <ConstraintsForm />
          {/* 相談内容 */}
          <AdviceInputForm />
          <AdviceConsultingSubmitButton />
        </div>
      </form>
    </Form>
  );
}
