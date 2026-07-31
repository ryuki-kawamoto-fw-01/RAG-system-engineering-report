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
import { setResult, setId } from '../../../_store/slice/create-idea';
import { createIdea } from '../_actions/createIdea';
import { CreateIdeaSchema, createIdeaSchema } from '../_utils/schema';
import CreateIdeaButton from './create-idea-button';
import IdeationConsiderationForm from './ideation-consideration-form';
import IdeationCountForm from './ideation-count-form';
import IdeationRoleForm from './ideation-role-form';
import IdeationSubjectForm from './ideation-subject-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function IdeationFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newIdeaRequest, ...defaultValues } = useAppSelector((state) => state.createIdea);
  const dispatch = useAppDispatch();
  const form = useFormRedux<CreateIdeaSchema>({
    resolver: zodResolver(createIdeaSchema),
    values: defaultValues,
  });

  const handleCreateIdea = async (e: CreateIdeaSchema) => {
    try {
      const id = uniqueId();
      const response = await createIdea(id, e.subject, e.role, e.count, e.consideration);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
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
        onSubmit={form.handleSubmit(handleCreateIdea)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 主題入力フォーム */}
          <IdeationSubjectForm />
          {/* 生成AIの立場入力フォーム */}
          <IdeationRoleForm />
          {/* アイデアの件数入力フォーム */}
          <IdeationCountForm />
          {/* アイデアの考慮事項入力フォーム */}
          <IdeationConsiderationForm />
          {/* アイデア作成ボタン */}
          <CreateIdeaButton />
        </div>
      </form>
    </Form>
  );
}
