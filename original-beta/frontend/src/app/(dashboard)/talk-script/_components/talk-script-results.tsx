// トークスクリプト作成結果エリア

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectTalkScript } from '@/app/_store/selectors/talk-script';
import { setResult } from '@/app/_store/slice/talk-script';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { fixTalkScript } from '../_actions/talkScript';
import { modifiedTalkScriptSchema, ModifiedTalkScriptSchema } from '../_utils/schema';
import TalkScriptModifyArea from './talk-script-modify-area';
import TalkScriptResultArea from './talk-script-result-area';

type Props = {
  className?: string;
};

export default function TalkScriptResults({ className }: Props) {
  const dispatch = useAppDispatch();
  const { modify, result, id, feedbackAt } = useAppSelector(selectTalkScript);
  const form = useFormRedux<ModifiedTalkScriptSchema>({
    resolver: zodResolver(modifiedTalkScriptSchema),
    values: {
      modify,
      result,
    } as ModifiedTalkScriptSchema,
  });

  // トークスクリプト修正時の処理
  const handleModifyTalkScript = async (e: ModifiedTalkScriptSchema) => {
    const formData = new FormData();
    formData.append('result', e.result);
    formData.append('modify', e.modify);

    const response = await fixTalkScript(formData, id);

    if (response.success) {
      const result = response.content;
      dispatch(setResult({ result, feedbackAt }));
      toast.success(getMessage('I_F_00040', '作成結果'));
    } else {
      toast.error(response.message);
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleModifyTalkScript)}
        className={cn('h-full relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            {/* トークスクリプト作成結果エリア */}
            <TalkScriptResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
            {/* トークスクリプト修正エリア */}
            <TalkScriptModifyArea className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
