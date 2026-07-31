{
  /* メール作成結果エリア */
}
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/create-mail';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

import { fixNewMail, fixReplyMail } from '../_actions/createMail';
import { modifyMailSchema, ModifyMailSchema } from '../_utils/schema';
import { CreateContentArea } from './create-content-area';
import { CreateSubjectArea } from './create-subject-area';
import { ModifyArea } from './modify-area';

type CreateMailResultsProps = {
  activeTab: string;
  className?: string;
};

export default function CreateMailResults({ activeTab, className }: CreateMailResultsProps) {
  const dispatch = useAppDispatch();
  const { createdSubject, createdContent, modify, id, feedbackAt } = useAppSelector(
    (state) => state.createMail
  );
  const form = useFormRedux<ModifyMailSchema>({
    resolver: zodResolver(modifyMailSchema),
    values: {
      createdSubject,
      createdContent,
      modify,
    },
  });

  const handleModifyMail = async (e: ModifyMailSchema) => {
    // 新規メール修正
    if (activeTab === 'new') {
      const formData = new FormData();
      formData.append('createdSubject', e.createdSubject);
      formData.append('createdContent', e.createdContent);
      formData.append('modify', modify);

      const response = await fixNewMail(formData, id);

      // 成功時の処理
      if (response.success) {
        dispatch(
          setResult({
            createdSubject: response.subject,
            createdContent: response.content,
            feedbackAt,
          })
        );
        toast.success(getMessage('I_F_00040', '作成結果'));
      } else {
        toast.error(response.message);
      }
    } else {
      // 返信メール修正
      const formData = new FormData();
      formData.append('createdContent', e.createdContent);
      formData.append('modify', e.modify);

      const response = await fixReplyMail(formData, id);

      // 成功時の処理
      if (response.success) {
        dispatch(
          setResult({
            createdSubject: '返信メール作成時は「件名」は表示されません。',
            createdContent: response.content,
            feedbackAt,
          })
        );
        toast.success(getMessage('I_F_00040', '作成結果'));
      } else {
        toast.error(response.message);
      }
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleModifyMail)}
        className={cn('h-full relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            <div className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3">
              {/* 件名エリア */}
              <CreateSubjectArea />

              {/* 本文エリア */}
              <CreateContentArea className="h-full flex-1" />
            </div>

            {/* 修正エリア */}
            <ModifyArea className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
