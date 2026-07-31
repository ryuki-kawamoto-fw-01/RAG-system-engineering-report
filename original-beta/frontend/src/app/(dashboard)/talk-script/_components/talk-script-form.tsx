// トークスクリプト設定エリア

import { zodResolver } from '@hookform/resolvers/zod';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectTalkScript } from '@/app/_store/selectors/talk-script';
import { setResult, setId } from '@/app/_store/slice/talk-script';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createTalkScript } from '../_actions/talkScript';
import { talkScriptSchema, TalkScriptSchema } from '../_utils/schema';
import CreateTalkScriptButton from './create-talk-script-button';
import ProposalCharacteristicsArea from './proposal-characteristics-area';
import ProposalConsiderationsArea from './proposal-considerations-area';
import ProposalPurposeArea from './proposal-purpose-area';
import ProposalSelectionArea from './proposal-selection-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TalkScriptForm({ switchLayout, className }: Props) {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, modify, ...defaultValues } = useAppSelector(selectTalkScript);
  const form = useFormRedux<TalkScriptSchema>({
    resolver: zodResolver(talkScriptSchema),
    values: defaultValues,
  });

  // 「トークスクリプトを作成」ボタンを押下時の処理
  const handleCreateTalkScript = async (e: TalkScriptSchema) => {
    try {
      const id = uniqueId();
      const response = await createTalkScript(id, e);

      if (response.success) {
        const result = response.content;
        dispatch(setResult({ result, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error creating talk script:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col h-full relative', className)}
        onSubmit={form.handleSubmit(handleCreateTalkScript)}
      >
        <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
          {/* 提案書選択エリア */}
          <ProposalSelectionArea />
          {/* 提案書目的エリア */}
          <ProposalPurposeArea />
          {/* 提案書特徴エリア */}
          <ProposalCharacteristicsArea />
          {/* 提案書考慮事項エリア */}
          <ProposalConsiderationsArea />
        </div>

        {/* トークスクリプト作成ボタン */}
        <CreateTalkScriptButton />
      </form>
    </Form>
  );
}
