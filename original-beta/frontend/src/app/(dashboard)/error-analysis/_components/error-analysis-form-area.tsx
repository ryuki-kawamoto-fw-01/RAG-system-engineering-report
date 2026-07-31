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
import { setResult, setId } from '../../../_store/slice/error-analysis';
import { createErrorAnalysis } from '../_actions/createErrorAnalysis';
import { CreateErrorAnalysisSchema, createErrorAnalysisSchema } from '../_utils/schema';
import ErrorAnalysisConsiderationForm from './error-analysis-consideration-form';
import ErrorAnalysisFormButton from './error-analysis-form-button';
import ErrorAnalysisLanguageForm from './error-analysis-language-form';
import ErrorAnalysisMessageForm from './error-analysis-message-form';

type Props = {
  switchLayout: (newLayout: LayoutType) => void;
  className?: string;
};

export default function ErrorAnalysisFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.errorAnalysis);
  const dispatch = useAppDispatch();
  const form = useFormRedux<CreateErrorAnalysisSchema>({
    resolver: zodResolver(createErrorAnalysisSchema),
    values: defaultValues,
  });

  const handleCreateErrorAnalysis = async (e: CreateErrorAnalysisSchema) => {
    try {
      const id = uniqueId();
      const response = await createErrorAnalysis(
        id,
        e.programmingLanguage,
        e.errorMessage,
        e.considerations || ''
      );
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(
          setResult({
            result: {
              explanation: response.explanation,
              solutionAndExample: response.solutionAndExample,
            },
            feedbackAt: undefined,
          })
        );
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
        onSubmit={form.handleSubmit(handleCreateErrorAnalysis)}
        className={cn('relative flex flex-col h-full overflow-hidden', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <ErrorAnalysisLanguageForm />
          <ErrorAnalysisMessageForm />
          <ErrorAnalysisConsiderationForm />
        </div>
        <ErrorAnalysisFormButton />
      </form>
    </Form>
  );
}
