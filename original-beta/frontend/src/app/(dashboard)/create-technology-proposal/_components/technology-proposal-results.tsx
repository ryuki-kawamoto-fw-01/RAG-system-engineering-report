import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/create-technology-proposal';
import { fixTechnologyProposal } from '../_actions/fixTechnologyProposal';
import { FixTechnologyProposalSchema, fixTechnologyProposalSchema } from '../_utils/schema';
import FixTechnologyProposalRequestForm from './fix-technology-proposal-request-form';
import TechnologyProposalResultArea from './technology-proposal-result-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TechnologyProposalResults({ switchLayout, className }: Props) {
  const { modify, result, id, feedbackAt } = useAppSelector(
    (state) => state.createTechnologyProposal
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<FixTechnologyProposalSchema>({
    resolver: zodResolver(fixTechnologyProposalSchema),
    values: {
      modify,
      result,
    } as FixTechnologyProposalSchema,
  });

  const handleFixTechnologyProposal = async (e: FixTechnologyProposalSchema) => {
    try {
      const response = await fixTechnologyProposal(e.result, e.modify!, id);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        // 再作成時は既存のフィードバック状態を維持する
        dispatch(setResult({ result: response.answer, feedbackAt }));
        toast.success(getMessage('I_F_00040', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
      return response;
    } catch {
      toast.error('新技術導入提案書の作成に失敗しました');
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFixTechnologyProposal)}
        className={cn('flex h-full flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            {/* 新技術導入提案書作成結果エリア */}
            <TechnologyProposalResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
            {/* 追加で生成AIに依頼するエリア */}
            <FixTechnologyProposalRequestForm className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
