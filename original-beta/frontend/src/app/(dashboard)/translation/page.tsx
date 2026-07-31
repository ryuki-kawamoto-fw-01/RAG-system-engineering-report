'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import PageLayout from '../../_components/layout/page-layout';
import { Form } from '../../_components/ui/form';
import { useFormRedux } from '../../_hooks/use_form';
import { useAppDispatch, useAppSelector } from '../../_store/hooks';
import { setResult, setId } from '../../_store/slice/translation';
import TranslationTitle from './_components/translation-title';
import { TranslationForm } from './_components/TranslationForm';
import { TranslationResult } from './_components/TranslationResult';
import { translationSchema, TranslationSchema } from './_utils/schema';
import { translateText } from './actions/translate';

export default function TranslationPage() {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.translation);
  const form = useFormRedux<TranslationSchema>({
    resolver: zodResolver(translationSchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleSubmit = async (e: TranslationSchema) => {
    try {
      const id = uniqueId();
      const result = await translateText(
        id,
        e.inputText,
        e.sourceLanguage || 'auto',
        e.targetLanguage,
        e.considerations!
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        dispatch(setResult({ result: result.translatedText, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '翻訳結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(getMessage('E_F_00110', '翻訳結果'));
    }
  };

  return (
    <PageLayout>
      <TranslationTitle />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex h-full flex-col">
          <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
          <div className="flex flex-1 gap-x-10 overflow-hidden">
            {(isLeftOnly || isTwoColumns) && (
              <TranslationForm
                className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
              />
            )}
            {(isRightOnly || isTwoColumns) && (
              <TranslationResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
            )}
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
