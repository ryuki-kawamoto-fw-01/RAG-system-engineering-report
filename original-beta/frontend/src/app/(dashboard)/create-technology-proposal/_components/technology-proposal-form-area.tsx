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
import { setResult, setId } from '../../../_store/slice/create-technology-proposal';
import { createTechnologyProposal } from '../_actions/createTechnologyProposal';
import { CreateTechnologyProposalSchema, createTechnologyProposalSchema } from '../_utils/schema';
import CreateTechnologyProposalButton from './create-technology-proposal-button';
import TechnologyProposalConsiderationForm from './technology-proposal-consideration-form';
import TechnologyProposalCurrentIssuesForm from './technology-proposal-currentissues-form';
import TechnologyProposalMarketForm from './technology-proposal-market-form';
import TechnologyProposalTechnologyNameForm from './technology-proposal-technologyName-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TechnologyProposalFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, modify, ...defaultValues } = useAppSelector(
    (state) => state.createTechnologyProposal
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<CreateTechnologyProposalSchema>({
    resolver: zodResolver(createTechnologyProposalSchema),
    values: defaultValues,
  });

  const handleCreateTechnologyProposal = async (e: CreateTechnologyProposalSchema) => {
    try {
      const id = uniqueId();
      const response = await createTechnologyProposal(
        id,
        e.technologyName,
        e.market,
        e.current_issues,
        e.consideration
      );

      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer!, feedbackAt: undefined }));
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
        onSubmit={form.handleSubmit(handleCreateTechnologyProposal)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 新技術入力フォーム */}
          <TechnologyProposalTechnologyNameForm />
          {/* 市場入力フォーム */}
          <TechnologyProposalMarketForm />
          {/* 現状と課題入力フォーム */}
          <TechnologyProposalCurrentIssuesForm />
          {/* 新技術導入提案書の考慮事項入力フォーム */}
          <TechnologyProposalConsiderationForm />
          {/* 新技術導入提案書作成ボタン */}
          <CreateTechnologyProposalButton />
        </div>
      </form>
    </Form>
  );
}
