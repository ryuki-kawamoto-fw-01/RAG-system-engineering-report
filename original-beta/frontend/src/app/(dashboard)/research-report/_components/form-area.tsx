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
import { setResult, setId } from '../../../_store/slice/research-report';
import { researchReport } from '../_actions/researchReport';
import { ResearchReportSchema, researchReportSchema } from '../_utils/schema';
import ConsiderationForm from './consideration-form';
import MethodForm from './method-form';
import PurposeForm from './purpose-form';
import Reference from './reference-form';
import ResearchReportButton from './research-report-button';
import Result from './research-result-form';
import SubjectForm from './subject-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function FormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newRequest, ...defaultValues } = useAppSelector((state) => state.researchReport);
  const dispatch = useAppDispatch();
  const form = useFormRedux<ResearchReportSchema>({
    resolver: zodResolver(researchReportSchema),
    values: defaultValues,
  });

  const handleCreateIdea = async (e: ResearchReportSchema) => {
    try {
      const id = uniqueId();
      const response = await researchReport(
        id,
        e.subject,
        e.purpose,
        e.method,
        e.researchresult,
        e.references,
        e.consideration
      );
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult(response.answer!));
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
          <SubjectForm />
          {/* 研究目的入力フォーム */}
          <PurposeForm />
          {/* 研究方法入力フォーム */}
          <MethodForm />
          {/* 研究結果入力フォーム */}
          <Result />
          {/* 参考文献入力フォーム */}
          <Reference />
          {/* アイデアの考慮事項入力フォーム */}
          <ConsiderationForm />
          {/* アイデア作成ボタン */}
          <ResearchReportButton />
        </div>
      </form>
    </Form>
  );
}
