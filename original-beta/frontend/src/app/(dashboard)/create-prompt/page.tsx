'use client';

import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setReset, setId, setRevisionPrompt } from '@/app/_store/slice/create-prompt';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createPrompt } from './_actions/createPrompt';
import { fixPrompt } from './_actions/fixPrompt';
import CreatePromptForm from './_components/create-prompt-form';
import { PromptResult } from './_components/prompt-result';
import CreatePromptTitle from './_components/title';
import { CreatePromptSchema, FixPromptSchema } from './_utils/schema';

export default function CreatePromptPage() {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.createPrompt);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleCreatePrompt = async (e: CreatePromptSchema) => {
    try {
      const id = uniqueId();
      const requestData = { originalPrompt: e.originalPrompt };

      const result = await createPrompt(id, requestData);
      if (result.error) {
        toast.error(<ReactMarkdown>{result.error}</ReactMarkdown>);
      } else {
        dispatch(setResult({ result: result.content, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  const handleFixPrompt = async (e: FixPromptSchema) => {
    try {
      const requestData = {
        enhancedPrompt: e.result,
        revisionPrompt: e.revisionPrompt,
      };

      const result = await fixPrompt(id, requestData);
      if (result.error) {
        toast.error(<ReactMarkdown>{result.error}</ReactMarkdown>);
      } else {
        dispatch(setResult({ result: result.content, feedbackAt }));
        dispatch(setRevisionPrompt(e.revisionPrompt));
        toast.success(getMessage('I_F_00040', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果');
      toast.error(<ReactMarkdown>{errorMessage}</ReactMarkdown>);
    }
  };

  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };
  return (
    <PageLayout className="flex flex-col">
      <CreatePromptTitle handleReset={handleReset} />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <CreatePromptForm
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
            onSubmit={handleCreatePrompt}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <PromptResult
            className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')}
            onSubmit={handleFixPrompt}
          />
        )}
      </div>
    </PageLayout>
  );
}
