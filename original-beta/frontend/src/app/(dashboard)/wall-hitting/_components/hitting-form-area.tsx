'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult, setId, setWallHitting } from '../../../_store/slice/wall-hitting';
import { wallHitting } from '../_actions/wallHitting';
import { WallHittingSchema, wallHittingSchema } from '../_utils/schema';
import IdeaForm from './idea-form';
import ThemeForm from './theme-form';
import WallHittingButton from './wall-hitting-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
  onStartChat?: (theme: string, idea: string) => void; // 追加
};

export default function HittingFormArea({ switchLayout, className, onStartChat }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.wallHitting);
  const dispatch = useAppDispatch();
  const form = useFormRedux<WallHittingSchema>({
    resolver: zodResolver(wallHittingSchema),
    values: defaultValues,
  });

  const handleWallHitting = async (e: WallHittingSchema) => {
    try {
      const id = uniqueId();
      const response = await wallHitting(id, e.theme, e.idea);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));
        // theme と idea もストアに保存
        dispatch(setWallHitting({ id, theme: e.theme, idea: e.idea, feedbackAt: undefined }));
        // onStartChatがあればそちらを優先
        if (onStartChat) {
          onStartChat(e.theme, e.idea);
        } else {
          switchLayout('right-only');
        }
        return response;
      }
    } catch {
      toast.error(getMessage('E_F_00110', 'チャット'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleWallHitting)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <ThemeForm />
          <IdeaForm />
          <WallHittingButton />
        </div>
      </form>
    </Form>
  );
}
